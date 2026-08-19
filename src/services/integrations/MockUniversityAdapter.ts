// =============================================================================
// PROJECT JULIE — MOCK UNIVERSITY ERP ADAPTER
// Realistic development adapter for sandbox testing and simulated timetable changes
// =============================================================================

import type { CollegeERPConnector, ERPUserProfile, ERPSyncResult, ERPNotice } from './ERPConnector';
import type { ClassSchedule, AttendanceRecord, Assignment, Exam } from '@/core/types';
import { db, CURRENT_USER_ID } from '@/core/storage/db';

export class MockUniversityERPAdapter implements CollegeERPConnector {
  providerName = 'University Portal ERP (Demo / Sandbox)';
  private isAuth = true;

  async authenticate(_credentials: { apiKey?: string; token?: string; portalUrl?: string }): Promise<boolean> {
    this.isAuth = true;
    return true;
  }

  async getProfile(): Promise<ERPUserProfile> {
    return {
      studentId: 'STU-2024-8841',
      fullName: 'Shaurya Vardhan',
      rollNumber: '21BCE1042',
      semester: 5,
      program: 'B.Tech in Computer Science & Digital Media',
      universityName: 'Apex Institute of Technology & Design',
    };
  }

  async getTimetable(): Promise<ClassSchedule[]> {
    const todayDow = new Date().getDay() === 0 ? 7 : new Date().getDay();
    return [
      {
        id: 'c-001',
        user_id: CURRENT_USER_ID,
        subject_id: 'c0000000-0000-0000-0000-000000000001',
        subject_code: 'MKT301',
        subject_name: 'Marketing Management',
        faculty_name: 'Dr. Radhika Sharma',
        day_of_week: todayDow,
        start_time: '10:00:00',
        end_time: '11:30:00',
        room_number: 'Hall 402',
        class_type: 'Lecture',
        is_active: true,
      },
      {
        id: 'c-002',
        user_id: CURRENT_USER_ID,
        subject_id: 'c0000000-0000-0000-0000-000000000002',
        subject_code: 'ECO204',
        subject_name: 'Macroeconomics & Policy',
        faculty_name: 'Prof. Arvind Menon',
        day_of_week: todayDow,
        start_time: '14:00:00',
        end_time: '15:30:00',
        room_number: 'Hall 205',
        class_type: 'Lecture',
        is_active: true,
      },
      {
        id: 'c-003',
        user_id: CURRENT_USER_ID,
        subject_id: 'c0000000-0000-0000-0000-000000000003',
        subject_code: 'CS310',
        subject_name: 'Data Structures & Algorithms',
        faculty_name: 'Dr. K. S. Rao',
        day_of_week: todayDow,
        start_time: '16:00:00',
        end_time: '17:30:00',
        room_number: 'Lab 3',
        class_type: 'Lab',
        is_active: true,
      },
    ];
  }

  async getAttendance(): Promise<AttendanceRecord[]> {
    return await db.attendance.where('user_id').equals(CURRENT_USER_ID).toArray();
  }

  async getAssignments(): Promise<Assignment[]> {
    return [
      {
        id: 'asg-001',
        user_id: CURRENT_USER_ID,
        subject_id: 'c0000000-0000-0000-0000-000000000001',
        subject_name: 'Marketing Management',
        title: 'Marketing Case Study Assignment',
        description: 'Submit 4-page analysis on FMCG supply chain disruptions',
        due_date: new Date(Date.now() + 24 * 3600000).toISOString(),
        status: 'in_progress',
        weight_percentage: 15,
      },
    ];
  }

  async getExams(): Promise<Exam[]> {
    return [
      {
        id: 'ex-001',
        user_id: CURRENT_USER_ID,
        subject_id: 'c0000000-0000-0000-0000-000000000002',
        subject_name: 'Macroeconomics & Policy',
        title: 'Mid-term Quiz on Fiscal Policy',
        exam_date: new Date(Date.now() + 48 * 3600000).toISOString(),
        duration_minutes: 60,
        room_number: 'Hall 205',
        syllabus_summary: 'Chapters 3, 4, and 5 multiplier theory',
      },
    ];
  }

  async getNotices(): Promise<ERPNotice[]> {
    return [
      {
        id: 'not-01',
        title: 'Library Extended Hours During Midterms',
        date: new Date().toISOString().split('T')[0],
        department: 'Dean Academic Affairs',
        content: 'Central library will remain open until 2:00 AM beginning this Thursday.',
      },
    ];
  }

  /**
   * Performs full synchronization and detects differential changes.
   */
  async sync(): Promise<ERPSyncResult> {
    const timetable = await this.getTimetable();
    const attendance = await this.getAttendance();

    return {
      success: true,
      timestamp: new Date().toISOString(),
      syncedSubjectsCount: 3,
      syncedClassesCount: timetable.length,
      syncedAttendanceCount: attendance.length,
      detectedChanges: [],
    };
  }

  /**
   * Simulates the Acceptance Test #60 Timetable Shift:
   * 2 PM class moved to 3 PM -> Emits proactive alert and updates DB.
   */
  async simulateTimetableShift(classId: string = 'c-002'): Promise<{ message: string; notificationId: string }> {
    const existingClass = await db.classes.get(classId);
    if (!existingClass) {
      throw new Error('Class record not found');
    }

    // Update timetable record to 3:00 PM (15:00:00)
    await db.classes.update(classId, {
      start_time: '15:00:00',
      end_time: '16:30:00',
    });

    const notifTitle = 'Timetable Change Detected';
    const notifBody = `Boss, your timetable changed. Your 2:00 PM ${existingClass.subject_name || 'Macroeconomics'} class has moved to 3:00 PM.`;

    const notifId = `notif-shift-${Date.now()}`;
    await db.notifications.add({
      id: notifId,
      user_id: CURRENT_USER_ID,
      title: notifTitle,
      body: notifBody,
      category: 'College',
      urgency_level: 'High',
      action_payload: { action: 'open_schedule' },
      is_read: false,
      is_dismissed: false,
      created_at: new Date().toISOString(),
    });

    await db.actionLogs.add({
      id: `log-shift-${Date.now()}`,
      user_id: CURRENT_USER_ID,
      action_type: 'TIMETABLE_CHANGE_DETECTED',
      description: `Updated ${existingClass.subject_name} schedule from 14:00 to 15:00. Generated proactive notification.`,
      reason: 'ERP synchronization change detection',
      source: 'ERP Sync',
      user_confirmed: true,
      created_at: new Date().toISOString(),
    });

    return { message: notifBody, notificationId: notifId };
  }
}

export const erpService = new MockUniversityERPAdapter();
