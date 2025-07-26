import { describe, it, expect } from 'vitest';
import { parseGeminiResponse } from './parser';

// lib/parser.test.ts

// Mock ProposedChange type for type safety (if needed)
type ProposedChange = { targetCellId: string; newContent: string };

describe('parseGeminiResponse - cleanContent', () => {
  it('returns the whole text if there are no change blocks', () => {
    const input = 'Hello world!\nThis is a test.';
    const { cleanContent } = parseGeminiResponse(input);
    expect(cleanContent).toBe('Hello world!\nThis is a test.');
  });

  it('removes a single change block from the content', () => {
    const input = `Some intro text.
---CELL:abc123---
new content here
---CELL---
Some outro text.`;
    const { cleanContent } = parseGeminiResponse(input);
    expect(cleanContent).toBe('Some intro text.\nSome outro text.');
  });

  it('removes multiple change blocks from the content', () => {
    const input = `Header
---CELL:cell1---
foo
---CELL---
Middle
---CELL:cell2---
bar
---CELL---
Footer`;
    const { cleanContent } = parseGeminiResponse(input);
    expect(cleanContent).toBe('Header\nMiddle\nFooter');
  });

  it('handles text before and after change blocks', () => {
    const input = `Start
---CELL:cellX---
replace me
---CELL---
End`;
    const { cleanContent } = parseGeminiResponse(input);
    expect(cleanContent).toBe('Start\nEnd');
  });

  it('ignores text before </think> if present', () => {
    const input = `Some thoughts...
</think>
Visible text.
---CELL:cellA---
hidden
---CELL---
After block.`;
    const { cleanContent } = parseGeminiResponse(input);
    expect(cleanContent).toBe('Visible text.\nAfter block.');
  });

  it('returns empty string if only change blocks are present', () => {
    const input = `---CELL:cellOnly---
just content
---CELL---`;
    const { cleanContent } = parseGeminiResponse(input);
    expect(cleanContent).toBe('');
  });

  it('handles whitespace and newlines around change blocks', () => {
    const input = `Line1

---CELL:cellZ---
zzz
---CELL---

Line2
`;
    const { cleanContent } = parseGeminiResponse(input);
    expect(cleanContent).toBe('Line1\n\nLine2');
  });

  it('handles accidental whitespace around the cell tags', () => {
    const input = `Line1

 ---CELL:cellZ---  
zzz
  ---CELL---  

Line2
`;
    const { cleanContent } = parseGeminiResponse(input);
    expect(cleanContent).toBe('Line1\n\nLine2');
  });

  it('handles no content after </think>', () => {
    const input = `Random stuff
</think>`;
    const { cleanContent } = parseGeminiResponse(input);
    expect(cleanContent).toBe('');
  });
});