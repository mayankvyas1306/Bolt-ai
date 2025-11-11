// configs/AiModel.jsx
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

// Server-only key
const apiKey = process.env.GEMINI_API_KEY || null;

if (!apiKey) {
  console.warn("⚠️ GEMINI_API_KEY not set. Gemini will be disabled and fallback providers will be used.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Chat config (shorter tokens)
const chatConfig = {
  temperature: 0.2,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 1024,
  responseMimeType: "text/plain",
};

// Code generation config (smaller but sufficient)
const codeConfig = {
  temperature: 0.2,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 4096,
  responseMimeType: "application/json",
};

let chatSession = null;
let GenAiCode = null;

try {
  if (genAI) {
    // Use a stable flash model; allow override via GEMINI_MODEL env var
    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const model = genAI.getGenerativeModel({ model: modelName, safetySettings });

    chatSession = model.startChat({
      generationConfig: chatConfig,
      history: [],
    });

    // A separate chat session for code generation
    const codeModel = genAI.getGenerativeModel({ model: modelName, safetySettings });
    GenAiCode = codeModel.startChat({
      generationConfig: codeConfig,
      // Do NOT preload model's JSON reply here; we'll send the code-generation prompt from the route.
      history: [],
    });
  }
} catch (err) {
  console.error("Error initializing Google Generative AI client:", err);
  chatSession = null;
  GenAiCode = null;
}

export { chatSession, GenAiCode };
