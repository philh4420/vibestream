
import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Signal Intelligence: Generates smart reply suggestions based on chat context.
 */
export const generateSmartReplies = async (messages: Message[]): Promise<string[]> => {
  try {
    const context = messages.slice(-5).map(m => `${m.senderId === 'me' ? 'User' : 'Peer'}: ${m.text}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 3 short, professional, and slightly futuristic social media chat replies for the following conversation context. Keep them under 10 words each. Format as a simple comma-separated list.
      
      Context:
      ${context}`,
      config: {
        systemInstruction: "You are an AI assistant for VibeStream, a 2026 social neural interface. Your tone is helpful, concise, and technically sophisticated.",
        temperature: 0.7,
      },
    });

    const text = response.text || "";
    return text.split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(s => s.length > 0).slice(0, 3);
  } catch (error) {
    console.error("AI Assistant Failure:", error);
    return [];
  }
};

/**
 * Hive Summary: Summarizes long cluster threads.
 */
export const summarizeClusterThread = async (messages: Message[]): Promise<string> => {
  try {
    const context = messages.map(m => `${m.senderId}: ${m.text}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a concise 1-sentence summary of the key discussion points in this chat history:
      
      ${context}`,
      config: {
        systemInstruction: "You are the VibeStream Hive Intelligence. Summarize group discussions precisely.",
        temperature: 0.3,
      },
    });

    return response.text || "No significant signal patterns detected for summary.";
  } catch (error) {
    return "Summary protocol offline.";
  }
};
