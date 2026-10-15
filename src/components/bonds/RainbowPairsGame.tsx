"use client";

import React, { useState, useEffect } from "react";
import { NumberCardData } from "@/types/number";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";
import { Sparkles, Star, RotateCcw, CheckCircle2 } from "lucide-react";

interface RainbowPairsGameProps {
  card: NumberCardData;
}

interface Bubble {
  id: string;
  val: number;
  color: string;
  isPopped: boolean;
}

export const RainbowPairsGame: React.FC<RainbowPairsGameProps> = ({ card }) => {
  const target = card.number;

  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [selectedBubble, setSelectedBubble] = useState<Bubble | null>(null);
  const [successPairsCount, setSuccessPairsCount] = useState<number>(0);
  const [lastMatched, setLastMatched] = useState<{ a: number; b: number } | null>(null);

  const bubbleColors = [
    "from-pink-400 to-rose-500",
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-teal-500",
    "from-sky-400 to-blue-500",
    "from-indigo-400 to-purple-500",
    "from-purple-400 to-fuchsia-500",
  ];

  // Khởi tạo các cặp bóng có tổng bằng target
  const initGame = () => {
    // Tạo 4 cặp (8 quả bóng) có tổng bằng target
    const newBubbles: Bubble[] = [];
    const usedPairs: [number, number][] = [];

    // Lấy các cặp từ all_bonds hoặc sinh ngẫu nhiên
    const availableBonds = card.all_bonds.filter((b) => b.part_a > 0 && b.part_b > 0);
    const bondsToUse = availableBonds.length >= 3 ? availableBonds.slice(0, 3) : availableBonds;

    bondsToUse.forEach((bond, i) => {
      usedPairs.push([bond.part_a, bond.part_b]);
    });

    if (usedPairs.length < 3) {
      usedPairs.push([target, 0]);
    }

    usedPairs.forEach((pair, pairIdx) => {
      const color = bubbleColors[pairIdx % bubbleColors.length];
      newBubbles.push({
        id: `b-${pairIdx}-a`,
        val: pair[0],
        color,
        isPopped: false,
      });
      newBubbles.push({
        id: `b-${pairIdx}-b`,
        val: pair[1],
        color,
        isPopped: false,
      });
    });

    // Trộn ngẫu nhiên vị trí các quả bóng
    const shuffled = newBubbles.sort(() => Math.random() - 0.5);
    setBubbles(shuffled);
    setSelectedBubble(null);
    setLastMatched(null);
    setSuccessPairsCount(0);
  };

  useEffect(() => {
    initGame();
  }, [card.number]);

  // Xử lý chạm vào bóng
  const handleBubbleClick = (b: Bubble) => {
    if (b.isPopped) return;

    // Nếu chưa chọn bóng nào
    if (!selectedBubble) {
      setSelectedBubble(b);
      sound.playCountTone(b.val);
      return;
    }

    // Nếu bấm lại chính bóng đó -> hủy chọn
    if (selectedBubble.id === b.id) {
      setSelectedBubble(null);
      return;
    }

    // Kiểm tra gộp 2 bóng
    const sum = selectedBubble.val + b.val;
    if (sum === target) {
      // ĐÚNG CẶP BẠN THÂN!
      sound.playSuccessSound();
      setLastMatched({ a: selectedBubble.val, b: b.val });

      setBubbles((prev) =>
        prev.map((item) =>
          item.id === selectedBubble.id || item.id === b.id
            ? { ...item, isPopped: true }
            : item
        )
      );

      setSuccessPairsCount((c) => {
        const next = c + 1;
        // Nếu nổ hết tất cả bóng
        if (next >= bubbles.length / 2) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        return next;
      });

      setSelectedBubble(null);
    } else {
      // Sai cặp -> báo âm thanh và bỏ chọn
      sound.playCountTone(b.val);
      setSelectedBubble(null);
    }
  };

  const isAllPopped = bubbles.length > 0 && bubbles.every((b) => b.isPopped);

  return (
    <div className="flex flex-col gap-6">
      {/* Khung tiêu đề */}
      <div className="bg-gradient-to-r from-sky-50 to-indigo-50 rounded-3xl p-5 border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-sky-950">
              Cầu Vồng Ghép Cặp: Bạn Thân Của Số {target}
            </h3>
            <p className="text-xs text-sky-800">
              Chạm vào 2 quả bóng có tổng bằng {target} để tạo ra cầu vồng!
            </p>
          </div>
        </div>

        <button
          onClick={initGame}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 font-bold text-xs shadow-xs transition-all active:scale-95 min-h-[44px]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Chơi Lại Vòng Này</span>
        </button>
      </div>

      {/* VÙNG BÓNG BAY TƯƠNG TÁC */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col items-center">
        {/* Banner thông báo cặp vừa ghép */}
        {lastMatched && (
          <div className="mb-6 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-sm animate-in zoom-in duration-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Tuyệt vời! Gộp {lastMatched.a} và {lastMatched.b} được {target}! 🎉
            </span>
          </div>
        )}

        {/* Lưới các quả bóng bay */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-xl">
          {bubbles.map((b) => {
            const isSelected = selectedBubble?.id === b.id;

            if (b.isPopped) {
              return (
                <div
                  key={b.id}
                  className="aspect-square rounded-full border-2 border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center opacity-40 transition-all"
                >
                  <span className="text-xs font-bold text-slate-300">✓ Đã nổ</span>
                </div>
              );
            }

            return (
              <button
                key={b.id}
                onClick={() => handleBubbleClick(b)}
                className={`relative aspect-square rounded-full bg-gradient-to-tr ${b.color} text-white font-black text-3xl sm:text-4xl shadow-lg transition-all active:scale-90 flex items-center justify-center min-h-[44px] min-w-[44px] ${
                  isSelected
                    ? "ring-4 ring-offset-4 ring-sky-400 scale-110 animate-bounce"
                    : "hover:scale-105 hover:shadow-xl"
                }`}
              >
                {b.val}
                {/* Điểm sáng bong bóng */}
                <span className="absolute top-3 left-4 w-3.5 h-2 rounded-full bg-white/40 rotate-[-30deg]" />
              </button>
            );
          })}
        </div>

        {/* Khi nổ hết các bóng */}
        {isAllPopped && (
          <div className="mt-8 flex flex-col items-center gap-3 animate-in zoom-in">
            <span className="text-xl font-black text-sky-800">
              🌈 Bé đã ghép thành công tất cả các cặp bạn thân của số {target}!
            </span>
            <button
              onClick={initGame}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black text-sm shadow-md transition-all active:scale-95"
            >
              Chơi Lại Vòng Mới 🎮
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
