"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Repeat,
  Radio,
} from "lucide-react";

interface AudioPreviewProps {
  src: string;
  fileName: string;
  mimeType?: string;
}

export function AudioPreview({ src, fileName, mimeType }: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      void audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        loop={isLooping}
      />

      {/* Album / Sound Visual Graphic */}
      <div className="relative mb-6">
        <div
          className={`h-36 w-36 rounded-3xl bg-linear-to-tr from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/25 transition-transform duration-500 ${
            isPlaying ? "scale-105" : "scale-100"
          }`}
        >
          <Music className={`h-16 w-16 ${isPlaying ? "animate-pulse" : ""}`} />
        </div>
        {isPlaying && (
          <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
          </div>
        )}
      </div>

      <h3 className="text-base sm:text-lg font-bold text-white max-w-md truncate mb-1">
        {fileName}
      </h3>
      <div className="flex items-center gap-2 mb-6">
        <span className="text-[11px] text-slate-400 font-mono">
          {mimeType || "audio/mpeg"}
        </span>
        <span className="text-slate-600">•</span>
        <span className="text-[11px] text-slate-400 font-mono">
          {formatTime(duration)}
        </span>
      </div>

      {/* Custom Player Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4 backdrop-blur-md">
        {/* Timeline Scrubber */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          {/* Rate Selector */}
          <div className="flex items-center bg-slate-950/80 rounded-lg p-0.5 border border-slate-800 text-[10px] font-mono">
            {[0.75, 1, 1.25, 1.5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRateChange(r)}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition ${
                  playbackRate === r
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {r}x
              </button>
            ))}
          </div>

          {/* Main Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5 fill-white" />
            )}
          </button>

          {/* Loop & Volume */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLooping((l) => !l)}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isLooping
                  ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-400"
                  : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Repeat Track"
            >
              <Repeat className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
