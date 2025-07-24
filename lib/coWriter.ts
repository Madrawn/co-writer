import type { MarkdownCellData, ChatMessage } from '../types';
import { parseGeminiResponse } from './parser';

export interface CoWriterState {
  cells: MarkdownCellData[];
  chatMessages: ChatMessage[];
  isLoading: boolean;
}

export type StreamChatFn = (
  historyWithNewMessage: ChatMessage[],
  cells: MarkdownCellData[],
  feedback: string | null
) => Promise<AsyncGenerator<{ text: string | undefined}>>;
type StateListener = (state: CoWriterState) => void;

const LOCAL_STORAGE_KEY = 'co-writer-notebook-cells';

const INITIAL_CELLS: MarkdownCellData[] = [
    {
        id: crypto.randomUUID(),
        content: `# Welcome to your Co-Writer Notebook!

This is a collaborative space for you and CoWriter. Here's how it works:

1.  **Edit Your Notes**: Click on this cell to start editing. The content is written in Markdown.
2.  **Add New Cells**: Use the "+ Add Cell" button to organize your thoughts.
3.  **Chat with CoWriter**: Use the chat panel on the right. Every time you send a message, the *entire content of this notebook* is sent to CoWriter as context.

CoWriter will always be up-to-date with your notes. Try asking it to summarize, expand upon, or refactor the content here! You can even ask it to "rewrite the first cell" and it will propose the change for you to approve.`
    }
];

const INITIAL_MESSAGES: ChatMessage[] = [
    {
        id: crypto.randomUUID(),
        role: 'model',
        content: "Hello! I'm CoWriter. I'm ready to help. Your notes are my context. What should we work on?"
    }
];

export class CoWriter {
    private state: CoWriterState;
    private listeners: Set<StateListener> = new Set();
    private feedbackForNextPrompt: string | null = null;
    private streamChatFn: StreamChatFn;
    constructor(streamChatFn: StreamChatFn) {
        this.streamChatFn = streamChatFn;
        this.state = {
            cells: this.loadCellsFromStorage(),
            chatMessages: INITIAL_MESSAGES,
            isLoading: false,
        };
    }

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
        this.listeners.forEach(listener => listener({ ...this.state }));
    }
    
    private setState(updater: (prevState: CoWriterState) => Partial<CoWriterState>) {
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

    private loadCellsFromStorage(): MarkdownCellData[] {
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

    public addCell = (content: string = ''): string => {
        const newCell: MarkdownCellData = { id: crypto.randomUUID(), content };
        this.setState(prevState => ({
            cells: [...prevState.cells, newCell]
        }));
        this.saveCellsToStorage();
        return newCell.id;
    };

    public deleteCell = (id: string) => {
        this.setState(prevState => ({
            cells: prevState.cells.filter(cell => cell.id !== id)
        }));
        this.saveCellsToStorage();
    };
    
    public updateCell = (id: string, content: string) => {
        this.setState(prevState => ({
            cells: prevState.cells.map(cell => (cell.id === id ? { ...cell, content } : cell))
        }));
        this.saveCellsToStorage();
    };

    public handleSendMessage = async (message: string) => {
        this.setState(() => ({ isLoading: true }));
        
        const newUserMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: message };
        let currentChatHistory: ChatMessage[];
        
        this.setState(prevState => {
            currentChatHistory = [...prevState.chatMessages, newUserMessage];
            return { chatMessages: currentChatHistory };
        });
        
        const modelMessageId = crypto.randomUUID();
        this.setState(prevState => ({
            chatMessages: [...prevState.chatMessages, { id: modelMessageId, role: 'model', content: '' }]
        }));

        try {
            const stream = await this.streamChatFn(currentChatHistory!, this.state.cells, this.feedbackForNextPrompt);
            if (this.feedbackForNextPrompt) {
                this.feedbackForNextPrompt = null;
            }

            let streamedText = '';
            for await (const chunk of stream) {
                streamedText += chunk.text;
                this.setState(prevState => ({
                    chatMessages: prevState.chatMessages.map(msg =>
                        msg.id === modelMessageId ? { ...msg, content: streamedText } : msg
                    )
                }));
            }

            const { cleanContent, proposedChanges } = parseGeminiResponse(streamedText);

            this.setState(prevState => ({
                chatMessages: prevState.chatMessages.map(msg =>
                    msg.id === modelMessageId ? { ...msg, content: streamedText, cleanContent, proposedChanges } : msg
                )
            }));

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            this.setState(prevState => ({
                chatMessages: prevState.chatMessages.map(msg =>
                    msg.id === modelMessageId ? { ...msg, content: `Sorry, I ran into an error: ${errorMessage}` } : msg
                )
            }));
        } finally {
            this.setState(() => ({ isLoading: false }));
        }
    };

    public handleApplyChanges = (messageId: string) => {
        const message = this.state.chatMessages.find(msg => msg.id === messageId);
        if (!message || !message.proposedChanges) return;
        
        const changesToApply = message.proposedChanges;

        this.setState(prevState => {
            let newCellsState = [...prevState.cells];
            const cellsToUpdate = new Map<string, string>();
            const cellsToAdd: MarkdownCellData[] = [];
            const existingCellIds = new Set(newCellsState.map(c => c.id));

            changesToApply.forEach(change => {
                if (change.targetCellId === 'new') {
                    cellsToAdd.push({ id: crypto.randomUUID(), content: change.newContent });
                } else if (existingCellIds.has(change.targetCellId)) {
                    cellsToUpdate.set(change.targetCellId, change.newContent);
                } else {
                    cellsToAdd.push({ id: change.targetCellId, content: change.newContent });
                }
            });
            
            newCellsState = newCellsState.map(cell => 
                cellsToUpdate.has(cell.id) 
                    ? { ...cell, content: cellsToUpdate.get(cell.id)! } 
                    : cell
            );

            newCellsState.push(...cellsToAdd);

            return {
                cells: newCellsState,
                chatMessages: prevState.chatMessages.map(msg => 
                    msg.id === messageId ? { ...msg, reviewDecision: 'applied' } : msg
                )
            };
        });
        
        this.saveCellsToStorage();
        this.feedbackForNextPrompt = `[User feedback: The previous changes were applied.]`;
    };

    public handleRejectChanges = (messageId: string) => {
        this.setState(prevState => ({
            chatMessages: prevState.chatMessages.map(msg => 
                msg.id === messageId ? { ...msg, reviewDecision: 'rejected' } : msg
            )
        }));
        this.feedbackForNextPrompt = `[User feedback: The previous changes were rejected.]`;
    };
}
