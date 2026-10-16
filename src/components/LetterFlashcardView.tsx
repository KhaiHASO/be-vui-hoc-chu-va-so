"use client";

import React, { useState, useRef, useEffect } from "react";
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

  // Set default selected vowel when letter changes
  useEffect(() => {
    setIsFlipped(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
    setIsPlaying(false);

    if (currentLetter.type === "consonant" && currentLetter.back_content.compatible_vowels?.length) {
      setSelectedVowel(currentLetter.back_content.compatible_vowels[0]);
    }
  }, [currentLetter]);

  // Dọn dẹp âm thanh khi unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

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
    sound.playTone(587.33, 0.08);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "vi-VN";
      u.rate = 0.8;
      window.speechSynthesis.speak(u);
    }
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

      {/* BẢNG TƯƠNG TÁC MẶT SAU: BẢNG GHÉP VẦN & DẤU THANH (Pedagogical Phonics Matrix) */}
      <div className="w-full max-w-4xl mt-6 p-4 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-md">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
              📖
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-800">
              Luyện Đọc & Đánh Vần Chuẩn Lớp 1 (Mặt Sau Thẻ)
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">Chạm vào từng từ để nghe đọc</span>
        </div>

        {/* 1. NẾU LÀ PHỤ ÂM: MA TRẬN GHÉP NGUYÊN ÂM + 6 DẤU THANH */}
        {currentLetter.type === "consonant" && currentLetter.back_content.compatible_vowels && (
          <div className="space-y-4">
            {/* Dải chọn nguyên âm ghép cùng */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">
                1. Chọn nguyên âm ghép với chữ{" "}
                <span className="text-violet-600 font-black uppercase text-sm">
                  {currentLetter.letter}
                </span>
                :
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {currentLetter.back_content.compatible_vowels.map((v) => (
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
            </div>

            {/* Bảng 6 dấu thanh của âm đang chọn */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">
                2. 6 thanh điệu của tiếng{" "}
                <span className="text-violet-700 font-black">
                  {currentLetter.letter.toLowerCase() + selectedVowel}
                </span>
                :
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                {currentSyllables.map((syl, sIdx) => (
                  <button
                    key={syl}
                    onClick={() => speakSyllable(syl)}
                    className={`min-h-[52px] p-2 rounded-2xl border-2 flex flex-col items-center justify-center transition-all active:scale-95 hover:shadow-md ${
                      toneColors[sIdx % toneColors.length]
                    }`}
                  >
                    <span className="text-lg sm:text-2xl font-black">{syl}</span>
                    <span className="text-[10px] font-bold text-slate-500">{toneNames[sIdx]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Từ ứng dụng ở chân thẻ */}
            {currentLetter.back_content.phrases && currentLetter.back_content.phrases.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-2">3. Từ vựng ghép câu ứng dụng:</p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {currentLetter.back_content.phrases.map((phrase) => (
                    <button
                      key={phrase}
                      onClick={() => speakSyllable(phrase)}
                      className="min-h-[44px] px-4 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-black text-sm flex items-center gap-2 active:scale-95 transition-all shadow-xs"
                    >
                      <Volume2 className="w-4 h-4 text-amber-600" />
                      <span>{phrase}</span>
                    </button>
                  ))}
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
              với các dấu thanh:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
              {currentLetter.back_content.vowel_words.map((w, idx) => (
                <button
                  key={w + idx}
                  onClick={() => speakSyllable(w)}
                  className="min-h-[52px] p-3 rounded-2xl bg-violet-50 hover:bg-violet-100 border-2 border-violet-200 text-violet-900 font-black text-lg sm:text-xl flex flex-col items-center justify-center active:scale-95 transition-all shadow-xs"
                >
                  <span>{w}</span>
                  <span className="text-[10px] font-bold text-violet-600">Bấm nghe</span>
                </button>
              ))}
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
