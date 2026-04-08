import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center py-16 relative"
    >
      {/* Glow orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: "var(--gradient-primary)" }} />

      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-muted-foreground mb-6"
      >
        <Zap className="w-3.5 h-3.5 text-primary" />
        Multi-Model AI Orchestration
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-5xl md:text-7xl font-black tracking-tight mb-4"
      >
        <span className="gradient-text">AI STATION</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-muted-foreground text-lg md:text-xl font-light max-w-md mx-auto"
      >
        Every Query. The Right Intelligence.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex flex-wrap justify-center gap-3 mt-8"
      >
        {["Claude", "GPT-4o", "Gemini", "Perplexity", "Pollinations"].map((m, i) => (
          <motion.span
            key={m}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            className="px-3 py-1 rounded-full text-xs glass text-muted-foreground"
          >
            {m}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}
