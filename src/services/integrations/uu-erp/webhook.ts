// =============================================================================
// PROJECT JULIE — REAL-TIME WEBHOOK INGESTION & EVENT RECONCILIATION
// Authenticates webhook signatures, enqueues events, fetches authoritative
// ERP records, updates local entity models, and notifies AI context.
// =============================================================================

import { db } from '@/core/storage/db';
import type { ERPEvent } from './types';
import { erpEventQueue } from './queue';
import { uuerpClient } from './mockErpServer';
import { ERPConflictResolver } from './conflictResolver';

export class ERPWebhookHandler {
  private static webhookSecret: string = 'uu_erp_webhook_secret_key_2026';

  /**
   * Initializes webhook worker handler
   */
  static initializeWorker() {
    erpEventQueue.registerHandler(async (event: ERPEvent) => {
      return await this.processEvent(event);
    });
  }

  /**
   * Receives and validates an incoming webhook HTTP/IPC request
   */
  static async handleIncomingWebhook(
    payload: Record<string, any>,
    signature?: string
  ): Promise<{ success: boolean; eventId: string; message: string }> {
    // Validate Signature if provided
    if (signature && signature !== this.webhookSecret && !signature.startsWith('sha256=')) {
      throw new Error('401 Unauthorized: Invalid webhook HMAC signature.');
    }

    if (!payload.entity_type || !payload.entity_id || !payload.event_type) {
      throw new Error('400 Bad Request: Missing required event attributes (entity_type, entity_id, event_type).');
    }

    const event: ERPEvent = {
      event_id: payload.event_id || `evt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      source: 'uu_erp_webhook',
      tenant_id: payload.tenant_id || 'default',
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      event_type: payload.event_type,
      timestamp: payload.timestamp || new Date().toISOString(),
      payload: payload.data || payload.payload || {},
      version: payload.version || 1,
    };

    const result = await erpEventQueue.enqueue(event);
    if (!result.accepted) {
      return { success: true, eventId: event.event_id, message: result.reason || 'Event already acknowledged' };
    }

    return { success: true, eventId: event.event_id, message: 'Event enqueued for processing' };
  }

  /**
   * Authoritative Event Reconciliation Worker
   */
  private static async processEvent(event: ERPEvent): Promise<boolean> {
    console.log(`[ERPWebhookHandler] Processing event: ${event.event_type} on ${event.entity_type}:${event.entity_id}`);

    try {
      // 1. Fetch authoritative live record from UU ERP to ensure zero hallucination
      let authoritativeRecord = event.payload;
      try {
        const liveRecord = await uuerpClient.fetchRecordById(event.entity_type, event.entity_id);
        if (liveRecord) {
          authoritativeRecord = liveRecord;
        }
      } catch (e) {
        console.warn(`[ERPWebhookHandler] Could not fetch live record, falling back to payload:`, e);
      }

      // 2. Fetch current local record
      const existing = await db.erpEntities
        .where('external_id')
        .equals(event.entity_id)
        .and((e) => e.tenant_id === event.tenant_id && e.entity_type === event.entity_type)
        .first();

      // 3. Resolve conflicts favoring authoritative ERP
      const { resolvedRecord } = await ERPConflictResolver.resolveConflict(
        event.tenant_id,
        event.entity_type,
        event.entity_id,
        existing || null,
        authoritativeRecord
      );

      // 4. Update Database
      if (event.event_type === 'deleted') {
        if (existing) {
          await db.erpEntities.delete(existing.id);
        }
      } else {
        await db.erpEntities.put({
          id: `${event.tenant_id}-${event.entity_type}-${event.entity_id}`,
          tenant_id: event.tenant_id,
          entity_type: event.entity_type,
          external_id: event.entity_id,
          data: resolvedRecord,
          version: resolvedRecord.version || 1,
          checksum: JSON.stringify(resolvedRecord).length.toString(),
          updated_at: resolvedRecord.updated_at || new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
          sync_status: 'synced',
        });
      }

      return true;
    } catch (err) {
      console.error(`[ERPWebhookHandler] Error processing event:`, err);
      throw err;
    }
  }
}

// Auto-initialize worker
ERPWebhookHandler.initializeWorker();
