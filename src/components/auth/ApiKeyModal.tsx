// =============================================================================
// PROJECT JULIE — GEMINI API KEY SETUP & VALIDATION MODAL
// Allows direct configuration, testing, and activation of the Gemini API Key
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  Key,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
  Zap,
  X,
  RefreshCw,
} from 'lucide-react';
import { GeminiClient } from '@/services/ai/GeminiClient';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [apiKey, setApiKey] = useState(() => GeminiClient.getApiKey());
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  useEffect(() => {
    if (isOpen) {
      setApiKey(GeminiClient.getApiKey());
      setValidationResult({ status: 'idle', message: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = apiKey.trim();

    if (!cleanKey) {
      setValidationResult({
        status: 'error',
        message: 'Please enter or paste your Gemini API Key.',
      });
      return;
    }

    setIsValidating(true);
    setValidationResult({
      status: 'idle',
      message: 'Connecting to Gemini 2.5 Flash Neural Core...',
    });

    try {
      // Temporarily store to test
      GeminiClient.setApiKey(cleanKey);
      const res = await GeminiClient.validateApiKey();

      if (res.success) {
        localStorage.setItem('julie_api_key_configured', 'true');
        setValidationResult({
          status: 'success',
          message: '✅ Connected to Google Gemini 2.5 Flash! Julie AI is primed and ready to respond.',
        });

        if (onSuccess) onSuccess();

        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setValidationResult({
          status: 'error',
          message: `API Key verification error: ${res.error || 'Invalid key'}`,
        });
      }
    } catch (err: any) {
      setValidationResult({
        status: 'error',
        message: `Connection failed: ${err.message}`,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleUseDefault = () => {
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || '';
    if (envKey) {
      setApiKey(envKey);
      GeminiClient.setApiKey(envKey);
      localStorage.setItem('julie_api_key_configured', 'true');
      setValidationResult({
        status: 'success',
        message: '✅ Active Gemini 2.5 Flash key loaded.',
      });
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setValidationResult({
        status: 'error',
        message: 'No pre-set environment key found. Please paste your Gemini API Key.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in text-white select-none">
      <div className="bg-[#080914] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-sky-500/30 max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-purple-600 p-0.5 shadow-md flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black text-white leading-tight">
                  Gemini API Key Setup
                </h2>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Gemini 2.5
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Activate Julie's live neural reasoning and voice core
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-purple-950/30 to-slate-900/40 border border-sky-400/20 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>All-Domain Live Intelligence</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Enter your Google Gemini API Key below. Julie uses this key directly to answer all questions, run voice conversations, analyze attendance, and execute assistant tools.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleTestAndSave} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Google Gemini API Key
            </label>

            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Paste your Gemini API Key (e.g. AIzaSy...)"
                className="w-full bg-black/50 border border-white/15 focus:border-sky-400 rounded-2xl py-3 pl-3.5 pr-11 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors font-mono"
              />

              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 text-slate-400 hover:text-white transition-colors"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Validation Status Notification */}
          {validationResult.message && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-fade-in border ${
                validationResult.status === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : validationResult.status === 'error'
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                  : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
              }`}
            >
              {validationResult.status === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {validationResult.status === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              {validationResult.status === 'idle' && (
                <RefreshCw className="w-4 h-4 text-sky-400 shrink-0 animate-spin" />
              )}
              <span className="leading-snug">{validationResult.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={isValidating}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg shadow-sky-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying API Key...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Save & Connect API Key</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleUseDefault}
              className="w-full py-2.5 rounded-2xl liquid-glass text-slate-300 hover:text-white font-semibold text-xs transition-colors border border-white/10"
            >
              Load from Environment (.env)
            </button>
          </div>
        </form>

        {/* Free Key Instructions */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>Need a free Gemini key?</span>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Get from Google AI Studio</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
