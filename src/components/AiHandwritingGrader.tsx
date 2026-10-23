"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { HandwritingEvaluationResult, HandwritingBoundingBox } from "@/types/letter";
import {
  Sparkles,
  Upload,
  RotateCcw,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Target,
  Layers,
  HelpCircle,
  Loader2,
  FileText,
  VolumeX,
} from "lucide-react";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";

// Các bài mẫu scan thực tế từ kho sách đã chuẩn hóa
const PRESETS = [
  {
    id: "bai_1_xau",
    label: "Bài 1 (Chữ 'a', 'ca') - Có lỗi nét thực tế",
    file: "bai_1_hoc_sinh_xau.jpg",
    url: "/data/samples/bai_1_hoc_sinh_xau.jpg",
    teacherUrl: "/data/samples/crop_a_co_giao_mau.jpg",
    badge: "Phát hiện lỗi",
    color: "rose",
  },
  {
    id: "bai_1_dep",
    label: "Bài 1 (Chữ 'a') - Vở sạch chữ đẹp lớp 1",
    file: "bai_1_hoc_sinh_dep.jpg",
    url: "/data/samples/bai_1_hoc_sinh_dep.jpg",
    teacherUrl: "/data/samples/crop_a_co_giao_mau.jpg",
    badge: "Mẫu mực",
    color: "emerald",
  },
  {
    id: "bai_thi",
    label: "Bài thi tổng hợp chữ viết lớp 1",
    file: "bai_thi_viet_mau.jpg",
    url: "/data/samples/bai_thi_viet_mau.jpg",
    teacherUrl: "/data/samples/crop_a_co_giao_mau.jpg",
    badge: "Bài thi",
    color: "violet",
  },
];

interface PointFocus {
  x: number; // Tọa độ pixel trên ảnh gốc (0 .. naturalWidth)
  y: number; // Tọa độ pixel trên ảnh gốc (0 .. naturalHeight)
  normX: number; // Tỷ lệ 0 .. 1000
  normY: number; // Tỷ lệ 0 .. 1000
  title?: string;
  matchedBox?: HandwritingBoundingBox | null;
}

export function AiHandwritingGrader() {
  // Trạng thái ảnh đang xem
  const [currentPreset, setCurrentPreset] = useState(PRESETS[0]);
  const [imageUrl, setImageUrl] = useState<string>(PRESETS[0].url);
  const [imageFileName, setImageFileName] = useState<string>(PRESETS[0].file);

  // Trạng thái phân tích & đánh giá
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<HandwritingEvaluationResult | null>(null);

  // Kính lúp & Tiêu cự soi nét
  const [isMagnifierActive, setIsMagnifierActive] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(3); // 2x, 3x, 4x
  const [ghostOpacity, setGhostOpacity] = useState<number>(0.35); // Độ mờ nét mẫu cô giáo đè lên
  const [showGhostOverlay, setShowGhostOverlay] = useState<boolean>(true);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(true);

  // Điểm đang được khóa tiêu cự (Focused Point)
  const [focusPoint, setFocusPoint] = useState<PointFocus>({
    x: 1075, // Mặc định khóa vào chữ 'a' lỗi nét móc dòng 1 của bài 1
    y: 330,
    normX: 768,
    normY: 150,
  });

  // Vị trí con trỏ chuột thời gian thực cho kính lúp bay (Floating lens)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  // Trạng thái giọng đọc
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Refs
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasLensRef = useRef<HTMLCanvasElement>(null); // Kính lúp cố định ở panel
  const floatingCanvasRef = useRef<HTMLCanvasElement>(null); // Kính lúp trôi theo chuột
  const teacherImgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Nạp sẵn ảnh mẫu cô giáo để làm lớp lồng nét (Ghost Overlay)
  useEffect(() => {
    const teacher = new window.Image();
    teacher.crossOrigin = "anonymous";
    teacher.src = currentPreset.teacherUrl || "/data/samples/crop_a_co_giao_mau.jpg";
    teacher.onload = () => {
      teacherImgRef.current = teacher;
      renderInspectorLens();
    };
  }, [currentPreset]);

  // Tự động tải kết quả precomputed khi mở bài mẫu
  const loadEvaluationForImage = useCallback(async (file: string, url: string) => {
    try {
      const res = await fetch("/api/evaluate-handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url, fileName: file }),
      });
      if (res.ok) {
        const data: HandwritingEvaluationResult = await res.json();
        setEvaluation(data);

        // Khóa tiêu cự vào lỗi đầu tiên nếu có
        const firstError = data.bounding_boxes?.find((b) => b.loai === "loi");
        if (firstError) {
          const [ymin, xmin, ymax, xmax] = firstError.box_2d;
          const cx1000 = firstError.callout?.target[0] || (xmin + xmax) / 2;
          const cy1000 = firstError.callout?.target[1] || (ymin + ymax) / 2;

          const img = imageRef.current;
          const nw = img?.naturalWidth || 1400;
          const nh = img?.naturalHeight || 2200;

          setFocusPoint({
            x: (cx1000 / 1000) * nw,
            y: (cy1000 / 1000) * nh,
            normX: cx1000,
            normY: cy1000,
            title: firstError.tieu_de,
            matchedBox: firstError,
          });
        }
      }
    } catch (e) {
      console.warn("Không tải được dữ liệu đánh giá trước:", e);
    }
  }, []);

  // Khởi động lần đầu: Tải ảnh và đánh giá
  useEffect(() => {
    loadEvaluationForImage(currentPreset.file, currentPreset.url);
  }, [currentPreset, loadEvaluationForImage]);

  // VẼ KÍNH LÚP SOI NÉT CỐ ĐỊNH Ở PANEL BÊN PHẢI (Studio Inspector Lens)
  const renderInspectorLens = useCallback(() => {
    const canvas = canvasLensRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !img.naturalWidth || !img.naturalHeight) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;

    // Kích thước vùng crop từ ảnh gốc dựa trên zoomLevel
    const cropW = cw / zoomLevel;
    const cropH = ch / zoomLevel;
    const sx = Math.max(0, Math.min(img.naturalWidth - cropW, focusPoint.x - cropW / 2));
    const sy = Math.max(0, Math.min(img.naturalHeight - cropH, focusPoint.y - cropH / 2));

    // 1. Nền canvas tối chuyên dụng Studio
    ctx.fillStyle = "#050811";
    ctx.fillRect(0, 0, cw, ch);

    // 2. Vẽ nét chữ thật của học sinh từ trang vở
    ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, cw, ch);

    // 3. Vẽ lưới ô ly chuẩn tiểu học đè lên (nếu bật)
    if (showGridOverlay) {
      ctx.save();
      ctx.strokeStyle = "rgba(37, 99, 235, 0.4)"; // Xanh dương ô ly
      ctx.lineWidth = 1;

      // Khoảng cách ô ly xấp xỉ 75px trên ảnh 2200px -> scaled
      const cellStep = (75 / cropH) * ch;

      // Lưới dọc
      for (let x = 0; x <= cw; x += cellStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ch);
        ctx.stroke();
      }

      // Lưới ngang
      for (let y = 0; y <= ch; y += cellStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }

      // Đường kẻ ngang đậm số 1 (Chân chữ bám dòng)
      ctx.strokeStyle = "rgba(59, 130, 246, 0.85)";
      ctx.lineWidth = 2.5;
      const baselineY = ch * 0.72;
      ctx.beginPath();
      ctx.moveTo(0, baselineY);
      ctx.lineTo(cw, baselineY);
      ctx.stroke();

      // Đường kẻ số 3 (Độ cao chuẩn 2 ô ly)
      ctx.strokeStyle = "rgba(96, 165, 250, 0.75)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      const height2LyY = baselineY - cellStep * 2;
      ctx.beginPath();
      ctx.moveTo(0, height2LyY);
      ctx.lineTo(cw, height2LyY);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Lồng nét mẫu cô giáo (Ghost Overlay) để thấy ngay sai lệch
    if (showGhostOverlay && teacherImgRef.current && ghostOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = ghostOpacity;
      ctx.globalCompositeOperation = "screen"; // Hòa trộn nét mực
      // Vẽ chữ mẫu cô giáo phủ lên trung tâm
      const tw = cw * 0.85;
      const th = ch * 0.85;
      const tx = (cw - tw) / 2;
      const ty = (ch - th) / 2;
      ctx.drawImage(teacherImgRef.current, tx, ty, tw, th);
      ctx.restore();
    }

    // 5. Tâm ngắm tiêu cự (Crosshair Center Reticle)
    ctx.save();
    ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cw / 2, 0);
    ctx.lineTo(cw / 2, ch);
    ctx.moveTo(0, ch / 2);
    ctx.lineTo(cw, ch / 2);
    ctx.stroke();
    ctx.restore();
  }, [focusPoint, zoomLevel, showGridOverlay, showGhostOverlay, ghostOpacity]);

  // Cập nhật lại kính lúp mỗi khi thay đổi tiêu cự hoặc cấu hình
  useEffect(() => {
    renderInspectorLens();
  }, [renderInspectorLens]);

  // VẼ KÍNH LÚP TRÔI (FLOATING LENS) THEO TỌA ĐỘ CHUỘT
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMagnifierActive) return;

    const img = imageRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setCursorPos((prev) => ({ ...prev, visible: false }));
      return;
    }

    // Tọa độ trên ảnh hiển thị
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    // Tọa độ thật trên ảnh gốc
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const realX = relX * scaleX;
    const realY = relY * scaleY;

    setCursorPos({
      x: relX,
      y: relY,
      visible: true,
    });

    // Vẽ tức thì lên Floating Canvas
    const canvas = floatingCanvasRef.current;
    if (canvas && img.naturalWidth) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const cw = canvas.width;
        const ch = canvas.height;
        const cropW = cw / zoomLevel;
        const cropH = ch / zoomLevel;
        const sx = Math.max(0, Math.min(img.naturalWidth - cropW, realX - cropW / 2));
        const sy = Math.max(0, Math.min(img.naturalHeight - cropH, realY - cropH / 2));

        ctx.fillStyle = "#050811";
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, cw, ch);

        // Kẻ chữ thập tâm ngắm
        ctx.strokeStyle = "rgba(239, 68, 68, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cw / 2, ch / 2, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  // KHI NGƯỜI DÙNG CLICK VÀO BẤT KỲ ĐÂU TRÊN TRANG VỞ
  const handleCanvasClick = (e: React.PointerEvent<HTMLDivElement>) => {
    const img = imageRef.current;
    if (!img) return;

    sound.playTone(600, 0.05);

    const rect = img.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    const realX = relX * scaleX;
    const realY = relY * scaleY;

    const normX = Math.round((realX / img.naturalWidth) * 1000);
    const normY = Math.round((realY / img.naturalHeight) * 1000);

    // Kiểm tra xem vị trí click có khớp với Bounding Box lỗi nào không
    const matched = evaluation?.bounding_boxes?.find((b) => {
      const [ymin, xmin, ymax, xmax] = b.box_2d;
      return normX >= xmin && normX <= xmax && normY >= ymin && normY <= ymax;
    });

    setFocusPoint({
      x: realX,
      y: realY,
      normX,
      normY,
      title: matched ? matched.tieu_de : `Nét chữ tại tọa độ (${normX}, ${normY})`,
      matchedBox: matched || null,
    });
  };

  // BẤM VÀO GHIM LỖI ĐỂ KHÓA TIÊU CỰ
  const handleSelectBox = (box: HandwritingBoundingBox) => {
    sound.playTone(659.25, 0.08);
    const img = imageRef.current;
    const nw = img?.naturalWidth || 1400;
    const nh = img?.naturalHeight || 2200;

    const [ymin, xmin, ymax, xmax] = box.box_2d;
    const cx1000 = box.callout?.target[0] || (xmin + xmax) / 2;
    const cy1000 = box.callout?.target[1] || (ymin + ymax) / 2;

    setFocusPoint({
      x: (cx1000 / 1000) * nw,
      y: (cy1000 / 1000) * nh,
      normX: cx1000,
      normY: cy1000,
      title: box.tieu_de,
      matchedBox: box,
    });
  };

  // KÍCH HOẠT QUÉT LỖI TOÀN TRANG
  const handleTriggerFullScan = async () => {
    sound.playTone(523.25, 0.1);
    setIsScanning(true);
    setEvaluation(null);

    try {
      const res = await fetch("/api/evaluate-handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl, fileName: imageFileName }),
      });
      if (!res.ok) throw new Error("Lỗi kết nối AI");

      const data: HandwritingEvaluationResult = await res.json();
      setEvaluation(data);

      if (data.anh_hop_le && data.tong_diem >= 80) {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#7c3aed", "#10b981", "#f59e0b", "#ec4899"],
        });
      }

      // Tự động nhảy tiêu cự vào lỗi đầu tiên
      const firstLoi = data.bounding_boxes?.find((b) => b.loai === "loi") || data.bounding_boxes?.[0];
      if (firstLoi) {
        handleSelectBox(firstLoi);
      }
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi quét bài viết. Vui lòng thử lại!");
    } finally {
      setIsScanning(false);
    }
  };

  // TẢI ẢNH TỪ MÁY TÍNH / ĐIỆN THOẠI
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playTone(440, 0.05);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        setImageUrl(result);
        setImageFileName(file.name);
        setEvaluation(null);
        setFocusPoint({ x: 700, y: 1100, normX: 500, normY: 500 });
      }
    };
    reader.readAsDataURL(file);
  };

  // ĐỌC HƯỚNG DẪN BẰNG GIỌNG CÔ GIÁO
  const toggleSpeechGuidance = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const box = focusPoint.matchedBox;
    let textToSpeak = "";
    if (box) {
      textToSpeak = `${box.tieu_de}. ${box.nhan_xet} ${box.huong_dan_sua ? `Cách sửa tay cho bé: ${box.huong_dan_sua}` : ""}`;
    } else if (evaluation) {
      textToSpeak = `${evaluation.nhan_xet_chung} Điểm sáng của con: ${evaluation.diem_tot.join(". ")}. Chỗ cần rèn luyện thêm: ${evaluation.loi_can_cai_thien.join(". ")}`;
    } else {
      textToSpeak = "Bé hãy đặt bút đúng đường kẻ ngang 3, đưa nét cong tròn trịa và bám đều trên đường kẻ đậm số 1 con nhé.";
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "vi-VN";
    utterance.rate = 0.88;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const activeBox = focusPoint.matchedBox;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 select-none pb-12">
      {/* 1. THANH ĐIỀU KHIỂN TINH GỌN (TOP WORKSPACE TOOLBAR) */}
      <header className="bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Bộ chọn bài tập mẫu */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider hidden sm:inline">
            Chọn vở luyện:
          </span>
          {PRESETS.map((p) => {
            const isSelected = imageFileName === p.file;
            return (
              <button
                key={p.id}
                onClick={() => {
                  sound.playTone(520, 0.05);
                  setCurrentPreset(p);
                  setImageUrl(p.url);
                  setImageFileName(p.file);
                }}
                className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-md ring-2 ring-violet-500"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <span>{p.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    p.color === "rose"
                      ? "bg-rose-500 text-white"
                      : p.color === "emerald"
                      ? "bg-emerald-500 text-white"
                      : "bg-violet-500 text-white"
                  }`}
                >
                  {p.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Nút hành động chính */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Nút Tải ảnh lên */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all"
            title="Tải ảnh vở chụp từ điện thoại"
          >
            <Upload className="w-4 h-4 text-violet-600" />
            <span className="hidden sm:inline">Tải ảnh khác</span>
          </button>

          {/* Nút Kính lúp bật/tắt */}
          <button
            onClick={() => {
              sound.playTone(480, 0.05);
              setIsMagnifierActive(!isMagnifierActive);
            }}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95 ${
              isMagnifierActive
                ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                : "bg-slate-100 text-slate-500"
            }`}
            title="Bật/Tắt kính lúp soi nét trôi theo chuột"
          >
            {isMagnifierActive ? <Eye className="w-4 h-4 text-amber-600" /> : <EyeOff className="w-4 h-4" />}
            <span>Kính lúp: {isMagnifierActive ? "Bật" : "Tắt"}</span>
          </button>

          {/* Nút AI QUÉT LỖI TOÀN TRANG */}
          <button
            onClick={handleTriggerFullScan}
            disabled={isScanning}
            className={`min-h-[44px] px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
              isScanning
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-linear-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white shadow-emerald-200"
            }`}
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang quét ô ly...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>AI Quét Cả Trang</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. KHÔNG GIAN LÀM VIỆC CHÍNH (2 CỘT CHUẨN SPLIT-STUDIO) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (7/12 CỘT): TRANG VỞ SCAN & KÍNH LÚP TƯƠNG TÁC QUANG HỌC */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-slate-900 rounded-3xl p-2 sm:p-3 shadow-2xl relative overflow-hidden border border-slate-800">
            {/* Header nhỏ hướng dẫn thao tác */}
            <div className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 border-b border-slate-800 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-300">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Di chuột để soi • Click vào nét chữ để khóa tiêu cự</span>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Khổ chuẩn 1400 × 2200px
              </span>
            </div>

            {/* Vùng chứa ảnh vở */}
            <div
              className="relative rounded-2xl overflow-hidden bg-[#0a0f1d] flex items-center justify-center cursor-crosshair min-h-[480px]"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setCursorPos((p) => ({ ...p, visible: false }))}
              onPointerDown={handleCanvasClick}
            >
              {/* Ảnh bài viết gốc */}
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Trang vở học sinh"
                className="w-full h-auto max-h-[75vh] object-contain rounded-xl select-none pointer-events-none block mx-auto"
                draggable={false}
                crossOrigin="anonymous"
                onLoad={() => renderInspectorLens()}
              />

              {/* VÒNG TIÊU CỰ ĐANG KHÓA (LOCKED FOCUS RING) */}
              {imageRef.current && (
                <div
                  className="absolute pointer-events-none transition-all duration-200"
                  style={{
                    left: `${(focusPoint.normX / 1000) * 100}%`,
                    top: `${(focusPoint.normY / 1000) * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="w-12 h-12 rounded-full border-2 border-rose-500 bg-rose-500/15 animate-ping absolute -inset-0" />
                  <div className="w-12 h-12 rounded-full border-2 border-amber-400 bg-amber-400/20 shadow-lg flex items-center justify-center relative">
                    <div className="w-2 h-2 rounded-full bg-rose-600 shadow-xs" />
                  </div>
                </div>
              )}

              {/* CÁC CHẤM GHIM LỖI TỰ ĐỘNG CỦA AI TRÊN TRANG VỞ */}
              {evaluation?.bounding_boxes?.map((box) => {
                const [ymin, xmin, ymax, xmax] = box.box_2d;
                const cx = box.callout?.target[0] || (xmin + xmax) / 2;
                const cy = box.callout?.target[1] || (ymin + ymax) / 2;
                const isSelected = activeBox?.id === box.id;

                return (
                  <button
                    key={box.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectBox(box);
                    }}
                    style={{
                      left: `${cx / 10}%`,
                      top: `${cy / 10}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className={`absolute z-20 min-h-[36px] min-w-[36px] p-1.5 rounded-full shadow-xl font-black text-xs flex items-center justify-center transition-all active:scale-90 ${
                      box.loai === "loi"
                        ? isSelected
                          ? "bg-rose-600 text-white ring-4 ring-rose-400 ring-offset-2 ring-offset-slate-900 scale-125"
                          : "bg-rose-500/90 text-white hover:scale-110 animate-pulse"
                        : isSelected
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-400 ring-offset-2 ring-offset-slate-900 scale-125"
                        : "bg-emerald-500/90 text-white hover:scale-110"
                    }`}
                    title={box.tieu_de}
                  >
                    {box.loai === "loi" ? "❌" : "✅"}
                  </button>
                );
              })}

              {/* KÍNH LÚP TRÔI NỔI (FLOATING SPYGLASS LENS) */}
              {isMagnifierActive && cursorPos.visible && (
                <div
                  className="absolute pointer-events-none z-30 transition-opacity duration-75 shadow-2xl rounded-full border-4 border-white/90 overflow-hidden ring-4 ring-black/40"
                  style={{
                    left: `${cursorPos.x}px`,
                    top: `${cursorPos.y}px`,
                    width: "160px",
                    height: "160px",
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <canvas
                    ref={floatingCanvasRef}
                    width={160}
                    height={160}
                    className="w-full h-full block"
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-amber-400/80 pointer-events-none" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (5/12 CỘT): STUDIO KÍNH LÚP SOI NÉT & SO SÁNH CHÂN LÝ */}
        <div className="lg:col-span-5 space-y-4">
          {/* KHUNG THẤU KÍNH QUANG HỌC CẬN CẢNH (DARK GRID STUDIO) */}
          <div className="bg-[#090d16] rounded-3xl p-4 sm:p-5 border-2 border-slate-800 text-white shadow-2xl space-y-3.5">
            {/* Header thấu kính */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    activeBox?.loai === "loi" ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                  }`}
                />
                <h3 className="text-sm sm:text-base font-black text-slate-100 tracking-wide">
                  {activeBox?.loai === "loi"
                    ? `Phát hiện lỗi: ${activeBox.tieu_de}`
                    : activeBox
                    ? `Nét chuẩn: ${activeBox.tieu_de}`
                    : "Kính lúp soi nét thời gian thực"}
                </h3>
              </div>

              {/* Nút đổi độ phóng đại */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {[2, 3, 4].map((z) => (
                  <button
                    key={z}
                    onClick={() => {
                      sound.playTone(500, 0.03);
                      setZoomLevel(z);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-xs font-black transition-all ${
                      zoomLevel === z
                        ? "bg-violet-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {z}×
                  </button>
                ))}
              </div>
            </div>

            {/* VÙNG THẤU KÍNH HIỂN THỊ NÉT THẬT TRÊN LƯỚI Ô LY */}
            <div className="relative w-full aspect-[4/3] rounded-2xl bg-[#050811] border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
              <canvas
                ref={canvasLensRef}
                width={360}
                height={270}
                className="w-full h-full object-cover block"
              />

              {/* VÒNG TRÒN NÉT ĐỨT ĐỎ + CALLOUT CHỈ LỖI (CHUẨN GIAODIENMONGMUON.PNG) */}
              {activeBox?.loai === "loi" && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 360 270">
                  {/* Vòng tròn nét đứt đỏ quanh điểm lỗi */}
                  <circle
                    cx="180"
                    cy="125"
                    r="34"
                    fill="rgba(239, 68, 68, 0.08)"
                    stroke="#ef4444"
                    strokeWidth={3}
                    strokeDasharray="6 4"
                  />
                  {/* Đường chỉ dẫn chéo lên góc trên bên phải */}
                  <line
                    x1="204"
                    y1="102"
                    x2="275"
                    y2="42"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                  {/* Chấm tròn đỏ đầu mút */}
                  <circle cx="275" cy="42" r="6.5" fill="#ef4444" />
                </svg>
              )}
            </div>

            {/* THANH ĐIỀU CHỈNH ĐỐI CHIẾU MẪU CÔ GIÁO (GHOST OVERLAY SLIDER) */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lồng nét mẫu cô giáo (Vở Chân Lý):</span>
                </span>
                <span className="text-emerald-400 font-mono">
                  {showGhostOverlay ? `${Math.round(ghostOpacity * 100)}%` : "Tắt"}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowGhostOverlay(!showGhostOverlay)}
                  className={`min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    showGhostOverlay
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {showGhostOverlay ? "Đang bật" : "Bật lồng nét"}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ghostOpacity}
                  disabled={!showGhostOverlay}
                  onChange={(e) => setGhostOpacity(parseFloat(e.target.value))}
                  className="flex-1 accent-emerald-500 cursor-pointer disabled:opacity-30"
                />

                <button
                  onClick={() => setShowGridOverlay(!showGridOverlay)}
                  className={`min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                    showGridOverlay
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                  title="Ẩn/Hiện đường kẻ ô ly"
                >
                  {showGridOverlay ? "Ô ly: Bật" : "Ô ly: Tắt"}
                </button>
              </div>
            </div>

            {/* BẢNG ĐO LƯỜNG HÌNH HỌC THỰC TẾ (REAL COMPUTER VISION METRICS) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Chiều cao ô ly</span>
                <span className="font-black text-slate-100 text-xs sm:text-sm">
                  {activeBox?.do_luong?.chieu_cao || "2.0 ô ly"}
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Độ rộng thân chữ</span>
                <span className="font-black text-slate-100 text-xs sm:text-sm">
                  {activeBox?.do_luong?.do_rong || "1.5 ô ly"}
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Sai lệch nét</span>
                <span
                  className={`font-black text-xs sm:text-sm ${
                    activeBox?.loai === "loi" ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {activeBox?.do_luong?.do_lech || "0 px (Chuẩn)"}
                </span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Chân bám dòng 1</span>
                <span className="font-black text-slate-100 text-xs sm:text-sm">
                  {activeBox?.do_luong?.chan_chu || "Đạt chuẩn"}
                </span>
              </div>
            </div>

            {/* NHẬN XÉT SƯ PHẠM VÀ HƯỚNG DẪN NẮN TAY */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-400">
                  📌 Đánh giá sư phạm nét đang soi:
                </span>
                <button
                  onClick={toggleSpeechGuidance}
                  className="min-h-[32px] px-2.5 py-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1 active:scale-95 shadow-xs"
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isSpeaking ? "Dừng đọc" : "Nghe cô đọc"}</span>
                </button>
              </div>

              <p className="text-slate-200 leading-relaxed">
                {activeBox?.nhan_xet ||
                  "Chữ viết của bé cơ bản đã hình thành đúng khung ô ly. Hãy đối chiếu với nét mờ của cô giáo để nắn nót thêm."}
              </p>

              {activeBox?.huong_dan_sua && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
                  <span className="font-bold block text-emerald-200">💡 Cách sửa tay cho bé:</span>
                  <span>{activeBox.huong_dan_sua}</span>
                </div>
              )}
            </div>
          </div>

          {/* BẢNG TỔNG KẾT ĐIỂM TOÀN BÀI (NẾU CÓ KẾT QUẢ ĐÁNH GIÁ) */}
          {evaluation && (
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    Kết quả chấm toàn bài
                  </span>
                  <h4 className="text-base font-black text-slate-900">{evaluation.xep_loai}</h4>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-violet-600">{evaluation.tong_diem}</span>
                  <span className="text-xs font-bold text-slate-400 block">/ 100 điểm</span>
                </div>
              </div>

              {/* Lời khuyên phụ huynh */}
              {evaluation.nhan_xet_phu_huynh && (
                <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                  <span className="font-bold block text-amber-950">👨‍👩‍👧 Lời khuyên cho Ba Mẹ:</span>
                  <p>{evaluation.nhan_xet_phu_huynh}</p>
                </div>
              )}

              {/* Nút bấm nghe toàn bộ nhận xét */}
              <button
                onClick={toggleSpeechGuidance}
                className="w-full min-h-[44px] py-2.5 rounded-2xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center gap-2 border border-violet-200 transition-all active:scale-95"
              >
                <Volume2 className="w-4 h-4 text-violet-600" />
                <span>Nghe cô giáo nhận xét chi tiết toàn bài</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
