import type { ProposedChange } from '../types';

const CHANGE_BLOCK_REGEX = /---CELL:(.*?)---\r?\n([\s\S]*?)\r?\n---CELL---/g;

export function parseGeminiResponse(responseText: string): {
  cleanContent: string;
  proposedChanges: ProposedChange[];
} {
  // Ignore all text before '</think>' if present
  const thinkTag = '</think>';
  const thinkIndex = responseText.indexOf(thinkTag);
  const trimmedText = thinkIndex !== -1 ? responseText.slice(thinkIndex + thinkTag.length) : responseText;

  const proposedChanges: ProposedChange[] = [];
  const cleanContent = trimmedText.replace(
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
