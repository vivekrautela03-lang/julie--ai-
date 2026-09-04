// =============================================================================
// PROJECT JULIE — UU-ERP BROWSER SESSION CONNECTOR (IPC BRIDGE)
// Safely communicates with privileged Electron main process to open
// human-in-the-loop login window and execute authenticated page requests.
// =============================================================================

import { UEUERPSessionManager } from './session';

export interface LoginResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface FetchResult {
  success: boolean;
  html?: string;
  status?: number;
  redirectedToLogin?: boolean;
  error?: string;
}

export class UUERPBrowserSession {
  /**
    * Opens the real UU-ERP login page in an authentic Electron browser window or direct popup.
    * Prompts the user to enter their User ID, Password, and solve the live CAPTCHA.
    */
  static async openLoginWindow(): Promise<LoginResult> {
    UEUERPSessionManager.setState('CONNECTING');

    if (!UEUERPSessionManager.isElectronEnvironment()) {
      // In web browser / Vercel: open official UU-ERP portal directly
      try {
        const portalUrl = 'https://uuerp.uudoon.in/Account/Login_UU';
        window.open(portalUrl, 'UUERPPortal', 'width=1100,height=800,menubar=no,toolbar=no');
        UEUERPSessionManager.setState('CONNECTED');
        return {
          success: true,
          url: portalUrl,
        };
      } catch (e: any) {
        UEUERPSessionManager.setState('DISCONNECTED', e.message);
        return { success: false, error: e.message };
      }
    }

    try {
      const electronAPI = (window as any).electronAPI;
      const result = await electronAPI.uuerp.openLogin();

      if (result.success) {
        UEUERPSessionManager.setState('CONNECTED');
        return { success: true, url: result.url };
      } else {
        UEUERPSessionManager.setState(
          'DISCONNECTED',
          result.error || 'Authentication canceled or not completed'
        );
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      UEUERPSessionManager.setState('SYNC_ERROR', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetches an authenticated page (e.g. attendance module) using the active session partition.
   */
  static async fetchAuthenticatedPage(targetUrl?: string): Promise<FetchResult> {
    if (!UEUERPSessionManager.isElectronEnvironment()) {
      return {
        success: false,
        error: 'Native Electron session bridge unavailable.',
      };
    }

    try {
      const electronAPI = (window as any).electronAPI;
      const res = await electronAPI.uuerp.fetchPage(targetUrl);

      if (res.redirectedToLogin) {
        UEUERPSessionManager.recordSessionExpired('Portal redirected to login page');
        return {
          success: false,
          redirectedToLogin: true,
          error: 'Session expired. Please reconnect to UU-ERP.',
        };
      }

      if (res.success && res.html) {
        return {
          success: true,
          html: res.html,
          status: res.status,
        };
      }

      return {
        success: false,
        status: res.status,
        error: res.error || 'Failed to fetch page from ERP portal.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Checks whether the current session is alive on the university server.
   */
  static async verifySession(): Promise<boolean> {
    if (!UEUERPSessionManager.isElectronEnvironment()) return false;

    try {
      const electronAPI = (window as any).electronAPI;
      const res = await electronAPI.uuerp.checkSession();
      if (res && res.valid) {
        return true;
      } else if (res && res.hasCookies && !res.valid) {
        UEUERPSessionManager.recordSessionExpired('Session verification failed on ERP server');
        return false;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Clears cookies and disconnects session.
   */
  static async disconnect(): Promise<void> {
    if (UEUERPSessionManager.isElectronEnvironment()) {
      try {
        const electronAPI = (window as any).electronAPI;
        await electronAPI.uuerp.clearSession();
      } catch (e) {
        console.error('[UUERPBrowserSession] Clear session error:', e);
      }
    }
    UEUERPSessionManager.clearSession();
  }
}
