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
      modelName,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Backend request failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Backend response body is null.');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  async function* generate() {
    let incompleteChunk = ''; // Store any incomplete JSON chunks

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const combinedChunk = incompleteChunk + chunk;
      const jsonChunks = combinedChunk.split('\n').filter(Boolean); // Split into JSON chunks and filter out empty strings

      for (const jsonChunk of jsonChunks) {
        try {
          if (jsonChunk === 'data: [DONE]') {
            console.log('Stream ended by server');
            return; // End the generator if the server indicates completion
          }
          const data = JSON.parse(jsonChunk.replace("data: ", ''))
          if (data.choices && data.choices.length > 0) {
            // If the chunk is complete, yield the text
            console.log('Parsed chunk:', data);
            yield { text: data.choices[0]?.delta?.content };
            incompleteChunk = ''; // Reset incompleteChunk after successful parse
          }
        } catch (e) {
          console.warn('Error parsing chunk:', jsonChunk, e);
          incompleteChunk = jsonChunk; // Store incomplete chunk for next iteration
        }
      }
    }

    // Handle any remaining incomplete chunk
    if (incompleteChunk) {
      console.warn('Remaining incomplete chunk:', incompleteChunk);
    }
  }

  return generate();
};