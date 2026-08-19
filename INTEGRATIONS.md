# Project Julie — Integration & ERP Connector Architecture

Julie uses an extensible adapter framework to integrate with college ERPs, calendars, and external document sources without tightly coupling to any single proprietary university software.

---

## 1. College ERP Connector Interface (`CollegeERPConnector`)

All university portal integrations implement the base contract:

```typescript
export interface CollegeERPConnector {
  providerName: string;
  authenticate(credentials: { apiKey?: string; token?: string; portalUrl?: string }): Promise<boolean>;
  getProfile(): Promise<ERPUserProfile>;
  getTimetable(): Promise<ClassSchedule[]>;
  getAttendance(): Promise<AttendanceRecord[]>;
  getAssignments(): Promise<Assignment[]>;
  getExams(): Promise<Exam[]>;
  getNotices(): Promise<ERPNotice[]>;
  sync(): Promise<ERPSyncResult>;
}
```

---

## 2. Supported ERP Connector Adapters

1. **`MockUniversityERPAdapter` (Included & Active in Sandbox)**:
   - Provides realistic multi-subject timetables, attendance history, assignments, and exam schedules.
   - Includes **`simulateTimetableShift()`** to test proactive alerts (e.g. moving a 2 PM lecture to 3 PM).
2. **`MoodleRESTAdapter`**: Integrates with Moodle Core Web Services API.
3. **`CanvasLMSAdapter`**: Integrates with Instructure Canvas REST API.
4. **`TCSIoNAdapter`**: Secure token-based adapter for TCS iON academic portals.

---

## 3. Security Guidelines for Real University Connections

- **No Raw Password Storage**: Passwords are never sent to or stored by the AI layer.
- **Token Encryption**: Access and refresh tokens are encrypted at rest using AES-256 (`pgcrypto`).
- **Rate-Limiting Compliance**: Sync cycles use backoff jitter and respect portal rate limits.
- **Differential Sync**: Only changed timetable slots or newly posted assignments trigger proactive notifications.
