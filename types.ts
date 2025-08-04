
export interface MarkdownCellData {
  id: string;
  content: string;
}

export type MessageRole = "user" | "model";

export interface ProposedChange {
  targetCellId: string; // 'new' or an existing cell ID
  newContent: string;
}
export const models = {
  "DeepSeek-R1-0528": {
    // client: () =>
    //   ModelClient(endpoint, new AzureKeyCredential(apiKey), {
    //     apiVersion: "2024-05-01-preview",
    //   }),
  },
  "gpt-4.1": {
    // client: () =>
    //   ModelClient(
    //     endpoint_oa + "/deployments/gpt-4.1/",
    //     new AzureKeyCredential(apiKey),
    //     options
    //   ),
  },
  "o4-mini": {
    // client: () =>
    //   ModelClient(
    //     endpoint_oa + "/deployments/o4-mini/",
    //     new AzureKeyCredential(apiKey),
    //     options
    //   ),
  },
};
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  // The content without the ---CELL--- blocks
  cleanContent?: string;
  // Code changes proposed by the model
  proposedChanges?: ProposedChange[];
  // Tracks the user's decision on the proposed changes
  reviewDecision?: "applied" | "rejected";
}
export type StreamChatFn = (
  historyWithNewMessage: ChatMessage[],
  cells: MarkdownCellData[],
  feedback: string | null,
  modelName: keyof typeof models
) => Promise<AsyncGenerator<{ text: string | undefined }>>;

export interface CoWriterState {
  notebooks: MarkdownCellData[][]; // renamed from 'cells'
  chatMessages: ChatMessage[];
  isLoading: boolean;
  selectedNotebook: number; // renamed from 'slot'
}
export type StateListener = (state: CoWriterState) => void;
