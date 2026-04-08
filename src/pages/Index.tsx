import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw } from "lucide-react";
import ParticlesBackground from "@/components/ParticlesBackground";
import HeroSection from "@/components/HeroSection";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import { aiGateway, type AIResponse } from "@/lib/ai-gateway";
import type { RouteResult } from "@/lib/ai-router";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  route?: RouteResult;
  isImage?: boolean;
  isVideo?: boolean;
  fallbackUsed?: boolean;
  isLoading?: boolean;
  error?: boolean;
  originalPrompt?: string;
}

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (input: string) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input };
    const loadingId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: loadingId, role: "assistant", content: "", isLoading: true },
    ]);
    setIsLoading(true);

    try {
      const response: AIResponse = await aiGateway(input);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                content: response.content,
                route: response.route,
                isImage: response.isImage,
                isVideo: response.isVideo,
                fallbackUsed: response.fallbackUsed,
                isLoading: false,
              }
            : m
        )
      );
    } catch (err) {
      console.error("AI Gateway error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                content: "⚠️ Something went wrong. Please try again.",
                isLoading: false,
                error: true,
                originalPrompt: input,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const retry = (prompt: string) => {
    setMessages((prev) => prev.filter((m) => !m.error));
    sendMessage(prompt);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen flex flex-col relative">
      <ParticlesBackground />

      <div className="relative z-10 flex-1 flex flex-col max-w-3xl mx-auto w-full px-4">
        <AnimatePresence mode="wait">
          {!hasMessages && (
            <motion.div
              key="hero"
              exit={{ opacity: 0, y: -30, transition: { duration: 0.3 } }}
            >
              <HeroSection />
            </motion.div>
          )}
        </AnimatePresence>

        {hasMessages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 overflow-y-auto py-6 space-y-2"
          >
            {messages.map((msg) => (
              <div key={msg.id}>
                <ChatMessage
                  role={msg.role}
                  content={msg.content}
                  route={msg.route}
                  isImage={msg.isImage}
                  isVideo={msg.isVideo}
                  fallbackUsed={msg.fallbackUsed}
                  isLoading={msg.isLoading}
                />
                {msg.error && msg.originalPrompt && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => retry(msg.originalPrompt!)}
                    className="ml-2 mb-4 inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry
                  </motion.button>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </motion.div>
        )}

        <div className="sticky bottom-0 pb-6 pt-2">
          <ChatInput onSend={sendMessage} disabled={isLoading} />
          <p className="text-center text-[11px] text-muted-foreground/50 mt-3">
            AI STATION routes your query to the best model automatically
          </p>
        </div>
      </div>
    </div>
  );
}
