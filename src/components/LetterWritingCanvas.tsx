"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { LetterCardData } from "@/types/letter";
import {
  RotateCcw,
  Sparkles,
  Undo2,
  CheckCircle,
  Palette,
  Volume2,
  Play,
  Pause,
  Video,
  Eye,
  EyeOff,
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
  const [showGuideUnderlay, setShowGuideUnderlay] = useState<boolean>(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Undo history
  const strokeHistoryRef = useRef<ImageData[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

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

      const gridSize = 32; // Kích thước ô ly vuông
      const numCols = Math.floor(width / gridSize);
      const numRows = Math.floor(height / gridSize);

      // Đường kẻ ô ly
      for (let c = 0; c <= numCols; c++) {
        const x = c * gridSize;
        ctx.beginPath();
        ctx.lineWidth = c % 4 === 0 ? 1.5 : 0.8;
        ctx.strokeStyle =
          c % 4 === 0 ? "rgba(99, 102, 241, 0.45)" : "rgba(226, 232, 240, 0.85)";
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let r = 0; r <= numRows; r++) {
        const y = r * gridSize;
        ctx.beginPath();
        ctx.lineWidth = r % 4 === 0 ? 1.8 : 0.8;
        ctx.strokeStyle =
          r % 4 === 0 ? "rgba(99, 102, 241, 0.55)" : "rgba(226, 232, 240, 0.85)";
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vẽ chữ mẫu nét đứt mờ ở chính giữa để bé tô theo
      if (showGuideUnderlay) {
        ctx.save();
        const sampleFontSize = Math.min(width * 0.38, height * 0.48);
        ctx.font = `bold ${sampleFontSize}px "Times New Roman", serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.strokeText(currentLetter.letter.toLowerCase(), width / 2, height / 2);
        ctx.restore();
      }
    },
    [showGuideUnderlay, currentLetter]
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
      if (strokeHistoryRef.current.length > 20) {
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

  // Đăng ký Native Touch Listener với { passive: false } để triệt tiêu độ trễ iOS Safari
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

    sound.playTone(392, 0.08);
    if (strokeHistoryRef.current.length > 0) {
      const prevState = strokeHistoryRef.current.pop()!;
      ctx.putImageData(prevState, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  // Xóa bảng
  const handleClear = () => {
    sound.playTone(330, 0.1);
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    strokeHistoryRef.current = [];
    setHasDrawn(false);
  };

  // Nộp bài & chúc mừng
  const handleComplete = () => {
    sound.playTone(523.25, 0.15);
    setTimeout(() => sound.playTone(659.25, 0.15), 120);
    setTimeout(() => sound.playTone(783.99, 0.25), 240);
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#2563eb", "#7c3aed", "#ec4899", "#10b981", "#f59e0b"],
    });
  };

  // Phát audio cô giảng
  const toggleTeacherAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      sound.playTone(523.25, 0.08);
      audioRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch(() => setIsPlayingAudio(false));
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
            Luyện Viết Chữ Chuẩn Tiểu Học
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">
            Tập Viết Chữ <span className="text-violet-600 uppercase">{currentLetter.name}</span>
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
        {/* CỘT TRÁI (4 cols): KHUNG HƯỚNG DẪN VIẾT CHUẨN TỪ BỘ THẺ */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b pb-2.5">
            <h3 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600"></span>
              Khung Ô Ly Quy Chuẩn
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
              {currentLetter.stroke_count} nét
            </span>
          </div>

          {/* Ảnh hướng dẫn viết trích xuất từ thẻ gốc */}
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
            <Image
              src={currentLetter.assets.writing_guide}
              alt={`Khung hướng dẫn viết chữ ${currentLetter.letter}`}
              fill
              className="object-contain p-2"
              priority
            />
          </div>

          {/* Các bước viết chi tiết */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase">Quy trình viết từng nét:</h4>
            {currentLetter.writing_steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
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

        {/* CỘT PHẢI (7 cols): DUAL-CANVAS ENGINE ĐỂ BÉ TẬP VIẾT */}
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
                    strokeColor === c.value ? "border-slate-800 scale-110 shadow-sm" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>

            {/* Điều khiển nét & Toggle mờ */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowGuideUnderlay(!showGuideUnderlay)}
                className={`min-h-[38px] px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
                  showGuideUnderlay
                    ? "bg-violet-100 text-violet-700 border-violet-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
                title="Bật/Tắt chữ nét đứt mờ"
              >
                {showGuideUnderlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Mẫu mờ</span>
              </button>

              <button
                onClick={handleUndo}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all shadow-xs"
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
            {/* Canvas 1: Nền ô ly tĩnh */}
            <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            {/* Canvas 2: Lớp vẽ cảm ứng trực tiếp */}
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
            <span className="text-xs text-slate-500 font-medium">
              Tô đều tay theo đường kẻ ô ly nhé!
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
