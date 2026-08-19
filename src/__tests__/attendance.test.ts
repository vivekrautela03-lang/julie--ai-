import { describe, it, expect } from 'vitest';
import { AttendanceEngine } from '../services/attendance/AttendanceEngine';
import type { Subject, AttendanceRecord } from '../core/types';

describe('AttendanceEngine (Deterministic Attendance Calculations)', () => {
  it('calculates exact percentage correctly', () => {
    // 18 attended out of 21 conducted -> 85.71%
    expect(AttendanceEngine.calculatePercentage(18, 21)).toBe(85.71);

    // 14 attended out of 19 conducted -> 73.68%
    expect(AttendanceEngine.calculatePercentage(14, 19)).toBe(73.68);

    // 0 conducted -> 100%
    expect(AttendanceEngine.calculatePercentage(0, 0)).toBe(100.0);
  });

  it('calculates safe misses when above threshold', () => {
    // 18 attended out of 21 conducted with 75% threshold
    // Safe misses: Floor((18 - 0.75 * 21) / 0.75) = Floor((18 - 15.75) / 0.75) = Floor(2.25 / 0.75) = 3
    const safeMisses = AttendanceEngine.calculateSafeMisses(18, 21, 75.0);
    expect(safeMisses).toBe(3);
  });

  it('calculates consecutive classes required when below threshold', () => {
    // 14 attended out of 19 conducted with 75% threshold (73.68%)
    // Shortfall: Ceil((0.75 * 19 - 14) / (1 - 0.75)) = Ceil((14.25 - 14) / 0.25) = Ceil(0.25 / 0.25) = 1
    const safeMisses = AttendanceEngine.calculateSafeMisses(14, 19, 75.0);
    expect(safeMisses).toBe(-1); // Must attend 1 class
  });

  it('evaluates status levels correctly', () => {
    expect(AttendanceEngine.getStatusLevel(88.0, 75.0)).toBe('Safe');
    expect(AttendanceEngine.getStatusLevel(76.0, 75.0)).toBe('Good');
    expect(AttendanceEngine.getStatusLevel(72.0, 75.0)).toBe('Warning');
    expect(AttendanceEngine.getStatusLevel(65.0, 75.0)).toBe('Critical');
  });

  it('summarizes subject attendance records accurately', () => {
    const subject: Subject = {
      id: 'sub-1',
      user_id: 'user-1',
      subject_code: 'MKT301',
      subject_name: 'Marketing Management',
      credits: 4,
      min_attendance_req: 75.0,
    };

    const records: AttendanceRecord[] = [
      { id: '1', user_id: 'user-1', subject_id: 'sub-1', date: '2026-08-01', status: 'attended' },
      { id: '2', user_id: 'user-1', subject_id: 'sub-1', date: '2026-08-02', status: 'attended' },
      { id: '3', user_id: 'user-1', subject_id: 'sub-1', date: '2026-08-03', status: 'attended' },
      { id: '4', user_id: 'user-1', subject_id: 'sub-1', date: '2026-08-04', status: 'missed' },
    ];

    const summary = AttendanceEngine.summarizeSubject(subject, records);
    expect(summary.total_classes).toBe(4);
    expect(summary.attended_classes).toBe(3);
    expect(summary.percentage).toBe(75.0);
    expect(summary.status_level).toBe('Good');
  });
});
