export type ModelType = "claude" | "gpt" | "gemini" | "groq" | "image" | "video" | "perplexity";

export interface RouteResult {
  model: ModelType;
  label: string;
  reason: string;
  icon: string;
}

const SYSTEM_PROMPT = `You are AI STATION.
Speak naturally like ChatGPT.
Avoid robotic tone.
Give structured, helpful answers.
Be clear, concise, and human-like.`;

export const MODEL_OPTIONS: Array<{ value: ModelType | "auto"; label: string; icon: string }> = [
  { value: "auto", label: "Auto", icon: "🧠" },
  { value: "claude", label: "Claude", icon: "⚡" },
  { value: "gpt", label: "GPT-4o", icon: "🤖" },
  { value: "gemini", label: "Gemini", icon: "✨" },
  { value: "groq", label: "Groq", icon: "⚡" },
  { value: "perplexity", label: "Perplexity", icon: "🔍" },
  { value: "image", label: "Image Gen", icon: "🎨" },
  { value: "video", label: "Video Gen", icon: "🎬" },
];

export function detectModel(input: string): RouteResult {
  const text = input.toLowerCase();

  if (/(video|animate|clip|movie)/.test(text)) {
    return { model: "video", label: "Pollinations Video", reason: "Video generation detected", icon: "🎬" };
  }
  if (/(image|draw|photo|art|picture|illustration|generate.*image|create.*image)/.test(text)) {
    return { model: "image", label: "Pollinations", reason: "Image generation detected", icon: "🎨" };
  }
  if (/(code|debug|error|api|bug|function|program|script|html|css|javascript|python|react)/.test(text)) {
    return { model: "claude", label: "Claude Sonnet", reason: "Coding task detected", icon: "⚡" };
  }
  if (/(news|latest|today|trending|current|recent|search|find|look up)/.test(text)) {
    return { model: "perplexity", label: "Perplexity", reason: "Real-time search detected", icon: "🔍" };
  }
  if (/(write|essay|blog|story|email|letter|article|summarize|translate)/.test(text)) {
    return { model: "gemini", label: "Gemini", reason: "Writing task detected", icon: "✨" };
  }

  return { model: "gpt", label: "GPT-4o", reason: "General intelligence", icon: "🤖" };
}

export { SYSTEM_PROMPT };
