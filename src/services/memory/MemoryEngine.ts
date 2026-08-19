// =============================================================================
// PROJECT JULIE — MEMORY ENGINE & GOVERNANCE
// Handles 5 memory tiers, semantic retrieval, and user forgetfulness controls
// =============================================================================

import { db, CURRENT_USER_ID } from '@/core/storage/db';
import type { Memory, MemoryType } from '@/core/types';

export class MemoryEngine {
  /**
   * Stores a new memory into the database.
   */
  static async saveMemory(params: {
    content: string;
    memory_type: MemoryType;
    category?: 'Personal' | 'Preferences' | 'Goals' | 'Projects' | 'Academic';
    topic_tag?: string;
    importance?: number;
    userId?: string;
  }): Promise<Memory> {
    const userId = params.userId || CURRENT_USER_ID;
    const memory: Memory = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      content: params.content,
      memory_type: params.memory_type,
      category: params.category || 'Personal',
      topic_tag: params.topic_tag || this.extractTopicTag(params.content),
      importance: params.importance || 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.memories.add(memory);

    // Audit log entry
    await db.actionLogs.add({
      id: `log-${Date.now()}`,
      user_id: userId,
      action_type: 'MEMORY_STORED',
      description: `Saved ${params.memory_type} memory: "${params.content.substring(0, 60)}..."`,
      reason: 'AI executive memory retention',
      source: 'Julie AI',
      user_confirmed: true,
      created_at: new Date().toISOString(),
    });

    return memory;
  }

  /**
   * Retrieves all memories matching an optional filter.
   */
  static async getMemories(filter?: {
    memory_type?: MemoryType;
    category?: string;
    searchQuery?: string;
    userId?: string;
  }): Promise<Memory[]> {
    const userId = filter?.userId || CURRENT_USER_ID;
    let list = await db.memories.where('user_id').equals(userId).toArray();

    if (filter?.memory_type) {
      list = list.filter(m => m.memory_type === filter.memory_type);
    }
    if (filter?.category) {
      list = list.filter(m => m.category === filter.category);
    }
    if (filter?.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.toLowerCase();
      list = list.filter(m =>
        m.content.toLowerCase().includes(q) ||
        (m.topic_tag && m.topic_tag.toLowerCase().includes(q)) ||
        m.category.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => b.importance - a.importance);
  }

  /**
   * Performs semantic relevance scoring against stored memories for context building.
   */
  static async searchRelevantMemories(query: string, limit: number = 4): Promise<Memory[]> {
    const all = await db.memories.where('user_id').equals(CURRENT_USER_ID).toArray();
    const qWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    const scored = all.map(mem => {
      let score = mem.importance * 0.2;
      const contentLower = mem.content.toLowerCase();
      const tagLower = (mem.topic_tag || '').toLowerCase();

      for (const word of qWords) {
        if (contentLower.includes(word)) score += 1.5;
        if (tagLower.includes(word)) score += 2.0;
      }

      return { mem, score };
    });

    return scored
      .filter(s => s.score > 0.8)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.mem);
  }

  /**
   * "Forget everything about this topic"
   * Purges all memories containing or tagged with the specified topic.
   */
  static async forgetTopic(topic: string, userId: string = CURRENT_USER_ID): Promise<number> {
    const all = await db.memories.where('user_id').equals(userId).toArray();
    const cleanTopic = topic.toLowerCase().trim();

    const toDelete = all.filter(m =>
      (m.topic_tag && m.topic_tag.toLowerCase().includes(cleanTopic)) ||
      m.content.toLowerCase().includes(cleanTopic)
    );

    const deleteIds = toDelete.map(m => m.id);
    await db.memories.bulkDelete(deleteIds);

    // Audit log entry
    await db.actionLogs.add({
      id: `log-${Date.now()}`,
      user_id: userId,
      action_type: 'MEMORY_PURGED',
      description: `Purged ${deleteIds.length} memories regarding topic: "${topic}"`,
      reason: 'User command: Forget topic',
      source: 'Julie AI',
      user_confirmed: true,
      created_at: new Date().toISOString(),
    });

    return deleteIds.length;
  }

  /**
   * Delete a single memory by ID.
   */
  static async deleteMemory(id: string): Promise<void> {
    await db.memories.delete(id);
  }

  /**
   * Update memory content or category.
   */
  static async updateMemory(id: string, updates: Partial<Memory>): Promise<void> {
    await db.memories.update(id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  }

  private static extractTopicTag(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('film') || lower.includes('movie') || lower.includes('cinema')) return 'film_project';
    if (lower.includes('study') || lower.includes('revision') || lower.includes('exam')) return 'study_routine';
    if (lower.includes('attendance') || lower.includes('class') || lower.includes('lecture')) return 'academic';
    if (lower.includes('gym') || lower.includes('workout') || lower.includes('health')) return 'wellness';
    return 'general';
  }
}
