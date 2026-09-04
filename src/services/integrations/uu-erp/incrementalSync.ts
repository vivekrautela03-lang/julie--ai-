// =============================================================================
// PROJECT JULIE — INCREMENTAL SYNCHRONIZATION & SNAPSHOT ENGINE
// Queries updated records since last checkpoint, handles pagination,
// batching, rate-limiting, and persists structured records to Dexie.
// =============================================================================

import { db, CURRENT_USER_ID } from '@/core/storage/db';
import type { ERPEntityRecord, ERPSyncCheckpoint } from './types';
import { uuerpClient } from './mockErpServer';
import { ERPDiscoveryEngine } from './discovery';
import { ERPConflictResolver } from './conflictResolver';

export class ERPIncrementalSyncEngine {
  /**
   * Runs an incremental sync for all discovered entities for a given tenant.
   */
  static async syncAllEntities(
    tenantId: string = 'default',
    isForceFullSnapshot: boolean = false
  ): Promise<{
    success: boolean;
    totalSyncedRecords: number;
    entityStats: Record<string, number>;
    durationMs: number;
  }> {
    const startTime = Date.now();
    const mappings = await ERPDiscoveryEngine.getEntityMappings(tenantId);
    let totalSyncedRecords = 0;
    const entityStats: Record<string, number> = {};

    for (const [entityName, mapping] of Object.entries(mappings)) {
      const count = await this.syncEntity(tenantId, entityName, isForceFullSnapshot);
      entityStats[entityName] = count;
      totalSyncedRecords += count;
    }

    const durationMs = Date.now() - startTime;
    return {
      success: true,
      totalSyncedRecords,
      entityStats,
      durationMs,
    };
  }

  /**
   * Synchronizes a single entity type incrementally using checkpoints.
   */
  static async syncEntity(
    tenantId: string,
    entityName: string,
    isForceFullSnapshot: boolean = false
  ): Promise<number> {
    let checkpoint = await db.erpSyncCheckpoints
      .where('entity_type')
      .equals(entityName)
      .and((c) => c.tenant_id === tenantId)
      .first();

    const updatedAfter =
      !isForceFullSnapshot && checkpoint && checkpoint.last_synced_timestamp
        ? checkpoint.last_synced_timestamp
        : undefined;

    let cursor: string | undefined = undefined;
    let hasMore = true;
    let entitySyncedCount = 0;

    while (hasMore) {
      const res = await uuerpClient.fetchEntityRecords(entityName, {
        updatedAfter,
        cursor,
        limit: 50,
      });

      for (const record of res.data) {
        const externalId = String(record.id || record.student_id || record.code || `gen-${Date.now()}`);

        const existingRecord = await db.erpEntities
          .where('external_id')
          .equals(externalId)
          .and((e) => e.tenant_id === tenantId && e.entity_type === entityName)
          .first();

        // Conflict Resolution Engine check
        const { resolvedRecord } = await ERPConflictResolver.resolveConflict(
          tenantId,
          entityName,
          externalId,
          existingRecord as ERPEntityRecord || null,
          record
        );

        const entityEntry: ERPEntityRecord = {
          id: `${tenantId}-${entityName}-${externalId}`,
          tenant_id: tenantId,
          entity_type: entityName,
          external_id: externalId,
          data: resolvedRecord,
          version: resolvedRecord.version || 1,
          checksum: JSON.stringify(resolvedRecord).length.toString(),
          updated_at: resolvedRecord.updated_at || new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
          sync_status: 'synced',
        };

        await db.erpEntities.put(entityEntry);
        entitySyncedCount++;

        // Map to Julie native student/attendance stores if applicable
        await this.mapToJulieLocalStore(entityName, resolvedRecord);
      }

      cursor = res.nextCursor;
      hasMore = res.hasMore && Boolean(cursor);
    }

    // Update Checkpoint
    const checkpointEntry: ERPSyncCheckpoint = {
      id: `${tenantId}-ckpt-${entityName}`,
      tenant_id: tenantId,
      entity_type: entityName,
      last_cursor: cursor,
      last_synced_timestamp: new Date().toISOString(),
      sync_phase: isForceFullSnapshot ? 'initial_snapshot' : 'incremental',
      status: 'active',
      records_processed: entitySyncedCount,
    };
    await db.erpSyncCheckpoints.put(checkpointEntry);

    return entitySyncedCount;
  }

  /**
   * Maps ERP records into Julie specific Dexie tables (db.subjects, db.attendance, db.classes)
   */
  private static async mapToJulieLocalStore(entityName: string, record: any): Promise<void> {
    try {
      if (entityName === 'attendance') {
        const subjectCode = record.subject_code || 'UU-GEN';
        const subId = `sub-erp-${subjectCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        await db.subjects.put({
          id: subId,
          user_id: CURRENT_USER_ID,
          subject_code: subjectCode,
          subject_name: record.subject_name || subjectCode,
          faculty_name: record.faculty_name || '',
          credits: 4,
          min_attendance_req: 75.0,
        });

        // Insert attendance records
        const conducted = record.total_conducted || 0;
        const present = record.total_present || 0;
        const missed = Math.max(0, conducted - present);

        for (let i = 1; i <= Math.min(conducted, 20); i++) {
          const isAttended = i <= present;
          await db.attendance.put({
            id: `att-erp-${subId}-${i}`,
            user_id: CURRENT_USER_ID,
            subject_id: subId,
            date: new Date(Date.now() - (conducted - i) * 86400000).toISOString().split('T')[0],
            status: isAttended ? 'attended' : 'missed',
          });
        }
      }

      if (entityName === 'timetable') {
        const subCode = record.subject_code || 'UU-GEN';
        const subId = `sub-erp-${subCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        await db.classes.put({
          id: `class-erp-${record.id || Date.now()}`,
          user_id: CURRENT_USER_ID,
          subject_id: subId,
          day_of_week: record.day_of_week || 1,
          start_time: record.start_time || '09:30:00',
          end_time: record.end_time || '10:30:00',
          room_number: record.room_number || 'Room 304',
          class_type: record.class_type || 'Lecture',
          is_active: true,
        });
      }
    } catch (e) {
      console.warn('[ERPIncrementalSyncEngine] Note on local store mapping:', e);
    }
  }
}
