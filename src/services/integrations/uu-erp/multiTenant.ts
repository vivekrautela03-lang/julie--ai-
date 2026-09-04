// =============================================================================
// PROJECT JULIE — MULTI-TENANT ISOLATION MANAGER
// Ensures complete segregation of credentials, entity stores, sync queues,
// audit trails, and vector RAG indices across different tenant institutions.
// =============================================================================

import { db } from '@/core/storage/db';

export class ERPMultiTenantManager {
  /**
   * Validates that an operation does not cross tenant boundaries
   */
  static assertTenantAccess(requestedTenantId: string, userTenantId: string): void {
    if (userTenantId !== requestedTenantId && userTenantId !== 'super_admin') {
      throw new Error(`403 Forbidden: Cross-tenant access denied. User from '${userTenantId}' cannot access tenant '${requestedTenantId}'.`);
    }
  }

  /**
   * Purges all data belonging to a specific tenant
   */
  static async purgeTenantData(tenantId: string): Promise<{ deletedEntities: number; deletedEvents: number }> {
    const deletedEntities = await db.erpEntities.where('tenant_id').equals(tenantId).delete();
    const deletedEvents = await db.erpEvents.where('tenant_id').equals(tenantId).delete();
    await db.erpDeadLetterQueue.where('tenant_id').equals(tenantId).delete();
    await db.erpAuditLogs.where('tenant_id').equals(tenantId).delete();
    await db.erpConflicts.where('tenant_id').equals(tenantId).delete();
    await db.erpSchemas.where('tenant_id').equals(tenantId).delete();
    await db.erpSyncCheckpoints.where('tenant_id').equals(tenantId).delete();

    return { deletedEntities, deletedEvents };
  }
}
