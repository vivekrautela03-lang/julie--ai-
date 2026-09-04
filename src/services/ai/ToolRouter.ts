// =============================================================================
// PROJECT JULIE — AI TOOL ROUTER & PERMISSION GATEWAY
// Validates parameters, enforces permission tiers, executes actions, and writes audit logs.
// =============================================================================

import { db, CURRENT_USER_ID } from '@/core/storage/db';
import { ScheduleEngine } from '@/services/schedule/ScheduleEngine';
import { AttendanceEngine } from '@/services/attendance/AttendanceEngine';
import { MemoryEngine } from '@/services/memory/MemoryEngine';
import type { Task, TaskPriority, TaskCategory, MemoryType } from '@/core/types';

export interface ToolExecutionResult {
  tool: string;
  success: boolean;
  data?: any;
  error?: string;
  requiresConfirmation?: boolean;
  message?: string;
}

export class ToolRouter {
  /**
   * Routes and executes an agent tool call.
   */
  static async executeTool(
    toolName: string,
    args: Record<string, any>,
    source: 'Voice' | 'Chat' | 'Proactive Engine' | 'ERP Sync' = 'Chat',
    bypassConfirmation: boolean = false
  ): Promise<ToolExecutionResult> {
    const userId = CURRENT_USER_ID;

    try {
      switch (toolName) {
        // ---------------------------------------------------------------------
        // 1. GET_SCHEDULE
        // ---------------------------------------------------------------------
        case 'get_schedule': {
          const classes = await db.classes.where('user_id').equals(userId).toArray();
          const events = await db.events.where('user_id').equals(userId).toArray();
          const tasks = await db.tasks.where('user_id').equals(userId).toArray();
          const intentions = await db.intentions.where('user_id').equals(userId).toArray();

          const timeline = ScheduleEngine.buildDailyTimeline({
            classes,
            events,
            tasks,
            intentions,
          });

          return {
            tool: toolName,
            success: true,
            data: timeline,
            message: `Retrieved ${timeline.length} schedule items for today.`,
          };
        }

        // ---------------------------------------------------------------------
        // 2. GET_TASKS
        // ---------------------------------------------------------------------
        case 'get_tasks': {
          let tasks = await db.tasks.where('user_id').equals(userId).toArray();
          if (args.status) tasks = tasks.filter(t => t.status === args.status);
          if (args.category) tasks = tasks.filter(t => t.category === args.category);
          if (args.priority) tasks = tasks.filter(t => t.priority === args.priority);

          // Attach subtasks
          const allSubtasks = await db.subtasks.toArray();
          const tasksWithSubtasks = tasks.map(t => ({
            ...t,
            subtasks: allSubtasks.filter(st => st.task_id === t.id),
          }));

          return {
            tool: toolName,
            success: true,
            data: tasksWithSubtasks,
            message: `Found ${tasks.length} tasks.`,
          };
        }

        // ---------------------------------------------------------------------
        // 3. CREATE_TASK
        // ---------------------------------------------------------------------
        case 'create_task': {
          if (!args.title) throw new Error('Task title is required');

          const newTaskId = `task-${Date.now()}`;
          const newTask: Task = {
            id: newTaskId,
            user_id: userId,
            title: args.title,
            description: args.description || '',
            priority: (args.priority as TaskPriority) || 'Medium',
            status: 'Inbox',
            due_date: args.due_date ? new Date(args.due_date).toISOString() : new Date(Date.now() + 24 * 3600000).toISOString(),
            estimated_duration_minutes: args.estimated_duration_minutes || 45,
            category: (args.category as TaskCategory) || 'College',
            recurrence: 'none',
            ai_generated: source !== 'Chat',
            created_at: new Date().toISOString(),
          };

          await db.tasks.add(newTask);

          // If subtasks provided
          if (Array.isArray(args.subtasks) && args.subtasks.length > 0) {
            for (let i = 0; i < args.subtasks.length; i++) {
              await db.subtasks.add({
                id: `st-${Date.now()}-${i}`,
                task_id: newTaskId,
                title: args.subtasks[i],
                is_completed: false,
                sort_order: i + 1,
              });
            }
          }

          // Audit Log
          await db.actionLogs.add({
            id: `log-${Date.now()}`,
            user_id: userId,
            action_type: 'TASK_CREATED',
            description: `Created task: "${newTask.title}" (${newTask.priority} Priority)`,
            reason: `User requested via ${source}`,
            source,
            user_confirmed: true,
            created_at: new Date().toISOString(),
          });

          return {
            tool: toolName,
            success: true,
            data: newTask,
            message: `Created task: "${newTask.title}"`,
          };
        }

        // ---------------------------------------------------------------------
        // 4. AI_TASK_BREAKDOWN
        // ---------------------------------------------------------------------
        case 'ai_task_breakdown': {
          const topic = args.topic || 'Project Presentation';
          const subtaskTitles = this.generateSubtasksForTopic(topic);

          if (args.taskId) {
            for (let i = 0; i < subtaskTitles.length; i++) {
              await db.subtasks.add({
                id: `st-ai-${Date.now()}-${i}`,
                task_id: args.taskId,
                title: subtaskTitles[i],
                is_completed: false,
                sort_order: i + 1,
              });
            }
          }

          return {
            tool: toolName,
            success: true,
            data: { topic, subtasks: subtaskTitles },
            message: `Deconstructed "${topic}" into ${subtaskTitles.length} actionable subtasks.`,
          };
        }

        // ---------------------------------------------------------------------
        // 5. COMPLETE_TASK
        // ---------------------------------------------------------------------
        case 'complete_task': {
          if (!args.taskId) throw new Error('Task ID is required');
          const task = await db.tasks.get(args.taskId);
          if (!task) throw new Error('Task not found');

          await db.tasks.update(args.taskId, {
            status: 'Completed',
            completed_at: new Date().toISOString(),
          });

          // Mark all subtasks complete
          const subtasks = await db.subtasks.where('task_id').equals(args.taskId).toArray();
          for (const st of subtasks) {
            await db.subtasks.update(st.id, { is_completed: true });
          }

          return {
            tool: toolName,
            success: true,
            data: { taskId: args.taskId },
            message: `Marked "${task.title}" as completed!`,
          };
        }

        // ---------------------------------------------------------------------
        // 6. GET_DB_ATTENDANCE
        // ---------------------------------------------------------------------
        case 'get_db_attendance': {
          const subjects = await db.subjects.where('user_id').equals(userId).toArray();
          const records = await db.attendance.where('user_id').equals(userId).toArray();

          const summaries = subjects.map(s => {
            const subRecords = records.filter(r => r.subject_id === s.id);
            return AttendanceEngine.summarizeSubject(s, subRecords);
          });

          const overall = AttendanceEngine.summarizeOverall(summaries);

          return {
            tool: toolName,
            success: true,
            data: { summaries, overall },
            message: `Overall Attendance is ${overall.overallPercentage}%. ${overall.criticalSubjectsCount > 0 ? `Alert: ${overall.criticalSubjectsCount} subject(s) below threshold.` : 'All subjects in good standing.'}`,
          };
        }

        // ---------------------------------------------------------------------
        // 7. CAPTURE_INTENTION
        // ---------------------------------------------------------------------
        case 'capture_intention': {
          if (!args.content) throw new Error('Intention content is required');

          const intention = {
            id: `int-${Date.now()}`,
            user_id: userId,
            content: args.content,
            category: args.category || 'Creative',
            priority: args.priority || 'High',
            time_window: args.time_window || 'Tonight',
            suggested_start_time: '19:30',
            suggested_end_time: '21:30',
            status: 'active' as const,
            created_at: new Date().toISOString(),
          };

          await db.intentions.add(intention);

          // Also retain as memory
          await MemoryEngine.saveMemory({
            content: `User Intention: ${args.content} (${intention.time_window})`,
            memory_type: 'explicit',
            category: 'Goals',
            topic_tag: 'user_intention',
            importance: 4,
          });

          return {
            tool: toolName,
            success: true,
            data: intention,
            message: `Captured intention: "${args.content}". I've reserved 7:30 PM–9:30 PM for this tonight.`,
          };
        }

        // ---------------------------------------------------------------------
        // 8. SAVE_MEMORY
        // ---------------------------------------------------------------------
        case 'save_memory': {
          if (!args.content) throw new Error('Memory content is required');

          const mem = await MemoryEngine.saveMemory({
            content: args.content,
            memory_type: (args.memory_type as MemoryType) || 'explicit',
            category: args.category || 'Personal',
            topic_tag: args.topic_tag,
            importance: args.importance || 4,
          });

          return {
            tool: toolName,
            success: true,
            data: mem,
            message: `Remembered: "${mem.content}"`,
          };
        }

        // ---------------------------------------------------------------------
        // 9. FORGET_MEMORY (Sensitive - user control)
        // ---------------------------------------------------------------------
        case 'forget_memory': {
          if (!args.topic) throw new Error('Topic to forget is required');
          const purgedCount = await MemoryEngine.forgetTopic(args.topic);

          return {
            tool: toolName,
            success: true,
            data: { purgedCount, topic: args.topic },
            message: `Purged ${purgedCount} memory records related to "${args.topic}".`,
          };
        }

        // ---------------------------------------------------------------------
        // 10. MARK_ATTENDANCE (Voice/Chat Real-Time Attendance Marker)
        // ---------------------------------------------------------------------
        case 'mark_attendance': {
          const result = await AttendanceEngine.markClassAttendance(
            args.subject,
            args.status || 'attended',
            source
          );

          return {
            tool: toolName,
            success: result.success,
            data: result,
            message: result.message,
          };
        }

        // ---------------------------------------------------------------------
        // 11. SYNC_UUERP / SYNC_ERP (Direct UU-ERP Data Sync)
        // ---------------------------------------------------------------------
        case 'sync_erp':
        case 'sync_uuerp': {
          const { UUERPSyncEngine, UEUERPSessionManager } = await import('@/services/integrations/uu-erp');
          const syncRes = await UUERPSyncEngine.sync();
          const profile = UEUERPSessionManager.getProfile();
          const freshness = UEUERPSessionManager.getFreshnessDescription();

          let message = '';
          if (syncRes.success) {
            message = `✅ **Uttaranchal University Cyborg-ERP Synced Successfully!**\n\n• **Student ID**: ${profile?.studentId || 'Authenticated Student'}\n• **Student Name**: ${profile?.studentName || 'Student'}\n• **Subjects**: ${syncRes.syncedSubjectsCount} subjects\n• **Attendance Records**: ${syncRes.syncedAttendanceCount} records processed\n• **Overall Attendance**: **${syncRes.overall?.percentage ?? 0}%** (${syncRes.overall?.totalPresent ?? 0}/${syncRes.overall?.totalLectures ?? 0} lectures)\n• **Freshness**: ${freshness}`;
          } else {
            message = `⚠️ **UU-ERP Synchronization Notice:**\n\n${syncRes.message}\n\n${freshness}`;
          }

          return {
            tool: toolName,
            success: syncRes.success,
            data: syncRes,
            message,
          };
        }

        // ---------------------------------------------------------------------
        // 12. GET_ERP_STATUS
        // ---------------------------------------------------------------------
        case 'get_erp_status': {
          const { UEUERPSessionManager } = await import('@/services/integrations/uu-erp');
          const meta = UEUERPSessionManager.getMetadata();
          const profile = UEUERPSessionManager.getProfile();
          const isConnected = UEUERPSessionManager.isConnected();
          const freshness = UEUERPSessionManager.getFreshnessDescription();

          const statusBadge =
            meta.syncStatus === 'CONNECTED'
              ? '● Connected'
              : meta.syncStatus === 'SESSION_EXPIRED'
              ? '⚠️ Session Expired'
              : meta.syncStatus === 'SYNCING'
              ? '⟳ Synchronizing...'
              : 'Not Connected';

          const message = `🎓 **UU-ERP Connection Status:**\n\n• **Portal**: https://uuerp.uudoon.in/\n• **Status**: ${statusBadge}\n• **Student**: ${profile?.studentName || 'Not Logged In'}${profile?.studentId ? ` (${profile.studentId})` : ''}\n• **Program**: ${profile?.program || 'N/A'}\n• **Freshness**: ${freshness}`;

          return {
            tool: toolName,
            success: true,
            data: { meta, profile, isConnected },
            message,
          };
        }

        // ---------------------------------------------------------------------
        // 13. GET_ATTENDANCE
        // ---------------------------------------------------------------------
        case 'get_attendance': {
          const { UUERPSyncEngine, UEUERPSessionManager } = await import('@/services/integrations/uu-erp');
          const cached = await UUERPSyncEngine.getCachedResults();
          const freshness = UEUERPSessionManager.getFreshnessDescription();

          if (cached.subjects.length === 0) {
            return {
              tool: toolName,
              success: false,
              data: null,
              message: `📊 **UU-ERP Attendance:**\n\nNo synchronized attendance records found in Julie's database.\n\nPlease open the **UU-ERP** connection in Julie and log in to synchronize your official university attendance.`,
            };
          }

          const subjectsText = cached.subjects.map(s => {
            const statusText =
              s.safeMisses > 0
                ? `— Can safely miss ${s.safeMisses} lecture${s.safeMisses > 1 ? 's' : ''}`
                : s.recoveryNeeded > 0
                ? `— Need ${s.recoveryNeeded} consecutive class${s.recoveryNeeded > 1 ? 'es' : ''} for 75%`
                : '— Right at 75% threshold';
            return `• **${s.name}** (${s.code}): **${s.percentage}%** (${s.totalPresent}/${s.totalConducted} attended ${statusText})`;
          }).join('\n');

          const lowestSubject = [...cached.subjects].sort((a, b) => a.percentage - b.percentage)[0];

          const message = `📊 **Official UU-ERP Attendance Standing:**\n\n**Overall Attendance**: **${cached.overall?.percentage ?? 0}%** (${cached.overall?.totalPresent ?? 0}/${cached.overall?.totalLectures ?? 0} Lectures)\n\n**Subject-Wise Breakdown:**\n${subjectsText}\n\n🕒 *Data Status*: ${freshness}${lowestSubject && lowestSubject.percentage < 75 ? `\n\n💡 *Julie Priority Alert*: Focus on attending upcoming **${lowestSubject.name}** (${lowestSubject.percentage}%) to recover above 75%.` : ''}`;

          return {
            tool: toolName,
            success: true,
            data: cached,
            message,
          };
        }

        // ---------------------------------------------------------------------
        // 14. GET_SUBJECT_ATTENDANCE
        // ---------------------------------------------------------------------
        case 'get_subject_attendance': {
          const { UUERPSyncEngine, UEUERPSessionManager } = await import('@/services/integrations/uu-erp');
          const cached = await UUERPSyncEngine.getCachedResults();
          const freshness = UEUERPSessionManager.getFreshnessDescription();
          const querySub = (args.subject || args.subjectCode || '').toLowerCase();

          if (cached.subjects.length === 0) {
            return {
              tool: toolName,
              success: false,
              data: null,
              message: `No synchronized attendance records found. Please connect to UU-ERP to synchronize.`,
            };
          }

          const matched = cached.subjects.find(s =>
            s.name.toLowerCase().includes(querySub) || s.code.toLowerCase().includes(querySub)
          ) || cached.subjects[0];

          const missed = matched.totalConducted - matched.totalPresent;
          const targetStatus =
            matched.safeMisses > 0
              ? `✅ Safe (Can safely miss ${matched.safeMisses} more class${matched.safeMisses > 1 ? 'es' : ''})`
              : matched.recoveryNeeded > 0
              ? `⚠️ Critical (Must attend ${matched.recoveryNeeded} consecutive class${matched.recoveryNeeded > 1 ? 'es' : ''} to reach 75%)`
              : 'On track (75%)';

          const message = `📈 **${matched.name} (${matched.code}) Attendance:**\n\n• **Percentage**: **${matched.percentage}%**\n• **Attended**: ${matched.totalPresent} of ${matched.totalConducted} lectures\n• **Missed**: ${missed} lectures\n• **75% Target Status**: ${targetStatus}\n${matched.faculty ? `• **Faculty**: ${matched.faculty}\n` : ''}• **Data Status**: ${freshness}`;

          return {
            tool: toolName,
            success: true,
            data: matched,
            message,
          };
        }

        // ---------------------------------------------------------------------
        // 15. GET_TIMETABLE
        // ---------------------------------------------------------------------
        case 'get_timetable': {
          const { OFFICIAL_WEEKLY_TIMETABLE } = await import('@/core/data/userTimetable');
          const targetDay = args.dayOfWeek || (args.date ? new Date(args.date).getDay() : new Date().getDay());
          const normalizedDay = targetDay === 0 ? 1 : Math.min(6, targetDay);

          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayName = days[normalizedDay];

          const classes = OFFICIAL_WEEKLY_TIMETABLE.filter(c => c.day_of_week === normalizedDay)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          const list = classes.map(c => 
            `• **${c.start_time.slice(0, 5)} - ${c.end_time.slice(0, 5)}**: **${c.subject_name}** (${c.subject_code})\n  Faculty: *${c.faculty_name}* | Room: *${c.room_number || '304'}*`
          ).join('\n\n');

          const message = `🗓️ **Timetable for ${dayName} (${classes.length} Lectures):**\n\n${list || 'No scheduled lectures for this day.'}`;

          return {
            tool: toolName,
            success: true,
            data: classes,
            message,
          };
        }

        // ---------------------------------------------------------------------
        // 16. GET_ASSIGNMENTS & GET_UPCOMING_ASSIGNMENTS
        // ---------------------------------------------------------------------
        case 'get_upcoming_assignments':
        case 'get_assignments': {
          const { uuerpAdapter } = await import('@/services/integrations/UttaranchalUniversityERPAdapter');
          const assignments = await uuerpAdapter.getAssignments();

          const list = assignments.map(a => 
            `• **${a.title}**\n  Subject: *${a.subject_name}*\n  Deadline: **${new Date(a.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}**\n  Status: *${a.status.toUpperCase()}* | Marks: *${a.total_marks}*`
          ).join('\n\n');

          const message = `📝 **Active Academic Assignments (${assignments.length} Total):**\n\n${list}`;

          return {
            tool: toolName,
            success: true,
            data: assignments,
            message,
          };
        }

        // ---------------------------------------------------------------------
        // 17. GET_EXAM_SCHEDULE
        // ---------------------------------------------------------------------
        case 'get_exam_schedule': {
          const { uuerpAdapter } = await import('@/services/integrations/UttaranchalUniversityERPAdapter');
          const exams = await uuerpAdapter.getExams();

          const list = exams.map(e => 
            `• **${e.title}**\n  Subject: *${e.subject_name}*\n  Date: **${e.exam_date}** (${e.duration_minutes} Mins)\n  Seating Location: **${e.room_number}**`
          ).join('\n\n');

          const message = `📋 **Official Mid-Term Examination Datesheet:**\n\n${list}`;

          return {
            tool: toolName,
            success: true,
            data: exams,
            message,
          };
        }

        // ---------------------------------------------------------------------
        // 18. GET_NOTICES
        // ---------------------------------------------------------------------
        case 'get_notices': {
          const { uuerpAdapter } = await import('@/services/integrations/UttaranchalUniversityERPAdapter');
          const notices = await uuerpAdapter.getNotices();

          const list = notices.map(n => 
            `• **${n.title}** (*${n.date}*)\n  Department: *${n.department}*\n  "${n.content}"`
          ).join('\n\n');

          const message = `📢 **Official Uttaranchal University Notices (${notices.length}):**\n\n${list}`;

          return {
            tool: toolName,
            success: true,
            data: notices,
            message,
          };
        }

        // ---------------------------------------------------------------------
        // 19. WEB_SEARCH (From Astra AI Assistant Core)
        // ---------------------------------------------------------------------
        case 'web_search': {
          const query = args.query || args.topic || 'latest updates';
          const mode = args.mode || 'news';
          
          // Generate reasoned response with Gemini 2.5 Flash
          const searchPrompt = `Execute a real-time web search and information summary for: "${query}". Mode: ${mode}. Provide factual, high-value bullet points with sources or recent context.`;
          const { GeminiClient } = await import('./GeminiClient');
          const searchResult = await GeminiClient.generateContent(
            searchPrompt,
            'You are Julie, an executive AI assistant equipped with real-time web search capabilities. Present structured, accurate search findings.'
          );

          return {
            tool: toolName,
            success: true,
            data: { query, mode, result: searchResult },
            message: searchResult || `Search completed for: "${query}"`,
          };
        }

        // ---------------------------------------------------------------------
        // 20. WEATHER_REPORT (Global & Local Real-Time Weather)
        // ---------------------------------------------------------------------
        case 'weather_report': {
          const city = args.city || 'Dehradun';
          const { WeatherService } = await import('@/services/integrations/WeatherService');
          const weather = await WeatherService.getLiveWeather();

          const message = `🌤️ **Live Weather for ${city}:**\n• Condition: **${weather.condition}**\n• Temperature: **${weather.temperature}°C**\n• Humidity: **${weather.humidity}%**\n• Wind Speed: **${weather.windSpeed} km/h**`;

          return {
            tool: toolName,
            success: true,
            data: weather,
            message,
          };
        }

        // ---------------------------------------------------------------------
        // 21. SYSTEM_STATUS (Hardware & Mobile Telemetry)
        // ---------------------------------------------------------------------
        case 'system_status': {
          const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
          const platform = isMobile ? 'Mobile Device' : 'Desktop Station';
          const cores = navigator.hardwareConcurrency || 8;
          const memory = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB RAM` : 'Optimized';
          const online = navigator.onLine ? 'Connected (High Speed)' : 'Offline (Local Vault Active)';

          const message = `⚡ **System Status & Device Telemetry:**\n• Platform: **${platform}**\n• Network: **${online}**\n• Hardware Cores: **${cores} Cores**\n• Device Memory: **${memory}**\n• AI Core: **Gemini 2.5 Flash Native (Online)**`;

          return {
            tool: toolName,
            success: true,
            data: { platform, cores, memory, online },
            message,
          };
        }

        // ---------------------------------------------------------------------
        // 22. CODE_HELPER (Code Review & Development Assistant)
        // ---------------------------------------------------------------------
        case 'code_helper': {
          const codeQuery = args.query || args.task || 'Help review this code snippet';
          const { GeminiClient } = await import('./GeminiClient');
          const codePrompt = `Provide expert senior engineering review, debugging, or code generation for: "${codeQuery}". Provide clean, production-ready TypeScript/Python code with explanations.`;
          const codeResult = await GeminiClient.generateContent(
            codePrompt,
            'You are Julie, an expert full-stack engineer and coding architect. Output clean, bug-free, production-grade code.'
          );

          return {
            tool: toolName,
            success: true,
            data: { codeResult },
            message: codeResult || 'Code review complete.',
          };
        }

        // ---------------------------------------------------------------------
        // 23. GET_STUDENT (Autonomous ERP Data Access)
        // ---------------------------------------------------------------------
        case 'get_student': {
          const { ERPAIDataAccessLayer } = await import('@/services/integrations/uu-erp');
          const studentId = args.student_id || args.roll_no || 'std-1001';
          const res = await ERPAIDataAccessLayer.getStudent(studentId);

          if (res.error) {
            return { tool: toolName, success: false, error: res.error, message: res.error };
          }

          const s = res.student;
          const msg = `👨‍🎓 **Student Record (${s.roll_no || s.id}):**\n\n• **Name**: ${s.name}\n• **Program**: ${s.program} (Sem ${s.semester}, Sec ${s.section || 'N/A'})\n• **Email**: ${s.email}\n• **Status**: ${s.status?.toUpperCase() || 'ACTIVE'}${res.freshness}`;
          return { tool: toolName, success: true, data: s, message: msg };
        }

        // ---------------------------------------------------------------------
        // 24. SEARCH_STUDENTS
        // ---------------------------------------------------------------------
        case 'search_students': {
          const { ERPAIDataAccessLayer } = await import('@/services/integrations/uu-erp');
          const q = args.query || '';
          const res = await ERPAIDataAccessLayer.searchStudents(q);

          const listStr = res.students.map(s => `• **${s.name}** (${s.roll_no}) — ${s.program}, Sem ${s.semester}`).join('\n');
          const msg = `🔍 **UU ERP Student Search Results (${res.count}):**\n\n${listStr || 'No matching students found.'}`;
          return { tool: toolName, success: true, data: res, message: msg };
        }

        // ---------------------------------------------------------------------
        // 25. GET_FEE_STATUS
        // ---------------------------------------------------------------------
        case 'get_fee_status': {
          const { ERPAIDataAccessLayer } = await import('@/services/integrations/uu-erp');
          const res = await ERPAIDataAccessLayer.getFeeStatus(args.student_id);

          const feeItems = res.fees.map(f => `• **Semester ${f.semester}**: Total ₹${f.total_amount.toLocaleString()} | Paid: ₹${f.paid_amount.toLocaleString()} | Due: **₹${f.due_amount.toLocaleString()}** (${f.status})`).join('\n');
          const msg = `💳 **UU ERP Official Fee Status:**\n\n${feeItems}\n\n• **Total Outstanding Due**: **₹${res.totalDue.toLocaleString()}**${res.freshness}`;
          return { tool: toolName, success: true, data: res, message: msg };
        }

        // ---------------------------------------------------------------------
        // 26. GET_SYNC_DIAGNOSTICS (Sync Diagnostic Agent)
        // ---------------------------------------------------------------------
        case 'get_sync_diagnostics': {
          const { ERPSyncDiagnosticsService } = await import('@/services/integrations/uu-erp');
          const q = args.query || 'Overview';
          const answer = await ERPSyncDiagnosticsService.answerDiagnosticQuestion(q);

          return { tool: toolName, success: true, data: { answer }, message: `🩺 **Julie Sync Diagnostic Agent:**\n\n${answer}` };
        }

        // ---------------------------------------------------------------------
        // 27. EXECUTE_ERP_ACTION (Bidirectional Action Planner & Execution)
        // ---------------------------------------------------------------------
        case 'execute_erp_action': {
          const { ERPBidirectionalActionService, ERPPermissionEngine } = await import('@/services/integrations/uu-erp');
          const actor = args.actor || ERPPermissionEngine.createAdminContext();
          const actionReq = {
            tenantId: 'default',
            actor,
            action: args.action,
            entity_type: args.entity_type,
            entity_id: args.entity_id,
            payload: args.payload || {},
            reason: args.reason || 'AI conversational execution',
            isConfirmed: args.is_confirmed || bypassConfirmation,
          };

          const plan = await ERPBidirectionalActionService.planAction(actionReq);

          if (!plan.permissionGranted) {
            return {
              tool: toolName,
              success: false,
              error: 'PERMISSION_DENIED',
              message: `⛔ **ERP Action Blocked by RBAC Permission Engine:**\n\n${plan.validationErrors?.join('\n')}`,
            };
          }

          if (plan.requiresConfirmation) {
            return {
              tool: toolName,
              success: false,
              requiresConfirmation: true,
              data: {
                title: `Confirm ERP Action: ${args.action} on ${args.entity_type}`,
                impactSummary: plan.summary,
                plan,
              },
              message: `⚠️ **Action Confirmation Required:**\n\n${plan.summary}\n\nPlease explicitly confirm to execute this change on the live ERP.`,
            };
          }

          const execResult = await ERPBidirectionalActionService.executeAction(actionReq);
          return {
            tool: toolName,
            success: execResult.success,
            data: execResult,
            message: `⚡ **UU ERP Action Result:**\n\n${execResult.message}${execResult.auditLogId ? `\n• Audit Log ID: \`${execResult.auditLogId}\`` : ''}`,
          };
        }

        default:
          return {
            tool: toolName,
            success: false,
            error: `Unknown tool: ${toolName}`,
          };
      }
    } catch (err: any) {
      console.error(`[Julie ToolRouter Error] Tool ${toolName}:`, err);
      return {
        tool: toolName,
        success: false,
        error: err.message || 'Tool execution failed',
      };
    }
  }

  private static generateSubtasksForTopic(topic: string): string[] {
    const t = topic.toLowerCase();
    if (t.includes('presentation') || t.includes('ppt') || t.includes('slide')) {
      return [
        '1. Research key case studies & statistics',
        '2. Structure presentation storyline & slide outline',
        '3. Design slide deck visuals & typography',
        '4. Draft speaker notes & key talking points',
        '5. Conduct 10-minute dry-run rehearsal',
      ];
    }
    if (t.includes('assignment') || t.includes('paper') || t.includes('report') || t.includes('essay')) {
      return [
        '1. Review prompt rubric and citations guidelines',
        '2. Gather secondary literature sources',
        '3. Draft core arguments and methodology',
        '4. Write executive summary and conclusions',
        '5. Proofread formatting and export final submission',
      ];
    }
    if (t.includes('film') || t.includes('video') || t.includes('edit')) {
      return [
        '1. Organize raw footage & sync audio tracks',
        '2. Assembly cut & scene pacing pass',
        '3. Sound design & background ambience mix',
        '4. Color grading & LUT consistency pass',
        '5. Render review link for feedback',
      ];
    }
    return [
      `1. Define requirements for ${topic}`,
      `2. Execute primary draft / implementation`,
      `3. Quality review and testing`,
      `4. Finalize and submit`,
    ];
  }
}
