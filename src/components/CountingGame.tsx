"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { NumberCardData } from "@/types/number";
import { Sparkles, RotateCcw, Award } from "lucide-react";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";

interface CountingGameProps {
  card: NumberCardData;
}

export const CountingGame: React.FC<CountingGameProps> = ({ card }) => {
  const [countedSet, setCountedSet] = useState<Set<number>>(new Set());
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Reset mỗi khi đổi số
  useEffect(() => {
    setCountedSet(new Set());
    setIsCompleted(false);
  }, [card.number]);

  const animalImg = card.assets.single_animal
    ? `/data/module_numbers/${card.assets.single_animal.replace("assets/", "")}`
    : `/data/module_numbers/${card.assets.illustration.replace("assets/", "")}`;

  const handleAnimalClick = (index: number) => {
    if (countedSet.has(index)) return;

    const newSet = new Set(countedSet);
    newSet.add(index);
    const currentCount = newSet.size;
    setCountedSet(newSet);

    // Phát âm thanh tiếng đàn nốt nhạc vui tai (C4-C5)
    sound.playCountTone(currentCount);

    // Khi bé đếm đủ tất cả các con vật
    if (currentCount === card.count) {
      setIsCompleted(true);
      setTimeout(() => {
        sound.playSuccessSound();
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      }, 300);
    }
  };

  const resetCount = () => {
    setCountedSet(new Set());
    setIsCompleted(false);
  };

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto py-6">
      {/* Tiêu đề nhiệm vụ */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 font-bold text-xs uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          Nhiệm vụ: Chạm vào từng con vật để đếm
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
          Bé hãy đếm xem có bao nhiêu {card.item_name}?
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Chạm ngón tay hoặc bấm chuột vào từng hình nhé!
        </p>
      </div>

      {/* Bảng tiến độ đếm */}
      <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <span className="text-sm font-bold text-slate-500">Đã đếm được:</span>
        <div className="flex items-center gap-1">
          <span className="text-3xl font-black text-amber-600">{countedSet.size}</span>
          <span className="text-xl font-bold text-slate-400">/</span>
          <span className="text-2xl font-bold text-slate-700">{card.count}</span>
        </div>
        <button
          onClick={resetCount}
          className="ml-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Đếm lại từ đầu"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Khu vực các con vật để đếm */}
      <div className="w-full bg-gradient-to-b from-sky-50 to-emerald-50 rounded-3xl border-2 border-dashed border-sky-200 p-8 min-h-[360px] flex items-center justify-center shadow-inner">
        <div className="flex flex-wrap items-center justify-center gap-6 max-w-2xl">
          {Array.from({ length: card.count }).map((_, index) => {
            const isCounted = countedSet.has(index);
            const countOrder = Array.from(countedSet).indexOf(index) + 1;

            return (
              <button
                key={index}
                onClick={() => handleAnimalClick(index)}
                disabled={isCounted}
                className={`relative group rounded-3xl p-3 transition-all duration-300 transform active:scale-95 ${
                  isCounted
                    ? "bg-white/90 shadow-md ring-4 ring-emerald-400 scale-105"
                    : "bg-white hover:bg-amber-50 hover:scale-105 shadow-lg border-2 border-slate-100 cursor-pointer animate-pulse"
                }`}
              >
                {/* Hình ảnh con vật */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                  <Image
                    src={animalImg}
                    alt={`${card.item_name} số ${index + 1}`}
                    fill
                    sizes="120px"
                    className="object-contain"
                  />
                </div>

                {/* Badge số thứ tự khi đã đếm */}
                {isCounted ? (
                  <div className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-lg flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                    {countOrder}
                  </div>
                ) : (
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-bold text-xs flex items-center justify-center shadow border-2 border-white opacity-80 group-hover:opacity-100">
                    ?
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Thông báo hoàn thành & Thưởng */}
      {isCompleted && (
        <div className="mt-8 p-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-2xl animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Award className="w-8 h-8 text-amber-300" />
            </div>
            <div>
              <h3 className="text-xl font-black">Xuất sắc! Bé đã đếm đúng {card.count} {card.item_name}!</h3>
              <p className="text-sm text-emerald-100 mt-0.5">
                Chính xác rồi: Có đúng {card.count} {card.item_name}.
              </p>
            </div>
          </div>
          <div>
            <button
              onClick={resetCount}
              className="px-6 py-3 rounded-2xl bg-white text-emerald-700 font-bold text-sm shadow hover:bg-emerald-50 transition-all active:scale-95"
            >
              Đếm lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
