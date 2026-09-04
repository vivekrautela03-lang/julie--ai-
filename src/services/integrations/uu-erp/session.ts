// =============================================================================
// PROJECT JULIE — REAL UU-ERP SESSION & METADATA MANAGER
// Manages real lifecycle states (DISCONNECTED, CONNECTED, SESSION_EXPIRED)
// and tracks synchronization timestamps with zero mock fallbacks.
// =============================================================================

import type { ERPConnectionState, UUERPSyncMetadata, UUERPStudentProfile } from './types';

const STORAGE_KEY_META = 'julie_uuerp_sync_meta';
const STORAGE_KEY_PROFILE = 'julie_uuerp_student_profile';

export class UEUERPSessionManager {
  private static currentState: ERPConnectionState = 'DISCONNECTED';
  private static listeners: Set<(state: ERPConnectionState) => void> = new Set();

  /**
   * Returns whether Julie is running inside the native Electron desktop shell.
   */
  static isElectronEnvironment(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!(window as any).electronAPI &&
      (window as any).electronAPI.isElectron === true
    );
  }

  /**
   * Subscribe to connection state changes
   */
  static subscribe(listener: (state: ERPConnectionState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  static setState(newState: ERPConnectionState, errorMsg?: string): void {
    this.currentState = newState;
    const meta = this.getMetadata();
    meta.syncStatus = newState;
    if (errorMsg) meta.errorMessage = errorMsg;
    this.saveMetadata(meta);

    this.listeners.forEach((fn) => {
      try {
        fn(newState);
      } catch (e) {
        console.error('[UUERPSessionManager] Listener notification error:', e);
      }
    });
  }

  static getState(): ERPConnectionState {
    const meta = this.getMetadata();
    return meta.syncStatus || this.currentState;
  }

  static isConnected(): boolean {
    return this.getState() === 'CONNECTED' || this.getState() === 'SYNCING';
  }

  /**
   * Retrieves synchronization metadata.
   */
  static getMetadata(): UUERPSyncMetadata {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_META);
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch (e) {
      console.warn('[UUERPSessionManager] Metadata read error:', e);
    }

    return {
      syncStatus: 'DISCONNECTED',
      dataSource: 'local_cache',
    };
  }

  static saveMetadata(meta: Partial<UUERPSyncMetadata>): void {
    try {
      if (typeof window !== 'undefined') {
        const current = this.getMetadata();
        const updated = { ...current, ...meta };
        localStorage.setItem(STORAGE_KEY_META, JSON.stringify(updated));
      }
    } catch (e) {
      console.error('[UUERPSessionManager] Metadata save error:', e);
    }
  }

  /**
   * Records a successful sync timestamp.
   */
  static recordSyncSuccess(): void {
    const now = new Date().toISOString();
    this.saveMetadata({
      lastSyncAt: now,
      lastSuccessfulSyncAt: now,
      syncStatus: 'CONNECTED',
      dataSource: 'uuerp.uudoon.in',
      errorMessage: undefined,
    });
    this.currentState = 'CONNECTED';
  }

  /**
   * Records session expiration while preserving lastSuccessfulSyncAt.
   */
  static recordSessionExpired(reason?: string): void {
    this.setState('SESSION_EXPIRED', reason || 'Authenticated session has expired on UU-ERP portal');
  }

  /**
   * Retrieves saved student profile
   */
  static getProfile(): Partial<UUERPStudentProfile> | null {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
        if (raw) return JSON.parse(raw);
      }
    } catch {
      // Storage read fallback
    }
    return null;
  }

  static saveProfile(profile: Partial<UUERPStudentProfile>): void {
    try {
      if (typeof window !== 'undefined') {
        const current = this.getProfile() || {};
        localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify({ ...current, ...profile }));
      }
    } catch (e) {
      console.error('[UUERPSessionManager] Profile save error:', e);
    }
  }

  /**
   * Clears saved state on explicit user disconnect
   */
  static clearSession(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_META);
        localStorage.removeItem(STORAGE_KEY_PROFILE);
      }
    } catch {}
    this.currentState = 'DISCONNECTED';
    this.listeners.forEach((fn) => fn('DISCONNECTED'));
  }

  /**
   * Formats a human-readable data freshness string
   * e.g. "Attendance synchronized 4 minutes ago"
   */
  static getFreshnessDescription(): string {
    const meta = this.getMetadata();
    if (!meta.lastSuccessfulSyncAt) {
      return 'No synchronization performed yet.';
    }

    const diffMs = Date.now() - new Date(meta.lastSuccessfulSyncAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    let timeString = '';
    if (diffMins < 1) {
      timeString = 'just now';
    } else if (diffMins < 60) {
      timeString = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      timeString = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      timeString = new Date(meta.lastSuccessfulSyncAt).toLocaleDateString();
    }

    if (meta.syncStatus === 'SESSION_EXPIRED') {
      const timeOnly = new Date(meta.lastSuccessfulSyncAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `Your UU-ERP session has expired. Showing attendance from your last successful synchronization at ${timeOnly}.`;
    }

    return `Attendance synchronized ${timeString}.`;
  }
}
