import { useState, useRef, useCallback } from 'react';
import { Message } from '../types';
import { generateId } from '../lib/utils';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

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

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
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
    
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;
    
    setStatus('idle');
  }, []);

  const startLiveVoice = useCallback(async () => {
    try {
      setStatus('connecting');
      setError(null);
      setDuration(0);
      setTranscript([]);
      
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setError("Chave da API Gemini não configurada.");
        setStatus('error');
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "Você é o Nexus Core, um assistente de IA. Responda sempre em português do Brasil de forma natural e conversacional.",
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
              })
              .catch(err => {
                setError("Permissão do microfone necessária para conversa ao vivo.");
                stopLiveVoice();
              });
          },
          onmessage: (message: LiveServerMessage) => {
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
    startLiveVoice,
    stopLiveVoice
  };
}
