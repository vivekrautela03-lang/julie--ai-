// =============================================================================
// PROJECT JULIE — RBAC / ABAC PERMISSION ENGINE FOR ERP ACCESS
// Enforces server-side authorization across roles (Student, Teacher, Finance, Admin)
// and protects sensitive ERP records and write operations.
// =============================================================================

import type { UserContext, RBACRole } from './types';

export class ERPPermissionEngine {
  /**
   * Checks if user has permission to perform a specific read or write action on an ERP entity.
   */
  static checkPermission(
    user: UserContext,
    entityType: string,
    action: 'read' | 'create' | 'update' | 'delete' | 'approve' | 'bulk_update',
    targetRecord?: any
  ): { granted: boolean; reason?: string } {
    if (!user) {
      return { granted: false, reason: 'Unauthenticated: No user context provided.' };
    }

    // 1. Administrator has full access
    if (user.role === 'Administrator') {
      return { granted: true };
    }

    // 2. Student Role Permissions
    if (user.role === 'Student') {
      if (action !== 'read') {
        return { granted: false, reason: 'Students cannot execute write or modification actions in UU ERP.' };
      }

      // Read permissions for Student: only own records or public entities
      if (entityType === 'notices' || entityType === 'timetable') {
        return { granted: true };
      }

      if (targetRecord) {
        const isOwnRecord =
          targetRecord.student_id === user.userId ||
          targetRecord.id === user.userId ||
          targetRecord.student_roll === user.userId;
        if (!isOwnRecord) {
          return { granted: false, reason: 'Students can only view their own personal academic records.' };
        }
      }

      return { granted: true };
    }

    // 3. Teacher / Faculty Role Permissions
    if (user.role === 'Teacher') {
      if (entityType === 'fees') {
        return { granted: false, reason: 'Faculty members do not have access to student financial records.' };
      }

      if (entityType === 'attendance') {
        // Can read and update attendance
        if (action === 'read' || action === 'update' || action === 'create') {
          return { granted: true };
        }
        return { granted: false, reason: 'Faculty cannot delete official attendance archives.' };
      }

      if (entityType === 'students' || entityType === 'timetable' || entityType === 'notices' || entityType === 'departments') {
        if (action === 'read') return { granted: true };
      }

      if (action === 'delete') {
        return { granted: false, reason: 'Only Administrators can delete core ERP entities.' };
      }
    }

    // 4. Finance Department Permissions
    if (user.role === 'Finance') {
      if (entityType === 'fees') {
        if (action === 'read' || action === 'create' || action === 'update') {
          return { granted: true };
        }
        return { granted: false, reason: 'Finance personnel cannot permanently delete financial fee ledger entries.' };
      }

      if (entityType === 'students' || entityType === 'notices' || entityType === 'departments') {
        if (action === 'read') return { granted: true };
      }

      if (entityType === 'attendance' && action !== 'read') {
        return { granted: false, reason: 'Finance personnel cannot modify academic attendance records.' };
      }
    }

    // 5. Department Head Permissions
    if (user.role === 'DepartmentHead') {
      if (action === 'read') return { granted: true };
      if (action === 'approve') return { granted: true };
      if (action === 'update') return { granted: true };
      if (action === 'delete') {
        return { granted: false, reason: 'Destructive deletion requires Administrator authorization.' };
      }
    }

    // Default fallback
    return { granted: false, reason: `Role ${user.role} is not permitted to perform ${action} on ${entityType}.` };
  }

  /**
   * Helper to create a student context
   */
  static createStudentContext(userId: string = 'std-1001', tenantId: string = 'default'): UserContext {
    return {
      userId,
      role: 'Student',
      tenantId,
      permissions: ['read_own_records'],
    };
  }

  /**
   * Helper to create an admin context
   */
  static createAdminContext(userId: string = 'admin-01', tenantId: string = 'default'): UserContext {
    return {
      userId,
      role: 'Administrator',
      tenantId,
      permissions: ['*'],
    };
  }
}
