"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { LetterCardData } from "@/types/letter";
import {
  RotateCcw,
  Sparkles,
  Undo2,
  CheckCircle,
  Eye,
  EyeOff,
  PenTool,
  Volume2,
  BookOpen,
  Info,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/utils/speech";

// Tỉ lệ kích thước thật của ảnh khung ô ly cắt trực tiếp từ tài liệu BỘ THẺ.pdf
export const LETTER_WRITING_ASPECTS: Record<string, number> = {
  a: 434 / 389,
  aw: 435 / 384,
  aa: 435 / 388,
  b: 435 / 469,
  c: 435 / 386,
  d: 435 / 480,
  dd: 435 / 481,
  e: 434 / 387,
  ee: 435 / 388,
  g: 435 / 510,
  h: 434 / 571,
  i: 435 / 390,
  k: 430 / 571,
  l: 435 / 574,
  m: 609 / 390,
  n: 608 / 388,
  o: 434 / 386,
  oo: 435 / 386,
  ow: 434 / 389,
  p: 429 / 478,
  q: 475 / 520,
  r: 434 / 430,
  s: 435 / 389,
  t: 416 / 386,
  u: 403 / 385,
  uw: 435 / 386,
  v: 434 / 387,
  x: 435 / 389,
  y: 435 / 494,
};

// Cấu hình số hàng & cột ô ly chuẩn tiểu học cho chữ viết thường theo sách
export function getLetterGridConfig(slug: string): {
  cols: number;
  rows: number;
  baselineRow: number;
  heightLy: string;
} {
  if (slug === "m" || slug === "n") {
    return { cols: 6, rows: 4, baselineRow: 4, heightLy: "2 ô ly (rộng 5 ô ly)" };
  }
  if (slug === "h" || slug === "k" || slug === "l") {
    return { cols: 4, rows: 6, baselineRow: 6, heightLy: "5 ô ly (khuyết trên)" };
  }
  if (slug === "b" || slug === "d" || slug === "dd" || slug === "p" || slug === "q") {
    return {
      cols: 4,
      rows: 5,
      baselineRow: 5,
      heightLy: slug === "p" || slug === "q" ? "4 ô ly" : "4 - 5 ô ly",
    };
  }
  if (slug === "g" || slug === "y") {
    return { cols: 4, rows: 5.5, baselineRow: 3, heightLy: "5 ô ly (khuyết dưới 3 ly)" };
  }
  if (slug === "t") {
    return { cols: 4, rows: 4, baselineRow: 4, heightLy: "3 ô ly" };
  }
  if (slug === "r" || slug === "s") {
    return { cols: 4, rows: 4, baselineRow: 4, heightLy: "2.25 ô ly" };
  }
  return { cols: 4, rows: 4, baselineRow: 4, heightLy: "2 ô ly" };
}

interface LetterWritingCanvasProps {
  currentLetter: LetterCardData;
}

export function LetterWritingCanvas({ currentLetter }: LetterWritingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [strokeColor, setStrokeColor] = useState<string>("#7c3aed"); // Tím mực học sinh
  const [lineWidth, setLineWidth] = useState<number>(8);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(true); // true = Mẫu sách giáo khoa; false = Tự viết trên ô ly
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Undo history & touch tracking (dùng ref để ZERO re-render lúc vẽ)
  const strokeHistoryRef = useRef<ImageData[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const lowerChar = currentLetter.forms?.lower_cursive || currentLetter.letter.toLowerCase();
  const writingGuideImg = `/data/module_letters/writing_guides/writing_chu_${currentLetter.slug}.png`;
  const gridConfig = getLetterGridConfig(currentLetter.slug);
  const currentAspect = LETTER_WRITING_ASPECTS[currentLetter.slug] || 1.12;

  // Xóa trắng nét vẽ khi đổi chữ cái
  const handleClear = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokeHistoryRef.current = [];
    setHasDrawn(false);
  }, []);

  // Reset trạng thái khi đổi chữ cái
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
    setIsPlayingAudio(false);
    setShowGuide(true);
    handleClear();
  }, [currentLetter, handleClear]);

  // Dọn dẹp âm thanh khi unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 1. Vẽ lưới ô ly tiểu học chuẩn Bộ GD&ĐT (khi tắt mẫu để bé tự viết)
  const drawPrimaryGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      cols: number,
      rows: number,
      baselineRow: number
    ) => {
      ctx.clearRect(0, 0, width, height);

      // Nền trắng tinh
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      const cellW = width / cols;
      const cellH = height / rows;

      // Khung viền ngoài màu xanh tiểu học
      ctx.strokeStyle = "#93c5fd";
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, width - 3, height - 3);

      // Đường kẻ ô ly dọc
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(147, 197, 253, 0.75)";
      for (let c = 1; c < cols; c++) {
        const x = Math.round(c * cellW);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Đường kẻ ô ly ngang
      for (let r = 1; r < rows; r++) {
        const y = Math.round(r * cellH);
        const isBaseline = r === baselineRow;
        ctx.beginPath();
        ctx.lineWidth = isBaseline ? 2.5 : 1;
        ctx.strokeStyle = isBaseline
          ? "rgba(37, 99, 235, 0.95)" // Đường kẻ đậm chân chữ (Baseline)
          : "rgba(147, 197, 253, 0.75)";
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    },
    []
  );

  // Resize canvas theo kích thước container
  const resizeCanvases = useCallback(() => {
    const container = containerRef.current;
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!container || !bgCanvas || !drawCanvas) return;

    const rect = container.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);

    if (width <= 0 || height <= 0) return;

    bgCanvas.width = width;
    bgCanvas.height = height;
    drawCanvas.width = width;
    drawCanvas.height = height;

    const bgCtx = bgCanvas.getContext("2d");
    if (!bgCtx) return;

    // Khi bật mẫu sách: hiển thị ảnh gốc từ SGK (không vẽ đè lưới nhân tạo để tránh trùng lưới)
    if (showGuide) {
      bgCtx.clearRect(0, 0, width, height);
    } else {
      drawPrimaryGrid(
        bgCtx,
        width,
        height,
        gridConfig.cols,
        gridConfig.rows,
        gridConfig.baselineRow
      );
    }
  }, [showGuide, gridConfig, drawPrimaryGrid]);

  useEffect(() => {
    resizeCanvases();
    window.addEventListener("resize", resizeCanvases);
    return () => window.removeEventListener("resize", resizeCanvases);
  }, [resizeCanvases]);

  useEffect(() => {
    resizeCanvases();
  }, [currentLetter, showGuide, resizeCanvases]);

  // Lưu lịch sử nét vẽ phục vụ hoàn tác
  const saveState = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    try {
      const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
      strokeHistoryRef.current.push(state);
      if (strokeHistoryRef.current.length > 25) {
        strokeHistoryRef.current.shift();
      }
    } catch (e) {
      console.warn("Lưu state vẽ không khả dụng:", e);
    }
  }, []);

  // Lấy tọa độ chuẩn 1:1 trên canvas theo thời gian thực
  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = drawCanvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    []
  );

  // Bắt đầu vẽ
  const startDrawing = useCallback(
    (clientX: number, clientY: number) => {
      saveState();
      const coords = getCanvasCoords(clientX, clientY);
      if (!coords) return;

      isDrawingRef.current = true;
      lastPointRef.current = coords;
      setHasDrawn(true);

      const canvas = drawCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.arc(coords.x, coords.y, lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
    },
    [getCanvasCoords, lineWidth, saveState, strokeColor]
  );

  // Di chuyển nét vẽ với nắn mượt Bézier
  const draw = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDrawingRef.current || !lastPointRef.current) return;
      const canvas = drawCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const currentPoint = getCanvasCoords(clientX, clientY);
      if (!currentPoint) return;

      const midPoint = {
        x: (lastPointRef.current.x + currentPoint.x) / 2,
        y: (lastPointRef.current.y + currentPoint.y) / 2,
      };

      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.quadraticCurveTo(
        lastPointRef.current.x,
        lastPointRef.current.y,
        midPoint.x,
        midPoint.y
      );
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      lastPointRef.current = currentPoint;
    },
    [getCanvasCoords, lineWidth, strokeColor]
  );

  // Kết thúc nét vẽ
  const stopDrawing = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  // Native Touch Listeners { passive: false } chống lag / cuộn iOS
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        startDrawing(touch.clientX, touch.clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        draw(touch.clientX, touch.clientY);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      stopDrawing();
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [startDrawing, draw, stopDrawing]);

  // Hoàn tác 1 nét
  const handleUndo = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (strokeHistoryRef.current.length > 0) {
      sound.playTone(440, 0.05);
      const previousState = strokeHistoryRef.current.pop();
      if (previousState) {
        ctx.putImageData(previousState, 0, 0);
      }
      if (strokeHistoryRef.current.length === 0) {
        setHasDrawn(false);
      }
    } else {
      handleClear();
    }
  };

  // Khen bé hoàn thành
  const handleComplete = () => {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
    });
    sound.playSuccessSound();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const msg = new SpeechSynthesisUtterance(
        `Hoan hô bé! Bé viết chữ ${lowerChar} rất đẹp và chuẩn ô ly!`
      );
      msg.lang = "vi-VN";
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }
  };

  // Nghe phát âm & cô hướng dẫn
  const playAudioGuide = () => {
    if (audioRef.current && currentLetter.audio_url) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play().catch(() => {
          speakFallback();
        });
        setIsPlayingAudio(true);
      }
    } else {
      speakFallback();
    }
  };

  const speakFallback = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        `Chữ ${lowerChar} viết thường. ${currentLetter.name}.`
      );
      utterance.lang = "vi-VN";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const colors = [
    { name: "Tím Mực Học Sinh", value: "#7c3aed" },
    { name: "Xanh Dương Chuẩn", value: "#2563eb" },
    { name: "Đỏ Sửa Bài", value: "#dc2626" },
    { name: "Xanh Lá Cây", value: "#16a34a" },
    { name: "Cam Rực Rỡ", value: "#ea580c" },
  ];

  return (
    <div className="w-full flex flex-col items-center py-3 sm:py-6 px-3 sm:px-6 pb-12 sm:pb-8">
      <audio
        ref={audioRef}
        src={currentLetter.audio_url}
        onEnded={() => setIsPlayingAudio(false)}
        onError={() => setIsPlayingAudio(false)}
      />

      {/* Header trang tập viết chữ thường theo sách */}
      <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Luyện Viết Chữ Thường Chuẩn Ô Ly Lớp 1 (Theo Sách)
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 flex-wrap">
            <span>Tập Viết Chữ Thường:</span>
            <span className="text-3xl sm:text-4xl px-3 py-0.5 rounded-xl border font-cursive-vn text-violet-600 bg-violet-50 border-violet-200">
              {lowerChar}
            </span>
            <span className="text-slate-400 text-sm sm:text-lg font-bold">
              ({currentLetter.name})
            </span>
          </h2>
        </div>

        {/* Nút nghe phát âm */}
        <button
          onClick={playAudioGuide}
          className={`min-h-[44px] px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer ${
            isPlayingAudio
              ? "bg-rose-600 text-white animate-pulse"
              : "bg-violet-600 hover:bg-violet-700 text-white"
          }`}
          title="Bấm để nghe cô phát âm chữ cái"
        >
          <Volume2 className="w-4 h-4" />
          <span>{isPlayingAudio ? "Đang phát..." : "Nghe Phát Âm"}</span>
        </button>
      </div>

      {/* Bố cục 2 cột: Cột Trái = Sổ Tay Hướng Dẫn Sách Giáo Khoa, Cột Phải = Bảng Viết Ô Ly */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (5 cols): HƯỚNG DẪN VIẾT CHỮ THƯỜNG THEO SÁCH */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-md space-y-4 order-2 lg:order-1">
          {/* Tiêu đề & Thông số cơ bản */}
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <span className="text-[11px] font-black uppercase text-violet-600 block">
                Mẫu Chữ Sách Giáo Khoa Lớp 1
              </span>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span>Chữ viết thường:</span>
                <span className="text-2xl font-cursive-vn text-violet-600">
                  {lowerChar}
                </span>
              </h3>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-violet-100 text-violet-700">
              {currentLetter.stroke_count} nét cơ bản
            </span>
          </div>

          {/* Quy chuẩn kỹ thuật ô ly */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2.5">
            <h4 className="text-xs font-black text-indigo-900 uppercase flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Quy Chuẩn Kỹ Thuật Ô Ly:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                <span className="text-slate-400 text-[10px] block font-bold">Chiều cao chữ:</span>
                <span className="font-black text-indigo-700 text-sm">{gridConfig.heightLy}</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-indigo-100">
                <span className="text-slate-400 text-[10px] block font-bold">Số nét:</span>
                <span className="font-black text-indigo-700 text-sm">{currentLetter.stroke_count} nét</span>
              </div>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-indigo-100 text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-indigo-600">📌 Cách viết:</span> Đặt bút tại điểm chấm đỏ số 1, di chuyển bút theo chiều mũi tên đến điểm dừng nét.
            </div>
          </div>

          {/* Các bước viết chi tiết theo chuẩn sách giáo khoa */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Các bước viết chữ thường &quot;{lowerChar}&quot;:
            </h4>
            {currentLetter.writing_steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100"
              >
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </div>
            ))}
          </div>

          {/* Lời khuyên phụ huynh */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            💡 <strong>Lời khuyên khi dạy bé:</strong> {currentLetter.parent_tip}
          </div>
        </div>

        {/* CỘT PHẢI (7 cols): BẢNG VIẾT Ô LY CHUẨN THEO SÁCH */}
        <div className="lg:col-span-7 flex flex-col items-center bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-md order-1 lg:order-2">
          {/* Thanh công cụ vẽ */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2.5 mb-3.5 pb-3 border-b border-slate-100">
            {/* Bảng chọn màu mực */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 hidden sm:inline">Màu:</span>
              <div className="flex items-center gap-1.5">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => {
                      sound.playTone(523.25, 0.05);
                      setStrokeColor(c.value);
                    }}
                    className={`min-h-[44px] min-w-[44px] rounded-xl border-2 transition-all active:scale-95 cursor-pointer ${
                      strokeColor === c.value
                        ? "border-slate-800 scale-105 shadow-sm"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>

              <span className="text-xs font-bold text-slate-400 ml-2 hidden sm:inline">Nét:</span>
              <div className="hidden sm:flex items-center gap-1">
                {[
                  { label: "Mảnh", w: 5 },
                  { label: "Vừa", w: 8 },
                  { label: "Đậm", w: 12 },
                ].map((item) => (
                  <button
                    key={item.w}
                    onClick={() => setLineWidth(item.w)}
                    className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                      lineWidth === item.w
                        ? "bg-violet-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bật/tắt mẫu sách, Hoàn tác & Viết lại */}
            <div className="flex items-center gap-2">
              {/* Nút chuyển đổi: Mẫu sách (tô đè) / Tự viết (trên ô ly trắng) */}
              <button
                onClick={() => {
                  sound.playTone(400, 0.05);
                  setShowGuide(!showGuide);
                }}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all border active:scale-95 cursor-pointer shadow-xs ${
                  showGuide
                    ? "bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                }`}
                title={showGuide ? "Đang hiện mẫu sách. Bấm để chuyển sang ô ly tự viết." : "Đang ở ô ly tự viết. Bấm để hiện lại mẫu sách."}
              >
                {showGuide ? <Eye className="w-4 h-4 text-violet-600" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
                <span>{showGuide ? "Mẫu Sách" : "Tự Viết"}</span>
              </button>

              {/* Nút Hoàn tác (Undo) */}
              <button
                onClick={handleUndo}
                disabled={!hasDrawn}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all border ${
                  hasDrawn
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-xs cursor-pointer"
                    : "bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed"
                }`}
                title="Hoàn tác nét vừa vẽ"
              >
                <Undo2 className="w-4 h-4" />
                <span className="hidden sm:inline">Lùi lại</span>
              </button>

              {/* Nút Viết lại (Clear) */}
              <button
                onClick={() => {
                  sound.playTone(350, 0.05);
                  handleClear();
                }}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all border border-rose-200 cursor-pointer shadow-xs"
                title="Xóa trắng bảng để viết lại"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Viết lại</span>
              </button>
            </div>
          </div>

          {/* VÙNG BẢNG VIẾT Ô LY: TỰ THÍCH ỨNG CHUẨN TỈ LỆ THỰC CỦA CHỮ CÁI SGK */}
          <div className="w-full flex items-center justify-center p-1 sm:p-2">
            <div
              ref={containerRef}
              className="relative w-full max-w-[460px] rounded-3xl overflow-hidden border-2 border-indigo-300/80 shadow-lg bg-white select-none transition-all duration-300"
              style={{
                aspectRatio: `${currentAspect}`,
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              {/* Lớp 1: Lưới ô ly tiểu học tĩnh (Background Canvas khi ở chế độ Tự Viết) */}
              <canvas
                ref={bgCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Lớp 2: Hiển thị 100% mẫu chữ thường theo sách giáo khoa (tài liệu BỘ THẺ) */}
              {showGuide && (
                <div className="absolute inset-0 pointer-events-none select-none">
                  <Image
                    src={writingGuideImg}
                    alt={`Mẫu chữ thường ${lowerChar} theo sách giáo khoa`}
                    fill
                    sizes="(max-width: 768px) 100vw, 460px"
                    className="object-cover select-none pointer-events-none"
                    priority
                    unoptimized
                  />
                </div>
              )}

              {/* Lớp 3: Canvas tương tác hứng nét vẽ của bé (ZERO lag, tọa độ 1:1 chuẩn xác) */}
              <canvas
                ref={drawCanvasRef}
                className="absolute inset-0 w-full h-full cursor-crosshair z-10"
                onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
                onMouseMove={(e) => draw(e.clientX, e.clientY)}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
          </div>

          {/* Chú thích & Nút hoàn thành */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-2">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 text-center sm:text-left">
              <PenTool className="w-3.5 h-3.5 text-violet-600 shrink-0" />
              Bé chấm vào điểm đỏ số 1 và lia bút theo mũi tên nhé!
            </span>

            <button
              onClick={handleComplete}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Khen Bé Hoàn Thành 🎉</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
