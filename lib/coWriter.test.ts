import { describe, it, expect, vi, beforeEach } from "vitest";
import { CoWriter } from "./coWriter";

// lib/coWriter.test.ts

// Mocks
const mockUUID = (() => {
  let i = 0;
  return () => `uuid-${++i}`;
})();
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = {} as Crypto;
}
(globalThis.crypto as any).randomUUID = mockUUID;
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    clear: () => {
      store = {};
    },
  };
})();
globalThis.localStorage = mockLocalStorage as any;

// Patch parseGeminiResponse
vi.mock("./parser", () => ({
  parseGeminiResponse: vi.fn((text: string) => ({
    cleanContent: `CLEAN:${text}`,
    proposedChanges: [{ targetCellId: "cell1", newContent: "foo" }],
  })),
}));

beforeEach(() => {
  mockLocalStorage.clear();
  vi.clearAllMocks();
});

describe("CoWriter.handleSendMessage", () => {
  function makeStream(chunks: string[]) {
    return {
      [Symbol.asyncIterator]: async function* () {
        for (const text of chunks) yield { text };
      },
    };
  }

  it("adds user and model messages, updates model message with streamed content and parsed result", async () => {
    const streamChatFn = vi
      .fn()
      .mockResolvedValue(makeStream(["Hello ", "World!"]));
    const coWriter = new CoWriter(streamChatFn, "gpt-4.1");
    // Remove initial messages for clarity
    coWriter["state"].chatMessages = [];

    await coWriter.handleSendMessage("Test message");

    const state = coWriter.getState();
    expect(state.chatMessages.length).toBe(2);
    expect(state.chatMessages[0]).toMatchObject({
      role: "user",
      content: "Test message",
    });
    expect(state.chatMessages[1].role).toBe("model");
    expect(state.chatMessages[1].content).toBe("Hello World!");
    expect(state.chatMessages[1].cleanContent).toBe("CLEAN:Hello World!");
    expect(state.chatMessages[1].proposedChanges).toEqual([
      { targetCellId: "cell1", newContent: "foo" },
    ]);
    expect(state.isLoading).toBe(false);

    // streamChatFn called with correct args
    expect(streamChatFn).toHaveBeenCalledWith(
      expect.arrayContaining([
        { role: "user", content: "Test message", id: expect.any(String) },
      ]),
      expect.any(Array),
      null,
      "gpt-4.1"
    );
  });

  it("sets isLoading true during and false after", async () => {
    const streamChatFn = vi.fn().mockResolvedValue(makeStream(["A"]));
    const coWriter = new CoWriter(streamChatFn, "gpt-4.1");
    coWriter["state"].chatMessages = [];
    let loadingStates: boolean[] = [];
    coWriter.subscribe((s) => loadingStates.push(s.isLoading));
    await coWriter.handleSendMessage("msg");
    console.log(loadingStates);
    expect(loadingStates.length).toBeGreaterThan(1);
    expect(loadingStates[0]).toBe(false); // Initial state should be false
    expect(loadingStates[1]).toBe(true); // After sending message, should be true
    for (let i = 2; i < loadingStates.length - 1; i++) {
      expect(loadingStates[i]).toBe(true); // During streaming, should remain true
    }
    // Last state should be false after streaming completes
    expect(loadingStates[loadingStates.length - 1]).toBe(false);
  });

  it("calls parseGeminiResponse with full streamed text", async () => {
    const streamChatFn = vi.fn().mockResolvedValue(makeStream(["foo", "bar"]));
    const { parseGeminiResponse } = await import("./parser");
    const coWriter = new CoWriter(streamChatFn, "gpt-4.1");
    coWriter["state"].chatMessages = [];
    await coWriter.handleSendMessage("msg");
    expect(parseGeminiResponse).toHaveBeenCalledWith("foobar");
  });

  it("handles error in streamChatFn and updates model message with error", async () => {
    const streamChatFn = vi.fn().mockRejectedValue(new Error("fail!"));
    const coWriter = new CoWriter(streamChatFn, "gpt-4.1");
    coWriter["state"].chatMessages = [];
    await coWriter.handleSendMessage("msg");
    const state = coWriter.getState();
    expect(state.chatMessages.length).toBe(2);
    expect(state.chatMessages[1].content).toContain(
      "Sorry, I ran into an error: fail!"
    );
    expect(state.isLoading).toBe(false);
  });

  it("skips empty chunks in stream", async () => {
    const streamChatFn = vi
      .fn()
      .mockResolvedValue(makeStream(["foo", "", "", "bar"]));
    const coWriter = new CoWriter(streamChatFn, "gpt-4.1");
    coWriter["state"].chatMessages = [];
    await coWriter.handleSendMessage("msg");
    const state = coWriter.getState();
    expect(state.chatMessages[1].content).toBe("foobar");
  });

  it("uses modelNameOverride if provided", async () => {
    const streamChatFn = vi.fn().mockResolvedValue(makeStream(["x"]));
    const coWriter = new CoWriter(streamChatFn, "gpt-4.1");
    coWriter["state"].chatMessages = [];
    await coWriter.handleSendMessage("msg", "overrideModel" as any);
    expect(streamChatFn).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Array),
      null,
      "overrideModel"
    );
  });
  describe("CoWriter cell operations", () => {
    let coWriter: CoWriter;
    beforeEach(() => {
      const streamChatFn = vi.fn();
      coWriter = new CoWriter(streamChatFn, "gpt-4.1");
      // Start with a single notebook for simplicity
      coWriter["state"].notebooks = [
        [
          { id: "cell1", content: "A" },
          { id: "cell2", content: "B" },
        ],
      ];
      coWriter["state"].selectedNotebook = 0;
    });

    describe("addCell", () => {
      it("adds a new cell with given content to the selected notebook and returns its id", () => {
        const id = coWriter.addCell("new content");
        const state = coWriter.getState();
        expect(state.notebooks[0].length).toBe(3);
        expect(state.notebooks[0][2]).toMatchObject({ id, content: "new content" });
        expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
          "co-writer-notebooks",
          JSON.stringify(state.notebooks)
        );
      });

      it("adds a new cell with empty content if no content is provided", () => {
        const id = coWriter.addCell();
        const state = coWriter.getState();
        expect(state.notebooks[0][2]).toMatchObject({ id, content: "" });
      });
    });

    describe("deleteCell", () => {
      it("removes the cell with the given id from the selected notebook", () => {
        coWriter.deleteCell("cell1");
        const state = coWriter.getState();
        expect(state.notebooks[0].length).toBe(1);
        expect(state.notebooks[0][0].id).toBe("cell2");
        expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
          "co-writer-notebooks",
          JSON.stringify(state.notebooks)
        );
      });

      it("does nothing if the cell id does not exist", () => {
        coWriter.deleteCell("notfound");
        const state = coWriter.getState();
        expect(state.notebooks[0].length).toBe(2);
      });
    });

    describe("updateCell", () => {
      it("updates the content of the cell with the given id", () => {
        coWriter.updateCell("cell2", "updated");
        const state = coWriter.getState();
        expect(state.notebooks[0][1]).toMatchObject({ id: "cell2", content: "updated" });
        expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
          "co-writer-notebooks",
          JSON.stringify(state.notebooks)
        );
      });

      it("does nothing if the cell id does not exist", () => {
        coWriter.updateCell("notfound", "foo");
        const state = coWriter.getState();
        expect(state.notebooks[0][0].content).toBe("A");
        expect(state.notebooks[0][1].content).toBe("B");
      });
    });

    describe("updateCellId", () => {
      it("updates the id of the cell if oldId exists and newId is different", () => {
        coWriter.updateCellId("cell1", "cellX");
        const state = coWriter.getState();
        expect(state.notebooks[0][0].id).toBe("cellX");
        expect(state.notebooks[0][1].id).toBe("cell2");
        expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
          "co-writer-notebooks",
          JSON.stringify(state.notebooks)
        );
      });

      it("does nothing if oldId is missing", () => {
        coWriter.updateCellId("", "cellX");
        const state = coWriter.getState();
        expect(state.notebooks[0][0].id).toBe("cell1");
      });

      it("does nothing if newId is missing", () => {
        coWriter.updateCellId("cell1", "");
        const state = coWriter.getState();
        expect(state.notebooks[0][0].id).toBe("cell1");
      });

      it("does nothing if oldId and newId are the same", () => {
        coWriter.updateCellId("cell1", "cell1");
        const state = coWriter.getState();
        expect(state.notebooks[0][0].id).toBe("cell1");
      });

      it("does nothing if oldId does not exist", () => {
        coWriter.updateCellId("notfound", "cellX");
        const state = coWriter.getState();
        expect(state.notebooks[0][0].id).toBe("cell1");
        expect(state.notebooks[0][1].id).toBe("cell2");
      });
    });
  });

  describe("CoWriter notebook operations", () => {
    it("removes the last notebook and selects the new last notebook", () => {
      coWriter["state"].notebooks = [
        [{ id: "cell1", content: "A" }],
        [{ id: "cell2", content: "B" }],
        [{ id: "cell3", content: "C" }],
      ];
      coWriter["state"].selectedNotebook = 2;
      coWriter.removeNotebook(2);
      const state = coWriter.getState();
      expect(state.notebooks.length).toBe(2);
      expect(state.selectedNotebook).toBe(1);
      expect(state.notebooks[1][0].id).toBe("cell2");
    });
    let coWriter: CoWriter;
    beforeEach(() => {
      const streamChatFn = vi.fn();
      coWriter = new CoWriter(streamChatFn, "gpt-4.1");
      coWriter["state"].notebooks = [
        [{ id: "cell1", content: "A" }],
        [{ id: "cell2", content: "B" }],
      ];
      coWriter["state"].selectedNotebook = 0;
    });

    it("addNotebook adds a new notebook and selects it", () => {
      coWriter.addNotebook([{ id: "cell3", content: "C" }]);
      const state = coWriter.getState();
      expect(state.notebooks.length).toBe(3);
      expect(state.selectedNotebook).toBe(2);
      expect(state.notebooks[2][0]).toMatchObject({ id: "cell3", content: "C" });
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
        "co-writer-notebooks",
        JSON.stringify(state.notebooks)
      );
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
        "co-writer-selected-notebook",
        "2"
      );
    });

    it("removeNotebook removes the notebook at the given index and updates selectedNotebook", () => {
      coWriter["state"].selectedNotebook = 1;
      coWriter.removeNotebook(1);
      const state = coWriter.getState();
      expect(state.notebooks.length).toBe(1);
      expect(state.selectedNotebook).toBe(0);
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
        "co-writer-notebooks",
        JSON.stringify(state.notebooks)
      );
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
        "co-writer-selected-notebook",
        "0"
      );
    });

    it("removeNotebook does nothing if only one notebook remains", () => {
      coWriter["state"].notebooks = [[{ id: "cell1", content: "A" }]];
      coWriter.removeNotebook(0);
      const state = coWriter.getState();
      expect(state.notebooks.length).toBe(1);
    });

    it("setSelectedNotebook updates selectedNotebook and saves to storage", () => {
      coWriter.setSelectedNotebook(1);
      const state = coWriter.getState();
      expect(state.selectedNotebook).toBe(1);
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
        "co-writer-selected-notebook",
        "1"
      );
    });

    it("setSelectedNotebook does nothing if index is out of bounds", () => {
      coWriter.setSelectedNotebook(-1);
      expect(coWriter.getState().selectedNotebook).toBe(0);
      coWriter.setSelectedNotebook(99);
      expect(coWriter.getState().selectedNotebook).toBe(0);
    });
  });

  describe("CoWriter handleApplyChanges and handleRejectChanges", () => {
    let coWriter: CoWriter;
    beforeEach(() => {
      const streamChatFn = vi.fn();
      coWriter = new CoWriter(streamChatFn, "gpt-4.1");
      coWriter["state"].notebooks = [
        [
          { id: "cell1", content: "A" },
          { id: "cell2", content: "B" },
        ],
      ];
      coWriter["state"].selectedNotebook = 0;
      coWriter["state"].chatMessages = [
        {
          id: "msg1",
          role: "model",
          content: "foo",
          proposedChanges: [
            { targetCellId: "cell1", newContent: "A2" },
            { targetCellId: "new", newContent: "C" },
            { targetCellId: "cellX", newContent: "X" },
          ],
        },
      ];
    });

    it("handleApplyChanges applies changes to cells and marks message as applied", () => {
      coWriter.handleApplyChanges("msg1");
      const state = coWriter.getState();
      // cell1 updated, cell2 unchanged, cellX added, new cell added
      expect(state.notebooks[0].find((c) => c.id === "cell1")?.content).toBe("A2");
      expect(state.notebooks[0].find((c) => c.id === "cell2")?.content).toBe("B");
      expect(state.notebooks[0].find((c) => c.id === "cellX")?.content).toBe("X");
      // The "new" cell gets a generated id and content "C"
      expect(state.notebooks[0].some((c) => c.content === "C")).toBe(true);
      // Message reviewDecision is "applied"
      expect(state.chatMessages[0].reviewDecision).toBe("applied");
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
        "co-writer-notebooks",
        JSON.stringify(state.notebooks)
      );
      expect(coWriter["feedbackForNextPrompt"]).toContain("applied");
    });

    it("handleApplyChanges does nothing if message id not found", () => {
      coWriter.handleApplyChanges("notfound");
      expect(coWriter.getState().notebooks[0].length).toBe(2);
    });

    it("handleApplyChanges does nothing if no proposedChanges", () => {
      coWriter["state"].chatMessages = [{ id: "msg2", role: "model", content: "foo" }];
      coWriter.handleApplyChanges("msg2");
      expect(coWriter.getState().notebooks[0].length).toBe(2);
    });

    it("handleRejectChanges marks message as rejected and sets feedback", () => {
      coWriter.handleRejectChanges("msg1");
      expect(coWriter.getState().chatMessages[0].reviewDecision).toBe("rejected");
      expect(coWriter["feedbackForNextPrompt"]).toContain("rejected");
    });

    it("handleRejectChanges does nothing if message id not found", () => {
      coWriter.handleRejectChanges("notfound");
      // No error, no reviewDecision set
      expect(coWriter.getState().chatMessages[0].reviewDecision).toBeUndefined();
    });
  });

  describe("CoWriter subscribe and notifyListeners", () => {
    let coWriter: CoWriter;
    beforeEach(() => {
      const streamChatFn = vi.fn();
      coWriter = new CoWriter(streamChatFn, "gpt-4.1");
      coWriter["state"].notebooks = [
        [{ id: "cell1", content: "A" }],
      ];
      coWriter["state"].selectedNotebook = 0;
    });

    it("subscribe immediately calls listener and unsubscribes correctly", () => {
      const listener = vi.fn();
      const unsubscribe = coWriter.subscribe(listener);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ notebooks: expect.any(Array) }));
      coWriter.addCell("foo");
      expect(listener).toHaveBeenCalledTimes(2);
      unsubscribe();
      coWriter.addCell("bar");
      expect(listener).toHaveBeenCalledTimes(2); // No further calls after unsubscribe
    });
  });

  describe("CoWriter setModelName", () => {
    it("updates the modelName property", () => {
      const streamChatFn = vi.fn();
      const coWriter = new CoWriter(streamChatFn, "gpt-4.1");
      coWriter.setModelName("modelB" as any);
      expect(coWriter["modelName"]).toBe("modelB");
    });
  });



});
