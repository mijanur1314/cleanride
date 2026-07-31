'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { MessageCircle, X, Send, Bot, User as UserIcon } from 'lucide-react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from '../store/useAuthStore';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState('');

  const transport = new DefaultChatTransport({ 
    api: '/api/chat',
    body: {
      userContext: user ? {
        name: user.name,
        role: user.role,
      } : null
    },
  });

  const { messages, status, sendMessage } = useChat({
    transport,
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] });
    setInput('');
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-zinc-900 border border-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:bg-black hover:scale-105 transition-all duration-300 z-50 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'} cursor-pointer`}
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-80 sm:w-96 bg-zinc-950/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 flex flex-col z-50 transition-all duration-300 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
        style={{ height: '500px', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="bg-zinc-900/80 backdrop-blur-md text-white p-4 rounded-t-2xl flex justify-between items-center border-b border-white/10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-1.5 rounded-lg border border-white/5">
              <Bot size={20} className="text-gray-100" />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] tracking-wide">CleanRide AI Support</h3>
              <p className="text-xs text-gray-400">Premium Doorstep Assistance</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-12 flex flex-col items-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                <Bot size={32} className="text-gray-300" />
              </div>
              <h4 className="text-white font-medium mb-1">Showroom Perfection</h4>
              <p className="text-sm px-4">Experience elite care. How can I assist you with your vehicle today?</p>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${m.role === 'user' ? 'bg-white text-black border-gray-200' : 'bg-zinc-800 text-white border-white/10'}`}>
                {m.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
              </div>
              <div
                className={`px-4 py-3 rounded-2xl ${
                  m.role === 'user' 
                    ? 'bg-white text-black rounded-tr-sm shadow-md' 
                    : 'bg-zinc-800/80 backdrop-blur-md border border-white/10 text-gray-100 rounded-tl-sm shadow-sm'
                }`}
              >
                <div className="text-sm leading-relaxed react-markdown-content [&>p]:mb-2 last:[&>p]:mb-0 [&>ol]:list-decimal [&>ol]:pl-4 [&>ul]:list-disc [&>ul]:pl-4 [&>li]:mb-1 [&>strong]:font-semibold [&>strong]:text-white">
                  {m.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{m.parts.filter(p => p.type === 'text').map((p: any) => p.text).join('\\n')}</p>
                  ) : (
                    <ReactMarkdown>
                      {m.parts.filter(p => p.type === 'text').map((p: any) => p.text).join('\\n')}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="self-start flex gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 text-white">
                <Bot size={14} />
              </div>
              <div className="px-4 py-3.5 bg-zinc-800/80 backdrop-blur-md border border-white/10 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2 bg-zinc-900/80 backdrop-blur-md">
            {['View pricing', 'How to book?', 'Loyalty rewards'].map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => sendMessage({ role: 'user', parts: [{ type: 'text', text }] })}
                className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/5 transition-colors"
              >
                {text}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 bg-zinc-900/80 backdrop-blur-md border-t border-white/10 rounded-b-2xl flex gap-2">
          <input
            className="flex-1 px-4 py-2.5 bg-black/50 border border-white/10 rounded-full text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-all placeholder-gray-500"
            value={input}
            placeholder="Ask me anything..."
            onChange={handleInputChange}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Send size={16} className={input.trim() ? "translate-x-[1px]" : ""} />
          </button>
        </form>
      </div>
    </>
  );
}
