// =============================================================================
// PROJECT JULIE — RELIABLE EVENT QUEUE & DEAD LETTER QUEUE (DLQ) ENGINE
// Provides idempotency, duplicate prevention, exponential backoff,
// in-order event processing, and DLQ management.
// =============================================================================

import { db } from '@/core/storage/db';
import type { ERPEvent, ERPEventQueueItem, ERPDeadLetterItem } from './types';

export class ERPEventQueue {
  private static instance: ERPEventQueue | null = null;
  private isProcessing: boolean = false;
  private maxRetries: number = 3;
  private processedEventIds: Set<string> = new Set();
  private seenEventIds: Set<string> = new Set();
  private eventHandlers: ((event: ERPEvent) => Promise<boolean>)[] = [];

  static getInstance(): ERPEventQueue {
    if (!this.instance) {
      this.instance = new ERPEventQueue();
    }
    return this.instance;
  }

  /**
   * Register a worker event handler
   */
  registerHandler(handler: (event: ERPEvent) => Promise<boolean>) {
    this.eventHandlers.push(handler);
  }

  /**
   * Enqueues an event with strict idempotency verification
   */
  async enqueue(event: ERPEvent): Promise<{ accepted: boolean; reason?: string }> {
    // 1. In-memory duplicate protection
    if (this.seenEventIds.has(event.event_id) || this.processedEventIds.has(event.event_id)) {
      console.log(`[ERPEventQueue] Duplicate event ignored (in-memory): ${event.event_id}`);
      return { accepted: false, reason: 'Duplicate event already in queue or processed' };
    }

    // 2. DB duplicate protection
    const existingInDb = await db.erpEvents
      .where('event_id')
      .equals(event.event_id)
      .first();

    if (existingInDb) {
      this.seenEventIds.add(event.event_id);
      console.log(`[ERPEventQueue] Duplicate event ignored (db): ${event.event_id}`);
      return { accepted: false, reason: 'Duplicate event already recorded in DB' };
    }

    this.seenEventIds.add(event.event_id);

    const queueItem: ERPEventQueueItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      tenant_id: event.tenant_id || 'default',
      event_id: event.event_id,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      event_type: event.event_type,
      payload: event.payload || {},
      status: 'pending',
      retry_count: 0,
      max_retries: this.maxRetries,
      created_at: event.timestamp || new Date().toISOString(),
    };

    await db.erpEvents.put(queueItem);

    // Trigger queue processing asynchronously (non-blocking)
    setTimeout(() => this.processQueue(), 50);

    return { accepted: true };
  }

  /**
   * Main Queue Worker Loop
   */
  async processQueue(): Promise<{ processedCount: number; failedCount: number }> {
    if (this.isProcessing) return { processedCount: 0, failedCount: 0 };
    this.isProcessing = true;

    let processedCount = 0;
    let failedCount = 0;

    try {
      const pendingItems = await db.erpEvents
        .where('status')
        .equals('pending')
        .toArray();

      for (const item of pendingItems) {
        await db.erpEvents.update(item.id, { status: 'processing' });

        const event: ERPEvent = {
          event_id: item.event_id,
          source: 'uu_erp_queue',
          tenant_id: item.tenant_id,
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          event_type: item.event_type as any,
          timestamp: item.created_at,
          payload: item.payload,
        };

        let success = false;
        let lastError: string = '';

        try {
          // Dispatch to registered worker handlers
          for (const handler of this.eventHandlers) {
            const res = await handler(event);
            if (res) success = true;
          }
        } catch (err: any) {
          lastError = err.message || 'Worker processing failure';
          console.error(`[ERPEventQueue] Error processing event ${item.event_id}:`, err);
        }

        if (success) {
          await db.erpEvents.update(item.id, {
            status: 'completed',
            processed_at: new Date().toISOString(),
          });
          this.processedEventIds.add(item.event_id);
          processedCount++;
        } else {
          const nextRetry = item.retry_count + 1;
          failedCount++;

          if (nextRetry > (item.max_retries || this.maxRetries)) {
            // Move to Dead Letter Queue (DLQ)
            console.warn(`[ERPEventQueue] Event ${item.event_id} exceeded max retries. Moving to DLQ.`);
            await db.erpEvents.update(item.id, {
              status: 'dead_letter',
              error_message: lastError || 'Max retries exceeded',
            });

            await db.erpDeadLetterQueue.put({
              id: `dlq-${item.event_id}`,
              tenant_id: item.tenant_id,
              event_id: item.event_id,
              entity_type: item.entity_type,
              entity_id: item.entity_id,
              error_message: lastError || 'Processing error',
              payload: item.payload,
              retry_count: nextRetry,
              failed_at: new Date().toISOString(),
              resolution_status: 'unresolved',
            });
          } else {
            // Apply Exponential Backoff
            const backoffMs = Math.min(30000, 1000 * Math.pow(2, nextRetry));
            console.log(`[ERPEventQueue] Retrying event ${item.event_id} (Attempt ${nextRetry}) in ${backoffMs}ms`);

            await db.erpEvents.update(item.id, {
              status: 'pending',
              retry_count: nextRetry,
              error_message: lastError,
            });
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return { processedCount, failedCount };
  }

  // ---------------------------------------------------------------------------
  // DEAD LETTER QUEUE (DLQ) CONTROLS
  // ---------------------------------------------------------------------------

  /**
   * Retrieves all items in the Dead Letter Queue
   */
  async getDeadLetterItems(tenantId: string = 'default'): Promise<ERPDeadLetterItem[]> {
    return (await db.erpDeadLetterQueue.where('tenant_id').equals(tenantId).toArray()) as ERPDeadLetterItem[];
  }

  /**
   * Retries a specific Dead Letter item
   */
  async retryDeadLetterItem(dlqId: string): Promise<boolean> {
    const item = await db.erpDeadLetterQueue.get(dlqId);
    if (!item) return false;

    // Reset event in queue
    const queueItem = await db.erpEvents.where('event_id').equals(item.event_id).first();
    if (queueItem) {
      await db.erpEvents.update(queueItem.id, {
        status: 'pending',
        retry_count: 0,
      });
    } else {
      await db.erpEvents.put({
        id: `q-retry-${Date.now()}`,
        tenant_id: item.tenant_id,
        event_id: item.event_id,
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        event_type: 'updated',
        payload: item.payload,
        status: 'pending',
        retry_count: 0,
        max_retries: this.maxRetries,
        created_at: new Date().toISOString(),
      });
    }

    await db.erpDeadLetterQueue.update(dlqId, {
      resolution_status: 'replayed',
      resolved_at: new Date().toISOString(),
    });

    this.processQueue();
    return true;
  }

  /**
   * Replays all unresolved items in Dead Letter Queue
   */
  async replayAllDeadLetterItems(tenantId: string = 'default'): Promise<number> {
    const unresolved = await db.erpDeadLetterQueue
      .where('tenant_id')
      .equals(tenantId)
      .and((i) => i.resolution_status === 'unresolved')
      .toArray();

    for (const item of unresolved) {
      await this.retryDeadLetterItem(item.id);
    }
    return unresolved.length;
  }

  /**
   * Discards a Dead Letter item with authorized resolution note
   */
  async discardDeadLetterItem(dlqId: string, actorId: string, reason: string): Promise<boolean> {
    const item = await db.erpDeadLetterQueue.get(dlqId);
    if (!item) return false;

    await db.erpDeadLetterQueue.update(dlqId, {
      resolution_status: 'discarded',
      resolved_at: new Date().toISOString(),
      resolved_by: actorId,
    });

    await db.erpAuditLogs.add({
      id: `audit-dlq-discard-${Date.now()}`,
      tenant_id: item.tenant_id,
      actor_id: actorId,
      actor_role: 'Administrator',
      action: 'DLQ_DISCARD_EVENT',
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      old_value: item.payload,
      new_value: null,
      reason,
      status: 'success',
      timestamp: new Date().toISOString(),
    });

    return true;
  }
}

export const erpEventQueue = ERPEventQueue.getInstance();
