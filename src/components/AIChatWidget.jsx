import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { generateGeminiResponse } from '../utils/geminiApi';
import { RESUME_CONTEXT } from '../data/resumeData';
import { useTranslation } from 'react-i18next';

// (/pilot) Memoized component to prevent cascading re-renders
const MessageItem = memo(({ msg }) => (
  <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[80%] px-4 py-2.5 text-[15px] leading-relaxed ${
      msg.sender === 'user' 
        ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-2xl rounded-tr-sm shadow-md shadow-indigo-500/20' 
        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm shadow-sm'
    }`}>
      {msg.text}
    </div>
  </div>
));

MessageItem.displayName = 'MessageItem';

const AIChatWidget = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    // (/sync) Expert Protocol: Load chat history with corruption fallback
    try {
      const saved = localStorage.getItem('maximus_chat_history');
      return saved ? JSON.parse(saved) : [{ text: t('chat.initial_message'), sender: 'ai' }];
    } catch (e) {
      console.warn("[Sync Warning]: Local data corrupted. Resetting chat.");
      return [{ text: t('chat.initial_message'), sender: 'ai' }];
    }
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  // (/sync) Mastery Protocol: Consonlidated & Debounced Persistence
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem('maximus_chat_history', JSON.stringify(messages));
        localStorage.setItem('maximus_sync_seq', Date.now().toString());
      } catch (e) {
        console.error("[Sync Fatal]: Storage quota exceeded.");
      }
    }, 500); // 500ms debounce to protect Main Thread

    return () => clearTimeout(timeout);
  }, [messages]);

  const handleSend = useCallback(async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    // (/monetize-strategy) Expert Factor: Session Rate Limit (15 msgs)
    const currentCount = parseInt(sessionStorage.getItem('chat_count') || "0");
    if (currentCount >= 15) {
      setMessages(prev => [...prev, { text: "Session limit reached. Please try tomorrow!", sender: 'ai' }]);
      return;
    }
    sessionStorage.setItem('chat_count', (currentCount + 1).toString());

    const userMessage = input;
    // (/offline-first) Optimistic UI: Immediate feedback
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setInput("");
    setIsTyping(true);

    const systemPrompt = `[IDENTITY]: You are the dedicated personal AI for Burak Tomruk, a Software Engineer based in Munich, Germany. You represent ONLY the person described in the context below. 
    [ANTI-HALLUCINATION]: NEVER suggest Burak is an actor or any other celebrity. He is a high-level Software Engineer with expertise in React, TypeScript, and Satellite TV systems.
    [CONTEXT]: ${RESUME_CONTEXT}. 
    [RULE]: Speak ONLY about the Software Engineer. ALWAYS reply in English. Keep answers extremely short and professional.
    [RESPOND STYLE]: Enthusiastic, helpful, and concise.`;

    try {
      const response = await generateGeminiResponse(userMessage, systemPrompt);
      setIsTyping(false); 
      setMessages(prev => [...prev, { text: response, sender: 'ai' }]);
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, { text: "The AI gateway is briefly offline. Please try again soon.", sender: 'ai' }]);
    }
  }, [input, isTyping]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-5 w-80 md:w-96 h-[450px] bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-slate-700/50 flex flex-col overflow-hidden animate-fade-in-up origin-bottom-right">
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center shadow-sm z-10">
            <div className="flex items-center gap-2.5 font-semibold tracking-wide">
              <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                <Bot className="w-5 h-5 drop-shadow-md" />
              </div>
              {t('chat.header')}
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/40 scroll-smooth">
            {messages.map((msg, idx) => (
              <MessageItem key={idx} msg={msg} />
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 px-4 py-3.5 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-700 shadow-sm flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce-dot [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce-dot [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce-dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-700/50">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('chat.placeholder')}
                className="w-full pl-4 pr-12 py-3 rounded-full bg-slate-100 outline-none dark:bg-slate-900/50 border border-transparent focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 text-[15px] dark:text-white transition-all shadow-inner"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-1.5 p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/30"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      )}
      
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="peer relative flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:scale-105 transition-all duration-300 z-10"
        >
          {isOpen ? <X className="w-7 h-7 rotate-90 transition-transform duration-300" /> : <MessageSquare className="w-7 h-7 transition-transform duration-300" />}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-indigo-500/40 animate-ping -z-10"></span>
          )}
        </button>
        
        {!isOpen && (
          <span className="absolute right-20 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-4 py-2 rounded-xl text-sm font-medium shadow-xl opacity-0 peer-hover:opacity-100 transition-all duration-300 whitespace-nowrap border border-slate-100 dark:border-slate-700 pointer-events-none translate-x-2 peer-hover:translate-x-0">
            {t('chat.tooltip')}
            <div className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white dark:bg-slate-800 border-t border-r border-slate-100 dark:border-slate-700 rotate-45"></div>
          </span>
        )}
      </div>
    </div>
  );
};

export default AIChatWidget;
