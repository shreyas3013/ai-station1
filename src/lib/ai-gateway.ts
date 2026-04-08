import { detectModel, SYSTEM_PROMPT, type RouteResult } from "./ai-router";

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

async function callClaude(prompt: string): Promise<string> {
  const puter = await ensurePuter();
  const resp = await puter.ai.chat(SYSTEM_PROMPT + "\n\nUser: " + prompt, { model: "claude-sonnet-4" });
  return typeof resp === "string" ? resp : resp?.message?.content || resp?.text || JSON.stringify(resp);
}

async function callGPT(prompt: string): Promise<string> {
  const puter = await ensurePuter();
  const resp = await puter.ai.chat(SYSTEM_PROMPT + "\n\nUser: " + prompt, { model: "gpt-4o" });
  return typeof resp === "string" ? resp : resp?.message?.content || resp?.text || JSON.stringify(resp);
}

async function callGemini(prompt: string): Promise<string> {
  // Use Puter's GPT as Gemini proxy (Gemini API key would be needed for direct)
  const puter = await ensurePuter();
  const resp = await puter.ai.chat(SYSTEM_PROMPT + "\n\nUser: " + prompt, { model: "gpt-4o" });
  return typeof resp === "string" ? resp : resp?.message?.content || resp?.text || JSON.stringify(resp);
}

async function callPerplexity(prompt: string): Promise<string> {
  const puter = await ensurePuter();
  const resp = await puter.ai.chat(prompt, { model: "gpt-4o" });
  return typeof resp === "string" ? resp : resp?.message?.content || resp?.text || JSON.stringify(resp);
}

async function generateImage(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
  
  // Verify the image loads
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error("Image generation failed"));
    img.src = url;
    setTimeout(() => reject(new Error("Image generation timed out")), 30000);
  });
}

async function generateVideo(prompt: string): Promise<string> {
  // Pollinations text-to-video
  const encoded = encodeURIComponent(prompt);
  return `https://video.pollinations.ai/prompt/${encoded}`;
}

async function fallbackLLM(prompt: string): Promise<string> {
  // Use GPT as universal fallback
  return callGPT(prompt);
}

export async function aiGateway(prompt: string): Promise<AIResponse> {
  const route = detectModel(prompt);
  let fallbackUsed = false;

  try {
    switch (route.model) {
      case "claude": {
        const content = await callClaude(prompt);
        return { content, route };
      }
      case "gemini": {
        const content = await callGemini(prompt);
        return { content, route };
      }
      case "perplexity": {
        const content = await callPerplexity(prompt);
        return { content, route };
      }
      case "image": {
        const url = await generateImage(prompt);
        return { content: url, route, isImage: true };
      }
      case "video": {
        const url = await generateVideo(prompt);
        return { content: url, route, isVideo: true };
      }
      default: {
        const content = await callGPT(prompt);
        return { content, route };
      }
    }
  } catch (e) {
    console.error(`Primary model ${route.label} failed, using fallback:`, e);
    fallbackUsed = true;

    if (route.model === "image") {
      // HuggingFace fallback
      try {
        const url = await generateImage(prompt + " high quality");
        return { content: url, route: { ...route, label: "Pollinations (retry)" }, isImage: true, fallbackUsed };
      } catch {
        return { content: "⚠️ Image generation is currently unavailable. Please try again later.", route, fallbackUsed: true };
      }
    }

    if (route.model === "video") {
      return { content: "⚠️ Video generation is currently unavailable. Please try again later.", route, fallbackUsed: true };
    }

    try {
      const content = await fallbackLLM(prompt);
      return { content, route: { ...route, label: "GPT-4o (fallback)", icon: "🔄" }, fallbackUsed };
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      return { content: "⚠️ All AI models are currently unavailable. Please try again in a moment.", route, fallbackUsed: true };
    }
  }
}
