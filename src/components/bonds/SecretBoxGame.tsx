"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { NumberCardData } from "@/types/number";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";
import { Package, HelpCircle, Sparkles, CheckCircle2, RotateCcw, ArrowRight, Star } from "lucide-react";

interface SecretBoxGameProps {
  card: NumberCardData;
}

export const SecretBoxGame: React.FC<SecretBoxGameProps> = ({ card }) => {
  const total = card.number;

  // Số lượng ẩn trong hộp (hiddenCount) và số lộ ra ngoài (visibleCount)
  const [hiddenCount, setHiddenCount] = useState<number>(1);
  const [visibleCount, setVisibleCount] = useState<number>(total - 1);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const animalImg = card.assets.single_animal
    ? `/data/module_numbers/${card.assets.single_animal.replace("assets/", "")}`
    : `/data/module_numbers/${card.assets.illustration.replace("assets/", "")}`;

  // Sinh câu đố ngẫu nhiên cho số hiện tại
  const generateNewRound = () => {
    // Chọn ngẫu nhiên hiddenCount từ 1 đến total
    const h = Math.floor(Math.random() * total) + 1;
    const v = total - h;
    setHiddenCount(h);
    setVisibleCount(v);
    setSelectedAnswer(null);
    setIsRevealed(false);
  };

  useEffect(() => {
    generateNewRound();
  }, [card.number]);

  // Sinh danh sách 3 lựa chọn (1 đáp án đúng + 2 đáp án nhiễu)
  const getOptions = () => {
    const options = new Set<number>([hiddenCount]);
    while (options.size < Math.min(4, total + 1)) {
      const candidate = Math.floor(Math.random() * (total + 1));
      options.add(candidate);
    }
    return Array.from(options).sort((a, b) => a - b);
  };

  const [options, setOptions] = useState<number[]>([]);

  useEffect(() => {
    setOptions(getOptions());
  }, [hiddenCount, total]);

  const handleSelectAnswer = (ans: number) => {
    if (isRevealed) return;
    setSelectedAnswer(ans);

    if (ans === hiddenCount) {
      setIsRevealed(true);
      setScore((s) => s + 1);
      sound.playSuccessSound();
      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
    } else {
      sound.playCountTone(ans);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Khung tiêu đề & Điểm sao */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-5 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-purple-950">
              Trò Chơi: Chiếc Hộp Bí Mật Của Số {total}
            </h3>
            <p className="text-xs text-purple-800">
              Có tất cả {total} {card.item_name}. Đoán xem chiếc hộp đang giấu mấy con?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-purple-200 shadow-xs">
          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span className="text-xs font-bold text-slate-500">Điểm sao:</span>
          <span className="text-sm font-black text-purple-700">{score} ⭐</span>
        </div>
      </div>

      {/* VÙNG SÂN CHƠI HỘP BÍ MẬT */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col items-center">
        {/* Thanh trạng thái tổng số */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 mb-6">
          <span>Có tất cả:</span>
          <span className="text-base font-black text-purple-700 px-2 py-0.5 bg-white rounded-md border border-purple-200">
            {total}
          </span>
          <span>{card.item_name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl items-center">
          {/* PHẦN 1: CHIẾC HỘP BÍ MẬT (CHỨA hiddenCount) */}
          <div className={`p-6 rounded-3xl border-2 flex flex-col items-center justify-center transition-all min-h-[220px] ${
            isRevealed
              ? "bg-purple-50 border-purple-300 ring-4 ring-purple-100"
              : "bg-slate-50 border-dashed border-purple-300"
          }`}>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800 mb-3">
              {isRevealed ? "Hộp đã mở nắp!" : "Trong chiếc hộp bí mật:"}
            </span>

            {isRevealed ? (
              /* Khi đã mở nắp: hiện số con vật bên trong */
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-xs mb-3">
                  {Array.from({ length: hiddenCount }).map((_, i) => (
                    <div key={i} className="relative w-10 h-10 sm:w-12 sm:h-12 animate-bounce">
                      <Image src={animalImg} alt="con vật trong hộp" fill sizes="50px" className="object-contain" />
                    </div>
                  ))}
                </div>
                <span className="text-2xl font-black text-purple-700 bg-white px-3 py-1 rounded-xl border border-purple-200 shadow-xs">
                  {hiddenCount} {card.item_name}
                </span>
              </div>
            ) : (
              /* Khi hộp chưa mở: Hiện hộp quà và dấu hỏi chấm */
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg animate-pulse mb-2">
                  <span className="text-4xl font-black">?</span>
                </div>
                <span className="text-xs font-bold text-slate-400">Đang giấu mấy con?</span>
              </div>
            )}
          </div>

          {/* PHẦN 2: PHẦN LỘ RA NGOÀI (visibleCount) */}
          <div className="p-6 rounded-3xl border-2 border-emerald-200 bg-emerald-50/50 flex flex-col items-center justify-center min-h-[220px]">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3">
              Ở bên ngoài có:
            </span>

            <div className="flex flex-wrap items-center justify-center gap-2 max-w-xs min-h-[80px] mb-3">
              {Array.from({ length: visibleCount }).map((_, i) => (
                <div key={i} className="relative w-10 h-10 sm:w-12 sm:h-12">
                  <Image src={animalImg} alt="con vật bên ngoài" fill sizes="50px" className="object-contain" />
                </div>
              ))}
              {visibleCount === 0 && (
                <span className="text-xs text-slate-400 italic">Không có con nào (0)</span>
              )}
            </div>

            <span className="text-2xl font-black text-emerald-700 bg-white px-3 py-1 rounded-xl border border-emerald-200 shadow-xs">
              {visibleCount} {card.item_name}
            </span>
          </div>
        </div>

        {/* KHU VỰC CHỌN ĐÁP ÁN */}
        <div className="mt-8 flex flex-col items-center gap-4 w-full">
          {!isRevealed ? (
            <>
              <p className="text-sm font-black text-slate-700">
                Bé hãy bấm chọn số con vật đang nằm trong hộp:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {options.map((opt) => {
                  const isWrong = selectedAnswer === opt && opt !== hiddenCount;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectAnswer(opt)}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl font-black text-xl sm:text-2xl transition-all active:scale-90 shadow-md flex items-center justify-center min-h-[44px] min-w-[44px] ${
                        isWrong
                          ? "bg-rose-100 border-2 border-rose-400 text-rose-600 animate-shake"
                          : "bg-gradient-to-b from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white hover:scale-105"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {selectedAnswer !== null && selectedAnswer !== hiddenCount && (
                <p className="text-xs font-bold text-rose-600 animate-pulse mt-1">
                  Chưa đúng rồi! Bé thử đếm lại số con ở bên ngoài nhé.
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-emerald-700 font-black text-base bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Chính xác! {total} gồm {hiddenCount} và {visibleCount}!</span>
              </div>

              <button
                onClick={generateNewRound}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm shadow-md transition-all active:scale-95 min-h-[44px]"
              >
                <span>Câu Tiếp Theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
