"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { LetterCardData } from "@/types/letter";
import { RotateCcw, Sparkles, Undo2, CheckCircle, Palette, Volume2 } from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/utils/speech";

interface LetterWritingCanvasProps {
  currentLetter: LetterCardData;
}

export function LetterWritingCanvas({ currentLetter }: LetterWritingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);

  const [strokeColor, setStrokeColor] = useState<string>("#2563eb"); // Xanh mực học trò
  const [lineWidth, setLineWidth] = useState<number>(8);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(true);

  // Lưu lịch sử các nét vẽ để Undo
  const strokeHistoryRef = useRef<ImageData[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // 1. Vẽ nền lưới ô ly 4 dòng kẻ chuẩn tiểu học Việt Nam
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Nền trắng tinh
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const gridSize = 32; // Kích thước ô ly vuông
    const numCols = Math.floor(width / gridSize);
    const numRows = Math.floor(height / gridSize);

    // Vẽ đường kẻ ô ly mờ
    ctx.lineWidth = 1;
    for (let c = 0; c <= numCols; c++) {
      const x = c * gridSize;
      ctx.beginPath();
      ctx.strokeStyle = c % 4 === 0 ? "rgba(99, 102, 241, 0.35)" : "rgba(226, 232, 240, 0.8)";
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let r = 0; r <= numRows; r++) {
      const y = r * gridSize;
      ctx.beginPath();
      // Đường kẻ đậm số 1 (baseline đặt bút)
      ctx.strokeStyle = r % 4 === 0 ? "rgba(99, 102, 241, 0.45)" : "rgba(226, 232, 240, 0.8)";
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vẽ chữ mẫu nét đứt mờ ở chính giữa để bé đồ theo
    if (showGuide) {
      ctx.save();
      // Chữ mẫu nét đứt cân đối vừa vặn 2 ô ly ở giữa
      const sampleFontSize = Math.min(width * 0.35, height * 0.45);
      ctx.font = `bold ${sampleFontSize}px "Times New Roman", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 6]);
      ctx.strokeText(currentLetter.lower, width / 2, height / 2);
      ctx.restore();
    }
  }, [showGuide, currentLetter]);

  // Cập nhật kích thước canvas theo container thực tế
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

  // 2. Gắn Native Touch & Mouse Listeners ({ passive: false })
  useEffect(() => {
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;

    const getCoordinates = (e: MouseEvent | TouchEvent) => {
      const rect = drawCanvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const scaleX = drawCanvas.width / rect.width;
      const scaleY = drawCanvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const ctx = drawCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      // Lưu frame hiện tại vào history trước nét vẽ mới
      if (strokeHistoryRef.current.length > 20) strokeHistoryRef.current.shift();
      strokeHistoryRef.current.push(ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height));

      isDrawingRef.current = true;
      setHasDrawn(true);
      const pos = getCoordinates(e);
      lastPointRef.current = pos;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current || !lastPointRef.current) return;
      if (e.cancelable) e.preventDefault();

      const ctx = drawCanvas.getContext("2d");
      if (!ctx) return;

      const currentPoint = getCoordinates(e);

      // Nắn mượt nét vẽ bằng Quadratic Bézier Curve
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      const midPoint = {
        x: (lastPointRef.current.x + currentPoint.x) / 2,
        y: (lastPointRef.current.y + currentPoint.y) / 2,
      };
      ctx.quadraticCurveTo(lastPointRef.current.x, lastPointRef.current.y, midPoint.x, midPoint.y);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      lastPointRef.current = currentPoint;
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      isDrawingRef.current = false;
      lastPointRef.current = null;
    };

    // Bắt sự kiện Touch với { passive: false }
    drawCanvas.addEventListener("touchstart", handleStart, { passive: false });
    drawCanvas.addEventListener("touchmove", handleMove, { passive: false });
    drawCanvas.addEventListener("touchend", handleEnd, { passive: false });

    // Bắt sự kiện Chuột
    drawCanvas.addEventListener("mousedown", handleStart);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);

    return () => {
      drawCanvas.removeEventListener("touchstart", handleStart);
      drawCanvas.removeEventListener("touchmove", handleMove);
      drawCanvas.removeEventListener("touchend", handleEnd);
      drawCanvas.removeEventListener("mousedown", handleStart);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
    };
  }, [strokeColor, lineWidth]);

  const handleClear = () => {
    sound.playTone(392, 0.1);
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    strokeHistoryRef.current = [];
    setHasDrawn(false);
  };

  const handleUndo = () => {
    sound.playTone(440, 0.08);
    const drawCanvas = drawCanvasRef.current;
    if (!drawCanvas) return;
    const ctx = drawCanvas.getContext("2d");
    if (!ctx) return;

    if (strokeHistoryRef.current.length > 0) {
      const prev = strokeHistoryRef.current.pop()!;
      ctx.putImageData(prev, 0, 0);
      if (strokeHistoryRef.current.length === 0) setHasDrawn(false);
    }
  };

  const handleFinish = () => {
    sound.playTone(659.25, 0.15);
    setTimeout(() => sound.playTone(880, 0.25), 100);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#2563eb", "#7c3aed", "#10b981", "#f59e0b", "#ef4444"],
    });
  };

  return (
    <div className="w-full flex flex-col items-center py-4 px-2 sm:px-4">
      {/* Thanh tiêu đề & hướng dẫn nét */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 mb-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-black text-2xl shadow-xs">
            {currentLetter.lower}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-800">
              Bé Luyện Viết Chữ "{currentLetter.lower}"
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold">
              Độ cao: <span className="text-violet-600 font-bold">{currentLetter.writingGuide.height}</span> • Lưới 4 dòng kẻ ô ly
            </p>
          </div>
        </div>

        {/* Nút bật/tắt chữ mẫu & nghe đọc */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all active:scale-95 ${
              showGuide
                ? "bg-violet-50 border-violet-300 text-violet-700"
                : "bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            {showGuide ? "✓ Đang hiện chữ mẫu" : "Hiện chữ mẫu đồ"}
          </button>
        </div>
      </div>

      {/* Vùng Bảng Vẽ Dual-Canvas */}
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl aspect-[4/3] sm:aspect-[16/10] max-h-[550px] rounded-3xl overflow-hidden border-4 border-violet-200 shadow-xl bg-white touch-none select-none"
      >
        {/* Canvas nền tĩnh (Lưới ô ly + Chữ mẫu) */}
        <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Canvas tương tác nét vẽ của bé */}
        <canvas
          ref={drawCanvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair active:cursor-crosshair"
        />

        {!hasDrawn && (
          <div className="absolute top-4 left-4 pointer-events-none bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-500 font-semibold flex items-center gap-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Dùng ngón tay hoặc bút cảm ứng đồ theo nét mờ
          </div>
        )}
      </div>

      {/* Thanh công cụ vẽ (Bút chì, Màu mực, Kích thước, Undo, Xóa) */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-3 mt-4 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        {/* Bảng chọn màu mực */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold hidden sm:inline">Mực viết:</span>
          {[
            { color: "#2563eb", name: "Xanh mực" },
            { color: "#7c3aed", name: "Tím hoa cà" },
            { color: "#dc2626", name: "Đỏ tươi" },
            { color: "#059669", name: "Xanh lá" },
            { color: "#1e293b", name: "Bút chì đen" },
          ].map((c) => (
            <button
              key={c.color}
              onClick={() => {
                sound.playTone(500, 0.05);
                setStrokeColor(c.color);
              }}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-transform active:scale-95 shadow-xs flex items-center justify-center ${
                strokeColor === c.color ? "ring-4 ring-offset-2 ring-violet-500 scale-110" : "hover:scale-105"
              }`}
              style={{ backgroundColor: c.color }}
              title={c.name}
            />
          ))}
        </div>

        {/* Bảng chọn cỡ nét */}
        <div className="flex items-center gap-2">
          {[
            { size: 5, label: "Mảnh" },
            { size: 8, label: "Vừa" },
            { size: 14, label: "Đậm" },
          ].map((s) => (
            <button
              key={s.size}
              onClick={() => {
                sound.playTone(600, 0.05);
                setLineWidth(s.size);
              }}
              className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all active:scale-95 ${
                lineWidth === s.size
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Nét {s.label}
            </button>
          ))}
        </div>

        {/* Nút Thao Tác (Undo, Xóa, Hoàn thành) */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={handleUndo}
            disabled={!hasDrawn}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 disabled:opacity-40 text-slate-700 font-bold flex items-center gap-1.5 transition-all"
            title="Quay lại nét trước"
          >
            <Undo2 className="w-4 h-4" />
            <span className="text-xs sm:text-sm hidden sm:inline">Hoàn tác</span>
          </button>

          <button
            onClick={handleClear}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-bold flex items-center gap-1.5 border border-rose-200 transition-all"
            title="Xóa bảng làm lại"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-xs sm:text-sm hidden sm:inline">Viết lại</span>
          </button>

          <button
            onClick={handleFinish}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            Bé viết xong!
          </button>
        </div>
      </div>
    </div>
  );
}
