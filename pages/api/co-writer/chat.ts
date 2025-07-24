// pages/api/co-writer/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { createSseStream } from "@azure/core-sse";
import { buildPrompt } from '../../../lib/promptBuilder';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
        historyWithNewMessage,
        cells,
        feedback,
        modelName
    } = req.body;

    // Validate environment variables
    const endpoint = process.env.AZURE_ENDPOINT;
    const endpoint_oa = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_API_KEY;

    if (!apiKey || !endpoint || !endpoint_oa) {
        return res.status(500).json({ error: 'Azure configuration missing' });
    }

    // Initialize Azure client
    const options = { apiVersion: "2024-12-01-preview" };
    const models = {
        "DeepSeek-R1-0528": ModelClient(endpoint, new AzureKeyCredential(apiKey), { apiVersion: "2024-05-01-preview" }),
        "gpt-4.1": ModelClient(endpoint_oa + "/deployments/gpt-4.1/", new AzureKeyCredential(apiKey), options),
        "o4-mini": ModelClient(endpoint_oa + "/deployments/o4-mini/", new AzureKeyCredential(apiKey), options)
    };

    try {
        const client = models[modelName as keyof typeof models];
        const { contents, systemInstruction } = buildPrompt(historyWithNewMessage, cells, feedback);

        const azureMessages = [
            { role: "system", content: systemInstruction },
            ...contents.map(item => ({
                role: item.role === "model" ? "assistant" : item.role,
                content: item.parts[0].text
            })),
        ];

        const response = await client.path("/chat/completions").post({
            body: {
                messages: azureMessages,
                max_tokens: 32768,
                model: modelName,
                stream: true,
            }
        }).asBrowserStream();

        // Set up streaming response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const stream = response.body;
        if (!stream) {
            throw new Error("Response stream is undefined");
        }

        const sseStream = createSseStream(stream);
        for await (const event of sseStream) {
            if (event.data === '[DONE]') break;
            const data = JSON.parse(event.data);
            for (const choice of data.choices) {
                res.write(JSON.stringify({ text: choice.delta?.content ?? "" }) + '\n');
            }
        }
    } catch (error) {
        console.error("Azure API error:", error);
        res.status(500).json({ error: 'Azure API error' });
    } finally {
        res.end();
    }
}