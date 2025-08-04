import { describe, it, expect, vi, beforeEach } from "vitest";
import { streamChatResponse } from "./backendService";

function createMockStream(chunks: string[]) {
  let index = 0;
  return {
    getReader: () => ({
      read: async () => {
        if (index < chunks.length) {
          const value = new TextEncoder().encode(chunks[index]);
          index++;
          return { done: false, value };
        }
        return { done: true, value: undefined };
      },
    }),
  };
}

describe("streamChatResponse", () => {
  const mockFetch = vi.fn();
  const baseResponse = {
    ok: true,
    body: undefined as any,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    globalThis.fetch = mockFetch as any;
  });

  it("yields parsed text chunks from the stream", async () => {
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n',
      "data: [DONE]\n",
    ];
    mockFetch.mockResolvedValue({
      ...baseResponse,
      body: createMockStream(chunks),
    });

    const gen = await streamChatResponse([], [], null, "test-model");
    const results: string[] = [];
    for await (const { text } of gen) {
      if (text) results.push(text);
    }
    expect(results).toEqual(["Hello", " world"]);
  });

  it("throws if response is not ok", async () => {
    mockFetch.mockResolvedValue({ ...baseResponse, ok: false, status: 500 });
    await expect(
      streamChatResponse([], [], null, "test-model")
    ).rejects.toThrow("Backend request failed with status 500");
  });

  it("throws if response body is null", async () => {
    mockFetch.mockResolvedValue({ ...baseResponse, body: null });
    await expect(
      streamChatResponse([], [], null, "test-model")
    ).rejects.toThrow("Backend response body is null.");
  });

  it("handles incomplete JSON chunks gracefully", async () => {
    // Simulate a chunk split in the middle of a JSON object
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hel',
      'lo"}}]}\n',
      "data: [DONE]\n",
    ];
    mockFetch.mockResolvedValue({
      ...baseResponse,
      body: createMockStream(chunks),
    });

    const gen = await streamChatResponse([], [], null, "test-model");
    const results: string[] = [];
    for await (const { text } of gen) {
      if (text) results.push(text);
    }
    expect(results).toEqual(["Hello"]);
  });

  it("returns when [DONE] is received", async () => {
    const chunks = ["data: [DONE]\n"];
    mockFetch.mockResolvedValue({
      ...baseResponse,
      body: createMockStream(chunks),
    });

    const gen = await streamChatResponse([], [], null, "test-model");
    const results: string[] = [];
    for await (const { text } of gen) {
      if (text) results.push(text);
    }
    expect(results).toEqual([]);
  });
});
