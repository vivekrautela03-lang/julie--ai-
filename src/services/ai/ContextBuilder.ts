// =============================================================================
// PROJECT JULIE — CONTEXT BUILDER ENGINE
// Synthesizes essential context: today & tomorrow timetable, live weather,
// 60.34% attendance stats, tasks, intentions, and semantic memory.
// =============================================================================

import { db, CURRENT_USER_ID } from '@/core/storage/db';
import { AttendanceEngine } from '@/services/attendance/AttendanceEngine';
import { MemoryEngine } from '@/services/memory/MemoryEngine';
import { OFFICIAL_WEEKLY_TIMETABLE } from '@/core/data/userTimetable';
import { OFFICIAL_ATTENDANCE_OVERALL } from '@/core/data/userAttendance';

export interface StructuredJulieContext {
  current_time: string;
  current_date: string;
  user_name: string;
  user_title: string;
  next_event?: string;
  today_classes: {
    code: string;
    name: string;
    time: string;
    room?: string;
    faculty?: string;
  }[];
  tomorrow_classes: {
    code: string;
    name: string;
    time: string;
    room?: string;
    faculty?: string;
  }[];
  pending_tasks: {
    id: string;
    title: string;
    priority: string;
    due?: string;
  }[];
  active_intentions: {
    content: string;
    window: string;
  }[];
  overall_attendance: string;
  attendance_alerts: string[];
  relevant_memories: string[];
}

export class ContextBuilder {
  /**
   * Assembles the structured context object for model reasoning.
   */
  static async buildContext(userQuery?: string): Promise<StructuredJulieContext> {
    const userId = CURRENT_USER_ID;
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sun, 1 = Mon, ..., 3 = Wed, 4 = Thu
    const todayDayIndex = currentDay === 0 ? 1 : Math.min(6, currentDay);
    const tomorrowDayIndex = todayDayIndex >= 6 ? 1 : todayDayIndex + 1;

    const profile = await db.profiles.where('user_id').equals(userId).first();
    const prefs = await db.preferences.where('user_id').equals(userId).first();
    const title = prefs?.call_user_boss ? (prefs.custom_title || 'Boss') : (profile?.preferred_name || 'Boss');

    // 1. Classes & Schedule for Today and Tomorrow
    const todayClasses = OFFICIAL_WEEKLY_TIMETABLE.filter(
      c => c.day_of_week === todayDayIndex
    ).sort((a, b) => a.start_time.localeCompare(b.start_time));

    const tomorrowClasses = OFFICIAL_WEEKLY_TIMETABLE.filter(
      c => c.day_of_week === tomorrowDayIndex
    ).sort((a, b) => a.start_time.localeCompare(b.start_time));

    // Next event computation
    const currentHourMin = now.toTimeString().substring(0, 5);
    const upcomingClass = todayClasses.find(c => c.start_time.substring(0, 5) > currentHourMin);

    // 2. Tasks
    const tasks = await db.tasks.where('user_id').equals(userId).toArray();
    const pending = tasks
      .filter(t => t.status !== 'Completed' && t.status !== 'Cancelled')
      .slice(0, 5);

    // 3. Intentions
    const intentions = await db.intentions.where('user_id').equals(userId).toArray();
    const activeInts = intentions.filter(i => i.status === 'active' || i.status === 'scheduled');

    // 4. Attendance calculation
    const subjects = await db.subjects.toArray();
    const records = await db.attendance.toArray();
    const alerts: string[] = [];

    for (const sub of subjects) {
      const subRecs = records.filter(r => r.subject_id === sub.id);
      const summary = AttendanceEngine.summarizeSubject(sub, subRecs);
      if (summary.status_level === 'Critical' || summary.percentage < 75.0) {
        alerts.push(`${sub.subject_code} (${sub.subject_name}): ${summary.percentage}% (Need ${Math.abs(summary.safe_misses)} consecutive classes)`);
      }
    }

    // 5. Relevant Memories
    let mems: string[] = [];
    if (userQuery) {
      const retrieved = await MemoryEngine.searchRelevantMemories(userQuery, 3);
      mems = retrieved.map(m => m.content);
    } else {
      const topMems = await db.memories.where('user_id').equals(userId).toArray();
      mems = topMems.slice(0, 3).map(m => m.content);
    }

    const overallAttended = records.filter(r => r.status === 'attended').length || OFFICIAL_ATTENDANCE_OVERALL.totalPresent;
    const overallTotal = records.length || OFFICIAL_ATTENDANCE_OVERALL.totalLectures;
    const overallPct = AttendanceEngine.calculatePercentage(overallAttended, overallTotal);

    return {
      current_time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      current_date: now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      user_name: profile?.full_name || 'Vivek',
      user_title: title,
      next_event: upcomingClass ? `${upcomingClass.subject_name} at ${upcomingClass.start_time.substring(0, 5)}` : 'No further classes today',
      today_classes: todayClasses.map(c => ({
        code: c.subject_code || '',
        name: c.subject_name || '',
        time: `${c.start_time.substring(0, 5)}–${c.end_time.substring(0, 5)}`,
        room: c.room_number ? `Room ${c.room_number}` : 'Room 304',
        faculty: c.faculty_name,
      })),
      tomorrow_classes: tomorrowClasses.map(c => ({
        code: c.subject_code || '',
        name: c.subject_name || '',
        time: `${c.start_time.substring(0, 5)}–${c.end_time.substring(0, 5)}`,
        room: c.room_number ? `Room ${c.room_number}` : 'Room 304',
        faculty: c.faculty_name,
      })),
      pending_tasks: pending.map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        due: t.due_date ? new Date(t.due_date).toLocaleDateString() : undefined,
      })),
      active_intentions: activeInts.map(i => ({
        content: i.content,
        window: i.time_window,
      })),
      overall_attendance: `${overallPct}% (${overallAttended}/${overallTotal} lectures)`,
      attendance_alerts: alerts,
      relevant_memories: mems,
    };
  }
}
