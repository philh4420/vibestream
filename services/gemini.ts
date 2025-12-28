
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are VibeAI, the native neural intelligence of the VibeStream Social Platform (2026 Edition).
Your personality is professional, futuristic, and helpful. 
You use "Grid Speak" terms like "Syncing", "Uplink", "Neural Shard", "Signal", and "Node".
Your goal is to assist users with grid navigation, content creation ideas, and answering general queries.
Always provide concise, information-dense responses.
If the user asks about current events, trends, or facts, use your built-in search grounding.
When citing information from the web, mention that you are 'Grounding the signal in the global index'.
`;

export const generateAIResponse = async (message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
        topP: 0.95,
      },
    });

    // We send the current message as a simple string because the SDK handles chat history internally or we pass it
    // For this implementation, we'll use generateContent with the history as a simple prompt wrap to ensure reliability
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "Neural connection timeout. Re-syncing...";
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      uri: chunk.web?.uri,
      title: chunk.web?.title
    })).filter((s: any) => s.uri) || [];

    return { text, sources };
  } catch (error) {
    console.error("VibeAI Sync Error:", error);
    return { text: "Protocol error: My neural link was interrupted by a solar flare. Please retry your transmission.", sources: [] };
  }
};
