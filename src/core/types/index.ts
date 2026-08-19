// =============================================================================
// PROJECT JULIE — CORE TYPESCRIPT DEFINITIONS
// Master type definitions for all entities, AI tools, and integrations
// =============================================================================

export type UUID = string;

export interface Profile {
  id: UUID;
  user_id: UUID;
  email: string;
  full_name: string;
  preferred_name: string;
  timezone: string;
  avatar_url?: string;
  wake_time: string; // "07:00:00"
  sleep_time: string; // "23:30:00"
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferences {
  id: UUID;
  user_id: UUID;
  assistant_name: string;
  assistant_tone: 'Confident & Proactive' | 'Concise & Direct' | 'Academic & Calm' | 'Warm & Encouraging';
  call_user_boss: boolean;
  custom_title: string;
  morning_briefing_time: string; // "08:00:00"
  morning_briefing_enabled: boolean;
  evening_briefing_time: string; // "21:30:00"
  evening_briefing_enabled: boolean;
  quiet_hours_start: string; // "23:00:00"
  quiet_hours_end: string; // "07:00:00"
  quiet_hours_enabled: boolean;
  proactive_suggestions_enabled: boolean;
  attendance_threshold: number; // 75.0
  voice_enabled: boolean;
  voice_persona: string;
  theme: 'dark-cinematic' | 'dark-minimal';
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'Inbox' | 'Planned' | 'In Progress' | 'Blocked' | 'Completed' | 'Cancelled';
export type TaskCategory = 'College' | 'Study' | 'Personal' | 'Project' | 'Creative' | 'General';

export interface TaskSubtask {
  id: UUID;
  task_id: UUID;
  title: string;
  is_completed: boolean;
  sort_order: number;
}

export interface Task {
  id: UUID;
  user_id: UUID;
  project_id?: UUID | null;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string; // ISO string
  start_date?: string;
  estimated_duration_minutes: number;
  category: TaskCategory;
  recurrence: 'none' | 'daily' | 'weekly' | 'custom';
  notes?: string;
  ai_generated?: boolean;
  ai_suggestion_reason?: string;
  completed_at?: string;
  subtasks?: TaskSubtask[];
  created_at?: string;
  updated_at?: string;
}

export interface ProjectMilestone {
  id: UUID;
  project_id: UUID;
  title: string;
  description?: string;
  due_date?: string;
  is_completed: boolean;
  completed_at?: string;
}

export interface Project {
  id: UUID;
  user_id: UUID;
  title: string;
  description?: string;
  category: 'Film' | 'Creative' | 'Academic' | 'Startup' | 'Personal';
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  progress_percentage: number;
  target_deadline?: string;
  color_code: string;
  ai_context_notes?: string;
  milestones?: ProjectMilestone[];
  created_at?: string;
  updated_at?: string;
}

export interface Subject {
  id: UUID;
  user_id: UUID;
  subject_code: string;
  subject_name: string;
  faculty_name?: string;
  room_number?: string;
  credits: number;
  min_attendance_req: number;
}

export interface ClassSchedule {
  id: UUID;
  user_id: UUID;
  subject_id: UUID;
  subject_code?: string;
  subject_name?: string;
  faculty_name?: string;
  day_of_week: number; // 1 = Monday, 7 = Sunday
  start_time: string; // "10:00:00"
  end_time: string; // "11:30:00"
  room_number?: string;
  class_type: 'Lecture' | 'Lab' | 'Tutorial' | 'Seminar';
  is_active: boolean;
}

export type AttendanceStatus = 'attended' | 'missed' | 'cancelled' | 'exempt';

export interface AttendanceRecord {
  id: UUID;
  user_id: UUID;
  subject_id: UUID;
  class_id?: UUID;
  date: string; // "YYYY-MM-DD"
  status: AttendanceStatus;
  notes?: string;
  created_at?: string;
}

export interface AttendanceSummary {
  subject_id: UUID;
  subject_code: string;
  subject_name: string;
  total_classes: number;
  attended_classes: number;
  missed_classes: number;
  percentage: number;
  min_required: number;
  safe_misses: number; // Positive means can skip N, negative means must attend N consecutively
  status_level: 'Safe' | 'Warning' | 'Critical' | 'Good';
}

export interface Assignment {
  id: UUID;
  user_id: UUID;
  subject_id: UUID;
  subject_name?: string;
  title: string;
  description?: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'graded';
  weight_percentage?: number;
  marks_obtained?: number;
  total_marks?: number;
}

export interface Exam {
  id: UUID;
  user_id: UUID;
  subject_id: UUID;
  subject_name?: string;
  title: string;
  exam_date: string;
  duration_minutes: number;
  room_number?: string;
  syllabus_summary?: string;
}

export interface CalendarEvent {
  id: UUID;
  user_id: UUID;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  is_flexible: boolean;
  category: 'College' | 'Study' | 'Personal' | 'Project' | 'Creative' | 'Routine';
  calendar_provider: 'local' | 'google' | 'outlook';
}

export interface Intention {
  id: UUID;
  user_id: UUID;
  content: string; // e.g. "I want to work on my film tonight"
  category: 'Creative' | 'Study' | 'Wellness' | 'Project' | 'Personal';
  priority: 'Low' | 'Medium' | 'High';
  time_window: 'Morning' | 'Afternoon' | 'Evening' | 'Tonight' | 'This Weekend';
  suggested_start_time?: string;
  suggested_end_time?: string;
  related_project?: UUID | null;
  status: 'active' | 'scheduled' | 'completed' | 'dismissed';
  created_at?: string;
  expires_at?: string;
}

export type MemoryType = 'explicit' | 'preference' | 'project' | 'conversational' | 'semantic';

export interface Memory {
  id: UUID;
  user_id: UUID;
  content: string;
  memory_type: MemoryType;
  category: 'Personal' | 'Preferences' | 'Goals' | 'Projects' | 'Academic';
  topic_tag?: string;
  importance: number; // 1 to 5
  embedding?: number[];
  created_at?: string;
  updated_at?: string;
  expires_at?: string;
}

export type NotificationCategory =
  | 'Critical'
  | 'Important'
  | 'Reminder'
  | 'Schedule'
  | 'AI Insight'
  | 'Daily Briefing'
  | 'Project'
  | 'College';

export interface AppNotification {
  id: UUID;
  user_id: UUID;
  title: string;
  body: string;
  category: NotificationCategory;
  urgency_level: 'Low' | 'Normal' | 'High' | 'Urgent';
  action_payload?: {
    action: string;
    taskId?: string;
    projectId?: string;
    eventId?: string;
    suggestionId?: string;
  };
  is_read: boolean;
  is_dismissed: boolean;
  snoozed_until?: string;
  created_at: string;
}

export interface AIActionLog {
  id: UUID;
  user_id: UUID;
  action_type: string;
  description: string;
  reason: string;
  source: 'Voice' | 'Chat' | 'Proactive Engine' | 'ERP Sync' | 'Daily Briefing' | 'Julie AI' | 'User Command';
  user_confirmed: boolean;
  created_at: string;
}

export interface ChatSession {
  id: UUID;
  user_id: UUID;
  title: string;
  project_tag: string;
  summary: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: UUID;
  conversation_id: UUID;
  user_id?: UUID;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: {
    name: string;
    arguments: Record<string, any>;
    status: 'pending' | 'success' | 'failed' | 'requires_confirmation';
  }[];
  tool_results?: {
    name: string;
    result: any;
  }[];
  context_used?: {
    classes_today?: number;
    pending_tasks?: number;
    intentions_active?: number;
  };
  audio_url?: string;
  created_at: string;
}

export interface FileItem {
  id: UUID;
  user_id: UUID;
  project_id?: UUID;
  subject_id?: UUID;
  filename: string;
  file_type: 'pdf' | 'image' | 'doc' | 'notes';
  file_size_bytes: number;
  storage_path: string;
  extracted_text?: string;
  ai_summary?: string;
  created_at: string;
}

export type PermissionTier = 'read' | 'suggest' | 'write' | 'sensitive';

export interface ToolDefinition {
  name: string;
  description: string;
  permissionTier: PermissionTier;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface FreeTimeBlock {
  start: Date;
  end: Date;
  durationMinutes: number;
  label: string;
}

export interface DailyScheduleItem {
  id: string;
  type: 'class' | 'event' | 'task_session' | 'intention_slot' | 'free_block';
  title: string;
  subtitle?: string;
  startTime: string; // "10:00"
  endTime: string; // "11:30"
  location?: string;
  category?: string;
  status?: string;
  isActionable?: boolean;
  rawItem?: any;
}
