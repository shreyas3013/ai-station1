import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, Loader2, Mic, MicOff } from "lucide-react";
import { MODEL_OPTIONS, type ModelType } from "@/lib/ai-router";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  selectedModel: ModelType | "auto";
  onModelChange: (model: ModelType | "auto") => void;
}

export default function ChatInput({ onSend, disabled, selectedModel, onModelChange }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [".txt", ".md", ".pdf"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedTypes.includes(ext)) {
      alert("Supported files: .txt, .md, .pdf");
      return;
    }

    if (ext === ".pdf") {
      setInput((prev) => prev + `\n[Uploaded PDF: ${file.name}]`);
      return;
    }

    const text = await file.text();
    setInput((prev) => prev + `\nUser uploaded file content (${file.name}):\n${text}`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");
      setInput(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl p-2 space-y-2"
    >
      {/* Model selector */}
      <div className="flex items-center gap-1.5 px-1 overflow-x-auto scrollbar-none">
        {MODEL_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onModelChange(opt.value)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedModel === opt.value
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="Upload file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".txt,.md,.pdf"
          className="hidden"
        />

        <button
          onClick={toggleVoiceInput}
          className={`p-2.5 rounded-xl transition-colors ${
            isListening
              ? "text-destructive bg-destructive/10 animate-pulse"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
          title={isListening ? "Stop listening" : "Voice input"}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {isListening && (
          <span className="text-xs text-destructive animate-pulse whitespace-nowrap">🎙️ Listening...</span>
        )}

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask anything... AI will route to the best model"
          rows={1}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none outline-none py-2.5 px-2 max-h-32"
          style={{ minHeight: "40px" }}
          disabled={disabled}
        />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-lg"
          style={{ boxShadow: input.trim() && !disabled ? "0 0 20px hsl(239 84% 67% / 0.4)" : "none" }}
        >
          {disabled ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </motion.button>
      </div>
    </motion.div>
  );
}
