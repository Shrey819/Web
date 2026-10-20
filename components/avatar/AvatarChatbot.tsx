"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AvatarMascot, type AvatarAnimation } from "./AvatarMascot";
import {
  type ChatMessage,
  getBotResponse,
} from "@/lib/chatbotKnowledge";
import {
  Send,
  X,
  Minimize2,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Bot,
  User,
  HelpCircle,
} from "lucide-react";

interface AvatarChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  avatarMood: AvatarAnimation;
  onMoodChange: (mood: AvatarAnimation) => void;
}

export function AvatarChatbot({
  isOpen,
  onClose,
  onMinimize,
  avatarMood,
  onMoodChange,
}: AvatarChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "Hello! 👋 I'm Kilby, your OM Automation companion. How can I help your factory or project today?",
      timestamp: "Just now",
      avatarMood: "happy",
      quickActions: [
        { label: "Request Bulk Quote 📋", href: "/quote" },
        { label: "Find PLCs & VFDs ⚡", href: "/category/programmable-logic-controllers-plcs" },
        { label: "Shipping Timeline 🚚", href: "/shipping-policy" },
      ],
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    onMoodChange("thinking");

    // Realistic bot delay with dynamic response
    setTimeout(() => {
      const botResult = getBotResponse(query);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: botResult.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickActions: botResult.quickActions,
        avatarMood: botResult.avatarMood,
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
      onMoodChange(botResult.avatarMood);

      // Return to idle after animation
      setTimeout(() => {
        onMoodChange("idle");
      }, 3500);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: "bot",
        text: "Chat cleared! What else can I look up for you? 😊",
        timestamp: "Just now",
        avatarMood: "happy",
        quickActions: [
          { label: "Search Sensors 🎯", href: "/category/sensors-transducers" },
          { label: "Request Bulk Quote 📋", href: "/quote" },
        ],
      },
    ]);
    onMoodChange("happy");
  };

  if (!isOpen) return null;

  return (
    <div className="w-[calc(100vw-32px)] sm:w-96 max-h-[85vh] h-[580px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 z-50">
      {/* Header with Prominent Yellow Avatar Mascot */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-3.5 px-4 flex items-center justify-between border-b border-amber-500/20 shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-md" />
            <AvatarMascot
              mode="custom"
              animation={avatarMood}
              size={42}
              interactive={false}
              className="relative z-10"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <span>Kilby</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 font-mono px-1.5 py-0.5 rounded-full border border-amber-400/30">
                  AI BUDDY
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>OM Automation Assistant</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Clear Chat History"
            aria-label="Clear Chat History"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onMinimize}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Minimize"
            aria-label="Minimize"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60 dark:bg-slate-950/40 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-slate-900 text-white rounded-tr-xs"
                  : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-xs"
              }`}
            >
              {msg.text}

              {/* Quick Actions / Link Pills if provided */}
              {msg.quickActions && msg.quickActions.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                  {msg.quickActions.map((action, idx) =>
                    action.href ? (
                      <Link
                        key={idx}
                        href={action.href}
                        onClick={onClose}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-semibold text-[11px] rounded-lg border border-amber-200/80 dark:border-amber-800 transition-colors"
                      >
                        <span>{action.label}</span>
                        <ExternalLink className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                      </Link>
                    ) : (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(action.query || action.label)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-medium text-[11px] rounded-lg transition-colors cursor-pointer"
                      >
                        {action.label}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-400 mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {/* Live Typing & Avatar Thinking Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-slate-500 text-[11px] animate-pulse">
            <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-500">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span>Kilby is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => handleSend("How do I request a bulk quote?")}
          className="whitespace-nowrap px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium rounded-full transition-colors cursor-pointer shrink-0"
        >
          📋 Bulk Quote
        </button>
        <button
          type="button"
          onClick={() => handleSend("Do you stock Siemens & Delta PLCs?")}
          className="whitespace-nowrap px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium rounded-full transition-colors cursor-pointer shrink-0"
        >
          ⚡ PLCs & VFDs
        </button>
        <button
          type="button"
          onClick={() => handleSend("What is your shipping & delivery time?")}
          className="whitespace-nowrap px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium rounded-full transition-colors cursor-pointer shrink-0"
        >
          🚚 Delivery Time
        </button>
        <button
          type="button"
          onClick={() => handleSend("Can I track my order?")}
          className="whitespace-nowrap px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium rounded-full transition-colors cursor-pointer shrink-0"
        >
          📦 Track Order
        </button>
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (avatarMood !== "listening") {
              onMoodChange("listening");
            }
          }}
          onFocus={() => onMoodChange("listening")}
          onBlur={() => {
            if (avatarMood === "listening") {
              onMoodChange("idle");
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask Kilby anything about automation parts..."
          className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold shadow-md transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
          title="Send message"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default AvatarChatbot;
