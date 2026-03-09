import { Message, NexusHealth, ToolState } from "../types";

export const getBaseUrl = () =>
  localStorage.getItem("nexus_url") || "http://85.209.92.152:8600";

export async function fetchHealth(): Promise<
  NexusHealth & { latency?: number }
> {
  try {
    const start = Date.now();
    const res = await fetch(`${getBaseUrl()}/health`);
    const latency = Date.now() - start;
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    return { ...data, latency };
  } catch (error) {
    return {
      status: "offline",
      version: "unknown",
      heartBeating: false,
      oodaRunning: false,
    };
  }
}

export async function sendMessageSync(
  content: string,
  tools: string[],
  retryCount = 0,
): Promise<{ response: string; thinking_time?: number }> {
  try {
    const res = await fetch(`${getBaseUrl()}/message/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, source: "web_chat", tools }),
    });

    if (!res.ok) {
      if (res.status === 504)
        throw new Error(
          "O Nexus demorou demais pra responder. Tente novamente.",
        );
      if (res.status >= 500) {
        if (retryCount < 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return sendMessageSync(content, tools, retryCount + 1);
        }
        throw new Error("Servidor indisponível.");
      }
      throw new Error("Sem conexão com o Nexus Core.");
    }

    return await res.json();
  } catch (error: any) {
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError")
    ) {
      throw new Error("Sem conexão com o Nexus Core.");
    }
    throw error;
  }
}

export async function sendExtendedThinking(
  prompt: string,
): Promise<{ response: string }> {
  const res = await fetch(`${getBaseUrl()}/api/senses/think`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, temperature: 0.7, max_tokens: 2048 }),
  });

  if (!res.ok) throw new Error("Falha no pensamento estendido.");
  return await res.json();
}

export async function sendVision(
  imageBase64: string,
  prompt: string,
): Promise<{ description: string }> {
  const res = await fetch(`${getBaseUrl()}/api/senses/see`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_base64: imageBase64, prompt }),
  });

  if (!res.ok) throw new Error("Falha na análise de imagem.");
  return await res.json();
}

export async function searchMemories(
  query: string,
): Promise<Array<{ content: string; score: number }>> {
  try {
    const res = await fetch(`${getBaseUrl()}/memories/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 3 }),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

export async function transcribeAudio(
  audioBase64: string,
  mimetype: string,
): Promise<{ transcription: string }> {
  const res = await fetch(`${getBaseUrl()}/api/senses/hear`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio_base64: audioBase64, mimetype }),
  });

  if (!res.ok) throw new Error("Falha na transcrição de áudio.");
  return await res.json();
}

export async function synthesizeSpeech(
  text: string,
): Promise<{ audio_base64: string }> {
  const res = await fetch(`${getBaseUrl()}/api/senses/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language: "pt-BR" }),
  });

  if (!res.ok) throw new Error("Falha na síntese de voz.");
  return await res.json();
}
