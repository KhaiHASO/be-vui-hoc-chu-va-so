"use client";

import React, { useState, useEffect } from "react";
import { X, MapPin, ChevronRight, Activity } from "lucide-react";
import { RealAccessLog } from "@/types/visitor";

interface LiveActivityToastProps {
  onOpenModal: () => void;
}

export function LiveActivityToast({ onOpenModal }: LiveActivityToastProps) {
  const [latestLog, setLatestLog] = useState<RealAccessLog | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Tải lượt truy cập thật gần nhất từ server
    const fetchLatest = async () => {
      try {
        const res = await fetch("/api/visitor-logs?includeDev=0", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          const logs: RealAccessLog[] = json.logs || [];
          if (logs.length > 0) {
            setLatestLog(logs[0]);
            if (!isDismissed) {
              setIsVisible(true);
            }
          }
        }
      } catch {
        // Im lặng
      }
    };

    // Kiểm tra sau 4 giây khi vào web
    const initialTimer = setTimeout(fetchLatest, 4000);
    // Chu kỳ kiểm tra mỗi 30 giây
    const interval = setInterval(fetchLatest, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isDismissed]);

  // Tự ẩn sau 6 giây
  useEffect(() => {
    if (isVisible) {
      const autoHide = setTimeout(() => setIsVisible(false), 6000);
      return () => clearTimeout(autoHide);
    }
  }, [isVisible]);

  if (isDismissed || !isVisible || !latestLog) return null;

  return (
    <div className="fixed bottom-4 left-4 z-30 max-w-sm w-[calc(100vw-2rem)] sm:w-auto animate-in slide-in-from-bottom-5 duration-300">
      <div
        onClick={onOpenModal}
        className="cursor-pointer group p-3 bg-slate-900/95 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-indigo-500/40 hover:border-indigo-400 transition-all flex items-start gap-3 relative"
      >
        {/* Nút đóng */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
            setIsDismissed(true);
          }}
          className="min-h-[28px] min-w-[28px] p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 absolute top-2 right-2 flex items-center justify-center transition-all"
          title="Đóng thông báo"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Icon Live indicator */}
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-900/80 text-emerald-400 flex items-center justify-center font-bold text-base border border-indigo-700/50">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping" />
        </div>

        {/* Nội dung text thực tế */}
        <div className="min-w-0 flex-1 pr-4">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[11px] font-mono font-bold text-slate-300">
              {latestLog.maskedIp}
            </span>
            <span className="text-[10px] text-indigo-300 font-semibold truncate flex items-center">
              <MapPin className="w-2.5 h-2.5 mr-0.5 text-rose-400" />
              {latestLog.city}, {latestLog.region}
            </span>
          </div>

          <p className="text-xs font-bold text-white line-clamp-1">
            {latestLog.actionName}
          </p>

          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
            <span>{latestLog.device}</span>
            <span>•</span>
            <span className="font-mono text-emerald-400 font-bold">{latestLog.statusCode} OK</span>
            <span className="text-indigo-300 font-bold ml-auto flex items-center group-hover:translate-x-0.5 transition-transform">
              Nhật ký <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
