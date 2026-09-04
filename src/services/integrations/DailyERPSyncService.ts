// =============================================================================
// PROJECT JULIE — DAILY ONCE-PER-DAY ERP AUTO-SYNC SERVICE
// Ensures Julie automatically synchronizes Uttaranchal University ERP data once per day,
// manages daily schedule alerts, updates attendance standings, and notifies the user.
// =============================================================================

import { uuerpAdapter } from './UttaranchalUniversityERPAdapter';
import { ERPAuthVault } from './ERPAuthVault';
import { db, CURRENT_USER_ID } from '@/core/storage/db';

export interface DailySyncStatus {
  isEnabled: boolean;
  lastSyncDate: string | null; // e.g. '2026-08-20'
  lastSyncTime: string | null; // e.g. '07:42 AM'
  isSyncedToday: boolean;
  nextScheduledSync: string; // e.g. 'Tomorrow at 06:00 AM'
  syncCount: number;
}

export class DailyERPSyncService {
  private static STORAGE_KEY = 'julie_daily_erp_sync_state';
  private static intervalId: any = null;

  /**
   * Retrieves the current daily synchronization status.
   */
  static getStatus(): DailySyncStatus {
    const today = new Date().toISOString().split('T')[0];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const isSyncedToday = parsed.lastSyncDate === today;
        return {
          isEnabled: parsed.isEnabled ?? true,
          lastSyncDate: parsed.lastSyncDate || null,
          lastSyncTime: parsed.lastSyncTime || null,
          isSyncedToday,
          nextScheduledSync: isSyncedToday ? 'Tomorrow at 06:00 AM' : 'Today (Pending)',
          syncCount: parsed.syncCount || 1,
        };
      }
    } catch (e) {
      console.warn('[DailyERPSyncService] Status read note:', e);
    }

    return {
      isEnabled: true,
      lastSyncDate: null,
      lastSyncTime: null,
      isSyncedToday: false,
      nextScheduledSync: 'Connect to begin',
      syncCount: 0,
    };
  }

  /**
   * Saves daily synchronization status.
   */
  private static saveStatus(status: Partial<DailySyncStatus>): void {
    const current = this.getStatus();
    const updated = { ...current, ...status };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  /**
   * Checks if today's 1-time sync is needed. If so, executes it.
   */
  static async checkAndRunDailySync(force: boolean = false): Promise<boolean> {
    const status = this.getStatus();
    const today = new Date().toISOString().split('T')[0];

    if (!status.isEnabled && !force) {
      return false;
    }

    // If already synced today and not forced, skip to conserve network/session
    if (status.lastSyncDate === today && !force) {
      return true;
    }

    try {
      console.log('[DailyERPSyncService] Executing authorized daily 1-time ERP sync for:', today);
      const result = await uuerpAdapter.sync();

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.saveStatus({
        lastSyncDate: today,
        lastSyncTime: timeStr,
        isSyncedToday: true,
        syncCount: (status.syncCount || 0) + 1,
      });

      // Add notification for the user
      await db.notifications.add({
        id: `notif-daily-erp-${Date.now()}`,
        user_id: CURRENT_USER_ID,
        title: '🎓 Daily UU-ERP Data Synchronized',
        body: result.detectedChanges[0] || `Julie synchronized ${result.syncedAttendanceCount} attendance records across ${result.syncedSubjectsCount} subjects.`,
        category: 'Daily Briefing',
        urgency_level: 'Normal',
        is_read: false,
        is_dismissed: false,
        created_at: new Date().toISOString(),
      });

      return true;
    } catch (err: any) {
      console.warn('[DailyERPSyncService] Daily sync note:', err.message);
      return false;
    }
  }

  /**
   * Starts the background interval that checks once every 15 minutes if a new calendar day has started.
   */
  static start(): void {
    if (this.intervalId) return;

    // Run on startup
    this.checkAndRunDailySync(false);

    // Check periodically (every 15 minutes) for day transitions
    this.intervalId = setInterval(() => {
      this.checkAndRunDailySync(false);
    }, 15 * 60 * 1000);
  }

  /**
   * Stops the background monitor.
   */
  static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Toggles the daily sync feature on/off.
   */
  static toggleEnabled(enabled: boolean): void {
    this.saveStatus({ isEnabled: enabled });
  }
}
