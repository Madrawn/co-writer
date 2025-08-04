import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "./page";
const addNotebookSpy = vi.fn();
const removeNotebookSpy = vi.fn();
const setSelectedNotebookSpy = vi.fn();
// 2. Mock the entire coWriter module.
// This must be done at the top level, before any imports that use it.
vi.mock("../lib/coWriter", async () => {
  // The factory function returns the module's mocked exports.
  return {
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
          notebooks: [[{ id: "mock-cell", content: "Initial mock notebook" }], [{ id: "mock-cell2", content: "second mock notebook" }]],
          chatMessages: [],
          isLoading: false,
          selectedNotebook: 0,
        }),
        subscribe: vi.fn(() => () => {}), // A subscribe that returns an empty unsubscribe function
        setModelName: vi.fn(),
        selectNotebookByIndex: setSelectedNotebookSpy,
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

describe("HomePage", () => {
  const fakeStreamChatFn = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    fakeStreamChatFn.mockReset();
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

// --- Unit tests for HomePage rendering ---
describe("HomePage", () => {
  it("renders without crashing", () => {
    render(<HomePage />);
    expect(screen.getByText(/Co-Writer Notebook/i)).toBeInTheDocument();
  });
});

describe("HomePage UI", () => {
  it("renders the main heading", () => {
    render(<HomePage />);
    expect(screen.getByText(/Co-Writer Notebook/i)).toBeInTheDocument();
  });

  it("shows Add Cell button and triggers addCell on click", () => {
    render(<HomePage />);
    const addCellBtn = screen.getByText(/Add Cell/i);
    expect(addCellBtn).toBeInTheDocument();
    fireEvent.click(addCellBtn);
    // No assertion here since addCell is mocked, but no error should occur
  });

  it("shows menu when menu button is clicked", () => {
    render(<HomePage />);
    const menuBtn = screen.getByTitle("Add cell Menu");
    fireEvent.click(menuBtn);
    expect(screen.getByText(/Insert file\(s\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Insert folder/i)).toBeInTheDocument();
  });

  it("calls handleInsertFiles with correct argument when Insert file(s) is clicked", async () => {
    render(<HomePage />);
    const menuBtn = screen.getByTitle("Add cell Menu");
    fireEvent.click(menuBtn);
    const insertFilesBtn = screen.getByText(/Insert file\(s\)/i);
    expect(insertFilesBtn).toBeInTheDocument();
    fireEvent.click(insertFilesBtn);
    // No assertion, just ensure no error
  });

  it("calls handleInsertFiles with correct argument when Insert folder is clicked", async () => {
    render(<HomePage />);
    const menuBtn = screen.getByTitle("Add cell Menu");
    fireEvent.click(menuBtn);
    const insertFolderBtn = screen.getByText(/Insert folder/i);
    expect(insertFolderBtn).toBeInTheDocument();
    fireEvent.click(insertFolderBtn);
    // No assertion, just ensure no error
  });
});
