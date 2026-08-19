// =============================================================================
// PROJECT JULIE — SCHEDULE ENGINE
// Aggregates college timetables, events, tasks, and intentions into a unified daily timeline
// Calculates free time slots and detects calendar conflicts.
// =============================================================================

import type { ClassSchedule, CalendarEvent, Task, Intention, DailyScheduleItem, FreeTimeBlock } from '@/core/types';

export class ScheduleEngine {
  /**
   * Builds the comprehensive daily schedule combining classes, events, planned tasks, and intentions.
   */
  static buildDailyTimeline(params: {
    classes: ClassSchedule[];
    events: CalendarEvent[];
    tasks: Task[];
    intentions: Intention[];
    targetDate?: Date;
  }): DailyScheduleItem[] {
    const target = params.targetDate || new Date();
    const targetDow = target.getDay() === 0 ? 7 : target.getDay();

    const items: DailyScheduleItem[] = [];

    // 1. Add Today's Classes
    for (const c of params.classes) {
      if (c.day_of_week === targetDow && c.is_active) {
        items.push({
          id: `class-${c.id}`,
          type: 'class',
          title: c.subject_name || c.subject_code || 'Class',
          subtitle: `${c.class_type} • ${c.room_number || 'Room TBA'}${c.faculty_name ? ` • ${c.faculty_name}` : ''}`,
          startTime: c.start_time.substring(0, 5),
          endTime: c.end_time.substring(0, 5),
          location: c.room_number,
          category: 'College',
          isActionable: true,
          rawItem: c,
        });
      }
    }

    // 2. Add Calendar Events
    for (const e of params.events) {
      const eStart = new Date(e.start_time);
      const eEnd = new Date(e.end_time);
      if (eStart.toDateString() === target.toDateString()) {
        const sTime = eStart.toTimeString().substring(0, 5);
        const eTime = eEnd.toTimeString().substring(0, 5);
        items.push({
          id: `event-${e.id}`,
          type: 'event',
          title: e.title,
          subtitle: e.description || e.location || 'Calendar Event',
          startTime: sTime,
          endTime: eTime,
          location: e.location,
          category: e.category,
          isActionable: false,
          rawItem: e,
        });
      }
    }

    // 3. Add High/Urgent Tasks as planned sessions if due soon or planned
    for (const t of params.tasks) {
      if (t.status === 'In Progress' || t.status === 'Planned') {
        if (t.due_date) {
          const dDate = new Date(t.due_date);
          // If due within 36 hours or today
          const diffHours = (dDate.getTime() - target.getTime()) / 3600000;
          if (diffHours >= -4 && diffHours <= 36) {
            // Include recommendation
          }
        }
      }
    }

    // 4. Add Active Intentions as Suggested Slots
    for (const int of params.intentions) {
      if (int.status === 'active' || int.status === 'scheduled') {
        let sTime = int.suggested_start_time || '19:30';
        let eTime = int.suggested_end_time || '21:30';

        if (int.time_window === 'Tonight' && !int.suggested_start_time) {
          sTime = '19:30';
          eTime = '21:30';
        }

        items.push({
          id: `intention-${int.id}`,
          type: 'intention_slot',
          title: int.content,
          subtitle: `User Intention (${int.time_window}) • ${int.priority} Priority`,
          startTime: sTime,
          endTime: eTime,
          category: int.category,
          isActionable: true,
          rawItem: int,
        });
      }
    }

    // Sort chronologically by startTime
    items.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // 5. Interleave Free Time Blocks
    const resultWithGaps: DailyScheduleItem[] = [];
    for (let i = 0; i < items.length; i++) {
      resultWithGaps.push(items[i]);
      if (i < items.length - 1) {
        const currEnd = items[i].endTime;
        const nextStart = items[i + 1].startTime;
        const gapMinutes = this.timeToMinutes(nextStart) - this.timeToMinutes(currEnd);

        if (gapMinutes >= 45) {
          resultWithGaps.push({
            id: `free-${i}`,
            type: 'free_block',
            title: `Free Time (${Math.floor(gapMinutes / 60)}h ${gapMinutes % 60 > 0 ? `${gapMinutes % 60}m` : ''})`,
            subtitle: 'Ideal for assignment progress or revision',
            startTime: currEnd,
            endTime: nextStart,
            category: 'Free',
            isActionable: false,
          });
        }
      }
    }

    return resultWithGaps;
  }

  /**
   * Discovers available free time gaps during active daytime hours (08:00 to 22:00).
   */
  static findFreeBlocks(items: DailyScheduleItem[], minMinutes: number = 30): FreeTimeBlock[] {
    const fixedItems = items.filter(it => it.type === 'class' || it.type === 'event');
    fixedItems.sort((a, b) => a.startTime.localeCompare(b.startTime));

    const freeBlocks: FreeTimeBlock[] = [];
    let currentMin = this.timeToMinutes('08:00');
    const dayEndMin = this.timeToMinutes('22:00');

    for (const item of fixedItems) {
      const itemStartMin = this.timeToMinutes(item.startTime);
      const itemEndMin = this.timeToMinutes(item.endTime);

      if (itemStartMin > currentMin) {
        const gap = itemStartMin - currentMin;
        if (gap >= minMinutes) {
          freeBlocks.push({
            start: this.minutesToDate(currentMin),
            end: this.minutesToDate(itemStartMin),
            durationMinutes: gap,
            label: `${this.minutesToTime(currentMin)} – ${this.minutesToTime(itemStartMin)} (${Math.floor(gap / 60)}h ${gap % 60}m free)`,
          });
        }
      }
      currentMin = Math.max(currentMin, itemEndMin);
    }

    if (currentMin < dayEndMin) {
      const gap = dayEndMin - currentMin;
      if (gap >= minMinutes) {
        freeBlocks.push({
          start: this.minutesToDate(currentMin),
          end: this.minutesToDate(dayEndMin),
          durationMinutes: gap,
          label: `${this.minutesToTime(currentMin)} – ${this.minutesToTime(dayEndMin)} (${Math.floor(gap / 60)}h ${gap % 60}m free)`,
        });
      }
    }

    return freeBlocks;
  }

  /**
   * Detects if a new proposed event overlaps with existing commitments.
   */
  static detectConflict(
    proposedStart: string,
    proposedEnd: string,
    existingItems: DailyScheduleItem[]
  ): { hasConflict: boolean; conflictingItem?: DailyScheduleItem } {
    const pStart = this.timeToMinutes(proposedStart);
    const pEnd = this.timeToMinutes(proposedEnd);

    for (const item of existingItems) {
      if (item.type === 'free_block') continue;
      const iStart = this.timeToMinutes(item.startTime);
      const iEnd = this.timeToMinutes(item.endTime);

      // Overlap condition: start < otherEnd && end > otherStart
      if (pStart < iEnd && pEnd > iStart) {
        return { hasConflict: true, conflictingItem: item };
      }
    }

    return { hasConflict: false };
  }

  static timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  static minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  }

  static minutesToDate(minutes: number): Date {
    const d = new Date();
    d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return d;
  }
}
