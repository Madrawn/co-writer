import type {
  MarkdownCellData,
  ChatMessage,
  StreamChatFn,
  CoWriterState,
  StateListener,
} from "../types";
import { models } from "./azureService";
import { parseGeminiResponse } from "./parser";

const LOCAL_STORAGE_KEY = "co-writer-notebooks";
const LOCAL_STORAGE_SELECTED_KEY = "co-writer-selected-notebook";

const INITIAL_NOTEBOOKS: MarkdownCellData[][] = [
  [
    {
      id: "welcome-cell",
      content: `# Welcome to your Co-Writer Notebook!

This is a collaborative space for you and CoWriter. Here's how it works:

1.  **Edit Your Notes**: Click on this cell to start editing. The content is written in Markdown.
2.  **Add New Cells**: Use the "+ Add Cell" button to organize your thoughts.
3.  **Chat with CoWriter**: Use the chat panel on the right. Every time you send a message, the *entire content of this notebook* is sent to CoWriter as context.

CoWriter will always be up-to-date with your notes. Try asking it to summarize, expand upon, or refactor the content here! You can even ask it to "rewrite the first cell" and it will propose the change for you to approve.`,
    },
  ],
  [
    {
      id: "instructional-cell",
      content:
        "This is a proof of concept for a data collection app for sales representatives. Ask the user for the required informations and add new cells any information you find relevant. You can also ask the user to provide more information if needed. Tread the id as the the property name for a fictional object representing a lead, or customer contact.",
    },
    { id: "full_name", content: "*required" },
    { id: "cooperation", content: "*required" },
    { id: "title", content: "*required" },
    { id: "contact", content: "*required" },
  ],
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: crypto.randomUUID(),
    role: "model",
    content:
      "Hello! I'm CoWriter. I'm ready to help. Your notes are my context. What should we work on?",
  },
];

export class CoWriter {
  private state: CoWriterState;
  private listeners: Set<StateListener> = new Set();
  private feedbackForNextPrompt: string | null = null;
  private streamChatFn: StreamChatFn;
  private modelName: keyof typeof models;
  constructor(
    streamChatFn: StreamChatFn,
    initialModelName: keyof typeof models
  ) {
    this.clearChatMessages = this.clearChatMessages.bind(this);
    this.streamChatFn = streamChatFn;
    this.modelName = initialModelName;
    this.state = {
      notebooks: this.loadNotebooksFromStorage(),
      chatMessages: INITIAL_MESSAGES,
      isLoading: false,
      selectedNotebook: this.loadSelectedNotebookFromStorage(),
    };
  }
  /**
   * Clear all chat messages and reset to initial message
   */
  public clearChatMessages = () => {
    this.setState(() => ({
      chatMessages: [
        {
          id: crypto.randomUUID(),
          role: "model",
          content:
            "Hello! I'm CoWriter. I'm ready to help. Your notes are my context. What should we work on?",
        },
      ],
    }));
  };

  public setModelName(modelName: keyof typeof models) {
    this.modelName = modelName;
  }
  public selectNotebookByIndex = (index: number) => {
    if (index < 0 || index >= this.state.notebooks.length) return;
    this.setState(() => ({
      selectedNotebook: index,
    }));
    this.saveSelectedNotebookToStorage();
  };
  public addNotebook = (initialCells: MarkdownCellData[] = []) => {
    this.setState((prevState) => {
      const newNotebooks = [...prevState.notebooks, initialCells];
      return {
        notebooks: newNotebooks,
        selectedNotebook: newNotebooks.length - 1,
      };
    });
    this.saveNotebooksToStorage();
    this.saveSelectedNotebookToStorage();
  };
  public removeNotebook = (index: number) => {
    if (this.state.notebooks.length <= 1) return; // Always keep at least one
    this.setState((prevState) => {
      const newNotebooks = prevState.notebooks.filter((_, i) => i !== index);
      let newSelected = prevState.selectedNotebook;
      if (newSelected >= newNotebooks.length)
        newSelected = newNotebooks.length - 1;
      return {
        notebooks: newNotebooks,
        selectedNotebook: newSelected,
      };
    });
    this.saveNotebooksToStorage();
    this.saveSelectedNotebookToStorage();
  };
  public getState(): CoWriterState {
    return { ...this.state };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  private setState(
    updater: (prevState: CoWriterState) => Partial<CoWriterState>
  ) {
    const prevState = this.state;
    const nextState = { ...prevState, ...updater(prevState) };
    // Shallow compare all top-level keys
    const keys = Object.keys(nextState) as (keyof CoWriterState)[];
    let changed = false;
    for (const key of keys) {
      if (prevState[key] !== nextState[key]) {
        changed = true;
        break;
      }
    }
    if (changed) {
      this.state = nextState;
      this.notifyListeners();
    }
  }

  private saveNotebooksToStorage() {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(this.state.notebooks)
      );
    } catch (error) {
      console.error("Failed to save notebooks to localStorage", error);
    }
  }
  private saveSelectedNotebookToStorage() {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_SELECTED_KEY,
        String(this.state.selectedNotebook)
      );
    } catch (error) {
      console.error("Failed to save selected notebook to localStorage", error);
    }
  }
  private loadNotebooksFromStorage(): MarkdownCellData[][] {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error(
        "Failed to load or parse notebooks from localStorage",
        error
      );
    }
    return INITIAL_NOTEBOOKS;
  }
  private loadSelectedNotebookFromStorage(): number {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SELECTED_KEY);
      if (saved !== null) {
        const idx = Number(saved);
        if (!isNaN(idx) && idx >= 0) {
          return idx;
        }
      }
    } catch (error) {
      console.error(
        "Failed to load selected notebook from localStorage",
        error
      );
    }
    return 0;
  }

  public addCell = (content: string = "", id = crypto.randomUUID()): string => {
    const newCell: MarkdownCellData = { id, content };
    this.setState((prevState) => ({
      notebooks: prevState.notebooks.map((cells, idx) =>
        idx === prevState.selectedNotebook ? [...cells, newCell] : cells
      ),
    }));
    this.saveNotebooksToStorage();
    return newCell.id;
  };
  public deleteCell = (id: string) => {
    this.setState((prevState) => ({
      notebooks: prevState.notebooks.map((cells, idx) =>
        idx === prevState.selectedNotebook
          ? cells.filter((cell) => cell.id !== id)
          : cells
      ),
    }));
    this.saveNotebooksToStorage();
  };
  public updateCell = (id: string, content: string) => {
    this.setState((prevState) => ({
      notebooks: prevState.notebooks.map((cells, idx) =>
        idx === prevState.selectedNotebook
          ? cells.map((cell) => (cell.id === id ? { ...cell, content } : cell))
          : cells
      ),
    }));
    this.saveNotebooksToStorage();
  };
  public updateCellId = (oldId: string, newId: string) => {
    if (!oldId || !newId || oldId === newId) return;
    this.setState((prevState) => ({
      notebooks: prevState.notebooks.map((cells, idx) =>
        idx === prevState.selectedNotebook
          ? cells.map((cell) =>
              cell.id === oldId ? { ...cell, id: newId } : cell
            )
          : cells
      ),
    }));
    this.saveNotebooksToStorage();
  };

  public handleSendMessage = async (
    message: string,
    modelNameOverride?: keyof typeof models
  ) => {
    const newUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };
    const modelMessageId = crypto.randomUUID();
    // Build chat history BEFORE setState
    const currentChatHistory: ChatMessage[] = [
      ...this.state.chatMessages,
      newUserMessage,
      { id: modelMessageId, role: "model", content: "" },
    ];
    this.setState(() => ({
      chatMessages: currentChatHistory,
      isLoading: true,
    }));

    try {
      const modelToUse = modelNameOverride || this.modelName;
      const stream = await this.streamChatFn(
        currentChatHistory.slice(0, -1),
        this.state.notebooks[this.state.selectedNotebook],
        this.feedbackForNextPrompt,
        modelToUse
      );
      if (this.feedbackForNextPrompt) {
        this.feedbackForNextPrompt = null;
      }

      let streamedText = "";
      for await (const chunk of stream) {
        if (!chunk.text) continue; // Skip empty chunks
        streamedText += chunk.text;
        this.setState((prevState) => ({
          chatMessages: prevState.chatMessages.map((msg) =>
            msg.id === modelMessageId ? { ...msg, content: streamedText } : msg
          ),
        }));
      }

      // Extract <thinking>...</thinking> content if present
      let thinking: string | undefined = undefined;
      const thinkingMatch = streamedText.match(/<thinking>([\s\S]*?)<\/thinking>/i);
      if (thinkingMatch) {
        thinking = thinkingMatch[1].trim();
      }

      const { cleanContent, proposedChanges } =
        parseGeminiResponse(streamedText);

      this.setState((prevState) => ({
        chatMessages: prevState.chatMessages.map((msg) =>
          msg.id === modelMessageId
            ? { ...msg, content: streamedText, cleanContent, proposedChanges, thinking }
            : msg
        ),
      }));
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      this.setState((prevState) => ({
        chatMessages: prevState.chatMessages.map((msg) =>
          msg.id === modelMessageId
            ? { ...msg, content: `Sorry, I ran into an error: ${errorMessage}` }
            : msg
        ),
      }));
    } finally {
      this.setState(() => ({ isLoading: false }));
    }
  };

  public handleApplyChanges = (messageId: string) => {
    const message = this.state.chatMessages.find((msg) => msg.id === messageId);
    if (!message || !message.proposedChanges) return;

    const changesToApply = message.proposedChanges;

    this.setState((prevState) => {
      let newCellsState: MarkdownCellData[] = [
        ...prevState.notebooks[prevState.selectedNotebook],
      ];
      const cellsToUpdate = new Map<string, string>();
      const cellsToAdd: MarkdownCellData[] = [];
      const existingCellIds = new Set(newCellsState.map((c) => c.id));

      changesToApply.forEach((change) => {
        if (change.targetCellId === "new") {
          cellsToAdd.push({
            id: crypto.randomUUID(),
            content: change.newContent,
          });
        } else if (existingCellIds.has(change.targetCellId)) {
          cellsToUpdate.set(change.targetCellId, change.newContent);
        } else {
          cellsToAdd.push({
            id: change.targetCellId,
            content: change.newContent,
          });
        }
      });

      newCellsState = newCellsState.map((cell) =>
        cellsToUpdate.has(cell.id)
          ? { ...cell, content: cellsToUpdate.get(cell.id)! }
          : cell
      );

      newCellsState.push(...cellsToAdd);

      const newNotebooks = prevState.notebooks.map((cells, idx) =>
        idx === prevState.selectedNotebook ? newCellsState : cells
      );

      return {
        notebooks: newNotebooks,
        chatMessages: prevState.chatMessages.map((msg) =>
          msg.id === messageId ? { ...msg, reviewDecision: "applied" } : msg
        ),
      };
    });

    this.saveNotebooksToStorage();
    this.feedbackForNextPrompt = `[User feedback: The previous changes were applied.]`;
  };

  public handleRejectChanges = (messageId: string) => {
    this.setState((prevState) => ({
      chatMessages: prevState.chatMessages.map((msg) =>
        msg.id === messageId ? { ...msg, reviewDecision: "rejected" } : msg
      ),
    }));
    this.feedbackForNextPrompt = `[User feedback: The previous changes were rejected.]`;
  };
}
