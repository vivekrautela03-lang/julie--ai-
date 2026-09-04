// =============================================================================
// PROJECT JULIE — LIVE AI SERVICE & MODEL ROUTER
// Routes all queries through connected Gemini API with context and thinking instructions
// =============================================================================

import { db, CURRENT_USER_ID } from '@/core/storage/db';
import { ContextBuilder } from './ContextBuilder';
import { PromptManager } from './PromptManager';
import { ToolRouter, type ToolExecutionResult } from './ToolRouter';
import { GeminiClient } from './GeminiClient';

export interface AIResponse {
  message: string;
  toolResults: ToolExecutionResult[];
  contextSummary: {
    classesCount: number;
    pendingTasksCount: number;
  };
}

export class AIService {
  /**
   * Processes a user prompt by retrieving live context, executing appropriate background tools,
   * sending to the connected Gemini model API, and returning clean, reasoned output.
   */
  static async processMessage(
    userQuery: string,
    source: 'Voice' | 'Chat' = 'Chat',
    conversationId: string = 'conv-main'
  ): Promise<AIResponse> {
    const userId = CURRENT_USER_ID;
    const cleanQuery = userQuery.trim();

    // 1. Build live structured context
    const context = await ContextBuilder.buildContext(cleanQuery);
    const prefs = await db.preferences.where('user_id').equals(userId).first();

    // 2. Persist user message to DB
    const userMsgId = `msg-${Date.now()}-user`;
    await db.messages.add({
      id: userMsgId,
      conversation_id: conversationId,
      user_id: userId,
      sender: 'user',
      content: cleanQuery,
      created_at: new Date().toISOString(),
    });

    // 3. Background Tool Routing for mutations (creating tasks, intentions, memory)
    const toolResults: ToolExecutionResult[] = [];
    const qLower = cleanQuery.toLowerCase();

    // 1. UU-ERP / uudoonerp Synchronization Routing
    if (
      qLower.includes('uudoonerp') ||
      qLower.includes('uuerp') ||
      qLower.includes('uudoon') ||
      qLower.includes('check my erp') ||
      qLower.includes('check erp') ||
      qLower.includes('sync erp') ||
      qLower.includes('sync my college') ||
      qLower.includes('access my erp')
    ) {
      const toolRes = await ToolRouter.executeTool('sync_erp', {}, source);
      toolResults.push(toolRes);
    }
    // 2. Specific Subject Attendance (e.g. "attendance in marketing", "can I miss marketing")
    else if (
      (qLower.includes('attendance in') || qLower.includes('can i miss')) &&
      (qLower.includes('marketing') || qLower.includes('law') || qLower.includes('accounting') || qLower.includes('economics') || qLower.includes('excel') || qLower.includes('environment'))
    ) {
      const toolRes = await ToolRouter.executeTool('get_subject_attendance', { subject: cleanQuery }, source);
      toolResults.push(toolRes);
    }
    // 3. Overall Attendance standing (e.g. "what's my attendance", "lowest attendance", "how many classes have I attended")
    else if (
      (qLower.includes('attendance') ||
       qLower.includes('classes have i attended') ||
       qLower.includes('lowest attendance') ||
       qLower.includes('attendance percentage') ||
       qLower.includes('safe miss')) &&
      !qLower.includes('mark') &&
      !qLower.includes('attended my') &&
      !qLower.includes('attended the') &&
      !qLower.includes('attended class')
    ) {
      const toolRes = await ToolRouter.executeTool('get_attendance', {}, source);
      toolResults.push(toolRes);
    }
    // 3b. Fees & Financial Status (e.g. "show unpaid fees", "what is my fee balance", "fee receipt")
    else if (qLower.includes('fee') || qLower.includes('tuition') || qLower.includes('payment due') || qLower.includes('unpaid')) {
      const toolRes = await ToolRouter.executeTool('get_fee_status', {}, source);
      toolResults.push(toolRes);
    }
    // 3c. Student Profile & Directory Search
    else if (qLower.includes('find student') || qLower.includes('search student') || qLower.includes('who is rahul') || qLower.includes('student record')) {
      const toolRes = await ToolRouter.executeTool('search_students', { query: cleanQuery }, source);
      toolResults.push(toolRes);
    }
    // 3d. Sync Health & Telemetry Diagnostics (e.g. "why is attendance not updating", "sync diagnostics", "is erp reachable")
    else if (
      qLower.includes('diagnostic') ||
      qLower.includes('why is julie not') ||
      qLower.includes('why is attendance not') ||
      qLower.includes('sync lag') ||
      qLower.includes('queue status') ||
      qLower.includes('webhook status')
    ) {
      const toolRes = await ToolRouter.executeTool('get_sync_diagnostics', { query: cleanQuery }, source);
      toolResults.push(toolRes);
    }
    // 4. Mark attendance for attended/missed class
    else if (
      qLower.includes('mark my attendance') ||
      qLower.includes('mark attendance') ||
      qLower.includes('mark as attended') ||
      qLower.includes('mark as missed') ||
      qLower.includes('present in class') ||
      qLower.includes('missed class')
    ) {
      const isMissed = qLower.includes('missed');
      const toolRes = await ToolRouter.executeTool(
        'mark_attendance',
        { subject: cleanQuery, status: isMissed ? 'missed' : 'attended' },
        source
      );
      toolResults.push(toolRes);
    }
    // 5. Timetable queries (e.g. "what classes do I have tomorrow", "what do I have tomorrow", "show timetable")
    else if (
      (qLower.includes('classes') || qLower.includes('class') || qLower.includes('timetable') || qLower.includes('schedule') || qLower.includes('what do i have')) &&
      (qLower.includes('tomorrow') || qLower.includes('today') || qLower.includes('monday') || qLower.includes('tuesday') || qLower.includes('wednesday') || qLower.includes('thursday') || qLower.includes('friday') || qLower.includes('saturday'))
    ) {
      const now = new Date();
      let dayIndex = now.getDay();
      if (qLower.includes('tomorrow')) dayIndex = dayIndex >= 6 ? 1 : dayIndex + 1;
      else if (qLower.includes('monday')) dayIndex = 1;
      else if (qLower.includes('tuesday')) dayIndex = 2;
      else if (qLower.includes('wednesday')) dayIndex = 3;
      else if (qLower.includes('thursday')) dayIndex = 4;
      else if (qLower.includes('friday')) dayIndex = 5;
      else if (qLower.includes('saturday')) dayIndex = 6;

      const toolRes = await ToolRouter.executeTool('get_timetable', { dayOfWeek: dayIndex }, source);
      toolResults.push(toolRes);
    }
    // 6. Assignment queries (e.g. "what assignments are due", "do I have any assignments due", "what do I need to complete this week")
    else if (
      qLower.includes('assignment') ||
      qLower.includes('assignments') ||
      qLower.includes('homework') ||
      (qLower.includes('complete') && qLower.includes('this week'))
    ) {
      const toolRes = await ToolRouter.executeTool('get_upcoming_assignments', {}, source);
      toolResults.push(toolRes);
    }
    // 7. Exam queries (e.g. "show me my upcoming exams", "when are my exams", "datesheet")
    else if (
      qLower.includes('exam') ||
      qLower.includes('exams') ||
      qLower.includes('datesheet') ||
      qLower.includes('mid-term') ||
      qLower.includes('midterm')
    ) {
      const toolRes = await ToolRouter.executeTool('get_exam_schedule', {}, source);
      toolResults.push(toolRes);
    }
    // 8. Notices queries (e.g. "any new notices", "show college notices", "circulars")
    else if (
      qLower.includes('notice') ||
      qLower.includes('notices') ||
      qLower.includes('circular') ||
      qLower.includes('circulars') ||
      qLower.includes('announcement')
    ) {
      const toolRes = await ToolRouter.executeTool('get_notices', {}, source);
      toolResults.push(toolRes);
    }
    // 9. Intention capture
    else if (
      qLower.includes('want to') ||
      qLower.includes('thinking of') ||
      qLower.includes('plan to') ||
      qLower.includes('film tonight')
    ) {
      const toolRes = await ToolRouter.executeTool(
        'capture_intention',
        {
          content: cleanQuery.replace(/^(julie|hey julie|please)/i, '').trim(),
          time_window: qLower.includes('tonight') ? 'Tonight' : qLower.includes('afternoon') ? 'Afternoon' : 'Evening',
          category: qLower.includes('film') ? 'Creative' : qLower.includes('study') ? 'Study' : 'Personal',
        },
        source
      );
      toolResults.push(toolRes);
    }
    // 10. Task creation
    else if (qLower.includes('add task') || qLower.includes('create task') || qLower.includes('add assignment')) {
      const title = cleanQuery.replace(/^(add task|create task|add assignment)/i, '').trim() || 'New Task';
      const toolRes = await ToolRouter.executeTool('create_task', { title, priority: 'High', category: 'College' }, source);
      toolResults.push(toolRes);
    }
    // 11. Task completion
    else if (qLower.includes('complete task') || qLower.includes('done with')) {
      const tasks = await db.tasks.toArray();
      const matched = tasks.find(t => cleanQuery.toLowerCase().includes(t.title.toLowerCase()));
      if (matched) {
        const toolRes = await ToolRouter.executeTool('complete_task', { taskId: matched.id }, source);
        toolResults.push(toolRes);
      }
    }
    // 12. Memory storage
    else if (qLower.includes('remember that') || qLower.includes('keep in mind')) {
      const content = cleanQuery.replace(/^(remember that|keep in mind)/i, '').trim();
      const toolRes = await ToolRouter.executeTool('save_memory', { content, memory_type: 'explicit', category: 'Goals' }, source);
      toolResults.push(toolRes);
    }
    // 13. Web Search (News, Research, Latest Information)
    else if (
      qLower.startsWith('search ') ||
      qLower.startsWith('google ') ||
      qLower.includes('search web') ||
      qLower.includes('latest news') ||
      qLower.includes('search for')
    ) {
      const q = cleanQuery.replace(/^(search for|search web for|search web|search|google)/i, '').trim();
      const toolRes = await ToolRouter.executeTool('web_search', { query: q, mode: 'news' }, source);
      toolResults.push(toolRes);
    }
    // 14. Live Weather
    else if (qLower.includes('weather') || qLower.includes('temperature today') || qLower.includes('forecast')) {
      const toolRes = await ToolRouter.executeTool('weather_report', { city: 'Dehradun' }, source);
      toolResults.push(toolRes);
    }
    // 15. System Status / Hardware Telemetry
    else if (
      qLower.includes('system status') ||
      qLower.includes('hardware') ||
      qLower.includes('cpu') ||
      qLower.includes('device status') ||
      qLower.includes('battery')
    ) {
      const toolRes = await ToolRouter.executeTool('system_status', {}, source);
      toolResults.push(toolRes);
    }
    // 16. Code Helper / Debugging
    else if (
      qLower.includes('review this code') ||
      qLower.includes('write code') ||
      qLower.includes('debug') ||
      qLower.startsWith('code ')
    ) {
      const toolRes = await ToolRouter.executeTool('code_helper', { query: cleanQuery }, source);
      toolResults.push(toolRes);
    }

    // 4. Retrieve recent message history for conversational memory
    const historyRecords = await db.messages.where('conversation_id').equals(conversationId).reverse().limit(6).toArray();
    const history = historyRecords.reverse().map(m => ({ sender: m.sender, content: m.content }));

    // 5. Build system instruction with live context and Boss Lady persona
    const systemPrompt = PromptManager.getSystemPrompt(context, prefs?.assistant_tone || 'Confident & Proactive');

    // If a deterministic tool executed successfully, use its accurate factual result
    const executedDirectTool = toolResults.find(t => t.success && t.message);
    let responseText: string | null = executedDirectTool?.message || null;

    // 6. Query Connected Gemini Model API if no direct deterministic message
    if (!responseText) {
      responseText = await GeminiClient.generateContent(cleanQuery, systemPrompt, history);
    }

    // Fallback if network or model temporarily unavailable
    if (!responseText) {
      const count = context.today_classes.length;
      const first = context.today_classes[0];
      responseText = `I'm on it, ${context.user_title}. You have ${count} classes scheduled today${first ? ` starting with ${first.name} at ${first.time}` : ''}. Your top focus right now is completing your Marketing assignment before tonight's creative work.`;
    }

    // 7. Save Assistant Response to DB
    const asstMsgId = `msg-${Date.now()}-assistant`;
    await db.messages.add({
      id: asstMsgId,
      conversation_id: conversationId,
      user_id: userId,
      sender: 'assistant',
      content: responseText,
      tool_calls: toolResults.map(tr => ({
        name: tr.tool,
        arguments: {},
        status: tr.success ? 'success' : 'failed',
      })),
      context_used: {
        classes_today: context.today_classes.length,
        pending_tasks: context.pending_tasks.length,
        intentions_active: context.active_intentions.length,
      },
      created_at: new Date().toISOString(),
    });

    return {
      message: responseText,
      toolResults,
      contextSummary: {
        classesCount: context.today_classes.length,
        pendingTasksCount: context.pending_tasks.length,
      },
    };
  }

  /**
   * Archives current conversation session, extracts project tags, saves to DB & backs up to Supabase.
   */
  static async archiveConversationSession(
    conversationId: string,
    customTitle?: string,
    customProjectTag?: string
  ) {
    const msgs = await db.messages.where('conversation_id').equals(conversationId).toArray();
    if (msgs.length === 0) return null;

    const firstUserMsg = msgs.find(m => m.sender === 'user')?.content || 'General Conversation';
    
    // Infer project tag based on content
    let tag = customProjectTag || 'General';
    const textSample = msgs.map(m => m.content).join(' ').toLowerCase();

    if (textSample.includes('marketing') || textSample.includes('digital') || textSample.includes('campaign')) {
      tag = 'Digital Marketing';
    } else if (textSample.includes('attendance') || textSample.includes('shortage') || textSample.includes('uuerp')) {
      tag = 'Attendance';
    } else if (textSample.includes('film') || textSample.includes('script') || textSample.includes('creative')) {
      tag = 'Film Project';
    } else if (textSample.includes('law') || textSample.includes('contract') || textSample.includes('namita')) {
      tag = 'Business Law';
    } else if (textSample.includes('excel') || textSample.includes('accounting') || textSample.includes('exam')) {
      tag = 'Academic';
    }

    const title = customTitle || (
      firstUserMsg.length > 40
        ? firstUserMsg.slice(0, 38) + '...'
        : firstUserMsg
    );

    const session = {
      id: conversationId,
      user_id: CURRENT_USER_ID,
      title,
      project_tag: tag,
      summary: msgs[msgs.length - 1]?.content.slice(0, 100) + '...',
      message_count: msgs.length,
      created_at: msgs[0]?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.conversations.put(session);

    // Backup safely to Supabase
    try {
      const { SupabaseSyncService } = await import('@/services/integrations/SupabaseSyncService');
      SupabaseSyncService.pushToCloud().catch(e => console.warn('[Supabase Sync Cloud Note]:', e));
    } catch (e) {}

    return session;
  }
}
