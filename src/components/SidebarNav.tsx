"use client";

import React, { useState } from "react";
import {
  MainCategory,
  LetterSubMode,
  NumberSubMode,
  LetterCardData,
  BasicStroke,
  DigraphData,
} from "@/types/letter";
import { NumberCardData } from "@/types/number";
import {
  BookOpen,
  Sparkles,
  PenTool,
  Volume2,
  Gamepad2,
  Calculator,
  Smile,
  Hash,
  HeartHandshake,
  ChevronRight,
  Menu,
  X,
  VolumeX,
  Maximize2,
  Minimize2,
  Award,
} from "lucide-react";
import { sound } from "@/utils/speech";

interface SidebarNavProps {
  mainCategory: MainCategory;
  onSelectMainCategory: (cat: MainCategory) => void;
  letterMode: LetterSubMode;
  onSelectLetterMode: (mode: LetterSubMode) => void;
  numberMode: NumberSubMode;
  onSelectNumberMode: (mode: NumberSubMode) => void;
  letters: LetterCardData[];
  currentLetter: LetterCardData;
  onSelectLetter: (letter: LetterCardData) => void;
  numbers: NumberCardData[];
  currentNumber: NumberCardData;
  onSelectNumber: (num: NumberCardData) => void;
  strokes?: BasicStroke[];
  currentStroke?: BasicStroke;
  onSelectStroke?: (stroke: BasicStroke) => void;
  digraphs?: DigraphData[];
  currentDigraph?: DigraphData;
  onSelectDigraph?: (digraph: DigraphData) => void;
  onOpenVisitorLog?: () => void;
  isOwnerExcluded?: boolean;
  activeOnlineCount?: number;
  totalVisitsCount?: number;
}

export function SidebarNav({
  mainCategory,
  onSelectMainCategory,
  letterMode,
  onSelectLetterMode,
  numberMode,
  onSelectNumberMode,
  letters,
  currentLetter,
  onSelectLetter,
  numbers,
  currentNumber,
  onSelectNumber,
  strokes,
  currentStroke,
  onSelectStroke,
  digraphs,
  currentDigraph,
  onSelectDigraph,
  onOpenVisitorLog,
  isOwnerExcluded = false,
  activeOnlineCount = 1,
  totalVisitsCount = 0,
}: SidebarNavProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    sound.playTone(440, 0.05);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const letterSubItems = [
    { mode: "flashcard" as LetterSubMode, label: "Thẻ Chữ Cái 3D (29 Chữ)", icon: BookOpen },
    { mode: "strokes" as LetterSubMode, label: "11 Nét Cơ Bản", icon: Sparkles },
    { mode: "digraphs" as LetterSubMode, label: "14 Vần Ghép & Âm Đôi", icon: Sparkles },
    { mode: "writing" as LetterSubMode, label: "Bé Tập Viết Ô Ly", icon: PenTool },
    { mode: "grader" as LetterSubMode, label: "AI Chấm Bài Viết ⭐", icon: Award },
    { mode: "quiz" as LetterSubMode, label: "Đố Vui Bắt Chữ", icon: Gamepad2 },
  ];

  const numberSubItems = [
    { mode: "card" as NumberSubMode, label: "Thẻ Học Số 3D", icon: Hash },
    { mode: "counting" as NumberSubMode, label: "Bé Tập Đếm", icon: Smile },
    { mode: "writing" as NumberSubMode, label: "Bé Tập Viết Số", icon: PenTool },
    { mode: "bonds" as NumberSubMode, label: "Tách - Gộp Số (5 Trò)", icon: Calculator },
    { mode: "guide" as NumberSubMode, label: "Góc Ba Mẹ", icon: HeartHandshake },
  ];

  const SidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-white select-none">
      {/* 1. Header Sidebar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-violet-600 to-rose-500 flex items-center justify-center font-black text-xl shadow-md">
            ⭐
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
              Bé Vui Học
            </h1>
            <p className="text-xs text-amber-400 font-bold tracking-wide uppercase">
              Chữ Và Số Lớp 1
            </p>
          </div>
        </div>

        {/* Nút đóng drawer trên mobile */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Thẻ Uy Tín: Số người đang học & Nhật Ký Truy Cập */}
      <div className="px-3 pt-3">
        <button
          onClick={() => {
            sound.playTone(480, 0.05);
            onOpenVisitorLog?.();
          }}
          className="w-full text-left p-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-750 active:scale-95 border border-slate-700/80 transition-all flex items-center justify-between group shadow-inner"
          title="Bấm để xem nhật ký truy cập từ các trường tiểu học"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute inset-0 animate-ping opacity-75" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>{activeOnlineCount} đang online</span>
                {isOwnerExcluded && (
                  <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    Chủ web
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-semibold group-hover:text-violet-300 transition-colors truncate">
                Nhật ký truy cập Live &gt;
              </div>
            </div>
          </div>
          <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20 shrink-0 font-mono">
            {totalVisitsCount > 1000 ? `${(totalVisitsCount / 1000).toFixed(1)}k` : totalVisitsCount}
          </span>
        </button>
      </div>

      {/* 2. Hai Hạng Mục Lớn (Tabs Chính) */}
      <div className="p-3 border-b border-slate-800">
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/80 rounded-2xl">
          <button
            onClick={() => {
              sound.playTone(523.25, 0.1);
              onSelectMainCategory("letters");
            }}
            className={`min-h-[44px] py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
              mainCategory === "letters"
                ? "bg-violet-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="text-base">🅰️</span>
            <span>Học Chữ</span>
          </button>

          <button
            onClick={() => {
              sound.playTone(659.25, 0.1);
              onSelectMainCategory("numbers");
            }}
            className={`min-h-[44px] py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
              mainCategory === "numbers"
                ? "bg-rose-500 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="text-base">🔢</span>
            <span>Học Số</span>
          </button>
        </div>
      </div>

      {/* 3. Danh Sách Menu Con Của Hạng Mục Đang Chọn */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
        <div className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
          {mainCategory === "letters" ? "Hoạt Động Tiếng Việt" : "Hoạt Động Toán Học"}
        </div>

        {mainCategory === "letters"
          ? letterSubItems.map((item) => {
              const Icon = item.icon;
              const isActive = letterMode === item.mode;
              return (
                <button
                  key={item.mode}
                  onClick={() => {
                    sound.playTone(440, 0.08);
                    onSelectLetterMode(item.mode);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-95 ${
                    isActive
                      ? "bg-linear-to-r from-violet-600 to-indigo-600 text-white shadow-md font-black"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-amber-300" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
                </button>
              );
            })
          : numberSubItems.map((item) => {
              const Icon = item.icon;
              const isActive = numberMode === item.mode;
              return (
                <button
                  key={item.mode}
                  onClick={() => {
                    sound.playTone(440, 0.08);
                    onSelectNumberMode(item.mode);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-95 ${
                    isActive
                      ? "bg-linear-to-r from-rose-500 to-amber-500 text-white shadow-md font-black"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-yellow-200" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
                </button>
              );
            })}

        {/* 4. Dải Chọn Nhanh Phần Tử Đang Học */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            {mainCategory === "letters"
              ? letterMode === "strokes"
                ? "Chọn Nhanh 11 Nét:"
                : letterMode === "digraphs"
                ? "Chọn Nhanh 14 Vần Ghép:"
                : letterMode === "writing"
                ? "Chọn Chữ Thường Tập Viết:"
                : "Chọn Nhanh Chữ Cái:"
              : "Chọn Nhanh Số Học:"}
          </div>

          {mainCategory === "letters" ? (
            letterMode === "strokes" && strokes ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 px-2">
                {strokes.map((st, idx) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      sound.playTone(500, 0.05);
                      onSelectStroke?.(st);
                    }}
                    className={`min-h-[40px] px-1 py-1 rounded-xl font-bold text-xs transition-all active:scale-95 flex flex-col items-center justify-center ${
                      currentStroke?.id === st.id
                        ? "bg-amber-400 text-slate-900 shadow-md font-black ring-2 ring-amber-300 ring-offset-1 ring-offset-slate-900"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                    title={st.name}
                  >
                    <span className="text-[10px] opacity-75">Nét {idx + 1}</span>
                    <span className="truncate max-w-[50px] font-black">{st.name.replace("Nét ", "")}</span>
                  </button>
                ))}
              </div>
            ) : letterMode === "digraphs" && digraphs ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 px-2">
                {digraphs.map((dg) => (
                  <button
                    key={dg.id}
                    onClick={() => {
                      sound.playTone(500, 0.05);
                      onSelectDigraph?.(dg);
                    }}
                    className={`min-h-[40px] px-2 py-1 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center justify-center ${
                      currentDigraph?.id === dg.id
                        ? "bg-amber-400 text-slate-900 shadow-md font-black ring-2 ring-amber-300 ring-offset-1 ring-offset-slate-900"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                    title={`${dg.name} (${dg.sample})`}
                  >
                    <span className="font-black text-sm">{dg.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5 px-2">
                {letters.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      sound.playTone(500, 0.05);
                      onSelectLetter(l);
                    }}
                    className={`min-h-[40px] rounded-xl font-black text-xs transition-all active:scale-95 ${
                      currentLetter.id === l.id
                        ? "bg-amber-400 text-slate-900 shadow-md font-black ring-2 ring-amber-300 ring-offset-1 ring-offset-slate-900"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    {letterMode === "writing" ? l.letter.toLowerCase() : l.letter}
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-5 gap-2 px-2">
              {numbers.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    sound.playTone(500, 0.05);
                    onSelectNumber(n);
                  }}
                  className={`min-h-[44px] rounded-xl font-black text-sm transition-all active:scale-95 ${
                    currentNumber.id === n.id
                      ? "bg-amber-400 text-slate-900 shadow-md font-black ring-2 ring-amber-300 ring-offset-1 ring-offset-slate-900"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {n.number}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Footer Sidebar */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <button
          onClick={toggleSound}
          className="min-h-[44px] min-w-[44px] p-2 rounded-xl hover:bg-slate-800 flex items-center gap-1.5 text-slate-400 hover:text-white"
          title="Bật/Tắt âm thanh hiệu ứng"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          <span className="hidden sm:inline">{soundEnabled ? "Âm thanh: Bật" : "Âm thanh: Tắt"}</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="min-h-[44px] min-w-[44px] p-2 rounded-xl hover:bg-slate-800 flex items-center gap-1.5 text-slate-400 hover:text-white"
          title="Toàn màn hình"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span className="hidden sm:inline">Toàn màn hình</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* THANH TOP BAR DI ĐỘNG (Chỉ hiện trên Mobile < lg) */}
      <header className="lg:hidden sticky top-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center"
            aria-label="Mở Menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <span className="font-black text-sm tracking-tight">Bé Vui Học</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-600 text-white">
              {mainCategory === "letters" ? "🅰️ Học Chữ" : "🔢 Học Số"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              sound.playTone(480, 0.05);
              onOpenVisitorLog?.();
            }}
            className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-emerald-400 border border-slate-700 flex items-center gap-1.5"
            title="Xem nhật ký truy cập"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Online:</span>
            <span>{activeOnlineCount}</span>
          </button>

          <button
            onClick={() => onSelectMainCategory(mainCategory === "letters" ? "numbers" : "letters")}
            className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 border border-slate-700 active:scale-95"
          >
            {mainCategory === "letters" ? "🔢 Học Số" : "🅰️ Học Chữ"}
          </button>
        </div>
      </header>

      {/* SIDEBAR CỐ ĐỊNH TRÊN DESKTOP / TABLET (>= lg) */}
      <aside className="hidden lg:flex w-72 xl:w-80 h-screen sticky top-0 shrink-0 z-30 shadow-xl">
        {SidebarContent}
      </aside>

      {/* MOBILE DRAWER (Trượt ra khi bấm Hamburger trên Mobile) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {SidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
