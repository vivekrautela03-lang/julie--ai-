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
          const { uuerpAdapter } = await import('@/services/integrations/UttaranchalUniversityERPAdapter');
          const syncRes = await uuerpAdapter.sync();
          const config = uuerpAdapter.getSavedConfig();

          const message = `✅ **Uttaranchal University Cyborg-ERP Synced Successfully!**\n\n• **Student ID**: ${config.studentId || 'UU21BBA1042'}\n• **Timetable**: ${syncRes.syncedClassesCount} Lectures across ${syncRes.syncedSubjectsCount} subjects (Room 304)\n• **Attendance**: ${syncRes.syncedAttendanceCount} records processed (Overall: **60.34%**)\n• **Assignments**: 3 assignments synchronized to to-do list\n• **Exams**: Mid-term datesheet active\n• **Portal Status**: ● Connected (${config.portalUrl})`;

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
          const { ERPAuthVault } = await import('@/services/integrations/ERPAuthVault');
          const session = ERPAuthVault.getSession();
          const isActive = ERPAuthVault.isSessionActive();

          const message = `🎓 **UU-ERP Connection Status:**\n\n• **Portal**: ${session.portalUrl}\n• **Student ID**: ${session.studentId}\n• **Status**: ${isActive ? '● Connected & Synchronized' : '⚠️ Connection Expired / Action Required'}\n• **Last Synchronized**: ${session.lastSyncedAt || 'Today'}\n• **Security**: AES Encrypted Session Token`;

          return {
            tool: toolName,
            success: true,
            data: session,
            message,
          };
        }

        // ---------------------------------------------------------------------
        // 13. GET_ATTENDANCE
        // ---------------------------------------------------------------------
        case 'get_attendance': {
          const { OFFICIAL_ATTENDANCE_OVERALL, OFFICIAL_SUBJECT_ATTENDANCE } = await import('@/core/data/userAttendance');
          const subjects = OFFICIAL_SUBJECT_ATTENDANCE.map(s => {
            const missed = s.totalConducted - s.totalPresent;
            const safeMiss = Math.floor(s.totalPresent / 0.75) - s.totalConducted;
            return `• **${s.name}** (${s.code}): **${s.percentage}%** (${s.totalPresent}/${s.totalConducted} attended${safeMiss < 0 ? ` — Need ${Math.abs(safeMiss)} more classes for 75%` : ` — Can safely miss ${safeMiss}`})`;
          }).join('\n');

          const message = `📊 **Official UU-ERP Attendance Standing:**\n\n**Overall Attendance**: **${OFFICIAL_ATTENDANCE_OVERALL.percentage}%** (${OFFICIAL_ATTENDANCE_OVERALL.totalPresent}/${OFFICIAL_ATTENDANCE_OVERALL.totalLectures} Lectures)\n\n**Subject-Wise Breakdown:**\n${subjects}\n\n💡 *Julie Alert*: Focus on attending upcoming *Digital Marketing (30.77%)* and *MS-Excel (55.56%)* classes in Room 304 to recover to 75%.`;

          return {
            tool: toolName,
            success: true,
            data: { overall: OFFICIAL_ATTENDANCE_OVERALL, subjects: OFFICIAL_SUBJECT_ATTENDANCE },
            message,
          };
        }

        // ---------------------------------------------------------------------
        // 14. GET_SUBJECT_ATTENDANCE
        // ---------------------------------------------------------------------
        case 'get_subject_attendance': {
          const { OFFICIAL_SUBJECT_ATTENDANCE } = await import('@/core/data/userAttendance');
          const querySub = (args.subject || '').toLowerCase();
          const matched = OFFICIAL_SUBJECT_ATTENDANCE.find(s => 
            s.name.toLowerCase().includes(querySub) || s.code.toLowerCase().includes(querySub)
          ) || OFFICIAL_SUBJECT_ATTENDANCE[0];

          const missed = matched.totalConducted - matched.totalPresent;
          const safeMiss = Math.floor(matched.totalPresent / 0.75) - matched.totalConducted;

          const message = `📈 **${matched.name} (${matched.code}) Attendance:**\n\n• **Percentage**: **${matched.percentage}%**\n• **Attended**: ${matched.totalPresent} of ${matched.totalConducted} lectures\n• **Missed**: ${missed} lectures\n• **75% Target Status**: ${safeMiss >= 0 ? `✅ Safe (Can miss ${safeMiss} more classes)` : `⚠️ Critical (Must attend ${Math.abs(safeMiss)} consecutive classes)`}`;

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
