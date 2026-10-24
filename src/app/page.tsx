"use client";

import React, { useState, useEffect } from "react";
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
import { LetterQuizGame } from "@/components/LetterQuizGame";
import { AiHandwritingGrader } from "@/components/AiHandwritingGrader";

// Các component của phần HỌC SỐ (Kế thừa trọn vẹn từ bản cũ)
import { FlashcardView } from "@/components/FlashcardView";
import { CountingGame } from "@/components/CountingGame";
import { WritingCanvas } from "@/components/WritingCanvas";
import { NumberBondsInteractive } from "@/components/NumberBondsInteractive";
import { ParentGuideView } from "@/components/ParentGuideView";

// Component Nhật Ký Truy Cập & Hoạt Động Trực Tuyến
import { VisitorLogModal } from "@/components/VisitorLogModal";
import { LiveActivityToast } from "@/components/LiveActivityToast";

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

  // Trạng thái Nhật Ký Truy Cập & Bộ Lọc Chủ Sản Phẩm / Kỹ Sư
  const [isVisitorLogOpen, setIsVisitorLogOpen] = useState(false);
  const [isOwnerExcluded, setIsOwnerExcluded] = useState(false);
  const [visitorStats, setVisitorStats] = useState({ activeNow: 1, totalVisits: 0 });

  // Tải thống kê thực tế từ server
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/visitor-logs?includeDev=0", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.stats) {
            setVisitorStats({
              activeNow: json.stats.activeNow,
              totalVisits: json.stats.totalVisits,
            });
          }
        }
      } catch {
        // Im lặng
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  // Phần tử đang được chọn - lưu giữ trạng thái xuyên suốt quá trình chuyển đổi giữa các tab
  const [currentLetter, setCurrentLetter] = useState<LetterCardData>(letters[0]);
  const [currentNumber, setCurrentNumber] = useState<NumberCardData>(numbers[0]);
  const [currentStroke, setCurrentStroke] = useState<BasicStroke>(strokes[0]);
  const [currentDigraph, setCurrentDigraph] = useState<DigraphData>(digraphs[0]);

  // Khởi tạo trạng thái Chủ web / Dev (Loại trừ thống kê)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const isLocalhost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const hasOwnerParam =
      urlParams.get("owner") === "1" ||
      urlParams.get("dev") === "1" ||
      urlParams.get("admin") === "1";
    const storedOwner = localStorage.getItem("bevuihoc_owner_mode");

    const shouldExclude = isLocalhost || hasOwnerParam || storedOwner === "true";
    setIsOwnerExcluded(shouldExclude);
    if (shouldExclude) {
      localStorage.setItem("bevuihoc_owner_mode", "true");
    }
  }, []);

  const handleToggleOwnerExcluded = (val: boolean) => {
    setIsOwnerExcluded(val);
    localStorage.setItem("bevuihoc_owner_mode", val ? "true" : "false");
  };

  // Ghi nhận lượt truy cập của người dùng thực tế (Tự động loại trừ dev & chủ web)
  useEffect(() => {
    const logVisit = async () => {
      try {
        let actionType = "page_view";
        let actionName = "Truy cập ứng dụng";

        if (mainCategory === "letters") {
          if (letterMode === "grader") {
            actionType = "ai_grader";
            actionName = "AI Chấm & Soi Nét Bài Viết Lớp 1";
          } else if (letterMode === "writing") {
            actionType = "writing_practice";
            actionName = `Bé tập viết chữ "${currentLetter.letter.toLowerCase()}" thường ô ly`;
          } else if (letterMode === "strokes") {
            actionType = "strokes";
            actionName = `Luyện nét viết: ${currentStroke.name}`;
          } else if (letterMode === "digraphs") {
            actionType = "digraphs";
            actionName = `Học âm đôi / vần ghép: âm "${currentDigraph.name}"`;
          } else if (letterMode === "quiz") {
            actionType = "page_view";
            actionName = "Đố Vui Bắt Chữ Thông Minh";
          } else {
            actionType = "letter_view";
            actionName = `Khám phá Thẻ Chữ Cái 3D: Chữ ${currentLetter.letter}`;
          }
        } else {
          if (numberMode === "writing") {
            actionType = "writing_practice";
            actionName = `Bé tập viết số ${currentNumber.number} ô ly`;
          } else if (numberMode === "counting") {
            actionType = "math_game";
            actionName = `Bé tập đếm con vật tương tác: Số ${currentNumber.number}`;
          } else if (numberMode === "bonds") {
            actionType = "math_game";
            actionName = `Tách - Gộp Số Singapore CPA: Số ${currentNumber.number}`;
          } else if (numberMode === "guide") {
            actionType = "parent_guide";
            actionName = "Xem Cẩm Nang Góc Ba Mẹ";
          } else {
            actionType = "page_view";
            actionName = `Khám phá Thẻ Học Số 3D: Số ${currentNumber.number}`;
          }
        }

        await fetch("/api/visitor-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isDev: isOwnerExcluded,
            actionType,
            actionName,
            path: `/?cat=${mainCategory}&mode=${mainCategory === "letters" ? letterMode : numberMode}`,
          }),
        });
      } catch {
        // Im lặng để không làm gián đoạn trải nghiệm
      }
    };

    const timer = setTimeout(logVisit, 1200);
    return () => clearTimeout(timer);
  }, [
    mainCategory,
    letterMode,
    numberMode,
    currentLetter,
    currentNumber,
    currentStroke,
    currentDigraph,
    isOwnerExcluded,
  ]);

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
        onOpenVisitorLog={() => setIsVisitorLogOpen(true)}
        isOwnerExcluded={isOwnerExcluded}
        activeOnlineCount={visitorStats.activeNow}
        totalVisitsCount={visitorStats.totalVisits}
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
                : letterMode === "writing"
                ? currentLetter.letter.toLowerCase()
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
                    : letterMode === "writing"
                    ? `Chữ "${currentLetter.letter.toLowerCase()}" thường (${currentLetter.name})`
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
                    ? `Tập viết chữ thường ô ly: chữ "${currentLetter.letter.toLowerCase()}"`
                    : letterMode === "grader"
                    ? "AI Chấm & Nhận Xét Bài Viết Chữ Đẹp"
                    : "Đố Vui Bắt Chữ Thông Minh"
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

          {/* Các nút hành động bên phải Header */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* Huy hiệu Nhật Ký & Số người Online uy tín */}
            <button
              onClick={() => {
                sound.playTone(480, 0.05);
                setIsVisitorLogOpen(true);
              }}
              className="min-h-[44px] px-3 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-bold text-slate-700 border border-slate-200/90 transition-all flex items-center gap-2 shadow-2xs"
              title="Xem nhật ký truy cập thực tế"
            >
              <div className="relative">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute inset-0 animate-ping opacity-75" />
              </div>
              <span className="font-black text-slate-800">{visitorStats.activeNow} Online</span>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-violet-600 font-black hidden sm:inline font-mono">
                {visitorStats.totalVisits.toLocaleString()} Lượt học
              </span>
              {isOwnerExcluded && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-200 hidden md:inline">
                  🛡️ Chủ web
                </span>
              )}
            </button>

            {/* Nút lùi / tới nhanh */}
            {letterMode !== "grader" && (
              <>
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
              </>
            )}
          </div>
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

      {/* 3. MODAL NHẬT KÝ TRUY CẬP VÀ THỐNG KÊ HOẠT ĐỘNG */}
      <VisitorLogModal
        isOpen={isVisitorLogOpen}
        onClose={() => setIsVisitorLogOpen(false)}
        isOwnerExcluded={isOwnerExcluded}
        onToggleOwnerExcluded={handleToggleOwnerExcluded}
      />

      {/* 4. TOAST THÔNG BÁO HOẠT ĐỘNG THỜI GIAN THỰC (SOCIAL PROOF) */}
      <LiveActivityToast onOpenModal={() => setIsVisitorLogOpen(true)} />
    </div>
  );
}
