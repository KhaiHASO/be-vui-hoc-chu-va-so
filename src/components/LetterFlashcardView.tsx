"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { LetterCardData } from "@/types/letter";
import {
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Video,
  ZoomIn,
  PenTool,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  LayoutGrid,
  Shuffle,
  Gauge,
  Flame,
  HelpCircle,
  Columns,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/utils/speech";

interface LetterFlashcardViewProps {
  currentLetter: LetterCardData;
  onNextLetter?: () => void;
  onPrevLetter?: () => void;
  onGoToWriting?: () => void;
}

export function LetterFlashcardView({
  currentLetter,
  onNextLetter,
  onPrevLetter,
  onGoToWriting,
}: LetterFlashcardViewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showWritingModal, setShowWritingModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVowel, setSelectedVowel] = useState<string>("a");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Chế độ đọc phản xạ theo phản hồi phụ huynh & SGK
  const [reflexViewMode, setReflexViewMode] = useState<"full" | "single">("full");
  const [isAutoReading, setIsAutoReading] = useState(false);
  const [autoReadDirection, setAutoReadDirection] = useState<"row" | "col">("row");
  const [autoReadSpeed, setAutoReadSpeed] = useState<number>(850); // ms
  const [activeReflexSyllable, setActiveReflexSyllable] = useState<string | null>(null);
  const [randomReflexCard, setRandomReflexCard] = useState<{ syllable: string; revealed: boolean } | null>(null);
  const autoReadTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopAutoReading = useCallback(() => {
    if (autoReadTimerRef.current) {
      clearTimeout(autoReadTimerRef.current);
      autoReadTimerRef.current = null;
    }
    setIsAutoReading(false);
    setActiveReflexSyllable(null);
  }, []);

  // Set default selected vowel when letter changes
  useEffect(() => {
    setIsFlipped(false);
    stopAutoReading();
    setRandomReflexCard(null);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
    setIsPlaying(false);

    if (currentLetter.type === "consonant" && currentLetter.back_content.compatible_vowels?.length) {
      setSelectedVowel(currentLetter.back_content.compatible_vowels[0]);
    }
  }, [currentLetter, stopAutoReading]);

  // Dọn dẹp âm thanh & timer khi unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      stopAutoReading();
    };
  }, [stopAutoReading]);

  const toggleAudio = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      sound.playTone(523.25, 0.08);
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Lỗi phát audio:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleCardClick = () => {
    sound.playTone(isFlipped ? 440 : 659.25, 0.08);
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.6 },
        colors: ["#7c3aed", "#ec4899", "#3b82f6", "#10b981", "#f59e0b"],
      });
    }
  };

  const speakSyllable = (text: string) => {
    setActiveReflexSyllable(text);
    sound.playTone(587.33, 0.05);
    sound.speak(text);
    setTimeout(() => {
      setActiveReflexSyllable((prev) => (prev === text && !isAutoReading ? null : prev));
    }, 1100);
  };

  // Tự động đọc mẫu lần lượt theo hàng ngang (vần) hoặc cột dọc (dấu thanh)
  const startAutoReading = (direction: "row" | "col") => {
    stopAutoReading();
    setAutoReadDirection(direction);
    setIsAutoReading(true);

    const matrix = currentLetter.back_content.phonics_matrix || {};
    const vowels = currentLetter.back_content.compatible_vowels || Object.keys(matrix);
    const sequence: string[] = [];

    if (direction === "row") {
      for (const v of vowels) {
        const row = matrix[v] || [];
        for (const s of row) {
          if (s) sequence.push(s);
        }
      }
    } else {
      for (let toneIdx = 0; toneIdx < 6; toneIdx++) {
        for (const v of vowels) {
          const s = matrix[v]?.[toneIdx];
          if (s) sequence.push(s);
        }
      }
    }

    if (sequence.length === 0) {
      setIsAutoReading(false);
      return;
    }

    let idx = 0;
    const playNext = () => {
      if (idx >= sequence.length) {
        stopAutoReading();
        sound.speak("Bé giỏi lắm! Đã hoàn thành bảng đọc phản xạ!");
        return;
      }
      const s = sequence[idx];
      setActiveReflexSyllable(s);
      sound.speak(s);
      idx++;
      autoReadTimerRef.current = setTimeout(playNext, autoReadSpeed);
    };

    playNext();
  };

  // Tự động đọc mẫu nguyên âm
  const startAutoReadingVowels = () => {
    stopAutoReading();
    const words = currentLetter.back_content.vowel_words || [];
    if (words.length === 0) return;
    setIsAutoReading(true);
    let idx = 0;
    const playNext = () => {
      if (idx >= words.length) {
        stopAutoReading();
        sound.speak("Hoan hô bé đã đọc xong các từ dấu thanh!");
        return;
      }
      const w = words[idx];
      setActiveReflexSyllable(w);
      sound.speak(w);
      idx++;
      autoReadTimerRef.current = setTimeout(playNext, autoReadSpeed);
    };
    playNext();
  };

  // Đố phản xạ ngẫu nhiên
  const triggerRandomReflex = () => {
    stopAutoReading();
    const matrix = currentLetter.back_content.phonics_matrix || {};
    const all = Object.values(matrix).flat().filter(Boolean);
    if (all.length === 0) return;
    const pick = all[Math.floor(Math.random() * all.length)];
    setRandomReflexCard({ syllable: pick, revealed: false });
    setActiveReflexSyllable(pick);
    sound.playTone(650, 0.08);
  };

  const frontImg = currentLetter.assets.card_front;
  const backImg = currentLetter.assets.card_back;

  // Syllables list for currently selected vowel
  const currentSyllables =
    currentLetter.type === "consonant" && currentLetter.back_content.phonics_matrix
      ? currentLetter.back_content.phonics_matrix[selectedVowel] || []
      : [];

  const toneNames = ["Không dấu", "Dấu Huyền", "Dấu Sắc", "Dấu Hỏi", "Dấu Ngã", "Dấu Nặng"];
  const toneColors = [
    "bg-slate-100 text-slate-700 border-slate-300",
    "bg-sky-50 text-sky-700 border-sky-300",
    "bg-rose-50 text-rose-700 border-rose-300",
    "bg-amber-50 text-amber-700 border-amber-300",
    "bg-purple-50 text-purple-700 border-purple-300",
    "bg-emerald-50 text-emerald-700 border-emerald-300",
  ];

  return (
    <div className="w-full flex flex-col items-center py-3 sm:py-6 px-3 sm:px-6">
      {/* Hidden audio element with real teacher recording */}
      <audio
        ref={audioRef}
        src={currentLetter.audio_url}
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />

      {/* Top Header & Navigation */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-violet-100 text-violet-800 border border-violet-200 shadow-xs">
            Thẻ #{currentLetter.card_id}
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-500">
            {currentLetter.type === "vowel" ? "Nguyên âm" : "Phụ âm"}
          </span>
        </div>

        {/* Nút lật & Nghe nhanh */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAudio}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-xs ${
              isPlaying
                ? "bg-rose-600 text-white animate-pulse"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? "Đang đọc..." : "Nghe Cô Giảng"}</span>
          </button>

          <button
            onClick={handleCardClick}
            className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-violet-600" />
            <span className="hidden sm:inline">Lật Thẻ</span>
          </button>
        </div>
      </div>

      {/* Main Flashcard 3D Area */}
      <div className="w-full max-w-2xl flex flex-col items-center">
        <div
          className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-200/90 bg-white group cursor-pointer select-none"
          onClick={handleCardClick}
        >
          {/* MẶT TRƯỚC (FRONT) */}
          <div
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              isFlipped
                ? "opacity-0 pointer-events-none rotate-y-180 scale-95"
                : "opacity-100 scale-100"
            }`}
          >
            <Image
              src={frontImg}
              alt={`Thẻ ${currentLetter.card_id} - ${currentLetter.name} (Mặt trước)`}
              fill
              sizes="(max-width: 768px) 100vw, 700px"
              className="object-contain p-2"
              priority
            />
            {/* Top Badges */}
            <div className="absolute top-3 left-3 bg-violet-600/90 text-white text-xs font-black px-3 py-1 rounded-full shadow-md backdrop-blur-sm">
              Mặt trước: Nhận diện & Nét viết
            </div>

            {/* Hint overlay bottom */}
            <div className="absolute bottom-3 right-3 bg-white/90 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm flex items-center gap-1.5 border border-slate-200">
              <RotateCcw className="w-3.5 h-3.5 text-violet-600 animate-spin" />
              <span>Chạm để lật mặt sau</span>
            </div>
          </div>

          {/* MẶT SAU (BACK) */}
          <div
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              isFlipped
                ? "opacity-100 scale-100"
                : "opacity-0 pointer-events-none -rotate-y-180 scale-95"
            }`}
          >
            <Image
              src={backImg}
              alt={`Thẻ ${currentLetter.card_id} - ${currentLetter.name} (Mặt sau)`}
              fill
              sizes="(max-width: 768px) 100vw, 700px"
              className="object-contain p-2"
            />
            <div className="absolute top-3 left-3 bg-amber-600/90 text-white text-xs font-black px-3 py-1 rounded-full shadow-md backdrop-blur-sm">
              Mặt sau: Ghép Vần & Dấu Thanh
            </div>
            <div className="absolute bottom-3 right-3 bg-white/90 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm flex items-center gap-1.5 border border-slate-200">
              <RotateCcw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              <span>Chạm để quay lại</span>
            </div>
          </div>
        </div>

        {/* Thanh công cụ phụ dưới thẻ */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-2">
            {onPrevLetter && (
              <button
                onClick={onPrevLetter}
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center active:scale-95 shadow-xs"
                title="Chữ trước"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
            )}
            {onNextLetter && (
              <button
                onClick={onNextLetter}
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center active:scale-95 shadow-xs"
                title="Chữ tiếp theo"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Phóng to hướng dẫn viết */}
            <button
              onClick={() => setShowWritingModal(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
            >
              <ZoomIn className="w-4 h-4 text-violet-600" />
              <span>Xem Ô Ly Nét Viết</span>
            </button>

            {/* Video cô giáo */}
            {currentLetter.video_url && (
              <button
                onClick={() => setShowVideoModal(true)}
                className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
              >
                <Video className="w-4 h-4 text-rose-600" />
                <span>Video Cô Viết</span>
              </button>
            )}

            {/* Chuyển sang vẽ canvas */}
            {onGoToWriting && (
              <button
                onClick={onGoToWriting}
                className="min-h-[44px] px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
              >
                <PenTool className="w-4 h-4" />
                <span>Bé Tập Viết</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BẢNG TƯƠNG TÁC MẶT SAU: BẢNG GHÉP VẦN & DẤU THANH (BẢNG ĐỌC PHẢN XẠ CHUẨN LỚP 1) */}
      <div className="w-full max-w-5xl mt-6 p-4 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-md">
        {/* Header với tiêu đề và chế độ xem */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
              ⚡
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                Bảng Luyện Đọc Phản Xạ 6 Dấu Thanh & Vần
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                  Mặt Sau Thẻ SGK
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Chạm từng ô để nghe đọc mẫu, hoặc bật chế độ tự động để rèn tốc độ phản xạ
              </p>
            </div>
          </div>

          {/* Công cụ chuyển đổi chế độ xem */}
          {currentLetter.type === "consonant" && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setReflexViewMode("full")}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                  reflexViewMode === "full"
                    ? "bg-white text-violet-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Hiện toàn bộ bảng ma trận 9 nguyên âm x 6 thanh"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Toàn Bảng 9x6</span>
              </button>
              <button
                onClick={() => setReflexViewMode("single")}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                  reflexViewMode === "single"
                    ? "bg-white text-violet-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Tập trung vào 1 nguyên âm đang chọn"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Từng Âm Một</span>
              </button>
            </div>
          )}
        </div>

        {/* THANH ĐIỀU KHIỂN ĐỌC MẪU PHẢN XẠ TỰ ĐỘNG */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-rose-50/80 border border-amber-200/80 mb-4 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Nút Đọc Hàng Ngang */}
            {currentLetter.type === "consonant" && (
              <>
                <button
                  onClick={() => {
                    if (isAutoReading && autoReadDirection === "row") {
                      stopAutoReading();
                    } else {
                      startAutoReading("row");
                    }
                  }}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
                    isAutoReading && autoReadDirection === "row"
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-white hover:bg-amber-100 text-amber-900 border border-amber-300"
                  }`}
                >
                  {isAutoReading && autoReadDirection === "row" ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Dừng Đọc</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-amber-600 fill-amber-600" />
                      <span>Đọc Hàng Ngang (Theo Vần)</span>
                    </>
                  )}
                </button>

                {/* Nút Đọc Cột Dọc */}
                <button
                  onClick={() => {
                    if (isAutoReading && autoReadDirection === "col") {
                      stopAutoReading();
                    } else {
                      startAutoReading("col");
                    }
                  }}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
                    isAutoReading && autoReadDirection === "col"
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-white hover:bg-sky-100 text-sky-900 border border-sky-300"
                  }`}
                >
                  {isAutoReading && autoReadDirection === "col" ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Dừng Đọc</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-sky-600 fill-sky-600" />
                      <span>Đọc Cột Dọc (Theo Dấu)</span>
                    </>
                  )}
                </button>
              </>
            )}

            {/* Với Nguyên Âm: Nút đọc mẫu 6 dấu */}
            {currentLetter.type === "vowel" && (
              <button
                onClick={() => {
                  if (isAutoReading) stopAutoReading();
                  else startAutoReadingVowels();
                }}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
                  isAutoReading
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-white hover:bg-violet-100 text-violet-900 border border-violet-300"
                }`}
              >
                {isAutoReading ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-violet-600 fill-violet-600" />}
                <span>{isAutoReading ? "Dừng Đọc" : "▶ Đọc Mẫu Các Dấu Thanh"}</span>
              </button>
            )}

            {/* Nút Đố Phản Xạ Ngẫu Nhiên */}
            {currentLetter.type === "consonant" && (
              <button
                onClick={triggerRandomReflex}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Máy tính chọn ngẫu nhiên 1 âm đố bé đọc"
              >
                <Shuffle className="w-4 h-4 text-emerald-600" />
                <span>Đố Phản Xạ 🎲</span>
              </button>
            )}
          </div>

          {/* Tốc độ đọc phản xạ */}
          <div className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-white/80 p-1 rounded-xl border border-amber-200">
            <Gauge className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Tốc độ:</span>
            {[
              { label: "Chậm", speed: 1200 },
              { label: "Vừa", speed: 850 },
              { label: "Nhanh", speed: 500 },
            ].map((sp) => (
              <button
                key={sp.speed}
                onClick={() => setAutoReadSpeed(sp.speed)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  autoReadSpeed === sp.speed
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        {/* THÔNG BÁO THỬ THÁCH PHẢN XẠ NẾU CÓ */}
        {randomReflexCard && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-bounce">🎯</span>
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Thử thách phản xạ nhanh: <strong>Đố bé đọc đúng tiếng đang nhấp nháy!</strong>
                </p>
                <p className="text-lg font-black text-emerald-700">
                  {randomReflexCard.revealed ? (
                    <span>Tiếng: <span className="text-2xl text-rose-600 font-black">{randomReflexCard.syllable}</span></span>
                  ) : (
                    <span>Bé hãy đọc to trước khi bấm nghe đáp án nhé!</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.speak(randomReflexCard.syllable);
                  setRandomReflexCard({ ...randomReflexCard, revealed: true });
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>{randomReflexCard.revealed ? "Nghe lại" : "Nghe cô đọc mẫu"}</span>
              </button>
              <button
                onClick={triggerRandomReflex}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs active:scale-95 cursor-pointer"
              >
                Tiếng khác 🎲
              </button>
              <button
                onClick={() => setRandomReflexCard(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 1. NẾU LÀ PHỤ ÂM: MA TRẬN GHÉP NGUYÊN ÂM + 6 DẤU THANH */}
        {currentLetter.type === "consonant" && currentLetter.back_content.phonics_matrix && (
          <div className="space-y-4">
            {reflexViewMode === "full" ? (
              /* CHẾ ĐỘ MA TRẬN TOÀN DIỆN 9x6 (Y HỆT SÁCH BỘ THẺ & GÓP Ý PHỤ HUYNH) */
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-2 sm:p-3 shadow-inner">
                <div className="min-w-[620px]">
                  {/* Hàng Tiêu Đề 6 Cột Dấu Thanh */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 font-black text-center text-xs">
                    <div className="flex items-center justify-center p-2 rounded-xl bg-slate-200 text-slate-700">
                      Âm ghép
                    </div>
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex flex-col items-center">
                      <span className="text-sm sm:text-base leading-none">-</span>
                      <span className="text-[10px] font-bold">Không dấu</span>
                    </div>
                    <div className="p-2 rounded-xl bg-sky-100 text-sky-900 border border-sky-300 flex flex-col items-center">
                      <span className="text-sm sm:text-base leading-none">\</span>
                      <span className="text-[10px] font-bold">Huyền</span>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-100 text-rose-900 border border-rose-300 flex flex-col items-center">
                      <span className="text-sm sm:text-base leading-none">/</span>
                      <span className="text-[10px] font-bold">Sắc</span>
                    </div>
                    <div className="p-2 rounded-xl bg-orange-100 text-orange-900 border border-orange-300 flex flex-col items-center">
                      <span className="text-sm sm:text-base leading-none">?</span>
                      <span className="text-[10px] font-bold">Hỏi</span>
                    </div>
                    <div className="p-2 rounded-xl bg-purple-100 text-purple-900 border border-purple-300 flex flex-col items-center">
                      <span className="text-sm sm:text-base leading-none">~</span>
                      <span className="text-[10px] font-bold">Ngã</span>
                    </div>
                    <div className="p-2 rounded-xl bg-red-100 text-red-900 border border-red-300 flex flex-col items-center">
                      <span className="text-sm sm:text-base leading-none">.</span>
                      <span className="text-[10px] font-bold">Nặng</span>
                    </div>
                  </div>

                  {/* Các Hàng Nguyên Âm */}
                  <div className="space-y-1.5 sm:space-y-2">
                    {(currentLetter.back_content.compatible_vowels || Object.keys(currentLetter.back_content.phonics_matrix)).map((vowel) => {
                      const rowSyllables = currentLetter.back_content.phonics_matrix?.[vowel] || [];
                      return (
                        <div key={vowel} className="grid grid-cols-7 gap-1.5 sm:gap-2 items-center">
                          {/* Cột Trái: Huy hiệu Nguyên Âm */}
                          <div className="min-h-[46px] rounded-xl bg-white border border-slate-200 flex items-center justify-center gap-1 font-black text-sm text-slate-800 shadow-2xs">
                            <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[11px] flex items-center justify-center">
                              {currentLetter.letter.toLowerCase()}
                            </span>
                            <span>+</span>
                            <span className="text-violet-700 text-base">{vowel}</span>
                          </div>

                          {/* 6 Ô Âm Tiết Theo 6 Dấu Thanh */}
                          {[0, 1, 2, 3, 4, 5].map((toneIdx) => {
                            const syl = rowSyllables[toneIdx] || "";
                            if (!syl) {
                              return (
                                <div
                                  key={toneIdx}
                                  className="min-h-[46px] rounded-xl bg-slate-100/50 border border-dashed border-slate-200"
                                />
                              );
                            }

                            const isActive = activeReflexSyllable === syl;
                            const isChallenged = randomReflexCard?.syllable === syl;

                            const columnBgColors = [
                              "bg-amber-50/90 hover:bg-amber-100 text-amber-950 border-amber-200",
                              "bg-sky-50/90 hover:bg-sky-100 text-sky-950 border-sky-200",
                              "bg-rose-50/90 hover:bg-rose-100 text-rose-950 border-rose-200",
                              "bg-orange-50/90 hover:bg-orange-100 text-orange-950 border-orange-200",
                              "bg-purple-50/90 hover:bg-purple-100 text-purple-950 border-purple-200",
                              "bg-red-50/90 hover:bg-red-100 text-red-950 border-red-200",
                            ];

                            return (
                              <button
                                key={toneIdx}
                                onClick={() => speakSyllable(syl)}
                                className={`min-h-[46px] p-1.5 rounded-xl border-2 flex items-center justify-center font-black text-base sm:text-lg transition-all active:scale-95 cursor-pointer shadow-2xs relative ${
                                  columnBgColors[toneIdx]
                                } ${
                                  isActive
                                    ? "ring-4 ring-amber-400 bg-amber-300 text-amber-950 scale-105 z-20 shadow-md font-black"
                                    : ""
                                } ${
                                  isChallenged && !randomReflexCard?.revealed
                                    ? "animate-bounce ring-4 ring-emerald-500 bg-emerald-200"
                                    : ""
                                }`}
                                title={`Chạm để nghe đọc: ${syl}`}
                              >
                                <span>{syl}</span>
                                {isActive && (
                                  <Volume2 className="w-3.5 h-3.5 text-amber-800 animate-pulse ml-1" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* CHẾ ĐỘ TẬP TRUNG TỪNG ÂM */
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2">
                  1. Chọn nguyên âm ghép với chữ{" "}
                  <span className="text-violet-600 font-black uppercase text-sm">
                    {currentLetter.letter}
                  </span>:
                </p>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {(currentLetter.back_content.compatible_vowels || []).map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        sound.playTone(440, 0.05);
                        setSelectedVowel(v);
                      }}
                      className={`min-h-[44px] min-w-[44px] px-3.5 py-1.5 rounded-xl font-black text-sm sm:text-base transition-all active:scale-95 flex items-center justify-center gap-1 shrink-0 border ${
                        selectedVowel === v
                          ? "bg-violet-600 text-white border-violet-600 shadow-md ring-2 ring-violet-400 ring-offset-1"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-transparent shadow-xs"
                      }`}
                    >
                      {currentLetter.letter.toLowerCase()} + {v}
                    </button>
                  ))}
                </div>

                <p className="text-xs font-bold text-slate-500 mb-2">
                  2. 6 thanh điệu của tiếng{" "}
                  <span className="text-violet-700 font-black">
                    {currentLetter.letter.toLowerCase() + selectedVowel}
                  </span>:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                  {currentSyllables.map((syl, sIdx) => (
                    <button
                      key={syl}
                      onClick={() => speakSyllable(syl)}
                      className={`min-h-[52px] p-2 rounded-2xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 hover:shadow-md cursor-pointer ${
                        toneColors[sIdx % toneColors.length]
                      } ${
                        activeReflexSyllable === syl ? "ring-4 ring-amber-400 bg-amber-200 scale-105" : ""
                      }`}
                    >
                      <span className="text-lg sm:text-2xl font-black">{syl}</span>
                      <span className="text-[10px] font-bold text-slate-500">{toneNames[sIdx]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TỪ VỰNG GHÉP CÂU ỨNG DỤNG THEO SÁCH BỘ THẺ */}
            {currentLetter.back_content.phrases && currentLetter.back_content.phrases.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <span>🌟</span>
                    <span>Từ vựng ứng dụng chuẩn sách giáo khoa (chân thẻ):</span>
                  </p>
                  <span className="text-[11px] text-slate-400">Chạm để nghe đọc cả từ</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {currentLetter.back_content.phrases.map((phrase) => {
                    const isPhraseActive = activeReflexSyllable === phrase;
                    return (
                      <button
                        key={phrase}
                        onClick={() => speakSyllable(phrase)}
                        className={`min-h-[48px] px-3.5 py-2 rounded-2xl border-2 flex items-center justify-between gap-2 active:scale-95 transition-all shadow-xs cursor-pointer ${
                          isPhraseActive
                            ? "bg-amber-300 border-amber-500 text-amber-950 ring-2 ring-amber-400 shadow-md scale-105 font-black"
                            : "bg-amber-50/70 hover:bg-amber-100/80 border-amber-200 text-amber-900"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="font-black text-sm sm:text-base capitalize">{phrase}</span>
                        </div>
                        <Volume2 className={`w-4 h-4 shrink-0 ${isPhraseActive ? "text-amber-900 animate-bounce" : "text-amber-600"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. NẾU LÀ NGUYÊN ÂM: DANH SÁCH TỪ MINH HỌA VÀ THANH ĐIỆU */}
        {currentLetter.type === "vowel" && currentLetter.back_content.vowel_words && (
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-500">
              Các từ chứa âm{" "}
              <span className="text-violet-600 font-black uppercase text-sm">
                {currentLetter.letter}
              </span>{" "}
              với các dấu thanh chuẩn lớp 1:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
              {currentLetter.back_content.vowel_words.map((w, idx) => {
                const isActive = activeReflexSyllable === w;
                return (
                  <button
                    key={w + idx}
                    onClick={() => speakSyllable(w)}
                    className={`min-h-[52px] p-3 rounded-2xl border-2 font-black text-lg sm:text-xl flex flex-col items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer ${
                      isActive
                        ? "bg-amber-300 border-amber-500 text-amber-950 ring-4 ring-amber-400 scale-105 shadow-md"
                        : "bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-900"
                    }`}
                  >
                    <span>{w}</span>
                    <span className="text-[10px] font-bold text-violet-600 mt-0.5 flex items-center gap-1">
                      {isActive ? <Volume2 className="w-3 h-3 animate-pulse" /> : "Bấm nghe"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Khẩu hình phát âm & lời khuyên */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-600 space-y-1">
              <p>
                👄 <strong className="text-slate-800">Khẩu hình chuẩn:</strong> {currentLetter.mouth_shape}
              </p>
              <p>
                💡 <strong className="text-slate-800">Mẹo cho phụ huynh:</strong> {currentLetter.parent_tip}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PHÓNG TO HƯỚNG DẪN VIẾT NÉT TRÊN Ô LY */}
      {showWritingModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <ZoomIn className="w-5 h-5 text-violet-600" />
                Khung Ô Ly Hướng Dẫn Viết Chữ {currentLetter.letter}
              </h3>
              <button
                onClick={() => setShowWritingModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 mb-4 bg-slate-50">
              <Image
                src={currentLetter.assets.writing_guide}
                alt={`Khung ô ly chữ ${currentLetter.letter}`}
                fill
                className="object-contain p-2"
              />
            </div>

            {/* Các bước viết */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-black text-slate-700 uppercase">Quy trình viết chuẩn:</h4>
              {currentLetter.writing_steps.map((st, i) => (
                <div key={i} className="text-xs sm:text-sm text-slate-600 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{st}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowWritingModal(false);
                  if (onGoToWriting) onGoToWriting();
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-md active:scale-95"
              >
                <PenTool className="w-4 h-4" />
                <span>Bắt Đầu Tập Viết Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM VIDEO CÔ HƯỚNG DẪN VIẾT */}
      {showVideoModal && currentLetter.video_url && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Video className="w-5 h-5 text-rose-600" />
                Video Cô Giáo Hướng Dẫn Viết Chữ {currentLetter.letter}
              </h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embed or open YouTube */}
            <div className="text-center py-6 space-y-4">
              <p className="text-sm text-slate-600">
                Video bài giảng chuẩn trích xuất trực tiếp từ mã QR trên Thẻ #{currentLetter.card_id}.
              </p>
              <a
                href={currentLetter.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm sm:text-base items-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Video className="w-5 h-5" />
                <span>Xem Video Trên YouTube ({currentLetter.name})</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
