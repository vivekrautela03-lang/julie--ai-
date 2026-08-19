// =============================================================================
// PROJECT JULIE — AI AGENT TOOL DEFINITIONS
// Declarative definitions for all Julie tools, permission tiers, and schemas
// =============================================================================

import type { ToolDefinition } from '@/core/types';

export const JULIE_TOOLS: ToolDefinition[] = [
  {
    name: 'get_schedule',
    description: 'Retrieves the complete daily schedule including college classes, calendar events, and free blocks.',
    permissionTier: 'read',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'ISO date string or YYYY-MM-DD. Defaults to today.' },
      },
    },
  },
  {
    name: 'get_tasks',
    description: 'Retrieves active, pending, or categorized tasks and assignments.',
    permissionTier: 'read',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status (Inbox, Planned, In Progress, Completed)' },
        category: { type: 'string', description: 'Filter by category (College, Study, Creative, Personal)' },
        priority: { type: 'string', description: 'Filter by priority (Urgent, High, Medium, Low)' },
      },
    },
  },
  {
    name: 'create_task',
    description: 'Creates a new actionable task with priority, due date, duration, and optional subtasks.',
    permissionTier: 'write',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the task' },
        description: { type: 'string', description: 'Detailed instructions or notes' },
        priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Urgent'] },
        category: { type: 'string', enum: ['College', 'Study', 'Personal', 'Project', 'Creative'] },
        due_date: { type: 'string', description: 'Due date in ISO format or relative description' },
        estimated_duration_minutes: { type: 'number', description: 'Estimated minutes to complete' },
        subtasks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional list of initial subtask breakdown items',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'ai_task_breakdown',
    description: 'Deconstructs a complex task into an ordered set of manageable subtasks (e.g. Presentation -> Research, Outline, Slides, Review).',
    permissionTier: 'suggest',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'Target task ID to break down' },
        topic: { type: 'string', description: 'Task title or topic to deconstruct' },
      },
      required: ['topic'],
    },
  },
  {
    name: 'complete_task',
    description: 'Marks a task as completed.',
    permissionTier: 'write',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: 'ID of the task to complete' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'create_event',
    description: 'Creates a new calendar event or study session block.',
    permissionTier: 'suggest',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the event' },
        start_time: { type: 'string', description: 'Start ISO timestamp or HH:mm' },
        end_time: { type: 'string', description: 'End ISO timestamp or HH:mm' },
        category: { type: 'string', enum: ['College', 'Study', 'Personal', 'Project', 'Creative'] },
      },
      required: ['title', 'start_time', 'end_time'],
    },
  },
  {
    name: 'get_attendance',
    description: 'Retrieves exact deterministic attendance statistics, subject-wise percentages, and safe misses.',
    permissionTier: 'read',
    parameters: {
      type: 'object',
      properties: {
        subjectCode: { type: 'string', description: 'Optional subject code filter (e.g. MKT301)' },
      },
    },
  },
  {
    name: 'capture_intention',
    description: 'Captures a fluid user intention (e.g. "I want to work on my film tonight") and allocates suggested free time.',
    permissionTier: 'write',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The intention stated by the user' },
        category: { type: 'string', enum: ['Creative', 'Study', 'Wellness', 'Project', 'Personal'] },
        time_window: { type: 'string', enum: ['Morning', 'Afternoon', 'Evening', 'Tonight', 'This Weekend'] },
        priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
      },
      required: ['content'],
    },
  },
  {
    name: 'save_memory',
    description: 'Stores an explicit fact, preference, goal, or piece of knowledge in Julie memory.',
    permissionTier: 'write',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The fact or memory content to remember' },
        memory_type: { type: 'string', enum: ['explicit', 'preference', 'project', 'conversational', 'semantic'] },
        category: { type: 'string', enum: ['Personal', 'Preferences', 'Goals', 'Projects', 'Academic'] },
        topic_tag: { type: 'string', description: 'Topic tag for organized recall' },
      },
      required: ['content'],
    },
  },
  {
    name: 'forget_memory',
    description: 'Purges all memories relating to a specified topic or keyword upon user command.',
    permissionTier: 'sensitive',
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic or keyword to forget completely' },
      },
      required: ['topic'],
    },
  },
];
