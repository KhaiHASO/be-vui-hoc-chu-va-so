"use client";

import React from "react";
import { NumberCardData } from "@/types/number";
import { BookOpen, Sparkles, Split, PenTool, HeartHandshake } from "lucide-react";

export type Mode = "card" | "counting" | "bonds" | "writing" | "parent";

interface NavbarProps {
  numbers: NumberCardData[];
  currentNumber: NumberCardData;
  onSelectNumber: (num: NumberCardData) => void;
  currentMode: Mode;
  onChangeMode: (mode: Mode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  numbers,
  currentNumber,
  onSelectNumber,
  currentMode,
  onChangeMode,
}) => {
  const modes: { id: Mode; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "card", label: "Thẻ Học Số", icon: <BookOpen className="w-5 h-5" />, color: "bg-blue-500" },
    { id: "counting", label: "Bé Tập Đếm", icon: <Sparkles className="w-5 h-5" />, color: "bg-amber-500" },
    { id: "bonds", label: "Tách - Gộp Số", icon: <Split className="w-5 h-5" />, color: "bg-emerald-500" },
    { id: "writing", label: "Bé Tập Viết", icon: <PenTool className="w-5 h-5" />, color: "bg-purple-500" },
    { id: "parent", label: "Góc Phụ Huynh", icon: <HeartHandshake className="w-5 h-5" />, color: "bg-rose-500" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Hàng 1: Tiêu đề & Chọn số */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100 min-w-0">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
              123
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Bé Học Toán Lớp 1
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                  Thẻ 71 – 80
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium truncate">
                Nhận diện số • Tập đếm • Tách gộp số • Chuẩn Bộ Giáo Dục
              </p>
            </div>
          </div>

          {/* Dải chọn số từ 1 đến 10 - có py-2 để badge không bị cắt và shrink-0 để không méo nút */}
          <div className="flex items-center gap-2 overflow-x-auto scroll-smooth py-2 -mx-4 px-4 sm:mx-0 sm:px-1 min-w-0 max-w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 hidden lg:inline">
              Chọn số:
            </span>
            {numbers.map((item) => {
              const isActive = item.number === currentNumber.number;
              return (
                <button
                  key={item.number}
                  onClick={() => onSelectNumber(item)}
                  className={`relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-black text-base sm:text-lg shrink-0 transition-all transform active:scale-95 shadow-sm ${
                    isActive
                      ? "bg-gradient-to-b from-rose-500 to-red-600 text-white shadow-rose-300 shadow-md ring-2 ring-rose-300 scale-105 z-10"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900"
                  }`}
                  title={`${item.word} (Thẻ ${item.card_id})`}
                >
                  {item.number}
                  <span
                    className={`absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-white shadow-xs ${
                      isActive ? "bg-amber-400 text-slate-900" : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    {item.card_id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hàng 2: Chọn Chế độ Học */}
        <div className="flex items-center justify-between gap-2 pt-2.5 overflow-x-auto scroll-smooth pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:none">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {modes.map((mode) => {
              const isActive = currentMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => onChangeMode(mode.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all shadow-xs shrink-0 active:scale-95 min-h-[40px] ${
                    isActive
                      ? `${mode.color} text-white shadow-md scale-102 ring-2 ring-offset-1 ring-slate-200`
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <span className="shrink-0">{mode.icon}</span>
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Badge thông tin thẻ hiện tại */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shrink-0 ml-auto">
            <span className="capitalize">{currentNumber.word}</span>
            <span className="text-amber-400">•</span>
            <span>{currentNumber.count} {currentNumber.item_name}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
