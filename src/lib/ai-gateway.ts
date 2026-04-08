import { detectModel, SYSTEM_PROMPT, type RouteResult, type ModelType } from "./ai-router";

declare global {
  interface Window {
    puter?: any;
  }
}

export interface AIResponse {
  content: string;
  route: RouteResult;
  isImage?: boolean;
  isVideo?: boolean;
  fallbackUsed?: boolean;
}

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

// Global conversation memory
let conversationHistory: HistoryMessage[] = [];
let lastModelUsed: RouteResult | null = null;

export function getConversationHistory() {
  return conversationHistory;
}

export function clearConversationHistory() {
  conversationHistory = [];
  lastModelUsed = null;
}

function addToHistory(role: "user" | "assistant", content: string) {
  conversationHistory.push({ role, content });
  // Keep last 20 messages to avoid token limits
  if (conversationHistory.length > 20) {
    conversationHistory = conversationHistory.slice(-20);
  }
}

function buildContextPrompt(prompt: string): string {
  if (conversationHistory.length === 0) return prompt;
  const history = conversationHistory
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");
  return `Previous conversation:\n${history}\n\nUser: ${prompt}`;
}

async function ensurePuter(): Promise<any> {
  if (window.puter) return window.puter;
  return new Promise((resolve, reject) => {
    const check = setInterval(() => {
      if (window.puter) {
        clearInterval(check);
        resolve(window.puter);
      }
    }, 100);
    setTimeout(() => { clearInterval(check); reject(new Error("Puter.js failed to load")); }, 10000);
  });
}

function extractText(resp: unknown): string {
  if (resp == null) return "";
  if (typeof resp === "string" || typeof resp === "number" || typeof resp === "boolean") {
    return String(resp);
  }
  if (Array.isArray(resp)) {
    return resp.map((item) => extractText(item)).filter(Boolean).join("\n");
  }
  if (typeof resp === "object") {
    const value = resp as {
      type?: string;
      text?: unknown;
      content?: unknown;
      parts?: unknown;
      message?: { content?: unknown };
    };
    if (value.type === "text" && value.text !== undefined) return extractText(value.text);
    if (value.text !== undefined) return extractText(value.text);
    if (value.message?.content !== undefined) return extractText(value.message.content);
    if (value.content !== undefined) return extractText(value.content);
    if (value.parts !== undefined) return extractText(value.parts);
  }
  return JSON.stringify(resp);
}

async function callClaude(prompt: string): Promise<string> {
  const puter = await ensurePuter();
  const contextPrompt = buildContextPrompt(prompt);
  const resp = await puter.ai.chat(SYSTEM_PROMPT + "\n\n" + contextPrompt, { model: "claude-sonnet-4" });
  return extractText(resp);
}

async function callGPT(prompt: string): Promise<string> {
  const puter = await ensurePuter();
  const contextPrompt = buildContextPrompt(prompt);
  const resp = await puter.ai.chat(SYSTEM_PROMPT + "\n\n" + contextPrompt, { model: "gpt-4o" });
  return extractText(resp);
}

async function callGemini(prompt: string): Promise<string> {
  const puter = await ensurePuter();
  const contextPrompt = buildContextPrompt(prompt);
  const resp = await puter.ai.chat(SYSTEM_PROMPT + "\n\n" + contextPrompt, { model: "gpt-4o" });
  return extractText(resp);
}

async function callPerplexity(prompt: string): Promise<string> {
  const puter = await ensurePuter();
  const contextPrompt = buildContextPrompt(prompt);
  const resp = await puter.ai.chat(contextPrompt, { model: "gpt-4o" });
  return extractText(resp);
}

async function callGroq(prompt: string): Promise<string> {
  const puter = await ensurePuter();
  const contextPrompt = buildContextPrompt(prompt);
  const resp = await puter.ai.chat(SYSTEM_PROMPT + "\n\n" + contextPrompt, { model: "gpt-4o" });
  return extractText(resp);
}

async function generateImage(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error("Image generation failed"));
    img.src = url;
    setTimeout(() => reject(new Error("Image generation timed out")), 30000);
  });
}

async function generateVideo(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(prompt);
  return `https://video.pollinations.ai/prompt/${encoded}`;
}

// Fallback chains
const llmFallbackChain: Array<{ fn: (p: string) => Promise<string>; label: string; icon: string }> = [
  { fn: callGPT, label: "GPT-4o (fallback)", icon: "🔄" },
  { fn: callGemini, label: "Gemini (fallback)", icon: "🔄" },
  { fn: callGroq, label: "Groq (fallback)", icon: "🔄" },
];

async function fallbackLLM(prompt: string, skipIndex = -1): Promise<{ content: string; label: string; icon: string }> {
  for (let i = 0; i < llmFallbackChain.length; i++) {
    if (i === skipIndex) continue;
    try {
      console.log(`Fallback: trying ${llmFallbackChain[i].label}`);
      const content = await llmFallbackChain[i].fn(prompt);
      return { content, label: llmFallbackChain[i].label, icon: llmFallbackChain[i].icon };
    } catch (e) {
      console.error(`Fallback ${llmFallbackChain[i].label} failed:`, e);
    }
  }
  throw new Error("All fallback models failed");
}

export async function aiGateway(prompt: string, forceModel?: ModelType | "auto"): Promise<AIResponse> {
  // Add user message to history
  addToHistory("user", prompt);

  // Determine route
  let route: RouteResult;

  if (forceModel && forceModel !== "auto") {
    // Manual model selection — bypass router
    const modelLabels: Record<string, RouteResult> = {
      claude: { model: "claude", label: "Claude Sonnet", reason: "Manual selection", icon: "⚡" },
      gpt: { model: "gpt", label: "GPT-4o", reason: "Manual selection", icon: "🤖" },
      gemini: { model: "gemini", label: "Gemini", reason: "Manual selection", icon: "✨" },
      groq: { model: "groq", label: "Groq", reason: "Manual selection", icon: "⚡" },
      perplexity: { model: "perplexity", label: "Perplexity", reason: "Manual selection", icon: "🔍" },
      image: { model: "image", label: "Pollinations", reason: "Manual selection", icon: "🎨" },
      video: { model: "video", label: "Pollinations Video", reason: "Manual selection", icon: "🎬" },
    };
    route = modelLabels[forceModel] || detectModel(prompt);
  } else if (prompt.length < 15 && lastModelUsed && !/(image|draw|photo|video|animate)/.test(prompt.toLowerCase())) {
    // Short message like "go ahead" — reuse last model
    route = { ...lastModelUsed, reason: "Continuing conversation" };
    console.log("Short message detected, reusing last model:", route.label);
  } else {
    route = detectModel(prompt);
  }

  console.log("Selected model:", route.label, "| Reason:", route.reason);
  console.log("History length:", conversationHistory.length);

  let fallbackUsed = false;

  try {
    let content: string;

    switch (route.model) {
      case "claude":
        content = await callClaude(prompt);
        break;
      case "gemini":
        content = await callGemini(prompt);
        break;
      case "groq":
        content = await callGroq(prompt);
        break;
      case "perplexity":
        content = await callPerplexity(prompt);
        break;
      case "image": {
        const url = await generateImage(prompt);
        addToHistory("assistant", `[Generated image for: ${prompt}]`);
        lastModelUsed = route;
        return { content: url, route, isImage: true };
      }
      case "video": {
        const url = await generateVideo(prompt);
        addToHistory("assistant", `[Generated video for: ${prompt}]`);
        lastModelUsed = route;
        return { content: url, route, isVideo: true };
      }
      default:
        content = await callGPT(prompt);
        break;
    }

    addToHistory("assistant", content);
    lastModelUsed = route;
    return { content, route };
  } catch (e) {
    console.error(`Primary model ${route.label} failed, using fallback:`, e);
    fallbackUsed = true;

    if (route.model === "image") {
      try {
        const url = await generateImage(prompt + " high quality");
        addToHistory("assistant", `[Generated image for: ${prompt}]`);
        return { content: url, route: { ...route, label: "Pollinations (retry)" }, isImage: true, fallbackUsed };
      } catch {
        return { content: "⚠️ Image generation is currently unavailable. Please try again later.", route, fallbackUsed: true };
      }
    }

    if (route.model === "video") {
      return { content: "⚠️ Video generation is currently unavailable. Please try again later.", route, fallbackUsed: true };
    }

    try {
      const fallback = await fallbackLLM(prompt);
      console.log("Fallback triggered:", fallback.label);
      addToHistory("assistant", fallback.content);
      lastModelUsed = { ...route, label: fallback.label, icon: fallback.icon };
      return { content: fallback.content, route: { ...route, label: fallback.label, icon: fallback.icon }, fallbackUsed };
    } catch (fallbackError) {
      console.error("All fallbacks failed:", fallbackError);
      return { content: "⚠️ All AI models are currently unavailable. Please try again in a moment.", route, fallbackUsed: true };
    }
  }
}
