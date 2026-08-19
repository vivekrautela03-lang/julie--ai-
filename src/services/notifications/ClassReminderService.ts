// =============================================================================
// PROJECT JULIE — 5-MINUTE PRE-CLASS REMINDER & NOTIFICATION SERVICE
// Checks live timetable and triggers "Reach Class Soon" alert 5 min before each class
// =============================================================================

import { db, CURRENT_USER_ID } from '@/core/storage/db';
import type { AppNotification } from '@/core/types';

export class ClassReminderService {
  private static intervalId: any = null;
  private static notifiedClassIds: Set<string> = new Set();

  /**
   * Starts the 5-minute pre-class reminder scheduler.
   */
  static start(): void {
    if (this.intervalId) return;

    // Request browser notification permission if available
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }

    // Run check immediately and every 15 seconds
    this.checkUpcomingClasses();
    this.intervalId = setInterval(() => this.checkUpcomingClasses(), 15000);
    console.log('[Class Reminder Service] 5-minute pre-class reminder engine active.');
  }

  static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Checks today's classes from the timetable and notifies 5 minutes prior to start.
   */
  static async checkUpcomingClasses(): Promise<void> {
    try {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTotalMins = currentHours * 60 + currentMinutes;

      const classes = await db.classes.where('day_of_week').equals(currentDay).toArray();
      if (!classes || classes.length === 0) return;

      const subjects = await db.subjects.toArray();

      for (const cls of classes) {
        if (!cls.start_time) continue;

        const [startH, startM] = cls.start_time.split(':').map(Number);
        const classTotalMins = startH * 60 + startM;
        const diffMins = classTotalMins - currentTotalMins;

        // Notification key for today (e.g. 2026-08-19-cls-001-5min)
        const todayDateStr = now.toISOString().split('T')[0];
        const notifKey = `${todayDateStr}-${cls.id}-5min`;

        // If class starts in 1 to 5 minutes (or right now) and not notified yet
        if (diffMins >= 0 && diffMins <= 5 && !this.notifiedClassIds.has(notifKey)) {
          this.notifiedClassIds.add(notifKey);

          const subject = subjects.find(s => s.id === cls.subject_id);
          const subName = subject?.subject_name || 'Upcoming Lecture';
          const subCode = subject?.subject_code || '';
          const room = cls.room_number ? `in Room ${cls.room_number}` : '';
          const faculty = cls.faculty_name ? `with ${cls.faculty_name}` : '';

          const title = `⏰ Reach Class Soon! ${subCode || subName} in ${diffMins === 0 ? 'a moment' : `${diffMins} min`}`;
          const body = `${subName} starts at ${cls.start_time} ${room} ${faculty}. Head to class now and mark attendance after!`.trim();

          // 1. Add notification to local database
          const notif: AppNotification = {
            id: `notif-class-5min-${Date.now()}`,
            user_id: CURRENT_USER_ID,
            title,
            body,
            category: 'College',
            urgency_level: 'Urgent',
            action_payload: {
              action: 'open_attendance',
            },
            is_read: false,
            is_dismissed: false,
            created_at: new Date().toISOString(),
          };
          await db.notifications.add(notif);

          // 2. Trigger browser native notification if permitted
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            try {
              new Notification(title, {
                body,
                icon: '/favicon.ico',
              });
            } catch (e) {}
          }

          console.log(`[Class Reminder 5-Min] Triggered alert for ${subName} (${cls.start_time})`);
        }
      }
    } catch (err) {
      console.warn('[Class Reminder Service] Check note:', err);
    }
  }
}
