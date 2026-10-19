"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { LetterCardData } from "@/types/letter";
import {
  RotateCcw,
  Sparkles,
  Undo2,
  CheckCircle,
  Play,
  Pause,
  Video,
  Eye,
  EyeOff,
  PenTool,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/utils/speech";

interface LetterWritingCanvasProps {
  currentLetter: LetterCardData;
}

export function LetterWritingCanvas({ currentLetter }: LetterWritingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [strokeColor, setStrokeColor] = useState<string>("#2563eb"); // Xanh mực học sinh
  const [lineWidth, setLineWidth] = useState<number>(8);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [ghostMode, setGhostMode] = useState<"card" | "cursive" | "none">("card");
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Undo history & touch tracking
  const strokeHistoryRef = useRef<ImageData[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const lowerChar = currentLetter.forms?.lower_cursive || currentLetter.letter.toLowerCase();

  // Reset khi đổi chữ
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
    setIsPlayingAudio(false);
    handleClear();
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

  // 1. Vẽ nền lưới ô ly 4 dòng kẻ chuẩn tiểu học Việt Nam
  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);

      // Nền trắng tinh
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      const gridSize = 36; // Kích thước ô ly vuông
      const numCols = Math.floor(width / gridSize);
      const numRows = Math.floor(height / gridSize);

      // Đường kẻ ô ly dọc
      for (let c = 0; c <= numCols; c++) {
        const x = c * gridSize;
        ctx.beginPath();
        ctx.lineWidth = c % 4 === 0 ? 1.5 : 0.8;
        ctx.strokeStyle =
          c % 4 === 0 ? "rgba(99, 102, 241, 0.4)" : "rgba(226, 232, 240, 0.85)";
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Đường kẻ ô ly ngang
      for (let r = 0; r <= numRows; r++) {
        const y = r * gridSize;
        const isBaseline = r % 4 === 0;
        ctx.beginPath();
        ctx.lineWidth = isBaseline ? 2 : 0.8;
        ctx.strokeStyle = isBaseline
          ? "rgba(37, 99, 235, 0.55)" // Đường kẻ chính đậm
          : "rgba(226, 232, 240, 0.85)";
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
    if (bgCtx) {
      drawGrid(bgCtx, width, height);
    }
  }, [drawGrid]);

  useEffect(() => {
    resizeCanvases();
    window.addEventListener("resize", resizeCanvases);
    return () => window.removeEventListener("resize", resizeCanvases);
  }, [resizeCanvases]);

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext("2d");
    if (ctx) {
      drawGrid(ctx, bgCanvas.width, bgCanvas.height);
    }
  }, [drawGrid]);

  // Lưu lịch sử nét vẽ
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

  // Lấy tọa độ chuẩn 1:1 trên canvas
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

  // Hoàn tác
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

  // Xóa trắng bảng vẽ
  const handleClear = () => {
    sound.playTone(350, 0.05);
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokeHistoryRef.current = [];
    setHasDrawn(false);
  };

  // Khen bé hoàn thành
  const handleComplete = () => {
    sound.playSuccessSound();
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
    });
  };

  // Nghe giảng audio
  const toggleTeacherAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch((e) => console.warn("Lỗi phát audio:", e));
    }
  };

  const colors = [
    { name: "Mực Xanh", value: "#2563eb" },
    { name: "Mực Tím", value: "#7c3aed" },
    { name: "Bút Đỏ", value: "#dc2626" },
    { name: "Bút Xanh Lá", value: "#059669" },
    { name: "Bút Cam", value: "#ea580c" },
  ];

  return (
    <div className="w-full flex flex-col items-center py-3 sm:py-6 px-3 sm:px-6">
      <audio
        ref={audioRef}
        src={currentLetter.audio_url}
        onEnded={() => setIsPlayingAudio(false)}
        onError={() => setIsPlayingAudio(false)}
      />

      {/* Header */}
      <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Luyện Viết Chữ Thường Chuẩn Ô Ly Lớp 1
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Tập Viết Chữ Thường</span>
            <span className="text-violet-600 font-cursive-vn text-3xl sm:text-4xl px-2 py-0.5 rounded-xl bg-violet-50 border border-violet-200">
              {lowerChar}
            </span>
            <span className="text-slate-400 text-sm sm:text-lg font-bold">
              ({currentLetter.name})
            </span>
          </h2>
        </div>

        {/* Nút nghe giảng & xem video */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTeacherAudio}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-xs ${
              isPlayingAudio
                ? "bg-rose-600 text-white animate-pulse"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            }`}
          >
            {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlayingAudio ? "Đang nghe cô..." : "Nghe Cô Giảng"}</span>
          </button>

          {currentLetter.video_url && (
            <a
              href={currentLetter.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all shadow-xs"
            >
              <Video className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Xem Video Viết</span>
            </a>
          )}
        </div>
      </div>

      {/* Layout 2 cột: Bên Trái = Mẫu Sách Giáo Khoa Thẻ Học, Bên Phải = Bảng Vẽ Ô Ly */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (5 cols): KHUNG HƯỚNG DẪN VIẾT CHUẨN TỪ BỘ THẺ */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div>
              <span className="text-[11px] font-black uppercase text-violet-600 block">
                Tiêu Chuẩn Chữ Viết Lớp 1
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
                Chữ Thường:{" "}
                <span className="text-violet-600 font-cursive-vn text-xl">
                  {lowerChar}
                </span>
              </h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
              {currentLetter.stroke_count} nét
            </span>
          </div>

          {/* 1. KHUNG 4 DẠNG CHỮ CÁI TIỂU HỌC TỪ THẺ GỐC */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                4 Dạng Chữ "{currentLetter.name}":
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Chuẩn Thẻ Học
              </span>
            </div>
            <div className="relative w-full aspect-[4/1] rounded-xl overflow-hidden bg-white border border-slate-200 shadow-xs">
              <Image
                src={`/data/module_letters/writing_guides/forms_chu_${currentLetter.slug}.png`}
                alt={`4 dạng chữ cái ${currentLetter.name}`}
                fill
                className="object-contain p-1"
                priority
                unoptimized
              />
            </div>
            <div className="grid grid-cols-4 gap-1 text-center text-[10px] sm:text-xs">
              <div className="p-1 rounded-lg bg-red-50 text-red-700 font-bold border border-red-100">
                <span>In hoa</span>
                <span className="block font-black text-sm">{currentLetter.forms.upper_print}</span>
              </div>
              <div className="p-1 rounded-lg bg-amber-50 text-amber-700 font-bold border border-amber-100">
                <span>Viết hoa</span>
                <span className="block font-black text-sm font-cursive-vn">
                  {currentLetter.forms.upper_cursive}
                </span>
              </div>
              <div className="p-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                <span>In thường</span>
                <span className="block font-black text-sm">{currentLetter.forms.lower_print}</span>
              </div>
              <div className="p-1 rounded-lg bg-violet-100 text-violet-900 font-black border-2 border-violet-400 shadow-xs ring-1 ring-violet-300">
                <span className="text-[9px] uppercase tracking-tighter text-violet-700">TẬP VIẾT</span>
                <span className="block font-black text-base font-cursive-vn text-violet-700">
                  {lowerChar}
                </span>
              </div>
            </div>
          </div>

          {/* 2. ẢNH HƯỚNG DẪN VIẾT CHỮ THƯỜNG TRÊN Ô LY TRÍCH XUẤT TỪ THẺ GỐC */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-600"></span>
                Khung Ô Ly Nét Viết Chữ Thường:
              </h4>
              <span className="text-[11px] font-bold text-violet-600">
                Nét đứt & Số thứ tự
              </span>
            </div>
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs">
              <Image
                src={`/data/module_letters/writing_guides/writing_chu_${currentLetter.slug}.png`}
                alt={`Khung hướng dẫn viết chữ thường ${lowerChar}`}
                fill
                className="object-contain p-2"
                priority
                unoptimized
              />
            </div>
          </div>

          {/* 3. CÁC BƯỚC VIẾT CHI TIẾT */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase">Quy trình viết từng nét:</h4>
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

          {/* Mẹo phụ huynh */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            💡 <strong>Lời khuyên:</strong> {currentLetter.parent_tip}
          </div>
        </div>

        {/* CỘT PHẢI (7 cols): DUAL-CANVAS ENGINE ĐỂ BÉ TẬP VIẾT CHỮ THƯỜNG */}
        <div className="lg:col-span-7 flex flex-col items-center bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-md">
          {/* Thanh công cụ vẽ */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2.5 mb-3">
            {/* Bảng chọn màu mực */}
            <div className="flex items-center gap-1.5">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    sound.playTone(523.25, 0.05);
                    setStrokeColor(c.value);
                  }}
                  className={`min-h-[38px] min-w-[38px] rounded-xl border-2 transition-all active:scale-95 ${
                    strokeColor === c.value
                      ? "border-slate-800 scale-110 shadow-sm"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}

              <span className="text-xs font-bold text-slate-400 ml-2 hidden sm:inline">Cỡ nét:</span>
              {[5, 8, 12].map((w) => (
                <button
                  key={w}
                  onClick={() => setLineWidth(w)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold hidden sm:inline ${
                    lineWidth === w
                      ? "bg-violet-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {w === 5 ? "Mảnh" : w === 8 ? "Vừa" : "Đậm"}
                </button>
              ))}
            </div>

            {/* Điều khiển nét & Toggle mẫu mờ */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (ghostMode === "card") setGhostMode("cursive");
                  else if (ghostMode === "cursive") setGhostMode("none");
                  else setGhostMode("card");
                }}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border bg-violet-50 text-violet-700 border-violet-200 active:scale-95"
                title="Đổi chế độ mẫu đè mờ (Mẫu nét đứt ô ly / Chữ thảo mờ / Tự viết)"
              >
                {ghostMode !== "none" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>
                  {ghostMode === "card" && "Mẫu nét đứt"}
                  {ghostMode === "cursive" && "Chữ thảo mờ"}
                  {ghostMode === "none" && "Tự viết"}
                </span>
              </button>

              <button
                onClick={handleUndo}
                disabled={!hasDrawn}
                className={`min-h-[38px] px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 active:scale-95 transition-all ${
                  hasDrawn
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-xs"
                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                }`}
                title="Hoàn tác nét vừa vẽ"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lùi lại</span>
              </button>

              <button
                onClick={handleClear}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all border border-rose-200"
                title="Xóa trắng bảng vẽ"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Viết lại</span>
              </button>
            </div>
          </div>

          {/* VÙNG DUAL-CANVAS CHÍNH (4/3 aspect, touchAction: none) */}
          <div
            ref={containerRef}
            className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-indigo-200 shadow-inner bg-white select-none"
            style={{
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            {/* Lớp 1: Lưới ô ly tiểu học tĩnh (Background Canvas) */}
            <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            {/* Lớp 2: Mẫu nét đứt mờ đè trên lưới (Ghost Overlay từ bộ thẻ chuẩn) */}
            {ghostMode === "card" && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4 sm:p-8 select-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/data/module_letters/writing_guides/writing_chu_${currentLetter.slug}.png`}
                  alt={`Mẫu chữ thường ${lowerChar}`}
                  className="w-full h-full object-contain mix-blend-multiply opacity-45 select-none"
                />
              </div>
            )}

            {ghostMode === "cursive" && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none opacity-30">
                <span className="font-cursive-vn text-[180px] sm:text-[230px] md:text-[270px] text-violet-900 leading-none select-none">
                  {lowerChar}
                </span>
              </div>
            )}

            {/* Lớp 3: Canvas tương tác hứng nét vẽ của bé */}
            <canvas
              ref={drawCanvasRef}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
              onMouseMove={(e) => draw(e.clientX, e.clientY)}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>

          {/* Footer nút nộp bài */}
          <div className="w-full flex items-center justify-between gap-3 mt-4">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-violet-600" />
              Tô theo mẫu nét đứt chữ thường trên dòng kẻ ô ly nhé!
            </span>

            <button
              onClick={handleComplete}
              className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm flex items-center gap-2 shadow-md transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Khen Bé Hoàn Thành</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
