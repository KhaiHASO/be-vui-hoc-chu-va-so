"use client";

import React, { useState } from "react";
import rawLettersData from "@/data/letters.json";
import { BasicStroke } from "@/types/letter";
import { Sparkles, PenTool, CheckCircle2, RotateCcw, Volume2 } from "lucide-react";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";

export function StrokesPracticeView() {
  const strokes: BasicStroke[] = rawLettersData.basicStrokes;
  const [selectedStroke, setSelectedStroke] = useState<BasicStroke>(strokes[0]);

  const speakStroke = (st: BasicStroke) => {
    sound.playTone(523.25, 0.15);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`${st.name}. Độ cao: ${st.height}. ${st.description}`);
      u.lang = "vi-VN";
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const handleSelect = (st: BasicStroke) => {
    sound.playTone(440, 0.08);
    setSelectedStroke(st);
  };

  const handleComplete = () => {
    sound.playTone(659.25, 0.15);
    setTimeout(() => sound.playTone(880, 0.25), 100);
    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="w-full flex flex-col items-center py-4 px-2 sm:px-4">
      {/* Tiêu đề */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-xs mb-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          Học Liệu Quy Chuẩn Bộ Thẻ (Thẻ 1 – 14)
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight">
          14 Nét Viết Cơ Bản Tiền Tiểu Học
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mx-auto">
          Nền tảng quan trọng nhất để bé cầm bút chuẩn và viết đẹp mọi con chữ Tiếng Việt
        </p>
      </div>

      {/* Dải danh sách 14 nét viết (Touch friendly, overflow-x-auto mượt mà) */}
      <div className="w-full max-w-5xl mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none px-1">
          {strokes.map((st, idx) => (
            <button
              key={st.id}
              onClick={() => handleSelect(st)}
              className={`min-h-[44px] px-3.5 py-2 rounded-2xl font-bold text-xs sm:text-sm shrink-0 flex items-center gap-2 border transition-all active:scale-95 ${
                selectedStroke.id === st.id
                  ? "bg-violet-600 text-white border-violet-600 shadow-md scale-105"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-xs"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
                selectedStroke.id === st.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {idx + 1}
              </span>
              <span>{st.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Khung chi tiết nét đang chọn */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Card mô tả sư phạm */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-xl bg-violet-100 text-violet-700 font-extrabold text-xs">
              Thẻ học số #{selectedStroke.cardId}
            </span>
            <button
              onClick={() => speakStroke(selectedStroke)}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-violet-50 hover:bg-violet-100 active:scale-95 text-violet-700 font-bold flex items-center gap-1.5 transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span className="text-xs font-bold">Nghe cô giảng</span>
            </button>
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-800">
              {selectedStroke.name}
            </h3>
            <div className="inline-block mt-1 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-sm">
              📏 Độ cao chuẩn: {selectedStroke.height}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-slate-700 text-sm leading-relaxed">
            <span className="font-bold text-slate-900 block mb-1">Cách đặt bút & di chuyển:</span>
            {selectedStroke.description}
          </div>

          <div className="pt-2">
            <button
              onClick={handleComplete}
              className="w-full min-h-[44px] py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Bé đã nhớ nét này!
            </button>
          </div>
        </div>

        {/* Khung bảng mô phỏng trực quan ô ly */}
        <div className="aspect-square rounded-3xl bg-linear-to-b from-white to-violet-50/40 border-4 border-violet-200 shadow-xl p-6 flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)] pointer-events-none" />

          <div className="w-full flex justify-between text-xs font-semibold text-slate-400">
            <span>Đường kẻ 4</span>
            <span>Lưới ô ly chuẩn</span>
            <span>Đường kẻ 1</span>
          </div>

          <div className="my-auto flex flex-col items-center">
            {/* Minh họa nét vẽ cách điệu */}
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-white border-2 border-dashed border-violet-300 flex items-center justify-center shadow-inner relative">
              <span className="text-5xl sm:text-6xl font-black text-violet-600 font-serif">
                {selectedStroke.id.includes("ngang") && "—"}
                {selectedStroke.id.includes("thang") && "|"}
                {selectedStroke.id.includes("xien_phai") && "╱"}
                {selectedStroke.id.includes("xien_trai") && "╲"}
                {selectedStroke.id.includes("moc_xuoi") && "∩"}
                {selectedStroke.id.includes("moc_nguoc") && "∪"}
                {selectedStroke.id.includes("moc_hai_dau") && "∿"}
                {selectedStroke.id.includes("cong_ho_phai") && "c"}
                {selectedStroke.id.includes("cong_ho_trai") && "ɔ"}
                {selectedStroke.id.includes("cong_kin") && "o"}
                {selectedStroke.id.includes("khuyet_tren") && "ℓ"}
                {selectedStroke.id.includes("khuyet_duoi") && "g"}
                {selectedStroke.id.includes("xoan") && "r"}
                {selectedStroke.id.includes("that_giua") && "k"}
              </span>
            </div>
            <span className="mt-3 text-xs font-bold text-slate-500">
              Hình dáng trực quan nét {selectedStroke.name}
            </span>
          </div>

          <div className="text-xs text-violet-600 font-semibold flex items-center gap-1">
            <PenTool className="w-3.5 h-3.5" />
            Nhắc bé cầm bút bằng 3 ngón tay, cổ tay thả lỏng
          </div>
        </div>
      </div>
    </div>
  );
}
