"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import rawDigraphsData from "@/data/digraphs.json";
import { DigraphData } from "@/types/letter";
import {
  Sparkles,
  Volume2,
  Play,
  Pause,
  Video,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";

export function DigraphsPracticeView() {
  const digraphs: DigraphData[] = rawDigraphsData as DigraphData[];
  const [selectedDigraph, setSelectedDigraph] = useState<DigraphData>(digraphs[0]);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsFlipped(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
    setIsPlaying(false);
  }, [selectedDigraph]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      sound.playTone(523.25, 0.08);
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleSelect = (dg: DigraphData) => {
    sound.playTone(440, 0.05);
    setSelectedDigraph(dg);
  };

  const handleCardClick = () => {
    sound.playTone(isFlipped ? 440 : 659.25, 0.08);
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#ec4899", "#8b5cf6", "#10b981"],
      });
    }
  };

  const handleNext = () => {
    sound.playTone(523.25, 0.05);
    const idx = digraphs.findIndex((d) => d.id === selectedDigraph.id);
    const nextIdx = (idx + 1) % digraphs.length;
    setSelectedDigraph(digraphs[nextIdx]);
  };

  const handlePrev = () => {
    sound.playTone(440, 0.05);
    const idx = digraphs.findIndex((d) => d.id === selectedDigraph.id);
    const prevIdx = (idx - 1 + digraphs.length) % digraphs.length;
    setSelectedDigraph(digraphs[prevIdx]);
  };

  return (
    <div className="w-full flex flex-col items-center py-3 sm:py-6 px-3 sm:px-6">
      <audio
        ref={audioRef}
        src={selectedDigraph.audio_url}
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />

      {/* Header */}
      <div className="text-center mb-4">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-xs mb-1.5">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          Học Liệu Ghép Vần (Thẻ 41 – 54)
        </span>
        <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">
          14 Vần Ghép & Âm Đôi Tiếng Việt
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-xl mx-auto">
          Bước chuyển tiếp quan trọng từ âm đơn sang ghép tiếng và đọc câu lưu loát
        </p>
      </div>

      {/* Dải chọn 14 âm ghép */}
      <div className="w-full max-w-4xl mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none px-1">
          {digraphs.map((dg) => (
            <button
              key={dg.id}
              onClick={() => handleSelect(dg)}
              className={`min-h-[44px] px-3.5 py-2 rounded-2xl font-bold text-xs sm:text-sm shrink-0 flex items-center gap-1.5 border transition-all active:scale-95 ${
                selectedDigraph.id === dg.id
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs"
              }`}
            >
              <span className="text-sm font-black">{dg.name}</span>
              <span className={`text-[11px] ${selectedDigraph.id === dg.id ? "text-indigo-200" : "text-slate-400"}`}>
                ({dg.sample})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* VÙNG THẺ HỌC 3D */}
      <div className="w-full max-w-2xl flex flex-col items-center">
        <div
          className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-200 bg-white cursor-pointer select-none"
          onClick={handleCardClick}
        >
          {/* Mặt trước */}
          <div
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              isFlipped
                ? "opacity-0 pointer-events-none rotate-y-180 scale-95"
                : "opacity-100 scale-100"
            }`}
          >
            <Image
              src={selectedDigraph.assets.card_front}
              alt={`Thẻ ${selectedDigraph.id} - ${selectedDigraph.name}`}
              fill
              className="object-contain p-2"
              priority
            />
            <div className="absolute top-3 left-3 bg-indigo-600/90 text-white text-xs font-black px-3 py-1 rounded-full shadow-md backdrop-blur-sm">
              Mặt trước: Thẻ #{selectedDigraph.id} - Âm {selectedDigraph.name}
            </div>
            <div className="absolute bottom-3 right-3 bg-white/90 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm flex items-center gap-1.5 border border-slate-200">
              <RotateCcw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              <span>Chạm để lật mặt sau</span>
            </div>
          </div>

          {/* Mặt sau */}
          <div
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              isFlipped
                ? "opacity-100 scale-100"
                : "opacity-0 pointer-events-none -rotate-y-180 scale-95"
            }`}
          >
            <Image
              src={selectedDigraph.assets.card_back}
              alt={`Thẻ ${selectedDigraph.id} - ${selectedDigraph.name} (Mặt sau)`}
              fill
              className="object-contain p-2"
            />
            <div className="absolute top-3 left-3 bg-amber-600/90 text-white text-xs font-black px-3 py-1 rounded-full shadow-md backdrop-blur-sm">
              Mặt sau: Bảng ghép vần & Từ ứng dụng
            </div>
            <div className="absolute bottom-3 right-3 bg-white/90 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm flex items-center gap-1.5 border border-slate-200">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              <span>Chạm để quay lại</span>
            </div>
          </div>
        </div>

        {/* Nút điều khiển */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center active:scale-95 shadow-xs"
              title="Âm trước"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={handleNext}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center active:scale-95 shadow-xs"
              title="Âm tiếp theo"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleAudio}
              className={`min-h-[44px] px-4 py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-xs ${
                isPlaying
                  ? "bg-rose-600 text-white animate-pulse"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? "Đang đọc..." : "Nghe Cô Giảng"}</span>
            </button>

            {selectedDigraph.video_url && (
              <a
                href={selectedDigraph.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
              >
                <Video className="w-4 h-4 text-rose-600" />
                <span>Video Hướng Dẫn</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
