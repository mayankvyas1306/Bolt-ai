// app/api/gen-ai-code/route.js
import { GenAiCode } from "@/configs/AiModel";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;
    if (!prompt) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    // Await the AI client call
    const result = await GenAiCode.sendMessage(prompt);
    if (!result?.response) {
      console.error("gen-ai-code: AI client returned no response object", result);
      return NextResponse.json({ error: "AI client returned no response" }, { status: 500 });
    }

    const respText = await result.response.text();

    // Defensive parse: try JSON, otherwise return raw text
    try {
      const parsed = JSON.parse(respText);
      return NextResponse.json(parsed);
    } catch (e) {
      // Not JSON — return wrapped text
      return NextResponse.json({ text: respText });
    }
  } catch (e) {
    console.error("Code generation error (gen-ai-code):", e);
    // include message in response for easier client debugging
    return NextResponse.json({ error: "Code generation failed", detail: e?.message ?? String(e) }, { status: 500 });
  }
}
