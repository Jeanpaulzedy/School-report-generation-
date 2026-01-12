
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Bot, User as UserIcon, GraduationCap, TrendingUp, HelpCircle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../supabaseClient';
import { User } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistantPage: React.FC<{ user: User }> = ({ user }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `Hello ${user.full_name}! I am your Academic Assistant. I can help you analyze student performance, draft teacher comments, or provide summaries of your classes. How can I assist you today?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const executeAI = async (prompt: string) => {
    if (!prompt.trim() || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setLoading(true);

    try {
      const [studentsCount, marksCount] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('marks').select('*', { count: 'exact', head: true })
      ]);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `System Context: You are an AI Academic Assistant for ESP RULI, a secondary school in Rwanda. 
            There are currently ${studentsCount.count} students enrolled and ${marksCount.count} marks recorded. 
            The current user is ${user.full_name} (${user.role}).
            
            User Question: ${prompt}`,
        config: {
          systemInstruction: "You are a professional, encouraging, and highly intelligent school administrator assistant. Keep answers concise, helpful, and aligned with Rwandan educational standards.",
          temperature: 0.7
        }
      });

      const aiResponse = response.text || "I apologize, I couldn't process that request right now.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (text) {
      setInput('');
      executeAI(text);
    }
  };

  const handleChipClick = (prompt: string) => {
    executeAI(prompt);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-5xl mx-auto space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        {[
          { icon: TrendingUp, text: "Analyze Performance", prompt: "Summarize how our students are doing based on current marks data." },
          { icon: GraduationCap, text: "Draft a Parent Letter", prompt: "Draft a professional letter to parents for the upcoming end of term." },
          { icon: HelpCircle, text: "Class Top Performers", prompt: "Who are the top performers in the school based on marks?" }
        ].map((item, i) => (
          <button 
            key={i}
            onClick={() => handleChipClick(item.prompt)}
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 transition-all text-left group shadow-sm active:scale-95"
          >
            <item.icon size={18} className="text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.text}</p>
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {msg.role === 'user' ? <UserIcon size={20} /> : <Bot size={20} />}
                </div>
                <div className={`p-5 rounded-3xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/20' 
                    : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100 whitespace-pre-wrap'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center animate-pulse">
                  <Sparkles size={20} />
                </div>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="relative">
            <textarea 
              rows={1}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-6 pr-16 py-4 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all font-medium text-slate-700 shadow-inner resize-none"
              placeholder="Ask anything about the school..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all disabled:bg-slate-300 shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[9px] text-center mt-3 text-slate-400 font-bold uppercase tracking-widest">
            Powered by Gemini 3 Pro • Real-time Academic Insights
          </p>
        </div>
      </div>
    </div>
  );
};
