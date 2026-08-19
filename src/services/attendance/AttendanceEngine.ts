// =============================================================================
// PROJECT JULIE — DETERMINISTIC ATTENDANCE ENGINE
// Mathematical calculations for college attendance, safe misses & recovery targets.
// NEVER uses fuzzy LLM approximations for hard numbers.
// =============================================================================

import type { AttendanceRecord, AttendanceSummary, Subject } from '@/core/types';

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
}
