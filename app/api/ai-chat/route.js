// app/api/ai-chat/route.js
import { NextResponse } from "next/server";
import { chatSession } from "@/configs/AiModel";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req) {
  // try to get session, but don't fail hard if absent (dev fallback)
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (e) {
    console.warn("ai-chat: getServerSession error (continuing anonymously):", e);
    session = null;
  }

  // If you want to force auth in production, replace the following block with a 401 return
  // if (!session) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { prompt } = await req.json();
  if (!prompt) {
    return NextResponse.json({ error: "Prompt required" }, { status: 400 });
  }

  try {
    // Provide some metadata when anonymous so you can track usage
    const meta = session ? { user: session.user } : { anonymous: true };
    // Make sure to await the AI client call
    const result = await chatSession.sendMessage(prompt);
    const AIResp = await result.response.text();

    return NextResponse.json({ result: AIResp });
  } catch (e) {
    console.error("AI Error (ai-chat):", e);
    return NextResponse.json({ error: "Failed to generate response", detail: e.message }, { status: 500 });
  }
}
