-- =============================================================================
-- PROJECT JULIE — REALISTIC SEED DATA
-- Fits Master Prompt Acceptance Scenario (Marketing Class, Assignment, Film intention)
-- =============================================================================

DO $$
DECLARE
    v_user_id UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
    v_proj_film UUID := 'b0000000-0000-0000-0000-000000000001'::UUID;
    v_sub_mkt UUID := 'c0000000-0000-0000-0000-000000000001'::UUID;
    v_sub_eco UUID := 'c0000000-0000-0000-0000-000000000002'::UUID;
    v_sub_cs UUID := 'c0000000-0000-0000-0000-000000000003'::UUID;
    v_task_mkt UUID := 'd0000000-0000-0000-0000-000000000001'::UUID;
BEGIN
    -- 1. Profile & Preferences
    INSERT INTO public.profiles (user_id, email, full_name, preferred_name, timezone, wake_time, sleep_time)
    VALUES (v_user_id, 'boss@julie.ai', 'Shaurya Vardhan', 'Boss', 'Asia/Kolkata', '07:00:00', '23:30:00')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.user_preferences (
        user_id, assistant_name, assistant_tone, call_user_boss, custom_title,
        morning_briefing_time, evening_briefing_time, quiet_hours_start, quiet_hours_end,
        attendance_threshold, voice_enabled
    )
    VALUES (
        v_user_id, 'Julie', 'Confident & Proactive', TRUE, 'Boss',
        '08:00:00', '21:30:00', '23:00:00', '07:00:00',
        75.00, TRUE
    )
    ON CONFLICT DO NOTHING;

    -- 2. Projects
    INSERT INTO public.projects (id, user_id, title, description, category, status, progress_percentage, color_code, ai_context_notes)
    VALUES 
    (v_proj_film, v_user_id, 'Short Film: Echoes of Silence', 'Independent sci-fi short film project in post-production phase', 'Film', 'active', 65, '#8B5CF6', 'User wants to finish the primary edit sequence this month.'),
    ('b0000000-0000-0000-0000-000000000002'::UUID, v_user_id, 'Semester 5 Capstone Research', 'Comparative study on consumer psychology in digital markets', 'Academic', 'active', 40, '#38BDF8', 'Needs 2 more case studies before midterm review.');

    -- 3. Subjects & Classes
    INSERT INTO public.subjects (id, user_id, subject_code, subject_name, faculty_name, room_number, credits, min_attendance_req)
    VALUES
    (v_sub_mkt, v_user_id, 'MKT301', 'Marketing Management', 'Dr. Radhika Sharma', 'Hall 402', 4, 75.00),
    (v_sub_eco, v_user_id, 'ECO204', 'Macroeconomics & Fiscal Policy', 'Prof. Arvind Menon', 'Hall 205', 3, 75.00),
    (v_sub_cs, v_user_id, 'CS310', 'Data Structures & Algorithms', 'Dr. K. S. Rao', 'Lab 3', 4, 75.00)
    ON CONFLICT DO NOTHING;

    -- Tuesday Schedule (Today)
    -- Day of week: 2 = Tuesday
    INSERT INTO public.classes (id, user_id, subject_id, day_of_week, start_time, end_time, room_number, class_type)
    VALUES
    ('e0000000-0000-0000-0000-000000000001'::UUID, v_user_id, v_sub_mkt, 2, '10:00:00', '11:30:00', 'Hall 402', 'Lecture'),
    ('e0000000-0000-0000-0000-000000000002'::UUID, v_user_id, v_sub_eco, 2, '14:00:00', '15:30:00', 'Hall 205', 'Lecture'),
    ('e0000000-0000-0000-0000-000000000003'::UUID, v_user_id, v_sub_cs, 2, '16:00:00', '17:30:00', 'Lab 3', 'Lab')
    ON CONFLICT DO NOTHING;

    -- 4. Attendance Records (Deterministic history)
    -- MKT301: 18 attended, 3 missed = 85.7% (Safe misses: 2)
    -- ECO204: 14 attended, 5 missed = 73.7% (Critical: Needs 1 to reach 75%)
    -- CS310: 22 attended, 2 missed = 91.7% (Safe misses: 4)
    INSERT INTO public.attendance_records (user_id, subject_id, date, status)
    SELECT v_user_id, v_sub_mkt, CURRENT_DATE - (i || ' days')::INTERVAL, 'attended'
    FROM generate_series(1, 18) i;
    INSERT INTO public.attendance_records (user_id, subject_id, date, status)
    SELECT v_user_id, v_sub_mkt, CURRENT_DATE - ((i + 20) || ' days')::INTERVAL, 'missed'
    FROM generate_series(1, 3) i;

    INSERT INTO public.attendance_records (user_id, subject_id, date, status)
    SELECT v_user_id, v_sub_eco, CURRENT_DATE - (i || ' days')::INTERVAL, 'attended'
    FROM generate_series(1, 14) i;
    INSERT INTO public.attendance_records (user_id, subject_id, date, status)
    SELECT v_user_id, v_sub_eco, CURRENT_DATE - ((i + 20) || ' days')::INTERVAL, 'missed'
    FROM generate_series(1, 5) i;

    -- 5. Tasks & Subtasks
    INSERT INTO public.tasks (id, user_id, project_id, title, description, priority, status, due_date, estimated_duration_minutes, category)
    VALUES
    (v_task_mkt, v_user_id, NULL, 'Marketing Case Study Assignment', 'Submit 4-page analysis on FMCG supply chain disruptions', 'Urgent', 'In Progress', NOW() + INTERVAL '28 hours', 90, 'College'),
    ('d0000000-0000-0000-0000-000000000002'::UUID, v_user_id, v_proj_film, 'Rough Cut Sound Design & Color Grade', 'Work on scene 4 audio mix and export review link', 'High', 'Planned', NOW() + INTERVAL '12 hours', 120, 'Creative'),
    ('d0000000-0000-0000-0000-000000000003'::UUID, v_user_id, NULL, 'Macroeconomics Revision for Quiz', 'Read Chapter 4 and 5 notes', 'Medium', 'Inbox', NOW() + INTERVAL '48 hours', 60, 'Study'),
    ('d0000000-0000-0000-0000-000000000004'::UUID, v_user_id, NULL, 'Evening Gym Workout', 'Leg day + 20 min cardio', 'Medium', 'Planned', NOW() + INTERVAL '7 hours', 60, 'Personal');

    INSERT INTO public.task_subtasks (task_id, title, is_completed, sort_order)
    VALUES
    (v_task_mkt, 'Literature review of FMCG channel strategy', TRUE, 1),
    (v_task_mkt, 'Draft section 2: Distribution bottlenecks', TRUE, 2),
    (v_task_mkt, 'Synthesize recommendations and cost matrix', FALSE, 3),
    (v_task_mkt, 'Format citations and export PDF', FALSE, 4);

    -- 6. Intentions
    INSERT INTO public.intentions (user_id, content, category, priority, time_window, related_project, status)
    VALUES
    (v_user_id, 'I want to work on my film tonight', 'Creative', 'High', 'Tonight', v_proj_film, 'active');

    -- 7. Memories (Multi-tier)
    INSERT INTO public.memories (user_id, content, memory_type, category, topic_tag, importance)
    VALUES
    (v_user_id, 'User prefers studying in 60-90 minute focused blocks without frequent audio pings.', 'preference', 'Preferences', 'study_routine', 4),
    (v_user_id, 'Wants to complete the independent short film "Echoes of Silence" before the festival deadline this month.', 'explicit', 'Goals', 'film_project', 5),
    (v_user_id, 'Always aims for at least 80% attendance in Marketing Management to maintain honors standing.', 'preference', 'Academic', 'attendance', 4),
    (v_user_id, 'Prefers creative work in the evening (7:30 PM to 10 PM) after returning from gym.', 'preference', 'Personal', 'creative_work', 4);

    -- 8. Proactive Notification
    INSERT INTO public.notifications (user_id, title, body, category, urgency_level, action_payload)
    VALUES
    (v_user_id, 'Marketing Assignment Due Tomorrow', 'Your FMCG Case Study is due tomorrow at 5:00 PM. You have a 2-hour window between classes today to make progress.', 'Critical', 'High', '{"action": "open_task", "taskId": "d0000000-0000-0000-0000-000000000001"}'::jsonb);

END $$;
