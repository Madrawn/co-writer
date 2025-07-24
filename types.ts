export interface MarkdownCellData {
  id: string;
  content: string;
}

export type MessageRole = 'user' | 'model';

export interface ProposedChange {
  targetCellId: string; // 'new' or an existing cell ID
  newContent: string;
}

export interface ChatMessage {
  id:string;
  role: MessageRole;
  content: string;
  // The content without the ---CELL--- blocks
  cleanContent?: string;
  // Code changes proposed by the model
  proposedChanges?: ProposedChange[];
  // Tracks the user's decision on the proposed changes
  reviewDecision?: 'applied' | 'rejected';
}
