// =============================================================================
// PROJECT JULIE — OFFLINE-FIRST PERSISTENT STORAGE (DEXIE / INDEXEDDB)
// Provides full offline persistence, real-time reactive hooks, and sync queue
// =============================================================================

import Dexie, { type Table } from 'dexie';
import type {
  Profile,
  UserPreferences,
  Task,
  TaskSubtask,
  Project,
  ProjectMilestone,
  Subject,
  ClassSchedule,
  AttendanceRecord,
  Assignment,
  Exam,
  CalendarEvent,
  Intention,
  Memory,
  AppNotification,
  AIActionLog,
  ChatSession,
  ConversationMessage,
  FileItem,
} from '../types';

export class JulieDatabase extends Dexie {
  profiles!: Table<Profile, string>;
  preferences!: Table<UserPreferences, string>;
  tasks!: Table<Task, string>;
  subtasks!: Table<TaskSubtask, string>;
  projects!: Table<Project, string>;
  milestones!: Table<ProjectMilestone, string>;
  subjects!: Table<Subject, string>;
  classes!: Table<ClassSchedule, string>;
  attendance!: Table<AttendanceRecord, string>;
  assignments!: Table<Assignment, string>;
  exams!: Table<Exam, string>;
  events!: Table<CalendarEvent, string>;
  intentions!: Table<Intention, string>;
  memories!: Table<Memory, string>;
  notifications!: Table<AppNotification, string>;
  actionLogs!: Table<AIActionLog, string>;
  conversations!: Table<ChatSession, string>;
  messages!: Table<ConversationMessage, string>;
  files!: Table<FileItem, string>;
  syncQueue!: Table<{ id: string; table: string; action: string; payload: any; timestamp: string }, string>;

  constructor() {
    super('JulieExecutiveDB');

    this.version(1).stores({
      profiles: 'id, user_id, email',
      preferences: 'id, user_id',
      tasks: 'id, user_id, project_id, status, priority, due_date, category',
      subtasks: 'id, task_id, sort_order',
      projects: 'id, user_id, status, category',
      milestones: 'id, project_id, is_completed',
      subjects: 'id, user_id, subject_code',
      classes: 'id, user_id, subject_id, day_of_week',
      attendance: 'id, user_id, subject_id, date, status',
      assignments: 'id, user_id, subject_id, due_date, status',
      exams: 'id, user_id, subject_id, exam_date',
      events: 'id, user_id, start_time, end_time, category',
      intentions: 'id, user_id, status, category, priority',
      memories: 'id, user_id, memory_type, category, topic_tag',
      notifications: 'id, user_id, is_read, is_dismissed, category, created_at',
      actionLogs: 'id, user_id, action_type, source, created_at',
      conversations: 'id, user_id, title, project_tag, updated_at, created_at',
      messages: 'id, conversation_id, user_id, created_at',
      files: 'id, user_id, project_id, subject_id, file_type',
      syncQueue: 'id, table, action, timestamp',
    });
  }
}

export const db = new JulieDatabase();

// -----------------------------------------------------------------------------
// Seed Database with Master Scenario Data if Empty
// -----------------------------------------------------------------------------
export const CURRENT_USER_ID = 'a0000000-0000-0000-0000-000000000001';

export async function initializeDatabase() {
  const profileCount = await db.profiles.count();
  if (profileCount > 0) return;

  console.log('[Project Julie] Initializing local database with master production state...');

  const userId = CURRENT_USER_ID;
  const filmProjectId = 'b0000000-0000-0000-0000-000000000001';
  const mktSubjectId = 'c0000000-0000-0000-0000-000000000001';
  const ecoSubjectId = 'c0000000-0000-0000-0000-000000000002';
  const csSubjectId = 'c0000000-0000-0000-0000-000000000003';
  const mktTaskId = 'd0000000-0000-0000-0000-000000000001';

  // 1. Profile & Preferences
  await db.profiles.add({
    id: 'p-001',
    user_id: userId,
    email: 'boss@julie.ai',
    full_name: 'Shaurya Vardhan',
    preferred_name: 'Boss',
    timezone: 'Asia/Kolkata',
    wake_time: '07:00:00',
    sleep_time: '23:30:00',
  });

  await db.preferences.add({
    id: 'pref-001',
    user_id: userId,
    assistant_name: 'Julie',
    assistant_tone: 'Confident & Proactive',
    call_user_boss: true,
    custom_title: 'Boss',
    morning_briefing_time: '08:00:00',
    morning_briefing_enabled: true,
    evening_briefing_time: '21:30:00',
    evening_briefing_enabled: true,
    quiet_hours_start: '23:00:00',
    quiet_hours_end: '07:00:00',
    quiet_hours_enabled: true,
    proactive_suggestions_enabled: true,
    attendance_threshold: 75.0,
    voice_enabled: true,
    voice_persona: 'natural-executive',
    theme: 'dark-cinematic',
  });

  // 2. Projects
  await db.projects.bulkAdd([
    {
      id: filmProjectId,
      user_id: userId,
      title: 'Short Film: Echoes of Silence',
      description: 'Independent sci-fi short film project in post-production phase',
      category: 'Film',
      status: 'active',
      progress_percentage: 65,
      target_deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
      color_code: '#8B5CF6',
      ai_context_notes: 'User intends to finish the rough audio mix and scene sequence today.',
    },
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      user_id: userId,
      title: 'Semester 5 Capstone Research',
      description: 'Comparative study on consumer psychology in digital markets',
      category: 'Academic',
      status: 'active',
      progress_percentage: 40,
      target_deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
      color_code: '#38BDF8',
      ai_context_notes: 'Requires 2 more market study case syntheses.',
    },
  ]);

  // 3. Subjects & Weekly Timetable from Uttaranchal University Cyborg-ERP
  const { OFFICIAL_SUBJECTS, OFFICIAL_WEEKLY_TIMETABLE } = await import('../data/userTimetable');

  await db.subjects.bulkAdd(OFFICIAL_SUBJECTS);
  await db.classes.bulkAdd(OFFICIAL_WEEKLY_TIMETABLE);

  // 5. Attendance Records for all 7 Subjects (Exact figures from UU-ERP 08/07/2026 To 19/08/2026)
  const { OFFICIAL_SUBJECT_ATTENDANCE } = await import('../data/userAttendance');
  const attRecords: AttendanceRecord[] = [];

  for (const cfg of OFFICIAL_SUBJECT_ATTENDANCE) {
    const missed = cfg.totalConducted - cfg.totalPresent;
    for (let i = 1; i <= cfg.totalPresent; i++) {
      attRecords.push({
        id: `att-${cfg.subjectId}-a-${i}`,
        user_id: userId,
        subject_id: cfg.subjectId,
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        status: 'attended',
      });
    }
    for (let i = 1; i <= missed; i++) {
      attRecords.push({
        id: `att-${cfg.subjectId}-m-${i}`,
        user_id: userId,
        subject_id: cfg.subjectId,
        date: new Date(Date.now() - (i + 15) * 86400000).toISOString().split('T')[0],
        status: 'missed',
      });
    }
  }
  await db.attendance.bulkAdd(attRecords);

  // 6. Tasks & Subtasks
  const tomorrow = new Date(Date.now() + 24 * 3600000).toISOString();
  await db.tasks.bulkAdd([
    {
      id: mktTaskId,
      user_id: userId,
      project_id: null,
      title: 'Marketing Case Study Assignment',
      description: 'Submit 4-page analysis on FMCG supply chain disruptions',
      priority: 'Urgent',
      status: 'In Progress',
      due_date: tomorrow,
      estimated_duration_minutes: 90,
      category: 'College',
      recurrence: 'none',
      notes: 'Focus on omnichannel inventory strategy.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'd0000000-0000-0000-0000-000000000002',
      user_id: userId,
      project_id: filmProjectId,
      title: 'Rough Cut Sound Design & Color Grade',
      description: 'Work on scene 4 audio mix and export review link',
      priority: 'High',
      status: 'Planned',
      due_date: new Date(Date.now() + 12 * 3600000).toISOString(),
      estimated_duration_minutes: 120,
      category: 'Creative',
      recurrence: 'none',
      created_at: new Date().toISOString(),
    },
    {
      id: 'd0000000-0000-0000-0000-000000000003',
      user_id: userId,
      project_id: null,
      title: 'Macroeconomics Revision for Quiz',
      description: 'Review Chapter 4 & 5 fiscal multiplier formulas',
      priority: 'Medium',
      status: 'Inbox',
      due_date: new Date(Date.now() + 48 * 3600000).toISOString(),
      estimated_duration_minutes: 60,
      category: 'Study',
      recurrence: 'none',
      created_at: new Date().toISOString(),
    },
    {
      id: 'd0000000-0000-0000-0000-000000000004',
      user_id: userId,
      project_id: null,
      title: 'Evening Gym Workout',
      description: 'Leg day + 20 min cardio recovery',
      priority: 'Medium',
      status: 'Planned',
      due_date: new Date(Date.now() + 7 * 3600000).toISOString(),
      estimated_duration_minutes: 60,
      category: 'Personal',
      recurrence: 'daily',
      created_at: new Date().toISOString(),
    },
  ]);

  await db.subtasks.bulkAdd([
    {
      id: 'st-001',
      task_id: mktTaskId,
      title: 'Literature review of FMCG channel strategy',
      is_completed: true,
      sort_order: 1,
    },
    {
      id: 'st-002',
      task_id: mktTaskId,
      title: 'Draft section 2: Distribution bottlenecks',
      is_completed: true,
      sort_order: 2,
    },
    {
      id: 'st-003',
      task_id: mktTaskId,
      title: 'Synthesize recommendations and cost matrix',
      is_completed: false,
      sort_order: 3,
    },
    {
      id: 'st-004',
      task_id: mktTaskId,
      title: 'Format citations and export PDF',
      is_completed: false,
      sort_order: 4,
    },
  ]);

  // 7. Intentions
  await db.intentions.add({
    id: 'int-001',
    user_id: userId,
    content: 'I want to work on my film tonight',
    category: 'Creative',
    priority: 'High',
    time_window: 'Tonight',
    suggested_start_time: '19:30',
    suggested_end_time: '21:30',
    related_project: filmProjectId,
    status: 'active',
    created_at: new Date().toISOString(),
  });

  // 8. Multi-tier Memories
  await db.memories.bulkAdd([
    {
      id: 'mem-001',
      user_id: userId,
      content: 'User prefers studying in 60-90 minute focused blocks without audio interruptions.',
      memory_type: 'preference',
      category: 'Preferences',
      topic_tag: 'study_routine',
      importance: 4,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mem-002',
      user_id: userId,
      content: 'Wants to complete the independent short film "Echoes of Silence" before the festival submission this month.',
      memory_type: 'explicit',
      category: 'Goals',
      topic_tag: 'film_project',
      importance: 5,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mem-003',
      user_id: userId,
      content: 'Always aims for at least 80% attendance in Marketing Management for departmental honors.',
      memory_type: 'preference',
      category: 'Academic',
      topic_tag: 'attendance',
      importance: 4,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mem-004',
      user_id: userId,
      content: 'Prefers scheduling creative film work in the evening (7:30 PM to 9:30 PM) after gym.',
      memory_type: 'preference',
      category: 'Personal',
      topic_tag: 'creative_work',
      importance: 4,
      created_at: new Date().toISOString(),
    },
  ]);

  // 9. Notifications
  await db.notifications.bulkAdd([
    {
      id: 'notif-001',
      user_id: userId,
      title: 'Marketing Assignment Due Tomorrow',
      body: 'Your FMCG Case Study is due tomorrow at 5:00 PM. You have a 2-hour window between classes today to make progress.',
      category: 'Critical',
      urgency_level: 'High',
      action_payload: { action: 'open_task', taskId: mktTaskId },
      is_read: false,
      is_dismissed: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'notif-002',
      user_id: userId,
      title: 'Macroeconomics Attendance Alert',
      body: 'Your current attendance in ECO204 is 73.68%, which is below the 75% required threshold. Attend the next class to recover.',
      category: 'College',
      urgency_level: 'High',
      action_payload: { action: 'open_attendance' },
      is_read: false,
      is_dismissed: false,
      created_at: new Date().toISOString(),
    },
  ]);

  // 10. Initial AI Action Log
  await db.actionLogs.add({
    id: 'log-001',
    user_id: userId,
    action_type: 'SCHEDULE_SYNTHESIS',
    description: 'Synthesized daily schedule incorporating 3 college classes, 1 assignment deadline, and 1 evening creative session.',
    reason: 'Morning proactive daily plan generation',
    source: 'Proactive Engine',
    user_confirmed: true,
    created_at: new Date().toISOString(),
  });

  // 11. Project & Academic Conversation Sessions
  const convCount = await db.conversations.count();
  if (convCount === 0) {
    await db.conversations.bulkAdd([
      {
        id: 'conv-001',
        user_id: userId,
        title: 'Digital Marketing Campaign & STP Strategy',
        project_tag: 'Digital Marketing',
        summary: 'Analyzed FMCG distribution bottlenecks, Porter 5 forces, and target market segmentation.',
        message_count: 6,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'conv-002',
        user_id: userId,
        title: 'Short Film "Echoes of Silence" Script Outline',
        project_tag: 'Film Project',
        summary: 'Detailed scene breakdown for Act 2 and evening creative shooting schedule.',
        message_count: 8,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 'conv-003',
        user_id: userId,
        title: 'UU-ERP Attendance Shortage Recovery Plan',
        project_tag: 'Attendance',
        summary: 'Calculated 23 consecutive classes required for Digital Marketing (30.77%) and 7 for MS-Excel.',
        message_count: 4,
        created_at: new Date(Date.now() - 259200000).toISOString(),
        updated_at: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: 'conv-004',
        user_id: userId,
        title: 'Corporate & Business Law Contract Cases',
        project_tag: 'Business Law',
        summary: 'Reviewed breach of contract clauses and Namita Ma\'am lecture insights.',
        message_count: 5,
        created_at: new Date(Date.now() - 345600000).toISOString(),
        updated_at: new Date(Date.now() - 345600000).toISOString(),
      },
    ]);
  }

  console.log('[Project Julie] Master database initialized successfully.');
}

export async function syncOfficialTimetableNow() {
  const { OFFICIAL_SUBJECTS, OFFICIAL_WEEKLY_TIMETABLE } = await import('../data/userTimetable');
  const { OFFICIAL_SUBJECT_ATTENDANCE } = await import('../data/userAttendance');

  for (const s of OFFICIAL_SUBJECTS) {
    await db.subjects.put(s);
  }
  for (const c of OFFICIAL_WEEKLY_TIMETABLE) {
    await db.classes.put(c);
  }

  // Clear and put exact attendance records
  await db.attendance.clear();
  const attRecords: AttendanceRecord[] = [];
  for (const cfg of OFFICIAL_SUBJECT_ATTENDANCE) {
    const missed = cfg.totalConducted - cfg.totalPresent;
    for (let i = 1; i <= cfg.totalPresent; i++) {
      attRecords.push({
        id: `att-${cfg.subjectId}-a-${i}`,
        user_id: CURRENT_USER_ID,
        subject_id: cfg.subjectId,
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        status: 'attended',
      });
    }
    for (let i = 1; i <= missed; i++) {
      attRecords.push({
        id: `att-${cfg.subjectId}-m-${i}`,
        user_id: CURRENT_USER_ID,
        subject_id: cfg.subjectId,
        date: new Date(Date.now() - (i + 15) * 86400000).toISOString().split('T')[0],
        status: 'missed',
      });
    }
  }
  await db.attendance.bulkAdd(attRecords);
}
