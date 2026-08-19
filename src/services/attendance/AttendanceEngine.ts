// =============================================================================
// PROJECT JULIE — DETERMINISTIC ATTENDANCE ENGINE
// Mathematical calculations for college attendance, safe misses & recovery targets.
// NEVER uses fuzzy LLM approximations for hard numbers.
// =============================================================================

import type { AttendanceRecord, AttendanceSummary, Subject } from '@/core/types';
import { db, CURRENT_USER_ID } from '@/core/storage/db';

export class AttendanceEngine {
  /**
   * Calculates the exact attendance percentage for a set of records.
   * @param attended Number of attended classes
   * @param total Total classes conducted (attended + missed)
   */
  static calculatePercentage(attended: number, total: number): number {
    if (total <= 0) return 100.0;
    return Number(((attended / total) * 100).toFixed(2));
  }

  /**
   * Calculates safe misses or consecutive classes required to reach the threshold.
   * - Positive number: User can safely skip N classes and stay >= threshold.
   * - Negative number: User must attend Math.abs(N) consecutive classes to reach threshold.
   * - Zero: Exactly on threshold or no classes yet.
   */
  static calculateSafeMisses(attended: number, total: number, threshold: number = 75.0): number {
    if (total <= 0) return 0;
    const thresholdFraction = threshold / 100.0;
    const currentRatio = attended / total;

    if (currentRatio >= thresholdFraction) {
      // Safe to miss: Floor((Attended - threshold * Total) / threshold)
      const safe = Math.floor((attended - thresholdFraction * total) / thresholdFraction);
      return Math.max(0, safe);
    } else {
      // Must attend: Ceil((threshold * Total - Attended) / (1 - threshold))
      const needed = Math.ceil((thresholdFraction * total - attended) / (1.0 - thresholdFraction));
      return -Math.max(1, needed);
    }
  }

  /**
   * Evaluates the health status level of attendance.
   */
  static getStatusLevel(percentage: number, threshold: number = 75.0): 'Safe' | 'Warning' | 'Critical' | 'Good' {
    if (percentage >= threshold + 10.0) return 'Safe';
    if (percentage >= threshold) return 'Good';
    if (percentage >= threshold - 5.0) return 'Warning';
    return 'Critical';
  }

  /**
   * Aggregates raw attendance records for a subject into a deterministic summary.
   */
  static summarizeSubject(
    subject: Subject,
    records: AttendanceRecord[]
  ): AttendanceSummary {
    const validRecords = records.filter(r => r.status === 'attended' || r.status === 'missed');
    const attendedCount = validRecords.filter(r => r.status === 'attended').length;
    const missedCount = validRecords.filter(r => r.status === 'missed').length;
    const totalCount = attendedCount + missedCount;

    const percentage = this.calculatePercentage(attendedCount, totalCount);
    const minReq = subject.min_attendance_req || 75.0;
    const safeMisses = this.calculateSafeMisses(attendedCount, totalCount, minReq);
    const statusLevel = this.getStatusLevel(percentage, minReq);

    return {
      subject_id: subject.id,
      subject_code: subject.subject_code,
      subject_name: subject.subject_name,
      total_classes: totalCount,
      attended_classes: attendedCount,
      missed_classes: missedCount,
      percentage,
      min_required: minReq,
      safe_misses: safeMisses,
      status_level: statusLevel,
    };
  }

  /**
   * Calculates overall aggregate attendance across all subjects.
   */
  static summarizeOverall(summaries: AttendanceSummary[]): {
    totalAttended: number;
    totalConducted: number;
    overallPercentage: number;
    criticalSubjectsCount: number;
  } {
    let totalAttended = 0;
    let totalConducted = 0;
    let criticalSubjectsCount = 0;

    for (const s of summaries) {
      totalAttended += s.attended_classes;
      totalConducted += s.total_classes;
      if (s.status_level === 'Critical' || s.status_level === 'Warning') {
        criticalSubjectsCount++;
      }
    }

    const overallPercentage = this.calculatePercentage(totalAttended, totalConducted);

    return {
      totalAttended,
      totalConducted,
      overallPercentage,
      criticalSubjectsCount,
    };
  }

  /**
   * Marks class attendance (present/missed) for a given or inferred class and recalculates metrics.
   */
  static async markClassAttendance(
    subjectQuery?: string,
    status: 'attended' | 'missed' = 'attended',
    source: 'Voice' | 'Chat' | 'User Command' | 'Proactive Engine' | 'ERP Sync' = 'Voice'
  ): Promise<{
    success: boolean;
    subjectName: string;
    oldSubjectPct: number;
    newSubjectPct: number;
    oldOverallPct: number;
    newOverallPct: number;
    totalAttended: number;
    totalConducted: number;
    message: string;
  }> {
    const subjects = await db.subjects.toArray();
    let targetSubject: Subject | undefined;

    if (subjectQuery) {
      const q = subjectQuery.toLowerCase();
      targetSubject = subjects.find(
        s =>
          s.subject_name.toLowerCase().includes(q) ||
          s.subject_code.toLowerCase().includes(q) ||
          (q.includes('market') && s.subject_code.includes('203')) ||
          (q.includes('law') && s.subject_code.includes('201')) ||
          (q.includes('excel') && s.subject_code.includes('199')) ||
          (q.includes('account') && s.subject_code.includes('202')) ||
          (q.includes('language') && s.subject_code.includes('204')) ||
          (q.includes('office') && s.subject_code.includes('205')) ||
          (q.includes('tour') && s.subject_code.includes('206'))
      );
    }

    // If no subject matched, find current day's active class from timetable
    if (!targetSubject) {
      const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todayClasses = await db.classes.where('day_of_week').equals(todayDay).toArray();
      if (todayClasses.length > 0) {
        targetSubject = subjects.find(s => s.id === todayClasses[0].subject_id);
      }
    }

    if (!targetSubject && subjects.length > 0) {
      targetSubject = subjects[0]; // fallback
    }

    if (!targetSubject) {
      return {
        success: false,
        subjectName: 'Unknown',
        oldSubjectPct: 0,
        newSubjectPct: 0,
        oldOverallPct: 0,
        newOverallPct: 0,
        totalAttended: 0,
        totalConducted: 0,
        message: 'Could not identify subject to mark attendance.',
      };
    }

    // Get current attendance metrics before update
    const allRecords = await db.attendance.toArray();
    const oldSubjectRecords = allRecords.filter(r => r.subject_id === targetSubject!.id);
    const oldSubAttended = oldSubjectRecords.filter(r => r.status === 'attended').length;
    const oldSubTotal = oldSubjectRecords.length;
    const oldSubjectPct = this.calculatePercentage(oldSubAttended, oldSubTotal);

    const oldTotalAttended = allRecords.filter(r => r.status === 'attended').length;
    const oldTotalConducted = allRecords.length;
    const oldOverallPct = this.calculatePercentage(oldTotalAttended, oldTotalConducted);

    // Add new attendance record for today
    const newRecord: AttendanceRecord = {
      id: `att-live-${Date.now()}`,
      user_id: CURRENT_USER_ID,
      subject_id: targetSubject.id,
      date: new Date().toISOString().split('T')[0],
      status,
    };
    await db.attendance.add(newRecord);

    // Calculate new metrics
    const newSubAttended = status === 'attended' ? oldSubAttended + 1 : oldSubAttended;
    const newSubTotal = oldSubTotal + 1;
    const newSubjectPct = this.calculatePercentage(newSubAttended, newSubTotal);

    const newTotalAttended = status === 'attended' ? oldTotalAttended + 1 : oldTotalAttended;
    const newTotalConducted = oldTotalConducted + 1;
    const newOverallPct = this.calculatePercentage(newTotalAttended, newTotalConducted);

    // Create AI Action Log
    await db.actionLogs.add({
      id: `log-${Date.now()}`,
      user_id: CURRENT_USER_ID,
      action_type: 'ATTENDANCE_RECORDED',
      description: `Marked ${status.toUpperCase()} in ${targetSubject.subject_name}. Subject: ${newSubjectPct}% (${newSubAttended}/${newSubTotal}), Overall: ${newOverallPct}%.`,
      reason: `User voice/command: mark attendance`,
      source,
      user_confirmed: true,
      created_at: new Date().toISOString(),
    });

    // Cloud backup to Supabase
    try {
      const { SupabaseSyncService } = await import('@/services/integrations/SupabaseSyncService');
      SupabaseSyncService.pushToCloud().catch(e => console.warn('[Supabase Sync Note]:', e));
    } catch (e) {}

    const statusWord = status === 'attended' ? 'PRESENT' : 'MISSED';
    const message = `Marked you ${statusWord} for ${targetSubject.subject_name}. Your ${targetSubject.subject_code} attendance is now ${newSubjectPct}% (${newSubAttended}/${newSubTotal}) and your overall attendance is now ${newOverallPct}% (${newTotalAttended}/${newTotalConducted}).`;

    return {
      success: true,
      subjectName: targetSubject.subject_name,
      oldSubjectPct,
      newSubjectPct,
      oldOverallPct,
      newOverallPct,
      totalAttended: newTotalAttended,
      totalConducted: newTotalConducted,
      message,
    };
  }
}
