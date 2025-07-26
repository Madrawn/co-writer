// pages/api/co-writer/chat.ts
import type { NextApiResponse } from 'next';
import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { buildPrompt } from '../../../lib/promptBuilder';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';
import { NextRequest } from 'next/server';
export const runtime = 'edge'; // Enable Edge Runtime

export default async function handler(req: NextRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse the request body
        const requestBody = await req.json(); // Use req.json() to parse
        const {
            historyWithNewMessage,
            cells,
            feedback,
            modelName
        } = requestBody;


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

            const azureResponse = await client.path("/chat/completions").post({
                body: {
                    messages: azureMessages,
                    max_tokens: 32768,
                    model: modelName,
                    stream: true,
                }
            }).asBrowserStream();

            // Check if the response is successful
            if (azureResponse.status !== "200") {
                console.error("Azure API error:", azureResponse);
                return new NextResponse('Error from Azure API', { status: 500 });
            }

            // Get the ReadableStream from the Azure response
            const stream = azureResponse.body;

            if (!stream) {
                throw new Error("Response stream is undefined");
            }

            // Create SSE stream from the response stream
            // const sseStream = createSseStream(stream);

            // Set up streaming response headers
            const headers = {
                // 'Content-Type': 'application/octet-stream',
                'Content-Type': 'text/event-stream', // Crucial for SSE
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            };


            // Return the SSE stream as the response
            return new NextResponse(stream, { headers });

        } catch (error) {
            console.error("Azure API error:", error);
            console.error('Error forwarding stream:', error);
            return new NextResponse('Error forwarding stream', { status: 500 });
        }
    } catch (error) {
        console.error("Request parsing error:", error);
        return res.status(400).json({ error: 'Invalid request body' }); // Handle parsing errors
    }
}