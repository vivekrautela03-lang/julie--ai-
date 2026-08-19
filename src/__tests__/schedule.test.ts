import { describe, it, expect } from 'vitest';
import { ScheduleEngine } from '../services/schedule/ScheduleEngine';
import type { ClassSchedule, DailyScheduleItem } from '../core/types';

describe('ScheduleEngine (Timeline, Free-time & Conflict Detection)', () => {
  it('converts time strings to minutes and back', () => {
    expect(ScheduleEngine.timeToMinutes('10:00')).toBe(600);
    expect(ScheduleEngine.timeToMinutes('14:30')).toBe(870);
    expect(ScheduleEngine.minutesToTime(600)).toBe('10:00 AM');
    expect(ScheduleEngine.minutesToTime(870)).toBe('2:30 PM');
  });

  it('detects schedule conflicts accurately', () => {
    const existing: DailyScheduleItem[] = [
      {
        id: '1',
        type: 'class',
        title: 'Marketing',
        startTime: '10:00',
        endTime: '11:30',
      },
      {
        id: '2',
        type: 'class',
        title: 'Economics',
        startTime: '14:00',
        endTime: '15:30',
      },
    ];

    // Conflict overlapping with Marketing (10:30 to 11:45)
    const conflict1 = ScheduleEngine.detectConflict('10:30', '11:45', existing);
    expect(conflict1.hasConflict).toBe(true);
    expect(conflict1.conflictingItem?.title).toBe('Marketing');

    // No conflict during free window (12:00 to 13:00)
    const conflict2 = ScheduleEngine.detectConflict('12:00', '13:00', existing);
    expect(conflict2.hasConflict).toBe(false);
  });

  it('discovers free blocks between commitments', () => {
    const existing: DailyScheduleItem[] = [
      {
        id: '1',
        type: 'class',
        title: 'Marketing',
        startTime: '10:00',
        endTime: '11:30',
      },
      {
        id: '2',
        type: 'class',
        title: 'Economics',
        startTime: '14:00',
        endTime: '15:30',
      },
    ];

    const freeBlocks = ScheduleEngine.findFreeBlocks(existing, 45);
    // Should find morning gap (08:00 to 10:00 = 120m) and midday gap (11:30 to 14:00 = 150m)
    expect(freeBlocks.length).toBeGreaterThanOrEqual(2);
    const middayGap = freeBlocks.find(b => b.durationMinutes === 150);
    expect(middayGap).toBeDefined();
  });
});
