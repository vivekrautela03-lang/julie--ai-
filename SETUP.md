# Project Julie — Setup & Installation Guide

This guide details setting up Project Julie locally for development or deploying to production environments.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **Browser**: Modern Chromium, Firefox, or Safari browser with Web Speech API support

---

## 2. Step-by-Step Installation

### Step 1: Clone or Navigate to Directory
```bash
cd "d:/JULIE AI"
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Configure Environment
Copy the example environment file:
```bash
cp .env.example .env.local
```
*(Optional: Provide Supabase and AI provider credentials. If omitted, Julie automatically runs with the built-in offline-first engine and sandbox seed data).*

### Step 4: Start Local Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 3. Database Deployment (Supabase / PostgreSQL)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Run the migrations in order:
   - `supabase/migrations/01_initial_schema.sql` (Creates 26 tables, indexes, extensions)
   - `supabase/migrations/02_rls_policies.sql` (Applies Row Level Security)
   - `supabase/migrations/03_functions_and_triggers.sql` (Applies vector search & triggers)
   - `supabase/seed.sql` (Seeds initial timetable, attendance, tasks, intentions)
4. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local`.

---

## 4. Production Build & Validation

```bash
# Run unit & integration tests
npm test

# Build optimized production bundle
npm run build

# Preview build locally
npm run preview
```
