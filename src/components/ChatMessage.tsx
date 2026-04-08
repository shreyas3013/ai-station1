import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import type { RouteResult } from "@/lib/ai-router";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  route?: RouteResult;
  isImage?: boolean;
  isVideo?: boolean;
  fallbackUsed?: boolean;
  isLoading?: boolean;
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) return;
    let i = 0;
    setDisplayed("");
    setDone(false);
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 8);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className={!done ? "typewriter-cursor" : ""}>
      {displayed}
    </span>
  );
}

export default function ChatMessage({ role, content, route, isImage, isVideo, fallbackUsed, isLoading }: ChatMessageProps) {
  if (role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end mb-4"
      >
        <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-primary/20 border border-primary/30 px-4 py-3">
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start mb-4"
    >
      <div className="max-w-[85%]">
        {route && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 mb-2"
          >
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium glass border-primary/20">
              <span>{route.icon}</span>
              <span className="gradient-text font-semibold">{route.label}</span>
              <span className="text-muted-foreground">— {route.reason}</span>
            </span>
            {fallbackUsed && (
              <span className="text-xs text-yellow-500/80 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                🔄 Switched to backup
              </span>
            )}
          </motion.div>
        )}

        <div className="glass-strong rounded-2xl rounded-bl-sm px-4 py-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full"
              />
              AI thinking...
            </div>
          ) : isImage ? (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={content}
              alt="AI Generated"
              className="rounded-lg max-w-full"
              loading="lazy"
            />
          ) : isVideo ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">🎬 Video generated:</p>
              <video src={content} controls className="rounded-lg max-w-full" />
            </div>
          ) : (
            <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
              <TypewriterText text={content} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
