import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { buildPrompt } from '../../../../lib/promptBuilder';
import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Enable Edge Runtime

export async function POST(req: Request) {
    try {
        const requestBody = await req.json();
        const {
            historyWithNewMessage,
            cells,
            feedback,
            modelName
        } = requestBody;

        const endpoint = process.env.AZURE_ENDPOINT;
        const endpoint_oa = process.env.AZURE_OPENAI_ENDPOINT;
        const apiKey = process.env.AZURE_API_KEY;

        if (!apiKey || !endpoint || !endpoint_oa) {
            return NextResponse.json({ error: 'Azure configuration missing' }, { status: 500 });
        }

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

            if (azureResponse.status !== "200") {
                console.error("Azure API error:", azureResponse);
                return new NextResponse('Error from Azure API', { status: 500 });
            }

            const stream = azureResponse.body;

            if (!stream) {
                throw new Error("Response stream is undefined");
            }

            const headers = {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            };

            return new NextResponse(stream, { headers });

        } catch (error) {
            console.error("Azure API error:", error);
            return new NextResponse('Error forwarding stream', { status: 500 });
        }
    } catch (error) {
        console.error("Request parsing error:", error);
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
