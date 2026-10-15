"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { NumberCardData, NumberBond } from "@/types/number";
import {
  Split,
  ShoppingBasket,
  Package,
  Scale,
  Sparkles,
  HelpCircle,
  CheckCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";
import { BasketsGame } from "./bonds/BasketsGame";
import { SecretBoxGame } from "./bonds/SecretBoxGame";
import { BalanceScaleGame } from "./bonds/BalanceScaleGame";
import { RainbowPairsGame } from "./bonds/RainbowPairsGame";

interface NumberBondsInteractiveProps {
  card: NumberCardData;
}

export type BondMode = "diagram" | "baskets" | "box" | "scale" | "rainbow";

const BOND_MODES: {
  id: BondMode;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}[] = [
  {
    id: "diagram",
    label: "Sơ Đồ Nhánh",
    sublabel: "Cấu tạo & Khẩu quyết",
    icon: Split,
  },
  {
    id: "baskets",
    label: "Chia 2 Giỏ",
    sublabel: "Khám phá CPA",
    icon: ShoppingBasket,
    badge: "Thử thách",
    badgeColor: "bg-amber-100 text-amber-800",
  },
  {
    id: "box",
    label: "Hộp Bí Mật",
    sublabel: "Tìm số còn thiếu",
    icon: Package,
    badge: "Phản xạ",
    badgeColor: "bg-purple-100 text-purple-800",
  },
  {
    id: "scale",
    label: "Cân Thăng Bằng",
    sublabel: "Vật lý trực quan",
    icon: Scale,
    badge: "Tư duy",
    badgeColor: "bg-teal-100 text-teal-800",
  },
  {
    id: "rainbow",
    label: "Cặp Bạn Thân",
    sublabel: "Cầu vồng số",
    icon: Sparkles,
    badge: "Ghép đôi",
    badgeColor: "bg-rose-100 text-rose-800",
  },
];

export const NumberBondsInteractive: React.FC<NumberBondsInteractiveProps> = ({ card }) => {
  const [activeTab, setActiveTab] = useState<BondMode>("diagram");
  const [selectedBond, setSelectedBond] = useState<NumberBond>(card.all_bonds[1] || card.all_bonds[0]);
  const [quizMode, setQuizMode] = useState<boolean>(false);
  const [quizMissingBranch, setQuizMissingBranch] = useState<"a" | "b">("b");
  const [quizSelectedAnswer, setQuizSelectedAnswer] = useState<number | null>(null);
  const [quizStatus, setQuizStatus] = useState<"idle" | "correct" | "wrong">("idle");

  useEffect(() => {
    const defaultBond = card.all_bonds.find((b) => b.part_a === 1) || card.all_bonds[0];
    setSelectedBond(defaultBond);
    setQuizSelectedAnswer(null);
    setQuizStatus("idle");
  }, [card.number]);

  const animalImg = card.assets.single_animal
    ? `/data/module_numbers/${card.assets.single_animal.replace("assets/", "")}`
    : `/data/module_numbers/${card.assets.illustration.replace("assets/", "")}`;

  // Kiểm tra câu trả lời trong chế độ đố vui sơ đồ nhánh
  const handleAnswerQuiz = (val: number) => {
    setQuizSelectedAnswer(val);
    const expected = quizMissingBranch === "b" ? selectedBond.part_b : selectedBond.part_a;

    if (val === expected) {
      setQuizStatus("correct");
      sound.playSuccessSound();
      confetti({ particleCount: 100, spread: 60 });
    } else {
      setQuizStatus("wrong");
    }
  };

  return (
    <div className="flex flex-col max-w-5xl mx-auto py-4 sm:py-6">
      {/* Tiêu đề & Giới thiệu tổng quan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-2">
            <Split className="w-4 h-4 text-emerald-600" />
            Tư Duy Tách - Gộp Toán Lớp 1 (Singapore Math CPA)
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            Cấu tạo và Tách - Gộp Số {card.number}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            5 hoạt động tương tác giúp bé hiểu sâu bản chất phép cộng &amp; trừ qua trực quan sinh động.
          </p>
        </div>
      </div>

      {/* DẢI TABS 5 HOẠT ĐỘNG TÁCH - GỘP (Responsive, tràn viền lướt êm trên mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 min-w-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:none">
        {BOND_MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeTab === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => {
                setActiveTab(mode.id);
                sound.playCountTone(card.number);
              }}
              className={`relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl min-h-[46px] shrink-0 font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-200 ring-2 ring-emerald-300"
                  : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="leading-tight">{mode.label}</div>
                <div
                  className={`text-[10px] font-medium leading-none mt-0.5 ${
                    isActive ? "text-emerald-100" : "text-slate-400"
                  }`}
                >
                  {mode.sublabel}
                </div>
              </div>
              {mode.badge && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                    isActive
                      ? "bg-white/25 text-white"
                      : mode.badgeColor || "bg-amber-100 text-amber-800"
                  }`}
                >
                  {mode.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* NỘI DUNG HOẠT ĐỘNG ĐƯỢC CHỌN */}
      {activeTab === "diagram" && (
        <div className="flex flex-col gap-6">
          {/* Header phụ chọn Khám phá vs Đố vui */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-200 shadow-xs">
            <span className="text-xs sm:text-sm font-bold text-slate-700 pl-2">
              Chế độ Sơ Đồ Nhánh:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setQuizMode(false);
                  setQuizStatus("idle");
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[40px] ${
                  !quizMode
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Khám phá Sơ Đồ
              </button>
              <button
                onClick={() => {
                  setQuizMode(true);
                  setQuizSelectedAnswer(null);
                  setQuizStatus("idle");
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[40px] ${
                  quizMode
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Đố Vui Điền Số
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* CỘT TRÁI (7 cột): Sơ đồ nhánh trực quan & Rổ đồ vật */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Sơ đồ nhánh Number Bonds */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col items-center">
                <div className="relative w-full max-w-sm aspect-[4/3] flex items-center justify-center">
                  {/* Vòng tròn Tổng (Gốc) */}
                  <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-rose-500 bg-rose-50 flex flex-col items-center justify-center shadow-lg">
                      <span className="text-3xl sm:text-4xl font-black text-rose-600">{card.number}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400 mt-1 uppercase">Tổng</span>
                  </div>

                  {/* Đường nhánh nối (SVG) */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 380 280">
                    <path
                      d="M 120 140 C 180 140, 200 70, 260 70"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="4"
                      strokeDasharray="6 6"
                    />
                    <path
                      d="M 120 140 C 180 140, 200 210, 260 210"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="4"
                      strokeDasharray="6 6"
                    />
                  </svg>

                  {/* Nhánh con A (Phía trên) */}
                  <div className="absolute right-4 sm:right-6 top-6 sm:top-8 flex flex-col items-center">
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-blue-500 bg-blue-50 flex flex-col items-center justify-center shadow-md">
                      {quizMode && quizMissingBranch === "a" && quizStatus !== "correct" ? (
                        <span className="text-2xl font-black text-amber-500 animate-pulse">?</span>
                      ) : (
                        <span className="text-2xl sm:text-3xl font-black text-blue-600">{selectedBond.part_a}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-400 mt-1 uppercase">Phần 1</span>
                  </div>

                  {/* Nhánh con B (Phía dưới) */}
                  <div className="absolute right-4 sm:right-6 bottom-6 sm:bottom-8 flex flex-col items-center">
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-emerald-500 bg-emerald-50 flex flex-col items-center justify-center shadow-md">
                      {quizMode && quizMissingBranch === "b" && quizStatus !== "correct" ? (
                        <span className="text-2xl font-black text-amber-500 animate-pulse">?</span>
                      ) : (
                        <span className="text-2xl sm:text-3xl font-black text-emerald-600">{selectedBond.part_b}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-400 mt-1 uppercase">Phần 2</span>
                  </div>
                </div>

                {/* Hai câu khẩu quyết hiển thị trang trọng */}
                <div className="w-full mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-around gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{selectedBond.split_sentence}</span>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{selectedBond.combine_sentence}</span>
                  </div>
                </div>
              </div>

              {/* Rổ đồ vật trực quan hóa số lượng chia vào 2 nhóm */}
              <div className="bg-gradient-to-r from-blue-50/60 to-emerald-50/60 rounded-3xl p-5 border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
                  Trực quan hóa số lượng chia vào 2 rổ
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Rổ A */}
                  <div className="bg-white/90 rounded-2xl p-4 border border-blue-200 flex flex-col items-center">
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full mb-2">
                      Rổ 1 ({selectedBond.part_a} {card.item_name})
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-2 min-h-[70px]">
                      {Array.from({ length: selectedBond.part_a }).map((_, i) => (
                        <div key={i} className="relative w-8 h-8 sm:w-10 sm:h-10">
                          <Image src={animalImg} alt="con vật rổ 1" fill sizes="40px" className="object-contain" />
                        </div>
                      ))}
                      {selectedBond.part_a === 0 && (
                        <span className="text-xs text-slate-400 italic">Rổ rỗng (0)</span>
                      )}
                    </div>
                  </div>

                  {/* Rổ B */}
                  <div className="bg-white/90 rounded-2xl p-4 border border-emerald-200 flex flex-col items-center">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mb-2">
                      Rổ 2 ({selectedBond.part_b} {card.item_name})
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-2 min-h-[70px]">
                      {Array.from({ length: selectedBond.part_b }).map((_, i) => (
                        <div key={i} className="relative w-8 h-8 sm:w-10 sm:h-10">
                          <Image src={animalImg} alt="con vật rổ 2" fill sizes="40px" className="object-contain" />
                        </div>
                      ))}
                      {selectedBond.part_b === 0 && (
                        <span className="text-xs text-slate-400 italic">Rổ rỗng (0)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI (5 cột): Danh sách chọn các thế tách gộp HOẶC Chế độ Đố vui */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {!quizMode ? (
                /* Danh sách các cặp tách gộp hoàn chỉnh */
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Tất cả các cách Tách - Gộp số {card.number}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Bấm vào từng dòng để xem sơ đồ tương ứng:
                  </p>

                  <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
                    {card.all_bonds.map((bond, idx) => {
                      const isCurrent =
                        selectedBond.part_a === bond.part_a && selectedBond.part_b === bond.part_b;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedBond(bond)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-emerald-50 border-emerald-400 shadow-sm ring-2 ring-emerald-200"
                              : "bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                                isCurrent ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{bond.split_sentence}</p>
                              <p className="text-xs text-slate-500">{bond.combine_sentence}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shrink-0">
                            <span>{bond.part_a}</span>
                            <span className="text-slate-400">+</span>
                            <span>{bond.part_b}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Chế độ Đố Vui Điền Số */
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-200 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider mb-2">
                    <HelpCircle className="w-4 h-4" />
                    Câu đố phản xạ nhanh
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-1">
                    Số {card.number} gồm {selectedBond.part_a} và mấy?
                  </h3>
                  <p className="text-xs text-slate-600 mb-6">
                    Bé hãy bấm vào con số chính xác để điền vào dấu hỏi chấm nhé!
                  </p>

                  {/* Danh sách các đáp án lựa chọn */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {Array.from(
                      new Set([
                        selectedBond.part_b,
                        (selectedBond.part_b + 1) % (card.number + 1),
                        Math.max(0, selectedBond.part_b - 1),
                        (selectedBond.part_b + 2) % (card.number + 1),
                      ])
                    )
                      .sort(() => Math.random() - 0.5)
                      .map((optionNum, i) => {
                        const isSelected = quizSelectedAnswer === optionNum;
                        return (
                          <button
                            key={i}
                            onClick={() => handleAnswerQuiz(optionNum)}
                            className={`h-16 rounded-2xl font-black text-2xl border-2 transition-all transform active:scale-95 shadow-sm cursor-pointer ${
                              isSelected
                                ? quizStatus === "correct"
                                  ? "bg-emerald-500 border-emerald-600 text-white shadow-emerald-200"
                                  : "bg-rose-500 border-rose-600 text-white shadow-rose-200"
                                : "bg-white hover:bg-amber-100 border-amber-300 text-slate-800"
                            }`}
                          >
                            {optionNum}
                          </button>
                        );
                      })}
                  </div>

                  {quizStatus === "correct" && (
                    <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-sm font-bold">Chính xác! Bé xuất sắc lắm!</span>
                      </div>
                      <button
                        onClick={() => {
                          const nextBond = card.all_bonds[Math.floor(Math.random() * card.all_bonds.length)];
                          setSelectedBond(nextBond);
                          setQuizSelectedAnswer(null);
                          setQuizStatus("idle");
                        }}
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                      >
                        <span>Câu tiếp</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {quizStatus === "wrong" && (
                    <div className="p-4 rounded-2xl bg-rose-100 border border-rose-300 text-rose-800 text-sm font-bold text-center">
                      Chưa chính xác rồi, con thử lại nhé!
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHIA 2 GIỎ (CPA CONCRETE PARTITIONING) */}
      {activeTab === "baskets" && <BasketsGame card={card} />}

      {/* HỘP BÍ MẬT (MISSING-PART REASONING) */}
      {activeTab === "box" && <SecretBoxGame card={card} />}

      {/* CÂN THĂNG BẰNG (PHYSICAL BALANCE SCALE) */}
      {activeTab === "scale" && <BalanceScaleGame card={card} />}

      {/* CẶP BẠN THÂN (RAINBOW NUMBER BONDS) */}
      {activeTab === "rainbow" && <RainbowPairsGame card={card} />}
    </div>
  );
};
