import type { ProposedChange } from '../types';

const CHANGE_BLOCK_REGEX = /^[ \t]*---CELL:(.*?)---[ \t]*\r?\n([\s\S]*?)[ \t]*\r?\n[ \t]*---CELL---[ \t]*(?:\r?\n)*/gm;

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
    (_, targetCellId, newContent) => {
      proposedChanges.push({
        targetCellId: targetCellId.trim(),
        newContent: newContent.trim(),
      });
      return ''; // Remove the block from the content
    }
  ).trim();

  return { cleanContent, proposedChanges };
}
