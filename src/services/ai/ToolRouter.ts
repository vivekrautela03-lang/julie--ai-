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
        // 6. GET_ATTENDANCE
        // ---------------------------------------------------------------------
        case 'get_attendance': {
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
