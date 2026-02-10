"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Bot,
  User,
} from "lucide-react";
import { Button } from "@/components/ui";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatWidgetProps {
  memorialName: string;
  memorialId: string;
  obituary?: string;
  stories?: Array<{ title: string; content: string }>;
  className?: string;
}

// Demo responses for historical figures
const JEFFERSON_RESPONSES: Record<string, string> = {
  default: "I would be honored to share my thoughts with you. What would you like to know about my life, my writings, or my time?",
  declaration: "The Declaration of Independence was drafted in a rented room on Market Street in Philadelphia. I labored over every word, knowing that the fate of a new nation hung in the balance. The phrase 'all men are created equal' remains the most important truth I ever committed to paper.",
  monticello: "Monticello is my greatest architectural achievement and my sanctuary. I designed it myself, drawing inspiration from the classical architecture I studied in France. The name means 'little mountain' in Italian. Every corner reflects my love of beauty, learning, and the agrarian life.",
  education: "I believe education is the foundation of a free society. This is why I founded the University of Virginia - to create an 'academical village' where students and scholars could live and learn together. Knowledge must be accessible to all, not just the privileged few.",
  books: "I cannot live without books. My personal library of over 6,000 volumes became the foundation of the Library of Congress after the British burned the original collection. Even in my final years, I continued to acquire new works.",
  freedom: "The tree of liberty must be refreshed from time to time. I dedicated my life to the cause of freedom - religious freedom, political freedom, freedom of the press. These principles are the birthright of every American.",
};

function getJeffersonResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("declaration") || lowerMessage.includes("independence")) {
    return JEFFERSON_RESPONSES.declaration;
  }
  if (lowerMessage.includes("monticello") || lowerMessage.includes("home") || lowerMessage.includes("house")) {
    return JEFFERSON_RESPONSES.monticello;
  }
  if (lowerMessage.includes("education") || lowerMessage.includes("university") || lowerMessage.includes("school")) {
    return JEFFERSON_RESPONSES.education;
  }
  if (lowerMessage.includes("book") || lowerMessage.includes("library") || lowerMessage.includes("read")) {
    return JEFFERSON_RESPONSES.books;
  }
  if (lowerMessage.includes("freedom") || lowerMessage.includes("liberty") || lowerMessage.includes("rights")) {
    return JEFFERSON_RESPONSES.freedom;
  }

  return JEFFERSON_RESPONSES.default;
}

export function AIChatWidget({
  memorialName,
  memorialId,
  obituary,
  stories,
  className = "",
}: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Add welcome message when opening
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hello, I am here to share memories and stories about ${memorialName}. What would you like to know?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, memorialName, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Check if this is the Jefferson memorial for demo purposes
    const isJefferson = memorialName.toLowerCase().includes("jefferson");

    try {
      if (isJefferson) {
        // Demo mode for Jefferson
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const response = getJeffersonResponse(userMessage.content);

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: response,
            timestamp: new Date(),
          },
        ]);
      } else {
        // Call the legacy companion API
        const response = await fetch("/api/ai/legacy-companion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memorialId,
            message: userMessage.content,
            context: {
              name: memorialName,
              obituary,
              stories: stories?.map((s) => `${s.title}: ${s.content}`).join("\n\n"),
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: data.response || "I'm here to help you remember and celebrate their life.",
              timestamp: new Date(),
            },
          ]);
        } else {
          throw new Error("Failed to get response");
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `I'd love to share memories about ${memorialName}. While I'm still learning, I'm here to help you remember the special moments.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow ${className}`}
            aria-label="Open memory companion chat"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-amber-900" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Memory Companion</h3>
                    <p className="text-xs text-white/80">
                      Chat about {memorialName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-purple-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-purple-600 text-white rounded-br-md"
                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about their memories..."
                  className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="rounded-full bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Powered by AI · Responses based on shared memories
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default AIChatWidget;
