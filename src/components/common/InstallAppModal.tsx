// =============================================================================
// PROJECT JULIE — DOWNLOAD & INSTALL APP MODAL (DESKTOP & MOBILE)
// PWA installation helper with 1-click native install + iOS/Android/PC steps
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor, Apple, CheckCircle2, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      alert("To install Julie on your device:\n\n• On Chrome/Edge (Desktop): Click the install icon (⊕ or 💻) in the top URL bar.\n• On iPhone (Safari): Tap the Share button (⬆) and select 'Add to Home Screen'.\n• On Android (Chrome): Tap the three dots (⋮) and select 'Install app' or 'Add to Home Screen'.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="liquid-glass-elevated rounded-[36px] w-full max-w-[420px] p-5 space-y-4 border border-white/15 bg-[#080912]/95 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_35px_rgba(124,58,237,0.3)]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-julie-600 to-sky-400 p-0.5 shadow-sm overflow-hidden">
              <img
                src="/julie-icon.jpg"
                alt="Julie AI"
                className="w-full h-full rounded-[14px] object-cover"
              />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Install Julie App</h2>
              <p className="text-[10px] text-slate-400">Install on Desktop PC & Mobile Phone</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1-Click Native Install Button */}
        {deferredPrompt && !isInstalled && (
          <button
            onClick={handleInstallClick}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-julie-600 to-sky-500 hover:from-julie-500 hover:to-sky-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(124,58,237,0.6)] active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>1-Click Install App Now</span>
          </button>
        )}

        {isInstalled && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Julie is already installed in Standalone App Mode!</span>
          </div>
        )}

        {/* Step-by-Step Device Guides */}
        <div className="space-y-2.5 text-xs text-slate-300">
          
          {/* 1. Desktop (Windows / Mac PC) */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <Monitor className="w-4 h-4 text-sky-400" />
              <span>Desktop (Windows / Mac)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              In <strong>Chrome</strong> or <strong>Edge</strong>, click the <strong>Install icon (⊕ / 💻)</strong> in the top-right of the URL address bar &rarr; Click <strong>"Install"</strong> to add Julie to your taskbar/desktop!
            </p>
          </div>

          {/* 2. iPhone / iPad (iOS Safari) */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <Apple className="w-4 h-4 text-slate-200" />
              <span>iPhone & iPad (Safari)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tap the <strong>Share button (⬆)</strong> at the bottom of Safari &rarr; Scroll down and tap <strong>"Add to Home Screen"</strong> &rarr; Tap <strong>"Add"</strong>.
            </p>
          </div>

          {/* 3. Android Phones (Chrome) */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Android Phones (Chrome)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tap the <strong>three dots menu (⋮)</strong> in Chrome &rarr; Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-full liquid-glass-button text-white font-bold text-xs shadow-glass-button transition-all"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
