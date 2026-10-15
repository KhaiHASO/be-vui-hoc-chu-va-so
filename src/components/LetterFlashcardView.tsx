"use client";

import React, { useState } from "react";
import { LetterCardData } from "@/types/letter";
import { Volume2, RotateCcw, Sparkles, BookOpen, PenTool, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/utils/speech";

interface LetterFlashcardViewProps {
  currentLetter: LetterCardData;
  onNextLetter?: () => void;
  onPrevLetter?: () => void;
}

export function LetterFlashcardView({
  currentLetter,
  onNextLetter,
  onPrevLetter,
}: LetterFlashcardViewProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const speakLetter = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playTone(523.25, 0.15); // Nốt C5
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `${currentLetter.soundName}. ${currentLetter.illustration.word}.`
      );
      utterance.lang = "vi-VN";
      utterance.rate = 0.85; // Tốc độ chậm rãi, rõ ràng cho bé
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCardClick = () => {
    sound.playTone(isFlipped ? 440 : 659.25, 0.1);
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.6 },
        colors: ["#f43f5e", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"],
      });
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-2 sm:py-5 px-2 sm:px-4">
      {/* Tiêu đề hướng dẫn */}
      <div className="text-center mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-800 border border-violet-200 shadow-xs mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-600 animate-spin" />
          Thẻ Học Chữ Thông Minh 3D
        </span>
        <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">
          Làm Quen Với <span className="text-violet-600 uppercase">{currentLetter.soundName}</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Chạm vào thẻ để lật mặt xem hướng dẫn viết và từ vựng
        </p>
      </div>

      {/* Thẻ 3D Flip Container */}
      <div
        className="w-full max-w-[290px] sm:max-w-md aspect-[4/5] sm:aspect-[3/4] max-h-[350px] sm:max-h-[480px] cursor-pointer select-none perspective-1000"
        onClick={handleCardClick}
      >
        <div
          className={`relative w-full h-full duration-500 preserve-3d transition-transform rounded-3xl shadow-xl hover:shadow-2xl border-4 ${
            isFlipped
              ? "rotate-y-180 border-amber-300 bg-linear-to-br from-amber-50 to-orange-50"
              : "border-violet-300 bg-linear-to-br from-white via-violet-50/30 to-purple-50"
          }`}
        >
          {/* MẶT TRƯỚC (FRONT) */}
          <div className="absolute inset-0 w-full h-full backface-hidden p-3.5 sm:p-7 flex flex-col justify-between items-center text-center">
            {/* Header mặt trước */}
            <div className="w-full flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-xl bg-violet-600 text-white font-extrabold text-[11px] sm:text-xs shadow-xs">
                Mặt Trước
              </span>
              <button
                onClick={speakLetter}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-violet-100 hover:bg-violet-200 active:scale-95 text-violet-700 font-bold flex items-center gap-1.5 transition-all shadow-xs"
                title="Bấm để nghe phát âm chuẩn"
              >
                <Volume2 className="w-4 h-4" />
                <span className="text-[11px] sm:text-xs font-bold">Nghe phát âm</span>
              </button>
            </div>

            {/* Chữ cái trung tâm */}
            <div className="my-auto flex flex-col items-center">
              <div className="flex items-baseline gap-3 sm:gap-6">
                <span className="text-5xl sm:text-8xl font-black text-violet-700 drop-shadow-sm font-serif">
                  {currentLetter.upper}
                </span>
                <span className="text-4xl sm:text-7xl font-black text-rose-500 drop-shadow-sm">
                  {currentLetter.lower}
                </span>
              </div>
              <div className="mt-2 px-3 py-1 rounded-xl bg-white border border-violet-200/80 shadow-xs">
                <span className="text-xs sm:text-lg font-bold text-slate-700">
                  {currentLetter.soundName}
                </span>
              </div>
            </div>

            {/* Từ vựng minh họa */}
            <div className="w-full bg-white/95 backdrop-blur-xs p-2.5 sm:p-3.5 rounded-2xl border border-violet-100 shadow-xs flex items-center justify-between gap-2">
              <div className="text-left min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold block">Từ ứng dụng:</span>
                <span className="text-sm sm:text-lg font-black text-slate-800 truncate block">
                  {currentLetter.illustration.word}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 block truncate">
                  {currentLetter.illustration.meaning}
                </span>
              </div>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black text-lg sm:text-xl shrink-0">
                ⭐
              </div>
            </div>

            {/* Chân thẻ */}
            <div className="flex items-center gap-1 text-[11px] text-violet-600/70 font-semibold">
              <RotateCcw className="w-3 h-3 animate-spin" />
              Chạm thẻ để lật xem cách viết
            </div>
          </div>

          {/* MẶT SAU (BACK) */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 p-6 sm:p-8 flex flex-col justify-between items-center text-center">
            {/* Header mặt sau */}
            <div className="w-full flex items-center justify-between">
              <span className="px-3 py-1 rounded-xl bg-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-xs">
                Mặt Sau: Cách Viết & Khẩu Hình
              </span>
              <button
                onClick={speakLetter}
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-700 font-bold flex items-center gap-2 transition-all shadow-xs"
              >
                <Volume2 className="w-5 h-5" />
                <span className="text-xs sm:text-sm font-bold">Nghe lại</span>
              </button>
            </div>

            {/* Nội dung hướng dẫn viết nét */}
            <div className="w-full my-auto text-left space-y-3.5">
              <div className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-amber-800 font-black text-sm sm:text-base mb-1.5">
                  <PenTool className="w-4 h-4 text-amber-600" />
                  Độ cao chữ viết: {currentLetter.writingGuide.height}
                </div>
                <div className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                  {currentLetter.writingGuide.strokes.map((st, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs">
                <div className="flex items-center gap-2 text-rose-700 font-black text-sm sm:text-base mb-1">
                  <BookOpen className="w-4 h-4 text-rose-500" />
                  Khẩu hình phát âm chuẩn
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {currentLetter.pronunciation.mouthShape}
                </p>
                <div className="mt-2 text-xs text-amber-700 font-semibold bg-amber-50 p-2 rounded-xl">
                  💡 Mẹo: {currentLetter.pronunciation.guideTips}
                </div>
              </div>
            </div>

            {/* Chân thẻ */}
            <div className="flex items-center gap-1.5 text-xs text-amber-600/70 font-semibold">
              <RotateCcw className="w-3.5 h-3.5" />
              Chạm để lật lại mặt trước
            </div>
          </div>
        </div>
      </div>

      {/* Điều hướng chữ cái trước/sau */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mt-3 sm:mt-6">
        {onPrevLetter && (
          <button
            onClick={onPrevLetter}
            className="min-h-[40px] sm:min-h-[44px] px-3.5 sm:px-5 py-2 rounded-2xl bg-white hover:bg-slate-100 active:scale-95 border border-slate-200 font-bold text-slate-700 text-xs sm:text-sm shadow-xs transition-all"
          >
            ← Chữ trước
          </button>
        )}
        <button
          onClick={handleCardClick}
          className="min-h-[40px] sm:min-h-[44px] px-4 sm:px-6 py-2 rounded-2xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Lật thẻ 3D
        </button>
        {onNextLetter && (
          <button
            onClick={onNextLetter}
            className="min-h-[40px] sm:min-h-[44px] px-3.5 sm:px-5 py-2 rounded-2xl bg-white hover:bg-slate-100 active:scale-95 border border-slate-200 font-bold text-slate-700 text-xs sm:text-sm shadow-xs transition-all"
          >
            Chữ sau →
          </button>
        )}
      </div>
    </div>
  );
}
