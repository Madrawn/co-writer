import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  speakTextWithAzureTTS,
  playAudioBlob,
  speakTextInChunks,
} from "./azureTTSService";

// Mock global fetch
const mockBlob = new Blob(["audio"]);
const fetchMock = vi.fn();
globalThis.fetch = fetchMock as any;

// Mock Audio and URL.createObjectURL
const playMock = vi.fn();
const onendedMock = vi.fn();
class MockAudio {
  onended: (() => void) | null = null;
  play = playMock;
  constructor(public url: string) {}
}
(globalThis as any).Audio = MockAudio;
const createObjectURLMock = vi.fn(() => "blob:url");
const revokeObjectURLMock = vi.fn();
globalThis.URL.createObjectURL = createObjectURLMock;
globalThis.URL.revokeObjectURL = revokeObjectURLMock;

describe("speakTextWithAzureTTS", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    playMock.mockReset();
    createObjectURLMock.mockClear();
    revokeObjectURLMock.mockClear();
    (process.env as any).AZURE_TTS_API_KEY = "test-key";
  });

  it("throws if AZURE_TTS_API_KEY is not set", async () => {
    (process.env as any).AZURE_TTS_API_KEY = "";
    await expect(speakTextWithAzureTTS("hello")).rejects.toThrow(
      /AZURE_TTS_API_KEY/
    );
  });

  it("calls fetch with correct params and returns blob", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
    const result = await speakTextWithAzureTTS("hello", "voice1");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
        }),
      })
    );
    expect(result).toBe(mockBlob);
  });

  it("throws if fetch response is not ok", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    await expect(speakTextWithAzureTTS("fail")).rejects.toThrow(
      /Azure TTS request failed/
    );
  });
});

describe("playAudioBlob", () => {
  it("creates object URL, plays audio, and revokes URL", async () => {
    playMock.mockImplementation(function (this: any) {
      setTimeout(() => {
        if (this.onended) this.onended();
      }, 0);
    });
    const blob = new Blob(["audio"]);
    const promise = playAudioBlob(blob);
    await promise;
    expect(createObjectURLMock).toHaveBeenCalledWith(blob);
    expect(playMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:url");
  });
});

describe("speakTextInChunks", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
    playMock.mockReset();
    playMock.mockImplementation(function (this: any) {
      setTimeout(() => {
        if (this.onended) this.onended();
      }, 0);
    });
  });

  it("splits text into chunks and processes all", async () => {
    const text = "Sentence one. Sentence two! Sentence three? Sentence four.";

    // should start with no fetch or play calls
    expect(playMock).toHaveBeenCalledTimes(0);
    expect(fetchMock).toHaveBeenCalledTimes(0);

    await speakTextInChunks(text, "voice2", 2);
    // Wait a tick to ensure all playMock calls (async via setTimeout) are completed
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Should call fetch for each chunk (2 chunks for 4 sentences)
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(playMock).toHaveBeenCalled();
  });

  it("handles empty text gracefully", async () => {
    await speakTextInChunks("", "voice3");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(playMock).not.toHaveBeenCalled();
  });
});
