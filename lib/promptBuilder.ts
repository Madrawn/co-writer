import type { ChatMessage, MarkdownCellData } from '../types';

export const formatContext = (cells: MarkdownCellData[]): string => {
    if (cells.length === 0) {
        return "This is our shared scratchpad. It's currently empty.";
    }
    const content = cells.map(cell => 
        `---CELL START (id: ${cell.id})---\n${cell.content}\n---CELL END---`
    ).join('\n\n');
    return `This is our shared scratchpad. Refer to it as the primary context for my query. Each cell has an ID.

---CONTEXT---
${content}
---END CONTEXT---`;
};

export const systemInstruction = `You are an expert assistant. The user's notebook content is provided, with each cell marked by "---CELL START (id: ...)---" and "---CELL END---".

When you want to suggest modifications to the notebook, you MUST use the following format in your response. You can suggest multiple changes.

To **replace** the content of an existing cell, use:
---CELL:{cell_id}---
{new_markdown_content}
---CELL---

To **add** a new cell at the end of the notebook, use:
---CELL:new---
{new_markdown_content}
---CELL---

Any text outside of these special blocks will be treated as your regular chat response. For example:
"Sure, I've updated the cell with a numbered list for you.

---CELL:a1b2-c3d4-e5f6---
1. First item
2. Second item
---CELL---

Let me know if you need anything else!"

After the notebook context, you may receive a feedback message from the user, like "[User feedback: The previous changes were applied.]". Use this to understand if your suggestions were accepted or rejected and adjust your follow-up responses accordingly.
`;

export const buildPrompt = (
    historyWithNewMessage: ChatMessage[],
    cells: MarkdownCellData[],
    feedback: string | null
): { contents: any[], systemInstruction: string } => {
    const historyForAPI = historyWithNewMessage.slice(0, -1).map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));

    const lastMessage = historyWithNewMessage[historyWithNewMessage.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error('The last message in the history must be from the user.');
    }

    let context = formatContext(cells);
    if (feedback) {
        context += `\n\n${feedback}`;
    }
    const finalUserPrompt = `${context}\n\nMy query is: ${lastMessage.content}`;

    const contents = [
        ...historyForAPI,
        { role: 'user' as const, parts: [{ text: finalUserPrompt }] }
    ];

    return { contents, systemInstruction };
};
