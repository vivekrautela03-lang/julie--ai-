import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { db } from '@/core/storage/db';

interface AIActionsLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIActionsLogModal: React.FC<AIActionsLogModalProps> = ({ isOpen, onClose }) => {
  const logs = useLiveQuery(() => db.actionLogs.orderBy('created_at').reverse().toArray());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-background-elevated border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-glass overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-surface-900/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-400" />
            <div>
              <h2 className="text-sm font-bold text-white">AI Transparency & Action Log</h2>
              <p className="text-[11px] text-surface-400">Verifiable record of proactive decisions and tool executions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface-800 text-surface-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Logs Stream */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {!logs || logs.length === 0 ? (
            <p className="text-xs text-surface-400 text-center py-6">No action logs recorded yet.</p>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className="bg-background-card/80 border border-white/5 rounded-xl p-3 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                    {log.action_type}
                  </span>
                  <span className="text-[10px] text-surface-500">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-surface-100 font-medium">{log.description}</p>
                <div className="flex items-center justify-between text-[11px] text-surface-400 pt-1 border-t border-white/5">
                  <span>Reason: <span className="text-surface-300">{log.reason}</span></span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> {log.source}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
