import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextResponse } from "next/server";

// Mock dependencies
vi.mock("@azure-rest/ai-inference", () => ({
  default: vi.fn(() => ({
    path: vi.fn(() => ({
      post: vi.fn(() => ({
        status: "200",
        body: "mock-stream",
      })),
    })),
  })),
}));
vi.mock("@azure/core-auth", () => ({
  AzureKeyCredential: vi.fn(),
}));
vi.mock("../../../../lib/promptBuilder", () => ({
  buildPrompt: vi.fn(() => ({
    contents: [{ role: "user", parts: [{ text: "hello" }] }],
    systemInstruction: "system",
  })),
}));

// Helper to mock process.env
const OLD_ENV = { ...process.env };

describe("POST /api/co-writer/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...OLD_ENV };
    process.env.AZURE_API_KEY = "key";
    process.env.AZURE_ENDPOINT = "endpoint";
    process.env.AZURE_OPENAI_ENDPOINT = "endpoint_oa";
  });

  it("returns 500 if Azure config missing", async () => {
    process.env.AZURE_API_KEY = "";
    const req = { json: async () => ({}) } as unknown as Request;
    const res = await POST(req);
    expect(res instanceof NextResponse).toBe(true);
    let body = "";
    // @ts-expect-error: NextResponse.body is a ReadableStream in runtime, but its type is not exposed in Next.js types for testing.
    // This is safe in the test context because we know our mock returns a compatible object.
    const reader = res.body.getReader();
    const { value } = await reader.read();
    if (value) {
      body += new TextDecoder().decode(value);
    }
    expect(body).toMatch(/Azure configuration missing/);
    expect(res.status).toBe(500);
  });

  it("returns 400 if request body is invalid", async () => {
    const badReq = {
      json: vi.fn().mockRejectedValue(new Error("fail")),
    } as unknown as Request;
    const res = await POST(badReq);
    expect(res instanceof NextResponse).toBe(true);
    let body = "";
    // @ts-expect-error: res.body is a ReadableStream in the NextResponse, but TypeScript may not recognize this type in the test context
    const reader = res.body.getReader();
    const { value } = await reader.read();
    if (value) {
      body += new TextDecoder().decode(value);
    }
    expect(body).toMatch(/Invalid request body/);
    expect(res.status).toBe(400);
  });

  it("returns 500 if Azure API errors", async () => {
    // Patch the model client to throw
    const ModelClient = (await import("@azure-rest/ai-inference")).default;
    // @ts-expect-error: ModelClient is a mocked function
    ModelClient.mockImplementation(() => ({
      path: () => ({
        post: vi.fn().mockImplementation(() => {
          throw new Error("fail");
        }),
      }),
    }));
    const req = {
      json: async () => ({
        historyWithNewMessage: [],
        cells: [],
        feedback: "",
        modelName: "gpt-4.1",
      }),
    } as unknown as Request;
    const res = await POST(req);
    expect(res instanceof NextResponse).toBe(true);
    let body = "";
    // @ts-expect-error: res.body is a ReadableStream in the NextResponse, but TypeScript may not recognize this type in the test context
    const reader = res.body.getReader();
    const { value } = await reader.read();
    if (value) {
      body += new TextDecoder().decode(value);
    }
    expect(body).toMatch(/Error forwarding stream/);
    expect(res.status).toBe(500);
  });

});
