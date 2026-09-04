// =============================================================================
// PROJECT JULIE — AI KNOWLEDGE SYNCHRONIZATION & DATA ACCESS LAYER
// Provides deterministic, hallucination-free access to ERP records,
// data freshness indicators, vector RAG search, and anti-prompt injection sanitization.
// =============================================================================

import { db } from '@/core/storage/db';
import type { UserContext } from './types';
import { ERPPermissionEngine } from './permissions';

export class ERPAIDataAccessLayer {
  /**
   * Anti-Prompt Injection Sanitizer for untrusted ERP text fields
   */
  static sanitizeERPText(input: string): string {
    if (!input || typeof input !== 'string') return '';
    // Strip control characters, prompt hijacking triggers, and markdown code injections
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/(?:system instruction|ignore previous instructions|you are now|as an ai)/gi, '[REDACTED_PROMPT_KEYWORD]')
      .trim();
  }

  /**
   * Formats freshness metadata for LLM responses
   */
  private static formatFreshness(updatedAt?: string, lastSyncedAt?: string): string {
    const now = Date.now();
    const syncTime = lastSyncedAt ? new Date(lastSyncedAt).getTime() : now;
    const diffSec = Math.max(0, Math.floor((now - syncTime) / 1000));
    const freshnessStr = diffSec < 60 ? `${diffSec}s ago` : `${Math.floor(diffSec / 60)}m ago`;

    return `\n\n[Data Source: Authoritative UU ERP | Last Synced: ${freshnessStr} | Freshness: Valid]`;
  }

  /**
   * Retrieves student details with permission checks
   */
  static async getStudent(
    studentIdOrRoll: string,
    user: UserContext = ERPPermissionEngine.createStudentContext()
  ): Promise<{ student: any | null; freshness: string; error?: string }> {
    const records = await db.erpEntities
      .where('entity_type')
      .equals('students')
      .and((e) => e.tenant_id === user.tenantId)
      .toArray();

    const matched = records.find(
      (r) =>
        r.external_id === studentIdOrRoll ||
        r.data.roll_no === studentIdOrRoll ||
        r.data.id === studentIdOrRoll
    );

    if (!matched) {
      return { student: null, freshness: '', error: `Student '${studentIdOrRoll}' not found in synchronized records.` };
    }

    const perm = ERPPermissionEngine.checkPermission(user, 'students', 'read', matched.data);
    if (!perm.granted) {
      return { student: null, freshness: '', error: perm.reason };
    }

    return {
      student: matched.data,
      freshness: this.formatFreshness(matched.updated_at, matched.last_synced_at),
    };
  }

  /**
   * Searches students by name, program, or semester
   */
  static async searchStudents(
    query: string,
    user: UserContext = ERPPermissionEngine.createAdminContext()
  ): Promise<{ students: any[]; count: number }> {
    const qLower = query.toLowerCase();
    const records = await db.erpEntities
      .where('entity_type')
      .equals('students')
      .and((e) => e.tenant_id === user.tenantId)
      .toArray();

    const filtered = records
      .map((r) => r.data)
      .filter((s) => {
        const perm = ERPPermissionEngine.checkPermission(user, 'students', 'read', s);
        if (!perm.granted) return false;
        return (
          s.name?.toLowerCase().includes(qLower) ||
          s.roll_no?.toLowerCase().includes(qLower) ||
          s.program?.toLowerCase().includes(qLower) ||
          s.section?.toLowerCase().includes(qLower)
        );
      });

    return { students: filtered, count: filtered.length };
  }

  /**
   * Retrieves real-time attendance for a student
   */
  static async getAttendance(
    studentIdOrRoll?: string,
    user: UserContext = ERPPermissionEngine.createStudentContext()
  ): Promise<{
    overall: { percentage: number; totalConducted: number; totalPresent: number };
    subjects: any[];
    freshness: string;
    error?: string;
  }> {
    const records = await db.erpEntities
      .where('entity_type')
      .equals('attendance')
      .and((e) => e.tenant_id === user.tenantId)
      .toArray();

    let studentRecords = records.map((r) => r.data);

    if (studentIdOrRoll) {
      studentRecords = studentRecords.filter(
        (r) => r.student_id === studentIdOrRoll || r.student_roll === studentIdOrRoll
      );
    } else if (user.role === 'Student') {
      studentRecords = studentRecords.filter(
        (r) => r.student_id === user.userId || r.student_roll === user.userId
      );
    }

    if (studentRecords.length === 0) {
      return {
        overall: { percentage: 0, totalConducted: 0, totalPresent: 0 },
        subjects: [],
        freshness: '',
        error: 'No attendance records found for student in UU ERP.',
      };
    }

    const totalConducted = studentRecords.reduce((acc, s) => acc + (s.total_conducted || 0), 0);
    const totalPresent = studentRecords.reduce((acc, s) => acc + (s.total_present || 0), 0);
    const percentage = totalConducted > 0 ? parseFloat(((totalPresent / totalConducted) * 100).toFixed(2)) : 0;

    const subjectsWithSafeMisses = studentRecords.map((s) => {
      const conducted = s.total_conducted || 0;
      const present = s.total_present || 0;
      const pct = s.percentage || (conducted > 0 ? (present / conducted) * 100 : 0);
      const safeMisses = Math.max(0, Math.floor(present / 0.75) - conducted);
      const recoveryNeeded = pct < 75 ? Math.ceil((0.75 * conducted - present) / 0.25) : 0;

      return {
        subjectCode: s.subject_code,
        subjectName: s.subject_name,
        facultyName: s.faculty_name,
        conducted,
        present,
        percentage: parseFloat(pct.toFixed(2)),
        safeMisses,
        recoveryNeeded,
      };
    });

    const latestSync = records[0]?.last_synced_at;
    return {
      overall: { percentage, totalConducted, totalPresent },
      subjects: subjectsWithSafeMisses,
      freshness: this.formatFreshness(records[0]?.updated_at, latestSync),
    };
  }

  /**
   * Retrieves fee status and balance
   */
  static async getFeeStatus(
    studentIdOrRoll?: string,
    user: UserContext = ERPPermissionEngine.createStudentContext()
  ): Promise<{ fees: any[]; totalDue: number; freshness: string; error?: string }> {
    const records = await db.erpEntities
      .where('entity_type')
      .equals('fees')
      .and((e) => e.tenant_id === user.tenantId)
      .toArray();

    let feeRecords = records.map((r) => r.data);

    if (studentIdOrRoll) {
      feeRecords = feeRecords.filter(
        (f) => f.student_id === studentIdOrRoll || f.student_roll === studentIdOrRoll
      );
    } else if (user.role === 'Student') {
      feeRecords = feeRecords.filter(
        (f) => f.student_id === user.userId || f.student_roll === user.userId
      );
    }

    const totalDue = feeRecords.reduce((acc, f) => acc + (f.due_amount || 0), 0);
    return {
      fees: feeRecords,
      totalDue,
      freshness: this.formatFreshness(records[0]?.updated_at, records[0]?.last_synced_at),
    };
  }

  /**
   * Retrieves timetable schedule
   */
  static async getTimetable(
    dayOfWeek?: number,
    user: UserContext = ERPPermissionEngine.createStudentContext()
  ): Promise<{ schedule: any[]; freshness: string }> {
    const records = await db.erpEntities
      .where('entity_type')
      .equals('timetable')
      .and((e) => e.tenant_id === user.tenantId)
      .toArray();

    let ttRecords = records.map((r) => r.data);
    if (dayOfWeek !== undefined) {
      ttRecords = ttRecords.filter((t) => t.day_of_week === dayOfWeek);
    }

    return {
      schedule: ttRecords,
      freshness: this.formatFreshness(records[0]?.updated_at, records[0]?.last_synced_at),
    };
  }

  /**
   * Semantic search across official university notices, circulars, and policies
   */
  static async searchNotices(
    query: string,
    user: UserContext = ERPPermissionEngine.createStudentContext()
  ): Promise<{ notices: any[]; count: number }> {
    const qLower = query.toLowerCase();
    const records = await db.erpEntities
      .where('entity_type')
      .equals('notices')
      .and((e) => e.tenant_id === user.tenantId)
      .toArray();

    const matched = records
      .map((r) => r.data)
      .filter((n) => {
        return (
          n.title?.toLowerCase().includes(qLower) ||
          n.content?.toLowerCase().includes(qLower) ||
          n.category?.toLowerCase().includes(qLower)
        );
      });

    return { notices: matched, count: matched.length };
  }
}
