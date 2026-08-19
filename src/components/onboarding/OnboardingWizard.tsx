import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, ShieldCheck, Clock, User, Bell } from 'lucide-react';
import { GlassCard } from '@/components/common/GlassCard';
import { db, CURRENT_USER_ID } from '@/core/storage/db';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('Shaurya Vardhan');
  const [callBoss, setCallBoss] = useState(true);
  const [tone, setTone] = useState<'Confident & Proactive' | 'Concise & Direct' | 'Academic & Calm' | 'Warm & Encouraging'>('Confident & Proactive');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:30');

  const handleFinish = async () => {
    await db.preferences.where('user_id').equals(CURRENT_USER_ID).modify({
      call_user_boss: callBoss,
      assistant_tone: tone,
    });
    localStorage.setItem('julie_onboarding_completed', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col justify-between p-6 max-w-md mx-auto">
      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2 pt-4">
        {[1, 2, 3, 4].map(s => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === s ? 'w-8 bg-brand-400' : step > s ? 'w-2 bg-brand-600' : 'w-2 bg-surface-800'
            }`}
          />
        ))}
      </div>

      {/* Wizard Steps */}
      <div className="my-auto space-y-6">
        {step === 1 && (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 via-brand-400 to-cyan-200 mx-auto flex items-center justify-center shadow-brand-subtle">
              <Sparkles className="w-8 h-8 text-slate-950 fill-current" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome to Julie</h1>
              <p className="text-sm text-surface-300 leading-relaxed max-w-xs mx-auto">
                Your proactive AI executive assistant for college, attendance, deadlines, creative projects, and daily life.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-white">How should I address you?</h2>
              <p className="text-xs text-surface-400 mt-1">Personalize your relationship with Julie.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-surface-300 block mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-surface-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-400"
                />
              </div>

              <GlassCard className="p-3 bg-surface-900/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Call me "Boss"</span>
                  <span className="text-[11px] text-surface-400">Default executive tone</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCallBoss(!callBoss)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    callBoss ? 'bg-brand-500' : 'bg-surface-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      callBoss ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </GlassCard>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-white">Assistant Persona</h2>
              <p className="text-xs text-surface-400 mt-1">Choose how Julie communicates recommendations.</p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {[
                { title: 'Confident & Proactive', desc: 'Direct, focused, initiates suggestions proactively.' },
                { title: 'Concise & Direct', desc: 'Brief bullet points with zero fluff.' },
                { title: 'Academic & Calm', desc: 'Emphasis on study planning and steady pacing.' },
                { title: 'Warm & Encouraging', desc: 'Positive affirmations with structured guidance.' },
              ].map(t => (
                <GlassCard
                  key={t.title}
                  variant={tone === t.title ? 'julie' : 'interactive'}
                  onClick={() => setTone(t.title as any)}
                  className="p-3.5 flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <h3 className="text-xs font-bold text-white">{t.title}</h3>
                    <p className="text-[11px] text-surface-400 mt-0.5">{t.desc}</p>
                  </div>
                  {tone === t.title && <Check className="w-4 h-4 text-brand-400 shrink-0" />}
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-fade-in text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">All Systems Ready</h2>
              <p className="text-xs text-surface-300 mt-1 max-w-xs mx-auto">
                Julie has initialized your timetable, task boards, and long-term memory.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="pt-4 flex items-center justify-between gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-4 py-3 text-xs font-semibold text-surface-400 hover:text-white"
          >
            Back
          </button>
        )}
        <button
          onClick={() => {
            if (step < 4) setStep(step + 1);
            else handleFinish();
          }}
          className="flex-1 bg-gradient-to-r from-brand-500 to-cyan-400 text-slate-950 font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 hover:shadow-brand-subtle transition-all active:scale-98 ml-auto"
        >
          <span>{step === 4 ? 'Enter Command Center' : 'Continue'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
