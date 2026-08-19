# Project Julie — Personal AI Executive Assistant

> **"What information or action would reduce the user's mental load right now?"**

Julie is a production-grade, personal AI executive assistant that lives inside the user's phone. Unlike passive chatbots that wait for prompts, Julie continuously observes, plans, remembers, and proactively communicates timely schedule insights, attendance alerts, assignment breakdowns, and creative project milestones.

---

## Key Features

1. **Executive Command Center (Home Screen)**:
   - Dynamic greetings calibrated to the time of day (*"Good morning, boss"* / *"Still working, boss?"*).
   - Live **"JULIE SAYS"** contextual recommendation card.
   - **"What are you thinking?"** intention capture engine.
   - Real-time attendance percentage and task indicators.

2. **Deterministic Attendance Engine**:
   - Exact mathematical calculations for subject-wise attendance percentages.
   - Calculates **Safe Misses** (how many classes you can skip without falling below the 75% threshold) and **Recovery Targets** (consecutive classes needed to recover).
   - Zero fuzzy LLM approximations for hard numbers.

3. **Autonomous Schedule & Free-Time Engine**:
   - Aggregates college timetables, events, deadlines, and intentions.
   - Discovers free time blocks during the day.
   - Detects schedule overlaps and proposes non-destructive adjustments.

4. **Multi-Tier Memory Ledger with User Governance**:
   - 5 structured memory layers: *Explicit*, *Preference*, *Project*, *Conversational*, and *Semantic*.
   - Direct user control to inspect, edit, delete, or trigger **"Forget everything about this topic"**.

5. **AI Task Deconstruction**:
   - Turns high-level prompts (e.g. *"Prepare presentation for Friday"*) into structured subtask checklists (*Research &rarr; Outline &rarr; Visuals &rarr; Speaker Notes &rarr; Rehearsal*).

6. **Modular College ERP Connector Architecture**:
   - Standardized adapter interface (`ERPConnector`) supporting authentication, timetable, attendance, assignments, exams, and notices sync.
   - Includes simulated change detection (e.g. 2 PM class shifting to 3 PM triggering proactive alerts).

7. **Multi-Modal Voice Assistant**:
   - Web Speech API integration for natural STT and executive TTS speech synthesis.
   - Real-time animated audio waveform visualizer.

8. **AI Transparency & Audit Log**:
   - Complete log of actions, reasons, and tool executions.

---

## Technology Stack

- **Mobile Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Offline-First Storage**: Dexie.js (IndexedDB) with real-time reactive live queries.
- **Backend & Database**: PostgreSQL 15+ / Supabase with Row Level Security (RLS) across 26 tables and pgvector semantic embeddings.
- **Testing**: Vitest with unit & integration test coverage.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Run automated test suite
npm test

# 4. Build production bundle
npm run build
```

---

## Project Structure

```text
d:/JULIE AI/
├── src/
│   ├── core/
│   │   ├── storage/     # Dexie IndexedDB offline database & seed logic
│   │   └── types/       # Domain models, tools, and ERP schemas
│   ├── services/
│   │   ├── ai/          # Context builder, Prompt manager, Tool router, AI service
│   │   ├── attendance/  # Deterministic attendance & safe-miss math
│   │   ├── integrations/# College ERP connector & Mock University adapter
│   │   ├── memory/      # 5-tier memory engine & topic purge
│   │   ├── proactive/   # Morning/Evening briefings & notification rules
│   │   ├── schedule/    # Free-time discoverer & conflict detector
│   │   └── voice/       # Speech-to-text & text-to-speech engine
│   ├── components/
│   │   ├── common/      # GlassCard, PriorityBadge, Header, BottomNav, VoiceButton
│   │   ├── home/        # Today card, Julie Says card, Intentions card
│   │   ├── assistant/   # AI chat interface & live voice mode
│   │   ├── tasks/       # Task manager with AI breakdown modal
│   │   ├── schedule/    # Timetable grid, daily planner & shift simulation
│   │   ├── projects/    # Workspace hubs & milestone tracker
│   │   ├── memory/      # Memory ledger & topic purge modal
│   │   ├── notifications/# Actionable notification cards
│   │   ├── settings/    # Assistant persona tuning & ERP settings
│   │   └── onboarding/  # First-run setup wizard
│   └── __tests__/       # Vitest unit & integration test suites
├── supabase/
│   ├── migrations/      # 01_initial_schema, 02_rls_policies, 03_functions
│   └── seed.sql         # Seed dataset
├── ARCHITECTURE.md
├── SETUP.md
├── ENVIRONMENT.md
├── DATABASE.md
├── INTEGRATIONS.md
├── SECURITY.md
└── TESTING.md
```
