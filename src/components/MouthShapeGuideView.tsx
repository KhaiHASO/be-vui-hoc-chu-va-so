"use client";

import React, { useState, useRef } from "react";
import { LetterCardData } from "@/types/letter";
import { Volume2, Camera, CameraOff, Sparkles, CheckCircle2, Info, Eye } from "lucide-react";
import { sound } from "@/utils/speech";

interface MouthShapeGuideViewProps {
  currentLetter: LetterCardData;
}

export function MouthShapeGuideView({ currentLetter }: MouthShapeGuideViewProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const toggleCamera = async () => {
    sound.playTone(493.88, 0.1);
    if (cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } catch (err) {
        console.warn("Camera access denied or not available", err);
        alert("Không thể mở máy ảnh. Vui lòng cấp quyền truy cập Camera trên trình duyệt để sử dụng tính năng Gương Soi Khẩu Hình!");
      }
    }
  };

  const speakGuide = () => {
    sound.playTone(523.25, 0.15);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        `Hướng dẫn phát âm ${currentLetter.soundName}. Khẩu hình môi: ${currentLetter.pronunciation.mouthShape}. Vị trí lưỡi: ${currentLetter.pronunciation.tonguePosition}. Luồng hơi: ${currentLetter.pronunciation.vocalAirflow}`
      );
      u.lang = "vi-VN";
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-4 px-2 sm:px-4">
      {/* Tiêu đề */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-xs mb-2">
          <Sparkles className="w-4 h-4 text-rose-600" />
          Phòng Luyện Phát Âm & Khẩu Hình Chuẩn
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tight">
          Khẩu Hình Miệng Khi Đọc <span className="text-rose-600 uppercase">"{currentLetter.soundName}"</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mx-auto">
          Quan sát vị trí răng, môi, lưỡi và soi gương camera để bé sửa ngọng và phát âm tròn vành rõ chữ
        </p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* CỘT TRÁI: Hướng Dẫn Sư Phạm Chi Tiết */}
        <div className="space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-2xl">
                  {currentLetter.upper}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">{currentLetter.soundName}</h3>
                  <span className="text-xs text-slate-400 font-semibold">Chuẩn âm vị tiếng Việt</span>
                </div>
              </div>
              <button
                onClick={speakGuide}
                className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-bold flex items-center gap-2 border border-rose-200 shadow-xs transition-all"
              >
                <Volume2 className="w-4 h-4" />
                <span className="text-xs font-bold">Nghe cô giảng</span>
              </button>
            </div>

            {/* 3 Yếu tố cốt lõi của khẩu hình */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <span className="text-xl">👄</span>
                <div className="text-xs sm:text-sm">
                  <span className="font-bold text-slate-900 block mb-0.5">1. Hình dáng môi:</span>
                  <span className="text-slate-600 leading-relaxed">{currentLetter.pronunciation.mouthShape}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <span className="text-xl">👅</span>
                <div className="text-xs sm:text-sm">
                  <span className="font-bold text-slate-900 block mb-0.5">2. Vị trí lưỡi & răng:</span>
                  <span className="text-slate-600 leading-relaxed">{currentLetter.pronunciation.tonguePosition}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <span className="text-xl">💨</span>
                <div className="text-xs sm:text-sm">
                  <span className="font-bold text-slate-900 block mb-0.5">3. Luồng hơi & Dây thanh:</span>
                  <span className="text-slate-600 leading-relaxed">{currentLetter.pronunciation.vocalAirflow}</span>
                </div>
              </div>
            </div>

            {/* Mẹo đồng hành cùng bé */}
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Lời khuyên của cô giáo:</span>{" "}
                <span>{currentLetter.pronunciation.guideTips}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Gương Soi Camera Đối Chiếu Khẩu Hình */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-md flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-between mb-3">
            <span className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-violet-600" />
              Gương Soi Khẩu Hình Camera
            </span>
            <button
              onClick={toggleCamera}
              className={`min-h-[44px] px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-xs ${
                cameraActive
                  ? "bg-rose-100 text-rose-700 border border-rose-300"
                  : "bg-violet-600 text-white hover:bg-violet-700 shadow-md"
              }`}
            >
              {cameraActive ? (
                <>
                  <CameraOff className="w-4 h-4" />
                  Tắt gương soi
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Bật gương soi khẩu hình
                </>
              )}
            </button>
          </div>

          {/* Màn hình Camera hoặc Placeholder */}
          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-200 relative flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] ${cameraActive ? "block" : "hidden"}`}
            />

            {!cameraActive && (
              <div className="p-6 text-slate-400 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                  <Camera className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-300">Gương soi đang tắt</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Bật gương soi để bé nhìn thấy khẩu hình miệng của mình ngay trên màn hình trong khi đọc
                </p>
              </div>
            )}

            {cameraActive && (
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs px-3 py-1 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Bé hãy nhìn vào gương và mở khẩu hình "{currentLetter.soundName}" nhé
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-3">
            🔒 Hình ảnh camera chỉ hiển thị trực tiếp trên trình duyệt máy bạn, tuyệt đối không gửi lên máy chủ.
          </p>
        </div>
      </div>
    </div>
  );
}
