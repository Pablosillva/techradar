"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Settings as SettingsIcon,
  Speaker,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioPlayerProps {
  text: string;
  title?: string;
  autoPlay?: boolean;
}

interface VoiceOption {
  name: string;
  lang: string;
  default: boolean;
  voice: SpeechSynthesisVoice;
}

export function AudioPlayer({ text, title, autoPlay = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);

  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!synth) return;

    const loadVoices = () => {
      const available = synth.getVoices();
      const options: VoiceOption[] = available.map((v) => ({
        name: v.name,
        lang: v.lang,
        default: v.default,
        voice: v,
      }));
      setVoices(options);
      if (!selectedVoice && available.length > 0) {
        const ptVoice = available.find((v) => v.lang.startsWith("pt")) || available[0];
        if (ptVoice) {
          setSelectedVoice(ptVoice.name);
        }
      }
      setIsReady(true);
    };

    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    loadVoices();

    return () => {
      synth.cancel();
    };
  }, [synth, selectedVoice]);

  const speak = useCallback(
    (txt: string) => {
      if (!synth || !isReady) return;

      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(txt);
      utterance.lang = voices.find((v) => v.name === selectedVoice)?.lang || "pt-BR";
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentUtterance(null);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      synth.speak(utterance);
      utteranceRef.current = utterance;
      setCurrentUtterance(utterance);
    },
    [synth, isReady, selectedVoice, rate, pitch, volume]
  );

  const stop = useCallback(() => {
    if (!synth) return;
    synth.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentUtterance(null);
  }, [synth]);

  const pause = useCallback(() => {
    if (!synth) return;
    synth.pause();
    setIsPlaying(false);
    setIsPaused(true);
  }, [synth]);

  const resume = useCallback(() => {
    if (!synth || !currentUtterance) return;
    synth.resume();
    setIsPlaying(true);
    setIsPaused(false);
  }, [synth, currentUtterance]);

  useEffect(() => {
    if (autoPlay && !isPlaying && !isPaused && text.trim()) {
      speak(text);
    }
  }, [autoPlay, text, speak, isPlaying, isPaused]);

  const hasVoices = voices.length > 0;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4 dark:border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {title ? (
            <span className="text-sm font-medium text-white">{title}</span>
          ) : (
            <Speaker className="w-4 h-4 text-blue-400" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isReady ? (
            <span className="text-xs text-gray-500">Carregando vozes...</span>
          ) : (
            <>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                disabled={!hasVoices}
                className="text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-300 focus:ring-1 focus:ring-blue-500"
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={!isPlaying ? () => speak(text) : resume}
            disabled={!isReady || !text.trim()}
            className="h-8 w-8 p-0"
          >
            {isPaused ? (
              <Play className="w-4 h-4" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={stop}
            disabled={!isPlaying && !isPaused}
            className="h-8 w-8 p-0"
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const prev = Math.max(0, rate - 0.25);
              setRate(prev);
              speak(text);
            }}
            disabled={!isReady || !text.trim()}
            className="h-8 w-8 p-0 text-xs"
          >
            <SkipBack className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const next = Math.min(2, rate + 0.25);
              setRate(next);
              speak(text);
            }}
            disabled={!isReady || !text.trim()}
            className="h-8 w-8 p-0 text-xs"
          >
            <SkipForward className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {}}
            className="h-8 w-8 p-0 text-xs"
            title="Configurações"
          >
            <SettingsIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Velocidade</span>
          <span className="text-sm text-white">{rate.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Tom</span>
          <span className="text-sm text-white">{pitch.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={pitch}
          onChange={(e) => setPitch(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Volume</span>
          <span className="text-sm text-white">{Math.round(volume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      {!hasVoices && (
        <p className="mt-2 text-xs text-gray-500">
          Nenhuma voz de síntese encontrada no navegador.
        </p>
      )}
    </div>
  );
}
