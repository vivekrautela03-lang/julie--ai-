// =============================================================================
// PROJECT JULIE — TASKS VIEW (LIQUID GLASS THEME)
// Local task manager with filters, priority tags, and add/complete workflows.
// =============================================================================

import React, { useState } from 'react';
import { ArrowLeft, Search, Plus, Circle, CheckCircle2, X, Sparkles, CheckSquare } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TasksViewProps {
  onBack?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onBack }) => {
  const [activeFilter, setActiveFilter] = useState<'Today' | 'Upcoming' | 'Overdue' | 'Done'>('Today');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('High');

  const filterTabs: Array<'Today' | 'Upcoming' | 'Overdue' | 'Done'> = ['Today', 'Upcoming', 'Overdue', 'Done'];

  const [todayTasks, setTodayTasks] = useState([
    { id: 't-1', title: 'Digital Marketing Campaign Strategy', sub: 'Due tomorrow, 11:59 PM (UU-ERP)', priority: 'High', completed: false },
    { id: 't-2', title: 'Business Law Compliance Report', sub: 'Today, 8:00 PM', priority: 'High', completed: false },
    { id: 't-3', title: 'Review Advanced MS-Excel Formulas', sub: 'Today, 6:00 PM', priority: 'Medium', completed: false },
    { id: 't-4', title: 'Workout & stretching', sub: 'Today, 5:00 PM', priority: 'Low', completed: false },
  ]);

  const [upcomingTasks, setUpcomingTasks] = useState([
    { id: 't-5', title: 'Tour Package Management Case Study', sub: '22 August, 10:00 AM', priority: 'High', completed: false },
    { id: 't-6', title: 'Read 30 pages of Corporate Law', sub: '22 August, 4:00 PM', priority: 'Medium', completed: false },
  ]);

  const handleToggleTask = (id: string, isUpcoming = false) => {
    confetti({ particleCount: 35, spread: 45, origin: { y: 0.8 } });
    if (isUpcoming) {
      setUpcomingTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
    } else {
      setTodayTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setTodayTasks([
      { id: `t-${Date.now()}`, title: newTitle.trim(), sub: 'Today, 9:00 PM', priority: newPriority, completed: false },
      ...todayTasks,
    ]);
    setNewTitle('');
    setIsAddModalOpen(false);
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'High':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="space-y-4 pb-28 px-3.5 pt-2 text-white relative min-h-[calc(100vh-80px)] select-none">
      {/* Header */}
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
            <h1 className="text-xl font-bold text-white tracking-tight">Tasks</h1>
            <p className="text-[11px] text-slate-400">Autonomous task management</p>
          </div>
        </div>

        <div className="w-8 h-8 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
          <CheckSquare className="w-4 h-4" />
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

      {/* Today Section */}
      <div className="space-y-2.5 pt-1">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">Today</h2>

        <div className="space-y-2">
          {todayTasks.map(task => (
            <div
              key={task.id}
              onClick={() => handleToggleTask(task.id, false)}
              className="liquid-glass rounded-3xl p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-sky-400/30 transition-all shadow-md"
            >
              <div className="flex items-center gap-3">
                <button className="text-slate-400 hover:text-sky-400 transition-colors">
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 stroke-[1.5]" />
                  )}
                </button>
                <div>
                  <h3
                    className={`text-xs font-semibold ${
                      task.completed ? 'line-through text-slate-500' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{task.sub}</p>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Section */}
      <div className="space-y-2.5 pt-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">Upcoming</h2>

        <div className="space-y-2">
          {upcomingTasks.map(task => (
            <div
              key={task.id}
              onClick={() => handleToggleTask(task.id, true)}
              className="liquid-glass rounded-3xl p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-sky-400/30 transition-all shadow-md"
            >
              <div className="flex items-center gap-3">
                <button className="text-slate-400 hover:text-sky-400 transition-colors">
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 stroke-[1.5]" />
                  )}
                </button>
                <div>
                  <h3
                    className={`text-xs font-semibold ${
                      task.completed ? 'line-through text-slate-500' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">{task.sub}</p>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full liquid-glass-button text-white flex items-center justify-center shadow-glass-button hover:scale-105 active:scale-95 transition-all z-30"
        title="Add task"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-fade-in">
          <div className="bg-[#0A0B14] rounded-3xl w-full max-w-sm p-5 space-y-4 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-sm font-bold text-white">Create Task</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl liquid-pill text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Digital Marketing Revision"
                  className="w-full liquid-glass rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value as any)}
                  className="w-full liquid-glass rounded-2xl px-3.5 py-2.5 text-xs text-white bg-[#0A0B14] focus:outline-none"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full liquid-glass-button text-white font-semibold text-xs py-3 rounded-full shadow-glass-button transition-all"
              >
                Add Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
