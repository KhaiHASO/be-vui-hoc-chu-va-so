"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { NumberCardData } from "@/types/number";
import {
  RotateCw,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Pause,
  Play,
  Headphones,
  RotateCcw,
} from "lucide-react";

interface FlashcardViewProps {
  card: NumberCardData;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({ card }) => {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioSrc = `/audio/module_numbers/so_${card.number}.mp3`;
  const frontImg = `/data/module_numbers/${card.assets.card_front.replace("assets/", "")}`;
  const backImg = `/data/module_numbers/${card.assets.card_back.replace("assets/", "")}`;

  // Reset audio khi đổi sang số khác
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
    setIsPlaying(false);
  }, [card.number]);

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Lỗi phát audio:", err);
          setIsPlaying(false);
        });
    }
  };

  const replayAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => console.error(err));
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-6">
      {/* Vùng Thẻ Học (Card Flip) */}
      <div className="w-full max-w-xl flex flex-col items-center">
        <div
          className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-100 bg-white group cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Ảnh mặt trước */}
          <div
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              isFlipped ? "opacity-0 pointer-events-none rotate-y-180 scale-95" : "opacity-100 scale-100"
            }`}
          >
            <Image
              src={frontImg}
              alt={`Thẻ ${card.card_id} - ${card.word} (Mặt trước)`}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-contain p-2"
              priority
            />
            <div className="absolute top-4 left-4 bg-blue-600/90 text-white text-xs font-black px-3 py-1 rounded-full shadow backdrop-blur-sm">
              Mặt trước: Khám phá & Đếm
            </div>
          </div>

          {/* Ảnh mặt sau */}
          <div
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              isFlipped ? "opacity-100 scale-100" : "opacity-0 pointer-events-none -rotate-y-180 scale-95"
            }`}
          >
            <Image
              src={backImg}
              alt={`Thẻ ${card.card_id} - ${card.word} (Mặt sau)`}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-contain p-2"
              priority
            />
            <div className="absolute top-4 left-4 bg-emerald-600/90 text-white text-xs font-black px-3 py-1 rounded-full shadow backdrop-blur-sm">
              Mặt sau: Bảng Tách - Gộp
            </div>
          </div>
        </div>

        {/* Nút lật thẻ */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <RotateCw className="w-4 h-4" />
            {isFlipped ? "Xem Mặt Trước (Khám phá)" : "Xem Mặt Sau (Bảng Tách Gộp)"}
          </button>
        </div>
      </div>

      {/* Cột Chi Tiết & Bộ Phát Âm Thanh Bản Thu Gốc */}
      <div className="w-full max-w-lg flex flex-col gap-5">
        {/* BANNER BẢN THU ÂM GỐC CỦA CÔ GIÁO */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xl border border-emerald-400/40">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
              <Headphones className="w-3.5 h-3.5 text-amber-300" />
              Bản Thu Âm Gốc Từ Bộ Thẻ
            </span>
            <span className="text-xs font-bold text-emerald-100 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Giọng cô giáo tiểu học
            </span>
          </div>

          <div className="mt-3">
            <h4 className="text-lg sm:text-xl font-black leading-tight flex items-center gap-2">
              Cô giáo hướng dẫn: Số {card.number} ({card.word})
            </h4>
            <p className="text-xs text-emerald-100 mt-1">
              Bao gồm: Đọc tên số, đếm con vật, câu tách gộp và cách viết từng nét.
            </p>
          </div>

          {/* Nút Bấm Lớn & Sóng Nhạc */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/20">
            <button
              onClick={togglePlayAudio}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-md active:scale-95 ${
                isPlaying
                  ? "bg-rose-500 hover:bg-rose-600 text-white ring-4 ring-rose-300"
                  : "bg-white hover:bg-amber-100 text-emerald-900 ring-4 ring-white/30"
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              <span>{isPlaying ? "Tạm Dừng" : "Bấm Nghe Cô Đọc"}</span>
            </button>

            <button
              onClick={replayAudio}
              className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Phát lại từ đầu"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {isPlaying && (
              <div className="flex items-end gap-1 h-6 ml-auto pr-2">
                <span className="w-1.5 bg-amber-300 rounded-full animate-bounce h-4" />
                <span className="w-1.5 bg-amber-300 rounded-full animate-bounce h-6 delay-75" />
                <span className="w-1.5 bg-amber-300 rounded-full animate-bounce h-3 delay-150" />
                <span className="w-1.5 bg-amber-300 rounded-full animate-bounce h-5 delay-100" />
              </div>
            )}
          </div>

          {/* Trình phát HTML5 Native có thanh tua (Timeline & Volume) */}
          <div className="mt-3">
            <audio
              ref={audioRef}
              src={audioSrc}
              preload="auto"
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-10 rounded-xl accent-emerald-500 bg-white/10"
            />
          </div>
        </div>

        {/* Hộp Thông tin chính */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 shadow-sm">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-200/60 px-2.5 py-1 rounded-lg">
              Thẻ số {card.card_id}
            </span>
            <h2 className="text-3xl font-black text-slate-800 mt-2 flex items-center gap-3">
              {card.number} - <span className="capitalize text-rose-600">{card.word}</span>
            </h2>
            <p className="text-sm font-semibold text-slate-600 mt-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {card.count} {card.item_name}
            </p>
          </div>

          {/* Câu khẩu quyết mẫu */}
          <div className="mt-5 p-4 rounded-2xl bg-white/90 border border-amber-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Khẩu quyết sư phạm lớp 1
            </h3>
            <div className="flex flex-col gap-2">
              {card.sample_bond.sentences.map((sentence, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm sm:text-base font-bold text-slate-800">{sentence}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hộp gợi ý cho phụ huynh */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm mb-2">
            <HelpCircle className="w-4 h-4" />
            Cách phụ huynh hỏi con tại nhà:
          </div>
          <p className="text-sm text-slate-700 italic bg-rose-50/60 p-3 rounded-xl border border-rose-100">
            &ldquo;{card.parent_tips.prompt_question}&rdquo;
          </p>
          <p className="text-xs text-slate-500 mt-2">
            💡 {card.parent_tips.daily_activity}
          </p>
        </div>
      </div>
    </div>
  );
};
