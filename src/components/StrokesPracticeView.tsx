"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import rawStrokesData from "@/data/strokes.json";
import { BasicStroke } from "@/types/letter";
import {
  Sparkles,
  Volume2,
  Play,
  Pause,
  Video,
  RotateCcw,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";

export function StrokesPracticeView() {
  const strokes: BasicStroke[] = rawStrokesData as BasicStroke[];
  const [selectedStroke, setSelectedStroke] = useState<BasicStroke>(strokes[0]);
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
  }, [selectedStroke]);

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

  const handleSelect = (st: BasicStroke) => {
    sound.playTone(440, 0.05);
    setSelectedStroke(st);
  };

  const handleCardClick = () => {
    sound.playTone(isFlipped ? 440 : 659.25, 0.08);
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#ec4899", "#8b5cf6", "#10b981"],
      });
    }
  };

  const handleNext = () => {
    sound.playTone(523.25, 0.05);
    const idx = strokes.findIndex((s) => s.id === selectedStroke.id);
    const nextIdx = (idx + 1) % strokes.length;
    setSelectedStroke(strokes[nextIdx]);
  };

  const handlePrev = () => {
    sound.playTone(440, 0.05);
    const idx = strokes.findIndex((s) => s.id === selectedStroke.id);
    const prevIdx = (idx - 1 + strokes.length) % strokes.length;
    setSelectedStroke(strokes[prevIdx]);
  };

  return (
    <div className="w-full flex flex-col items-center py-3 sm:py-6 px-3 sm:px-6">
      <audio
        ref={audioRef}
        src={selectedStroke.audio_url}
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />

      {/* Tiêu đề */}
      <div className="text-center mb-4">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-xs mb-1.5">
          <Sparkles className="w-4 h-4 text-amber-600" />
          Học Liệu Quy Chuẩn Bộ Thẻ (Thẻ 1 – 11)
        </span>
        <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">
          11 Nét Viết Cơ Bản Tiền Tiểu Học
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-xl mx-auto">
          Nền tảng cốt lõi giúp bé cầm bút chuẩn và viết đẹp mọi con chữ
        </p>
      </div>

      {/* Dải 11 nét viết (Touch-friendly ngang) */}
      <div className="w-full max-w-4xl mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none px-1">
          {strokes.map((st, idx) => (
            <button
              key={st.id}
              onClick={() => handleSelect(st)}
              className={`min-h-[44px] px-3.5 py-2 rounded-2xl font-bold text-xs sm:text-sm shrink-0 flex items-center gap-2 border transition-all active:scale-95 ${
                selectedStroke.id === st.id
                  ? "bg-violet-600 text-white border-violet-600 shadow-md scale-105"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
                  selectedStroke.id === st.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {idx + 1}
              </span>
              <span>{st.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* VÙNG THẺ HỌC NÉT 3D */}
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
              src={selectedStroke.assets.card_front}
              alt={`Thẻ ${selectedStroke.id} - ${selectedStroke.name}`}
              fill
              className="object-contain p-2"
              priority
            />
            <div className="absolute top-3 left-3 bg-amber-600/90 text-white text-xs font-black px-3 py-1 rounded-full shadow-md backdrop-blur-sm">
              Mặt trước: Thẻ #{selectedStroke.id} - {selectedStroke.name}
            </div>
            <div className="absolute bottom-3 right-3 bg-white/90 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm flex items-center gap-1.5 border border-slate-200">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
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
              src={selectedStroke.assets.card_back}
              alt={`Thẻ ${selectedStroke.id} - ${selectedStroke.name} (Mặt sau)`}
              fill
              className="object-contain p-2"
            />
            <div className="absolute top-3 left-3 bg-violet-600/90 text-white text-xs font-black px-3 py-1 rounded-full shadow-md backdrop-blur-sm">
              Mặt sau: Luyện tập & Ứng dụng
            </div>
            <div className="absolute bottom-3 right-3 bg-white/90 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm flex items-center gap-1.5 border border-slate-200">
              <RotateCcw className="w-3.5 h-3.5 text-violet-600 animate-spin" />
              <span>Chạm để quay lại</span>
            </div>
          </div>
        </div>

        {/* Thanh công cụ dưới thẻ */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center active:scale-95 shadow-xs"
              title="Nét trước"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={handleNext}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center active:scale-95 shadow-xs"
              title="Nét tiếp theo"
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
                  : "bg-violet-600 hover:bg-violet-700 text-white"
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? "Đang đọc..." : "Nghe Cô Giảng"}</span>
            </button>

            {selectedStroke.video_url && (
              <a
                href={selectedStroke.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
              >
                <Video className="w-4 h-4 text-rose-600" />
                <span>Video Viết</span>
              </a>
            )}
          </div>
        </div>

        {/* Khung mô tả sư phạm & chữ cái áp dụng */}
        <div className="w-full max-w-2xl mt-4 p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-2.5">
          <div>
            <h3 className="text-base font-black text-slate-800">{selectedStroke.name}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-0.5">
              {selectedStroke.desc}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Các chữ cái chứa nét này:</span>
            {selectedStroke.letters.map((ltr) => (
              <span
                key={ltr}
                className="w-8 h-8 rounded-xl bg-violet-100 text-violet-800 font-black text-sm flex items-center justify-center border border-violet-200"
              >
                {ltr}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
