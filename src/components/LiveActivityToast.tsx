"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, MapPin, ChevronRight } from "lucide-react";
import { VisitorLogEntry } from "@/types/visitor";

interface LiveActivityToastProps {
  onOpenModal: () => void;
}

const SAMPLE_LIVE_ACTIVITIES = [
  {
    institution: "Tiểu học Chu Văn An (Tây Hồ)",
    location: "Hà Nội",
    action: "Cô giáo vừa chấm 1 bài viết chữ đẹp bằng AI",
    score: "94/100",
    time: "Vừa xong",
    icon: "🤖",
  },
  {
    institution: "Tiểu học Lương Định Của (Quận 3)",
    location: "TP. Hồ Chí Minh",
    action: "Bé hoàn thành 3 dòng tập viết ô ly chữ 'a'",
    score: "⭐⭐⭐",
    time: "2 phút trước",
    icon: "✍️",
  },
  {
    institution: "Tiểu học Phù Đổng (Hải Châu)",
    location: "Đà Nẵng",
    action: "Bé vừa hoàn thành thử thách Cân thăng bằng số 10",
    score: "10/10 sao",
    time: "3 phút trước",
    icon: "🔢",
  },
  {
    institution: "Tiểu học Đinh Tiên Hoàng",
    location: "Hải Phòng",
    action: "Phụ huynh vừa cho bé luyện nét khuyết trên",
    score: "⭐⭐⭐",
    time: "4 phút trước",
    icon: "✨",
  },
  {
    institution: "Tiểu học Mạc Đĩnh Chi",
    location: "Cần Thơ",
    action: "Bé vừa khám phá thẻ học âm ghép 'ngh'",
    score: "Đã nghe",
    time: "5 phút trước",
    icon: "🎴",
  },
];

export function LiveActivityToast({ onOpenModal }: LiveActivityToastProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissedPermanently, setIsDismissedPermanently] = useState(false);

  useEffect(() => {
    // Hiện thông báo đầu tiên sau 3.5s
    const firstTimer = setTimeout(() => {
      if (!isDismissedPermanently) {
        setIsVisible(true);
      }
    }, 3500);

    // Chu kỳ hiển thị mỗi 28 giây
    const interval = setInterval(() => {
      if (!isDismissedPermanently) {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentIdx((prev) => (prev + 1) % SAMPLE_LIVE_ACTIVITIES.length);
          setIsVisible(true);
        }, 800);
      }
    }, 28000);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, [isDismissedPermanently]);

  // Tự ẩn sau 7 giây
  useEffect(() => {
    if (isVisible) {
      const autoHide = setTimeout(() => {
        setIsVisible(false);
      }, 7000);
      return () => clearTimeout(autoHide);
    }
  }, [isVisible]);

  if (isDismissedPermanently || !isVisible) return null;

  const item = SAMPLE_LIVE_ACTIVITIES[currentIdx];

  return (
    <div className="fixed bottom-4 left-4 z-30 max-w-sm w-[calc(100vw-2rem)] sm:w-auto animate-in slide-in-from-bottom-5 duration-300">
      <div
        onClick={onOpenModal}
        className="cursor-pointer group p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-violet-200/90 hover:border-violet-400 hover:shadow-2xl transition-all flex items-start gap-3 relative"
      >
        {/* Nút đóng */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          className="min-h-[28px] min-w-[28px] p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 absolute top-2 right-2 flex items-center justify-center transition-all"
          title="Đóng thông báo"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Icon & Live indicator */}
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-base shadow-inner">
            {item.icon}
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white animate-ping" />
        </div>

        {/* Nội dung text */}
        <div className="min-w-0 flex-1 pr-4">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[11px] font-bold text-slate-800 truncate">
              {item.institution}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold truncate flex items-center">
              <MapPin className="w-2.5 h-2.5 mr-0.5" />
              {item.location}
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-600 line-clamp-1 leading-snug">
            {item.action}
          </p>

          <div className="flex items-center gap-2 mt-1">
            {item.score && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-100 text-amber-800">
                {item.score}
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-medium">{item.time}</span>
            <span className="text-[10px] font-bold text-violet-600 ml-auto flex items-center group-hover:translate-x-0.5 transition-transform">
              Xem nhật ký <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
