"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { HandwritingEvaluationResult, HandwritingBoundingBox } from "@/types/letter";
import {
  Sparkles,
  Camera,
  Upload,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  Settings,
  X,
  FileText,
  Loader2,
  ChevronRight,
  Lightbulb,
  Eye,
  EyeOff,
  BookOpen,
  Info,
} from "lucide-react";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";

// Danh sách các bài mẫu thực tế tiêu biểu từ sách "Chào em vào lớp một"
const REAL_SAMPLE_PRESETS = [
  {
    id: "sample_exam",
    title: "Bài thi viết chữ đẹp",
    sub: "Chữ v, ua, xe ngựa, Bà cho bé khế...",
    url: "/data/samples/bai_thi_viet_mau.jpg",
    badge: "Bài thi mẫu",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "sample_trang_01",
    title: "Trang 1: Các nét cơ bản",
    sub: "Ngang, sổ, xiên, móc, khuyết, thắt",
    url: "/data/samples/real/trang_01.jpg",
    badge: "Sách lớp 1",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "sample_trang_02",
    title: "Trang 2: Chữ số 0-9 & Bài 1-2",
    sub: "Tập viết chữ số & Chữ a, ca, b, bà",
    url: "/data/samples/real/trang_02.jpg",
    badge: "Số & Vần a, b",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "sample_trang_03",
    title: "Trang 3: Bài 3-6",
    sub: "Chữ c, e, o & Câu 'Ba bế bé.'",
    url: "/data/samples/real/trang_03.jpg",
    badge: "Câu ứng dụng",
    color: "from-emerald-500 to-teal-600",
  },
];

export function AiHandwritingGrader() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [result, setResult] = useState<HandwritingEvaluationResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const activeBoxCardRef = useRef<HTMLDivElement>(null);

  // Không tự động cuộn mất ảnh khi có kết quả để người dùng nhìn thấy ngay Bounding Box
  useEffect(() => {
    if (result && activeBoxCardRef.current) {
      activeBoxCardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [result]);

  // Khôi phục custom API key từ localStorage (nếu có)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("custom_deepseek_key") || localStorage.getItem("custom_openai_key");
      if (savedKey) setCustomApiKey(savedKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("custom_deepseek_key", customApiKey.trim());
      sound.playTone(523.25, 0.08);
      setShowSettings(false);
    }
  };

  const handleClearApiKey = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("custom_deepseek_key");
      localStorage.removeItem("custom_openai_key");
      setCustomApiKey("");
      sound.playTone(440, 0.08);
      setShowSettings(false);
    }
  };

  // Hàm nén ảnh tự động trên Canvas để upload siêu nhanh và không vượt quá giới hạn
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 1600;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  // Chọn ảnh từ máy tính / thư viện (nén tự động chống lỗi dung lượng)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sound.playTone(440, 0.08);
      setSelectedFileName(file.name);
      try {
        const optimized = await compressImage(file);
        setSelectedImage(optimized);
        setSelectedPresetId(null);
        setResult(null);
        setActiveBoxId(null);
      } catch (err) {
        console.error("Lỗi xử lý ảnh:", err);
      }
    }
  };

  // Chọn mẫu từ kho bài thi thực tế (1-chạm phản hồi tức thì)
  const handleSelectPreset = async (preset: (typeof REAL_SAMPLE_PRESETS)[0]) => {
    sound.playTone(523.25, 0.08);
    setSelectedPresetId(preset.id);
    setSelectedFileName(preset.id);
    setSelectedImage(preset.url);
    setActiveBoxId(null);
    setIsEvaluating(true);
    setResult(null);

    try {
      const res = await fetch("/api/evaluate-handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: preset.url,
          fileName: preset.id,
        }),
      });

      if (!res.ok) throw new Error("Lỗi khi tải dữ liệu bài mẫu");
      const data: HandwritingEvaluationResult = await res.json();
      setResult(data);

      if (data.bounding_boxes && data.bounding_boxes.length > 0) {
        setActiveBoxId(data.bounding_boxes[0].id);
      }

      if (data.anh_hop_le && data.tong_diem >= 80) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#7c3aed", "#10b981", "#f59e0b", "#ec4899"],
        });
      }
    } catch (err) {
      console.error("Lỗi tải mẫu:", err);
      alert("Không thể tải đánh giá mẫu, vui lòng thử lại!");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Kích hoạt đánh giá bài viết qua AI
  const handleEvaluate = async () => {
    if (!selectedImage) return;

    sound.playTone(587.33, 0.1);
    setIsEvaluating(true);
    setResult(null);
    setActiveBoxId(null);

    try {
      const res = await fetch("/api/evaluate-handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage,
          fileName: selectedFileName,
          apiKey: customApiKey.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Lỗi khi kết nối đến dịch vụ AI");
      }

      const data: HandwritingEvaluationResult = await res.json();
      setResult(data);

      if (data.bounding_boxes && data.bounding_boxes.length > 0) {
        setActiveBoxId(data.bounding_boxes[0].id);
      }

      if (data.anh_hop_le && data.tong_diem >= 80) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#7c3aed", "#10b981", "#f59e0b", "#ec4899"],
        });
      }
    } catch (err: any) {
      console.error("Lỗi đánh giá:", err);
      alert("Đã xảy ra lỗi khi phân tích bài viết. Vui lòng thử lại!");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Đọc nhận xét toàn bài bằng giọng cô giáo tiếng Việt
  const toggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!result) return;

    window.speechSynthesis.cancel();
    const fullText = `${result.nhan_xet_chung} Điểm sáng của con: ${result.diem_tot.join(". ")}. Những chỗ cần chú ý: ${result.loi_can_cai_thien.join(". ")}`;

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = "vi-VN";
    utterance.rate = 0.88;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Đọc hướng dẫn sửa của riêng 1 Bounding Box
  const speakBoxGuidance = (box: HandwritingBoundingBox) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const text = `${box.tieu_de}. ${box.nhan_xet}. Hướng dẫn sửa: ${box.huong_dan_sua || "Con hãy nắn nót theo đúng dòng kẻ ô ly nhé!"}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Reset xóa ảnh làm lại
  const handleReset = () => {
    sound.playTone(440, 0.08);
    setSelectedImage(null);
    setSelectedFileName("");
    setSelectedPresetId(null);
    setResult(null);
    setActiveBoxId(null);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Lấy box đang được chọn
  const activeBox = result?.bounding_boxes?.find((b) => b.id === activeBoxId) || null;

  return (
    <div className="w-full flex flex-col items-center py-2 sm:py-4 px-2 sm:px-6">
      {/* Ẩn input file cho camera và upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header Banner */}
      <div className="w-full max-w-5xl text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-linear-to-r from-violet-100 via-indigo-100 to-emerald-100 text-violet-900 border border-violet-200 shadow-xs">
            <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
            AI Visual Grounding • Nhận Diện Từng Nét Chữ Ô Ly Lớp 1
          </span>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Cài đặt khóa API (Tùy chọn)"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">
          AI Chấm Điểm & Khoanh Vùng Nét Chữ Lớp 1
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl mx-auto leading-relaxed">
          Tự động định vị từng con chữ đơn lẻ trên ô ly, phát hiện nét đẹp (xanh) và nét lỗi (đỏ/cam) bằng khung chữ nhật tương tác thông minh.
        </p>
      </div>

      {/* KHO BÀI THI MẪU THỰC TẾ (1-CHẠM DEMO HOÀN HẢO) */}
      <div className="w-full max-w-5xl mb-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Kho Vở Thực Tế (Sách "Chào em vào lớp một" & Bài thi)
          </span>
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            Bấm 1 chạm xem ngay
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {REAL_SAMPLE_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between min-h-[90px] ${
                  isSelected
                    ? "bg-indigo-50/90 border-indigo-500 shadow-md ring-2 ring-indigo-400"
                    : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 shadow-2xs"
                }`}
              >
                <div>
                  <span
                    className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md text-white bg-linear-to-r ${preset.color} mb-1`}
                  >
                    {preset.badge}
                  </span>
                  <h4 className="text-xs font-black text-slate-800 line-clamp-1">{preset.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{preset.sub}</p>
                </div>
                <div className="text-[10px] font-bold text-indigo-600 flex items-center gap-0.5 pt-1">
                  <span>Xem chấm</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KHUNG THAO TÁC UPLOAD / CAMERA */}
      <div className="w-full max-w-5xl mb-4">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Chụp Ảnh Vở Bé (Camera)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs active:scale-95 transition-all"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Tải Ảnh Từ Máy</span>
          </button>
        </div>
      </div>

      {/* KHUNG HƯỚNG DẪN KHI CHƯA CÓ ẢNH */}
      {!selectedImage && (
        <div className="w-full max-w-4xl bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center text-2xl">
            ✍️
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Mẹo để AI chấm điểm chữ viết chuẩn xác nhất:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto pt-2">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-800 block mb-1">1. Đủ ánh sáng</span>
              Tránh bóng tay hoặc điện thoại che khuất trang vở ô ly.
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-800 block mb-1">2. Chụp vuông góc</span>
              Giữ điện thoại song song với mặt bàn để đường kẻ ô ly không bị méo.
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-800 block mb-1">3. Thấy rõ ô ly</span>
              Hình ảnh rõ nét, nhìn rõ đường kẻ ngang 1, 2 và các nét nối chữ.
            </div>
          </div>
        </div>
      )}

      {/* KHUNG KẾT QUẢ HIỂN THỊ CHÍNH (LAYOUT 2 CỘT RESPONSIVE CAO CẤP) */}
      {selectedImage && (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI (7 CỘT): ẢNH + BOUNDING BOXES + BADGE CHIPS + INSPECTOR */}
          <div className="lg:col-span-7 space-y-4 min-w-0">
            <div className="bg-white rounded-3xl p-3 sm:p-5 border-2 border-indigo-100 shadow-xl space-y-3.5">
              {/* Header thanh công cụ trên ảnh */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    Hình Ảnh Bài Viết & Lưới AI
                  </span>
                  {result?.bounding_boxes && (
                    <span className="text-[11px] font-bold bg-violet-100 text-violet-800 px-2.5 py-0.5 rounded-full">
                      {result.bounding_boxes.length} con chữ được soi
                    </span>
                  )}
                </div>

                {result?.bounding_boxes && (
                  <button
                    onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                    className="min-h-[36px] px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    {showBoundingBoxes ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ẩn khung</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Hiện khung AI</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Khung ảnh chính có SVG Bounding Box đè lên */}
              <div className="relative w-full max-h-[500px] rounded-2xl overflow-hidden bg-slate-900/5 border border-slate-200 flex items-center justify-center p-1">
                <div className="relative inline-block max-w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage}
                    alt="Bài viết của học sinh"
                    className="max-h-[470px] w-auto h-auto object-contain rounded-xl block select-none"
                  />

                  {/* Lớp SVG Bounding Box tương tác */}
                  {result?.bounding_boxes && showBoundingBoxes && (
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-auto"
                      viewBox="0 0 1000 1000"
                      preserveAspectRatio="none"
                    >
                      {result.bounding_boxes.map((box, idx) => {
                        const [ymin, xmin, ymax, xmax] = box.box_2d;
                        const width = Math.max(15, xmax - xmin);
                        const height = Math.max(15, ymax - ymin);
                        const isActive = activeBoxId === box.id;

                        const isLoi = box.loai === "loi";
                        const isChuan = box.loai === "chuan";

                        const strokeColor = isLoi ? "#ef4444" : isChuan ? "#10b981" : "#f59e0b";
                        const fillColor = isLoi
                          ? "rgba(239, 68, 68, 0.18)"
                          : isChuan
                          ? "rgba(16, 185, 129, 0.18)"
                          : "rgba(245, 158, 11, 0.18)";

                        return (
                          <g
                            key={box.id || idx}
                            className="cursor-pointer transition-all duration-200"
                            onClick={() => {
                              sound.playTone(600, 0.08);
                              setActiveBoxId(box.id);
                              speakBoxGuidance(box);
                            }}
                          >
                            {/* Hộp chữ nhật bao quanh nét */}
                            <rect
                              x={xmin}
                              y={ymin}
                              width={width}
                              height={height}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={isActive ? 5 : 2.5}
                              rx={6}
                              strokeDasharray={isActive ? "none" : isLoi ? "5 3" : "none"}
                              className={isActive ? "filter drop-shadow-md animate-pulse" : ""}
                            />

                            {/* Nhãn con chữ nhỏ góc trên box */}
                            <rect
                              x={xmin}
                              y={Math.max(4, ymin - 22)}
                              width={Math.max(34, (box.chu?.length || 1) * 12 + 16)}
                              height={20}
                              fill={strokeColor}
                              rx={4}
                            />
                            <text
                              x={xmin + 5}
                              y={Math.max(4, ymin - 22) + 14}
                              fill="#ffffff"
                              fontSize="12"
                              fontWeight="bold"
                              fontFamily="sans-serif"
                            >
                              {box.chu} #{idx + 1}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  )}
                </div>

                {/* Hiệu ứng tia Laser quét bài thi khi AI đang phân tích */}
                {isEvaluating && (
                  <div className="absolute inset-0 bg-violet-600/15 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
                    <div className="w-full h-1 bg-linear-to-r from-transparent via-violet-500 to-transparent absolute top-1/2 -translate-y-1/2 animate-bounce" />
                    <div className="bg-white/95 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-violet-200">
                      <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                      <div className="text-left">
                        <span className="text-xs font-black text-slate-800 block">
                          AI Vision đang soi từng ô ly & nét chữ...
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Đo độ cao chuẩn 2 ly, nét khuyết và lực tay viết
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* HÀNG NÚT CHIPS TƯƠNG TÁC TỪNG NÉT CHỮ */}
              {result?.bounding_boxes && result.bounding_boxes.length > 0 && (
                <div className="pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                      Bấm vào từng nét chữ để nghe cô chấm:
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (Xanh: Đẹp • Cam: Chú ý • Đỏ: Cần sửa)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {result.bounding_boxes.map((box, idx) => {
                      const isActive = activeBoxId === box.id;
                      const isLoi = box.loai === "loi";
                      const isChuan = box.loai === "chuan";

                      return (
                        <button
                          key={box.id || idx}
                          onClick={() => {
                            sound.playTone(600, 0.08);
                            setActiveBoxId(box.id);
                            speakBoxGuidance(box);
                          }}
                          className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold transition-all active:scale-95 border flex items-center gap-1.5 ${
                            isActive
                              ? isLoi
                                ? "bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300"
                                : isChuan
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300"
                                : "bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-300"
                              : isLoi
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              : isChuan
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          <span>{isLoi ? "❌" : isChuan ? "✅" : "⚠️"}</span>
                          <span>{box.chu} #{idx + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BẢNG SOI CHI TIẾT CON CHỮ ĐANG ĐƯỢC CHỌN (INSPECTOR CARD) */}
              {activeBox && (
                <div
                  ref={activeBoxCardRef}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all animate-in fade-in duration-300 ${
                    activeBox.loai === "loi"
                      ? "bg-rose-50/90 border-rose-200"
                      : activeBox.loai === "chuan"
                      ? "bg-emerald-50/90 border-emerald-200"
                      : "bg-amber-50/90 border-amber-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase text-white ${
                          activeBox.loai === "loi"
                            ? "bg-rose-600"
                            : activeBox.loai === "chuan"
                            ? "bg-emerald-600"
                            : "bg-amber-600"
                        }`}
                      >
                        {activeBox.loai === "loi"
                          ? "❌ Nét cần sửa"
                          : activeBox.loai === "chuan"
                          ? "✅ Nét chuẩn mẫu"
                          : "⚠️ Cần chú ý"}
                      </span>
                      <h4 className="text-sm font-black text-slate-900">
                        {activeBox.tieu_de} (Chữ: "{activeBox.chu}")
                      </h4>
                    </div>

                    <button
                      onClick={() => speakBoxGuidance(activeBox)}
                      className="min-h-[36px] px-3 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 border border-slate-200"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-violet-600" />
                      <span>Nghe cô sửa nét này</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <strong className="text-slate-800">Nhận xét của AI:</strong>{" "}
                      <span className="text-slate-700">{activeBox.nhan_xet}</span>
                    </div>
                    {activeBox.huong_dan_sua && (
                      <div>
                        <strong className="text-emerald-800">Cách sửa đúng:</strong>{" "}
                        <span className="text-emerald-950 font-medium">
                          {activeBox.huong_dan_sua}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Nút hành động đổi ảnh & chấm lại */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  onClick={handleReset}
                  disabled={isEvaluating}
                  className="min-h-[44px] px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Đổi ảnh khác</span>
                </button>

                <button
                  onClick={handleEvaluate}
                  disabled={isEvaluating}
                  className={`min-h-[44px] px-6 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
                    isEvaluating
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : "bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-200"
                  }`}
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang Chấm Bài...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Chấm Lại Bằng DeepSeek AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (5 CỘT): KẾT QUẢ SƯ PHẠM + 6 TIÊU CHÍ + LỜI KHUYÊN */}
          <div className="lg:col-span-5 space-y-4 min-w-0">
            {result ? (
              <div
                ref={resultRef}
                className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-emerald-200 shadow-2xl space-y-4 animate-in fade-in slide-in-from-right-4 duration-500"
              >
                {/* 1. Header điểm số tổng quát */}
                <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-br from-emerald-500 via-teal-600 to-indigo-600 text-white shadow-lg flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                      Kết Quả Đánh Giá Lớp 1
                    </span>
                    <h3 className="text-lg sm:text-xl font-black truncate">{result.xep_loai}</h3>
                    <p className="text-xs text-emerald-100 leading-relaxed line-clamp-3">
                      {result.nhan_xet_chung}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-white/20 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 min-w-[90px] border border-white/30 shrink-0">
                    <span className="text-[11px] font-bold text-emerald-100">Tổng điểm</span>
                    <span className="text-3xl font-black text-amber-300">
                      {result.tong_diem}
                    </span>
                    <span className="text-[10px] text-white/80">Thang 100</span>
                  </div>
                </div>

                {/* Nút nghe cô giáo đọc nhận xét toàn bài */}
                <div className="flex items-center justify-between bg-violet-50 p-3 rounded-2xl border border-violet-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <Volume2 className="w-4 h-4 text-violet-600 shrink-0" />
                    <span className="text-xs font-bold text-violet-900 truncate">
                      Nghe cô giáo đọc nhận xét:
                    </span>
                  </div>
                  <button
                    onClick={toggleSpeech}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0 ${
                      isSpeaking
                        ? "bg-rose-600 text-white animate-pulse"
                        : "bg-violet-600 hover:bg-violet-700 text-white"
                    }`}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isSpeaking ? "Dừng đọc" : "Nghe cô đọc"}</span>
                  </button>
                </div>

                {/* 2. Bảng 6 Tiêu chí sư phạm chi tiết */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-violet-600" />
                    <span>6 Tiêu Chí Chuẩn Lớp 1 (Thang 10)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      {
                        key: "dung_mau_chu",
                        label: "1. Đúng mẫu & Độ cao 2 ly",
                        val: result.tieu_chi.dung_mau_chu,
                      },
                      {
                        key: "do_deu_net",
                        label: "2. Độ đều nét & Lực bút",
                        val: result.tieu_chi.do_deu_net,
                      },
                      {
                        key: "khoang_cach",
                        label: "3. Khoảng cách chữ & tiếng",
                        val: result.tieu_chi.khoang_cach,
                      },
                      {
                        key: "do_thang_hang",
                        label: "4. Độ thẳng hàng trên ô ly",
                        val: result.tieu_chi.do_thang_hang,
                      },
                      {
                        key: "trinh_bay",
                        label: "5. Giữ vở sạch & Chữ đẹp",
                        val: result.tieu_chi.trinh_bay,
                      },
                      {
                        key: "net_co_ban",
                        label: "6. Nét nối, thắt & Dấu thanh",
                        val: result.tieu_chi.net_co_ban,
                      },
                    ].map((crit) => (
                      <div
                        key={crit.key}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-700 truncate pr-1">{crit.label}</span>
                          <span className="text-violet-700 font-black shrink-0">{crit.val}/10</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-violet-500 to-indigo-600 rounded-full transition-all duration-1000"
                            style={{ width: `${(crit.val / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Điểm sáng & Góp ý cải thiện */}
                <div className="space-y-2 pt-1">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                    <span className="text-xs font-black text-emerald-800 uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Điểm Sáng Đáng Khen Của Bé
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {result.diem_tot.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-emerald-600 font-black shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                    <span className="text-xs font-black text-amber-900 uppercase flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      Chỗ Cần Luyện Thêm Để Đẹp Hơn
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {result.loi_can_cai_thien.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-amber-600 font-black shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 4. Lời khuyên dành cho phụ huynh */}
                <div className="p-3.5 rounded-2xl bg-linear-to-r from-violet-50 to-indigo-50 border border-violet-200 flex items-start gap-2.5">
                  <span className="text-xl shrink-0">🏡</span>
                  <div className="text-xs space-y-0.5">
                    <span className="font-black text-violet-950 block">
                      Lời Khuyên Dành Cho Ba Mẹ:
                    </span>
                    <p className="text-slate-700 leading-relaxed">{result.nhan_xet_phu_huynh}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl">
                  🚀
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Sẵn sàng phân tích bài viết
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bấm nút <strong>"Chấm Lại Bằng DeepSeek AI"</strong> ở cột bên trái để bắt đầu đo từng nét chữ ô ly và nhận bảng điểm chi tiết!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CÀI ĐẶT API KEY (TÙY CHỌN NÂNG CAO) */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-violet-600" />
                Cài Đặt AI Vision (Tùy Chọn)
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>DeepSeek Flash Vision Đã Kích Hoạt Sẵn</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Hệ thống đã nạp sẵn khóa DeepSeek Flash Vision tốc độ cao. Bạn có thể sử dụng ngay mà không cần cấu hình thêm.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                API Key Riêng (DeepSeek hoặc OpenAI sk-...):
              </label>
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {customApiKey && (
                <button
                  onClick={handleClearApiKey}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 min-h-[44px]"
                >
                  Xóa Key
                </button>
              )}
              <button
                onClick={() => setShowSettings(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 min-h-[44px]"
              >
                Đóng
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs min-h-[44px]"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
