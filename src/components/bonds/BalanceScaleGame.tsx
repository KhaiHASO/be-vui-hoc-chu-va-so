"use client";

import React, { useState, useEffect } from "react";
import { NumberCardData } from "@/types/number";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";
import { Scale, CheckCircle2, RotateCcw, ArrowRight, Star, Sparkles } from "lucide-react";

interface BalanceScaleGameProps {
  card: NumberCardData;
}

export const BalanceScaleGame: React.FC<BalanceScaleGameProps> = ({ card }) => {
  const total = card.number;

  // Đĩa trái: Quả cân tổng (total)
  // Đĩa phải: Quả cân A có sẵn (partA) + Quả cân B bé chọn (placedWeight)
  const [partA, setPartA] = useState<number>(1);
  const targetWeight = total - partA; // Quả cân cần đặt để cân bằng

  const [placedWeight, setPlacedWeight] = useState<number | null>(null);
  const [isBalanced, setIsBalanced] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  // Sinh vòng mới
  const generateNewRound = () => {
    // Chọn ngẫu nhiên partA từ 1 đến total - 1 (nếu total = 1 thì partA = 0)
    const newA = total > 1 ? Math.floor(Math.random() * (total - 1)) + 1 : 0;
    setPartA(newA);
    setPlacedWeight(null);
    setIsBalanced(false);
  };

  useEffect(() => {
    generateNewRound();
  }, [card.number]);

  // Sinh 3 quả cân lựa chọn
  const [weightOptions, setWeightOptions] = useState<number[]>([]);

  useEffect(() => {
    const needed = total - partA;
    const opts = new Set<number>([needed]);
    while (opts.size < Math.min(4, total + 1)) {
      const candidate = Math.floor(Math.random() * (total + 1));
      opts.add(candidate);
    }
    setWeightOptions(Array.from(opts).sort((a, b) => a - b));
  }, [partA, total]);

  // Tính góc nghiêng cán cân (-15 độ nếu trái nặng hơn, +15 độ nếu phải nặng hơn, 0 nếu cân bằng)
  const leftMass = total;
  const rightMass = partA + (placedWeight ?? 0);
  const diff = rightMass - leftMass;
  const tiltAngle = Math.max(-14, Math.min(14, diff * 4));

  // Khi bé chọn một quả cân đặt lên đĩa phải
  const handlePlaceWeight = (w: number) => {
    setPlacedWeight(w);

    if (w === total - partA) {
      setIsBalanced(true);
      setScore((s) => s + 1);
      sound.playSuccessSound();
      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } else {
      setIsBalanced(false);
      sound.playCountTone(w);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tiêu đề & Điểm */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-5 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-emerald-950">
              Chiếc Cân Thăng Bằng Của Số {total}
            </h3>
            <p className="text-xs text-emerald-800">
              Bên trái nặng {total}. Chọn quả cân phù hợp đặt vào bên phải để cân thăng bằng!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-emerald-200 shadow-xs">
          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span className="text-xs font-bold text-slate-500">Điểm sao:</span>
          <span className="text-sm font-black text-emerald-700">{score} ⭐</span>
        </div>
      </div>

      {/* KHU VỰC CÁN CÂN SVG TƯƠNG TÁC */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col items-center">
        <div className="relative w-full max-w-lg aspect-[16/10] flex items-center justify-center overflow-hidden">
          {/* Trục đỡ ở giữa (Fulcrum cố định) */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[40px] border-b-slate-700" />
            <div className="w-16 h-4 bg-slate-800 rounded-full shadow-md" />
          </div>

          {/* Cán cân quay quanh tâm (Animated Tilt) */}
          <div
            className="absolute top-1/2 left-1/2 w-4/5 h-4 -mt-2 -ml-[40%] transition-transform duration-500 ease-out origin-center flex items-center justify-between"
            style={{ transform: `rotate(${tiltAngle}deg)` }}
          >
            {/* Thanh đòn ngang */}
            <div className="absolute inset-0 bg-slate-700 rounded-full shadow-md" />

            {/* Trụ treo đĩa cân trái */}
            <div
              className="absolute left-0 top-2 flex flex-col items-center origin-top transition-transform duration-500"
              style={{ transform: `rotate(${-tiltAngle}deg)` }}
            >
              <div className="w-0.5 h-16 bg-slate-400" />
              {/* Đĩa cân trái */}
              <div className="w-28 sm:w-32 h-6 bg-rose-400 rounded-b-full border-t-2 border-rose-600 shadow-md relative flex items-center justify-center">
                {/* Quả cân trái (Số total) */}
                <div className="absolute -top-12 w-12 h-12 rounded-xl bg-gradient-to-b from-rose-500 to-rose-600 text-white font-black text-xl flex items-center justify-center shadow-md border-2 border-white">
                  {total}
                </div>
              </div>
            </div>

            {/* Trụ treo đĩa cân phải */}
            <div
              className="absolute right-0 top-2 flex flex-col items-center origin-top transition-transform duration-500"
              style={{ transform: `rotate(${-tiltAngle}deg)` }}
            >
              <div className="w-0.5 h-16 bg-slate-400" />
              {/* Đĩa cân phải */}
              <div className="w-28 sm:w-32 h-6 bg-emerald-400 rounded-b-full border-t-2 border-emerald-600 shadow-md relative flex items-center justify-center gap-1.5">
                {/* Quả cân partA có sẵn */}
                <div className="absolute -top-12 left-2 w-11 h-11 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md border-2 border-white">
                  {partA}
                </div>

                {/* Quả cân placedWeight do bé đặt */}
                {placedWeight !== null ? (
                  <div className="absolute -top-12 right-2 w-11 h-11 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-md border-2 border-white animate-in zoom-in duration-200">
                    {placedWeight}
                  </div>
                ) : (
                  <div className="absolute -top-12 right-2 w-11 h-11 rounded-xl border-2 border-dashed border-emerald-400 bg-white/80 text-emerald-600 font-black text-sm flex items-center justify-center animate-pulse">
                    ?
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Thông báo trạng thái cân */}
        <div className="mt-2 text-center">
          {placedWeight === null ? (
            <p className="text-sm font-bold text-slate-500">
              Đĩa phải đang thiếu 1 quả cân. Cán cân đang bị lệch sang bên trái!
            </p>
          ) : isBalanced ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 font-black text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Cân đã thăng bằng tuyệt đối! {total} = {partA} + {placedWeight}</span>
            </div>
          ) : diff < 0 ? (
            <p className="text-sm font-bold text-amber-600">
              Quả cân số {placedWeight} vẫn còn hơi nhẹ, bên trái vẫn nặng hơn! Bé thử quả khác nhé.
            </p>
          ) : (
            <p className="text-sm font-bold text-rose-600">
              Quả cân số {placedWeight} bị nặng quá rồi! Cán cân lệch sang bên phải mất rồi.
            </p>
          )}
        </div>

        {/* HÀNG QUẢ CÂN ĐỂ BÉ CHỌN ĐẶT LÊN */}
        <div className="mt-6 flex flex-col items-center gap-3 w-full">
          {!isBalanced ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Bé chọn quả cân nào để đặt vào đĩa phải?
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {weightOptions.map((w) => (
                  <button
                    key={w}
                    onClick={() => handlePlaceWeight(w)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl font-black text-xl transition-all active:scale-90 shadow-md flex items-center justify-center min-h-[44px] min-w-[44px] ${
                      placedWeight === w
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-200 scale-105"
                        : "bg-gradient-to-b from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-800 hover:scale-105"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <button
              onClick={generateNewRound}
              className="mt-2 flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-md transition-all active:scale-95 min-h-[44px]"
            >
              <span>Thử Thách Cân Tiếp Theo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
