
import { GoogleGenAI, Type } from "@google/genai";
import { NeuralInsight } from "../types";

/**
 * VibeStream Neural Analysis Engine
 * Strictly uses process.env.API_KEY as per core requirements.
 */
export const generateNeuralInsight = async (content: string): Promise<NeuralInsight> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      throw new Error("API_KEY_NOT_SYNCHRONIZED");
    }

    const ai = new GoogleGenAI({ apiKey });
    
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
  } catch (error: any) {
    console.error("Neural Analysis Failed:", error);
    return {
      vibe: "Static Detected",
      keywords: ["Error", "Bypass", "Overflow"],
      impact: "low",
      summary: "The neural uplink encountered a decryption error. Signal quality compromised."
    };
  }
};

/**
 * Polish Signal: Refines draft text to be more engaging and futuristic.
 */
export const polishSignal = async (content: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Refine this social media post to be more high-quality, engaging, and have a futuristic '2026 digital' aesthetic. Maintain the original meaning but improve the impact. Content: "${content}"`,
      config: {
        systemInstruction: "You are a professional social media engineer. Rewrite the input to be punchy, clear, and impactful for a high-tech audience. No hashtags unless already present."
      }
    });
    return response.text || content;
  } catch (error) {
    console.error("Signal Polish Failed:", error);
    return content;
  }
};

/**
 * Generate Vision Fragment: Creates a base64 image from a text prompt.
 */
export const generateVisionFragment = async (prompt: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Generate a high-fidelity visual fragment illustrating: ${prompt}. Aesthetic: Futuristic, cyberpunk, 2026 social media style.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Vision Generation Failed:", error);
    return null;
  }
};
