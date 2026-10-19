"use client";

import React, { useState } from "react";
import rawNumbersData from "@/data/numbers.json";
import rawLettersData from "@/data/letters.json";
import rawStrokesData from "@/data/strokes.json";
import rawDigraphsData from "@/data/digraphs.json";
import { NumberCardData } from "@/types/number";
import {
  LetterCardData,
  BasicStroke,
  DigraphData,
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
import { AiHandwritingGrader } from "@/components/AiHandwritingGrader";

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
const strokes: BasicStroke[] = rawStrokesData as BasicStroke[];
const digraphs: DigraphData[] = rawDigraphsData as DigraphData[];

export default function HomePage() {
  // Trạng thái điều hướng chính
  const [mainCategory, setMainCategory] = useState<MainCategory>("letters");
  const [letterMode, setLetterMode] = useState<LetterSubMode>("flashcard");
  const [numberMode, setNumberMode] = useState<NumberSubMode>("card");

  // Phần tử đang được chọn - lưu giữ trạng thái xuyên suốt quá trình chuyển đổi giữa các tab
  const [currentLetter, setCurrentLetter] = useState<LetterCardData>(letters[0]);
  const [currentNumber, setCurrentNumber] = useState<NumberCardData>(numbers[0]);
  const [currentStroke, setCurrentStroke] = useState<BasicStroke>(strokes[0]);
  const [currentDigraph, setCurrentDigraph] = useState<DigraphData>(digraphs[0]);

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

  // Điều hướng 11 nét viết
  const handleNextStroke = () => {
    sound.playTone(523.25, 0.05);
    const currIdx = strokes.findIndex((s) => s.id === currentStroke.id);
    const nextIdx = (currIdx + 1) % strokes.length;
    setCurrentStroke(strokes[nextIdx]);
  };

  const handlePrevStroke = () => {
    sound.playTone(440, 0.05);
    const currIdx = strokes.findIndex((s) => s.id === currentStroke.id);
    const prevIdx = (currIdx - 1 + strokes.length) % strokes.length;
    setCurrentStroke(strokes[prevIdx]);
  };

  // Điều hướng 14 vần ghép
  const handleNextDigraph = () => {
    sound.playTone(523.25, 0.05);
    const currIdx = digraphs.findIndex((d) => d.id === currentDigraph.id);
    const nextIdx = (currIdx + 1) % digraphs.length;
    setCurrentDigraph(digraphs[nextIdx]);
  };

  const handlePrevDigraph = () => {
    sound.playTone(440, 0.05);
    const currIdx = digraphs.findIndex((d) => d.id === currentDigraph.id);
    const prevIdx = (currIdx - 1 + digraphs.length) % digraphs.length;
    setCurrentDigraph(digraphs[prevIdx]);
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

  // Handler hợp nhất cho nút Trước / Tiếp theo trên thanh Header
  const handleTopPrev = () => {
    if (mainCategory === "numbers") {
      handlePrevNumber();
    } else {
      if (letterMode === "strokes") {
        handlePrevStroke();
      } else if (letterMode === "digraphs") {
        handlePrevDigraph();
      } else {
        handlePrevLetter();
      }
    }
  };

  const handleTopNext = () => {
    if (mainCategory === "numbers") {
      handleNextNumber();
    } else {
      if (letterMode === "strokes") {
        handleNextStroke();
      } else if (letterMode === "digraphs") {
        handleNextDigraph();
      } else {
        handleNextLetter();
      }
    }
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
        strokes={strokes}
        currentStroke={currentStroke}
        onSelectStroke={(st) => setCurrentStroke(st)}
        digraphs={digraphs}
        currentDigraph={currentDigraph}
        onSelectDigraph={(dg) => setCurrentDigraph(dg)}
      />

      {/* 2. KHÔNG GIAN TƯƠNG TÁC CHÍNH (MAIN PLAYGROUND AREA) */}
      <main className="flex-1 min-w-0 h-auto lg:h-screen lg:overflow-y-auto flex flex-col bg-gradient-to-b from-white via-slate-50 to-amber-50/20">
        {/* Top Header thanh không gian chơi */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="w-10 h-10 rounded-2xl bg-linear-to-br from-violet-500 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-xs shrink-0">
              {mainCategory === "numbers"
                ? currentNumber.number
                : letterMode === "strokes"
                ? currentStroke.id
                : letterMode === "digraphs"
                ? currentDigraph.name
                : letterMode === "grader"
                ? "AI"
                : currentLetter.letter}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0 hidden sm:inline-block">
                  {mainCategory === "letters" ? "Tiếng Việt Tiểu Học" : "Toán Học Lớp 1"}
                </span>
                <span className="text-xs font-bold text-violet-600 truncate">
                  {mainCategory === "numbers"
                    ? `Số ${currentNumber.number} (${currentNumber.word})`
                    : letterMode === "strokes"
                    ? `Nét ${currentStroke.id}: ${currentStroke.name}`
                    : letterMode === "digraphs"
                    ? `Âm ${currentDigraph.name} (${currentDigraph.sample})`
                    : letterMode === "grader"
                    ? "Trí Tuệ Nhân Tạo Lớp 1"
                    : `Chữ ${currentLetter.letter} (${currentLetter.name})`}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-800 truncate">
                {mainCategory === "letters"
                  ? letterMode === "flashcard"
                    ? "Khám phá thẻ chữ cái 3D"
                    : letterMode === "strokes"
                    ? `Luyện 11 nét viết cơ bản (Nét ${currentStroke.id}/11)`
                    : letterMode === "digraphs"
                    ? `14 Vần ghép & Âm đôi (Âm ${currentDigraph.id - 40}/14)`
                    : letterMode === "writing"
                    ? "Bảng luyện viết ô ly 4 dòng kẻ"
                    : letterMode === "grader"
                    ? "AI Chấm & Nhận Xét Bài Viết Chữ Đẹp"
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
          {letterMode !== "grader" && (
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <button
                onClick={handleTopPrev}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs sm:text-sm font-bold text-slate-700 transition-all"
              >
                ← Trước
              </button>
              <button
                onClick={handleTopNext}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-xs sm:text-sm font-black text-white shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Tiếp theo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </header>

        {/* Nội dung tương tác chính (Dynamic Playground) */}
        <section className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col justify-start">
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

              {letterMode === "strokes" && (
                <StrokesPracticeView
                  selectedStroke={currentStroke}
                  onSelectStroke={setCurrentStroke}
                />
              )}

              {letterMode === "digraphs" && (
                <DigraphsPracticeView
                  selectedDigraph={currentDigraph}
                  onSelectDigraph={setCurrentDigraph}
                />
              )}

              {letterMode === "writing" && (
                <LetterWritingCanvas currentLetter={currentLetter} />
              )}

              {letterMode === "grader" && <AiHandwritingGrader />}

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
