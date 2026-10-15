"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { LetterCardData } from "@/types/letter";
import { Volume2, Camera, CameraOff, Sparkles, CheckCircle2, Play, Pause } from "lucide-react";
import { sound } from "@/utils/speech";

interface MouthShapeGuideViewProps {
  currentLetter: LetterCardData;
}

export function MouthShapeGuideView({ currentLetter }: MouthShapeGuideViewProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
    setIsPlayingAudio(false);
  }, [currentLetter]);

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
        alert(
          "Không thể mở máy ảnh. Vui lòng cấp quyền truy cập Camera trên trình duyệt để sử dụng tính năng Gương Soi Khẩu Hình!"
        );
      }
    }
  };

  const toggleAudio = () => {
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

  return (
    <div className="w-full flex flex-col items-center py-3 sm:py-6 px-3 sm:px-6">
      <audio
        ref={audioRef}
        src={currentLetter.audio_url}
        onEnded={() => setIsPlayingAudio(false)}
        onError={() => setIsPlayingAudio(false)}
      />

      {/* Tiêu đề */}
      <div className="text-center mb-5">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-xs mb-1.5">
          <Sparkles className="w-4 h-4 text-rose-600" />
          Phòng Luyện Phát Âm & Khẩu Hình Chuẩn
        </span>
        <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">
          Khẩu Hình Khi Phát Âm <span className="text-rose-600 uppercase">"{currentLetter.name}"</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-xl mx-auto">
          Quan sát vị trí răng, môi, lưỡi và soi gương camera đối chiếu để bé sửa ngọng và tròn vành rõ chữ
        </p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* CỘT TRÁI: Hướng Dẫn Sư Phạm Chi Tiết */}
        <div className="space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-md">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-2xl shadow-xs">
                  {currentLetter.letter}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">{currentLetter.name}</h3>
                  <span className="text-xs text-slate-500 font-semibold">
                    {currentLetter.type === "vowel" ? "Nguyên âm" : "Phụ âm"} Tiếng Việt
                  </span>
                </div>
              </div>

              <button
                onClick={toggleAudio}
                className={`min-h-[44px] px-3.5 py-2 rounded-2xl font-bold flex items-center gap-2 border transition-all active:scale-95 shadow-xs ${
                  isPlayingAudio
                    ? "bg-rose-600 text-white animate-pulse border-rose-600"
                    : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                }`}
              >
                {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="text-xs font-bold">
                  {isPlayingAudio ? "Đang phát..." : "Nghe Cô Giảng"}
                </span>
              </button>
            </div>

            {/* Chi tiết khẩu hình trích từ sư phạm chuẩn */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <span className="text-2xl">👄</span>
                <div className="text-xs sm:text-sm">
                  <span className="font-bold text-slate-900 block mb-0.5">
                    Hướng dẫn khẩu hình chuẩn:
                  </span>
                  <p className="text-slate-600 leading-relaxed">{currentLetter.mouth_shape}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div className="text-xs sm:text-sm">
                  <span className="font-bold text-amber-900 block mb-0.5">
                    Mẹo giúp phụ huynh đồng hành cùng con:
                  </span>
                  <p className="text-amber-800 leading-relaxed">{currentLetter.parent_tip}</p>
                </div>
              </div>

              {/* Minh họa tranh chữ */}
              <div className="p-3.5 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-between">
                <div className="text-xs sm:text-sm">
                  <span className="font-bold text-violet-900 block">Từ vựng minh họa thẻ:</span>
                  <span className="text-base font-black text-violet-700 uppercase">
                    "{currentLetter.illu_word}"
                  </span>
                </div>
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-violet-200">
                  <Image
                    src={currentLetter.assets.illustration}
                    alt={currentLetter.illu_word}
                    fill
                    className="object-contain p-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: GƯƠNG SOI KHẨU HÌNH CAMERA (SPLIT-SCREEN INTERACTIVE) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-md flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
              <h3 className="font-black text-slate-800 text-sm sm:text-base">
                Gương Soi Khẩu Hình Bé (Camera)
              </h3>
            </div>
            <button
              onClick={toggleCamera}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-xs ${
                cameraActive
                  ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {cameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
              <span>{cameraActive ? "Tắt Camera" : "Bật Soi Gương"}</span>
            </button>
          </div>

          {/* Vùng Camera soi gương */}
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border-4 border-slate-100 shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                cameraActive ? "opacity-100" : "opacity-0 absolute"
              }`}
            />

            {!cameraActive && (
              <div className="flex flex-col items-center text-center p-6 text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-300">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Gương Camera đang tắt</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Bấm nút "Bật Soi Gương" ở trên để bé vừa đọc vừa nhìn thấy khuôn miệng của mình
                  </p>
                </div>
              </div>
            )}

            {/* Khung ngắm khuôn mặt */}
            {cameraActive && (
              <div className="absolute inset-4 border-2 border-dashed border-rose-400/60 rounded-3xl pointer-events-none flex items-center justify-center">
                <span className="text-[10px] font-bold bg-rose-600/80 text-white px-2 py-0.5 rounded-full backdrop-blur-xs absolute bottom-2">
                  Đặt khuôn mặt vào giữa khung
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
