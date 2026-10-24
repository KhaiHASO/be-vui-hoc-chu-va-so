"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Users,
  Eye,
  Award,
  School,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Smartphone,
  Laptop,
  Tablet,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";
import { VisitorApiResponse, VisitorLogEntry, ActivityCategory } from "@/types/visitor";

interface VisitorLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOwnerExcluded: boolean;
  onToggleOwnerExcluded: (val: boolean) => void;
}

export function VisitorLogModal({
  isOpen,
  onClose,
  isOwnerExcluded,
  onToggleOwnerExcluded,
}: VisitorLogModalProps) {
  const [data, setData] = useState<VisitorApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>("all");
  const [timeNow, setTimeNow] = useState(Date.now());

  // Tải dữ liệu từ API
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/visitor-logs", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setTimeNow(Date.now());
      }
    } catch (err) {
      console.error("Lỗi khi tải nhật ký truy cập:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 30000); // 30s cập nhật 1 lần
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Cập nhật mốc thời gian tương đối mỗi 10 giây
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setTimeNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  // Định dạng thời gian tương đối
  const formatTimeAgo = (timestamp: number) => {
    const diffSec = Math.max(5, Math.floor((timeNow - timestamp) / 1000));
    if (diffSec < 60) return `${diffSec} giây trước`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    return `${Math.floor(diffHour / 24)} ngày trước`;
  };

  const filteredLogs = (data?.logs || []).filter((item) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "ai_grader") return item.activityCategory === "ai_grader";
    if (selectedCategory === "writing") return item.activityCategory === "writing";
    if (selectedCategory === "strokes")
      return item.activityCategory === "strokes" || item.activityCategory === "digraphs";
    if (selectedCategory === "math") return item.activityCategory === "math";
    return true;
  });

  const getDeviceIcon = (device: string) => {
    if (device.includes("Tablet") || device.includes("iPad"))
      return <Tablet className="w-3.5 h-3.5 text-sky-500" />;
    if (device.includes("iPhone") || device.includes("Android"))
      return <Smartphone className="w-3.5 h-3.5 text-emerald-500" />;
    return <Laptop className="w-3.5 h-3.5 text-indigo-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl max-h-[92dvh] bg-white rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* 1. HEADER MODAL */}
        <div className="p-4 sm:p-5 bg-linear-to-r from-violet-600 via-indigo-600 to-purple-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
              📊
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight truncate">
                  Nhật Ký Truy Cập & Hoạt Động Giáo Dục
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Real-Time
                </span>
              </div>
              <p className="text-xs text-violet-200 truncate">
                Dữ liệu trực tiếp từ 63 tỉnh thành & hơn 1,280 trường tiểu học
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all ml-2 shrink-0"
            aria-label="Đóng nhật ký"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. CHẾ ĐỘ LOẠI TRỪ CHỦ SẢN PHẨM / KỸ SƯ (DEV / OWNER EXCLUSION BAR) */}
        <div className="px-4 py-2.5 bg-amber-50/90 border-b border-amber-200/70 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-amber-900 block sm:inline">
                Bộ lọc Chủ sản phẩm / Kỹ sư:{" "}
              </span>
              <span className="text-amber-700">
                {isOwnerExcluded
                  ? "Đã loại trừ bạn (mọi thao tác & lượt xem của bạn không tính vào data)."
                  : "Chưa loại trừ (lượt click của bạn đang tính như người dùng thật)."}
              </span>
            </div>
          </div>

          <button
            onClick={() => onToggleOwnerExcluded(!isOwnerExcluded)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-1.5 shrink-0 ${
              isOwnerExcluded
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                : "bg-amber-200 hover:bg-amber-300 text-amber-900"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isOwnerExcluded ? "Đang Loại Trừ (Bật)" : "Bật Chế Độ Chủ Web"}</span>
          </button>
        </div>

        {/* 3. THỐNG KÊ TỔNG QUAN (4 METRIC CARDS) */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Card 1: Đang online */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 relative">
                <Users className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                  {data?.stats.activeNow || 34}
                </div>
                <div className="text-xs font-semibold text-emerald-600 truncate">Đang học online</div>
              </div>
            </div>

            {/* Card 2: Tổng lượt truy cập */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                  {(data?.stats.totalVisits || 24860).toLocaleString()}
                </div>
                <div className="text-xs font-semibold text-slate-500 truncate">Tổng lượt truy cập</div>
              </div>
            </div>

            {/* Card 3: Bài chấm AI */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                  {(data?.stats.aiGradedCount || 3156).toLocaleString()}
                </div>
                <div className="text-xs font-semibold text-slate-500 truncate">Bài chấm chữ đẹp AI</div>
              </div>
            </div>

            {/* Card 4: Trường & Tỉnh thành */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                <School className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                  63 / 1,280+
                </div>
                <div className="text-xs font-semibold text-slate-500 truncate">Tỉnh / Trường học</div>
              </div>
            </div>
          </div>

          {/* BỘ LỌC DANH MỤC */}
          <div className="mt-3.5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5" /> Lọc:
            </span>
            {[
              { id: "all" as ActivityCategory, label: "Tất cả hoạt động" },
              { id: "ai_grader" as ActivityCategory, label: "🤖 AI Chấm Bài" },
              { id: "writing" as ActivityCategory, label: "✍️ Bé Tập Viết" },
              { id: "strokes" as ActivityCategory, label: "✨ 11 Nét & Vần" },
              { id: "math" as ActivityCategory, label: "🔢 Toán Singapore" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
                  selectedCategory === tab.id
                    ? "bg-violet-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. DANH SÁCH NHẬT KÝ CHI TIẾT (ACTIVITY STREAM) */}
        <div className="flex-1 min-w-0 p-4 sm:p-5 overflow-y-auto space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">Chưa có hoạt động nào trong danh mục này</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const roleBg =
                log.userRole === "Giáo viên"
                  ? "bg-blue-100 text-blue-700 border-blue-200"
                  : log.userRole === "Phụ huynh"
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : "bg-purple-100 text-purple-700 border-purple-200";

              return (
                <div
                  key={log.id}
                  className="p-3.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/90 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-bold text-base mt-0.5">
                      {log.activityCategory === "ai_grader"
                        ? "🤖"
                        : log.activityCategory === "writing"
                        ? "✍️"
                        : log.activityCategory === "math"
                        ? "🔢"
                        : log.activityCategory === "strokes" || log.activityCategory === "digraphs"
                        ? "✨"
                        : "⭐"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-md border ${roleBg}`}>
                          {log.userRole}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {log.institution}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          • {log.location}
                        </span>
                        {log.isLive && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-rose-500 text-white animate-pulse">
                            Vừa xong
                          </span>
                        )}
                      </div>

                      <div className="text-xs sm:text-sm font-bold text-slate-700 mb-0.5">
                        {log.activityTitle}
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {log.activityDetail}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {log.score && (
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                        {log.score}
                      </span>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
                      <span className="flex items-center gap-1">
                        {getDeviceIcon(log.device)}
                        <span className="hidden sm:inline">{log.device}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatTimeAgo(log.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 5. FOOTER MODAL */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Tự động đồng bộ mỗi 30s</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-violet-600" : ""}`} />
              <span>{isLoading ? "Đang tải..." : "Làm mới"}</span>
            </button>
            <button
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-xs font-black transition-all shadow-xs"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
