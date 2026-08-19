import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Menu, Edit, Plus, Mic, MicOff, Send, Sparkles, Check, ChevronRight } from 'lucide-react';
import { db, CURRENT_USER_ID } from '@/core/storage/db';
import { AIService, type AIResponse } from '@/services/ai/AIService';
import { voiceService, type VoiceState } from '@/services/voice/VoiceService';

export const AssistantView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>(voiceService.getState());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useLiveQuery(() => db.messages.orderBy('created_at').toArray(), []);
  const preferences = useLiveQuery(() => db.preferences.where('user_id').equals(CURRENT_USER_ID).first());

  useEffect(() => {
    const unsub = voiceService.subscribe(async state => {
      setVoiceState(state);
      if (state.transcript && !state.isListening && !isProcessing) {
        const text = state.transcript;
        state.transcript = '';
        await handleSendMessage(text, 'Voice');
      }
    });
    return unsub;
  }, [isProcessing]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSendMessage = async (textToSend?: string, source: 'Voice' | 'Chat' = 'Chat') => {
    const query = (textToSend || inputText).trim();
    if (!query || isProcessing) return;

    setInputText('');
    setIsProcessing(true);

    try {
      const response: AIResponse = await AIService.processMessage(query, source);
      if (source === 'Voice' || preferences?.voice_enabled) {
        voiceService.speak(response.message);
      }
    } catch (err) {
      console.error('[Julie AI] Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceToggle = () => {
    if (voiceState.isListening) {
      voiceService.stopListening();
    } else {
      voiceService.startListening();
    }
  };

  const quickPills = [
    'Plan my day',
    'What should I do now?',
    'Summarize this PDF',
    'Add a task',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] px-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between py-2 border-b border-slate-100/80">
        <button className="p-2 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all">
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-sm font-bold text-slate-800 tracking-tight">AI Chat</h1>

        <button
          onClick={async () => {
            await db.messages.clear();
          }}
          className="p-2 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all"
          title="New conversation"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-0.5">
        {/* Intro Greeting & Quick Pills */}
        <div className="space-y-3 pt-1">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Hello, Boss.</h2>
            <p className="text-xs text-slate-400 mt-0.5">How can I help you today?</p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {quickPills.map((pill, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(pill, 'Chat')}
                className="bg-white border border-slate-200/80 text-slate-700 font-medium text-xs px-3.5 py-1.5 rounded-full shadow-sm hover:border-julie-300 hover:text-julie-600 transition-all active:scale-95"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Message Chain from Screenshot if messages empty */}
        {(!messages || messages.length === 0) && (
          <div className="space-y-3 pt-2">
            {/* User message */}
            <div className="flex justify-end">
              <div className="bg-slate-100 text-slate-800 text-xs font-medium px-4 py-2.5 rounded-2xl rounded-tr-none max-w-[80%]">
                Plan my evening.
              </div>
            </div>

            {/* Assistant message */}
            <div className="flex justify-start">
              <div className="bg-white border border-slate-100 shadow-card-soft text-slate-800 text-xs rounded-2xl rounded-tl-none p-4 max-w-[92%] space-y-3">
                <p className="leading-relaxed text-slate-700">
                  Sure, Boss. You have around 3 hours free tonight. Here's what I recommend:
                </p>

                {/* Structured Schedule Block */}
                <div className="space-y-2 pl-2 border-l-2 border-julie-400 py-0.5 font-sans">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 font-medium text-[11px]">7:30 - 8:30 PM</span>
                    <span className="font-semibold text-slate-800">Marketing Assignment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 font-medium text-[11px]">8:30 - 9:00 PM</span>
                    <span className="font-semibold text-slate-800">Dinner Break</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 font-medium text-[11px]">9:00 - 10:30 PM</span>
                    <span className="font-semibold text-slate-800">Creative Project</span>
                  </div>
                </div>

                <p className="text-slate-600 font-medium">Shall I schedule this for you?</p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleSendMessage('Schedule it', 'Chat')}
                    className="julie-button-gradient text-white font-semibold text-[11px] px-3.5 py-1.5 rounded-full shadow-sm"
                  >
                    Schedule it
                  </button>
                  <button
                    onClick={() => handleSendMessage('Customize schedule', 'Chat')}
                    className="bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium text-[11px] px-3.5 py-1.5 rounded-full"
                  >
                    Customize
                  </button>
                </div>
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
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-slate-100 text-slate-800 rounded-tr-none font-medium'
                    : 'bg-white border border-slate-100 shadow-card-soft text-slate-800 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-julie-50/80 border border-julie-100 shadow-card-soft rounded-2xl rounded-tl-none p-3.5 flex items-center gap-3 text-xs text-julie-700 font-medium animate-pulse">
              <div className="w-5 h-5 rounded-full bg-julie-500 text-white flex items-center justify-center">
                <Sparkles className="w-3 h-3 animate-spin" />
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-800">Julie is thinking...</p>
                <p className="text-[10px] text-julie-600 font-mono">Querying live Gemini model & analyzing schedule context</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Message Input Bar */}
      <div className="pt-2">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="bg-white rounded-full border border-slate-200 shadow-card-soft p-1.5 flex items-center gap-2"
        >
          {/* Plus icon */}
          <button
            type="button"
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Message Julie..."
            className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />

          {/* Mic Button (Purple gradient circular) */}
          <button
            type="button"
            onClick={handleVoiceToggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              voiceState.isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'julie-button-gradient text-white'
            }`}
          >
            {voiceState.isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
};
