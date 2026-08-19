# Project Julie — Testing Guide & Verification

Project Julie includes automated test suites covering deterministic mathematical calculations, schedule conflict detection, proactive notification rules, and AI tool routers.

---

## 1. Running the Automated Test Suite

```bash
# Run all Vitest suites
npm test
```

### Test Coverage Highlights:

1. **`src/__tests__/attendance.test.ts`**:
   - `calculatePercentage()`: Verified for exact decimal precision across varied historical records.
   - `calculateSafeMisses()`: Tested positive safe skip margins and negative recovery targets (consecutive lectures needed).
   - `getStatusLevel()`: Validated status classification (*Safe*, *Good*, *Warning*, *Critical*).
   - `summarizeSubject()`: Aggregated multi-record attendance summaries.

2. **`src/__tests__/schedule.test.ts`**:
   - Time conversion mathematical utilities.
   - `detectConflict()`: Accurately identifies overlapping class and event intervals.
   - `findFreeBlocks()`: Discovers daytime gaps between fixed academic commitments.

3. **`src/__tests__/proactive.test.ts`**:
   - `getDynamicGreeting()`: Validates morning, afternoon, evening, and late-night greetings based on local hour.
   - `shouldDispatchNotification()`: Confirms quiet-hours suppression rules while allowing urgent alerts to bypass.

---

## 2. End-to-End Acceptance Scenario Test (Requirement #60)

| Step | Action | Expected Result | Verified Status |
|---|---|---|---|
| **1** | Open app at 8:00 AM | Greeting displays *"Good morning, Boss."*, shows 3 classes, marketing assignment due tomorrow, and evening creative intention recommendation. | **PASSED** |
| **2** | Enter intention: *"I want to work on my film tonight"* | Intention captured, non-destructive 7:30 PM–9:30 PM slot reserved, memory saved. | **PASSED** |
| **3** | Trigger Simulated Timetable Shift | 2:00 PM Macroeconomics class moved to 3:00 PM, proactive alert emitted (*"Boss, your timetable changed..."*), schedule updated. | **PASSED** |
| **4** | Check Attendance Monitor | Deterministic calculation displays 85.7% for Marketing (Safe) and 73.7% for Economics (Critical alert: 1 class needed). | **PASSED** |
| **5** | AI Task Breakdown | High-level task broken down into 5 ordered subtasks. | **PASSED** |
