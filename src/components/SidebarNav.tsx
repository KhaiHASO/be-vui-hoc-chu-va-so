"use client";

import React, { useState } from "react";
import {
  MainCategory,
  LetterSubMode,
  NumberSubMode,
  LetterCardData,
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
    { mode: "flashcard" as LetterSubMode, label: "Thẻ Chữ Cái 3D", icon: BookOpen },
    { mode: "strokes" as LetterSubMode, label: "14 Nét Cơ Bản", icon: Sparkles },
    { mode: "writing" as LetterSubMode, label: "Bé Tập Viết Chữ", icon: PenTool },
    { mode: "mouth" as LetterSubMode, label: "Khẩu Hình Phát Âm", icon: Volume2 },
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
            {mainCategory === "letters" ? "Chọn Nhanh Chữ Cái:" : "Chọn Nhanh Số Học:"}
          </div>

          {mainCategory === "letters" ? (
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
                      ? "bg-amber-400 text-slate-900 shadow-md font-black scale-105"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {l.upper}
                </button>
              ))}
            </div>
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
                      ? "bg-amber-400 text-slate-900 shadow-md font-black scale-105"
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

        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectMainCategory(mainCategory === "letters" ? "numbers" : "letters")}
            className="min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-400 border border-slate-700"
          >
            Đổi sang {mainCategory === "letters" ? "🔢 Học Số" : "🅰️ Học Chữ"}
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
