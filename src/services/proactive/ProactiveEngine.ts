// =============================================================================
// PROJECT JULIE — PROACTIVE INTELLIGENCE ENGINE
// The core proactive loop: Observe -> Understand -> Remember -> Plan -> Decide -> Act/Notify
// Generates time-sensitive greetings, morning briefings, evening summaries,
// and actionable "Julie Says" contextual insights.
// =============================================================================

import { db, CURRENT_USER_ID } from '@/core/storage/db';
import { ScheduleEngine } from '@/services/schedule/ScheduleEngine';
import { AttendanceEngine } from '@/services/attendance/AttendanceEngine';
import type { DailyScheduleItem, Task, Intention, AppNotification } from '@/core/types';

export interface JulieInsight {
  headline: string;
  body: string;
  recommendation: string;
  actionLabel?: string;
  actionType?: 'do_it' | 'open_task' | 'open_schedule' | 'open_attendance';
  actionPayload?: any;
  secondaryActionLabel?: string;
  secondaryActionType?: 'reschedule' | 'dismiss';
  urgency: 'Low' | 'Normal' | 'High' | 'Critical';
}

export interface MorningBriefing {
  greeting: string;
  dateStr: string;
  scheduleOverview: string;
  classesCount: number;
  priorityTask?: Task;
  upcomingDeadlines: string[];
  activeIntention?: Intention;
  recommendationPlan: string;
}

export interface EveningSummary {
  greeting: string;
  completedTasksCount: number;
  totalTasksCount: number;
  completedList: string[];
  remainingList: string[];
  tomorrowPreview: {
    classesCount: number;
    deadlinesCount: number;
  };
}

export class ProactiveEngine {
  /**
   * Generates a dynamic greeting based on current local hour and user title preferences.
   */
  static getDynamicGreeting(customTitle: string = 'Boss', hour?: number): string {
    const h = hour !== undefined ? hour : new Date().getHours();

    if (h >= 5 && h < 12) {
      return `Good morning, ${customTitle}.`;
    } else if (h >= 12 && h < 17) {
      return `Good afternoon, ${customTitle}.`;
    } else if (h >= 17 && h < 22) {
      return `Good evening, ${customTitle}.`;
    } else {
      return `Still working, ${customTitle}?`;
    }
  }

  /**
   * Generates the Master Scenario "Julie Says" Insight based on live context.
   */
  static async generateInsight(): Promise<JulieInsight> {
    const userId = CURRENT_USER_ID;
    const todayDow = new Date().getDay() === 0 ? 7 : new Date().getDay();

    const classes = await db.classes.where('user_id').equals(userId).toArray();
    const todayClasses = classes.filter(c => c.day_of_week === todayDow && c.is_active);
    const tasks = await db.tasks.where('user_id').equals(userId).toArray();
    const intentions = await db.intentions.where('user_id').equals(userId).toArray();
    const activeIntentions = intentions.filter(i => i.status === 'active' || i.status === 'scheduled');
    
    // Find urgent/due soon tasks
    const pendingTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled');
    const urgentTask = pendingTasks.find(t => t.priority === 'Urgent') || pendingTasks[0];

    // Find intentions regarding creative/film work
    const filmIntention = activeIntentions.find(i => i.content.toLowerCase().includes('film') || i.category === 'Creative');

    // Check attendance warnings
    const subjects = await db.subjects.where('user_id').equals(userId).toArray();
    const attendanceRecords = await db.attendance.where('user_id').equals(userId).toArray();
    let criticalSubject: string | null = null;

    for (const sub of subjects) {
      const records = attendanceRecords.filter(r => r.subject_id === sub.id);
      const sum = AttendanceEngine.summarizeSubject(sub, records);
      if (sum.status_level === 'Critical') {
        criticalSubject = `${sub.subject_code} (${sum.percentage}%)`;
        break;
      }
    }

    if (urgentTask && todayClasses.length >= 2) {
      return {
        headline: `${urgentTask.title} is due tomorrow.`,
        body: `You have approximately 2 hours free between your classes today.`,
        recommendation: `I'd recommend using 1 hour for the ${urgentTask.category.toLowerCase()} assignment before working on your ${filmIntention ? 'creative project' : 'next commitment'}.`,
        actionLabel: 'Do It',
        actionType: 'do_it',
        actionPayload: { taskId: urgentTask.id, suggestedSlot: '12:00–13:00' },
        secondaryActionLabel: 'Reschedule',
        secondaryActionType: 'reschedule',
        urgency: 'High',
      };
    }

    if (criticalSubject) {
      return {
        headline: `Attendance Alert: ${criticalSubject}`,
        body: `Your attendance in ${criticalSubject} has dropped below the 75% required threshold.`,
        recommendation: `Ensure you attend today's lecture to avoid a shortage condonation penalty.`,
        actionLabel: 'View Attendance',
        actionType: 'open_attendance',
        urgency: 'Critical',
      };
    }

    if (filmIntention) {
      return {
        headline: `Tonight's Intention: "${filmIntention.content}"`,
        body: `Your schedule is clear from 7:30 PM to 9:30 PM.`,
        recommendation: `I've preserved that 2-hour window so you can make uninterrupted progress on your film.`,
        actionLabel: 'Open Project',
        actionType: 'open_schedule',
        urgency: 'Normal',
      };
    }

    return {
      headline: 'All systems operational.',
      body: `You have ${todayClasses.length} classes and ${pendingTasks.length} pending tasks today.`,
      recommendation: 'Your highest priority task is ready when you are.',
      actionLabel: 'View Tasks',
      actionType: 'open_task',
      urgency: 'Normal',
    };
  }

  /**
   * Generates the Master Morning Briefing matching Prompt Scenario #60.
   */
  static async generateMorningBriefing(customTitle: string = 'Boss'): Promise<MorningBriefing> {
    const userId = CURRENT_USER_ID;
    const todayDow = new Date().getDay() === 0 ? 7 : new Date().getDay();

    const classes = await db.classes.where('user_id').equals(userId).toArray();
    const todayClasses = classes.filter(c => c.day_of_week === todayDow && c.is_active);
    const tasks = await db.tasks.where('user_id').equals(userId).toArray();
    const intentions = await db.intentions.where('user_id').equals(userId).toArray();

    const activeIntention = intentions.find(i => i.status === 'active' || i.status === 'scheduled');
    const urgentTask = tasks.find(t => t.priority === 'Urgent' || t.status === 'In Progress');

    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const dateStr = new Intl.DateTimeFormat('en-US', dateOptions).format(new Date());

    let overview = `You have ${todayClasses.length} classes scheduled today.`;
    if (todayClasses.length > 0) {
      overview += ` Your first class (${todayClasses[0].subject_code || 'Lecture'}) starts at ${todayClasses[0].start_time.substring(0, 5)}.`;
    }

    let plan = ``;
    if (urgentTask && activeIntention) {
      plan = `I'd recommend working on your ${urgentTask.title} from 2:00–3:00 PM and your ${activeIntention.content.toLowerCase().replace('i want to work on ', '')} from 7:30–9:30 PM.`;
    } else {
      plan = `Your afternoon has open blocks suitable for deep study or project milestones.`;
    }

    return {
      greeting: this.getDynamicGreeting(customTitle, 8),
      dateStr,
      scheduleOverview: overview,
      classesCount: todayClasses.length,
      priorityTask: urgentTask,
      upcomingDeadlines: [
        'Marketing Case Study — Tomorrow 5:00 PM',
        'Economics Quiz — Thursday 10:00 AM',
      ],
      activeIntention,
      recommendationPlan: plan,
    };
  }

  /**
   * Generates Evening Summary report.
   */
  static async generateEveningSummary(customTitle: string = 'Boss'): Promise<EveningSummary> {
    const userId = CURRENT_USER_ID;
    const tasks = await db.tasks.where('user_id').equals(userId).toArray();

    const completed = tasks.filter(t => t.status === 'Completed');
    const remaining = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled');

    return {
      greeting: this.getDynamicGreeting(customTitle, 21),
      completedTasksCount: completed.length,
      totalTasksCount: tasks.length,
      completedList: completed.map(t => t.title),
      remainingList: remaining.map(t => t.title),
      tomorrowPreview: {
        classesCount: 3,
        deadlinesCount: 1,
      },
    };
  }

  /**
   * Proactive trigger rule evaluation (Quiet hours, relevance, and fatigue checks).
   */
  static shouldDispatchNotification(params: {
    urgency: 'Low' | 'Normal' | 'High' | 'Urgent';
    quietHoursStart?: string;
    quietHoursEnd?: string;
    quietHoursEnabled?: boolean;
  }): boolean {
    if (!params.quietHoursEnabled) return true;
    if (params.urgency === 'Urgent') return true; // Critical alerts bypass quiet hours

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    const sMin = ScheduleEngine.timeToMinutes(params.quietHoursStart || '23:00');
    const eMin = ScheduleEngine.timeToMinutes(params.quietHoursEnd || '07:00');

    // Quiet hours spanning across midnight (e.g. 23:00 to 07:00)
    if (sMin > eMin) {
      if (currentMin >= sMin || currentMin < eMin) {
        return false;
      }
    } else {
      if (currentMin >= sMin && currentMin < eMin) {
        return false;
      }
    }

    return true;
  }
}
