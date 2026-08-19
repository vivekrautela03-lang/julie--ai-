# Project Julie — Database Schema & Architecture

Project Julie utilizes a 26-table relational schema designed for PostgreSQL 15+ and Supabase, with dual-persistence support via Dexie (IndexedDB) on the mobile client.

---

## Relational Schema Summary

### 1. User & Persona
- `profiles`: Core user identities, preferred names, timezone, waking & sleeping hours.
- `user_preferences`: Assistant name, executive honorific (*"Boss"*), tone calibration, morning & evening briefing times, quiet hours, attendance threshold.

### 2. Academic & Deterministic Attendance
- `subjects`: Course codes (`MKT301`, `ECO204`, `CS310`), faculty names, credits, minimum attendance threshold (default 75.0%).
- `classes`: Weekly timetable recurring slots with day of week, room numbers, class types (*Lecture*, *Lab*, *Tutorial*).
- `attendance_records`: Immutable log of class attendance (`attended`, `missed`, `cancelled`, `exempt`).
- `assignments`: Course assignments with due dates, weights, submission statuses, and grades.
- `exams`: Exam schedules, venues, and syllabus summaries.

### 3. Productivity & Projects
- `tasks`: Tasks with priority (*Urgent*, *High*, *Medium*, *Low*), status, due date, estimated duration, and categories.
- `task_subtasks`: Ordered checklist subtasks deconstructed by the AI task engine.
- `projects`: Creative and academic workspaces with progress tracking and AI context notes.
- `project_milestones`: Dated milestone targets for projects.
- `project_members`: Collaborators and team members.
- `events` & `calendar_events`: Personal and synced calendar events.
- `goals` & `routines`: Habitual routines and quarterly targets.

### 4. Intentions & Cognitive Memory
- `intentions`: First-class entity for capturing fluid user intentions (*"I want to work on my film tonight"*) with time windows and suggested non-destructive schedule allocations.
- `memories`: 5-tier memory storage (*Explicit*, *Preference*, *Project*, *Conversational*, *Semantic*) with pgvector embeddings and topic tags.

### 5. Transparency, Communications & Integrations
- `conversations` & `messages`: Chat transcripts, tool execution records, context snapshots.
- `ai_actions` & `ai_action_logs`: Complete transparency log of decisions, reasons, and user confirmations.
- `notifications`: Actionable notifications with payload actions (*open_task*, *open_schedule*, *open_attendance*).
- `integrations` & `integration_tokens`: Encrypted tokens for ERP, Google Calendar, and Notion.
- `files`: Uploaded syllabus, lecture notes, and extracted text intelligence.
