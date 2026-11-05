"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Clock2 } from "lucide-react";
import Link from "next/link";
import { calculateProgress, formatTime, roundPosition } from "@/lib/study/progress";

interface SecureAudioPlayerProps {
  fileUrl: string;
  libraryId: string;
  title: string;
  durationSec: number | null;
  positionSec: number | null;
}

/**
 * Player de áudio seguro com persistência de progresso.
 *
 * Usa o elemento <audio> nativo com src na rota protegida /api/library-files/[key].
 * O cookie de sessão é enviado (mesma-origem). A posição é persistida no banco:
 * - debounced a cada 2s durante a reprodução (timeupdate)
 * - imediatamente ao pausar
 * - ao finalizar (marca 100%)
 */
export function SecureAudioPlayer({
  fileUrl,
  libraryId,
  title,
  durationSec,
  positionSec: initialPosition,
}: SecureAudioPlayerProps) {
  const [position, setPosition] = useState(roundPosition(initialPosition) ?? 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progress = calculateProgress(position, durationSec);

  const debouncedSave = useCallback((pos: number) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/library/${libraryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            positionSec: roundPosition(pos),
            progress: calculateProgress(pos, durationSec),
          }),
        });
        if (!res.ok) throw new Error("Falha ao salvar posição");
      } catch {
        // Salvamentos debounced falham silenciosamente para não quebrar a UX.
      }
    }, 2000);
  }, [libraryId, durationSec]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setPosition(roundPosition(audio.currentTime) ?? 0);
      setIsPlaying(!audio.paused && !audio.ended);
      debouncedSave(audio.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
      setIsPlaying(false);
      void savePositionNow(audio.currentTime);
    };
    const handleEnded = async () => {
      setIsPlaying(false);
      if (durationSec) {
        await savePositionNow(durationSec, true);
      }
    };

    async function savePositionNow(pos: number, completed = false) {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
        saveTimeout.current = null;
      }
      setSaving(true);
      try {
        const res = await fetch(`/api/library/${libraryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            positionSec: roundPosition(pos),
            progress: completed ? 100 : calculateProgress(pos, durationSec),
          }),
        });
        if (!res.ok) throw new Error("Falha ao salvar posição");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao salvar posição");
      } finally {
        setSaving(false);
      }
    }

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [libraryId, durationSec, debouncedSave]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setError(null);
    if (audio.paused) {
      audio.play().catch(() => {
        setError("Não foi possível reproduzir o áudio. Verifique se o arquivo está acessível.");
      });
    } else {
      audio.pause();
    }
  };

  const format = (seconds: number) => formatTime(seconds);

  const content = fileUrl ? (
    <div className="w-full max-w-md">
      <audio
        ref={audioRef}
        src={fileUrl}
        preload="metadata"
        className="w-full"
      />

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">{format(position)}</span>
          <span className="text-xs font-medium text-slate-400">
            - {format(Math.max(0, (durationSec ?? 0) - position))}
          </span>
        </div>
        <div
          className="w-full bg-white/[0.06] rounded-full h-2 cursor-pointer"
          role="slider"
          aria-label="Posição do áudio"
          aria-valuenow={position}
          aria-valuemin={0}
          aria-valuemax={durationSec ?? 0}
        >
          <div
            className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-100"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mt-8">
        <Button onClick={togglePlay} className="h-12 w-12">
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => {
              const audio = audioRef.current;
              if (audio) {
                audio.muted = !audio.muted;
                setMuted(audio.muted);
              }
            }}
            className="h-8 w-8"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              const audio = audioRef.current;
              if (audio) {
                audio.volume = v;
                audio.muted = false;
                setMuted(false);
              }
            }}
            className="w-24 h-1 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>{format(durationSec ?? 0)} total</span>
        <span className="font-medium text-slate-200">{progress}% concluído</span>
      </div>

      <p className="mt-4 text-[10px] text-slate-500 max-w-md text-center">
        A posição é salva automaticamente a cada 2s e ao pausar/ finalizar. O áudio é
        servido por rota protegida (apenas o dono ou admin).
      </p>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Clock2 className="mb-3 h-12 w-12 text-slate-500" />
      <p className="text-sm text-slate-400">Arquivo de áudio não disponível.</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-16 items-center justify-between px-6 border-b border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur">
        <Link
          href="/biblioteca"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Biblioteca
        </Link>
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-purple-400" />
          <h1 className="text-sm font-medium text-white truncate max-w-[400px]">
            {title}
          </h1>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-xs text-rose-300 mx-4">
          {error}
        </div>
      )}

      <div className="flex-1 p-8 flex flex-col items-center justify-center">
        {content}
      </div>
    </div>
  );
}
