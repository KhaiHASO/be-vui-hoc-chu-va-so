"use client";

import React, { useState } from "react";
import rawNumbersData from "@/data/numbers.json";
import rawLettersData from "@/data/letters.json";
import { NumberCardData } from "@/types/number";
import {
  LetterCardData,
  MainCategory,
  LetterSubMode,
  NumberSubMode,
} from "@/types/letter";

import { SidebarNav } from "@/components/SidebarNav";

// Các component của phần HỌC CHỮ
import { LetterFlashcardView } from "@/components/LetterFlashcardView";
import { StrokesPracticeView } from "@/components/StrokesPracticeView";
import { DigraphsPracticeView } from "@/components/DigraphsPracticeView";
import { LetterWritingCanvas } from "@/components/LetterWritingCanvas";
import { MouthShapeGuideView } from "@/components/MouthShapeGuideView";
import { LetterQuizGame } from "@/components/LetterQuizGame";

// Các component của phần HỌC SỐ (Kế thừa trọn vẹn từ bản cũ)
import { FlashcardView } from "@/components/FlashcardView";
import { CountingGame } from "@/components/CountingGame";
import { WritingCanvas } from "@/components/WritingCanvas";
import { NumberBondsInteractive } from "@/components/NumberBondsInteractive";
import { ParentGuideView } from "@/components/ParentGuideView";

import { Sparkles, ArrowRight } from "lucide-react";
import { sound } from "@/utils/speech";

const numbers: NumberCardData[] = rawNumbersData as NumberCardData[];
const letters: LetterCardData[] = (
  Array.isArray(rawLettersData)
    ? rawLettersData
    : (rawLettersData as { letters: LetterCardData[] }).letters
) as LetterCardData[];

export default function HomePage() {
  // Trạng thái điều hướng chính
  const [mainCategory, setMainCategory] = useState<MainCategory>("letters");
  const [letterMode, setLetterMode] = useState<LetterSubMode>("flashcard");
  const [numberMode, setNumberMode] = useState<NumberSubMode>("card");

  // Phần tử đang được chọn
  const [currentLetter, setCurrentLetter] = useState<LetterCardData>(letters[0]);
  const [currentNumber, setCurrentNumber] = useState<NumberCardData>(numbers[0]);

  // Điều hướng qua lại chữ cái tiếp theo/trước đó
  const handleNextLetter = () => {
    sound.playTone(523.25, 0.08);
    const currIdx = letters.findIndex((l) => l.id === currentLetter.id);
    const nextIdx = (currIdx + 1) % letters.length;
    setCurrentLetter(letters[nextIdx]);
  };

  const handlePrevLetter = () => {
    sound.playTone(440, 0.08);
    const currIdx = letters.findIndex((l) => l.id === currentLetter.id);
    const prevIdx = (currIdx - 1 + letters.length) % letters.length;
    setCurrentLetter(letters[prevIdx]);
  };

  // Điều hướng qua lại số tiếp theo/trước đó
  const handleNextNumber = () => {
    sound.playTone(587.33, 0.08);
    const currIdx = numbers.findIndex((n) => n.id === currentNumber.id);
    const nextIdx = (currIdx + 1) % numbers.length;
    setCurrentNumber(numbers[nextIdx]);
  };

  const handlePrevNumber = () => {
    sound.playTone(493.88, 0.08);
    const currIdx = numbers.findIndex((n) => n.id === currentNumber.id);
    const prevIdx = (currIdx - 1 + numbers.length) % numbers.length;
    setCurrentNumber(numbers[prevIdx]);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 font-sans text-slate-800 antialiased">
      {/* 1. THANH ĐIỀU HƯỚNG BÊN (SIDEBAR NAVIGATION) */}
      <SidebarNav
        mainCategory={mainCategory}
        onSelectMainCategory={(cat) => setMainCategory(cat)}
        letterMode={letterMode}
        onSelectLetterMode={(mode) => setLetterMode(mode)}
        numberMode={numberMode}
        onSelectNumberMode={(mode) => setNumberMode(mode)}
        letters={letters}
        currentLetter={currentLetter}
        onSelectLetter={(l) => setCurrentLetter(l)}
        numbers={numbers}
        currentNumber={currentNumber}
        onSelectNumber={(n) => setCurrentNumber(n)}
      />

      {/* 2. KHÔNG GIAN TƯƠNG TÁC CHÍNH (MAIN PLAYGROUND AREA) */}
      <main className="flex-1 min-w-0 h-auto lg:h-screen lg:overflow-y-auto flex flex-col bg-gradient-to-b from-white via-slate-50 to-amber-50/20">
        {/* Top Header thanh không gian chơi */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-2xl bg-linear-to-br from-violet-500 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-xs shrink-0">
              {mainCategory === "letters" ? currentLetter.letter : currentNumber.number}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {mainCategory === "letters" ? "Tiếng Việt Tiểu Học" : "Toán Học Lớp 1"}
                </span>
                <span className="text-xs font-bold text-violet-600">
                  {mainCategory === "letters"
                    ? `Chữ ${currentLetter.letter} (${currentLetter.name})`
                    : `Số ${currentNumber.number} (${currentNumber.word})`}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-800 truncate">
                {mainCategory === "letters"
                  ? letterMode === "flashcard"
                    ? "Khám phá thẻ chữ cái 3D"
                    : letterMode === "strokes"
                    ? "Luyện 11 nét viết cơ bản (Thẻ 1 - 11)"
                    : letterMode === "digraphs"
                    ? "14 Vần ghép & Âm đôi (Thẻ 41 - 54)"
                    : letterMode === "writing"
                    ? "Bảng luyện viết ô ly 4 dòng kẻ"
                    : letterMode === "mouth"
                    ? "Luyện khẩu hình & Gương soi camera"
                    : "Đố vui bắt chữ thông minh"
                  : numberMode === "card"
                  ? "Thẻ học số 3D độ nét cao"
                  : numberMode === "counting"
                  ? "Bé tập đếm con vật tương tác"
                  : numberMode === "writing"
                  ? "Bảng viết số ô ly Dual-Canvas"
                  : numberMode === "bonds"
                  ? "5 Hoạt động Tách - Gộp Singapore CPA"
                  : "Cẩm nang 3 bước dành cho phụ huynh"}
              </h2>
            </div>
          </div>

          {/* Nút lùi / tới nhanh */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={mainCategory === "letters" ? handlePrevLetter : handlePrevNumber}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs sm:text-sm font-bold text-slate-700 transition-all"
            >
              ← Trước
            </button>
            <button
              onClick={mainCategory === "letters" ? handleNextLetter : handleNextNumber}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-xs sm:text-sm font-black text-white shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Tiếp theo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Nội dung tương tác chính (Dynamic Playground) */}
        <section className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col justify-center">
          {mainCategory === "letters" && (
            <>
              {letterMode === "flashcard" && (
                <LetterFlashcardView
                  currentLetter={currentLetter}
                  onNextLetter={handleNextLetter}
                  onPrevLetter={handlePrevLetter}
                  onGoToWriting={() => setLetterMode("writing")}
                />
              )}

              {letterMode === "strokes" && <StrokesPracticeView />}

              {letterMode === "digraphs" && <DigraphsPracticeView />}

              {letterMode === "writing" && (
                <LetterWritingCanvas currentLetter={currentLetter} />
              )}

              {letterMode === "mouth" && (
                <MouthShapeGuideView currentLetter={currentLetter} />
              )}

              {letterMode === "quiz" && <LetterQuizGame />}
            </>
          )}

          {mainCategory === "numbers" && (
            <>
              {numberMode === "card" && (
                <FlashcardView card={currentNumber} />
              )}

              {numberMode === "counting" && (
                <CountingGame card={currentNumber} />
              )}

              {numberMode === "writing" && (
                <WritingCanvas card={currentNumber} />
              )}

              {numberMode === "bonds" && (
                <NumberBondsInteractive card={currentNumber} />
              )}

              {numberMode === "guide" && (
                <ParentGuideView numbers={numbers} currentNumber={currentNumber} />
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
