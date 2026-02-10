'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, User, Bot, Loader2, TrendingUp, Trophy, Star } from 'lucide-react';

const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const CareerChat = () => {
    const initialConversation = [
        {
            id: '1',
            role: 'user',
            text: "I'm looking for a high-growth career path in AI. Can you help me find my best fit?",
            timestamp: getCurrentTime(),
        },
        {
            id: '2',
            role: 'model',
            text: "Absolutely! I've analyzed global market trends against your profile. Given your technical background, I suggest focusing on AI Solutions Architecture.",
            timestamp: getCurrentTime(),
        },
        {
            id: '3',
            role: 'user',
            text: "That sounds interesting. What's the salary outlook for that role in 2025?",
            timestamp: getCurrentTime(),
        },
        {
            id: '4',
            role: 'model',
            text: "AI Architects are seeing a 40% salary increase this year. Most senior roles now start above $180k with significant equity packages.",
            timestamp: getCurrentTime(),
            meta: (
                <div className="mt-2 flex gap-2">
                    <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-100">
                        <TrendingUp className="w-3 h-3" /> MARKET TREND +40%
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-[10px] font-bold border border-amber-100">
                        <Star className="w-3 h-3" /> HIGH DEMAND
                    </div>
                </div>
            )
        }
    ];

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    // Sequence initial messages on mount with staggered delays to show the animations
    useEffect(() => {
        let timeoutIds = [];

        initialConversation.forEach((msg, index) => {
            const id = window.setTimeout(() => {
                setMessages(prev => [...prev, msg]);
            }, (index + 1) * 1200); // 1.2s gap between each message to appreciate the animation
            timeoutIds.push(id);
        });

        return () => timeoutIds.forEach(id => clearTimeout(id));
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessageText = input.trim();
        const time = getCurrentTime();
        setInput('');

        // 1. Add user message (animates from right)
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'user',
            text: userMessageText,
            timestamp: time
        }]);

        setIsLoading(true);

        // 2. Simulate model response (animates from left after typing)
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "I'm analyzing that specific sector now. Based on your goals, I recommend we build a 6-month specialized roadmap focusing on LLM Ops and RAG architectures.",
                timestamp: getCurrentTime(),
            }]);
            setIsLoading(false);
        }, 2000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 border-b border-theme flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center shadow-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-900 leading-none">Careerra AI</div>
                        <div className="text-[10px] text-emerald-600 font-bold uppercase flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            Strategic Counselor
                        </div>
                    </div>
                </div>
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <img key={i} src={`https://i.pravatar.cc/100?u=${i + 25}`} className="w-6 h-6 rounded-full border-2 border-white" alt="Active users" />
                    ))}
                    <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-400">+12k</div>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 p-6 space-y-6 overflow-y-auto scroll-smooth bg-gradient-to-b from-white to-[#F8FAFC]"
            >
                {messages.map((msg) => {
                    // Animation class depends on the role
                    const animationClass = msg.role === 'model' ? 'animate-message-left' : 'animate-message-right';

                    return (
                        <div
                            key={msg.id}
                            className={`flex gap-3 group ${animationClass} ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100 self-end mb-1 ring-2 ring-white shadow-sm">
                                    <Bot className="w-4 h-4 text-[#0F172A]" />
                                </div>
                            )}

                            <div className="flex flex-col max-w-[85%] relative">
                                <div className={`rounded-2xl text-sm font-medium leading-relaxed shadow-sm transition-all duration-300 ${msg.role === 'user'
                                    ? 'bg-[#0F172A] text-white rounded-tr-none p-4 shadow-md'
                                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 p-4'
                                    }`}>
                                    <div className="whitespace-pre-wrap">
                                        {msg.text}
                                    </div>
                                    {msg.meta}
                                </div>

                                <div className={`absolute -bottom-5 text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap ${msg.role === 'user' ? 'right-0' : 'left-0'
                                    }`}>
                                    {msg.timestamp}
                                </div>
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-[#0F172A] flex items-center justify-center flex-shrink-0 self-end mb-1 ring-2 ring-slate-100 shadow-sm">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>
                    );
                })}
                {isLoading && (
                    <div className="flex justify-start gap-3 animate-message-left">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100 ring-2 ring-white">
                            <Bot className="w-4 h-4 text-[#0F172A]" />
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 flex gap-2 items-center shadow-sm">
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Analyzing market data...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-theme bg-white">
                <div className="relative group">
                    <textarea
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask your AI career mentor..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-[#0F172A] transition-all pr-14 resize-none font-medium text-slate-700"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={`absolute right-2 top-2.5 p-2.5 rounded-xl transition-all ${input.trim() && !isLoading
                            ? 'bg-[#0F172A] text-white shadow-lg hover:opacity-90'
                            : 'bg-slate-100 text-slate-400'
                            }`}
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center justify-center gap-4 mt-4 opacity-40">
                    <Trophy className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">2025 Career Intelligence Engine</span>
                    <Trophy className="w-3 h-3" />
                </div>
            </div>
        </div>
    );
};
