"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  Camera,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  ChevronLeft,
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
  Volume2,
  Layers,
  Sliders,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Minus,
  Zap,
  Target,
} from "lucide-react";
import { HandwritingBoundingBox } from "@/types/letter";
import { sound } from "@/utils/speech";
import { getTeacherMasterUrl } from "@/data/workbookMasters";

// ─── Preset Samples ──────────────────────────────────────────────────────────

interface PresetSample {
  id: string;
  title: string;
  subtitle: string;
  type: "image" | "pdf";
  url: string;
  badge: string;
  badgeColor: string;
}

const PRESET_SAMPLES: PresetSample[] = [
  {
    id: "sample_la_he",
    title: "Bài 12-13: Luyện từ 'lá hẹ', 'hồ cá', 'kì cọ'",
    subtitle: "Vở viết chữ thực tế có cụm từ 'lá hẹ', 'hồ cá', 'kì cọ', chữ 'h', 'k'",
    type: "image",
    url: "/data/samples/bai_12_la_he_ho_ca.jpg",
    badge: "Bài 'lá hẹ'",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: "sample_err_a",
    title: "Bài 1: Nét chữ 'a' thực tế",
    subtitle: "Ảnh vở ô ly có lỗi nét móc nhô cao thực tế của bé",
    type: "image",
    url: "/data/samples/bai_1_hoc_sinh_xau.jpg",
    badge: "Ảnh thực tế",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    id: "sample_exam",
    title: "Bài thi viết chữ đẹp Lớp 1",
    subtitle: "Nét chữ uốn lượn đạt chuẩn mẫu thi cấp trường",
    type: "image",
    url: "/data/samples/bai_thi_viet_mau.jpg",
    badge: "Mẫu thi chuẩn",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    id: "sample_pdf",
    title: "Vở tập viết lớp 1 (File PDF)",
    subtitle: "Tài liệu PDF điện tử bài viết học sinh chuẩn ô ly",
    type: "pdf",
    url: "/data/samples/vo_tap_viet_mau.pdf",
    badge: "File PDF",
    badgeColor: "bg-violet-100 text-violet-800 border-violet-200",
  },
];

// ─── Preset Pre-loaded Bounding Boxes for Instant Inspection ─────────────────
const PRESET_DEFAULT_BOXES: Record<string, HandwritingBoundingBox[]> = {
  sample_la_he: [
    {
      id: "box_ki_co",
      box_2d: [430, 325, 520, 445],
      loai: "chu_y",
      chu: "kì cọ",
      confidence: 96,
      tieu_de: "Luyện từ 'kì cọ'",
      nhan_xet: "Nét khuyết trên chữ 'k' viết thẳng, tuy nhiên khoảng cách giữa 'kì' và 'cọ' hơi hẹp.",
      huong_dan_sua: "Nhắc con cách đều đúng bằng 1 con chữ 'o' tưởng tượng trước khi đặt bút viết chữ 'cọ'.",
      do_cao_o_ly: "2.5 ly (khuyết trên) / 2 ly",
      do_rong_o_ly: "1.5 ly (Chuẩn)",
      diem_dung_but: "Dòng kẻ ngang 2",
    },
    {
      id: "box_la_he",
      box_2d: [268, 560, 355, 725],
      loai: "chuan",
      chu: "lá hẹ",
      confidence: 98,
      tieu_de: "Luyện từ 'lá hẹ'",
      nhan_xet: "Nét khuyết chữ 'l' và 'h' uốn lượn rất khéo, đúng chuẩn 2.5 ly của Bộ Giáo Dục.",
      huong_dan_sua: "Giữ vững nét đưa bút thanh thoát này con nhé!",
      do_cao_o_ly: "2.5 ly (Chuẩn)",
      do_rong_o_ly: "1.5 ly (Chuẩn)",
      diem_dung_but: "Dòng kẻ ngang 2",
    },
    {
      id: "box_ho_ca",
      box_2d: [185, 565, 270, 720],
      loai: "chuan",
      chu: "hồ cá",
      confidence: 97,
      tieu_de: "Luyện từ 'hồ cá'",
      nhan_xet: "Chữ viết ngay ngắn, thẳng dòng kẻ ô ly. Dấu huyền đặt đúng trên đầu chữ 'o'.",
      huong_dan_sua: "Duy trì nét chữ sạch đẹp và thẳng hàng.",
      do_cao_o_ly: "2.5 ly / 2 ly (Chuẩn)",
      do_rong_o_ly: "1.5 ly (Chuẩn)",
      diem_dung_but: "Dòng kẻ ngang 2",
    },
  ],
  sample_err_a: [
    {
      id: "box_err_a",
      box_2d: [118, 250, 168, 360],
      loai: "loi",
      chu: "a",
      confidence: 95,
      tieu_de: "Nét móc ngược nhô cao quá dòng kẻ 2",
      nhan_xet: "Nét móc ngược của chữ 'a' bị kéo vọt lên quá dòng kẻ ngang 2 làm chữ mất cân đối.",
      huong_dan_sua: "Dừng bút nhẹ nhàng ngay tại đường kẻ ngang 2, không hất quá cao con nhé!",
      do_cao_o_ly: "2.3 ly (Vượt chuẩn 2.0 ly)",
      do_rong_o_ly: "1.5 ly (Chuẩn)",
      diem_dung_but: "Vượt qua dòng kẻ 2 (+0.3 ly)",
    },
    {
      id: "box_ca",
      box_2d: [310, 148, 352, 235],
      loai: "chuan",
      chu: "ca",
      confidence: 98,
      tieu_de: "Tiếng 'ca' viết liền mạch",
      nhan_xet: "Nét cong hở phải chữ 'c' đều đặn, nối sang chữ 'a' đúng chuẩn 1 ô ly.",
      huong_dan_sua: "Chữ viết rất đẹp và đúng mẫu.",
      do_cao_o_ly: "2.0 ly (Chuẩn)",
      do_rong_o_ly: "1.5 ly (Chuẩn)",
      diem_dung_but: "Dòng kẻ ngang 2",
    },
  ],
  sample_exam: [
    {
      id: "box_v",
      box_2d: [310, 50, 360, 115],
      loai: "chuan",
      chu: "v",
      confidence: 99,
      tieu_de: "Chữ 'v' đạt chuẩn mẫu thi",
      nhan_xet: "Nét uốn cong chuẩn mực, độ cao 2 ô ly rất chuẩn.",
      huong_dan_sua: "Giữ vững nét cong tròn và độ nghiêng chuẩn này con nhé!",
      do_cao_o_ly: "2.0 ly (Chuẩn)",
      do_rong_o_ly: "1.5 ly (Chuẩn)",
      diem_dung_but: "Dòng kẻ ngang 2",
    },
    {
      id: "box_ua",
      box_2d: [395, 220, 445, 310],
      loai: "chuan",
      chu: "ua",
      confidence: 97,
      tieu_de: "Vần 'ua' nối liền mạch",
      nhan_xet: "Khoảng cách nối nét giữa u và a rất khéo léo.",
      huong_dan_sua: "Nét móc ngược đạt chuẩn độ cao 2 ly.",
      do_cao_o_ly: "2.0 ly (Chuẩn)",
      do_rong_o_ly: "1.5 ly (Chuẩn)",
      diem_dung_but: "Dòng kẻ ngang 2",
    },
  ],
};

// ─── Helpers: Trạng thái & Màu sắc ──────────────────────────────────────────

function getStatusTheme(loai: HandwritingBoundingBox["loai"], isUnrec?: boolean) {
  if (isUnrec) {
    return {
      border: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.18)",
      label: "bg-amber-600 text-white",
      badge: "bg-amber-100 text-amber-800 border-amber-200",
      text: "Chưa nhận diện",
      dot: "bg-amber-500",
      icon: "❓",
    };
  }
  if (loai === "loi") {
    return {
      border: "#ef4444",
      bg: "rgba(239, 68, 68, 0.18)",
      label: "bg-rose-600 text-white",
      badge: "bg-rose-100 text-rose-700 border-rose-200",
      text: "Lỗi cần sửa",
      dot: "bg-rose-500",
      icon: "❌",
    };
  }
  if (loai === "chu_y") {
    return {
      border: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.18)",
      label: "bg-amber-600 text-white",
      badge: "bg-amber-100 text-amber-800 border-amber-200",
      text: "Cần chú ý",
      dot: "bg-amber-500",
      icon: "⚠️",
    };
  }
  return {
    border: "#10b981",
    bg: "rgba(16, 185, 129, 0.18)",
    label: "bg-emerald-600 text-white",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    text: "Chuẩn đẹp",
    dot: "bg-emerald-500",
    icon: "✅",
  };
}

// ─── Main Component: AiHandwritingGrader ──────────────────────────────────────

export function AiHandwritingGrader() {
  // ── Document State ──
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [docName, setDocName] = useState<string>("");
  const [rotation, setRotation] = useState<number>(0);
  const [isProcessingDoc, setIsProcessingDoc] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // PDF Page Support
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
  const [pdfCurrentPage, setPdfCurrentPage] = useState<number>(1);

  // Viewport & Zoom
  const [zoom, setZoom] = useState<number>(1.0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const resultImgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const magnifierRef = useRef<HTMLDivElement>(null);

  // ── User Selection ("Bôi cụ thể từng chữ") ──
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectionRect, setSelectionRect] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Pinned letter boxes
  const [boxes, setBoxes] = useState<HandwritingBoundingBox[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

  // Drag existing box state
  const dragRef = useRef<{
    active: boolean;
    mode: "move" | "resize-se";
    boxId: string;
    startPointerX: number;
    startPointerY: number;
    startBox: [number, number, number, number];
  } | null>(null);

  // ── Magnifier & Spot Inspection State ──
  const [isSpotLoading, setIsSpotLoading] = useState<boolean>(false);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(true);
  const [showRedTruthOverlay, setShowRedTruthOverlay] = useState<boolean>(true);
  const [redOpacity, setRedOpacity] = useState<number>(0.65);
  const [redOffsetX, setRedOffsetX] = useState<number>(0);
  const [redOffsetY, setRedOffsetY] = useState<number>(0);
  const [redScale, setRedScale] = useState<number>(1.0);
  const [isBlinkingRed, setIsBlinkingRed] = useState<boolean>(false);
  const [blinkVisible, setBlinkVisible] = useState<boolean>(true);
  const [showAdjustControls, setShowAdjustControls] = useState<boolean>(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState<boolean>(false);

  // Reset micro adjustments when switching box
  useEffect(() => {
    setRedOffsetX(0);
    setRedOffsetY(0);
    setRedScale(1.0);
    setIsBlinkingRed(false);
    setBlinkVisible(true);
  }, [selectedBoxId]);

  // Blink comparator timer
  useEffect(() => {
    if (!isBlinkingRed) {
      setBlinkVisible(true);
      return;
    }
    const timer = setInterval(() => {
      setBlinkVisible((prev) => !prev);
    }, 450);
    return () => clearInterval(timer);
  }, [isBlinkingRed]);

  // Selected item reference
  const currentBox = boxes.find((b) => b.id === selectedBoxId) || (boxes.length > 0 ? boxes[0] : null);

  // Automatically extract crop if currentBox does not have sample_crop_url
  useEffect(() => {
    if (!resultImgRef.current || !currentBox || currentBox.sample_crop_url) return;
    const imgEl = resultImgRef.current;
    if (imgEl.naturalWidth > 0 && imgEl.naturalHeight > 0) {
      const crop = cropBoxImage(imgEl, currentBox.box_2d);
      if (crop) {
        setBoxes((prev) =>
          prev.map((b) => (b.id === currentBox.id ? { ...b, sample_crop_url: crop } : b))
        );
      }
    }
  }, [currentBox, selectedBoxId, imageDataUrl]);

  // ── Text-to-speech helper (Giọng đọc tự nhiên chuẩn người Việt) ──
  const speakTip = useCallback((text: string) => {
    sound.speak(text, (isPlaying) => setIsPlayingVoice(isPlaying));
  }, []);

  // ── PDF Loader Helper ──
  const loadPdfSource = async (source: string | ArrayBuffer, pageNum: number = 1) => {
    setIsProcessingDoc(true);
    setError(null);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      let data: Uint8Array;
      if (typeof source === "string") {
        const resp = await fetch(source);
        if (!resp.ok) throw new Error("Không thể tải file PDF");
        const buf = await resp.arrayBuffer();
        data = new Uint8Array(buf);
      } else {
        data = new Uint8Array(source);
      }

      const pdf = await pdfjsLib.getDocument({ data }).promise;
      setPdfDoc(pdf);
      setPdfTotalPages(pdf.numPages);
      setPdfCurrentPage(pageNum);

      // Render page onto canvas
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // 2x for sharp handwriting strokes
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        setImageDataUrl(dataUrl);
      }
    } catch (err) {
      console.error("PDF load error:", err);
      setError("Không thể tải trang PDF. Vui lòng thử lại với file hình ảnh hoặc PDF khác.");
    } finally {
      setIsProcessingDoc(false);
    }
  };

  const handlePdfChangePage = async (newPage: number) => {
    if (!pdfDoc || newPage < 1 || newPage > pdfTotalPages) return;
    setIsProcessingDoc(true);
    try {
      setPdfCurrentPage(newPage);
      const page = await pdfDoc.getPage(newPage);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        setImageDataUrl(dataUrl);
        // Clear pins on page change
        setBoxes([]);
        setSelectedBoxId(null);
      }
    } catch (err) {
      console.error("Change page error:", err);
    } finally {
      setIsProcessingDoc(false);
    }
  };

  // ── File Handlers (Direct Zero-Friction Entry) ──
  const handleSelectFile = useCallback(async (file: File) => {
    setDocName(file.name);
    setBoxes([]);
    setSelectedBoxId(null);
    setZoom(1.0);
    setRotation(0);
    setError(null);

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      const buffer = await file.arrayBuffer();
      await loadPdfSource(buffer, 1);
    } else {
      setIsProcessingDoc(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageDataUrl(e.target?.result as string);
        setIsProcessingDoc(false);
      };
      reader.onerror = () => {
        setError("Không thể đọc file ảnh.");
        setIsProcessingDoc(false);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSelectPreset = async (preset: PresetSample) => {
    const fileName = preset.url.split("/").pop() || preset.title;
    setDocName(fileName);
    const initialBoxes = PRESET_DEFAULT_BOXES[preset.id] || [];
    setBoxes(initialBoxes);
    setSelectedBoxId(initialBoxes.length > 0 ? initialBoxes[0].id : null);
    setZoom(1.0);
    setRotation(0);
    setError(null);

    if (preset.type === "pdf") {
      await loadPdfSource(preset.url, 1);
    } else {
      setIsProcessingDoc(true);
      try {
        const resp = await fetch(preset.url);
        const blob = await resp.blob();
        const reader = new FileReader();
        reader.onload = (e) => {
          setImageDataUrl(e.target?.result as string);
          setIsProcessingDoc(false);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Preset load error:", err);
        setError("Không thể nạp bài tập mẫu.");
        setIsProcessingDoc(false);
      }
    }
  };

  const handleReset = () => {
    sound.stopSpeech();
    setImageDataUrl(null);
    setDocName("");
    setBoxes([]);
    setSelectedBoxId(null);
    setPdfDoc(null);
    setPdfTotalPages(1);
    setPdfCurrentPage(1);
    setRotation(0);
    setZoom(1.0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Crop Letter Helper ──
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

      canvas.width = Math.max(60, sw);
      canvas.height = Math.max(60, sh);
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";

      ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.88);
    } catch {
      return "";
    }
  };

  // ── Sub-Second Spot Inspection Call ──
  const triggerSpotInspection = useCallback(
    async (targetBox: HandwritingBoundingBox, overrideChar?: string) => {
      if (!resultImgRef.current) return;
      const crop = cropBoxImage(resultImgRef.current, targetBox.box_2d);
      if (!crop) return;

      setIsSpotLoading(true);

      try {
        const res = await fetch("/api/evaluate-handwriting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "spot_inspect",
            cropImage: crop,
            boxId: targetBox.id,
            box_2d: targetBox.box_2d,
            fileName: docName,
            fullImage: imageDataUrl,
            targetChar: overrideChar || undefined,
          }),
        });

        if (res.ok) {
          const spotData = await res.json();
          setBoxes((prev) =>
            prev.map((b) =>
              b.id === targetBox.id
                ? {
                    ...b,
                    chu: spotData.chu || overrideChar || b.chu,
                    confidence: spotData.confidence !== undefined ? spotData.confidence : b.confidence,
                    loai: spotData.loai || b.loai,
                    tieu_de: spotData.tieu_de || b.tieu_de,
                    nhan_xet: spotData.nhan_xet || b.nhan_xet,
                    huong_dan_sua: spotData.huong_dan_sua || b.huong_dan_sua,
                    is_unrecognized: spotData.is_unrecognized,
                    do_cao_o_ly: spotData.do_cao_o_ly || "2.0 ly (Chuẩn)",
                    do_rong_o_ly: spotData.do_rong_o_ly || "1.5 ly (Chuẩn)",
                    diem_dung_but: spotData.diem_dung_but || "Dòng kẻ ngang 2",
                    sample_crop_url: crop,
                  }
                : b
            )
          );
        }
      } catch (err) {
        console.warn("Spot inspect error:", err);
      } finally {
        setIsSpotLoading(false);
      }
    },
    [docName, imageDataUrl]
  );

  // ── Create & Inspect New Box ──
  const createAndInspectBox = (boxCoords: [number, number, number, number]) => {
    const newId = `box_${Date.now()}`;
    const initialCrop = resultImgRef.current ? cropBoxImage(resultImgRef.current, boxCoords) : "";
    const newBox: HandwritingBoundingBox = {
      id: newId,
      box_2d: boxCoords,
      loai: "chu_y",
      chu: "...",
      confidence: undefined,
      tieu_de: "AI đang quét nét...",
      nhan_xet: "AI đang nhận diện con chữ và đối chiếu với mẫu của cô giáo...",
      huong_dan_sua: "Chờ AI phân tích nét viết...",
      sample_crop_url: initialCrop,
    };

    setBoxes((prev) => [...prev, newBox]);
    setSelectedBoxId(newId);

    // Call inspection immediately
    setTimeout(() => {
      triggerSpotInspection(newBox);
    }, 60);

    // If on mobile/tablet, smooth scroll to magnifier panel
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => {
        magnifierRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 150);
    }
  };

  // ── Selection Drag Handlers (Bôi / Khoanh vùng nét chữ) ──
  const handleWrapperPointerDown = (e: React.PointerEvent) => {
    // If click was on an existing box/handle, don't start new selection
    const target = e.target as HTMLElement;
    if (target.closest("[data-box-element]")) return;

    const wrapper = imageWrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    try {
      wrapper.setPointerCapture(e.pointerId);
    } catch {}

    const x = Math.max(0, Math.min(1000, ((e.clientX - rect.left) / rect.width) * 1000));
    const y = Math.max(0, Math.min(1000, ((e.clientY - rect.top) / rect.height) * 1000));

    setIsSelecting(true);
    setSelectionRect({
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });
  };

  const handleWrapperPointerMove = (e: React.PointerEvent) => {
    // Handle existing box drag/resize
    if (dragRef.current && dragRef.current.active) {
      const wrapper = imageWrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const dx = ((e.clientX - dragRef.current.startPointerX) / rect.width) * 1000;
      const dy = ((e.clientY - dragRef.current.startPointerY) / rect.height) * 1000;
      const [startYmin, startXmin, startYmax, startXmax] = dragRef.current.startBox;
      const boxW = startXmax - startXmin;
      const boxH = startYmax - startYmin;

      setBoxes((prev) =>
        prev.map((b) => {
          if (b.id !== dragRef.current?.boxId) return b;
          if (dragRef.current.mode === "move") {
            const newYmin = Math.max(0, Math.min(1000 - boxH, startYmin + dy));
            const newXmin = Math.max(0, Math.min(1000 - boxW, startXmin + dx));
            return {
              ...b,
              box_2d: [
                Math.round(newYmin),
                Math.round(newXmin),
                Math.round(newYmin + boxH),
                Math.round(newXmin + boxW),
              ],
            };
          } else {
            const newYmax = Math.max(startYmin + 15, Math.min(1000, startYmax + dy));
            const newXmax = Math.max(startXmin + 15, Math.min(1000, startXmax + dx));
            return {
              ...b,
              box_2d: [
                startYmin,
                startXmin,
                Math.round(newYmax),
                Math.round(newXmax),
              ],
            };
          }
        })
      );
      return;
    }

    // Handle new selection rectangle
    if (isSelecting && selectionRect) {
      const wrapper = imageWrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const x = Math.max(0, Math.min(1000, ((e.clientX - rect.left) / rect.width) * 1000));
      const y = Math.max(0, Math.min(1000, ((e.clientY - rect.top) / rect.height) * 1000));

      setSelectionRect((prev) => (prev ? { ...prev, currentX: x, currentY: y } : null));
    }
  };

  const handleWrapperPointerUp = (e: React.PointerEvent) => {
    // Release existing box drag
    if (dragRef.current?.active) {
      const activeBoxId = dragRef.current.boxId;
      dragRef.current = null;
      setTimeout(() => {
        setBoxes((currentBoxes) => {
          const target = currentBoxes.find((b) => b.id === activeBoxId);
          if (target) {
            const updatedCrop = resultImgRef.current ? cropBoxImage(resultImgRef.current, target.box_2d) : target.sample_crop_url;
            const updated = { ...target, sample_crop_url: updatedCrop };
            triggerSpotInspection(updated);
            return currentBoxes.map((b) => (b.id === activeBoxId ? updated : b));
          }
          return currentBoxes;
        });
      }, 50);
      return;
    }

    // Finish new selection
    if (isSelecting && selectionRect) {
      setIsSelecting(false);
      const xmin = Math.min(selectionRect.startX, selectionRect.currentX);
      const xmax = Math.max(selectionRect.startX, selectionRect.currentX);
      const ymin = Math.min(selectionRect.startY, selectionRect.currentY);
      const ymax = Math.max(selectionRect.startY, selectionRect.currentY);
      setSelectionRect(null);

      const w = xmax - xmin;
      const h = ymax - ymin;

      // If user dragged a rectangle of at least 12 units
      if (w >= 12 && h >= 12) {
        createAndInspectBox([
          Math.round(ymin),
          Math.round(xmin),
          Math.round(ymax),
          Math.round(xmax),
        ]);
      } else {
        // Simple tap: Place a comfortable letter box around the tap point
        const tapX = selectionRect.startX;
        const tapY = selectionRect.startY;
        const boxSize = 65;
        const half = boxSize / 2;
        const tapYmin = Math.max(0, Math.min(1000 - boxSize, tapY - half));
        const tapXmin = Math.max(0, Math.min(1000 - boxSize, tapX - half));
        createAndInspectBox([
          Math.round(tapYmin),
          Math.round(tapXmin),
          Math.round(tapYmin + boxSize),
          Math.round(tapXmin + boxSize),
        ]);
      }
    }
  };

  // ── Existing Box Move & Resize Triggers ──
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
    setSelectedBoxId(box.id);
  };

  const handleDeleteBox = (id: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== id));
    if (selectedBoxId === id) {
      setSelectedBoxId(null);
    }
  };



  // ── If no document is selected yet: Clean, friendly Zero-Friction Entry ──
  if (!imageDataUrl) {
    return (
      <div className="w-full flex flex-col items-center py-6 sm:py-10 px-4 sm:px-6">
        <div className="w-full max-w-3xl">
          {/* Main Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-3xl border-2 border-dashed border-violet-300 hover:border-violet-500 bg-violet-50/50 hover:bg-violet-50/90 transition-all p-8 sm:p-12 flex flex-col items-center text-center cursor-pointer shadow-sm group"
          >
            <div className="w-16 h-16 rounded-2xl bg-white border border-violet-200 shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Upload className="w-8 h-8 text-violet-600" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">
              Tải ảnh hoặc file PDF bài viết của học sinh
            </h3>
            <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
              Hỗ trợ ảnh chụp điện thoại (<span className="font-semibold text-slate-700">JPG, PNG, WEBP</span>) và tài liệu sách vở điện tử (<span className="font-semibold text-violet-700">PDF</span>).
            </p>

            <button
              type="button"
              className="min-h-[44px] px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm flex items-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Chọn file từ thiết bị
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleSelectFile(file);
            }}
          />

          {/* Quick 1-Click Sample Presets */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3.5">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">
                Hoặc trải nghiệm ngay với các bài mẫu có sẵn:
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRESET_SAMPLES.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  disabled={isProcessingDoc}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-violet-400 hover:shadow-md transition-all text-left flex flex-col justify-between gap-3 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${preset.badgeColor}`}>
                        {preset.badge}
                      </span>
                      {preset.type === "pdf" ? (
                        <FileText className="w-4 h-4 text-violet-500" />
                      ) : (
                        <Camera className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="font-black text-slate-800 text-sm mb-1 leading-snug">
                      {preset.title}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {preset.subtitle}
                    </p>
                  </div>

                  <div className="text-[11px] font-bold text-violet-600 flex items-center gap-1">
                    Bấm để chấm ngay
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Processing Spinner */}
          {isProcessingDoc && (
            <div className="mt-6 p-4 rounded-2xl bg-violet-100 text-violet-800 flex items-center justify-center gap-2.5 text-sm font-bold animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang chuẩn bị trang bài viết...
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render: The 2-Column Split Workspace ──
  return (
    <div className="w-full py-2 sm:py-4 px-2 sm:px-6 pb-12">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">

        {/* ═══════════════════════════════════════════════════════════════════════
            LEFT COLUMN: Document Canvas & Interactive Letter Selection
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col order-1">
          {/* Top Document Toolbar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-slate-100 flex-wrap gap-2 bg-slate-50/80">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs sm:text-sm font-black text-slate-700 flex items-center gap-1.5 truncate">
                <BookOpen className="w-4 h-4 text-violet-600 shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-[200px]">
                  {docName || "Bài viết"}
                </span>
              </span>

              {/* PDF Multi-page navigation */}
              {pdfTotalPages > 1 && (
                <div className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-xl text-xs font-bold text-slate-700">
                  <button
                    onClick={() => handlePdfChangePage(pdfCurrentPage - 1)}
                    disabled={pdfCurrentPage <= 1}
                    className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span>
                    {pdfCurrentPage}/{pdfTotalPages}
                  </span>
                  <button
                    onClick={() => handlePdfChangePage(pdfCurrentPage + 1)}
                    disabled={pdfCurrentPage >= pdfTotalPages}
                    className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                    title="Trang sau"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {boxes.length > 0 && (
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                  {boxes.length} chữ đã soi
                </span>
              )}
            </div>

            {/* Document Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="min-h-[36px] px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 active:scale-95 cursor-pointer"
                title="Xoay ảnh 90° nếu ảnh chụp bị nằm ngang"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xoay</span>
              </button>

              <button
                onClick={() => setZoom((z) => Math.max(1.0, +(z - 0.4).toFixed(1)))}
                disabled={zoom <= 1.0}
                className="min-h-[36px] min-w-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center active:scale-95 cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-4 h-4 text-slate-600" />
              </button>

              <span className="text-xs font-black text-slate-600 w-8 text-center">
                {Math.round(zoom * 100)}%
              </span>

              <button
                onClick={() => setZoom((z) => Math.min(3.5, +(z + 0.4).toFixed(1)))}
                disabled={zoom >= 3.5}
                className="min-h-[36px] min-w-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center active:scale-95 cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="w-4 h-4 text-slate-600" />
              </button>

              <button
                onClick={() => setZoom(1.0)}
                className="min-h-[36px] px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1 active:scale-95 cursor-pointer"
                title="Vừa vặn màn hình"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleReset}
                className="min-h-[36px] px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold flex items-center gap-1 active:scale-95 transition-colors cursor-pointer"
                title="Đổi bài khác"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đổi bài</span>
              </button>
            </div>
          </div>

          {/* Interactive Hint Bar */}
          <div className="bg-violet-50/70 border-b border-violet-100 px-3 py-1.5 flex items-center justify-between text-xs text-violet-800">
            <span className="flex items-center gap-1.5 font-bold">
              <Crosshair className="w-3.5 h-3.5 text-violet-600 animate-spin" />
              Kéo rê chuột hoặc ngón tay để khoanh vùng con chữ của bé ➔ Kính lúp soi nét tại chỗ!
            </span>
          </div>

          {/* Scrollable Document Viewport */}
          <div
            ref={scrollContainerRef}
            className="overflow-auto bg-slate-100 p-2 sm:p-4 select-none relative"
            style={{ maxHeight: "72vh", minHeight: "420px" }}
          >
            {/* Scalable Container */}
            <div
              ref={imageWrapperRef}
              data-image-container="true"
              onPointerDown={handleWrapperPointerDown}
              onPointerMove={handleWrapperPointerMove}
              onPointerUp={handleWrapperPointerUp}
              className="relative transition-[width] duration-200 ease-out origin-top-left mx-auto cursor-crosshair touch-none select-none"
              style={{
                width: `${zoom * 100}%`,
                minWidth: "100%",
                transform: rotation ? `rotate(${rotation}deg)` : undefined,
              }}
            >
              {/* Document Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={resultImgRef}
                src={imageDataUrl}
                alt="Bài viết học sinh"
                className="w-full h-auto block rounded-2xl shadow-xs pointer-events-none select-none"
                draggable={false}
                onLoad={() => {
                  if (!resultImgRef.current) return;
                  const img = resultImgRef.current;
                  setBoxes((prev) =>
                    prev.map((b) => {
                      if (!b.sample_crop_url && img.naturalWidth > 0) {
                        const crop = cropBoxImage(img, b.box_2d);
                        return crop ? { ...b, sample_crop_url: crop } : b;
                      }
                      return b;
                    })
                  );
                }}
              />

              {/* Dynamic Dragging Selection Box */}
              {isSelecting && selectionRect && (
                <div
                  className="absolute pointer-events-none border-2 border-dashed border-violet-600 bg-violet-400/25 rounded-lg z-40 transition-none"
                  style={{
                    left: `${Math.min(selectionRect.startX, selectionRect.currentX) / 10}%`,
                    top: `${Math.min(selectionRect.startY, selectionRect.currentY) / 10}%`,
                    width: `${Math.abs(selectionRect.currentX - selectionRect.startX) / 10}%`,
                    height: `${Math.abs(selectionRect.currentY - selectionRect.startY) / 10}%`,
                  }}
                />
              )}

              {/* Pinned Letter Boxes */}
              {boxes.map((bb) => {
                const [ymin, xmin, ymax, xmax] = bb.box_2d;
                const theme = getStatusTheme(bb.loai, bb.is_unrecognized || bb.chu === "Chưa rõ nét");
                const isSelected = (currentBox?.id === bb.id);

                return (
                  <div
                    key={bb.id}
                    data-box-element="true"
                    onPointerDown={(e) => handleBoxPointerDown(e, bb, "move")}
                    className={`absolute cursor-move transition-shadow duration-150 touch-none ${
                      isSelected ? "z-30" : "z-20"
                    }`}
                    style={{
                      top: `${ymin / 10}%`,
                      left: `${xmin / 10}%`,
                      width: `${(xmax - xmin) / 10}%`,
                      height: `${(ymax - ymin) / 10}%`,
                      border: `2.5px solid ${theme.border}`,
                      borderRadius: "8px",
                      background: isSelected
                        ? theme.bg.replace("0.18", "0.32")
                        : theme.bg,
                      boxShadow: isSelected
                        ? `0 0 0 3px ${theme.border}, 0 0 16px ${theme.border}88`
                        : "0 1px 4px rgba(0,0,0,0.18)",
                    }}
                    title={`Chữ '${bb.chu}' - ${theme.text}`}
                  >
                    {/* Header Tag on Box */}
                    <span
                      className={`absolute -top-5 left-0 text-[10px] font-black px-1.5 py-0.5 rounded-md leading-tight shadow-xs flex items-center gap-1 ${theme.label} pointer-events-none`}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      <span>{theme.icon}</span>
                      <span>{bb.chu}</span>
                    </span>

                    {/* Red Master Overlay inside the Bounding Box on the Notebook */}
                    {showRedTruthOverlay && isSelected && getTeacherMasterUrl(bb.chu) && (
                      <div
                        className={`absolute inset-0 pointer-events-none z-10 overflow-hidden flex items-center justify-center transition-opacity duration-75 ${
                          isBlinkingRed && !blinkVisible ? "opacity-0" : ""
                        }`}
                        style={{
                          opacity: isBlinkingRed ? (blinkVisible ? redOpacity : 0) : redOpacity,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getTeacherMasterUrl(bb.chu)}
                          alt={`Mẫu đỏ ${bb.chu}`}
                          className="w-full h-full object-contain filter drop-shadow-xs"
                          style={{
                            transform: `translate(${redOffsetX}px, ${redOffsetY}px) scale(${redScale})`,
                          }}
                        />
                      </div>
                    )}

                    {/* Resize Handle at Bottom-Right */}
                    {isSelected && (
                      <div
                        data-box-element="true"
                        onPointerDown={(e) => handleBoxPointerDown(e, bb, "resize-se")}
                        className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-slate-900 rounded-full cursor-se-resize shadow-md flex items-center justify-center touch-none z-40 active:scale-125 transition-transform"
                        title="Kéo góc để co giãn ô"
                      >
                        <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            RIGHT COLUMN: Magnifier Panel (Kính lúp soi nét & Phân tích chi tiết)
            ═══════════════════════════════════════════════════════════════════════ */}
        <div ref={magnifierRef} className="lg:col-span-5 flex flex-col gap-4 order-2">
          {currentBox ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col gap-4">
              {/* Header Title & Actions */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Crosshair className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                      Kính Lúp Soi Nét
                      <span className="text-violet-600 font-serif text-base font-bold">
                        {currentBox.chu === "Chưa rõ nét" ? "Chưa nhận diện" : `「${currentBox.chu}」`}
                      </span>
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Chuẩn hóa theo 3 tiêu chí Bộ GD&ĐT
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => triggerSpotInspection(currentBox)}
                    disabled={isSpotLoading}
                    className="min-h-[36px] px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-violet-100 text-violet-700 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    title="Soi lại con chữ này"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSpotLoading ? "animate-spin" : ""}`} />
                    Soi lại
                  </button>

                  <button
                    onClick={() => handleDeleteBox(currentBox.id)}
                    className="min-h-[36px] min-w-[36px] rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center active:scale-95 transition-colors cursor-pointer"
                    title="Xóa ghim con chữ này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ── Magnifier Crop View with 4-Grid Ô Ly Guidelines & Red Standard Overlay ── */}
              <div className="w-full flex flex-col items-center">
                <div
                  className="w-full max-w-[280px] aspect-square rounded-2xl border-2 border-slate-300 bg-amber-50/20 relative overflow-hidden shadow-inner flex items-center justify-center"
                >
                  {/* Cropped Letter of the student */}
                  {currentBox.sample_crop_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentBox.sample_crop_url}
                      alt={`Nét chữ ${currentBox.chu}`}
                      className="w-full h-full object-contain filter contrast-125"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-violet-500 mb-1" />
                      <span className="text-xs">Đang trích xuất nét...</span>
                    </div>
                  )}

                  {/* 4-Grid Primary School Ô Ly Overlay */}
                  {showGridOverlay && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Dòng kẻ ngang 5 (4-5 ly) */}
                      <div className="absolute w-full top-[8%] border-b border-blue-300/60" />
                      {/* Dòng kẻ ngang 4 (3 ly) */}
                      <div className="absolute w-full top-[20%] border-b border-blue-300/60" />
                      {/* Dòng kẻ ngang 3 (2 ly - đỉnh chữ o, a, c, e...) */}
                      <div className="absolute w-full top-[35%] border-b-2 border-dashed border-blue-400/80" />
                      {/* Dòng kẻ ngang 2 (1 ly) */}
                      <div className="absolute w-full top-[55%] border-b border-blue-300/60" />
                      {/* Dòng kẻ ngang 1 — BASELINE chuẩn đậm */}
                      <div className="absolute w-full top-[75%] border-b-[2.5px] border-blue-700/85" />
                      {/* Dòng kẻ phụ dưới baseline (nét khuyết dưới g, y...) */}
                      <div className="absolute w-full top-[92%] border-b border-blue-300/50" />

                      {/* Các đường ô ly dọc */}
                      <div className="absolute h-full left-[25%] border-r border-blue-200/50" />
                      <div className="absolute h-full left-[50%] border-r border-blue-300/70" />
                      <div className="absolute h-full left-[75%] border-r border-blue-200/50" />

                      {/* Labels indicator */}
                      <span className="absolute top-1 left-1.5 text-[9px] font-bold text-blue-600 bg-white/80 px-1 rounded shadow-xs">
                        Lưới 4 ô ly Lớp 1
                      </span>
                      <span className="absolute top-[71%] right-1.5 text-[8px] font-black text-blue-800 bg-blue-100/90 px-1 rounded">
                        Đường kẻ 1 (Chân chữ)
                      </span>
                    </div>
                  )}

                  {/* Red Ground-Truth Standard Guide Overlay */}
                  {showRedTruthOverlay &&
                    currentBox.chu !== "Chưa rõ nét" &&
                    currentBox.chu !== "..." &&
                    !currentBox.is_unrecognized &&
                    getTeacherMasterUrl(currentBox.chu) && (
                    <div
                      className={`absolute inset-0 pointer-events-none z-10 flex items-center justify-center transition-all duration-75 ${
                        isBlinkingRed && !blinkVisible ? "opacity-0" : ""
                      }`}
                      style={{
                        opacity: isBlinkingRed ? (blinkVisible ? redOpacity : 0) : redOpacity,
                        transform: `translate(${redOffsetX}px, ${redOffsetY}px) scale(${redScale})`,
                        transformOrigin: "center center",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getTeacherMasterUrl(currentBox.chu)}
                        alt={`Mẫu chân lý: ${currentBox.chu}`}
                        className="w-full h-full object-contain filter drop-shadow-xs"
                      />
                    </div>
                  )}

                  {/* Real-time spinner overlay */}
                  {isSpotLoading && (
                    <div className="absolute inset-0 bg-violet-950/40 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
                      <Loader2 className="w-6 h-6 animate-spin mb-1 text-violet-300" />
                      <span className="text-xs font-black">AI đang đo ô ly...</span>
                    </div>
                  )}
                </div>

                {/* Overlay Controls */}
                <div className="w-full max-w-[280px] mt-2.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setShowGridOverlay(!showGridOverlay)}
                      className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer ${
                        showGridOverlay
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-200 text-slate-500"
                      }`}
                      title="Bật/Tắt lưới 4 ô ly tiểu học"
                    >
                      <Layers className="w-3 h-3" />
                      Lưới ô ly
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowRedTruthOverlay(!showRedTruthOverlay)}
                        className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer ${
                          showRedTruthOverlay
                            ? "bg-rose-100 text-rose-700 ring-1 ring-rose-300"
                            : "bg-slate-200 text-slate-500"
                        }`}
                        title="Bật/Tắt mẫu chữ đỏ chuẩn"
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                        Mẫu đỏ
                      </button>

                      {showRedTruthOverlay && (
                        <>
                          <button
                            onClick={() => setIsBlinkingRed(!isBlinkingRed)}
                            className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-0.5 active:scale-95 transition-all cursor-pointer ${
                              isBlinkingRed
                                ? "bg-amber-100 text-amber-800 ring-2 ring-amber-400 animate-pulse"
                                : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                            }`}
                            title="Bật chế độ chớp tắt mẫu đỏ để so sánh điểm lệch nét"
                          >
                            <Zap className="w-3 h-3 text-amber-600" />
                            <span>Chớp</span>
                          </button>

                          <button
                            onClick={() => setShowAdjustControls(!showAdjustControls)}
                            className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer ${
                              showAdjustControls
                                ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300"
                                : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                            }`}
                            title="Mở bảng phím điều hướng căn chỉnh vị trí nét đỏ"
                          >
                            <Target className="w-3 h-3 text-indigo-600" />
                            <span>Căn nét</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Thanh trượt độ mờ nét đỏ */}
                  {showRedTruthOverlay && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-100">
                      <span>Độ mờ nét đỏ:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="range"
                          min="0.2"
                          max="1.0"
                          step="0.05"
                          value={redOpacity}
                          onChange={(e) => setRedOpacity(parseFloat(e.target.value))}
                          className="w-24 h-1.5 accent-rose-600 cursor-pointer"
                        />
                        <span className="w-7 text-right font-bold text-rose-600">{Math.round(redOpacity * 100)}%</span>
                      </div>
                    </div>
                  )}

                  {/* Bảng D-Pad tinh chỉnh vị trí & kích thước nét đỏ */}
                  {showRedTruthOverlay && showAdjustControls && (
                    <div className="p-2 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs flex flex-col items-center gap-1.5 animate-fade-in shadow-xs">
                      <div className="w-full flex items-center justify-between text-[10px] font-black text-indigo-900 border-b border-indigo-100 pb-1">
                        <span>🎯 Căn Chỉnh Vị Trí Nét Đỏ</span>
                        <button
                          onClick={() => {
                            setRedOffsetX(0);
                            setRedOffsetY(0);
                            setRedScale(1.0);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                        >
                          Đặt lại
                        </button>
                      </div>

                      <div className="flex items-center justify-center gap-4">
                        {/* D-Pad 4 hướng */}
                        <div className="grid grid-cols-3 gap-1">
                          <div />
                          <button
                            onClick={() => setRedOffsetY((y) => y - 2)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-slate-700 active:scale-90 shadow-2xs cursor-pointer"
                            title="Dịch lên trên"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <div />

                          <button
                            onClick={() => setRedOffsetX((x) => x - 2)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-slate-700 active:scale-90 shadow-2xs cursor-pointer"
                            title="Dịch sang trái"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setRedOffsetX(0);
                              setRedOffsetY(0);
                            }}
                            className="w-7 h-7 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-[10px] flex items-center justify-center active:scale-90 shadow-2xs cursor-pointer"
                            title="Về giữa"
                          >
                            0
                          </button>
                          <button
                            onClick={() => setRedOffsetX((x) => x + 2)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-slate-700 active:scale-90 shadow-2xs cursor-pointer"
                            title="Dịch sang phải"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <div />
                          <button
                            onClick={() => setRedOffsetY((y) => y + 2)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-slate-700 active:scale-90 shadow-2xs cursor-pointer"
                            title="Dịch xuống dưới"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <div />
                        </div>

                        {/* Co giãn phóng to/thu nhỏ */}
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => setRedScale((s) => Math.min(1.5, Math.round((s + 0.05) * 100) / 100))}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-slate-700 active:scale-90 shadow-2xs cursor-pointer"
                            title="Phóng to nét đỏ (+)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-bold text-indigo-700">{Math.round(redScale * 100)}%</span>
                          <button
                            onClick={() => setRedScale((s) => Math.max(0.6, Math.round((s - 0.05) * 100) / 100))}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-slate-700 active:scale-90 shadow-2xs cursor-pointer"
                            title="Thu nhỏ nét đỏ (-)"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="w-full text-[10px] text-slate-500 text-center flex items-center justify-center gap-2 pt-1 border-t border-indigo-100/60">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" /> Mẫu chuẩn
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-800 inline-block" /> Bài viết của bé
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── AI Vision Recognition & Pedagogical Inspection ── */}
              <div className="space-y-3">
                {/* AI Recognition Header */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-violet-600 uppercase tracking-wider flex items-center gap-1.5">
                        <span>AI Vision OCR đọc nét:</span>
                        {currentBox.confidence !== undefined && currentBox.confidence > 0 && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-200">
                            {currentBox.confidence}% tin cậy
                          </span>
                        )}
                        {currentBox.confidence === 0 && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-amber-200">
                            Cần căn chỉnh lại ô
                          </span>
                        )}
                      </div>
                      <div className="text-sm sm:text-base font-black text-slate-900 truncate">
                        {currentBox.chu === "Chưa rõ nét" ? (
                          <span className="text-amber-700">Chưa nhận diện rõ nét</span>
                        ) : (
                          <>{currentBox.chu.includes(" ") ? "Từ / Cụm từ" : "Con chữ"} &quot;{currentBox.chu}&quot;</>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {(() => {
                    const theme = getStatusTheme(currentBox.loai, currentBox.is_unrecognized || currentBox.chu === "Chưa rõ nét");
                    return (
                      <span className={`text-xs font-black px-2.5 py-1 rounded-xl border ${theme.badge} flex items-center gap-1 shrink-0 shadow-xs`}>
                        <span>{theme.icon}</span>
                        <span>{theme.text}</span>
                      </span>
                    );
                  })()}
                </div>

                {/* Real Stroke Detection Details */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
                  <div className="flex items-start gap-2">
                    <Crosshair className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Đặc điểm nét phát hiện:
                      </div>
                      <p className="text-xs font-bold text-slate-800 mt-0.5 leading-snug">
                        {currentBox.tieu_de || `Soi nét chữ '${currentBox.chu}'`}
                      </p>
                    </div>
                  </div>

                  {/* Teacher Correction Tip with Audio Button (chỉ hiện khi có hướng dẫn kỹ thuật sửa tay cụ thể) */}
                  {currentBox.huong_dan_sua && (
                    <div className="p-3 rounded-xl bg-violet-50/80 border border-violet-100 flex items-start justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-black text-violet-800 mb-0.5 flex items-center gap-1">
                          <span>💡 Hướng dẫn sửa nét:</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                          {currentBox.huong_dan_sua}
                        </p>
                      </div>

                      <button
                        onClick={() => speakTip(currentBox.huong_dan_sua!)}
                        className={`min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer ${
                          isPlayingVoice
                            ? "bg-violet-600 text-white shadow-md animate-pulse"
                            : "bg-white text-violet-700 border border-violet-200 hover:bg-violet-100"
                        }`}
                        title="Nghe hướng dẫn sửa nét"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Empty selection state: Helpful guide for the teacher */
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
                <Crosshair className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 mb-2">
                Chưa chọn con chữ nào
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-4 leading-relaxed">
                Cô giáo hãy <span className="font-bold text-violet-700">dùng chuột hoặc ngón tay khoanh vào con chữ của bé</span> trên bài viết bên trái để kính lúp soi nét tại chỗ và phân tích chuẩn Bộ GD&ĐT!
              </p>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Khoanh vùng trực tiếp từng chữ ➔ Phân tích chính xác 100%!</span>
              </div>
            </div>
          )}

          {/* ── Inspected Letters History on this Page ── */}
          {boxes.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4">
              <h4 className="text-xs font-black text-slate-700 mb-2.5 flex items-center justify-between">
                <span>Danh sách chữ đã soi trên trang ({boxes.length})</span>
                <span className="text-[10px] text-slate-400">Bấm để soi lại</span>
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {boxes.map((b, idx) => {
                  const theme = getStatusTheme(b.loai, b.is_unrecognized || b.chu === "Chưa rõ nét");
                  const isSelected = (currentBox?.id === b.id);

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBoxId(b.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? "border-violet-500 bg-violet-50/80 shadow-xs"
                          : "border-slate-100 bg-slate-50 hover:bg-violet-50/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black text-slate-400">
                          #{idx + 1}
                        </span>
                        <span className="text-sm font-black font-serif text-violet-700">
                          「{b.chu}」
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badge}`}>
                          {theme.text}
                        </span>
                        <span className="text-xs font-bold text-slate-700 truncate">
                          {b.tieu_de}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBox(b.id);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa ghim"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
