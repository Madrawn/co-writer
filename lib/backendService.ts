// backendService.ts

import type { ChatMessage, MarkdownCellData } from '../types';

export const streamChatResponse = async (
  historyWithNewMessage: ChatMessage[],
  cells: MarkdownCellData[],
  feedback: string | null,
  modelName: string
): Promise<AsyncGenerator<{ text: string | undefined }>> => {
  const response = await fetch('/api/co-writer/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      historyWithNewMessage, 
      cells, 
      feedback, 
      modelName 
    }),
  });

  if (!response.ok) {
    throw new Error(`Backend request failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Response body is undefined");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  async function* generate() {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      try {
        const data = JSON.parse(chunk);
        yield { text: data.text };
      } catch (e) {
        console.error('Error parsing chunk:', chunk, e);
      }
    }
  }

  return generate();
};