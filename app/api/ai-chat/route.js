// app/api/ai-chat/route.js
import { NextResponse } from "next/server";
import { chatSession } from "@/configs/AiModel";
import axios from "axios";

const HF_MODEL = process.env.HF_MODEL || "gpt2";
const HF_TOKEN = process.env.HF_API_KEY || null;

function buildPromptFromMessages(messages, maxMessages = 6) {
  // messages is expected to be array of {role, content}
  const slice = Array.isArray(messages) ? messages.slice(-maxMessages) : [];
  return slice.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
}

async function callGemini(prompt) {
  if (!chatSession) throw new Error("Gemini not configured");
  const res = await chatSession.sendMessage(prompt);
  if (!res?.response) throw new Error("No response from Gemini");
  return await res.response.text();
}

async function callHuggingFace(prompt) {
  if (!HF_TOKEN) throw new Error("Hugging Face API key is not configured (HF_API_KEY)");
  const url = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
  const resp = await axios.post(url, { inputs: prompt }, {
    headers: { Authorization: `Bearer ${HF_TOKEN}` },
    timeout: 30000,
  });
  const data = resp.data;
  if (Array.isArray(data)) return data[0]?.generated_text || JSON.stringify(data);
  if (typeof data === "string") return data;
  if (data?.generated_text) return data.generated_text;
  return JSON.stringify(data);
}

function makeErrorResponse(message, status = 500, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { prompt, messages } = body || {};
    if (!prompt && !messages) return makeErrorResponse("Prompt or messages required", 400);

    // Build safe trimmed prompt. Prefer explicit 'prompt' if provided, else derive from messages
    const finalPrompt = prompt || buildPromptFromMessages(messages, 6);

    // 1) Try Gemini if configured
    if (chatSession) {
      try {
        const out = await callGemini(finalPrompt);
        return NextResponse.json({ result: out, source: "gemini" }, { status: 200 });
      } catch (gemErr) {
        console.error("Gemini call failed:", gemErr);
        // If it's rate limit, log and continue to HF fallback
      }
    } else {
      console.log("Gemini not configured, skipping to fallback.");
    }

    // 2) Try Hugging Face fallback
    try {
      const hfOut = await callHuggingFace(finalPrompt);
      return NextResponse.json({ result: hfOut, source: "huggingface" }, { status: 200 });
    } catch (hfErr) {
      console.error("Hugging Face fallback failed:", hfErr);
      return makeErrorResponse("All AI providers failed. Check server logs.", 502, {
        providerError: hfErr?.response?.data || hfErr?.message,
      });
    }
  } catch (err) {
    console.error("Unexpected error in /api/ai-chat:", err);
    return makeErrorResponse(err?.message || "Unknown server error", 500, { stack: err?.stack });
  }
}
