import type { ProposedChange } from '../types';

const CHANGE_BLOCK_REGEX = /---CELL:(.*?)---\r?\n([\s\S]*?)\r?\n---CELL---/g;

export function parseGeminiResponse(responseText: string): {
  cleanContent: string;
  proposedChanges: ProposedChange[];
} {
  const proposedChanges: ProposedChange[] = [];
  const cleanContent = responseText.replace(
    CHANGE_BLOCK_REGEX,
    (match, targetCellId, newContent) => {
      proposedChanges.push({
        targetCellId: targetCellId.trim(),
        newContent: newContent.trim(),
      });
      return ''; // Remove the block from the content
    }
  ).trim();

  return { cleanContent, proposedChanges };
}
