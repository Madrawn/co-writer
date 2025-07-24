// azureService.ts

import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { createSseStream } from "@azure/core-sse";
import type { ChatMessage, MarkdownCellData } from '../types'; // Assuming you have a ChatMessage type
import { buildPrompt } from '../lib/promptBuilder'; // Assuming you have a prompt builder



const options = { apiVersion: "2024-12-01-preview" };
export const models = {
    "DeepSeek-R1-0528": { client: () => ModelClient(endpoint, new AzureKeyCredential(apiKey), { apiVersion: "2024-05-01-preview" }) },
    "gpt-4.1": { client: () => ModelClient(endpoint_oa + "/deployments/gpt-4.1/", new AzureKeyCredential(apiKey), options) },
    "o4-mini": { client: () => ModelClient(endpoint_oa + "/deployments/o4-mini/", new AzureKeyCredential(apiKey), options) }
};

if (!process.env.AZURE_API_KEY || !process.env.AZURE_ENDPOINT || !process.env.AZURE_OPENAI_ENDPOINT) {
    throw new Error("AZURE_API_KEY, AZURE_ENDPOINT, and AZURE_OPENAI_ENDPOINT environment variables must be set.");
}
const endpoint = process.env.AZURE_ENDPOINT;
const endpoint_oa = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_API_KEY;
export const streamChatResponse = async (
    historyWithNewMessage: ChatMessage[],
    cells: MarkdownCellData[],
    feedback: string | null,
    modelName: keyof typeof models
): Promise<AsyncGenerator<{ text: string | undefined }>> => {
    const client = models[modelName].client();

    const { contents, systemInstruction } = buildPrompt(historyWithNewMessage, cells, feedback);
    // ...existing code...
    const azureMessages = [
        { role: "system", content: systemInstruction },
        ...contents.map(item => ({ role: item.role == "model" ? "assistant" : item.role, content: item.parts[0].text })),
    ];

    try {
        const response = await client.path("/chat/completions").post({
            body: {
                messages: azureMessages,
                max_tokens: 32768, // Or adjust as needed
                model: modelName,
                stream: true,
            }
        }).asBrowserStream();

        const stream = response.body;

        if (!stream) {
            throw new Error("The response stream is undefined");
        }

        if (response.status !== "200") {
            throw new Error(`Failed to get chat completions, HTTP operation failed with ${response.status} code`);
        }

        const sseStream = createSseStream(stream);

        async function* generateText() {
            try {
                for await (const event of sseStream) {
                    if (event.data === '[DONE]') {
                        sseStream.cancel('Stream completed').catch(err => console.error("Error canceling stream:", err)); // Cancel the stream
                        return;
                    }
                    for (const choice of (JSON.parse(event.data)).choices) {
                        yield { text: choice.delta?.content ?? "" };
                    }
                }
            } catch (error) {
                console.error("Error in generateText:", error);
            }
        }

        return generateText();
    } catch (e) {
        console.error("Error calling Azure AI:", e);
        throw new Error("Failed to get response from Azure AI.");
    }
};