import { useState } from "react";
import {
  sendMessageSync,
  sendExtendedThinking,
  sendVision,
  searchMemories,
  transcribeAudio,
  generateImage,
} from "../lib/api";
import { Message, ToolState } from "../types";
import { generateId } from "../lib/utils";

export function useNexusAPI() {
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = async (
    content: string,
    tools: ToolState,
    image?: string,
    audio?: { base64: string; mimeType: string }
  ): Promise<{ responseMsg: Message; transcribedText?: string }> => {
    setIsThinking(true);
    try {
      let finalContent = content;
      let responseText = "";
      let thinkingTime = 0;
      let transcribedText = "";

      const activeTools = Object.entries(tools)
        .filter(([_, isActive]) => isActive)
        .map(([key]) => key);

      if (audio) {
        try {
          const res = await transcribeAudio(audio.base64, audio.mimeType);
          transcribedText = res.transcription;
          finalContent = transcribedText;
        } catch (err: any) {
          throw new Error("Falha ao transcrever áudio. Tente novamente.");
        }
      }

      if (tools.memories && finalContent) {
        const memories = await searchMemories(finalContent);
        if (memories.length > 0) {
          const context = memories.map((m) => m.content).join("\n");
          finalContent = `[Contexto da Memória:\n${context}]\n\nMensagem: ${finalContent}`;
        }
      }

      const startTime = Date.now();

      if (tools.extended_thinking && finalContent) {
        const res = await sendExtendedThinking(finalContent);
        responseText = res.response;
      } else if (tools.image_generation && finalContent) {
        const res = await generateImage(finalContent);
        responseText = "Aqui está a imagem gerada:";
        return {
          responseMsg: {
            id: generateId(),
            role: "agent",
            content: responseText,
            timestamp: Date.now(),
            image: `data:image/png;base64,${res.image_base64}`,
            thinkingTime: (Date.now() - startTime) / 1000,
          },
          transcribedText: audio ? transcribedText : undefined
        };
      } else if (tools.vision && image) {
        const res = await sendVision(
          image,
          finalContent || "Descreva esta imagem.",
        );
        responseText = res.description;
      } else if (finalContent) {
        const res = await sendMessageSync(finalContent, activeTools);
        responseText = res.response;
        thinkingTime = res.thinking_time || 0;
      } else {
        throw new Error("Mensagem vazia.");
      }

      if (!thinkingTime) {
        thinkingTime = (Date.now() - startTime) / 1000;
      }

      return {
        responseMsg: {
          id: generateId(),
          role: "agent",
          content: responseText,
          timestamp: Date.now(),
          thinkingTime,
        },
        transcribedText: audio ? transcribedText : undefined
      };
    } finally {
      setIsThinking(false);
    }
  };

  return { sendMessage, isThinking };
}
