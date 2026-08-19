-- =============================================================================
-- PROJECT JULIE — DATABASE SCHEMA
-- Supabase / PostgreSQL Core Relational Schema
-- Migration 01: Initial Relational Tables & Indexes
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Enable vector extension for semantic memory (pgvector)
CREATE EXTENSION IF NOT EXISTS "vector";

-- -----------------------------------------------------------------------------
-- 1. Profiles & User Preferences
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    email TEXT,
    full_name TEXT NOT NULL,
    preferred_name TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    avatar_url TEXT,
    wake_time TIME DEFAULT '07:00:00',
    sleep_time TIME DEFAULT '23:30:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    assistant_name TEXT DEFAULT 'Julie',
    assistant_tone TEXT DEFAULT 'Confident & Proactive', -- e.g. Confident, Concise, Academic, Warm
    call_user_boss BOOLEAN DEFAULT TRUE,
    custom_title TEXT DEFAULT 'Boss',
    morning_briefing_time TIME DEFAULT '08:00:00',
    morning_briefing_enabled BOOLEAN DEFAULT TRUE,
    evening_briefing_time TIME DEFAULT '21:30:00',
    evening_briefing_enabled BOOLEAN DEFAULT TRUE,
    quiet_hours_start TIME DEFAULT '23:00:00',
    quiet_hours_end TIME DEFAULT '07:00:00',
    quiet_hours_enabled BOOLEAN DEFAULT TRUE,
    proactive_suggestions_enabled BOOLEAN DEFAULT TRUE,
    attendance_threshold NUMERIC(5, 2) DEFAULT 75.00,
    voice_enabled BOOLEAN DEFAULT TRUE,
    voice_persona TEXT DEFAULT 'natural-executive',
    theme TEXT DEFAULT 'dark-cinematic',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. Projects & Workspaces
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Personal', -- Academic, Film, Creative, Startup, Personal
    status TEXT DEFAULT 'active', -- active, on_hold, completed, archived
    progress_percentage INTEGER DEFAULT 0,
    target_deadline TIMESTAMPTZ,
    color_code TEXT DEFAULT '#38BDF8',
    ai_context_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Contributor',
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. Tasks & Subtasks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'Medium', -- Low, Medium, High, Urgent
    status TEXT DEFAULT 'Inbox', -- Inbox, Planned, In Progress, Blocked, Completed, Cancelled
    due_date TIMESTAMPTZ,
    start_date TIMESTAMPTZ,
    estimated_duration_minutes INTEGER DEFAULT 30,
    category TEXT DEFAULT 'General', -- College, Study, Personal, Project, Creative
    recurrence TEXT DEFAULT 'none', -- none, daily, weekly, custom
    notes TEXT,
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_suggestion_reason TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.task_subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. Calendar & Personal Events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    is_flexible BOOLEAN DEFAULT FALSE,
    category TEXT DEFAULT 'Personal',
    recurrence_rule TEXT,
    calendar_provider TEXT DEFAULT 'local', -- local, google, outlook
    external_event_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    sync_status TEXT DEFAULT 'synced',
    etag TEXT,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. College Subjects, Timetable & Deterministic Attendance
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    subject_code TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    faculty_name TEXT,
    room_number TEXT,
    credits INTEGER DEFAULT 3,
    min_attendance_req NUMERIC(5, 2) DEFAULT 75.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL, -- 1=Monday, 7=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number TEXT,
    class_type TEXT DEFAULT 'Lecture', -- Lecture, Lab, Tutorial, Seminar
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL, -- attended, missed, cancelled, exempt
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, in_progress, submitted, graded
    weight_percentage NUMERIC(5, 2),
    marks_obtained NUMERIC(5, 2),
    total_marks NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    exam_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 180,
    room_number TEXT,
    weight_percentage NUMERIC(5, 2),
    syllabus_summary TEXT,
    marks_obtained NUMERIC(5, 2),
    total_marks NUMERIC(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. Goals, Routines & Intentions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Personal',
    target_date DATE,
    progress_percentage INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    time_of_day TIME NOT NULL,
    days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- First-class Intention Entity
CREATE TABLE IF NOT EXISTS public.intentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL, -- e.g. "I want to work on my film tonight"
    category TEXT DEFAULT 'Creative', -- Creative, Study, Wellness, Project, Personal
    priority TEXT DEFAULT 'Medium', -- Low, Medium, High
    time_window TEXT DEFAULT 'Tonight', -- Morning, Afternoon, Evening, Tonight, This Weekend
    suggested_start_time TIMESTAMPTZ,
    suggested_end_time TIMESTAMPTZ,
    related_project UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active', -- active, scheduled, completed, expired, dismissed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- -----------------------------------------------------------------------------
-- 7. Memory System (5 Tiers + Vector Embeddings)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    memory_type TEXT NOT NULL, -- explicit, preference, project, conversational, semantic
    category TEXT DEFAULT 'Personal', -- Personal, Preferences, Goals, Projects, Academic
    topic_tag TEXT, -- Tag for "Forget everything about this topic"
    importance INTEGER DEFAULT 3, -- 1 to 5 scale
    embedding vector(1536), -- semantic vector embedding
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- 8. Conversations, Messages & AI Action Logs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT 'Conversation with Julie',
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    sender TEXT NOT NULL, -- user, assistant, system
    content TEXT NOT NULL,
    tool_calls JSONB,
    tool_results JSONB,
    context_used JSONB,
    audio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    tool_name TEXT NOT NULL,
    parameters JSONB NOT NULL,
    permission_tier TEXT NOT NULL, -- read, suggest, write, sensitive
    status TEXT DEFAULT 'pending', -- pending, confirmed, executed, rejected, failed
    execution_result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.ai_action_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    reason TEXT NOT NULL,
    source TEXT DEFAULT 'Julie AI', -- Voice, Chat, Proactive Engine, ERP Sync
    user_confirmed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. Proactive Notifications & Integrations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL, -- Critical, Important, Reminder, Schedule, AI Insight, Daily Briefing, Project, College
    urgency_level TEXT DEFAULT 'Normal', -- Low, Normal, High, Urgent
    action_payload JSONB, -- Buttons e.g. [{"action": "open_task", "taskId": "..."}]
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    snoozed_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL, -- college_erp, google_calendar, notion, canvas
    status TEXT DEFAULT 'disconnected', -- disconnected, connected, error, syncing
    settings JSONB DEFAULT '{}'::jsonb,
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.integration_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE NOT NULL,
    token_type TEXT NOT NULL,
    encrypted_access_token TEXT NOT NULL,
    encrypted_refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL, -- pdf, image, doc, notes
    file_size_bytes BIGINT,
    storage_path TEXT NOT NULL,
    extracted_text TEXT,
    ai_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Performance Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_classes_user_day ON public.classes(user_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_attendance_user_sub ON public.attendance_records(user_id, subject_id, date);
CREATE INDEX IF NOT EXISTS idx_assignments_user_due ON public.assignments(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_intentions_user_status ON public.intentions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_memories_user_type ON public.memories(user_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at);
