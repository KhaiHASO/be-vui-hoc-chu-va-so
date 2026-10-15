"use client";

import React, { useState, useEffect } from "react";
import rawLettersData from "@/data/letters.json";
import { LetterCardData } from "@/types/letter";
import { Sparkles, Volume2, Trophy, RotateCcw, CheckCircle2 } from "lucide-react";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";

export function LetterQuizGame() {
  const letters: LetterCardData[] = rawLettersData.letters;

  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [options, setOptions] = useState<LetterCardData[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

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
    setSelectedLetter(null);
  }, [questionIndex, currentQuestion]);

  const speakQuestion = () => {
    sound.playTone(523.25, 0.1);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        `Đố bé: Đâu là chữ cái ${currentQuestion.soundName}? Trong từ: ${currentQuestion.illustration.word}`
      );
      u.lang = "vi-VN";
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const handleChoose = (opt: LetterCardData) => {
    if (feedback === "correct") return;
    setSelectedLetter(opt.id);

    if (opt.id === currentQuestion.id) {
      sound.playTone(523.25, 0.1);
      setTimeout(() => sound.playTone(659.25, 0.15), 100);
      setTimeout(() => sound.playTone(783.99, 0.2), 200);

      setFeedback("correct");
      setScore((s) => s + 1);

      confetti({
        particleCount: 40,
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

      {/* Khung câu hỏi chính */}
      <div className="w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-linear-to-b from-white to-violet-50/40 border-4 border-violet-200 shadow-xl flex flex-col items-center text-center">
        <span className="text-xs sm:text-sm font-bold text-violet-600 mb-2">
          Bé hãy lắng nghe và chọn đúng chữ cái:
        </span>

        <h2 className="text-2xl sm:text-4xl font-black text-slate-800 mb-2">
          Đâu là chữ <span className="text-violet-700 uppercase">"{currentQuestion.soundName}"</span>?
        </h2>

        <div className="mt-2 mb-6 p-3 rounded-2xl bg-white border border-violet-100 shadow-xs flex items-center gap-2 text-slate-600 text-sm font-semibold">
          <span>Gợi ý từ:</span>
          <span className="font-bold text-rose-600 text-base">{currentQuestion.illustration.word}</span>
        </div>

        {/* 3 Bong bóng chữ cái lựa chọn */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
          {options.map((opt) => {
            const isSelected = selectedLetter === opt.id;
            const isTarget = opt.id === currentQuestion.id;
            let btnStyle = "bg-white text-slate-800 border-slate-200 hover:border-violet-300 shadow-md";

            if (isSelected) {
              if (feedback === "correct" && isTarget) {
                btnStyle = "bg-emerald-500 text-white border-emerald-600 shadow-lg scale-105";
              } else if (feedback === "wrong" && !isTarget) {
                btnStyle = "bg-rose-500 text-white border-rose-600 animate-shake";
              }
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleChoose(opt)}
                className={`min-h-[80px] sm:min-h-[110px] p-4 rounded-3xl border-3 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${btnStyle}`}
              >
                <span className="text-4xl sm:text-5xl font-black drop-shadow-xs font-serif">
                  {opt.upper} {opt.lower}
                </span>
                <span className="text-xs sm:text-sm font-bold mt-1 opacity-90">
                  {opt.soundName}
                </span>
              </button>
            );
          })}
        </div>

        {/* Phản hồi kết quả */}
        {feedback === "correct" && (
          <div className="mt-6 p-3.5 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Tuyệt vời! Bé chọn hoàn toàn chính xác! 🌟
          </div>
        )}

        {feedback === "wrong" && (
          <div className="mt-6 p-3.5 rounded-2xl bg-rose-100 text-rose-800 font-bold text-sm">
            Chưa đúng rồi, bé hãy thử chọn lại chữ khác nhé! 💪
          </div>
        )}
      </div>
    </div>
  );
}
