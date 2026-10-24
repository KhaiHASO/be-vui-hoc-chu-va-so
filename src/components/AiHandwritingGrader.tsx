"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  Camera,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  Sparkles,
  BookOpen,
  Eye,
  X,
  Maximize2,
  Crosshair,
  Move,
  Plus,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { HandwritingEvaluationResult, HandwritingBoundingBox } from "@/types/letter";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bbColor(loai: HandwritingBoundingBox["loai"]) {
  if (loai === "loi") {
    return {
      border: "#ef4444",
      bg: "rgba(239, 68, 68, 0.20)",
      label: "bg-red-600 text-white",
      badge: "bg-red-100 text-red-700 border-red-200",
      text: "Lỗi cần sửa",
      dot: "bg-red-500",
      icon: "❌",
    };
  }
  if (loai === "chu_y") {
    return {
      border: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.20)",
      label: "bg-amber-600 text-white",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      text: "Cần chú ý",
      dot: "bg-amber-500",
      icon: "⚠️",
    };
  }
  return {
    border: "#10b981",
    bg: "rgba(16, 185, 129, 0.20)",
    label: "bg-emerald-600 text-white",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    text: "Chuẩn đẹp",
    dot: "bg-emerald-500",
    icon: "✅",
  };
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AiHandwritingGrader() {
  // Upload state
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Evaluation state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HandwritingEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Result view state — Zoom level: 1.0 = fit to container width, 2.5 = 250% close-up
  const [zoom, setZoom] = useState(1.0);
  const [selectedBB, setSelectedBB] = useState<HandwritingBoundingBox | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(true);

  // Interactive Bounding Boxes (Cho phép di chuyển, kéo giãn, thêm, xóa)
  const [boxes, setBoxes] = useState<HandwritingBoundingBox[]>([]);
  const [isAdjusted, setIsAdjusted] = useState(false);

  // Real-time Spot Inspection state (Soi nét tức thì theo thời gian thực)
  const [isSpotLoading, setIsSpotLoading] = useState<string | null>(null);
  const resultImgRef = useRef<HTMLImageElement>(null);

  // Refs for scroll and pointer dragging
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    active: boolean;
    mode: "move" | "resize-se";
    boxId: string;
    startPointerX: number;
    startPointerY: number;
    startBox: [number, number, number, number];
  } | null>(null);

  // ── File processing ──────────────────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    setResult(null);
    setBoxes([]);
    setIsAdjusted(false);
    setError(null);
    setSelectedBB(null);
    setZoom(1.0);
    setImageName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageDataUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // ── AI Evaluation & Re-evaluation ────────────────────────────────────────────

  const executeEvaluation = async (customBoxes?: HandwritingBoundingBox[]) => {
    if (!imageDataUrl) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/evaluate-handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageDataUrl,
          fileName: imageName,
          annotations: customBoxes,
        }),
      });

      if (!res.ok) throw new Error(`Lỗi máy chủ: ${res.status}`);

      const data: HandwritingEvaluationResult = await res.json();

      if (!data.anh_hop_le) {
        setError(data.ly_do || "Ảnh không hợp lệ. Vui lòng chụp rõ hơn bài viết ô ly.");
        setLoading(false);
        return;
      }

      setResult(data);
      const newBoxes = data.bounding_boxes ?? customBoxes ?? [];
      setBoxes(newBoxes);
      setIsAdjusted(false);

      // Select first box if available
      if (newBoxes.length > 0 && !selectedBB) {
        setSelectedBB(newBoxes[0]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEvaluate = () => {
    executeEvaluation();
  };

  const handleReEvaluate = () => {
    executeEvaluation(boxes);
  };

  const handleReset = () => {
    setImageDataUrl(null);
    setImageName("");
    setResult(null);
    setBoxes([]);
    setIsAdjusted(false);
    setError(null);
    setSelectedBB(null);
    setZoom(1.0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Focus & Zoom to Bounding Box ─────────────────────────────────────────────

  const focusBoundingBox = useCallback((bb: HandwritingBoundingBox) => {
    setSelectedBB(bb);
    setShowAnnotations(true);

    const targetZoom = 2.5;
    setZoom(targetZoom);

    setTimeout(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const [ymin, xmin, ymax, xmax] = bb.box_2d;
      const cx = (xmin + xmax) / 2000;
      const cy = (ymin + ymax) / 2000;

      const targetX = cx * container.scrollWidth;
      const targetY = cy * container.scrollHeight;

      const scrollLeft = targetX - container.clientWidth / 2;
      const scrollTop = targetY - container.clientHeight / 2;

      container.scrollTo({
        left: Math.max(0, scrollLeft),
        top: Math.max(0, scrollTop),
        behavior: "smooth",
      });
    }, 80);
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1.0);
    setSelectedBB(null);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: 0,
        top: 0,
        behavior: "smooth",
      });
    }
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(+(z + 0.5).toFixed(1), 4.0));
  const handleZoomOut = () => setZoom((z) => Math.max(+(z - 0.5).toFixed(1), 1.0));

  // ── Real-Time Spot Inspection (Soi nét tức thì 1 ô cắt lẻ) ───────────────────

  const cropBoxImage = (imgEl: HTMLImageElement, box_2d: [number, number, number, number]): string => {
    try {
      const canvas = document.createElement("canvas");
      const nw = imgEl.naturalWidth;
      const nh = imgEl.naturalHeight;
      if (nw <= 0 || nh <= 0) return "";

      const [ymin, xmin, ymax, xmax] = box_2d;
      const sx = Math.max(0, (xmin * nw) / 1000);
      const sy = Math.max(0, (ymin * nh) / 1000);
      const sw = Math.min(nw - sx, Math.max(20, ((xmax - xmin) * nw) / 1000));
      const sh = Math.min(nh - sy, Math.max(20, ((ymax - ymin) * nh) / 1000));

      canvas.width = Math.max(40, sw);
      canvas.height = Math.max(40, sh);
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";

      ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.85);
    } catch {
      return "";
    }
  };

  const triggerSpotInspection = useCallback(async (targetBox: HandwritingBoundingBox) => {
    if (!resultImgRef.current) return;
    const crop = cropBoxImage(resultImgRef.current, targetBox.box_2d);
    if (!crop) return;

    setIsSpotLoading(targetBox.id);

    try {
      const res = await fetch("/api/evaluate-handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "spot_inspect",
          cropImage: crop,
          boxId: targetBox.id,
        }),
      });

      if (res.ok) {
        const spotData = await res.json();
        setBoxes((prev) =>
          prev.map((b) =>
            b.id === targetBox.id
              ? {
                  ...b,
                  chu: spotData.chu || b.chu,
                  loai: spotData.loai || b.loai,
                  tieu_de: spotData.tieu_de || b.tieu_de,
                  nhan_xet: spotData.nhan_xet || b.nhan_xet,
                  huong_dan_sua: spotData.huong_dan_sua || b.huong_dan_sua,
                  sample_crop_url: crop,
                }
              : b
          )
        );

        setSelectedBB((prev) =>
          prev && prev.id === targetBox.id
            ? {
                ...prev,
                chu: spotData.chu || prev.chu,
                loai: spotData.loai || prev.loai,
                tieu_de: spotData.tieu_de || prev.tieu_de,
                nhan_xet: spotData.nhan_xet || prev.nhan_xet,
                huong_dan_sua: spotData.huong_dan_sua || prev.huong_dan_sua,
                sample_crop_url: crop,
              }
            : prev
        );
      }
    } catch (err) {
      console.warn("Spot inspect error:", err);
    } finally {
      setIsSpotLoading(null);
    }
  }, []);

  // ── Interactive Drag & Resize Handlers ───────────────────────────────────────

  const handleBoxPointerDown = (
    e: React.PointerEvent,
    box: HandwritingBoundingBox,
    mode: "move" | "resize-se"
  ) => {
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    dragRef.current = {
      active: true,
      mode,
      boxId: box.id,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      startBox: [...box.box_2d],
    };
    setSelectedBB(box);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !dragRef.current.active) return;
    if (!imageWrapperRef.current) return;

    const wrapper = imageWrapperRef.current;
    const rect = wrapper.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dx = e.clientX - dragRef.current.startPointerX;
    const dy = e.clientY - dragRef.current.startPointerY;

    // Quy đổi pixel di chuyển sang thang đo 0-1000
    const d1000X = (dx / rect.width) * 1000;
    const d1000Y = (dy / rect.height) * 1000;

    const [startYmin, startXmin, startYmax, startXmax] = dragRef.current.startBox;
    const boxW = startXmax - startXmin;
    const boxH = startYmax - startYmin;

    setBoxes((prev) =>
      prev.map((b) => {
        if (b.id !== dragRef.current?.boxId) return b;

        if (dragRef.current.mode === "move") {
          const newYmin = Math.max(0, Math.min(1000 - boxH, startYmin + d1000Y));
          const newXmin = Math.max(0, Math.min(1000 - boxW, startXmin + d1000X));
          const updatedBox: [number, number, number, number] = [
            Math.round(newYmin),
            Math.round(newXmin),
            Math.round(newYmin + boxH),
            Math.round(newXmin + boxW),
          ];
          const updatedItem = { ...b, box_2d: updatedBox };
          setSelectedBB(updatedItem);
          return updatedItem;
        } else {
          // resize-se (kéo góc dưới - phải)
          const newYmax = Math.max(startYmin + 15, Math.min(1000, startYmax + d1000Y));
          const newXmax = Math.max(startXmin + 15, Math.min(1000, startXmax + d1000X));
          const updatedBox: [number, number, number, number] = [
            startYmin,
            startXmin,
            Math.round(newYmax),
            Math.round(newXmax),
          ];
          const updatedItem = { ...b, box_2d: updatedBox };
          setSelectedBB(updatedItem);
          return updatedItem;
        }
      })
    );
    setIsAdjusted(true);
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current?.active) {
      const activeBoxId = dragRef.current.boxId;
      dragRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}

      // TỰ ĐỘNG CHẤM REAL-TIME: Vừa di chuyển/co giãn xong là AI lập tức soi và nhận dạng tại chỗ!
      setTimeout(() => {
        setBoxes((currentBoxes) => {
          const target = currentBoxes.find((b) => b.id === activeBoxId);
          if (target) {
            triggerSpotInspection(target);
          }
          return currentBoxes;
        });
      }, 50);
    }
  };

  // Thêm ô khoanh mới thủ công & tự động nhận dạng ngay
  const handleAddNewBox = () => {
    const newId = `teacher_bb_${Date.now()}`;
    const newBox: HandwritingBoundingBox = {
      id: newId,
      box_2d: [350, 350, 440, 480],
      loai: "chu_y",
      chu: "...",
      tieu_de: "Đang soi vị trí...",
      nhan_xet: "Đang nhận dạng vị trí mới tạo...",
      huong_dan_sua: "",
    };
    setBoxes((prev) => [...prev, newBox]);
    setSelectedBB(newBox);
    setIsAdjusted(true);
    focusBoundingBox(newBox);

    setTimeout(() => {
      triggerSpotInspection(newBox);
    }, 200);
  };

  // Xóa ô khoanh
  const handleDeleteBox = (id: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== id));
    if (selectedBB?.id === id) {
      setSelectedBB(null);
    }
    setIsAdjusted(true);
  };

  // ── Render: Upload Zone ──────────────────────────────────────────────────────

  if (!imageDataUrl) {
    return (
      <div className="w-full flex flex-col items-center py-6 sm:py-12 px-4 sm:px-6">
        {/* Drop Zone */}
        <div
          className={`w-full max-w-2xl rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
            isDraggingFile
              ? "border-violet-500 bg-violet-50 scale-[1.01]"
              : "border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50/40"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingFile(true);
          }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                isDraggingFile ? "bg-violet-200" : "bg-white border border-slate-200 shadow-xs"
              }`}
            >
              <Upload className="w-7 h-7 text-violet-600" />
            </div>
            <p className="font-black text-slate-700 text-lg mb-1">
              Kéo thả hoặc bấm để tải ảnh bài viết
            </p>
            <p className="text-sm text-slate-400 mb-5">
              Hỗ trợ định dạng: JPG, PNG, HEIC, WEBP
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm flex items-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Chọn ảnh từ thiết bị
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  // ── Render: Preview + Evaluate ───────────────────────────────────────────────

  if (!result && !loading) {
    return (
      <div className="w-full flex flex-col items-center py-4 sm:py-8 px-4 sm:px-6">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-violet-600" />
              {imageName || "Bài viết học sinh"}
            </span>
            <button
              onClick={handleReset}
              className="min-h-[44px] px-3 text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Đổi ảnh khác
            </button>
          </div>

          {/* Preview Image */}
          <div
            className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 mb-4 flex items-center justify-center p-2"
            style={{ maxHeight: "65vh" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt="Bài viết học sinh"
              className="max-w-full max-h-[60vh] object-contain rounded-2xl"
            />
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Đổi ảnh
            </button>
            <button
              onClick={handleStartEvaluate}
              className="flex-1 min-h-[44px] px-5 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Bắt đầu AI Chấm Bài Viết
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Loading ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center py-8 px-4">
        <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-5">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        </div>
        <p className="font-black text-slate-800 text-lg mb-1">
          {isAdjusted ? "AI đang thẩm định lại các vùng bạn vừa chỉnh..." : "AI đang soi từng nét chữ..."}
        </p>
        <p className="text-sm text-slate-500 text-center max-w-sm">
          Đang đối chiếu mẫu chữ ô ly Lớp 1, định vị các điểm lỗi và tổng hợp nhận xét sư phạm.
        </p>
        <div className="mt-6 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Render: Result ───────────────────────────────────────────────────────────

  if (!result) return null;

  const excludedRegions = result.vung_loai_tru_khong_cham ?? [];
  const hasAnnotations = boxes.length > 0;
  const rubricEntries = result.rubric_minh_bach ? Object.entries(result.rubric_minh_bach) : [];

  return (
    <div className="w-full py-3 sm:py-5 px-3 sm:px-6 pb-12">
      {/* ── Main 2-Column Layout ── */}
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ── LEFT: Image with Interactive Bounding Boxes ── */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden order-1 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-wrap gap-2 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-700 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-violet-600" />
                Bài viết
                {hasAnnotations && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                    {boxes.length} vị trí
                  </span>
                )}
              </span>

              {/* Nút thêm ô khoanh mới */}
              <button
                onClick={handleAddNewBox}
                className="min-h-[36px] px-2.5 py-1 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-xs flex items-center gap-1 border border-violet-200 active:scale-95 transition-all cursor-pointer"
                title="Khoanh thêm một vị trí nét chữ mới"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm ô
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Nút Nhận dạng lại khi cô giáo đã chỉnh sửa */}
              {isAdjusted && (
                <button
                  onClick={handleReEvaluate}
                  className="min-h-[36px] px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer animate-pulse"
                  title="Gửi lại vị trí các ô bạn vừa chỉnh để AI chấm lại"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Chấm lại ({boxes.length})
                </button>
              )}

              {hasAnnotations && (
                <button
                  onClick={() => setShowAnnotations(!showAnnotations)}
                  className={`min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all active:scale-95 cursor-pointer ${
                    showAnnotations
                      ? "bg-violet-100 text-violet-800 border-violet-300"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}
                  title={showAnnotations ? "Ẩn khoanh vùng" : "Hiện khoanh vùng"}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showAnnotations ? "Ẩn" : "Hiện"}
                </button>
              )}

              <button
                onClick={handleZoomOut}
                disabled={zoom <= 1.0}
                className="min-h-[36px] min-w-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center active:scale-95 cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-4 h-4 text-slate-600" />
              </button>

              <span className="text-xs text-slate-600 font-black w-9 text-center">
                {Math.round(zoom * 100)}%
              </span>

              <button
                onClick={handleZoomIn}
                disabled={zoom >= 4.0}
                className="min-h-[36px] min-w-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center active:scale-95 cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="w-4 h-4 text-slate-600" />
              </button>

              <button
                onClick={resetZoom}
                className="min-h-[36px] px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 flex items-center gap-1 active:scale-95 cursor-pointer"
                title="Xem toàn bài 100%"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Toàn bài
              </button>

              <button
                onClick={handleReset}
                className="min-h-[36px] px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                title="Chấm bài khác / Đổi ảnh"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chấm bài khác</span>
              </button>
            </div>
          </div>

          {/* Scrollable Viewport */}
          <div
            ref={scrollContainerRef}
            className="overflow-auto bg-slate-100 p-3 select-none relative"
            style={{ maxHeight: "68vh", minHeight: "380px" }}
          >
            {/* Inner responsive wrapper scaled by zoom */}
            <div
              ref={imageWrapperRef}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              className="relative transition-[width] duration-300 ease-out origin-top-left mx-auto touch-none"
              style={{
                width: `${zoom * 100}%`,
                minWidth: "100%",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={resultImgRef}
                src={imageDataUrl!}
                alt="Bài viết học sinh"
                className="w-full h-auto block rounded-2xl shadow-xs pointer-events-none select-none"
                draggable={false}
              />

              {/* Vùng loại trừ (Mẫu in hướng dẫn, QR, tiêu đề) */}
              {showAnnotations &&
                excludedRegions.map((ex, idx) => {
                  const [ymin, xmin, ymax, xmax] = ex.box_2d;
                  return (
                    <div
                      key={`ex_${idx}`}
                      className="absolute pointer-events-none transition-all"
                      style={{
                        top: `${ymin / 10}%`,
                        left: `${xmin / 10}%`,
                        width: `${(xmax - xmin) / 10}%`,
                        height: `${(ymax - ymin) / 10}%`,
                        border: "1.5px dashed #94a3b8",
                        borderRadius: "6px",
                        background: "rgba(148, 163, 184, 0.12)",
                        zIndex: 5,
                      }}
                      title={ex.mo_ta}
                    >
                      <span className="absolute -top-4 left-0 text-[9px] font-bold px-1 rounded bg-slate-500 text-white whitespace-nowrap shadow-xs">
                        Mẫu in (loại trừ)
                      </span>
                    </div>
                  );
                })}

              {/* Interactive Bounding Boxes */}
              {showAnnotations &&
                boxes.map((bb) => {
                  const [ymin, xmin, ymax, xmax] = bb.box_2d;
                  const colors = bbColor(bb.loai);
                  const isSelected = selectedBB?.id === bb.id;

                  return (
                    <div
                      key={bb.id}
                      onPointerDown={(e) => handleBoxPointerDown(e, bb, "move")}
                      className={`absolute cursor-move transition-shadow duration-150 touch-none ${
                        isSelected ? "z-30" : "z-10"
                      }`}
                      style={{
                        top: `${ymin / 10}%`,
                        left: `${xmin / 10}%`,
                        width: `${(xmax - xmin) / 10}%`,
                        height: `${(ymax - ymin) / 10}%`,
                        border: `2.5px solid ${colors.border}`,
                        borderRadius: "8px",
                        background: isSelected
                          ? colors.bg.replace("0.20", "0.35")
                          : colors.bg,
                        boxShadow: isSelected
                          ? `0 0 0 3px ${colors.border}, 0 0 16px ${colors.border}88`
                          : "0 1px 4px rgba(0,0,0,0.15)",
                      }}
                      title={`${bb.chu}: ${bb.tieu_de} (Kéo để di chuyển, kéo góc để co giãn)`}
                    >
                      {/* Badge tag on bounding box */}
                      <span
                        className={`absolute -top-5 left-0 text-[10px] font-black px-1.5 py-0.5 rounded-md leading-tight shadow-xs flex items-center gap-1 ${colors.label} pointer-events-none`}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        <span>{colors.icon}</span>
                        <span>{bb.chu}</span>
                      </span>

                      {/* Real-time Spot Loading Spinner */}
                      {isSpotLoading === bb.id && (
                        <div className="absolute inset-0 bg-violet-900/60 rounded-md flex items-center justify-center z-40 backdrop-blur-xs">
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                          <span className="text-[9px] font-black text-white ml-1">Đang soi...</span>
                        </div>
                      )}

                      {/* Move Icon Center Indicator */}
                      {isSelected && !isSpotLoading && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Move className="w-4 h-4 text-white drop-shadow-md opacity-80" />
                        </div>
                      )}

                      {/* Resize Handle at Bottom-Right */}
                      {isSelected && (
                        <div
                          onPointerDown={(e) => handleBoxPointerDown(e, bb, "resize-se")}
                          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-slate-800 rounded-full cursor-se-resize shadow-md flex items-center justify-center touch-none z-40 active:scale-125 transition-transform"
                          title="Kéo góc này để chỉnh độ rộng/cao ô khoanh"
                        >
                          <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Pedagogical Feedback & Error List ── */}
        <div className="lg:col-span-5 flex flex-col gap-4 order-2">

          {/* Căn cứ chấm điểm minh bạch (Rubric) */}
          {rubricEntries.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 mb-2.5">
                <Sparkles className="w-4 h-4 text-violet-600" />
                Căn cứ tính điểm minh bạch (Rubric)
              </h3>
              <div className="space-y-2">
                {rubricEntries.map(([key, item]) => {
                  const labelMap: Record<string, string> = {
                    muc_do_hoan_thanh: "Mức độ hoàn thành",
                    dung_do_cao_o_ly: "Đúng độ cao ô ly",
                    can_dong_baseline: "Căn dòng kẻ ngang 1",
                    khoang_cach_noi_net: "Khoảng cách & Nối nét",
                    trinh_bay_sach_se: "Trình bày & Vệ sinh",
                  };
                  return (
                    <div
                      key={key}
                      className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black text-slate-700 mb-0.5">
                          {labelMap[key] ?? key}
                        </div>
                        <div className="text-[11px] text-slate-500 leading-snug">
                          {item.giai_thich}
                        </div>
                      </div>
                      <div className="text-xs font-black text-violet-700 shrink-0 bg-violet-100 px-2.5 py-1 rounded-xl">
                        {item.diem}/10
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Bounding Box Error List */}
          {hasAnnotations && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4 text-violet-600" />
                  Vị trí chữ học sinh viết ({boxes.length})
                </h3>
                {isAdjusted ? (
                  <button
                    onClick={handleReEvaluate}
                    className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors"
                  >
                    🔄 Bấm để chấm lại
                  </button>
                ) : (
                  <span className="text-[11px] text-violet-600 font-bold">
                    Bấm để soi cận cảnh
                  </span>
                )}
              </div>

              <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
                {boxes.map((bb) => {
                  const colors = bbColor(bb.loai);
                  const isSelected = selectedBB?.id === bb.id;

                  return (
                    <div
                      key={bb.id}
                      onClick={() => focusBoundingBox(bb)}
                      className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "border-violet-500 bg-violet-50/70 shadow-sm ring-2 ring-violet-200"
                          : "border-slate-200 bg-slate-50/70 hover:border-violet-300 hover:bg-violet-50/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${colors.badge}`}
                          >
                            {colors.text}
                          </span>
                          {bb.dong_so && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              Dòng {bb.dong_so}
                            </span>
                          )}
                          <span className="text-lg font-cursive-vn text-violet-700 leading-none">
                            「{bb.chu}」
                          </span>
                          <span className="font-black text-slate-800 text-xs truncate">
                            {bb.tieu_de}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            className="min-h-[32px] px-2.5 py-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                          >
                            <ZoomIn className="w-3 h-3" />
                            Soi lỗi
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBox(bb.id);
                            }}
                            className="min-h-[32px] min-w-[32px] rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
                            title="Xóa ô này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {bb.nhan_xet}
                      </p>
                      {bb.bang_chung && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          🔍 {bb.bang_chung}
                        </p>
                      )}
                      {bb.huong_dan_sua && (
                        <p className="text-[11px] text-emerald-700 font-bold mt-1">
                          💡 {bb.huong_dan_sua}
                        </p>
                      )}
                      {bb.can_giao_vien_kiem_tra && (
                        <p className="text-[10px] text-amber-700 font-bold mt-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 inline-block">
                          ⚠️ Cần cô giáo trực tiếp thẩm định thêm
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
