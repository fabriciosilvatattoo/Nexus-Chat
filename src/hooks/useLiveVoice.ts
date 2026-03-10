import { useState, useRef, useCallback } from 'react';
import { Message } from '../types';
import { generateId } from '../lib/utils';
import { getBaseUrl } from '../lib/api';
import { GoogleGenAI, Modality, LiveServerMessage, Type } from "@google/genai";

const nexusTools = [
  {
    functionDeclarations: [
      {
        name: "consultar_nexus",
        description: "Envia uma pergunta ou comando para o Nexus Core (o cérebro do sistema). Use sempre que precisar: buscar informações, executar tarefas, acessar memórias, mandar mensagens, verificar status de serviços, ou qualquer coisa que exija processamento.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            mensagem: {
              type: Type.STRING,
              description: "A mensagem ou comando para enviar ao Nexus Core. Seja específico."
            }
          },
          required: ["mensagem"]
        }
      },
      {
        name: "buscar_memoria",
        description: "Busca nas memórias do sistema por informações relevantes. Use quando o usuário perguntar sobre algo que aconteceu antes, decisões passadas, ou informações salvas.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            consulta: {
              type: Type.STRING,
              description: "O que buscar nas memórias"
            }
          },
          required: ["consulta"]
        }
      },
      {
        name: "renderizar_canvas",
        description: "Gera e mostra uma interface visual na tela do Fabrício. Use quando ele pedir para mostrar, exibir, criar ou visualizar algo na tela. Por exemplo: 'mostra um painel de status', 'crie um dashboard', 'exibe os leads do mês'.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            prompt: {
              type: Type.STRING,
              description: "O que gerar e mostrar na tela. Seja descritivo sobre o layout desejado."
            }
          },
          required: ["prompt"]
        }
      }
    ]
  }
];

export type LiveVoiceStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

const base64ToFloat32Array = (base64: string) => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) float32Array[i] = int16Array[i] / 32768.0;
  return float32Array;
};

const float32ToBase64 = (float32Array: Float32Array) => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
};

export function useLiveVoice() {
  const [status, setStatus] = useState<LiveVoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const speechRecognitionRef = useRef<any>(null);
  
  // Audio playback queue
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);

  const updateAudioLevel = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      setAudioLevel(average / 255); // Normalize 0-1
    } else {
      setAudioLevel(0);
    }
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const playNextAudioChunk = () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setStatus(prev => prev === 'speaking' ? 'listening' : prev);
      return;
    }

    isPlayingRef.current = true;
    setStatus('speaking');
    
    const chunk = audioQueueRef.current.shift()!;
    const audioBuffer = audioContextRef.current.createBuffer(1, chunk.length, 24000);
    audioBuffer.getChannelData(0).set(chunk);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);

    const currentTime = audioContextRef.current.currentTime;
    const playTime = Math.max(currentTime, nextPlayTimeRef.current);
    
    source.start(playTime);
    nextPlayTimeRef.current = playTime + audioBuffer.duration;

    source.onended = () => {
      playNextAudioChunk();
    };
  };

  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      const newState = !prev;
      isPausedRef.current = newState;
      return newState;
    });
  }, []);

  const stopLiveVoice = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => {
        if (session && typeof session.close === 'function') {
          session.close();
        }
      });
      sessionRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
    
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;
    
    setStatus('idle');
    setIsPaused(false);
    isPausedRef.current = false;
  }, []);

  const startLiveVoice = useCallback(async () => {
    try {
      setStatus('connecting');
      setError(null);
      setDuration(0);
      setTranscript([]);
      
      const API_KEYS = [
        import.meta.env.VITE_GEMINI_KEY_1,
        import.meta.env.VITE_GEMINI_KEY_2,
        import.meta.env.VITE_GEMINI_KEY_3,
        import.meta.env.VITE_GEMINI_KEY_4,
        import.meta.env.VITE_GEMINI_KEY_5,
      ].filter(Boolean);

      let keyIndex = Math.floor(Math.random() * API_KEYS.length);
      const apiKey = API_KEYS[keyIndex] || import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        setError("Chave da API Gemini não configurada.");
        setStatus('error');
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      // Setup Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          if (isPausedRef.current) return;
          const lastResult = event.results[event.results.length - 1];
          if (lastResult.isFinal) {
            const text = lastResult[0].transcript;
            
            const userMsg: Message = {
              id: generateId(),
              role: "user",
              content: text,
              timestamp: Date.now(),
              tools: ["voice"]
            };
            
            setTranscript(prev => [...prev, userMsg]);
            
            // Send to memory
            const coreUrl = getBaseUrl();
            
            fetch(`${coreUrl}/memories/store`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: `Transcrição voz [${new Date().toLocaleTimeString()}]: Fabrício disse: '${text}'`,
                category: "voice_transcript",
                tags: ["voice", "transcript"]
              })
            }).catch(() => {});
          }
        };
        
        recognition.onerror = () => {};
        speechRecognitionRef.current = recognition;
      }
      
      const handleToolCall = async (toolCall: any, sessionPromise: Promise<any>) => {
        const session = await sessionPromise;
        const functionResponses = [];
        
        // URL do Nexus Core (pegar das settings)
        const coreUrl = getBaseUrl();
        
        for (const fc of toolCall.functionCalls) {
          let result = {};
          
          try {
            if (fc.name === "consultar_nexus") {
              // Chama o Nexus Core via /message/sync
              const response = await fetch(`${coreUrl}/message/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  content: fc.args.mensagem,
                  source: "live_voice",
                  tools: []
                })
              });
              
              if (response.ok) {
                const data = await response.json();
                result = { resposta: data.response || "Sem resposta do Core" };
              } else {
                result = { erro: "Nexus Core não respondeu" };
              }
            } 
            else if (fc.name === "buscar_memoria") {
              // Chama a busca de memórias
              const response = await fetch(`${coreUrl}/memories/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  query: fc.args.consulta,
                  limit: 3
                })
              });
              
              if (response.ok) {
                const memories = await response.json();
                const resumo = Array.isArray(memories) 
                  ? memories.map((m: any) => m.content).join("\n---\n")
                  : "Nenhuma memória encontrada";
                result = { memorias: resumo };
              } else {
                result = { erro: "Serviço de memória indisponível" };
              }
            }
            else if (fc.name === "renderizar_canvas") {
              const response = await fetch(`${coreUrl}/api/canvas/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: fc.args.prompt })
              });
              
              if (response.ok) {
                const data = await response.json();
                result = { status: "Visualização gerada e aparecendo na tela", event_id: data.event_id };
              } else {
                result = { erro: "Não consegui gerar a visualização" };
              }
            }
          } catch (error: any) {
            result = { erro: `Falha na conexão: ${error.message}` };
          }
          
          functionResponses.push({
            name: fc.name,
            id: fc.id,
            response: { result }
          });
        }
        
        // Enviar resultado de volta para o modelo de voz
        session.sendToolResponse({ functionResponses });
      };

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
          systemInstruction: `Você é o Nexus, o assistente pessoal do Fabrício. Fale sempre em português do Brasil, de forma natural e direta, como um parceiro de trabalho.

Personalidade:
- Tom: parceiro, direto, sem enrolação. Use expressões como "beleza", "sacou?", "fechou"
- Seja conciso: respostas de 2-3 frases no máximo
- Nunca fale de forma robótica ou formal demais
- Se não souber algo, diga "não sei" em vez de inventar

Contexto:
- Você é parte de um sistema maior que tem acesso a ferramentas, memórias e serviços
- Quando o Fabrício pedir algo que exige ação (buscar dados, executar comando, etc), diga algo como "Deixa eu verificar..." ou "Um segundo que eu vou ver isso..."
- Você pode falar sobre qualquer assunto, mas seu foco é ajudar o Fabrício com tecnologia, negócios e projetos

Importante:
- NUNCA revele que é um modelo de IA genérico. Você é o NEXUS.
- Se perguntarem seu nome, diga "Sou o Nexus, seu parceiro de trabalho"
- Fale como se estivesse numa conversa ao vivo entre amigos que trabalham juntos

Ferramentas disponíveis:
- Quando precisar de informações, executar algo, ou acessar o sistema, use a ferramenta "consultar_nexus"
- Quando precisar lembrar de algo do passado, use "buscar_memoria"
- Enquanto a ferramenta processa, continue conversando naturalmente. Diga algo como "Deixa eu verificar..." ou "Um segundo..."
- Quando receber o resultado da ferramenta, incorpore a informação na conversa de forma natural
- NUNCA diga que não pode fazer algo se tem uma ferramenta disponível para isso`,
          tools: nexusTools,
        },
        callbacks: {
          onopen: () => {
            setStatus('listening');
            
            // Start timer
            timerRef.current = window.setInterval(() => {
              setDuration(prev => prev + 1);
            }, 1000);

            // Start audio capture
            navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } })
              .then(stream => {
                mediaStreamRef.current = stream;
                audioContextRef.current = new AudioContext({ sampleRate: 16000 });
                const source = audioContextRef.current.createMediaStreamSource(stream);
                
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.fftSize = 256;
                source.connect(analyserRef.current);
                updateAudioLevel();

                // Use ScriptProcessorNode for raw PCM data
                const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;
                
                processor.onaudioprocess = (e) => {
                  if (isPausedRef.current) return;
                  
                  const inputData = e.inputBuffer.getChannelData(0);
                  const base64PCM = float32ToBase64(inputData);
                  
                  sessionPromise.then(session => {
                    if (sessionRef.current) {
                      session.sendRealtimeInput({
                        media: { data: base64PCM, mimeType: 'audio/pcm;rate=16000' }
                      });
                    }
                  });
                };

                source.connect(processor);
                processor.connect(audioContextRef.current.destination); // Required for script processor to work
                
                if (speechRecognitionRef.current) {
                  try {
                    speechRecognitionRef.current.start();
                  } catch (e) {}
                }
              })
              .catch(err => {
                setError("Permissão do microfone necessária para conversa ao vivo.");
                stopLiveVoice();
              });
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.toolCall) {
              handleToolCall(message.toolCall, sessionPromise);
              return;
            }
            
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const float32Data = base64ToFloat32Array(base64Audio);
              audioQueueRef.current.push(float32Data);
              if (!isPlayingRef.current) {
                playNextAudioChunk();
              }
            }
            
            if (message.serverContent?.interrupted) {
               audioQueueRef.current = [];
               isPlayingRef.current = false;
               nextPlayTimeRef.current = 0;
               setStatus('listening');
            }

            const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (text) {
              const agentMsg: Message = {
                id: generateId(),
                role: "agent",
                content: text,
                timestamp: Date.now(),
                tools: ["voice"]
              };
              setTranscript(prev => [...prev, agentMsg]);
              
              const coreUrl = getBaseUrl();
              
              fetch(`${coreUrl}/memories/store`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  content: `Transcrição voz [${new Date().toLocaleTimeString()}]: Nexus respondeu: '${text}'`,
                  category: "voice_transcript",
                  tags: ["voice", "transcript"]
                })
              }).catch(() => {});
            } else if (base64Audio && !text) {
              // We got audio but no text, we could add a placeholder, but it might be spammy
            }
          },
          onclose: () => {
            stopLiveVoice();
          },
          onerror: (err: any) => {
            setError(err.message || "Erro na conexão com o Gemini Live.");
            setStatus('error');
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err: any) {
      setError(err.message || "Não foi possível conectar ao serviço de voz.");
      setStatus('error');
    }
  }, [stopLiveVoice]);

  return {
    status,
    error,
    duration,
    transcript,
    audioLevel,
    isPaused,
    togglePause,
    startLiveVoice,
    stopLiveVoice
  };
}
