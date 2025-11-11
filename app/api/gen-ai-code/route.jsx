// app/api/gen-ai-code/route.js
import { NextResponse } from "next/server";
import { GenAiCode } from "@/configs/AiModel";
import axios from "axios";

const HF_MODEL = process.env.HF_MODEL || "gpt2";
const HF_TOKEN = process.env.HF_API_KEY || null;

async function callGeminiCode(prompt) {
  if (!GenAiCode) throw new Error("Gemini code model not configured");
  const result = await GenAiCode.sendMessage(prompt);
  if (!result?.response) throw new Error("GenAiCode returned no response object");
  const text = await result.response.text();
  return text;
}

async function callHuggingFace(prompt) {
  if (!HF_TOKEN) throw new Error("HF_API_KEY not configured for fallback");
  const url = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;
  const resp = await axios.post(url, { inputs: prompt }, {
    headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
    timeout: 60000,
  });
  const data = resp.data;
  if (Array.isArray(data)) return data[0]?.generated_text || JSON.stringify(data);
  if (typeof data === "string") return data;
  if (data?.generated_text) return data.generated_text;
  return JSON.stringify(data);
}

function extractJsonFromText(text) {
  if (!text || typeof text !== "string") return null;
  try { return JSON.parse(text); } catch (e) {}
  const fencedJson = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fencedJson && fencedJson[1]) {
    try { return JSON.parse(fencedJson[1]); } catch (e) {}
  }
  const firstBrace = text.indexOf("{");
  if (firstBrace !== -1) {
    const candidate = text.slice(firstBrace);
    let depth = 0;
    let endIndex = -1;
    for (let i = 0; i < candidate.length; i++) {
      if (candidate[i] === "{") depth++;
      else if (candidate[i] === "}") {
        depth--;
        if (depth === 0) { endIndex = i; break; }
      }
    }
    if (endIndex !== -1) {
      const jsonStr = candidate.slice(0, endIndex + 1);
      try { return JSON.parse(jsonStr); } catch (e) {}
    }
  }
  return null;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;
    if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

    // Try Gemini
    if (GenAiCode) {
      try {
        const respText = await callGeminiCode(prompt);
        console.log("GenAiCode raw response:", respText.slice(0, 2000));
        const parsed = extractJsonFromText(respText);
        return NextResponse.json({ rawText: respText, parsed, source: "gemini" }, { status: 200 });
      } catch (gErr) {
        console.error("GenAiCode (Gemini) failed:", gErr);
      }
    } else {
      console.log("GenAiCode not configured; skipping Gemini generation.");
    }

    // Fallback HF
    if (HF_TOKEN) {
      try {
        const hfText = await callHuggingFace(prompt);
        console.log("HF fallback raw text:", hfText.slice(0, 2000));
        const parsed = extractJsonFromText(hfText);
        return NextResponse.json({ rawText: hfText, parsed, source: "huggingface" }, { status: 200 });
      } catch (hfErr) {
        console.error("Hugging Face fallback failed:", hfErr);
      }
    }

    // Final fallback: minimal structure for CodeView
    const fallback = {
      projectTitle: "Mock Project (fallback)",
      explanation: "AI unavailable — this is a fallback example.",
      files: { "/App.js": { code: "export default function App(){ return <div>Fallback</div>; }" } },
      generatedFiles: ["/App.js"]
    };
    return NextResponse.json({ rawText: JSON.stringify(fallback), parsed: fallback, source: "fallback" }, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in gen-ai-code route:", err);
    return NextResponse.json({ error: "Code generation failed", detail: err?.message || String(err) }, { status: 500 });
  }
}
