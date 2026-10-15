"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { NumberCardData } from "@/types/number";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";
import { Trophy, CheckCircle2, RotateCcw, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

interface BasketsGameProps {
  card: NumberCardData;
}

export const BasketsGame: React.FC<BasketsGameProps> = ({ card }) => {
  const total = card.number;

  // Trạng thái chia đồ vật vào 2 giỏ
  const [basketA, setBasketA] = useState<number>(Math.ceil(total / 2));
  const [basketB, setBasketB] = useState<number>(total - Math.ceil(total / 2));

  // Bộ sưu tập các cách tách bé đã khám phá được (ví dụ: "3-2", "4-1")
  const [foundPairs, setFoundPairs] = useState<Set<string>>(new Set());

  const animalImg = card.assets.single_animal
    ? `/data/module_numbers/${card.assets.single_animal.replace("assets/", "")}`
    : `/data/module_numbers/${card.assets.illustration.replace("assets/", "")}`;

  // Reset khi đổi số
  useEffect(() => {
    const initA = Math.ceil(card.number / 2);
    const initB = card.number - initA;
    setBasketA(initA);
    setBasketB(initB);
    setFoundPairs(new Set([`${initA}-${initB}`]));
  }, [card.number]);

  // Cập nhật bộ sưu tập khi đổi số lượng giỏ
  const updateFoundPairs = (a: number, b: number) => {
    const pairKey = `${a}-${b}`;
    setFoundPairs((prev) => {
      const next = new Set(prev);
      if (!next.has(pairKey)) {
        next.add(pairKey);
        // Nếu tìm đủ tất cả các cách tách (từ 0 đến total = total + 1 cách)
        if (next.size === total + 1) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          sound.playSuccessSound();
        }
      }
      return next;
    });
  };

  // Chuyển 1 con vật từ Giỏ B sang Giỏ A
  const moveBtoA = () => {
    if (basketB <= 0) return;
    const newA = basketA + 1;
    const newB = basketB - 1;
    setBasketA(newA);
    setBasketB(newB);
    sound.playCountTone(newA);
    updateFoundPairs(newA, newB);
  };

  // Chuyển 1 con vật từ Giỏ A sang Giỏ B
  const moveAtoB = () => {
    if (basketA <= 0) return;
    const newA = basketA - 1;
    const newB = basketB + 1;
    setBasketA(newA);
    setBasketB(newB);
    sound.playCountTone(newB);
    updateFoundPairs(newA, newB);
  };

  // Chạm trực tiếp vào con vật ở Giỏ A để sang Giỏ B
  const handleAnimalClickA = () => {
    moveAtoB();
  };

  // Chạm trực tiếp vào con vật ở Giỏ B để sang Giỏ A
  const handleAnimalClickB = () => {
    moveBtoA();
  };

  const isCompletedAll = foundPairs.size === total + 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Khung hướng dẫn & Tiến độ cúp */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0 shadow-sm">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-amber-950">
              Thử Thách: Tìm Đủ Mọi Cách Tách Số {total}
            </h3>
            <p className="text-xs text-amber-800">
              Chạm vào con vật hoặc dùng nút mũi tên để chia vào 2 giỏ.
            </p>
          </div>
        </div>

        {/* Huy hiệu tiến độ */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-amber-200 shadow-xs shrink-0">
          <span className="text-xs font-bold text-slate-500">Tiến độ:</span>
          <span className="text-sm font-black text-amber-600">
            {foundPairs.size} / {total + 1} cách
          </span>
          {isCompletedAll && (
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 animate-pulse">
              Tuyệt đỉnh! 🏆
            </span>
          )}
        </div>
      </div>

      {/* KHU VỰC 2 GIỎ TƯƠNG TÁC CHÍNH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* GIỎ 1 (Xanh dương) */}
        <div className="bg-white rounded-3xl p-6 border-2 border-blue-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-500 text-white font-black text-sm flex items-center justify-center">
                1
              </span>
              <h4 className="text-sm font-black text-blue-900">Giỏ Xanh Dương</h4>
            </div>
            <span className="text-2xl font-black text-blue-600 px-3 py-1 bg-blue-50 rounded-xl border border-blue-200">
              {basketA}
            </span>
          </div>

          {/* Vùng chứa các con vật (Bé có thể bấm trực tiếp vào con vật để chuyển) */}
          <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 min-h-[140px] flex flex-wrap items-center justify-center gap-3 content-center">
            {Array.from({ length: basketA }).map((_, i) => (
              <button
                key={i}
                onClick={handleAnimalClickA}
                className="relative w-12 h-12 sm:w-14 sm:h-14 transition-transform active:scale-90 hover:scale-110 cursor-pointer"
                title="Bấm để chuyển sang Giỏ Cam"
              >
                <Image src={animalImg} alt="con vật" fill sizes="60px" className="object-contain" />
              </button>
            ))}
            {basketA === 0 && (
              <p className="text-xs text-slate-400 italic">Giỏ đang trống (0)</p>
            )}
          </div>

          {/* Nút chuyển */}
          <div className="mt-4 flex items-center justify-end">
            <button
              onClick={moveAtoB}
              disabled={basketA <= 0}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all min-h-[44px] ${
                basketA > 0
                  ? "bg-blue-500 hover:bg-blue-600 text-white shadow-xs active:scale-95"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              <span>Chuyển 1 sang Giỏ Cam</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* GIỎ 2 (Cam / Hổ phách) */}
        <div className="bg-white rounded-3xl p-6 border-2 border-amber-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center">
                2
              </span>
              <h4 className="text-sm font-black text-amber-900">Giỏ Cam</h4>
            </div>
            <span className="text-2xl font-black text-amber-600 px-3 py-1 bg-amber-50 rounded-xl border border-amber-200">
              {basketB}
            </span>
          </div>

          {/* Vùng chứa các con vật Giỏ 2 */}
          <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 min-h-[140px] flex flex-wrap items-center justify-center gap-3 content-center">
            {Array.from({ length: basketB }).map((_, i) => (
              <button
                key={i}
                onClick={handleAnimalClickB}
                className="relative w-12 h-12 sm:w-14 sm:h-14 transition-transform active:scale-90 hover:scale-110 cursor-pointer"
                title="Bấm để chuyển sang Giỏ Xanh"
              >
                <Image src={animalImg} alt="con vật" fill sizes="60px" className="object-contain" />
              </button>
            ))}
            {basketB === 0 && (
              <p className="text-xs text-slate-400 italic">Giỏ đang trống (0)</p>
            )}
          </div>

          {/* Nút chuyển */}
          <div className="mt-4 flex items-center justify-start">
            <button
              onClick={moveBtoA}
              disabled={basketB <= 0}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all min-h-[44px] ${
                basketB > 0
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-95"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Chuyển 1 sang Giỏ Xanh</span>
            </button>
          </div>
        </div>
      </div>

      {/* SƠ ĐỒ VÀ KHẨU QUYẾT TÁCH - GỘP THỜI GIAN THỰC */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-around gap-4 text-center">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-black text-rose-600 px-3 py-1 bg-rose-50 rounded-xl border border-rose-200">
            {total}
          </span>
          <span className="text-sm font-bold text-slate-400">gồm</span>
          <span className="text-3xl font-black text-blue-600 px-3 py-1 bg-blue-50 rounded-xl border border-blue-200">
            {basketA}
          </span>
          <span className="text-sm font-bold text-slate-400">và</span>
          <span className="text-3xl font-black text-amber-600 px-3 py-1 bg-amber-50 rounded-xl border border-amber-200">
            {basketB}
          </span>
        </div>

        <div className="h-8 w-px bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-400">Gộp</span>
          <span className="text-2xl font-black text-blue-600">{basketA}</span>
          <span className="text-sm font-bold text-slate-400">và</span>
          <span className="text-2xl font-black text-amber-600">{basketB}</span>
          <span className="text-sm font-bold text-slate-400">được</span>
          <span className="text-2xl font-black text-rose-600">{total}</span>
        </div>
      </div>

      {/* BẢNG THU THẬP TẤT CẢ CÁC CÁCH TÁCH CỦA SỐ NÀY */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Bảng Thu Thập Các Cách Tách Số {total}:
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {Array.from({ length: total + 1 }).map((_, idx) => {
            const a = total - idx;
            const b = idx;
            const pairKey = `${a}-${b}`;
            const isFound = foundPairs.has(pairKey);
            const isCurrent = basketA === a && basketB === b;

            return (
              <button
                key={idx}
                onClick={() => {
                  setBasketA(a);
                  setBasketB(b);
                  sound.playCountTone(a);
                  updateFoundPairs(a, b);
                }}
                className={`p-3 rounded-2xl border text-center transition-all min-h-[50px] flex flex-col items-center justify-center ${
                  isCurrent
                    ? "bg-amber-100 border-amber-400 ring-2 ring-amber-300 font-black shadow-xs scale-102"
                    : isFound
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                    : "bg-slate-50 border-dashed border-slate-300 text-slate-400"
                }`}
              >
                {isFound ? (
                  <>
                    <span className="text-xs font-black">
                      {a} và {b}
                    </span>
                    <span className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Đã tìm
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400">? và ?</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
