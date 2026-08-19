-- =============================================================================
-- PROJECT JULIE — ROW LEVEL SECURITY (RLS) POLICIES
-- Migration 02: Row Level Security on all private tables
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Standard RLS Policies: Direct Owner Access (auth.uid() = user_id)
-- -----------------------------------------------------------------------------

-- Profiles
CREATE POLICY "Users can view and manage their own profile"
    ON public.profiles FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- User Preferences
CREATE POLICY "Users can view and manage their preferences"
    ON public.user_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Projects
CREATE POLICY "Users can manage their own projects"
    ON public.projects FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Project Members (Project Owner or Member)
CREATE POLICY "Project owners can manage members"
    ON public.project_members FOR ALL
    USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_members.project_id AND projects.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_members.project_id AND projects.user_id = auth.uid()));

-- Tasks
CREATE POLICY "Users can manage their own tasks"
    ON public.tasks FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Task Subtasks
CREATE POLICY "Users can manage their subtasks"
    ON public.task_subtasks FOR ALL
    USING (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_subtasks.task_id AND tasks.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = task_subtasks.task_id AND tasks.user_id = auth.uid()));

-- Events & Calendar
CREATE POLICY "Users can manage their events"
    ON public.events FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Subjects & Classes
CREATE POLICY "Users can manage their subjects"
    ON public.subjects FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their classes"
    ON public.classes FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Attendance & Academic Records
CREATE POLICY "Users can manage attendance records"
    ON public.attendance_records FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage assignments"
    ON public.assignments FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage exams"
    ON public.exams FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Goals, Routines & Intentions
CREATE POLICY "Users can manage goals"
    ON public.goals FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage routines"
    ON public.routines FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage intentions"
    ON public.intentions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Memories (High Security - Strictly User Isolated)
CREATE POLICY "Users strictly manage own memories"
    ON public.memories FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Conversations & Messages
CREATE POLICY "Users can manage conversations"
    ON public.conversations FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage messages"
    ON public.messages FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- AI Actions & Transparency Logs
CREATE POLICY "Users view their AI action logs"
    ON public.ai_action_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage AI pending actions"
    ON public.ai_actions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users manage notifications"
    ON public.notifications FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Integrations & Tokens
CREATE POLICY "Users manage integrations"
    ON public.integrations FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Files
CREATE POLICY "Users manage files"
    ON public.files FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
