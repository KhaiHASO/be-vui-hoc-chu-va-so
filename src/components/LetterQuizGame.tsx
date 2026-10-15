"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import rawLettersData from "@/data/letters.json";
import { LetterCardData } from "@/types/letter";
import { Sparkles, Volume2, Trophy, RotateCcw, CheckCircle2 } from "lucide-react";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";

export function LetterQuizGame() {
  const letters: LetterCardData[] = (
    Array.isArray(rawLettersData) ? rawLettersData : (rawLettersData as { letters: LetterCardData[] }).letters
  ) as LetterCardData[];

  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [options, setOptions] = useState<LetterCardData[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedLetterId, setSelectedLetterId] = useState<number | null>(null);

  const currentQuestion = letters[questionIndex % letters.length];

  // Sinh 3 lựa chọn ngẫu nhiên gồm 1 đáp án đúng và 2 đáp án nhiễu
  useEffect(() => {
    const distractors = letters
      .filter((l) => l.id !== currentQuestion.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    const fullList = [currentQuestion, ...distractors].sort(() => Math.random() - 0.5);
    setOptions(fullList);
    setFeedback(null);
    setSelectedLetterId(null);
  }, [questionIndex, currentQuestion, letters]);

  const speakQuestion = () => {
    sound.playTone(523.25, 0.1);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        `Đố bé: Đâu là chữ cái ${currentQuestion.name}? Trong từ: ${currentQuestion.illu_word}`
      );
      u.lang = "vi-VN";
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const handleChoose = (opt: LetterCardData) => {
    if (feedback === "correct") return;
    setSelectedLetterId(opt.id);

    if (opt.id === currentQuestion.id) {
      sound.playTone(523.25, 0.1);
      setTimeout(() => sound.playTone(659.25, 0.15), 100);
      setTimeout(() => sound.playTone(783.99, 0.2), 200);

      setFeedback("correct");
      setScore((s) => s + 1);

      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        setQuestionIndex((i) => i + 1);
      }, 1500);
    } else {
      sound.playTone(220, 0.2); // Âm trầm khi chọn sai
      setFeedback("wrong");
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-4 px-2 sm:px-4">
      {/* Tiêu đề & Bảng điểm */}
      <div className="w-full max-w-2xl flex items-center justify-between gap-3 mb-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-800">Đố Vui Bắt Chữ</h3>
            <span className="text-xs text-slate-400 font-semibold">Câu số #{questionIndex + 1}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-violet-100 text-violet-700 font-black text-sm">
            ⭐ {score} điểm
          </span>
          <button
            onClick={speakQuestion}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold flex items-center gap-1.5 transition-all"
            title="Nghe lại câu hỏi"
          >
            <Volume2 className="w-4 h-4 text-violet-600" />
            <span className="text-xs hidden sm:inline">Nghe câu hỏi</span>
          </button>
        </div>
      </div>

      {/* Khung câu đố */}
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl flex flex-col items-center text-center">
        <div className="mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Bé hãy tìm chữ cái tương ứng với tranh:
          </span>
          <div className="relative w-36 h-36 rounded-2xl overflow-hidden bg-violet-50 border-2 border-violet-200 mx-auto my-3 shadow-inner">
            <Image
              src={currentQuestion.assets.illustration}
              alt={currentQuestion.illu_word}
              fill
              className="object-contain p-2"
            />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-800">
            Từ minh họa: <span className="text-violet-600 uppercase font-black">"{currentQuestion.illu_word}"</span>
          </p>
        </div>

        {/* 3 Lựa chọn đáp án lớn */}
        <div className="w-full grid grid-cols-3 gap-3 sm:gap-4 my-4">
          {options.map((opt) => {
            const isSelected = selectedLetterId === opt.id;
            const isCorrect = opt.id === currentQuestion.id;

            let btnStyle = "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800";
            if (isSelected) {
              if (isCorrect) {
                btnStyle = "bg-emerald-500 text-white border-emerald-600 shadow-lg scale-105";
              } else {
                btnStyle = "bg-rose-500 text-white border-rose-600 animate-shake";
              }
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleChoose(opt)}
                className={`min-h-[80px] sm:min-h-[100px] rounded-3xl border-3 flex flex-col items-center justify-center p-3 transition-all active:scale-95 cursor-pointer shadow-xs ${btnStyle}`}
              >
                <span className="text-4xl sm:text-6xl font-black">{opt.letter}</span>
                <span className="text-xs font-bold mt-1 opacity-80">{opt.name}</span>
              </button>
            );
          })}
        </div>

        {/* Thông báo kết quả */}
        {feedback === "correct" && (
          <div className="flex items-center gap-2 text-emerald-600 font-black text-sm sm:text-base animate-bounce mt-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>Hoan hô bé! Bé chọn hoàn toàn chính xác! 🎉</span>
          </div>
        )}

        {feedback === "wrong" && (
          <div className="text-rose-600 font-bold text-sm sm:text-base mt-2">
            <span>Bé thử lại một lần nữa nhé, cố lên nào! 💪</span>
          </div>
        )}
      </div>
    </div>
  );
}
