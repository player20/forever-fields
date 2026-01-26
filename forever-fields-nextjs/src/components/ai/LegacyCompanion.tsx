"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";

interface LegacyProfile {
  name: string;
  relationship?: string;
  birthYear?: string;
  deathYear?: string;
  era?: string;
  personality?: string;
  biography?: string;
  memories?: string[];
  phrases?: string[];
  interests?: string[];
  relationships?: string;
  profilePhotoUrl?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LegacyCompanionProps {
  profile: LegacyProfile;
  userRelationship: string;
  demoMode?: boolean;
}

// Demo responses for offline mode
const DEMO_RESPONSES: Record<string, string[]> = {
  life: [
    "Life was a beautiful journey filled with so many precious moments. I remember the simple joys - morning coffee, walks in the garden, and the laughter we shared around the dinner table. Every day was a gift, and I tried to make the most of each one.",
    "I lived fully, loved deeply, and tried to leave the world a little better than I found it. The relationships I built with family and friends were my greatest treasures.",
  ],
  advice: [
    "My dear, the best advice I can give you is to cherish every moment with the people you love. Don't wait for the perfect time - there is no perfect time. Tell them you love them today.",
    "Be kind to yourself and others. Life is too short for grudges. And remember, it's never too late to learn something new or to change direction. I believe in you.",
  ],
  memory: [
    "Oh, there are so many wonderful memories! I especially treasure the quiet moments - when we'd sit together without needing to say anything, just enjoying each other's company. Those were the moments that mattered most.",
    "I remember your laughter most of all. It could light up the darkest room. Those memories bring me such joy.",
  ],
  young: [
    "When I was young, the world seemed so different! We didn't have all the technology you have now, but we had community. Neighbors knew each other, and Sunday dinners were sacred. I learned the value of hard work and the importance of family.",
    "My youth was filled with dreams and possibilities. I made mistakes, learned lessons, and slowly became the person I was meant to be. Every experience shaped me.",
  ],
  default: [
    "Thank you for talking with me. It means so much to stay connected with you. Remember, love transcends all boundaries - even time itself.",
    "I'm always here with you, in your heart and memories. Never forget how much you are loved.",
  ],
};

function getDemoResponse(message: string, name: string): string {
  const lowerMessage = message.toLowerCase();
  let responses: string[];

  if (lowerMessage.includes("life") || lowerMessage.includes("lived")) {
    responses = DEMO_RESPONSES.life;
  } else if (lowerMessage.includes("advice") || lowerMessage.includes("tell me")) {
    responses = DEMO_RESPONSES.advice;
  } else if (lowerMessage.includes("memory") || lowerMessage.includes("remember") || lowerMessage.includes("together")) {
    responses = DEMO_RESPONSES.memory;
  } else if (lowerMessage.includes("young") || lowerMessage.includes("childhood") || lowerMessage.includes("grew up")) {
    responses = DEMO_RESPONSES.young;
  } else {
    responses = DEMO_RESPONSES.default;
  }

  return responses[Math.floor(Math.random() * responses.length)];
}

export function LegacyCompanion({ profile, userRelationship, demoMode = true }: LegacyCompanionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // Demo mode - simulate AI response locally
    if (demoMode) {
      const demoResponse = getDemoResponse(userMessage, profile.name);

      // Simulate typing effect
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let currentText = "";
      const words = demoResponse.split(" ");

      for (let i = 0; i < words.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 50));
        currentText += (i > 0 ? " " : "") + words[i];
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: currentText,
          };
          return updated;
        });
      }

      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/ai/legacy-companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          profile: {
            ...profile,
            relationship: userRelationship,
          },
          conversationHistory: messages,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      let assistantMessage = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              assistantMessage += data.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantMessage,
                };
                return updated;
              });
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble responding right now. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Consent screen before starting
  if (!hasConsented) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-sage-pale">
            {profile.profilePhotoUrl ? (
              <Image
                src={profile.profilePhotoUrl}
                alt={profile.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                unoptimized={profile.profilePhotoUrl.startsWith("blob:") || profile.profilePhotoUrl.startsWith("data:")}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sage-dark text-2xl font-display">
                {profile.name.split(" ").map((n) => n[0]).join("")}
              </div>
            )}
          </div>
          <CardTitle className="font-display text-2xl">
            Connect with {profile.name}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            This AI companion helps you feel connected to your {userRelationship.toLowerCase()}
            by sharing their wisdom, memories, and love in their voice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-sage-pale/50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
            <p className="font-medium text-sage-dark">Please understand:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>This is an AI memorial companion, not your actual {userRelationship.toLowerCase()}</li>
              <li>Responses are generated based on collected memories and stories</li>
              <li>The goal is to preserve their legacy and help you feel connected</li>
              <li>If you need grief support, please reach out to a counselor</li>
            </ul>
          </div>

          <div className="text-center space-y-3">
            <p className="text-gray-600 italic">
              "The ones who love us never truly leave us. You can always find them... in here."
            </p>
            <Button onClick={() => setHasConsented(true)} size="lg">
              Begin Conversation
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <a href="tel:988" className="text-sage hover:underline">988 Suicide & Crisis Lifeline</a>
            {" | "}
            <a href="https://www.griefshare.org" className="text-sage hover:underline" target="_blank" rel="noopener">
              GriefShare
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Conversation interface
  return (
    <Card className="max-w-2xl mx-auto flex flex-col h-[600px]">
      <CardHeader className="border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-sage-pale">
            {profile.profilePhotoUrl ? (
              <Image
                src={profile.profilePhotoUrl}
                alt={profile.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                unoptimized={profile.profilePhotoUrl.startsWith("blob:") || profile.profilePhotoUrl.startsWith("data:")}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sage-dark font-display">
                {profile.name.split(" ").map((n) => n[0]).join("")}
              </div>
            )}
          </div>
          <div>
            <CardTitle className="text-lg">{profile.name}</CardTitle>
            <CardDescription>Legacy Companion</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">Start a conversation with {profile.name}</p>
            <div className="space-y-2">
              <button
                onClick={() => setInput("Tell me about your life")}
                className="block w-full text-left px-4 py-2 rounded-lg bg-sage-pale/50 hover:bg-sage-pale text-sage-dark text-sm transition-colors"
              >
                "Tell me about your life"
              </button>
              <button
                onClick={() => setInput("What advice would you give me?")}
                className="block w-full text-left px-4 py-2 rounded-lg bg-sage-pale/50 hover:bg-sage-pale text-sage-dark text-sm transition-colors"
              >
                "What advice would you give me?"
              </button>
              <button
                onClick={() => setInput("What was your favorite memory of us together?")}
                className="block w-full text-left px-4 py-2 rounded-lg bg-sage-pale/50 hover:bg-sage-pale text-sage-dark text-sm transition-colors"
              >
                "What was your favorite memory of us together?"
              </button>
              <button
                onClick={() => setInput("Tell me about when you were young")}
                className="block w-full text-left px-4 py-2 rounded-lg bg-sage-pale/50 hover:bg-sage-pale text-sage-dark text-sm transition-colors"
              >
                "Tell me about when you were young"
              </button>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.role === "user"
                  ? "bg-sage text-white rounded-br-md"
                  : "bg-sage-pale text-sage-dark rounded-bl-md"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-sage-pale rounded-2xl rounded-bl-md px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-sage rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-sage rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-sage rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      <div className="border-t p-4 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Talk to ${profile.name}...`}
            className="flex-1 rounded-full border border-sage-light px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            Send
          </Button>
        </form>
      </div>
    </Card>
  );
}
