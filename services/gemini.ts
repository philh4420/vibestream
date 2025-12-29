
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes the resonance of a signal (message or post) using Gemini 3 Pro.
 */
export const analyzeSignal = async (content: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following social media signal for sentiment, tone, and key themes. Return a concise report in 3 bullets:
      Signal: "${content}"`,
      config: {
          systemInstruction: "You are the VibeStream AI Core. Provide technical, high-fidelity neural analysis of signals."
      }
    });
    return response.text;
  } catch (error) {
    console.error("Neural Analysis Failed", error);
    return "Analysis protocol interrupted: Handshake error.";
  }
};

/**
 * Generates smart insights for a conversation thread.
 */
export const analyzeConversation = async (messages: string[]) => {
  try {
    const thread = messages.join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze this neural communication thread and provide: 1. Sentiment Summary, 2. Current Conflict/Cooperation status, 3. Suggested Next Signal.
      Thread:
      ${thread}`,
      config: {
          systemInstruction: "You are a world-class AI comms analyst. Your tone is futuristic, professional, and slightly cyberpunk."
      }
    });
    return response.text;
  } catch (error) {
    console.error("Thread Analysis Failed", error);
    return "Failed to decrypt thread patterns.";
  }
};
