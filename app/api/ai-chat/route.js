// app/api/ai-chat/route.js
import { NextResponse } from "next/server";
import { chatSession } from "@/configs/AiModel";

export async function POST(req) {
  try {
    console.log("🔵 AI Chat route called");
    
    const body = await req.json();
    const { prompt } = body;
    
    if (!prompt) {
      console.error("❌ No prompt provided");
      return NextResponse.json(
        { error: "Prompt required" }, 
        { status: 400 }
      );
    }

    console.log("📝 Prompt length:", prompt.length);

    // Check if chatSession is available
    if (!chatSession) {
      console.error("❌ AI service not configured - chatSession is null");
      return NextResponse.json(
        { 
          error: "AI service not configured", 
          detail: "NEXT_PUBLIC_GEMINI_API_KEY is missing or invalid. Please check your environment variables." 
        }, 
        { status: 500 }
      );
    }

    console.log("✅ ChatSession available, sending message...");

    // Send message to AI with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 30000)
    );

    const aiPromise = chatSession.sendMessage(prompt);

    const result = await Promise.race([aiPromise, timeoutPromise]);
    
    if (!result?.response) {
      console.error("❌ No response from AI");
      return NextResponse.json(
        { error: "No response from AI service" },
        { status: 500 }
      );
    }

    const AIResp = await result.response.text();
    console.log("✅ AI response received, length:", AIResp.length);

    return NextResponse.json({ result: AIResp });
    
  } catch (error) {
    console.error("❌ AI Error (ai-chat):", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    
    return NextResponse.json(
      { 
        error: "Failed to generate response", 
        detail: error?.message || "An unknown error occurred. Check server logs." 
      }, 
      { status: 500 }
    );
  }
}