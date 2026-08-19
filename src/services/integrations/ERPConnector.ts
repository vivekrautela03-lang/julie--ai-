// =============================================================================
// PROJECT JULIE — COLLEGE ERP CONNECTOR ARCHITECTURE
// Modular ERP adapter interface. Follows strict security & non-faking rules.
// =============================================================================

import type { Subject, ClassSchedule, AttendanceRecord, Assignment, Exam } from '@/core/types';

export interface ERPUserProfile {
  studentId: string;
  fullName: string;
  rollNumber: string;
  semester: number;
  program: string;
  universityName: string;
}

export interface ERPSyncResult {
  success: boolean;
  timestamp: string;
  syncedSubjectsCount: number;
  syncedClassesCount: number;
  syncedAttendanceCount: number;
  detectedChanges: string[];
}

export interface ERPNotice {
  id: string;
  title: string;
  date: string;
  department: string;
  content: string;
}

/**
 * Base abstract ERP connector.
 * All institution-specific connectors (Moodle, Canvas, PeopleSoft, TCS iON, SAP, Custom Portal)
 * implement this contract.
 */
export interface CollegeERPConnector {
  providerName: string;
  authenticate(credentials: { apiKey?: string; token?: string; portalUrl?: string }): Promise<boolean>;
  getProfile(): Promise<ERPUserProfile>;
  getTimetable(): Promise<ClassSchedule[]>;
  getAttendance(): Promise<AttendanceRecord[]>;
  getAssignments(): Promise<Assignment[]>;
  getExams(): Promise<Exam[]>;
  getNotices(): Promise<ERPNotice[]>;
  sync(): Promise<ERPSyncResult>;
}
