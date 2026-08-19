# Project Julie — Technical Architecture

This document details the architectural design, data pipelines, reasoning flow, and component breakdown of Project Julie.

---

## 1. System Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT RUNTIME                                 │
│  React 18 Mobile Shell + Tailwind CSS + Dexie (IndexedDB Local Offline DB)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
    ┌──────────────────────┐ ┌───────────────────┐ ┌────────────────────┐
    │     Voice Engine     │ │   UI Viewports    │ │   Local Cache /    │
    │  - Web Speech STT    │ │  - Home Command   │ │   Sync Queue       │
    │  - Waveform Visual   │ │  - Tasks & Subtask│ │  - Reactive Hooks  │
    │  - Speech Synth TTS  │ │  - Timetable/Sched│ │  - Offline State   │
    │                      │ │  - Memory Ledger  │ │  - Conflict Resolv │
    └──────────┬───────────┘ └─────────┬─────────┘ └──────────┬─────────┘
               │                       │                      │
               └───────────────────────┼──────────────────────┘
                                       │
                                       ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                            JULIE BRAIN                                │
    │  ┌───────────────────────────────────────────────────────────────────┐  │
    │  │                        Context Builder                            │  │
    │  │   Time/Date + Classes + Deadlines + Intentions + Semantic Memory  │  │
    │  └─────────────────────────────────┬─────────────────────────────────┘  │
    │                                    │                                    │
    │  ┌─────────────────────────────────▼─────────────────────────────────┐  │
    │  │                       AI Executive Service                        │  │
    │  │       Intent Classifier & Prompt Manager (Calibrated Persona)     │  │
    │  └─────────────────────────────────┬─────────────────────────────────┘  │
    │                                    │                                    │
    │  ┌─────────────────────────────────▼─────────────────────────────────┐  │
    │  │                           Tool Router                             │  │
    │  │      [Read]       [Suggest]         [Write]         [Sensitive]   │  │
    │  │   get_schedule   ai_breakdown     create_task      forget_memory  │  │
    │  │   get_attendance  create_event    capture_intent                  │  │
    │  └─────────────────────────────────┬─────────────────────────────────┘  │
    │                                    │                                    │
    │  ┌─────────────────────────────────▼─────────────────────────────────┐  │
    │  │                     Proactive Intelligence Engine                 │  │
    │  │   Morning Briefing • Julie Says Insight • Evening Summary       │  │
    │  │   Timetable Shift Detector • Fatigue & Quiet Hours Rules          │  │
    │  └───────────────────────────────────────────────────────────────────┘  │
    └──────────────────────────────────┬──────────────────────────────────────┘
                                       │
               ┌───────────────────────┴───────────────────────┐
               ▼                                               ▼
┌──────────────────────────────┐                ┌─────────────────────────────┐
│    College ERP Connector     │                │     Supabase / PostgreSQL   │
│  - REST / OAuth Auth         │                │  - 26 Relational Tables     │
│  - Timetable Sync            │                │  - Row-Level Security (RLS) │
│  - Attendance Sync           │                │  - pgvector Semantic Store  │
│  - Differential Change Alert │                │  - Audit Logs & Triggers    │
└──────────────────────────────┘                └─────────────────────────────┘
```

---

## 2. Core Operational Flow

1. **Observe**: The application tracks the local time, today's day of week, scheduled college classes, pending task deadlines, and user-entered intentions.
2. **Understand**: Context is compressed and synthesized into `StructuredJulieContext`.
3. **Remember**: Long-term preferences and stated goals are indexed across 5 memory tiers.
4. **Plan**: Free time slots are computed between hard commitments (classes and exams), and intentional blocks are reserved.
5. **Decide**: The Proactive Intelligence Engine evaluates urgency, quiet hours, and notification fatigue before generating alerts.
6. **Act / Notify**: Recommendations are rendered through the *"Julie Says"* card, interactive notifications, or spoken speech synthesis.
7. **Learn**: User modifications and completed tasks update the schedule and memory ledger.

---

## 3. Tool Permission Tiers

| Tier | Characteristics | Examples |
|---|---|---|
| **Read** | Non-mutating data retrieval | `get_schedule`, `get_tasks`, `get_attendance` |
| **Suggest** | Prepares complex structures requiring user preview | `ai_task_breakdown`, `create_event` |
| **Write** | Creates or updates user data | `create_task`, `complete_task`, `capture_intention`, `save_memory` |
| **Sensitive** | Destructive actions requiring explicit confirmation | `forget_memory`, `delete_account` |
