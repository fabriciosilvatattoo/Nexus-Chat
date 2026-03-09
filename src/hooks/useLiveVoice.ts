import { useState, useRef, useCallback } from 'react';
import { Message } from '../types';
import { generateId } from '../lib/utils';

export type LiveVoiceStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

export function useLiveVoice() {
  const [status, setStatus] = useState<LiveVoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    
    const voices = speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt') && v.name.includes('female'))
      || voices.find(v => v.lang.startsWith('pt'))
      || voices[0];
      
    if (ptVoice) utterance.voice = ptVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setStatus(prev => prev !== 'idle' ? 'speaking' : 'idle');
    utterance.onend = () => setStatus(prev => prev !== 'idle' ? 'listening' : 'idle');
    
    speechSynthesis.speak(utterance);
  };

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

  const stopLiveVoice = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current.stop();
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    
    speechSynthesis.cancel();
    
    setStatus('idle');
  }, []);

  const startLiveVoice = useCallback(async () => {
    try {
      setStatus('connecting');
      setError(null);
      setDuration(0);
      setTranscript([]);
      
      const wsUrl = localStorage.getItem("nexus_ws_url") || "wss://involvement-mandate-needed-unable.trycloudflare.com/live";
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setStatus('listening');
        
        // Start timer
        timerRef.current = window.setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          // Setup audio analyzer
          audioContextRef.current = new AudioContext();
          const source = audioContextRef.current.createMediaStreamSource(stream);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          source.connect(analyserRef.current);
          updateAudioLevel();

          const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
            ? 'audio/webm' 
            : 'audio/ogg';
            
          const mediaRecorder = new MediaRecorder(stream, { mimeType });
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                ws.send(JSON.stringify({
                  audio: base64,
                  mime_type: mimeType
                }));
              };
              reader.readAsDataURL(e.data);
            }
          };

          // Capture audio in small chunks (e.g., 500ms)
          mediaRecorder.start(500);
        } catch (err: any) {
          setError("Permissão do microfone necessária para conversa ao vivo.");
          stopLiveVoice();
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.text) {
            // Add to transcript
            setTranscript(prev => [...prev, {
              id: generateId(),
              role: 'agent',
              content: data.text,
              timestamp: Date.now()
            }]);
            
            // Speak the text
            speakText(data.text);
          } else if (data.error) {
            setError(data.error);
          }
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      ws.onerror = () => {
        setError("Não foi possível conectar ao serviço de voz. Verifique sua conexão.");
        setStatus('error');
      };

      ws.onclose = () => {
        if (wsRef.current === ws) {
          stopLiveVoice();
        }
      };

    } catch (err) {
      setError("Não foi possível conectar ao serviço de voz. Verifique sua conexão.");
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
