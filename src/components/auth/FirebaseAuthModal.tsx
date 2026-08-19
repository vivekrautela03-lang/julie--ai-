import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, UserCheck, LogOut, Flame, ShieldCheck } from 'lucide-react';
import { auth, loginWithEmail, registerWithEmail, logoutUser, subscribeToAuthChanges } from '@/core/storage/firebase';
import type { User } from 'firebase/auth';

interface FirebaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseAuthModal: React.FC<FirebaseAuthModalProps> = ({ isOpen, onClose }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAuthChanges(user => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        await registerWithEmail(email.trim(), password);
      } else {
        await loginWithEmail(email.trim(), password);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message?.replace('Firebase: ', '') || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl border border-slate-100 animate-fade-in">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Flame className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Firebase Account</h2>
              <p className="text-[10px] text-slate-400 font-mono">Project: julie-7a188</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        {currentUser ? (
          /* Logged In State */
          <div className="space-y-4 pt-1 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">{currentUser.email}</p>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center justify-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Authenticated & Synced
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-500 text-left space-y-1">
              <p>• <strong>Project:</strong> julie-7a188</p>
              <p>• <strong>Notifications & Wake Word:</strong> Connected</p>
              <p>• <strong>Android App:</strong> com.julie.ai registered</p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold text-xs py-2.5 rounded-full flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        ) : (
          /* Email / Password Form */
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="boss@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-julie-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-julie-500"
                  />
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-600 font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full julie-button-gradient text-white font-semibold text-xs py-2.5 rounded-full shadow-julie-button"
            >
              {isSubmitting
                ? 'Connecting...'
                : isRegistering
                ? 'Create Firebase Account'
                : 'Sign In with Email'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setErrorMsg(null);
                }}
                className="text-[11px] text-julie-600 hover:text-julie-800 font-semibold"
              >
                {isRegistering
                  ? 'Already have an account? Sign In'
                  : 'Need a new account? Register here'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
