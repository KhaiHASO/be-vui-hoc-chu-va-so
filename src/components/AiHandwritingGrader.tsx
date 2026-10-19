"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { HandwritingEvaluationResult } from "@/types/letter";
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
} from "lucide-react";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";

export function AiHandwritingGrader() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [result, setResult] = useState<HandwritingEvaluationResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống kết quả khi chấm xong
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  // Khôi phục custom API key từ localStorage (nếu có)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("custom_openai_key");
      if (savedKey) setCustomApiKey(savedKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("custom_openai_key", customApiKey.trim());
      sound.playTone(523.25, 0.08);
      setShowSettings(false);
    }
  };

  const handleClearApiKey = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("custom_openai_key");
      setCustomApiKey("");
      sound.playTone(440, 0.08);
      setShowSettings(false);
    }
  };

  // Chọn ảnh từ máy tính / thư viện
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sound.playTone(440, 0.08);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Thử ngay với ảnh bài thi mẫu thực tế của học sinh lớp 1
  const handleUseSampleImage = () => {
    sound.playTone(523.25, 0.08);
    setSelectedImage("/data/samples/bai_thi_viet_mau.jpg");
    setResult(null);
  };

  // Kích hoạt đánh giá bài viết
  const handleEvaluate = async () => {
    if (!selectedImage) return;

    sound.playTone(587.33, 0.1);
    setIsEvaluating(true);
    setResult(null);

    try {
      const res = await fetch("/api/evaluate-handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage,
          apiKey: customApiKey.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Lỗi khi kết nối đến dịch vụ AI");
      }

      const data: HandwritingEvaluationResult = await res.json();
      setResult(data);

      if (data.anh_hop_le && data.tong_diem >= 80) {
        confetti({
          particleCount: 40,
          spread: 60,
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

  // Đọc nhận xét bằng giọng cô giáo tiếng Việt
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

  // Reset xóa ảnh làm lại
  const handleReset = () => {
    sound.playTone(440, 0.08);
    setSelectedImage(null);
    setResult(null);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

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
      <div className="w-full max-w-4xl text-center mb-5">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-linear-to-r from-violet-100 to-indigo-100 text-violet-800 border border-violet-200 shadow-xs">
            <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
            Công Nghệ Trí Tuệ Nhân Tạo Tiểu Học 4.0
          </span>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all"
            title="Cài đặt khóa API (Tùy chọn)"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">
          AI Chấm Điểm & Nhận Xét Bài Viết Chữ Đẹp
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl mx-auto leading-relaxed">
          Tải ảnh trang vở ô ly hoặc bài thi viết chữ đẹp của bé. Trí tuệ nhân tạo sẽ chấm điểm theo 6 tiêu chí sư phạm lớp 1 và hướng dẫn cụ thể từng con chữ.
        </p>
      </div>

      {/* KHUNG THAO TÁC CHÍNH */}
      <div className="w-full max-w-3xl space-y-4">
        {/* Nút thao tác nhanh khi chưa có ảnh hoặc muốn đổi ảnh */}
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

          <button
            onClick={handleUseSampleImage}
            className="min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs active:scale-95 transition-all"
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Xem Bài Thi Mẫu Lớp 1</span>
          </button>
        </div>

        {/* Khung hiển thị ảnh đã chọn & Nút chấm điểm */}
        {selectedImage && (
          <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-indigo-100 shadow-xl space-y-4">
            <div className="relative w-full max-h-[380px] sm:max-h-[450px] aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
              <Image
                src={selectedImage}
                alt="Bài viết của học sinh"
                fill
                className="object-contain p-2"
                unoptimized
              />

              {/* Hiệu ứng quét tia Laser khi AI đang phân tích */}
              {isEvaluating && (
                <div className="absolute inset-0 bg-violet-500/10 backdrop-blur-[1px] flex flex-col items-center justify-center">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent absolute top-1/2 -translate-y-1/2 animate-bounce" />
                  <div className="bg-white/95 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-violet-200">
                    <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                    <span className="text-sm font-black text-slate-800">
                      AI đang quan sát từng con chữ & dòng kẻ...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Thanh công cụ dưới ảnh */}
            <div className="flex flex-wrap items-center justify-between gap-3">
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
                className={`min-h-[44px] px-6 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
                  isEvaluating
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-200"
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
                    <span>Bắt Đầu Nhận Xét & Chấm Điểm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Khung hướng dẫn chụp ảnh khi chưa có ảnh */}
        {!selectedImage && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm text-center space-y-3">
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

        {/* KẾT QUẢ ĐÁNH GIÁ CỦA AI */}
        {result && (
          <div
            ref={resultRef}
            className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-emerald-200 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-20"
          >
            {/* 1. Header điểm số tổng quát */}
            <div className="p-4 sm:p-6 rounded-3xl bg-linear-to-br from-emerald-500 via-teal-600 to-indigo-600 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs">
                  Kết Quả Đánh Giá Sư Phạm
                </span>
                <h3 className="text-xl sm:text-2xl font-black">{result.xep_loai}</h3>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-lg leading-relaxed">
                  {result.nhan_xet_chung}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center bg-white/20 backdrop-blur-md rounded-2xl p-3 sm:p-4 min-w-[100px] border border-white/30 shrink-0">
                <span className="text-xs font-bold text-emerald-100">Tổng điểm</span>
                <span className="text-3xl sm:text-4xl font-black text-amber-300">
                  {result.tong_diem}
                </span>
                <span className="text-[10px] text-white/80">Thang 100</span>
              </div>
            </div>

            {/* Nút nghe cô giáo đọc nhận xét */}
            <div className="flex items-center justify-between bg-violet-50 p-3.5 rounded-2xl border border-violet-100">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-violet-600" />
                <span className="text-xs sm:text-sm font-bold text-violet-900">
                  Lắng nghe cô giáo đọc nhận xét bài thi:
                </span>
              </div>
              <button
                onClick={toggleSpeech}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                  isSpeaking
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-violet-600 hover:bg-violet-700 text-white"
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isSpeaking ? "Dừng đọc" : "Nghe cô đọc"}</span>
              </button>
            </div>

            {/* 2. Bảng 6 Tiêu chí sư phạm chi tiết */}
            <div className="space-y-2">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-violet-600" />
                <span>Bảng Điểm 6 Tiêu Chí Chuẩn Lớp 1 (Thang 10)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: "dung_mau_chu", label: "1. Đúng mẫu & Độ cao con chữ", val: result.tieu_chi.dung_mau_chu },
                  { key: "do_deu_net", label: "2. Độ đều nét & Lực tay cầm bút", val: result.tieu_chi.do_deu_net },
                  { key: "khoang_cach", label: "3. Khoảng cách chữ cái & tiếng", val: result.tieu_chi.khoang_cach },
                  { key: "do_thang_hang", label: "4. Độ thẳng hàng trên dòng kẻ ô ly", val: result.tieu_chi.do_thang_hang },
                  { key: "trinh_bay", label: "5. Trình bày sạch sẽ, giữ vở đẹp", val: result.tieu_chi.trinh_bay },
                  { key: "net_co_ban", label: "6. Nét nối, nét thắt & Dấu thanh", val: result.tieu_chi.net_co_ban },
                ].map((crit) => (
                  <div key={crit.key} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">{crit.label}</span>
                      <span className="text-violet-700 font-black">{crit.val}/10</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <span className="text-xs font-black text-emerald-800 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Điểm Sáng Đáng Khen Của Bé
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {result.diem_tot.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-emerald-600 font-black shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <span className="text-xs font-black text-amber-900 uppercase flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  Chỗ Cần Luyện Thêm Để Đẹp Hơn
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {result.loi_can_cai_thien.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="text-amber-600 font-black shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 4. Nhận xét chi tiết trên từng con chữ (Ví dụ minh họa thực tế) */}
            {result.vi_du_minh_hoa && result.vi_du_minh_hoa.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Chi Tiết Từng Con Chữ Trên Bài Thi</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {result.vi_du_minh_hoa.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-1">
                        <span className="font-black text-indigo-900 text-sm">Chữ: "{ex.chu}"</span>
                        <span className="text-[10px] bg-white text-indigo-700 px-2 py-0.5 rounded-full font-bold shadow-2xs">
                          Mẫu quan sát #{idx + 1}
                        </span>
                      </div>
                      <p className="text-slate-700">
                        <strong className="text-slate-900">Nhận xét:</strong> {ex.nhan_xet}
                      </p>
                      {ex.sai_o_dau && (
                        <p className="text-rose-700">
                          <strong>Lưu ý:</strong> {ex.sai_o_dau}
                        </p>
                      )}
                      {ex.can_cai_thien && (
                        <p className="text-emerald-700 font-medium">
                          <strong>Mẹo sửa:</strong> {ex.can_cai_thien}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Mẹo sư phạm dành cho phụ huynh */}
            <div className="p-4 rounded-2xl bg-linear-to-r from-violet-50 to-indigo-50 border border-violet-200 flex items-start gap-3">
              <span className="text-2xl shrink-0">🏡</span>
              <div className="text-xs sm:text-sm space-y-1">
                <span className="font-black text-violet-950 block">
                  Lời Khuyên Dành Riêng Cho Ba Mẹ:
                </span>
                <p className="text-slate-700 leading-relaxed">{result.nhan_xet_phu_huynh}</p>
              </div>
            </div>
          </div>
        )}
      </div>

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
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Mặc định hệ thống đã tích hợp sẵn AI sư phạm. Nếu bạn muốn sử dụng khóa riêng (OpenAI API Key), có thể điền bên dưới (chỉ lưu trên trình duyệt của bạn).
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                OpenAI API Key (sk-...):
              </label>
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {customApiKey && (
                <button
                  onClick={handleClearApiKey}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50"
                >
                  Xóa Key
                </button>
              )}
              <button
                onClick={() => setShowSettings(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
              >
                Đóng
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs"
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
