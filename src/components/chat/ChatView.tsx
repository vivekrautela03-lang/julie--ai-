// =============================================================================
// PROJECT JULIE — CHAT & INTELLIGENT OPERATING CANVAS
// Real-time Voice-to-Text in Input Box + New Chat Session Archive + Supabase Cloud Backup.
// =============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Send,
  Plus,
  Mic,
  MicOff,
  Sparkles,
  Paperclip,
  CheckCircle2,
  Calendar,
  GraduationCap,
  FileText,
  Clock,
  MapPin,
  ChevronRight,
  File,
  Radio,
  PlusCircle,
  FolderKanban,
  Archive,
} from 'lucide-react';
import { db, CURRENT_USER_ID } from '@/core/storage/db';
import type { ConversationMessage } from '@/core/types';
import { AIService } from '@/services/ai/AIService';
import { FileUploadModal, type UploadedFileItem } from '@/components/files/FileUploadModal';
import type { DrawerTab } from '@/components/common/GlassDrawer';
import { voiceService } from '@/services/voice/VoiceService';
import { getTimeBasedGreeting } from '@/core/utils/greeting';

interface ChatViewProps {
  onOpenVoice: () => void;
  onNavigateToTab: (tab: DrawerTab) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ onOpenVoice, onNavigateToTab }) => {
  const [activeConversationId, setActiveConversationId] = useState<string>(() => `conv-${Date.now()}`);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; content?: string } | null>(null);
  const [isDictating, setIsDictating] = useState(false);
  const [archiveNotice, setArchiveNotice] = useState<string | null>(null);
  const [timeGreeting, setTimeGreeting] = useState(() => getTimeBasedGreeting('boss'));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dictationTextRef = useRef('');

  useEffect(() => {
    const update = () => setTimeGreeting(getTimeBasedGreeting('boss'));
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  // Live query messages from local Dexie database for current active conversation
  const messages = useLiveQuery<ConversationMessage[]>(
    () => db.messages.where('conversation_id').equals(activeConversationId).sortBy('created_at') as any,
    [activeConversationId]
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Voice-to-text dictation subscription: Writes to textbox & Auto-sends on pause
  useEffect(() => {
    if (!isDictating) return;

    dictationTextRef.current = '';
    voiceService.startListening();

    const unsub = voiceService.subscribe(state => {
      const liveWords = (state.interimTranscript || state.transcript || '').trim();
      
      if (liveWords) {
        dictationTextRef.current = liveWords;
        setInputText(liveWords);
      }

      if (
        state.transcript &&
        !state.isListening &&
        !state.isSpeaking &&
        dictationTextRef.current
      ) {
        const textToSend = dictationTextRef.current.trim();
        dictationTextRef.current = '';
        state.transcript = '';
        state.interimTranscript = '';
        setIsDictating(false);
        if (textToSend) {
          handleSendMessage(textToSend);
        }
      }
    });

    return () => {
      unsub();
      voiceService.stopListening();
    };
  }, [isDictating]);

  const toggleDictation = () => {
    if (isDictating) {
      setIsDictating(false);
      voiceService.stopListening();
    } else {
      setInputText('');
      dictationTextRef.current = '';
      setIsDictating(true);
    }
  };

  const handleStartNewChat = async () => {
    // 1. Archive previous chat session if messages exist
    if (messages && messages.length > 0) {
      const archived = await AIService.archiveConversationSession(activeConversationId);
      if (archived) {
        setArchiveNotice(`Saved "${archived.title}" to Memory (${archived.project_tag}) & Supabase`);
        setTimeout(() => setArchiveNotice(null), 4000);
      }
    }

    // 2. Generate new conversation ID
    setActiveConversationId(`conv-${Date.now()}`);
    setInputText('');
    setAttachedFile(null);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query && !attachedFile) return;

    const fullPrompt = attachedFile
      ? `[Attached File: ${attachedFile.name}]\n\n${query || 'Please analyze this document.'}`
      : query;

    setInputText('');
    dictationTextRef.current = '';
    setAttachedFile(null);
    setIsProcessing(true);

    try {
      await AIService.processMessage(fullPrompt, 'Chat', activeConversationId);
    } catch (err) {
      console.error('[Julie AI] Chat error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const quickPills = [
    "What's my schedule tomorrow?",
    "What's my attendance standing?",
    "Live weather in Dehradun",
    "Mark attendance for today's class",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-68px)] sm:h-[800px] px-3.5 pb-2 select-none">
      {/* Top Action Bar with "+ New Chat" Button */}
      <div className="flex items-center justify-between py-1 px-1 border-b border-white/5 mb-1 shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <FolderKanban className="w-3.5 h-3.5 text-sky-400" />
          <span>Active Session</span>
        </div>

        <button
          onClick={handleStartNewChat}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full liquid-pill text-xs font-semibold text-white hover:bg-white/10 active:scale-95 transition-all shadow-sm"
          title="End current chat & start new session"
        >
          <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>+ New Chat</span>
        </button>
      </div>

      {/* Archive Toast Notification */}
      {archiveNotice && (
        <div className="p-2.5 rounded-2xl liquid-glass border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs flex items-center justify-between animate-fade-in mb-1 shrink-0">
          <div className="flex items-center gap-2">
            <Archive className="w-3.5 h-3.5 text-emerald-400" />
            <span>{archiveNotice}</span>
          </div>
          <button
            onClick={() => onNavigateToTab('memory')}
            className="underline font-bold text-[11px] text-white hover:text-emerald-200"
          >
            View in Memory
          </button>
        </div>
      )}

      {/* Messages Stream Canvas */}
      <div className="flex-1 overflow-y-auto py-2 space-y-4 pr-1">
        {/* Intro Greeting Banner */}
        <div className="space-y-1 pt-1 px-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full liquid-glass text-[10px] font-bold text-sky-400 border border-sky-400/30 mb-1">
            <Sparkles className="w-3 h-3" /> Julie Intelligent Operating Layer
          </div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-1.5 leading-snug">
            {timeGreeting.greeting} <span className="text-lg">{timeGreeting.emoji}</span>
          </h2>
          <p className="text-xs text-slate-400">{timeGreeting.subtitle}</p>
        </div>

        {/* Demo Interactive Cards if active message stream is empty */}
        {(!messages || messages.length === 0) && (
          <div className="space-y-3.5 pt-1">
            {/* User prompt 1 */}
            <div className="flex justify-end">
              <div className="liquid-glass-button text-white text-xs font-medium px-4 py-2.5 rounded-2xl rounded-tr-none max-w-[82%] shadow-md">
                What's my schedule today?
              </div>
            </div>

            {/* Julie Timeline Card */}
            <div className="flex justify-start">
              <div className="liquid-glass rounded-3xl rounded-tl-none p-4 max-w-[94%] space-y-3">
                <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" /> Here's your schedule for today:
                </p>

                {/* Timeline rows */}
                <div className="space-y-2.5 pt-1 pl-1">
                  <div className="flex items-start gap-3 text-xs">
                    <span className="w-2 h-2 rounded-full bg-purple-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                    <span className="font-mono text-slate-400 font-medium text-[11px] w-16 shrink-0">09:30 AM</span>
                    <div>
                      <p className="font-semibold text-white">(P1) Business Law</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-slate-500" /> Room 304 • Namita
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <span className="font-mono text-slate-400 font-medium text-[11px] w-16 shrink-0">10:30 AM</span>
                    <div>
                      <p className="font-semibold text-white">(P2) Management Accounting</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-slate-500" /> Room 304 • Anupam Gupta
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToTab('schedule')}
                  className="w-full liquid-glass px-3.5 py-2 rounded-xl text-xs font-semibold text-white hover:bg-white/10 transition-all border border-white/10 flex items-center justify-between"
                >
                  <span>View Full Timetable</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* User prompt 2 */}
            <div className="flex justify-end">
              <div className="liquid-glass-button text-white text-xs font-medium px-4 py-2.5 rounded-2xl rounded-tr-none max-w-[82%] shadow-md">
                What's my attendance?
              </div>
            </div>

            {/* Julie Attendance Response */}
            <div className="flex justify-start">
              <div className="liquid-glass rounded-3xl rounded-tl-none p-4 max-w-[94%] space-y-3 border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-300">
                    Overall attendance is <span className="text-amber-400 font-extrabold text-sm">60.34%</span> (35/58 lectures).
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ● Shortage Alert
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  You need consecutive attendance in Digital Marketing (30.77%), MS-Excel (55.56%), and Language (50%) to reach 75%.
                </p>
                <button
                  onClick={() => onNavigateToTab('attendance')}
                  className="w-full liquid-glass px-3.5 py-2 rounded-xl text-xs font-semibold text-white hover:bg-white/10 transition-all border border-white/10 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-sky-400" /> View Recovery Calculator</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Conversation Stream */}
        {messages?.map(msg => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-3xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'liquid-glass-button text-white rounded-tr-none font-medium shadow-md'
                    : 'liquid-glass text-slate-200 rounded-tl-none border border-white/10'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="liquid-glass rounded-2xl rounded-tl-none p-3.5 flex items-center gap-3 text-xs text-sky-300 font-medium animate-pulse border border-sky-400/30">
              <div className="w-6 h-6 rounded-full bg-julie-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.8)]">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div>
                <p className="font-bold text-white">Julie is thinking...</p>
                <p className="text-[10px] text-sky-400 font-mono">Analyzing context & querying live Gemini model</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar shrink-0">
        {quickPills.map((pill, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(pill)}
            className="px-3.5 py-1.5 rounded-full liquid-pill text-xs font-medium text-slate-300 hover:text-white hover:border-sky-400/30 whitespace-nowrap active:scale-95 transition-all"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Live Voice Dictation Status Banner */}
      {isDictating && (
        <div className="mb-2 p-2 rounded-2xl liquid-glass border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-between animate-fade-in text-xs text-emerald-300 shrink-0">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-semibold">Listening to your voice... Will auto-send when you pause</span>
          </div>
          <button
            onClick={() => setIsDictating(false)}
            className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[10px] font-bold text-emerald-200"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Attached File Preview Pill */}
      {attachedFile && (
        <div className="mb-2 p-2.5 rounded-2xl liquid-glass border border-sky-400/40 flex items-center justify-between animate-fade-in shrink-0">
          <div className="flex items-center gap-2 text-xs text-white">
            <File className="w-4 h-4 text-sky-400" />
            <span className="font-semibold">{attachedFile.name}</span>
            <span className="text-[10px] text-slate-400">({attachedFile.size})</span>
          </div>
          <button
            onClick={() => setAttachedFile(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Bottom Input Capsule */}
      <div className="pt-1 shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className={`liquid-glass rounded-full border shadow-2xl p-1.5 pl-3.5 flex items-center gap-2 bg-[#0A0B14]/90 backdrop-blur-3xl transition-all ${
            isDictating ? 'border-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.3)]' : 'border-white/15'
          }`}
        >
          {/* Plus Action Sheet Button */}
          <button
            type="button"
            onClick={() => setIsFileModalOpen(true)}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
            title="Upload file or document"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Text Input with Real-Time Speech Writing */}
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={isDictating ? "Speaking... listening to your voice" : "Message Julie or tap mic to speak..."}
            className={`flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none ${
              isDictating ? 'text-emerald-300 font-medium' : ''
            }`}
          />

          {/* Voice-to-Text & Auto-Send Mic Button */}
          <button
            type="button"
            onClick={toggleDictation}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isDictating
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.8)] animate-pulse'
                : 'liquid-glass-button text-white shadow-[0_0_20px_rgba(124,58,237,0.5)]'
            }`}
            title={isDictating ? "Tap to cancel voice" : "Tap to speak into text box (auto-sends on pause)"}
          >
            {isDictating ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            className="w-8 h-8 rounded-full liquid-glass text-slate-300 hover:text-white hover:border-sky-400/40 flex items-center justify-center transition-colors active:scale-95"
            title="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* File Upload Modal Sheet */}
      <FileUploadModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        onSelectFile={(file: UploadedFileItem) => setAttachedFile(file)}
      />
    </div>
  );
};
