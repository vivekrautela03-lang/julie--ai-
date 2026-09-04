// =============================================================================
// PROJECT JULIE — IMMUTABLE AUDIT LOGGING SERVICE
// Append-only audit logger capturing every ERP interaction, AI action,
// permission decision, and sync reconciliation.
// =============================================================================

import { db } from '@/core/storage/db';
import type { ERPAuditLog } from './types';

export class ERPAuditLogger {
  /**
   * Logs an immutable audit entry
   */
  static async log(entry: Omit<ERPAuditLog, 'id' | 'timestamp'>): Promise<ERPAuditLog> {
    const fullLog: ERPAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    await db.erpAuditLogs.add(fullLog);
    return fullLog;
  }

  /**
   * Queries audit logs with filtering and pagination
   */
  static async queryLogs(
    tenantId: string = 'default',
    filter: {
      entityType?: string;
      actorId?: string;
      status?: string;
      limit?: number;
    } = {}
  ): Promise<ERPAuditLog[]> {
    let collection = db.erpAuditLogs.where('tenant_id').equals(tenantId);

    let logs = await collection.reverse().toArray();

    if (filter.entityType) {
      logs = logs.filter((l) => l.entity_type === filter.entityType);
    }
    if (filter.actorId) {
      logs = logs.filter((l) => l.actor_id === filter.actorId);
    }
    if (filter.status) {
      logs = logs.filter((l) => l.status === filter.status);
    }

    const limit = filter.limit || 100;
    return logs.slice(0, limit) as ERPAuditLog[];
  }
}
