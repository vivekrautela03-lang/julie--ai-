import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { FolderKanban, Plus, CheckCircle2, Clock, Sparkles, ChevronRight, X } from 'lucide-react';
import { db, CURRENT_USER_ID } from '@/core/storage/db';
import { GlassCard } from '@/components/common/GlassCard';
import type { Project } from '@/core/types';

export const ProjectsView: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<'Film' | 'Creative' | 'Academic' | 'Startup' | 'Personal'>('Film');

  const projects = useLiveQuery(() => db.projects.where('user_id').equals(CURRENT_USER_ID).toArray(), []);
  const tasks = useLiveQuery(() => db.tasks.where('user_id').equals(CURRENT_USER_ID).toArray(), []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await db.projects.add({
      id: `proj-${Date.now()}`,
      user_id: CURRENT_USER_ID,
      title: newTitle.trim(),
      description: newDescription.trim(),
      category: newCategory,
      status: 'active',
      progress_percentage: 10,
      color_code: newCategory === 'Film' ? '#8B5CF6' : newCategory === 'Academic' ? '#38BDF8' : '#10B981',
      created_at: new Date().toISOString(),
    });

    setNewTitle('');
    setNewDescription('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-24 max-w-md mx-auto px-4 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Project Hubs</h1>
          <p className="text-xs text-surface-400">Creative & academic workspaces</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brand-500 hover:bg-brand-400 text-slate-950 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-brand-subtle transition-all"
        >
          <Plus className="w-4 h-4" /> New Hub
        </button>
      </div>

      {/* Projects List */}
      <div className="space-y-3">
        {(!projects || projects.length === 0) ? (
          <GlassCard className="p-8 text-center text-xs text-surface-400">
            No active project workspaces. Create one to organize creative or academic initiatives.
          </GlassCard>
        ) : (
          projects.map(proj => {
            const projectTasks = (tasks || []).filter(t => t.project_id === proj.id);
            const completedTasks = projectTasks.filter(t => t.status === 'Completed');

            return (
              <GlassCard
                key={proj.id}
                variant="interactive"
                onClick={() => setSelectedProject(proj)}
                className="p-4 space-y-3 border-l-4"
                style={{ borderLeftColor: proj.color_code }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-surface-400">
                      {proj.category}
                    </span>
                    <h2 className="text-sm font-bold text-white leading-tight mt-0.5">{proj.title}</h2>
                    {proj.description && (
                      <p className="text-xs text-surface-400 mt-1 line-clamp-2">{proj.description}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-surface-500 shrink-0" />
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-surface-400">Progress</span>
                    <span className="text-white font-bold">{proj.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-surface-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${proj.progress_percentage}%`, backgroundColor: proj.color_code }}
                    />
                  </div>
                </div>

                {/* AI Context Preview */}
                {proj.ai_context_notes && (
                  <div className="bg-surface-950/60 p-2 rounded-xl border border-white/5 text-[11px] text-surface-300 flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{proj.ai_context_notes}</span>
                  </div>
                )}
              </GlassCard>
            );
          })
        )}
      </div>

      {/* Add Project Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-background-elevated border border-white/10 rounded-2xl w-full max-w-sm p-4 space-y-3 shadow-glass">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="text-sm font-bold text-white">Create Project Hub</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-surface-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-surface-300 block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Short Film: Echoes of Silence"
                  className="w-full bg-surface-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-brand-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-surface-300 block mb-1">Overview</label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Goals, creative vision, or milestones..."
                  rows={2}
                  className="w-full bg-surface-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-brand-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-surface-300 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full bg-surface-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Film">Film / Cinema</option>
                  <option value="Creative">Creative Arts</option>
                  <option value="Academic">Academic Research</option>
                  <option value="Startup">Startup / Venture</option>
                  <option value="Personal">Personal Project</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                Create Hub
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
