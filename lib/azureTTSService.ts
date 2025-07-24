export async function speakTextWithAzureTTS(text: string, voice: string = "alloy") {
  const endpoint = "https://dengl-mdao3ydu-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-4o-mini-tts/audio/speech?api-version=2025-03-01-preview";
  const apiKey = process.env.AZURE_TTS_API_KEY;
  if (!apiKey) throw new Error("AZURE_TTS_API_KEY environment variable not set");

  const body = {
    model: "gpt-4o-mini-tts",
    input: text,
    voice,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Azure TTS request failed: ${response.status}`);
  }

  const audioBlob = await response.blob();
  return audioBlob;
}

export function playAudioBlob(blob: Blob): Promise<void> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
  });
}

// New chunk-based TTS processor
export async function speakTextInChunks(
  text: string, 
  voice: string = "alloy",
  maxConcurrent: number = 2
) {
  // Split text into sentences while preserving punctuation
  const sentences = text.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s+/g);
  const chunks: string[] = [];
  
  // Group sentences into chunks (4 sentences per chunk)
  for (let i = 0; i < sentences.length; i += 4) {
    chunks.push(sentences.slice(i, i + 4).join(' '));
  }

  const audioQueue: {index: number, blob: Blob}[] = [];
  let currentIndex = 0;
  let isPlaying = false;

  // Playback manager
  const playNext = async () => {
    if (isPlaying || currentIndex >= audioQueue.length) return;
    
    const nextItem = audioQueue.find(item => item.index === currentIndex);
    if (!nextItem) return;
    
    isPlaying = true;
    await playAudioBlob(nextItem.blob);
    currentIndex++;
    isPlaying = false;
    
    // Process next in queue
    playNext();
  };

  // Process chunks with limited concurrency
  const processChunk = async (chunk: string, index: number) => {
    try {
      const blob = await speakTextWithAzureTTS(chunk, voice);
      audioQueue.push({ index, blob });
      audioQueue.sort((a, b) => a.index - b.index);
      
      // Start playback if not already playing
      if (!isPlaying) playNext();
    } catch (error) {
      console.error(`Error processing chunk ${index}:`, error);
    }
  };

  // Create processing batches
  for (let i = 0; i < chunks.length; i += maxConcurrent) {
    const batch = chunks.slice(i, i + maxConcurrent);
    await Promise.all(batch.map((chunk, idx) => processChunk(chunk, i + idx)));
  }
}