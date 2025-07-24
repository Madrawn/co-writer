

import { GoogleGenAI } from "@google/genai";
import type { ChatMessage, MarkdownCellData } from '../types';
import { buildPrompt } from '../lib/promptBuilder';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


export const streamChatResponse = async (
    historyWithNewMessage: ChatMessage[],
    cells: MarkdownCellData[],
    feedback: string | null
) => {
    const { contents, systemInstruction } = buildPrompt(historyWithNewMessage, cells, feedback);
    try {
        const result = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction,
            }
        });
        return result;
    } catch (e) {
        console.error("Error calling Gemini API:", e);
        throw new Error("Failed to get response from Gemini.");
    }
};