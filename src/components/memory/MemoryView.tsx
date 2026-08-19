// =============================================================================
// PROJECT JULIE — MEMORY & CONVERSATION ARCHIVE (LIQUID GLASS THEME)
// Long-term personal memories + Project-categorized chat archives + Supabase backup.
// =============================================================================

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Plus,
  Calendar,
  Palette,
  FileText,
  Music,
  BookOpen,
  Trash2,
  Edit2,
  X,
  MessageSquare,
  Sparkles,
  FolderKanban,
  ExternalLink,
  Brain,
  GraduationCap,
  Clapperboard,
  Scale,
} from 'lucide-react';
import { db, CURRENT_USER_ID } from '@/core/storage/db';
import type { ChatSession, Memory } from '@/core/types';

interface MemoryViewProps {
  onBack?: () => void;
  onSelectChat?: (conversationId: string) => void;
}

export const MemoryView: React.FC<MemoryViewProps> = ({ onBack, onSelectChat }) => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Chats' | 'Memories' | 'Files'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newCategory, setNewCategory] = useState<'Goals' | 'Preferences' | 'Personal' | 'Academic'>('Goals');
  const [selectedChatTranscript, setSelectedChatTranscript] = useState<ChatSession | null>(null);

  const filterTabs: Array<'All' | 'Chats' | 'Memories' | 'Files'> = ['All', 'Chats', 'Memories', 'Files'];

  // Live Query Archived Chats from Dexie Database
  const conversations = useLiveQuery<ChatSession[]>(
    () => db.conversations.where('user_id').equals(CURRENT_USER_ID).reverse().sortBy('updated_at') as any,
    []
  );

  // Live Query Messages for the selected chat transcript modal
  const transcriptMessages = useLiveQuery(
    () =>
      selectedChatTranscript
        ? db.messages.where('conversation_id').equals(selectedChatTranscript.id).sortBy('created_at')
        : [],
    [selectedChatTranscript]
  );

  const [localMemories, setLocalMemories] = useState([
    {
      id: 'm-1',
      icon: Calendar,
      content: 'Wants to finish the short film "Echoes of Silence" before the festival submission this month.',
      badge: 'Goal',
      project_tag: 'Film Project',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      time: 'Today, 9:30 AM',
    },
    {
      id: 'm-2',
      icon: Palette,
      content: 'Prefers scheduling creative editing blocks in the evening (7:30 PM to 9:30 PM).',
      badge: 'Preference',
      project_tag: 'Film Project',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      time: 'Today, 9:15 AM',
    },
    {
      id: 'm-3',
      icon: GraduationCap,
      content: 'Must maintain 75%+ attendance in BBA-203 Digital Marketing & MS-Excel.',
      badge: 'Academic',
      project_tag: 'Attendance',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      time: 'Yesterday, 8:45 AM',
    },
    {
      id: 'm-4',
      icon: Music,
      content: 'Prefers studying with ambient lo-fi music in 60-minute focused sprints.',
      badge: 'Preference',
      project_tag: 'General',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      time: 'Yesterday, 6:30 PM',
    },
  ]);

  const handleForgetMemory = (id: string) => {
    setLocalMemories(prev => prev.filter(m => m.id !== id));
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this archived conversation session?')) {
      await db.conversations.delete(id);
      await db.messages.where('conversation_id').equals(id).delete();
    }
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;

    const newMem = {
      id: `m-${Date.now()}`,
      icon: FileText,
      content: newMemoryText.trim(),
      badge: newCategory,
      project_tag: 'Personal',
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      time: 'Just now',
    };

    setLocalMemories([newMem, ...localMemories]);
    setNewMemoryText('');
    setIsAddModalOpen(false);
  };

  const getProjectTagBadge = (tag: string) => {
    switch (tag) {
      case 'Digital Marketing':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'Film Project':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Attendance':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Business Law':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const filteredConversations = (conversations || []).filter(c =>
    searchQuery
      ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.project_tag.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const filteredMemories = localMemories.filter(m =>
    searchQuery
      ? m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.project_tag.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="space-y-4 pb-28 px-3.5 pt-2 text-white relative min-h-[calc(100vh-80px)] select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-2xl liquid-pill text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Memory</h1>
            <p className="text-[11px] text-slate-400">Archived project chats & long-term memory</p>
          </div>
        </div>

        <div className="w-8 h-8 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
          <Brain className="w-4 h-4" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filterTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === tab
                ? 'liquid-pill-active text-white font-bold'
                : 'liquid-pill text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search memories, projects, or past chats..."
          className="w-full liquid-glass rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50"
        />
      </div>

      {/* SECTION 1: ARCHIVED PROJECT CHATS */}
      {(activeFilter === 'All' || activeFilter === 'Chats') && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-sky-400" />
              <span>Project Chat Archives ({filteredConversations.length})</span>
            </h2>
            <span className="text-[10px] text-emerald-400 font-mono">Cloud Synced (Supabase)</span>
          </div>

          <div className="space-y-2.5">
            {filteredConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelectedChatTranscript(conv)}
                className="liquid-glass rounded-3xl p-4 space-y-2 cursor-pointer hover:border-sky-400/30 transition-all shadow-md group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getProjectTagBadge(
                          conv.project_tag
                        )}`}
                      >
                        {conv.project_tag}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {conv.message_count} messages
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors pt-0.5">
                      {conv.title}
                    </h3>
                  </div>

                  <button
                    onClick={e => handleDeleteConversation(conv.id, e)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                  {conv.summary}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-slate-400">
                  <span>Saved: {new Date(conv.updated_at).toLocaleDateString()}</span>
                  <span className="text-sky-400 font-semibold flex items-center gap-1 group-hover:underline">
                    <span>View Transcript</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: LONG-TERM PERSONAL MEMORIES */}
      {(activeFilter === 'All' || activeFilter === 'Memories') && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>Learned Facts & Preferences ({filteredMemories.length})</span>
            </h2>
          </div>

          <div className="space-y-2.5">
            {filteredMemories.map(item => {
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  className="liquid-glass rounded-3xl p-4 space-y-2 hover:border-purple-400/30 transition-all shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-slate-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${item.badgeClass}`}
                          >
                            {item.badge}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {item.project_tag}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-white leading-relaxed">
                          {item.content}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleForgetMemory(item.id)}
                      className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                      title="Forget this memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-slate-500">
                    <span>{item.time}</span>
                    <span className="text-purple-400 font-medium">Active in AI Prompt</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Action Button to Add New Memory */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full liquid-glass-button text-white flex items-center justify-center shadow-glass-button hover:scale-105 active:scale-95 transition-all z-30"
        title="Add new memory fact"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Memory Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-fade-in">
          <div className="bg-[#0A0B14] rounded-3xl w-full max-w-sm p-5 space-y-4 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-sm font-bold text-white">Add Learned Fact / Memory</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl liquid-pill text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  What should Julie remember?
                </label>
                <textarea
                  required
                  rows={3}
                  value={newMemoryText}
                  onChange={e => setNewMemoryText(e.target.value)}
                  placeholder="e.g. I prefer writing case studies during morning hours."
                  className="w-full liquid-glass rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full liquid-glass rounded-2xl px-3.5 py-2.5 text-xs text-white bg-[#0A0B14] focus:outline-none"
                >
                  <option value="Goals">Goals</option>
                  <option value="Preferences">Preferences</option>
                  <option value="Personal">Personal</option>
                  <option value="Academic">Academic</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full liquid-glass-button text-white font-semibold text-xs py-3 rounded-full shadow-glass-button transition-all"
              >
                Save Memory
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Selected Chat Transcript Modal */}
      {selectedChatTranscript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-fade-in">
          <div className="bg-[#0A0B14] rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col p-5 space-y-3 border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between border-b border-white/10 pb-2.5">
              <div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getProjectTagBadge(
                    selectedChatTranscript.project_tag
                  )}`}
                >
                  {selectedChatTranscript.project_tag}
                </span>
                <h2 className="text-sm font-bold text-white mt-1">
                  {selectedChatTranscript.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedChatTranscript(null)}
                className="p-1 rounded-xl liquid-pill text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Transcript Messages List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
              {(!transcriptMessages || transcriptMessages.length === 0) ? (
                <div className="liquid-glass rounded-2xl p-4 text-xs text-slate-300 space-y-1.5">
                  <p className="font-bold text-white">Archived Summary:</p>
                  <p>{selectedChatTranscript.summary}</p>
                </div>
              ) : (
                transcriptMessages.map(m => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'liquid-glass-button text-white ml-auto max-w-[85%] rounded-tr-none'
                        : 'liquid-glass text-slate-200 mr-auto max-w-[90%] rounded-tl-none border border-white/10'
                    }`}
                  >
                    <div className="text-[9px] opacity-70 mb-1 font-bold">
                      {m.sender === 'user' ? 'You' : 'Julie'}
                    </div>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                if (onSelectChat) {
                  onSelectChat(selectedChatTranscript.id);
                }
                setSelectedChatTranscript(null);
              }}
              className="w-full liquid-glass-button py-2.5 rounded-full text-xs font-semibold text-white shadow-glass-button transition-all shrink-0"
            >
              Resume / Continue Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
