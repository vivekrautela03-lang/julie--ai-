import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, X, CheckSquare, FolderKanban, Brain, ArrowRight } from 'lucide-react';
import { db } from '@/core/storage/db';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const [query, setQuery] = useState('');

  const tasks = useLiveQuery(() => db.tasks.toArray(), []);
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const memories = useLiveQuery(() => db.memories.toArray(), []);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredTasks = q ? (tasks || []).filter(t => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)) : [];
  const filteredProjects = q ? (projects || []).filter(p => p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)) : [];
  const filteredMemories = q ? (memories || []).filter(m => m.content.toLowerCase().includes(q) || (m.topic_tag || '').toLowerCase().includes(q)) : [];

  const totalResults = filteredTasks.length + filteredProjects.length + filteredMemories.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/80 backdrop-blur-md">
      <div className="bg-background-elevated border border-white/10 rounded-2xl w-full max-w-lg shadow-glass overflow-hidden">
        {/* Search input bar */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-brand-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks, projects, memories, classes..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-white placeholder-surface-500 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-surface-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
          {!q ? (
            <p className="text-xs text-surface-400 text-center py-6">
              Type keywords like "marketing", "film", or "attendance"...
            </p>
          ) : totalResults === 0 ? (
            <p className="text-xs text-surface-400 text-center py-6">No matching records found.</p>
          ) : (
            <>
              {filteredTasks.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-brand-400 mb-2 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" /> Tasks ({filteredTasks.length})
                  </h3>
                  <div className="space-y-1.5">
                    {filteredTasks.map(t => (
                      <div
                        key={t.id}
                        onClick={() => { onNavigateToTab('tasks'); onClose(); }}
                        className="p-2.5 rounded-xl bg-surface-900/60 hover:bg-surface-800/80 border border-white/5 cursor-pointer flex items-center justify-between transition-all"
                      >
                        <span className="text-xs text-white font-medium">{t.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-surface-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredProjects.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-purple-400 mb-2 flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5" /> Projects ({filteredProjects.length})
                  </h3>
                  <div className="space-y-1.5">
                    {filteredProjects.map(p => (
                      <div
                        key={p.id}
                        onClick={() => { onNavigateToTab('projects'); onClose(); }}
                        className="p-2.5 rounded-xl bg-surface-900/60 hover:bg-surface-800/80 border border-white/5 cursor-pointer flex items-center justify-between transition-all"
                      >
                        <span className="text-xs text-white font-medium">{p.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-surface-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filteredMemories.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" /> Memories ({filteredMemories.length})
                  </h3>
                  <div className="space-y-1.5">
                    {filteredMemories.map(m => (
                      <div
                        key={m.id}
                        onClick={() => { onNavigateToTab('memory'); onClose(); }}
                        className="p-2.5 rounded-xl bg-surface-900/60 hover:bg-surface-800/80 border border-white/5 cursor-pointer flex items-center justify-between transition-all"
                      >
                        <span className="text-xs text-surface-200 line-clamp-1">{m.content}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-surface-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
