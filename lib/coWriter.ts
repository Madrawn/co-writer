import type { MarkdownCellData, ChatMessage } from "../types";
import { models } from "./azureService";
import { parseGeminiResponse } from "./parser";

export interface CoWriterState {
  cells: MarkdownCellData[][];
  chatMessages: ChatMessage[];
  isLoading: boolean;
  slot: number;
}

export type StreamChatFn = (
  historyWithNewMessage: ChatMessage[],
  cells: MarkdownCellData[],
  feedback: string | null,
  modelName: keyof typeof models
) => Promise<AsyncGenerator<{ text: string | undefined }>>;
type StateListener = (state: CoWriterState) => void;

const LOCAL_STORAGE_KEY = "co-writer-notebook-cells";
const LOCAL_STORAGE_SLOT_KEY = "co-writer-selected-slot";

const INITIAL_CELLS: MarkdownCellData[][] = [
  [
    {
      id: crypto.randomUUID(),
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
  [],
  [],
  [],
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
    this.streamChatFn = streamChatFn;
    this.modelName = initialModelName;
    this.state = {
      cells: this.loadCellsFromStorage(),
      chatMessages: INITIAL_MESSAGES,
      isLoading: false,
      slot: this.loadSlotFromStorage(),
    };
  }

  public setModelName(modelName: keyof typeof models) {
    this.modelName = modelName;
  }
  public setSlot(slot: number) {
    this.state.slot = slot;
    this.saveSlotToStorage();
  }
  public updateCellId = (oldId: string, newId: string) => {
    if (!oldId || !newId || oldId === newId) return;
    this.setState((prevState) => ({
      cells: prevState.cells.map((slotCells, slotIndex) =>
        slotIndex === prevState.slot
          ? slotCells.map((cell) =>
              cell.id === oldId ? { ...cell, id: newId } : cell
            )
          : slotCells
      ),
    }));
    this.saveCellsToStorage();
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
    this.state = { ...this.state, ...updater(this.state) };
    this.notifyListeners();
  }

  private saveCellsToStorage() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state.cells));
    } catch (error) {
      console.error("Failed to save cells to localStorage", error);
    }
  }

  private saveSlotToStorage() {
    try {
      localStorage.setItem(LOCAL_STORAGE_SLOT_KEY, String(this.state.slot));
    } catch (error) {
      console.error("Failed to save slot to localStorage", error);
    }
  }

  private loadCellsFromStorage(): MarkdownCellData[][] {
    try {
      const savedCells = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedCells) {
        const parsedCells = JSON.parse(savedCells);
        if (Array.isArray(parsedCells) && parsedCells.length > 0) {
          return parsedCells;
        }
      }
    } catch (error) {
      console.error("Failed to load or parse cells from localStorage", error);
    }
    return INITIAL_CELLS;
  }

  private loadSlotFromStorage(): number {
    try {
      const savedSlot = localStorage.getItem(LOCAL_STORAGE_SLOT_KEY);
      if (savedSlot !== null) {
        const slotNum = Number(savedSlot);
        if (!isNaN(slotNum) && slotNum >= 0 && slotNum < INITIAL_CELLS.length) {
          return slotNum;
        }
      }
    } catch (error) {
      console.error("Failed to load slot from localStorage", error);
    }
    return 0;
  }

  public addCell = (content: string = ""): string => {
    const newCell: MarkdownCellData = { id: crypto.randomUUID(), content };
    this.setState((prevState) => ({
      cells: prevState.cells.map((slotCells, slotIndex) =>
        slotIndex === prevState.slot ? [...slotCells, newCell] : slotCells
      ),
    }));
    this.saveCellsToStorage();
    return newCell.id;
  };

  public deleteCell = (id: string) => {
    this.setState((prevState) => ({
      cells: prevState.cells.map((slotCells, slotIndex) =>
        slotIndex === prevState.slot
          ? slotCells.filter((cell) => cell.id !== id)
          : slotCells
      ),
    }));
    this.saveCellsToStorage();
  };

  public updateCell = (id: string, content: string) => {
    this.setState((prevState) => ({
      cells: prevState.cells.map((slotCells, slotIndex) =>
        slotIndex === prevState.slot
          ? slotCells.map((cell) =>
              cell.id === id ? { ...cell, content } : cell
            )
          : slotCells
      ),
    }));
    this.saveCellsToStorage();
  };

  public handleSendMessage = async (
    message: string,
    modelNameOverride?: keyof typeof models
  ) => {
    this.setState(() => ({ isLoading: true }));

    const newUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
    };
    let currentChatHistory: ChatMessage[];

    this.setState((prevState) => {
      currentChatHistory = [...prevState.chatMessages, newUserMessage];
      return { chatMessages: currentChatHistory };
    });

    const modelMessageId = crypto.randomUUID();
    this.setState((prevState) => ({
      chatMessages: [
        ...prevState.chatMessages,
        { id: modelMessageId, role: "model", content: "" },
      ],
    }));

    try {
      const modelToUse = modelNameOverride || this.modelName;
      const stream = await this.streamChatFn(
        currentChatHistory!,
        this.state.cells[this.state.slot],
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

      const { cleanContent, proposedChanges } =
        parseGeminiResponse(streamedText);

      this.setState((prevState) => ({
        chatMessages: prevState.chatMessages.map((msg) =>
          msg.id === modelMessageId
            ? { ...msg, content: streamedText, cleanContent, proposedChanges }
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
        ...prevState.cells[prevState.slot],
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

      const newCells = prevState.cells.map((slotCells, idx) =>
        idx === prevState.slot ? newCellsState : slotCells
      );

      return {
        cells: newCells,
        chatMessages: prevState.chatMessages.map((msg) =>
          msg.id === messageId ? { ...msg, reviewDecision: "applied" } : msg
        ),
      };
    });

    this.saveCellsToStorage();
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
