// =============================================================================
// PROJECT JULIE — UTTARANCHAL UNIVERSITY CYBORG-ERP DIRECT CONNECTOR
// Official Portal: https://uuerp.uudoon.in
// Human-in-the-Loop Real Login + Privileged Session Extraction + Zero Mock Data
// =============================================================================

import { db, CURRENT_USER_ID } from '@/core/storage/db';
import { ERPAuthVault, type ERPAuthSession } from './ERPAuthVault';
import type { CollegeERPConnector, ERPUserProfile, ERPSyncResult, ERPNotice } from './ERPConnector';
import type { ClassSchedule, AttendanceRecord, Assignment, Exam } from '@/core/types';
import {
  UUERPSyncEngine,
  UUERPBrowserSession,
  UEUERPSessionManager,
  type ERPConnectionState,
} from './uu-erp';

export class UttaranchalUniversityERPAdapter implements CollegeERPConnector {
  providerName = 'Uttaranchal University Cyborg-ERP';
  loginUrl = 'https://uuerp.uudoon.in/Account/Login_UU';
  attendanceUrl =
    'https://uuerp.uudoon.in/Web_StudentAcademic/Cyborg_StudentAttendanceAcademic';

  /**
   * Retrieves the current saved ERP session state.
   */
  getSavedConfig(): ERPAuthSession {
    const meta = UEUERPSessionManager.getMetadata();
    const profile = UEUERPSessionManager.getProfile();
    const vaultSession = ERPAuthVault.getSession();

    const mappedStatus: ERPAuthSession['status'] =
      meta.syncStatus === 'CONNECTED'
        ? 'connected'
        : meta.syncStatus === 'SESSION_EXPIRED'
        ? 'expired'
        : meta.syncStatus === 'CONNECTING' || meta.syncStatus === 'SYNCING'
        ? 'requires_verification'
        : 'disconnected';

    return {
      provider: this.providerName,
      portalUrl: this.loginUrl,
      studentId: profile?.studentId || vaultSession.studentId || '',
      studentName: profile?.studentName || vaultSession.studentName || undefined,
      program: profile?.program || vaultSession.program || undefined,
      semester: profile?.semester || vaultSession.semester || undefined,
      status: mappedStatus,
      lastSyncedAt: meta.lastSuccessfulSyncAt
        ? new Date(meta.lastSuccessfulSyncAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : undefined,
    };
  }

  /**
   * Triggers the real login flow by opening the genuine university login page in Electron.
   */
  async authenticate(): Promise<boolean> {
    const res = await UUERPBrowserSession.openLoginWindow();
    if (res.success) {
      // Immediately trigger initial sync upon successful authentication
      await this.sync();
      return true;
    }
    return false;
  }

  /**
   * High-level login action triggered from the UI.
   */
  async login(): Promise<ERPSyncResult> {
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      throw new Error('Authentication was not completed. Please solve the CAPTCHA and log in.');
    }
    return await this.sync();
  }

  /**
   * Clears session and disconnects from the ERP.
   */
  logout(): void {
    UUERPBrowserSession.disconnect();
    ERPAuthVault.clearSession();
  }

  /**
   * Returns authorized student profile.
   */
  async getProfile(): Promise<ERPUserProfile> {
    const profile = UEUERPSessionManager.getProfile();
    const session = this.getSavedConfig();

    return {
      studentId: profile?.studentId || session.studentId || 'Authenticated Student',
      fullName: profile?.studentName || session.studentName || 'Student',
      rollNumber: profile?.rollNo || profile?.studentId || session.studentId || '',
      semester: profile?.semester || session.semester || 1,
      program: profile?.program || session.program || 'Uttaranchal University Academic Program',
      universityName: 'Uttaranchal University, Dehradun',
    };
  }

  /**
   * Retrieves timetable classes from the local database.
   */
  async getTimetable(): Promise<ClassSchedule[]> {
    return await db.classes.toArray();
  }

  /**
   * Retrieves live subject-wise attendance records from the local database.
   */
  async getAttendance(): Promise<AttendanceRecord[]> {
    return await db.attendance.toArray();
  }

  /**
   * Retrieves assignments from local database.
   */
  async getAssignments(): Promise<Assignment[]> {
    return await db.assignments.toArray();
  }

  /**
   * Retrieves examinations from local database.
   */
  async getExams(): Promise<Exam[]> {
    return await db.exams.toArray();
  }

  /**
   * Retrieves notices from ERP portal if available.
   */
  async getNotices(): Promise<ERPNotice[]> {
    return [];
  }

  /**
   * Synchronizes live data from the official UU-ERP portal.
   */
  async sync(): Promise<ERPSyncResult> {
    const result = await UUERPSyncEngine.sync();

    return {
      success: result.success,
      timestamp: new Date().toISOString(),
      syncedSubjectsCount: result.syncedSubjectsCount,
      syncedClassesCount: 0,
      syncedAttendanceCount: result.syncedAttendanceCount,
      detectedChanges: [
        result.message,
        result.overall
          ? `Overall attendance: ${result.overall.percentage}% (${result.overall.totalPresent}/${result.overall.totalLectures})`
          : '',
      ].filter(Boolean),
    };
  }
}

export const uuerpAdapter = new UttaranchalUniversityERPAdapter();
