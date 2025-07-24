// azureTTSService.ts

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

export function playAudioBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
  audio.onended = () => URL.revokeObjectURL(url);
}
