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
  Volume2,
  BookOpen,
  Info,
} from "lucide-react";
import confetti from "canvas-confetti";
import { sound } from "@/utils/speech";

export type LetterFormType = "upper_print" | "upper_cursive" | "lower_print" | "lower_cursive";

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

// Cấu hình số hàng & cột ô ly chuẩn tiểu học tương ứng từng dạng chữ cái
export function getLetterGridConfig(slug: string, form: LetterFormType): {
  cols: number;
  rows: number;
  baselineRow: number;
  heightLy: string;
} {
  if (form === "upper_print" || form === "lower_print") {
    return { cols: 4, rows: 4, baselineRow: 4, heightLy: form === "upper_print" ? "2.5 ô ly" : "2 ô ly" };
  }
  if (form === "upper_cursive") {
    return { cols: 4, rows: 5, baselineRow: 5, heightLy: "2.5 ô ly" };
  }
  // lower_cursive
  if (slug === "m" || slug === "n") {
    return { cols: 6, rows: 4, baselineRow: 4, heightLy: "2 ô ly (rộng 5 ô ly)" };
  }
  if (slug === "h" || slug === "k" || slug === "l") {
    return { cols: 4, rows: 6, baselineRow: 6, heightLy: "5 ô ly (khuyết trên)" };
  }
  if (slug === "b" || slug === "d" || slug === "dd" || slug === "p" || slug === "q") {
    return { cols: 4, rows: 5, baselineRow: 5, heightLy: slug === "p" || slug === "q" ? "4 ô ly" : "4 - 5 ô ly" };
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
  const [ghostMode, setGhostMode] = useState<"card" | "cursive" | "none">("card");
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [activeForm, setActiveForm] = useState<LetterFormType>("lower_cursive");

  // Undo history & touch tracking
  const strokeHistoryRef = useRef<ImageData[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const lowerChar = currentLetter.forms?.lower_cursive || currentLetter.letter.toLowerCase();
  const writingGuideImg = `/data/module_letters/writing_guides/writing_chu_${currentLetter.slug}.png`;
  const gridConfig = getLetterGridConfig(currentLetter.slug, activeForm);

  // Tỉ lệ aspect ratio chuẩn cho từng dạng
  const currentAspect =
    activeForm === "lower_cursive"
      ? LETTER_WRITING_ASPECTS[currentLetter.slug] || 1.12
      : activeForm === "upper_cursive"
      ? 0.92
      : 1.0;

  // Reset khi đổi chữ
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
    setIsPlayingAudio(false);
    setActiveForm("lower_cursive");
    setGhostMode("card");
    handleClear();
  }, [currentLetter]);

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

  // Handler khi click chọn 1 trong 4 dạng chữ cái
  const handleSelectForm = (form: LetterFormType) => {
    setActiveForm(form);
    sound.playTone(523.25, 0.08);

    let formSpeech = "";
    if (form === "upper_print") {
      formSpeech = `Chữ ${currentLetter.letter} in hoa`;
    } else if (form === "upper_cursive") {
      formSpeech = `Chữ ${currentLetter.letter} viết hoa`;
    } else if (form === "lower_print") {
      formSpeech = `Chữ ${lowerChar} in thường`;
    } else {
      formSpeech = `Chữ ${lowerChar} viết thường`;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(formSpeech);
      utterance.lang = "vi-VN";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 1. Vẽ lưới ô ly tiểu học chuẩn Bộ GD&ĐT (chỉ vẽ khi không dùng ảnh thẻ gốc trực tiếp)
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

      // Nền trắng tinh khôi
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

    // Nếu đang ở dạng viết thường và chế độ "card":
    // Ta để ảnh gốc từ tài liệu BỘ THẺ.pdf làm background 100% full viền, KHÔNG vẽ đè lưới nhân tạo để tránh xung đột lưới kép
    if (activeForm === "lower_cursive" && ghostMode === "card") {
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
  }, [activeForm, ghostMode, gridConfig, drawPrimaryGrid]);

  useEffect(() => {
    resizeCanvases();
    window.addEventListener("resize", resizeCanvases);
    return () => window.removeEventListener("resize", resizeCanvases);
  }, [resizeCanvases]);

  useEffect(() => {
    resizeCanvases();
  }, [currentLetter, activeForm, ghostMode, resizeCanvases]);

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
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    sound.playSuccessSound();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const msg = new SpeechSynthesisUtterance(
        `Hoan hô bé! Bé viết chữ ${currentLetter.letter} rất đẹp và chuẩn ô ly!`
      );
      msg.lang = "vi-VN";
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }
  };

  // Bật/tắt nghe cô giảng
  const toggleTeacherAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const colors = [
    { name: "Tím Mực Học Sinh", value: "#7c3aed" },
    { name: "Xanh Dương Chuẩn", value: "#2563eb" },
    { name: "Đỏ Sửa Bài", value: "#dc2626" },
    { name: "Xanh Lá Cây", value: "#16a34a" },
    { name: "Cam Rực Rỡ", value: "#ea580c" },
  ];

  // Tiêu đề và nhãn theo dạng chữ đang chọn
  const formConfig: Record<
    LetterFormType,
    { badge: string; title: string; activeChar: string; isCursive: boolean; desc: string }
  > = {
    lower_cursive: {
      badge: "Luyện Viết Chữ Thường Chuẩn Ô Ly Lớp 1",
      title: "Tập Viết Chữ Thường",
      activeChar: lowerChar,
      isCursive: true,
      desc: `Mẫu chữ thường "${lowerChar}" nét thảo ô ly chuẩn Bộ GD&ĐT`,
    },
    upper_cursive: {
      badge: "Luyện Viết Chữ Viết Hoa (Kiểu 1)",
      title: "Tập Viết Chữ Viết Hoa",
      activeChar: currentLetter.forms.upper_cursive,
      isCursive: true,
      desc: `Mẫu chữ viết hoa "${currentLetter.forms.upper_cursive}" cao 2.5 ô ly`,
    },
    upper_print: {
      badge: "Nhận Diện & Tập Tô Chữ In Hoa",
      title: "Tập Viết Chữ In Hoa",
      activeChar: currentLetter.forms.upper_print,
      isCursive: false,
      desc: `Mẫu chữ in hoa "${currentLetter.forms.upper_print}" nét đứng thẳng dứt khoát`,
    },
    lower_print: {
      badge: "Nhận Diện & Tập Tô Chữ In Thường",
      title: "Tập Viết Chữ In Thường",
      activeChar: currentLetter.forms.lower_print,
      isCursive: false,
      desc: `Mẫu chữ in thường "${currentLetter.forms.lower_print}" sách giáo khoa`,
    },
  };

  const currentFormInfo = formConfig[activeForm];

  return (
    <div className="w-full flex flex-col items-center py-3 sm:py-6 px-3 sm:px-6">
      <audio
        ref={audioRef}
        src={currentLetter.audio_url}
        onEnded={() => setIsPlayingAudio(false)}
        onError={() => setIsPlayingAudio(false)}
      />

      {/* Header trang tập viết */}
      <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            {currentFormInfo.badge}
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2 flex-wrap">
            <span>{currentFormInfo.title}</span>
            <span
              className={`text-3xl sm:text-4xl px-2.5 py-0.5 rounded-xl border ${
                currentFormInfo.isCursive ? "font-cursive-vn" : "font-sans font-black"
              } ${
                activeForm === "lower_cursive"
                  ? "text-violet-600 bg-violet-50 border-violet-200"
                  : activeForm === "upper_cursive"
                  ? "text-amber-600 bg-amber-50 border-amber-200"
                  : activeForm === "upper_print"
                  ? "text-red-600 bg-red-50 border-red-200"
                  : "text-emerald-600 bg-emerald-50 border-emerald-200"
              }`}
            >
              {currentFormInfo.activeChar}
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

      {/* Layout 2 cột chuẩn: Cột Trái = Sổ Tay Hướng Dẫn Sư Phạm, Cột Phải = Bảng Viết Ô Ly Tương Tác */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (5 cols): BỘ CHỌN 4 DẠNG CHỮ & THÔNG SỐ SƯ PHẠM */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div>
              <span className="text-[11px] font-black uppercase text-violet-600 block">
                Tiêu Chuẩn Chữ Viết Lớp 1
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
                <span>Dạng chữ:</span>
                <span
                  className={`text-lg ${
                    currentFormInfo.isCursive ? "font-cursive-vn" : "font-sans font-black"
                  } ${
                    activeForm === "lower_cursive"
                      ? "text-violet-600"
                      : activeForm === "upper_cursive"
                      ? "text-amber-600"
                      : activeForm === "upper_print"
                      ? "text-red-600"
                      : "text-emerald-600"
                  }`}
                >
                  {currentFormInfo.activeChar}
                </span>
              </h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
              {currentLetter.stroke_count} nét
            </span>
          </div>

          {/* 1. KHUNG 4 DẠNG CHỮ CÁI TIỂU HỌC TỪ THẺ GỐC (BẤM VÀO ĐỂ ĐỔI DẠNG CHỮ) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-violet-600" />
                4 Dạng Chữ &quot;{currentLetter.name}&quot;:
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                Chạm để chuyển đổi
              </span>
            </div>

            {/* Dải 4 chữ cái lớn trực quan từ thẻ gốc */}
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-around">
              <span className="text-2xl sm:text-3xl font-black text-red-600 font-sans" title="In hoa">
                {currentLetter.forms.upper_print}
              </span>
              <span className="text-2xl sm:text-3xl font-cursive-vn text-amber-600" title="Viết hoa">
                {currentLetter.forms.upper_cursive}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-sans" title="In thường">
                {currentLetter.forms.lower_print}
              </span>
              <span className="text-2xl sm:text-3xl font-cursive-vn text-violet-600" title="Tập viết thường">
                {lowerChar}
              </span>
            </div>

            {/* 4 Nút tương tác chọn dạng chữ */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {/* 1. In hoa */}
              <button
                type="button"
                onClick={() => handleSelectForm("upper_print")}
                className={`min-h-[50px] p-1.5 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer border ${
                  activeForm === "upper_print"
                    ? "bg-red-600 text-white border-red-700 shadow-md ring-2 ring-red-400 scale-[1.03]"
                    : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                }`}
                title="Bấm để tập viết chữ in hoa"
              >
                <span className="text-[10px] opacity-80">In hoa</span>
                <span className="font-black text-base leading-tight mt-0.5">
                  {currentLetter.forms.upper_print}
                </span>
                {activeForm === "upper_print" && (
                  <span className="text-[8px] bg-white/25 px-1 rounded-sm mt-0.5 uppercase font-bold">
                    Đang chọn
                  </span>
                )}
              </button>

              {/* 2. Viết hoa */}
              <button
                type="button"
                onClick={() => handleSelectForm("upper_cursive")}
                className={`min-h-[50px] p-1.5 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer border ${
                  activeForm === "upper_cursive"
                    ? "bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400 scale-[1.03]"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                }`}
                title="Bấm để tập viết chữ viết hoa"
              >
                <span className="text-[10px] opacity-80">Viết hoa</span>
                <span className="font-black text-lg font-cursive-vn leading-tight">
                  {currentLetter.forms.upper_cursive}
                </span>
                {activeForm === "upper_cursive" && (
                  <span className="text-[8px] bg-white/25 px-1 rounded-sm mt-0.5 uppercase font-bold">
                    Đang chọn
                  </span>
                )}
              </button>

              {/* 3. In thường */}
              <button
                type="button"
                onClick={() => handleSelectForm("lower_print")}
                className={`min-h-[50px] p-1.5 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer border ${
                  activeForm === "lower_print"
                    ? "bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400 scale-[1.03]"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                }`}
                title="Bấm để tập viết chữ in thường"
              >
                <span className="text-[10px] opacity-80">In thường</span>
                <span className="font-black text-base leading-tight mt-0.5">
                  {currentLetter.forms.lower_print}
                </span>
                {activeForm === "lower_print" && (
                  <span className="text-[8px] bg-white/25 px-1 rounded-sm mt-0.5 uppercase font-bold">
                    Đang chọn
                  </span>
                )}
              </button>

              {/* 4. Viết thường (Tập viết lớp 1) */}
              <button
                type="button"
                onClick={() => handleSelectForm("lower_cursive")}
                className={`min-h-[50px] p-1.5 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer border ${
                  activeForm === "lower_cursive"
                    ? "bg-violet-600 text-white border-violet-700 shadow-md ring-2 ring-violet-400 scale-[1.03]"
                    : "bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200"
                }`}
                title="Bấm để tập viết chữ thường chuẩn lớp 1"
              >
                <span className="text-[9px] uppercase tracking-tighter opacity-90 font-bold">
                  TẬP VIẾT
                </span>
                <span className="font-black text-lg font-cursive-vn leading-tight">
                  {lowerChar}
                </span>
                {activeForm === "lower_cursive" && (
                  <span className="text-[8px] bg-white/25 px-1 rounded-sm mt-0.5 uppercase font-bold">
                    Đang chọn
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* 2. THẺ THÔNG SỐ KỸ THUẬT Ô LY CHUẨN LỚP 1 */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
            <h4 className="text-xs font-black text-indigo-900 uppercase flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Quy Chuẩn Kỹ Thuật Ô Ly Lớp 1:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded-xl border border-indigo-100">
                <span className="text-slate-400 text-[10px] block font-bold">Chiều cao chữ:</span>
                <span className="font-black text-indigo-700 text-sm">{gridConfig.heightLy}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-indigo-100">
                <span className="text-slate-400 text-[10px] block font-bold">Số nét cấu thành:</span>
                <span className="font-black text-indigo-700 text-sm">{currentLetter.stroke_count} nét cơ bản</span>
              </div>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-indigo-100 text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-indigo-600">📌 Hướng dẫn tô nét:</span> Chạm vào điểm chấm đỏ số 1, di chuyển bút đều tay theo chiều mũi tên đỏ đến điểm dừng nét.
            </div>
          </div>

          {/* 3. CÁC BƯỚC VIẾT CHI TIẾT THEO CHUẨN GIÁO KHOA */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Quy trình viết từng nét:
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

          {/* Mẹo phụ huynh */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            💡 <strong>Lời khuyên:</strong> {currentLetter.parent_tip}
          </div>
        </div>

        {/* CỘT PHẢI (7 cols): BẢNG VIẾT Ô LY CHUẨN TÀI LIỆU (KHÔNG LỆCH LƯỚI) */}
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
                title="Đổi chế độ mẫu đè mờ (Mẫu tài liệu / Chữ mờ / Tự viết)"
              >
                {ghostMode !== "none" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>
                  {ghostMode === "card" && "Mẫu tài liệu"}
                  {ghostMode === "cursive" && "Chữ mẫu mờ"}
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

          {/* VÙNG BẢNG VIẾT Ô LY: TỰ THÍCH ỨNG THEO TỈ LỆ THỰC CỦA CHỮ CÁI (KHÔNG BỊ LỆCH LƯỚI) */}
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
              {/* Lớp 1: Lưới ô ly tiểu học tĩnh (Background Canvas) */}
              <canvas
                ref={bgCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Lớp 2: Khi ở dạng Chữ Thường và chế độ "card": Hiển thị 100% full viền mẫu chuẩn gốc từ BỘ THẺ.pdf (KHÔNG BỊ ĐÈ 2 LƯỚI) */}
              {activeForm === "lower_cursive" && ghostMode === "card" && (
                <div className="absolute inset-0 pointer-events-none select-none">
                  <Image
                    src={writingGuideImg}
                    alt={`Mẫu chữ thường ${lowerChar}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 460px"
                    className="object-cover select-none pointer-events-none"
                    priority
                    unoptimized
                  />
                </div>
              )}

              {/* Lớp 2b: Chế độ Chữ Mẫu Mờ hoặc Chữ In Hoa / Viết Hoa */}
              {ghostMode === "cursive" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none">
                  <span
                    className={`leading-none select-none opacity-30 ${
                      activeForm === "upper_print"
                        ? "font-sans font-black text-[170px] sm:text-[220px] text-red-900"
                        : activeForm === "upper_cursive"
                        ? "font-cursive-vn text-[180px] sm:text-[230px] text-amber-900"
                        : activeForm === "lower_print"
                        ? "font-sans font-black text-[170px] sm:text-[220px] text-emerald-900"
                        : "font-cursive-vn text-[190px] sm:text-[240px] text-violet-900"
                    }`}
                  >
                    {currentFormInfo.activeChar}
                  </span>
                </div>
              )}

              {/* Lớp 2c: Mẫu mờ khi chọn In Hoa / Viết Hoa / In Thường ở chế độ card */}
              {activeForm !== "lower_cursive" && ghostMode === "card" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none">
                  <span
                    className={`leading-none select-none opacity-35 ${
                      activeForm === "upper_print"
                        ? "font-sans font-black text-[170px] sm:text-[220px] text-red-900"
                        : activeForm === "upper_cursive"
                        ? "font-cursive-vn text-[180px] sm:text-[230px] text-amber-900"
                        : "font-sans font-black text-[170px] sm:text-[220px] text-emerald-900"
                    }`}
                  >
                    {currentFormInfo.activeChar}
                  </span>
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

          {/* Footer nút nộp bài & Lời nhắc sư phạm */}
          <div className="w-full flex items-center justify-between gap-3 mt-4">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-violet-600" />
              Bé chấm vào điểm đỏ số 1 và lia bút theo mũi tên nhé!
            </span>

            <button
              onClick={handleComplete}
              className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
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
