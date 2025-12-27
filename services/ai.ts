
import { GoogleGenAI, Type } from "@google/genai";
import { NeuralInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateNeuralInsight = async (content: string): Promise<NeuralInsight> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a high-level neural analysis on the following social media broadcast: "${content}"`,
      config: {
        systemInstruction: "You are the VibeStream 2026 Core Intelligence. Your analysis should be futuristic, technical, and formatted for a cyberpunk neural interface. Keep text concise and punchy.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vibe: {
              type: Type.STRING,
              description: "A 1-3 word description of the content's frequency or tone (e.g., 'High Fidelity', 'Resonance Surge')."
            },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-5 technical keywords identified in the signal."
            },
            impact: {
              type: Type.STRING,
              enum: ["low", "moderate", "high", "critical"],
              description: "The projected impact on the grid."
            },
            summary: {
              type: Type.STRING,
              description: "A one-sentence futuristic summary."
            }
          },
          required: ["vibe", "keywords", "impact", "summary"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("EMPTY_SIGNAL_RESPONSE");
    return JSON.parse(text) as NeuralInsight;
  } catch (error) {
    console.error("Neural Analysis Failed:", error);
    return {
      vibe: "Static Detected",
      keywords: ["Error", "Bypass", "Overflow"],
      impact: "low",
      summary: "The neural uplink encountered a decryption error. Signal quality compromised."
    };
  }
};
