import { describe, it, expect } from 'vitest';
import { buildPrompt } from './promptBuilder';

// lib/promptBuilder.test.ts

// Mock types
type ChatMessage = { role: 'user' | 'assistant', content: string };
type MarkdownCellData = { id: string, content: string };

describe('buildPrompt - historyForAPI', () => {
    const dummyCells: MarkdownCellData[] = [];
    const dummyFeedback = null;

    it('throws if history is empty', () => {
        expect(() => buildPrompt([], dummyCells, dummyFeedback)).toThrow();
    });

    it('throws if last message is not from user', () => {
        const history: ChatMessage[] = [
            { role: 'user', content: 'Hi' },
            { role: 'assistant', content: 'Hello!' }
        ];
        expect(() => buildPrompt(history, dummyCells, dummyFeedback)).toThrow();
    });

    it('historyForAPI is empty if only one user message', () => {
        const history: ChatMessage[] = [
            { role: 'user', content: 'Just me' }
        ];
        const { contents } = buildPrompt(history, dummyCells, dummyFeedback);
        // Only the final user message should be present
        expect(contents.length).toBe(1);
        expect(contents[0].role).toBe('user');
        expect(contents[0].parts[0].text).toContain('Just me');
    });

    it('historyForAPI includes all but last message, mapped correctly', () => {
        const history: ChatMessage[] = [
            { role: 'user', content: 'First question' },
            { role: 'assistant', content: 'First answer' },
            { role: 'user', content: 'Second question' }
        ];
        const { contents } = buildPrompt(history, dummyCells, dummyFeedback);
        // Should have 3: 2 from historyForAPI, 1 final user
        expect(contents.length).toBe(3);
        expect(contents[0]).toEqual({ role: 'user', parts: [{ text: 'First question' }] });
        expect(contents[1]).toEqual({ role: 'assistant', parts: [{ text: 'First answer' }] });
        // The last one is the user prompt with context
        expect(contents[2].role).toBe('user');
        expect(contents[2].parts[0].text).toContain('Second question');
    });

    it('historyForAPI preserves order and content', () => {
        const history: ChatMessage[] = [
            { role: 'user', content: 'Q1' },
            { role: 'assistant', content: 'A1' },
            { role: 'user', content: 'Q2' },
            { role: 'assistant', content: 'A2' },
            { role: 'user', content: 'Q3' }
        ];
        const { contents } = buildPrompt(history, dummyCells, dummyFeedback);
        expect(contents.length).toBe(5);
        expect(contents[0]).toEqual({ role: 'user', parts: [{ text: 'Q1' }] });
        expect(contents[1]).toEqual({ role: 'assistant', parts: [{ text: 'A1' }] });
        expect(contents[2]).toEqual({ role: 'user', parts: [{ text: 'Q2' }] });
        expect(contents[3]).toEqual({ role: 'assistant', parts: [{ text: 'A2' }] });
        expect(contents[4].role).toBe('user');
        expect(contents[4].parts[0].text).toContain('Q3');
    });
});