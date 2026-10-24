"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Users,
  Eye,
  Globe2,
  ShieldCheck,
  RefreshCw,
  Smartphone,
  Laptop,
  Tablet,
  Bot,
  Activity,
  MapPin,
  Clock,
  Radio,
  Trash2,
} from "lucide-react";
import { AccessLogApiResponse, RealAccessLog } from "@/types/visitor";

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
  const [data, setData] = useState<AccessLogApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showMyDevClicks, setShowMyDevClicks] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  const fetchRealLogs = async (includeDev: boolean) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/visitor-logs?includeDev=${includeDev ? "1" : "0"}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setNowMs(Date.now());
      }
    } catch (err) {
      console.error("Lỗi khi tải nhật ký truy cập thực tế:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sạch toàn bộ lịch sử truy cập về 0 không?")) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/visitor-logs", { method: "DELETE" });
      if (res.ok) {
        await fetchRealLogs(showMyDevClicks);
      }
    } catch (err) {
      console.error("Lỗi khi xóa lịch sử truy cập:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRealLogs(showMyDevClicks);
      const interval = setInterval(() => {
        fetchRealLogs(showMyDevClicks);
      }, 10000); // 10s cập nhật 1 lần
      return () => clearInterval(interval);
    }
  }, [isOpen, showMyDevClicks]);

  // Cập nhật relative time mỗi 5 giây
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setNowMs(Date.now()), 5000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatRelativeTime = (timestamp: number) => {
    const diffSec = Math.max(1, Math.floor((nowMs - timestamp) / 1000));
    if (diffSec < 60) return `${diffSec} giây trước`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    return `${Math.floor(diffHour / 24)} ngày trước`;
  };

  const logs = (data?.logs || []).filter((item) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "ai") return item.actionType === "ai_grader";
    if (selectedFilter === "writing") return item.actionType === "writing_practice";
    if (selectedFilter === "math") return item.actionType === "math_game";
    if (selectedFilter === "page") return item.actionType === "page_view" || item.actionType === "letter_view";
    return true;
  });

  const getDeviceIcon = (device: RealAccessLog["device"]) => {
    if (device === "Bot Tìm kiếm") return <Bot className="w-4 h-4 text-purple-500" />;
    if (device === "iPad / Máy tính bảng") return <Tablet className="w-4 h-4 text-sky-500" />;
    if (device === "Điện thoại Di động") return <Smartphone className="w-4 h-4 text-emerald-500" />;
    return <Laptop className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[92dvh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* 1. HEADER MODAL */}
        <div className="p-4 sm:p-5 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-bold text-xl shrink-0 shadow-inner text-emerald-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight truncate">
                  Nhật Ký Truy Cập Thời Gian Thực (Live Access Log)
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Real HTTP Data 100%
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate">
                Ghi nhận địa chỉ IP, Vị trí địa lý GeoIP, Thiết bị & Hành động thực tế của người dùng
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

        {/* 2. THANH KIỂM SOÁT BỘ LỌC CHỦ SẢN PHẨM / KỸ SƯ */}
        <div className="px-4 py-3 bg-amber-50/90 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-amber-950">Chế độ Chủ sản phẩm / Dev:</span>
                {data?.clientIp && (
                  <span className="font-mono text-[11px] bg-amber-200/60 px-1.5 py-0.2 rounded text-amber-900 font-bold">
                    IP: {data.clientIp} • {data.clientLocation}
                  </span>
                )}
              </div>
              <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                {isOwnerExcluded
                  ? "✓ Đang kích hoạt: Mọi truy cập và click của bạn ĐÃ BỊ LOẠI TRỪ khỏi tổng lượt xem và nhật ký để đảm bảo tính khách quan."
                  : "Chưa kích hoạt: Các click của bạn đang được tính như khách thông thường."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle hiển thị click của Dev để test */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none bg-white/80 hover:bg-white px-2.5 py-1.5 rounded-xl border border-amber-300 text-amber-900 font-bold text-[11px]">
              <input
                type="checkbox"
                checked={showMyDevClicks}
                onChange={(e) => setShowMyDevClicks(e.target.checked)}
                className="rounded text-violet-600 focus:ring-violet-500 w-3.5 h-3.5"
              />
              <span>Hiện cả click của tôi (Test live)</span>
            </label>

            <button
              onClick={() => onToggleOwnerExcluded(!isOwnerExcluded)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl font-bold transition-all active:scale-95 text-xs flex items-center gap-1 ${
                isOwnerExcluded
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  : "bg-amber-300 hover:bg-amber-400 text-amber-950"
              }`}
            >
              <span>{isOwnerExcluded ? "Đang Loại Trừ (Bật)" : "Bật Loại Trừ"}</span>
            </button>
          </div>
        </div>

        {/* 3. BẢNG THỐNG KÊ THỰC TẾ (4 REAL STATS CARDS) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Card 1: Người online thực tế */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 relative">
                <Users className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                  {data?.stats.activeNow ?? 1}
                </div>
                <div className="text-xs font-bold text-emerald-600 truncate">Đang online (5 phút)</div>
              </div>
            </div>

            {/* Card 2: Tổng lượt truy cập thật */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                  {(data?.stats.totalVisits ?? 0).toLocaleString()}
                </div>
                <div className="text-xs font-semibold text-slate-500 truncate">Tổng lượt thật ghi nhận</div>
              </div>
            </div>

            {/* Card 3: IP duy nhất */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                  {(data?.stats.uniqueIpsCount ?? 0).toLocaleString()}
                </div>
                <div className="text-xs font-semibold text-slate-500 truncate">Địa chỉ IP duy nhất</div>
              </div>
            </div>

            {/* Card 4: Tỉnh / Thành phố */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                <Globe2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                  {data?.stats.uniqueProvincesCount ?? 1} Khu vực
                </div>
                <div className="text-xs font-semibold text-slate-500 truncate">Định vị GeoIP</div>
              </div>
            </div>
          </div>

          {/* BỘ LỌC DANH MỤC HOẠT ĐỘNG */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-500 shrink-0 mr-1">Lọc:</span>
            {[
              { id: "all", label: "Tất cả lưu lượng" },
              { id: "page", label: "📖 Học Chữ & Đọc Âm" },
              { id: "writing", label: "✍️ Bé Tập Viết Ô Ly" },
              { id: "ai", label: "🤖 AI Chấm & Soi Nét" },
              { id: "math", label: "🔢 Toán Học Singapore" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
                  selectedFilter === tab.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. BẢNG DỮ LIỆU NHẬT KÝ TRUY CẬP THỰC TẾ (REAL LOGS STREAM) */}
        <div className="flex-1 min-w-0 p-3 sm:p-4 overflow-y-auto space-y-2">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-40 animate-pulse" />
              <p className="text-sm font-semibold">Chưa có lượt truy cập nào trong danh mục này</p>
              <p className="text-xs text-slate-400 mt-1">
                {isOwnerExcluded && !showMyDevClicks
                  ? "(Lượt của bạn đang bị ẩn vì đã bật Chế độ Chủ web. Hãy tích vào 'Hiện cả click của tôi' để xem)."
                  : "Dữ liệu sẽ tự động xuất hiện khi có người dùng truy cập."}
              </p>
            </div>
          ) : (
            logs.map((log) => {
              return (
                <div
                  key={log.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    log.isDev
                      ? "bg-amber-50/60 border-amber-200/90 hover:bg-amber-50"
                      : "bg-white border-slate-200 hover:bg-slate-50 shadow-2xs"
                  }`}
                >
                  {/* Cột 1: Icon & Thông tin tương tác */}
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 font-bold text-base mt-0.5 shadow-2xs">
                      {getDeviceIcon(log.device)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          {log.maskedIp}
                        </span>

                        <span className="text-xs font-bold text-indigo-700 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>
                            {log.city}, {log.region}
                          </span>
                        </span>

                        <span className="text-[11px] text-slate-400 font-semibold truncate hidden sm:inline">
                          ({log.isp})
                        </span>

                        {log.isDev && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300">
                            Chủ web / Dev
                          </span>
                        )}

                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {log.statusCode || 200} OK
                        </span>
                      </div>

                      <div className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">
                        {log.actionName}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-0.5">
                        <span className="truncate">
                          {log.os} • {log.browser}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-400 truncate">{log.path}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cột 2: Mốc thời gian */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 text-[11px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      <span>{formatRelativeTime(log.timestamp)}</span>
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{log.timeStr}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 5. FOOTER MODAL */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Tự động cập nhật thời gian thực mỗi 10 giây</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearAll}
              disabled={isLoading}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Xóa toàn bộ lịch sử truy cập về 0"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Xóa full lịch sử</span>
              <span className="sm:hidden">Xóa hết</span>
            </button>
            <button
              onClick={() => fetchRealLogs(showMyDevClicks)}
              disabled={isLoading}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
              <span>{isLoading ? "Đang nạp..." : "Làm mới"}</span>
            </button>
            <button
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-black transition-all shadow-xs"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
