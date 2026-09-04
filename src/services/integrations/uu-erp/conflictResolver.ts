// =============================================================================
// PROJECT JULIE — ERP CONFLICT RESOLUTION ENGINE (AUTHORITATIVE SOURCE OF TRUTH)
// UU ERP is always authoritative. Resolves data divergence by prioritizing
// ERP versions/timestamps and creating auditable conflict records.
// =============================================================================

import { db } from '@/core/storage/db';
import type { ERPConflictRecord, ERPEntityRecord } from './types';

export class ERPConflictResolver {
  /**
   * Resolves divergence between local Julie representation and incoming ERP record.
   */
  static async resolveConflict(
    tenantId: string,
    entityType: string,
    externalId: string,
    localRecord: ERPEntityRecord | null,
    authoritativeErpRecord: any
  ): Promise<{ resolvedRecord: any; conflictDetected: boolean }> {
    if (!localRecord) {
      // No local record exists yet -> direct insertion
      return { resolvedRecord: authoritativeErpRecord, conflictDetected: false };
    }

    const localUpdatedAt = new Date(localRecord.updated_at).getTime();
    const erpUpdatedAt = new Date(authoritativeErpRecord.updated_at || Date.now()).getTime();
    const localVersion = localRecord.version || 1;
    const erpVersion = authoritativeErpRecord.version || 1;

    // Check if data actually diverges
    const localJson = JSON.stringify(localRecord.data);
    const erpJson = JSON.stringify(authoritativeErpRecord);

    if (localJson === erpJson) {
      return { resolvedRecord: authoritativeErpRecord, conflictDetected: false };
    }

    // Conflict Detected: Local state differs from Authoritative ERP
    console.warn(
      `[ERPConflictResolver] Conflict detected on ${entityType}:${externalId}. Local v${localVersion} vs ERP v${erpVersion}. Enforcing ERP Source of Truth.`
    );

    const conflictRecord: ERPConflictRecord = {
      id: `conflict-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      tenant_id: tenantId,
      entity_type: entityType,
      entity_id: externalId,
      julie_version: localRecord.data,
      erp_version: authoritativeErpRecord,
      resolution_strategy: 'erp_authoritative_overwrite',
      resolved_at: new Date().toISOString(),
      details: `Reconciled local representation with authoritative ERP state (Local v${localVersion} -> ERP v${erpVersion}).`,
    };

    await db.erpConflicts.put(conflictRecord);

    // Record audit log
    await db.erpAuditLogs.add({
      id: `audit-conflict-${Date.now()}`,
      tenant_id: tenantId,
      actor_id: 'system_conflict_resolver',
      actor_role: 'System',
      action: 'DATA_CONFLICT_RESOLVED',
      entity_type: entityType,
      entity_id: externalId,
      old_value: localRecord.data,
      new_value: authoritativeErpRecord,
      reason: 'Automated reconciliation favoring authoritative UU ERP source of truth',
      status: 'success',
      timestamp: new Date().toISOString(),
    });

    return { resolvedRecord: authoritativeErpRecord, conflictDetected: true };
  }
}
