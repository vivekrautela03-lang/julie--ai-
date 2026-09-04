// =============================================================================
// PROJECT JULIE — BIDIRECTIONAL ACTION SYSTEM & HIGH-RISK STAGED CONFIRMATION
// Allows Julie AI to execute controlled, authorized ERP mutations with
// permission checks, confirmation previews, and audit logging.
// =============================================================================

import { db } from '@/core/storage/db';
import type {
  ERPBidirectionalActionRequest,
  ERPBidirectionalActionPlan,
  ERPBidirectionalActionResult,
} from './types';
import { ERPPermissionEngine } from './permissions';
import { ERPAuditLogger } from './auditLogger';
import { uuerpClient } from './mockErpServer';
import { ERPWebhookHandler } from './webhook';

export class ERPBidirectionalActionService {
  /**
   * Generates a mutation execution plan with risk analysis and confirmation requirement.
   */
  static async planAction(request: ERPBidirectionalActionRequest): Promise<ERPBidirectionalActionPlan> {
    const planId = `plan-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 1. Permission Check
    const perm = ERPPermissionEngine.checkPermission(
      request.actor,
      request.entity_type,
      request.action as any,
      request.payload
    );

    if (!perm.granted) {
      return {
        planId,
        action: request.action,
        entity_type: request.entity_type,
        entity_id: request.entity_id,
        isHighRisk: false,
        affectedRecordCount: 0,
        proposedValuePreview: request.payload,
        requiresConfirmation: false,
        permissionGranted: false,
        validationErrors: [perm.reason || 'Permission denied'],
        summary: `Action rejected: ${perm.reason}`,
      };
    }

    // 2. High-Risk Operation Detection
    const isDestructive = request.action === 'delete_record';
    const isFinancial = request.entity_type === 'fees';
    const isBulk = request.action === 'bulk_update';
    const isHighRisk = isDestructive || isFinancial || isBulk;

    let oldValuePreview: any = null;
    if (request.entity_id) {
      oldValuePreview = await uuerpClient.fetchRecordById(request.entity_type, request.entity_id);
    }

    const affectedRecordCount = isBulk ? (request.payload.ids?.length || 5) : 1;
    const requiresConfirmation = isHighRisk && !request.isConfirmed;

    const summary = `${request.action.toUpperCase()} on ${request.entity_type}${
      request.entity_id ? ` (ID: ${request.entity_id})` : ''
    }. ${isHighRisk ? '⚠️ High-risk operation requires explicit confirmation.' : 'Safe operation.'}`;

    return {
      planId,
      action: request.action,
      entity_type: request.entity_type,
      entity_id: request.entity_id,
      isHighRisk,
      affectedRecordCount,
      oldValuePreview,
      proposedValuePreview: request.payload,
      requiresConfirmation,
      permissionGranted: true,
      summary,
    };
  }

  /**
   * Executes a verified and confirmed ERP action
   */
  static async executeAction(
    request: ERPBidirectionalActionRequest
  ): Promise<ERPBidirectionalActionResult> {
    const plan = await this.planAction(request);

    if (!plan.permissionGranted) {
      await ERPAuditLogger.log({
        tenant_id: request.tenantId,
        actor_id: request.actor.userId,
        actor_role: request.actor.role,
        action: request.action,
        entity_type: request.entity_type,
        entity_id: request.entity_id || 'unknown',
        old_value: null,
        new_value: request.payload,
        reason: request.reason,
        status: 'denied',
      });

      return {
        success: false,
        planId: plan.planId,
        action: request.action,
        entity_type: request.entity_type,
        message: plan.validationErrors?.[0] || 'Permission denied',
        error: 'FORBIDDEN',
      };
    }

    if (plan.requiresConfirmation) {
      return {
        success: false,
        planId: plan.planId,
        action: request.action,
        entity_type: request.entity_type,
        entity_id: request.entity_id,
        message: `High-risk action requires confirmation. Please confirm plan ${plan.planId}.`,
        error: 'CONFIRMATION_REQUIRED',
      };
    }

    try {
      // Map action type to ERP mutation
      let opType: 'create' | 'update' | 'delete' = 'update';
      if (request.action === 'create_record') opType = 'create';
      if (request.action === 'delete_record') opType = 'delete';

      // Execute on authoritative ERP
      const erpRes = await uuerpClient.executeMutation(
        request.entity_type,
        opType,
        request.payload
      );

      // Record immutable audit log
      const auditEntry = await ERPAuditLogger.log({
        tenant_id: request.tenantId,
        actor_id: request.actor.userId,
        actor_role: request.actor.role,
        action: request.action,
        entity_type: request.entity_type,
        entity_id: request.entity_id || erpRes.record?.id || 'new_record',
        old_value: plan.oldValuePreview,
        new_value: erpRes.record,
        reason: request.reason,
        status: 'success',
        erp_response: erpRes,
      });

      // Emit simulated webhook to trigger real-time Julie local state synchronization
      await ERPWebhookHandler.handleIncomingWebhook({
        event_id: `evt-action-${Date.now()}`,
        tenant_id: request.tenantId,
        entity_type: request.entity_type,
        entity_id: request.entity_id || erpRes.record?.id,
        event_type: opType === 'delete' ? 'deleted' : opType === 'create' ? 'created' : 'updated',
        data: erpRes.record,
      });

      return {
        success: true,
        planId: plan.planId,
        action: request.action,
        entity_type: request.entity_type,
        entity_id: request.entity_id || erpRes.record?.id,
        erpResponse: erpRes,
        auditLogId: auditEntry.id,
        message: `Action executed successfully on UU ERP. Local representation synchronized.`,
      };
    } catch (err: any) {
      console.error('[ERPBidirectionalActionService] Execution failed:', err);

      await ERPAuditLogger.log({
        tenant_id: request.tenantId,
        actor_id: request.actor.userId,
        actor_role: request.actor.role,
        action: request.action,
        entity_type: request.entity_type,
        entity_id: request.entity_id || 'unknown',
        old_value: plan.oldValuePreview,
        new_value: request.payload,
        reason: request.reason,
        status: 'failed',
      });

      return {
        success: false,
        planId: plan.planId,
        action: request.action,
        entity_type: request.entity_type,
        message: `ERP API execution failed: ${err.message}`,
        error: err.message,
      };
    }
  }
}
