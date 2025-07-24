// azureService.ts

import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { createSseStream } from "@azure/core-sse";
import type { ChatMessage, MarkdownCellData } from '../types'; // Assuming you have a ChatMessage type
import { buildPrompt } from '../lib/promptBuilder'; // Assuming you have a prompt builder

if (!process.env.AZURE_API_KEY || !process.env.AZURE_ENDPOINT || !process.env.AZURE_MODEL_NAME) {
    throw new Error("AZURE_API_KEY, AZURE_ENDPOINT, and AZURE_MODEL_NAME environment variables must be set.");
}

const endpoint = process.env.AZURE_ENDPOINT;
const modelName = process.env.AZURE_MODEL_NAME;
const apiKey = process.env.AZURE_API_KEY;

// Use the factory function to create the client
const client = ModelClient(endpoint, new AzureKeyCredential(apiKey));

export const streamChatResponse = async (
    historyWithNewMessage: ChatMessage[],
    cells: MarkdownCellData[],
    feedback: string | null
): Promise<AsyncGenerator<{ text: string | undefined }>> => { // Modified return type to match StreamChatFn
    const { contents, systemInstruction } = buildPrompt(historyWithNewMessage, cells, feedback);

    // Convert the 'contents' (which I assume is an array of messages)
    // into the format Azure expects.  Crucially, we need to combine
    // the system instruction into the messages.
    const azureMessages = [
        { role: "system", content: systemInstruction },
        ...contents.map(item => ({ role: item.role == "model" ? "assistant" : item.role, content: item.parts[0].text })),
    ];

    try {
        const response = await client.path("/chat/completions").post({
            body: {
                messages: azureMessages,
                max_tokens: 100048, // Or adjust as needed
                model: modelName,
                stream: true
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