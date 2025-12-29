
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * VibeStream AI Core: Analyzing the frequency of digital signals.
 */
export const analyzeSignal = async (content: string, author: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Perform a "Vibe Check" on the following social media post by ${author}. 
      Provide a brief (max 2 sentences), futuristic, and highly insightful analysis of the underlying sentiment and potential resonance on the 2026 digital grid. 
      Format the response as a single concise technical insight.
      
      Content: "${content}"`,
      config: {
        systemInstruction: "You are the VibeStream Grid AI. You speak in a futuristic, tech-noir tone. You are analytical, helpful, and concise.",
        temperature: 0.7,
        topP: 0.9,
      },
    });
    return response.text || "Signal analysis failed: Anomaly detected in neural buffer.";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "Neural link unstable. Unable to decipher signal resonance.";
  }
};

/**
 * Generate Smart Replies based on recent neural exchange.
 */
export const generateSmartReplies = async (messages: { sender: string, text: string }[]) => {
  try {
    const thread = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on the following short chat thread, generate 3 distinct, concise, and futuristic "Neural Pulses" (smart replies) that the current user could send. 
      Keep them under 6 words each. Return as a plain comma-separated list.
      
      Thread:
      ${thread}`,
      config: {
        systemInstruction: "You are an AI assistant for a high-fidelity 2026 social interface. Your suggestions should be helpful, empathetic, and slightly futuristic in tone.",
        temperature: 0.8,
      },
    });
    
    const text = response.text || "";
    return text.split(',').map(s => s.trim()).filter(s => s.length > 0).slice(0, 3);
  } catch (error) {
    console.error("Smart Reply Error:", error);
    return ["Acknowledged.", "Syncing...", "Confirmed."];
  }
};
