"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { NumberCardData } from "@/types/number";
import { PenTool, RotateCcw, AlertCircle, Eye, EyeOff, CheckCircle2, Volume2, Undo2, Sparkles } from "lucide-react";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";

interface WritingCanvasProps {
  card: NumberCardData;
}

export const WritingCanvas: React.FC<WritingCanvasProps> = ({ card }) => {
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [penColor, setPenColor] = useState<string>("#7c3aed"); // Tím học sinh tiểu học
  const [ghostMode, setGhostMode] = useState<"card" | "font" | "none">("card");
  const [lineWidth, setLineWidth] = useState<number>(8);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);

  // Refs phục vụ vẽ cảm ứng mượt mà (ZERO lag, ZERO React re-render lúc vẽ)
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const penColorRef = useRef<string>(penColor);
  const lineWidthRef = useRef<number>(lineWidth);
  const historyRef = useRef<ImageData[]>([]);

  useEffect(() => {
    penColorRef.current = penColor;
  }, [penColor]);

  useEffect(() => {
    lineWidthRef.current = lineWidth;
  }, [lineWidth]);

  const writingGuideImg = `/data/module_numbers/${card.assets.writing_guide.replace("assets/", "")}`;

  // Vẽ lưới ô ly tiểu học lên Grid Canvas (Chỉ vẽ 1 lần duy nhất)
  const drawGrid = useCallback(() => {
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Nền trắng
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Vẽ lưới ô ly tiểu học (4 đường kẻ ngang chính, các đường dọc)
    const gridSize = 40;
    ctx.lineWidth = 1;

    // Đường lưới dọc
    for (let x = 0; x <= width; x += gridSize) {
      ctx.strokeStyle = x % (gridSize * 4) === 0 ? "#94a3b8" : "#f1f5f9";
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Đường kẻ ngang
    for (let y = 0; y <= height; y += gridSize) {
      const isMajor = y % (gridSize * 4) === 0;
      ctx.strokeStyle = isMajor ? "#60a5fa" : "#e2e8f0";
      ctx.lineWidth = isMajor ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Dòng kẻ đậm chân chữ số (Baseline chuẩn vở ô ly tiểu học)
    const baselineY = height - gridSize * 2.5;
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(width, baselineY);
    ctx.stroke();
  }, []);

  // Xóa bảng vẽ mực của bé (giữ nguyên lưới ô ly bên dưới)
  const clearCanvas = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [];
    setHasDrawn(false);
  }, []);

  // Hoàn tác nét gần nhất
  const undoLastStroke = useCallback(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (historyRef.current.length > 0) {
      const previousState = historyRef.current.pop();
      if (previousState) {
        ctx.putImageData(previousState, 0, 0);
      }
      if (historyRef.current.length === 0) {
        setHasDrawn(false);
      }
    } else {
      clearCanvas();
    }
  }, [clearCanvas]);

  // Khởi tạo lưới và xóa bảng khi đổi số
  useEffect(() => {
    drawGrid();
    clearCanvas();
  }, [card.number, drawGrid, clearCanvas]);

  // Quản lý sự kiện cảm ứng NATIVE mượt mà (passive: false để chặn 100% cuộn màn hình khi vẽ)
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const getCoords = (clientX: number, clientY: number) => {
      let rect = rectRef.current;
      if (!rect) {
        rect = canvas.getBoundingClientRect();
        rectRef.current = rect;
      }
      if (!rect || rect.width === 0 || rect.height === 0) return null;
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    const handleStart = (clientX: number, clientY: number) => {
      rectRef.current = canvas.getBoundingClientRect();
      const pt = getCoords(clientX, clientY);
      if (!pt) return;

      isDrawingRef.current = true;
      lastPointRef.current = pt;

      // Chấm điểm tròn tức thì dưới đầu ngón tay
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, lineWidthRef.current / 2, 0, Math.PI * 2);
      ctx.fillStyle = penColorRef.current;
      ctx.fill();

      // Cấu hình nét vẽ
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = penColorRef.current;
      ctx.lineWidth = lineWidthRef.current;
    };

    const handleMove = (clientX: number, clientY: number) => {
      if (!isDrawingRef.current || !lastPointRef.current) return;
      const pt = getCoords(clientX, clientY);
      if (!pt) return;

      // Nắn đường cong mượt mà (Quadratic Bézier Curve Smoothing)
      const midX = (lastPointRef.current.x + pt.x) / 2;
      const midY = (lastPointRef.current.y + pt.y) / 2;

      ctx.quadraticCurveTo(lastPointRef.current.x, lastPointRef.current.y, midX, midY);
      ctx.stroke();

      lastPointRef.current = pt;
    };

    const handleEnd = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      lastPointRef.current = null;
      rectRef.current = null;

      // Lưu lại snapshot vào lịch sử sau khi nhấc ngón tay (không chặn luồng vẽ)
      try {
        const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (historyRef.current.length >= 20) {
          historyRef.current.shift();
        }
        historyRef.current.push(snap);
        setHasDrawn(true);
      } catch {}
    };

    // --- SỰ KIỆN CẢM ỨNG ĐIỆN THOẠI & IPAD (TOUCH EVENTS) ---
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // CHẶN 100% CỬ CHỈ CUỘN / PHÓNG TO CỦA SAFARI & CHROME
      if (e.touches.length > 0) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // CHẶN GIẬT CUỘN TRANG
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleEnd();
    };

    const onTouchCancel = (e: TouchEvent) => {
      e.preventDefault();
      handleEnd();
    };

    // --- SỰ KIỆN CHUỘT MÁY TÍNH (MOUSE EVENTS) ---
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      handleStart(e.clientX, e.clientY);
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
      handleEnd();
    };

    // Đăng ký native listeners với passive: false
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", onTouchCancel, { passive: false });

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchCancel);

      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div className="flex flex-col max-w-5xl mx-auto py-6">
      {/* Tiêu đề */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-100 text-purple-800 font-bold text-xs uppercase tracking-wider mb-2">
            <PenTool className="w-4 h-4 text-purple-600" />
            Luyện Viết Đúng Quy Chuẩn Tiểu Học
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
            Hướng Dẫn & Tập Viết Chữ Số {card.number}
          </h2>
        </div>

        <button
          onClick={() => sound.playTeacherAudio(card.assets.audio_url)}
          className="px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-300 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-xs"
        >
          <Volume2 className="w-4 h-4 text-purple-700" />
          <span>Nghe Cô Giáo Đọc & Hướng Dẫn Nét</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* CỘT THAM KHẢO (Mobile: Nằm dưới để nhường chỗ cho bảng vẽ; Desktop: Nằm bên trái) */}
        <div className="lg:col-span-5 flex flex-col gap-5 order-2 lg:order-1">
          {/* Ảnh Mẫu Nét Đứt Gốc */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Mẫu nét đứt & mũi tên chỉ hướng
            </h3>
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-dashed border-purple-200 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center">
              <Image
                src={writingGuideImg}
                alt={`Mẫu viết số ${card.number}`}
                fill
                className="object-contain p-2"
              />
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full mt-3">
              Chữ số {card.number} gồm {card.writing_guide.stroke_count} nét (cao 2 ô ly)
            </span>
          </div>

          {/* Quy trình đi nét */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h4 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Các bước đi nét theo chuẩn:
            </h4>
            <div className="flex flex-col gap-2.5">
              {card.writing_guide.steps.map((step, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-xs sm:text-sm text-slate-700">
                  <span className="font-bold text-purple-800 mr-1.5">{idx + 1}.</span>
                  {step}
                </div>
              ))}
            </div>
          </div>

          {/* Cảnh báo lỗi thường gặp */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Lỗi trẻ hay mắc phải:</span> {card.writing_guide.common_mistakes}
            </div>
          </div>
        </div>

        {/* BẢNG VẼ CANVAS (Mobile: Ưu tiên hiển thị ngay trên đầu; Desktop: Nằm bên phải) */}
        <div className="lg:col-span-7 flex flex-col gap-4 order-1 lg:order-2">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col">
            {/* Thanh công cụ bảng vẽ */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Mực:</span>
                {[
                  { color: "#7c3aed", name: "Tím" },
                  { color: "#2563eb", name: "Xanh" },
                  { color: "#dc2626", name: "Đỏ" },
                ].map((c) => (
                  <button
                    key={c.color}
                    onClick={() => setPenColor(c.color)}
                    style={{ backgroundColor: c.color }}
                    className={`w-7 h-7 rounded-full shadow-sm transition-transform active:scale-90 ${
                      penColor === c.color ? "ring-4 ring-offset-2 ring-purple-300 scale-110" : ""
                    }`}
                    title={`Mực ${c.name}`}
                  />
                ))}

                <span className="text-xs font-bold text-slate-400 ml-2 hidden sm:inline">Cỡ nét:</span>
                {[5, 8, 12].map((w) => (
                  <button
                    key={w}
                    onClick={() => setLineWidth(w)}
                    className={`px-2 py-0.5 rounded-md text-xs font-bold hidden sm:inline ${
                      lineWidth === w ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {w === 5 ? "Mảnh" : w === 8 ? "Vừa" : "Đậm"}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Nút Hoàn tác (Undo) */}
                <button
                  onClick={undoLastStroke}
                  disabled={!hasDrawn}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    hasDrawn
                      ? "bg-purple-100 hover:bg-purple-200 text-purple-800"
                      : "bg-slate-100 text-slate-300 cursor-not-allowed"
                  }`}
                  title="Lùi lại 1 nét trước"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Hoàn tác</span>
                </button>

                {/* Chế độ mẫu mờ */}
                <button
                  onClick={() => {
                    if (ghostMode === "card") setGhostMode("font");
                    else if (ghostMode === "font") setGhostMode("none");
                    else setGhostMode("card");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors bg-purple-50 text-purple-700 border-purple-200"
                  title="Đổi chế độ mẫu đè mờ (Mẫu nét đứt / Chữ in / Tắt)"
                >
                  {ghostMode !== "none" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>
                    {ghostMode === "card" && "Mẫu nét đứt"}
                    {ghostMode === "font" && "Chữ in mờ"}
                    {ghostMode === "none" && "Không mẫu"}
                  </span>
                </button>

                {/* Xóa bảng */}
                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>

                {/* Khen thưởng khi hoàn thành */}
                {hasDrawn && (
                  <button
                    onClick={() => {
                      confetti({
                        particleCount: 80,
                        spread: 70,
                        origin: { y: 0.6 },
                      });
                      sound.playSuccessSound();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-sm transition-all active:scale-95 animate-bounce"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Viết xong! 🎉</span>
                  </button>
                )}
              </div>
            </div>

            {/* Khung vẽ Canvas 2 lớp chống giật (Dual-Canvas Architecture) */}
            <div
              className="relative mt-4 w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-slate-300 shadow-inner bg-white select-none"
              style={{
                touchAction: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",
              }}
            >
              {/* Lớp 1: Lưới ô ly tiểu học tĩnh (Background Canvas) */}
              <canvas
                ref={gridCanvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Lớp 2: Mẫu nét đứt mờ đè trên lưới (Ghost Overlay) */}
              {ghostMode === "card" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 select-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={writingGuideImg}
                    alt=""
                    className="w-full h-full object-contain mix-blend-multiply opacity-35 select-none"
                  />
                </div>
              )}

              {ghostMode === "font" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none opacity-20">
                  <span className="font-serif font-black text-[180px] sm:text-[240px] md:text-[280px] text-slate-800 leading-none select-none">
                    {card.number}
                  </span>
                </div>
              )}

              {/* Lớp 3: Bảng vẽ cảm ứng trong suốt tương tác của bé (Top Layer) */}
              <canvas
                ref={drawCanvasRef}
                width={640}
                height={480}
                style={{
                  touchAction: "none",
                  WebkitUserSelect: "none",
                  userSelect: "none",
                  WebkitTouchCallout: "none",
                }}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none select-none"
              />
            </div>

            <p className="text-center text-xs text-slate-400 mt-3">
              💡 Bé có thể dùng đầu ngón tay trên điện thoại / iPad hoặc chuột máy tính để tập đồ nét theo mẫu trên lưới ô ly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
