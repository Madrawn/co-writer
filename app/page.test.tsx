import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "./page";
import type { MarkdownCellData, ChatMessage } from "../types";
import { CoWriter, OriginalCoWriter } from "../lib/coWriter";
const addNotebookSpy = vi.fn();
const removeNotebookSpy = vi.fn();
const setSelectedNotebookSpy = vi.fn();
// 2. Mock the entire coWriter module.
// This must be done at the top level, before any imports that use it.
vi.mock("../lib/coWriter", async (importOriginal) => {
  // The factory function returns the module's mocked exports.
  const originalCoWriter = await importOriginal() // type is inferred
  return {

    OriginalCoWriter: originalCoWriter.CoWriter,
    // We export a mock CoWriter class...
    CoWriter: vi.fn().mockImplementation(() => {
      // ...and its constructor returns a mock instance object.
      // This object must contain all the properties and methods
      // that the useCoWriterCore hook will try to call, otherwise
      // you will get "is not a function" errors.
      return {
        addNotebook: addNotebookSpy,
        removeNotebook: removeNotebookSpy,
        // --- Mock other methods used by the hook ---
        getState: () => ({
          notebooks: [[{ id: "mock-cell", content: "Initial mock notebook" }]],
          chatMessages: [],
          isLoading: false,
          selectedNotebook: 0,
        }),
        subscribe: vi.fn(() => () => {}), // A subscribe that returns an empty unsubscribe function
        setModelName: vi.fn(),
        setSelectedNotebook: setSelectedNotebookSpy,
        addCell: vi.fn(),
        deleteCell: vi.fn(),
        updateCell: vi.fn(),
        updateCellId: vi.fn(),
        handleSendMessage: vi.fn(),
        handleApplyChanges: vi.fn(),
        handleRejectChanges: vi.fn(),
      };
    }),
  };
});

// vi.mock("../components/MarkdownCell", () => ({
//   __esModule: true,
//   default: ({ cell }: any) => <div data-testid="markdown-cell">{cell.id}</div>,
// }));
// vi.mock("../components/ChatPanel", () => ({
//   __esModule: true,
//   default: (props: any) => <div data-testid="chat-panel" {...props} />,
// }));
// vi.mock("../components/icons", () => ({
//   PlusIcon: (props: any) => <svg data-testid="plus-icon" {...props} />,
// }));
vi.mock("../lib/azureService", () => ({
  models: { "o4-mini": {}, "gpt-4.1": {} },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

// Mock crypto.randomUUID
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => "uuid-mock" },
  configurable: true,
});

// Mock parseGeminiResponse
vi.mock("../lib/parser", () => ({
  parseGeminiResponse: (text: string) => ({
    cleanContent: text,
    proposedChanges: [],
  }),
}));

// Mock scrollIntoView for all elements (jsdom doesn't implement it)
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = function () {};
}

describe("CoWriter", () => {
  const fakeStreamChatFn = vi.fn();
  const initialModel = "gpt-4.1" as const;

  beforeEach(() => {
    localStorage.clear();
    fakeStreamChatFn.mockReset();
  });

  it("initializes with default state", () => {
    const cw = new OriginalCoWriter(fakeStreamChatFn, initialModel);
    const state = cw.getState();
    expect(state.notebooks.length).toBeGreaterThan(0);
    expect(state.chatMessages.length).toBeGreaterThan(0);
    expect(state.isLoading).toBe(false);
    expect(state.selectedNotebook).toBe(0);
  });

  it("can add and remove notebooks", () => {
    const cw = new OriginalCoWriter(fakeStreamChatFn, initialModel);
    const prevCount = cw.getState().notebooks.length;
    cw.addNotebook([{ id: "test", content: "abc" }]);
    expect(cw.getState().notebooks.length).toBe(prevCount + 1);
    expect(cw.getState().selectedNotebook).toBe(prevCount);

    cw.removeNotebook(prevCount);
    expect(cw.getState().notebooks.length).toBe(prevCount);
  });

  it("does not remove last notebook", () => {
    const cw = new CoWriter(fakeStreamChatFn, initialModel);
    // Remove until only one left
    while (cw.getState().notebooks.length > 1) {
      cw.removeNotebook(0);
    }
    const count = cw.getState().notebooks.length;
    cw.removeNotebook(0);
    expect(cw.getState().notebooks.length).toBe(count);
  });

  it("can set selected notebook", () => {
    const cw = new OriginalCoWriter(fakeStreamChatFn, initialModel);
    cw.addNotebook([{ id: "test2", content: "def" }]);
    cw.setSelectedNotebook(1);
    expect(cw.getState().selectedNotebook).toBe(1);
    cw.setSelectedNotebook(99); // out of bounds
    expect(cw.getState().selectedNotebook).toBe(1);
  });

  it("can add, update, and delete cells", () => {
    const cw = new OriginalCoWriter(fakeStreamChatFn, initialModel);
    cw.addNotebook();
    cw.setSelectedNotebook(1);
    const cellId = cw.addCell("hello");
    let cells = cw.getState().notebooks[1];
    expect(cells.some((c) => c.id === cellId)).toBe(true);

    cw.updateCell(cellId, "world");
    cells = cw.getState().notebooks[1];
    expect(cells.find((c) => c.id === cellId)?.content).toBe("world");

    cw.deleteCell(cellId);
    cells = cw.getState().notebooks[1];
    expect(cells.some((c) => c.id === cellId)).toBe(false);
  });

  it("can update cell id", () => {
    const cw = new OriginalCoWriter(fakeStreamChatFn, initialModel);
    cw.addNotebook();
    cw.setSelectedNotebook(1);
    const cellId = cw.addCell("foo");
    cw.updateCellId(cellId, "bar");
    const cells = cw.getState().notebooks[1];
    expect(cells.some((c) => c.id === "bar")).toBe(true);
    expect(cells.some((c) => c.id === cellId)).toBe(false);
  });

  it("notifies listeners on state change", () => {
    const cw = new OriginalCoWriter(fakeStreamChatFn, initialModel);
    const listener = vi.fn();
    cw.subscribe(listener);
    cw.addNotebook();
    expect(listener).toHaveBeenCalled();
  });

  it("handleApplyChanges and handleRejectChanges update chatMessages", () => {
    const cw = new OriginalCoWriter(fakeStreamChatFn, initialModel);
    // Add a message with proposedChanges
    const msg: ChatMessage = {
      id: "msg1",
      role: "model",
      content: "test",
      proposedChanges: [{ targetCellId: "new", newContent: "abc" }],
    };
    // @ts-ignore
    cw.getState().chatMessages.push(msg);
    // Actually update state
    (cw as any).state.chatMessages.push(msg);

    cw.handleApplyChanges("msg1");
    const appliedMsg = cw.getState().chatMessages.find((m) => m.id === "msg1");
    expect(appliedMsg?.reviewDecision).toBe("applied");

    cw.handleRejectChanges("msg1");
    const rejectedMsg = cw.getState().chatMessages.find((m) => m.id === "msg1");
    expect(rejectedMsg?.reviewDecision).toBe("rejected");
  });

  it("calls addNotebook and removeNotebook", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByTitle("Add Notebook"));
    expect(addNotebookSpy).toHaveBeenCalled();
    

    fireEvent.click(screen.getByTitle("Remove Notebook"));
    expect(removeNotebookSpy).toHaveBeenCalledWith(0);
  });

  it("calls setSelectedModel and setSelectedNotebook on dropdown change", () => {
    render(<HomePage />);
    fireEvent.change(screen.getByLabelText("Model:"), {
      target: { value: "o4-mini" },
    });
    expect(screen.getByLabelText("Model:")).toHaveValue("o4-mini");

    fireEvent.change(screen.getByLabelText("Notebook:"), {
      target: { value: "1" },
    });
    expect(setSelectedNotebookSpy).toHaveBeenCalled();
  });

  it("renders ChatPanel with correct props", () => {
    render(<HomePage />);
    expect(screen.getByTestId("chat-panel")).toBeInTheDocument();
  });
});
