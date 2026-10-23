"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { HandwritingEvaluationResult, HandwritingBoundingBox, AnnotationShape } from "@/types/letter";
import {
  Sparkles,
  Camera,
  Upload,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  X,
  FileText,
  Loader2,
  ChevronRight,
  Lightbulb,
  Eye,
  EyeOff,
  PenTool,
  Circle as CircleIcon,
  Square,
  MousePointer,
  Undo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
} from "lucide-react";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";

// Gợi ý tên các con chữ lớp 1 thông dụng để gán nhãn nhanh
const COMMON_LETTER_CHIPS = ["c", "e", "ê", "a", "b", "o", "ca", "cá", "bà", "bó cỏ", "Ba", "ua", "v", "Dấu thanh"];

// Hàm chuyển đổi mảng tọa độ điểm sang đường cong Bézier mượt mà (SVG Path)
function pointsToSvgPath(points?: [number, number][], isClosed: boolean = true): string {
  if (!points || points.length < 2) return "";
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = ((points[i][0] + points[i + 1][0]) / 2).toFixed(1);
    const yc = ((points[i][1] + points[i + 1][1]) / 2).toFixed(1);
    d += ` Q ${points[i][0].toFixed(1)} ${points[i][1].toFixed(1)}, ${xc} ${yc}`;
  }
  d += ` L ${points[points.length - 1][0].toFixed(1)} ${points[points.length - 1][1].toFixed(1)}`;
  if (isClosed) d += " Z";
  return d;
}

// Hàm tính khung bao chữ nhật (bounding envelope) bao quanh tập hợp điểm
function computeBoundingBox(points: [number, number][]): [number, number, number, number] {
  let minX = 1000, maxX = 0, minY = 1000, maxY = 0;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return [Math.round(minY), Math.round(minX), Math.round(maxY), Math.round(maxX)];
}

export function AiHandwritingGrader() {
  // LƯU Ý BẢO MẬT & DUNG LƯỢNG: Không lưu ảnh vào localStorage hay cookie.
  // Khi reload trang, state tự động trở về null, xóa toàn bộ ảnh và dữ liệu tạm!
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [result, setResult] = useState<HandwritingEvaluationResult | null>(null);
  const [annotations, setAnnotations] = useState<HandwritingBoundingBox[]>([]);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);

  // Bộ công cụ chỉnh sửa đa năng
  const [drawTool, setDrawTool] = useState<"freehand" | "circle" | "rect" | "select">("freehand");
  const [gradeTag, setGradeTag] = useState<"loi" | "chuan" | "chu_y">("loi");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [inspectMode, setInspectMode] = useState<"illustration" | "student" | "teacher">("illustration");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const previewPathRef = useRef<SVGPathElement>(null);
  const previewEllipseRef = useRef<SVGEllipseElement>(null);
  const previewRectRef = useRef<SVGRectElement>(null);

  // Quản lý biến vẽ trực tiếp không qua React re-render để đạt 60fps mượt mà
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<[number, number][]>([]);
  const startPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Lắng nghe touch events với { passive: false } để triệt tiêu độ trễ cuộn trên di động (Chuẩn AGENTS.md)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onTouchStart = (e: TouchEvent) => {
      if (drawTool !== "select") {
        e.preventDefault();
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (drawTool !== "select") {
        e.preventDefault();
      }
    };

    svg.addEventListener("touchstart", onTouchStart, { passive: false });
    svg.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      svg.removeEventListener("touchstart", onTouchStart);
      svg.removeEventListener("touchmove", onTouchMove);
    };
  }, [drawTool, selectedImage]);

  // Màu sắc hiển thị theo trạng thái nét chấm
  const getColorStyles = (loai: "chuan" | "loi" | "chu_y") => {
    switch (loai) {
      case "loi":
        return {
          stroke: "#ef4444",
          fill: "rgba(239, 68, 68, 0.18)",
          badgeBg: "bg-rose-600",
          name: "❌ Cần sửa",
        };
      case "chuan":
        return {
          stroke: "#10b981",
          fill: "rgba(16, 185, 129, 0.18)",
          badgeBg: "bg-emerald-600",
          name: "✅ Nét đẹp",
        };
      case "chu_y":
      default:
        return {
          stroke: "#f59e0b",
          fill: "rgba(245, 158, 11, 0.18)",
          badgeBg: "bg-amber-500",
          name: "⚠️ Chú ý",
        };
    }
  };

  // Nén ảnh Canvas mượt mà trước khi lưu trong bộ nhớ tạm client
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

  // Xoay ảnh 90 độ theo chiều kim đồng hồ (Xử lý ảnh chụp điện thoại bị ngược)
  const handleRotateImage = async () => {
    if (!selectedImage || isRotating) return;
    setIsRotating(true);
    sound.playTone(520, 0.06);

    try {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.height;
        canvas.height = img.width;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((90 * Math.PI) / 180);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          const rotatedUrl = canvas.toDataURL("image/jpeg", 0.88);
          setSelectedImage(rotatedUrl);
          // Xóa các nét cũ vì tọa độ đã thay đổi theo góc quay
          setAnnotations([]);
          setActiveBoxId(null);
          setResult(null);
        }
        setIsRotating(false);
      };
      img.onerror = () => setIsRotating(false);
      img.src = selectedImage;
    } catch {
      setIsRotating(false);
    }
  };

  // Chọn ảnh từ máy tính hoặc điện thoại
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sound.playTone(440, 0.08);
      setSelectedFileName(file.name);
      try {
        const optimized = await compressImage(file);
        setSelectedImage(optimized);
        setAnnotations([]);
        setResult(null);
        setActiveBoxId(null);
        setDrawTool("freehand");
        setZoomLevel(1);
      } catch (err) {
        console.error("Lỗi xử lý ảnh:", err);
      }
    }
  };

  // Kéo thả ảnh trực tiếp
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      sound.playTone(440, 0.08);
      setSelectedFileName(file.name);
      try {
        const optimized = await compressImage(file);
        setSelectedImage(optimized);
        setAnnotations([]);
        setResult(null);
        setActiveBoxId(null);
        setDrawTool("freehand");
        setZoomLevel(1);
      } catch (err) {
        console.error("Lỗi kéo thả ảnh:", err);
      }
    }
  };

  // Thử nghiệm nhanh với bài mẫu
  const handleLoadSample = async (
    sampleUrl: string = "/data/samples/bai_1_hoc_sinh_xau.jpg",
    fileName: string = "bai_1_hoc_sinh_xau.jpg"
  ) => {
    sound.playTone(523.25, 0.08);
    setSelectedFileName(fileName);
    setSelectedImage(sampleUrl);
    setAnnotations([]);
    setResult(null);
    setActiveBoxId(null);
    setDrawTool("select");
    setZoomLevel(1);
    setInspectMode("student");
  };

  // XỬ LÝ VẼ THỦ CÔNG LINH HOẠT TRÊN SVG (FREEHAND LASSO / CIRCLE / RECTANGLE)
  const getNormalizedCoords = (e: React.PointerEvent<SVGSVGElement>): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const clientX = e.clientX;
    const clientY = e.clientY;

    const scaleX = 1000 / rect.width;
    const scaleY = 1000 / rect.height;

    const x = Math.max(0, Math.min(1000, (clientX - rect.left) * scaleX));
    const y = Math.max(0, Math.min(1000, (clientY - rect.top) * scaleY));

    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!selectedImage || isEvaluating) return;
    if (drawTool === "select") return;

    const coords = getNormalizedCoords(e);
    if (!coords) return;

    (e.target as Element).setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    startPointRef.current = coords;
    currentPointsRef.current = [[coords.x, coords.y]];

    const colorConfig = getColorStyles(gradeTag);

    if (drawTool === "freehand" && previewPathRef.current) {
      previewPathRef.current.setAttribute("stroke", colorConfig.stroke);
      previewPathRef.current.setAttribute("fill", colorConfig.fill);
      previewPathRef.current.setAttribute("d", `M ${coords.x} ${coords.y}`);
      previewPathRef.current.classList.remove("hidden");
    } else if (drawTool === "circle" && previewEllipseRef.current) {
      previewEllipseRef.current.setAttribute("stroke", colorConfig.stroke);
      previewEllipseRef.current.setAttribute("fill", colorConfig.fill);
      previewEllipseRef.current.setAttribute("cx", coords.x.toString());
      previewEllipseRef.current.setAttribute("cy", coords.y.toString());
      previewEllipseRef.current.setAttribute("rx", "0");
      previewEllipseRef.current.setAttribute("ry", "0");
      previewEllipseRef.current.classList.remove("hidden");
    } else if (drawTool === "rect" && previewRectRef.current) {
      previewRectRef.current.setAttribute("stroke", colorConfig.stroke);
      previewRectRef.current.setAttribute("fill", colorConfig.fill);
      previewRectRef.current.setAttribute("x", coords.x.toString());
      previewRectRef.current.setAttribute("y", coords.y.toString());
      previewRectRef.current.setAttribute("width", "0");
      previewRectRef.current.setAttribute("height", "0");
      previewRectRef.current.classList.remove("hidden");
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current || drawTool === "select") return;
    const coords = getNormalizedCoords(e);
    if (!coords) return;

    if (drawTool === "freehand") {
      const pts = currentPointsRef.current;
      const last = pts[pts.length - 1];
      const dist = Math.hypot(coords.x - last[0], coords.y - last[1]);
      if (dist >= 3) {
        pts.push([coords.x, coords.y]);
        if (previewPathRef.current) {
          const pathD = pointsToSvgPath(pts, false);
          previewPathRef.current.setAttribute("d", pathD);
        }
      }
    } else if (drawTool === "circle") {
      const start = startPointRef.current;
      const cx = (start.x + coords.x) / 2;
      const cy = (start.y + coords.y) / 2;
      const rx = Math.abs(coords.x - start.x) / 2;
      const ry = Math.abs(coords.y - start.y) / 2;
      if (previewEllipseRef.current) {
        previewEllipseRef.current.setAttribute("cx", cx.toFixed(1));
        previewEllipseRef.current.setAttribute("cy", cy.toFixed(1));
        previewEllipseRef.current.setAttribute("rx", rx.toFixed(1));
        previewEllipseRef.current.setAttribute("ry", ry.toFixed(1));
      }
    } else if (drawTool === "rect") {
      const start = startPointRef.current;
      const x = Math.min(start.x, coords.x);
      const y = Math.min(start.y, coords.y);
      const width = Math.abs(coords.x - start.x);
      const height = Math.abs(coords.y - start.y);
      if (previewRectRef.current) {
        previewRectRef.current.setAttribute("x", x.toFixed(1));
        previewRectRef.current.setAttribute("y", y.toFixed(1));
        previewRectRef.current.setAttribute("width", width.toFixed(1));
        previewRectRef.current.setAttribute("height", height.toFixed(1));
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current || drawTool === "select") return;
    isDrawingRef.current = false;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {}

    if (previewPathRef.current) previewPathRef.current.classList.add("hidden");
    if (previewEllipseRef.current) previewEllipseRef.current.classList.add("hidden");
    if (previewRectRef.current) previewRectRef.current.classList.add("hidden");

    const endCoords = getNormalizedCoords(e) || startPointRef.current;
    const start = startPointRef.current;
    const newId = `box_${Date.now()}`;
    const nextIdx = annotations.length + 1;

    if (drawTool === "freehand") {
      const pts = currentPointsRef.current;
      if (pts.length < 5) return;
      const bbox = computeBoundingBox(pts);
      const w = bbox[3] - bbox[1];
      const h = bbox[2] - bbox[0];
      if (w < 8 && h < 8) return;

      sound.playTone(620, 0.05);
      const newBox: HandwritingBoundingBox = {
        id: newId,
        shape: "freehand",
        points: pts,
        box_2d: bbox,
        loai: gradeTag,
        chu: `Nét ${nextIdx}`,
        tieu_de: `${gradeTag === "loi" ? "Nét cần sửa" : gradeTag === "chuan" ? "Nét chuẩn" : "Chú ý"} #${nextIdx}`,
        nhan_xet:
          gradeTag === "loi"
            ? "Nét chữ vượt ô ly hoặc chưa đúng quy chuẩn mẫu."
            : gradeTag === "chuan"
            ? "Nét viết tròn đều, uốn lượn đúng kỹ thuật."
            : "Nét chữ tương đối đều, cần nắn nót thêm.",
        huong_dan_sua:
          gradeTag === "loi"
            ? "Cầm bút đúng 3 ngón, nắn nhẹ cổ tay theo đường kẻ ngang 1."
            : undefined,
      };

      setAnnotations((prev) => [...prev, newBox]);
      setActiveBoxId(newId);
    } else if (drawTool === "circle") {
      const cx = (start.x + endCoords.x) / 2;
      const cy = (start.y + endCoords.y) / 2;
      const rx = Math.abs(endCoords.x - start.x) / 2;
      const ry = Math.abs(endCoords.y - start.y) / 2;
      if (rx < 6 && ry < 6) return;

      sound.playTone(620, 0.05);
      const bbox: [number, number, number, number] = [
        Math.max(0, Math.round(cy - ry)),
        Math.max(0, Math.round(cx - rx)),
        Math.min(1000, Math.round(cy + ry)),
        Math.min(1000, Math.round(cx + rx)),
      ];

      const newBox: HandwritingBoundingBox = {
        id: newId,
        shape: "circle",
        ellipse: [Math.round(cx), Math.round(cy), Math.round(rx), Math.round(ry)],
        box_2d: bbox,
        loai: gradeTag,
        chu: `Nét ${nextIdx}`,
        tieu_de: `${gradeTag === "loi" ? "Nét cần sửa" : gradeTag === "chuan" ? "Nét chuẩn" : "Chú ý"} #${nextIdx}`,
        nhan_xet:
          gradeTag === "loi"
            ? "Nét khoanh tròn cần điều chỉnh độ rộng và độ cao."
            : gradeTag === "chuan"
            ? "Hình dáng chữ tròn trịa, cân đối rất đẹp."
            : "Lưu ý độ uốn của nét tròn.",
      };

      setAnnotations((prev) => [...prev, newBox]);
      setActiveBoxId(newId);
    } else if (drawTool === "rect") {
      const ymin = Math.min(start.y, endCoords.y);
      const xmin = Math.min(start.x, endCoords.x);
      const ymax = Math.max(start.y, endCoords.y);
      const xmax = Math.max(start.x, endCoords.x);
      if (xmax - xmin < 8 && ymax - ymin < 8) return;

      sound.playTone(620, 0.05);
      const bbox: [number, number, number, number] = [
        Math.round(ymin),
        Math.round(xmin),
        Math.round(ymax),
        Math.round(xmax),
      ];

      const newBox: HandwritingBoundingBox = {
        id: newId,
        shape: "rect",
        box_2d: bbox,
        loai: gradeTag,
        chu: `Nét ${nextIdx}`,
        tieu_de: `${gradeTag === "loi" ? "Nét cần sửa" : gradeTag === "chuan" ? "Nét chuẩn" : "Chú ý"} #${nextIdx}`,
        nhan_xet:
          gradeTag === "loi"
            ? "Khung chữ này cần sửa khoảng cách và độ cao."
            : gradeTag === "chuan"
            ? "Chữ cái nằm ngay ngắn trên dòng kẻ ô ly."
            : "Cần chú ý giữ khoảng cách đều nhau.",
      };

      setAnnotations((prev) => [...prev, newBox]);
      setActiveBoxId(newId);
    }
  };

  // Hoàn tác nét vẽ gần nhất
  const handleUndoAnnotation = () => {
    if (annotations.length === 0) return;
    sound.playTone(420, 0.08);
    setAnnotations((prev) => {
      const next = prev.slice(0, -1);
      setActiveBoxId(next.length > 0 ? next[next.length - 1].id : null);
      return next;
    });
  };

  // Xóa nét đang chọn
  const handleDeleteActiveAnnotation = () => {
    if (!activeBoxId) return;
    sound.playTone(380, 0.08);
    setAnnotations((prev) => {
      const next = prev.filter((a) => a.id !== activeBoxId);
      setActiveBoxId(next.length > 0 ? next[next.length - 1].id : null);
      return next;
    });
  };

  // Xóa tất cả nét khoanh
  const handleClearAllAnnotations = () => {
    if (confirm("Bạn có chắc chắn muốn xóa hết tất cả các nét đã khoanh không?")) {
      sound.playTone(350, 0.1);
      setAnnotations([]);
      setActiveBoxId(null);
    }
  };

  // Đổi nhãn trạng thái nét đang chọn
  const handleUpdateActiveTag = (newTag: "loi" | "chuan" | "chu_y") => {
    if (!activeBoxId) return;
    sound.playTone(600, 0.05);
    setAnnotations((prev) =>
      prev.map((a) => {
        if (a.id === activeBoxId) {
          return {
            ...a,
            loai: newTag,
            tieu_de: `${newTag === "loi" ? "Nét cần sửa" : newTag === "chuan" ? "Nét chuẩn" : "Chú ý"}: "${a.chu}"`,
          };
        }
        return a;
      })
    );
  };

  // Đổi tên chữ nhanh
  const handleUpdateActiveLetter = (letterName: string) => {
    if (!activeBoxId) return;
    sound.playTone(550, 0.05);
    setAnnotations((prev) =>
      prev.map((a) => {
        if (a.id === activeBoxId) {
          return {
            ...a,
            chu: letterName,
            tieu_de: `${a.loai === "loi" ? "Nét cần sửa" : "Nét chuẩn"}: "${letterName}"`,
          };
        }
        return a;
      })
    );
  };

  // KÍCH HOẠT DUY NHẤT 1 NÚT: AI CHẤM BÀI VIẾT
  const handleEvaluateWithAi = async () => {
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
          fileName: selectedFileName,
          annotations: annotations,
        }),
      });

      if (!res.ok) {
        throw new Error("Lỗi khi kết nối đến dịch vụ AI");
      }

      const data: HandwritingEvaluationResult = await res.json();
      setResult(data);

      if (Array.isArray(data.bounding_boxes) && data.bounding_boxes.length > 0 && annotations.length === 0) {
        setAnnotations(data.bounding_boxes);
        const firstLoi = data.bounding_boxes.find((b) => b.loai === "loi") || data.bounding_boxes[0];
        if (firstLoi) {
          setActiveBoxId(firstLoi.id);
        }
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

  // Đọc hướng dẫn riêng cho nét đang chọn
  const speakBoxGuidance = (box: HandwritingBoundingBox) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const text = `${box.tieu_de}. ${box.nhan_xet} ${box.huong_dan_sua ? `Cách sửa đúng: ${box.huong_dan_sua}` : ""}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Reset trang về trạng thái ban đầu
  const handleReset = () => {
    setSelectedImage(null);
    setSelectedFileName("");
    setAnnotations([]);
    setResult(null);
    setActiveBoxId(null);
    setZoomLevel(1);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const activeAnnotation = annotations.find((a) => a.id === activeBoxId);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ẨN INPUT CHỌN FILE VÀ CAMERA */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* HEADER GIAO DIỆN CHÍNH */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 text-violet-800 text-xs sm:text-sm font-bold shadow-2xs">
          <Sparkles className="w-4 h-4 text-violet-600 animate-spin" />
          <span>Trí Tuệ Nhân Tạo Lớp 1 • Chấm Điểm & Luyện Chữ Đẹp</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
          AI Chấm & Nhận Xét Bài Viết Ô Ly
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Tải ảnh bài viết của bé lên, dùng bút khoanh những nét cần nhận xét và bấm chấm điểm.
        </p>
      </div>

      {/* MÀN HÌNH 1: KHI CHƯA CÓ ẢNH -> KHUNG TẢI ẢNH ĐA NĂNG & THÂN THIỆN */}
      {!selectedImage && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={handleDrop}
            className={`border-3 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all flex flex-col items-center justify-center gap-5 ${
              isDraggingFile
                ? "border-violet-500 bg-violet-50/80 scale-[1.01]"
                : "border-slate-300 bg-white hover:border-violet-400 hover:bg-slate-50/60 shadow-lg"
            }`}
          >
            <div className="w-20 h-20 rounded-3xl bg-linear-to-tr from-violet-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-violet-200">
              <Camera className="w-10 h-10" />
            </div>

            <div className="space-y-1 max-w-md">
              <h3 className="text-lg sm:text-xl font-black text-slate-800">
                Tải Hoặc Chụp Ảnh Trang Vở Của Bé
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Kéo thả file ảnh vào đây, hoặc bấm nút bên dưới để chọn ảnh chụp ô ly rõ nét.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="min-h-[48px] px-6 py-3 rounded-2xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm sm:text-base flex items-center gap-2.5 shadow-lg shadow-violet-200 active:scale-95 transition-all"
              >
                <Camera className="w-5 h-5" />
                <span>Chụp Ảnh Vở Bé (Camera)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[48px] px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm sm:text-base flex items-center gap-2.5 border-2 border-slate-200 shadow-md active:scale-95 transition-all"
              >
                <Upload className="w-5 h-5 text-violet-600" />
                <span>Chọn Ảnh Từ Máy</span>
              </button>
            </div>

            {/* Kho mẫu thực tế đối chiếu chuẩn GiaoDienMongMuon */}
            <div className="pt-4 border-t border-slate-200/80 w-full space-y-2 text-center">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">
                Hoặc chọn nhanh bài mẫu từ sách chuẩn hóa để trải nghiệm:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => handleLoadSample("/data/samples/bai_1_hoc_sinh_xau.jpg", "bai_1_hoc_sinh_xau.jpg")}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Bài 1 (Chữ 'a') - Mẫu có lỗi nét (Chuẩn GiaoDienMongMuon)</span>
                </button>

                <button
                  onClick={() => handleLoadSample("/data/samples/bai_1_hoc_sinh_dep.jpg", "bai_1_hoc_sinh_dep.jpg")}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Bài 1 (Chữ 'a') - Vở sạch chữ đẹp lớp 1</span>
                </button>

                <button
                  onClick={() => handleLoadSample("/data/samples/bai_thi_viet_mau.jpg", "bai_thi_viet_mau.jpg")}
                  className="px-3.5 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span>Bài thi viết tổng hợp mẫu</span>
                </button>
              </div>
            </div>
          </div>

          {/* Lưu ý bảo mật & tài nguyên máy chủ */}
          <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200/80 flex items-start gap-3 text-left">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-0.5">
              <span className="font-bold text-slate-800 block">
                Bảo Mật Quyền Riêng Tư & Tiết Kiệm Dung Lượng:
              </span>
              <p>
                Ảnh vở của bé chỉ được xử lý tạm thời trên trình duyệt và tự động xóa hoàn toàn khi tải lại trang. Hệ thống không lưu trữ bất kỳ ảnh cá nhân nào trên máy chủ.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MÀN HÌNH 2: KHI ĐÃ CÓ ẢNH -> TRÌNH CHỈNH SỬA ĐA NĂNG & KHOANH VÙNG LINH HOẠT */}
      {selectedImage && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* THANH CÔNG CỤ CHỈNH SỬA ĐA NĂNG (VERSATILE TOOLBAR) */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-3">
            {/* Nhóm chọn hình dạng khoanh */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider hidden sm:inline mr-1">
                Công cụ:
              </span>

              <button
                onClick={() => {
                  sound.playTone(520, 0.05);
                  setDrawTool("freehand");
                }}
                className={`min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                  drawTool === "freehand"
                    ? "bg-violet-600 text-white shadow-md ring-2 ring-violet-300"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                title="Bút tự do khoanh tròn như cô giáo"
              >
                <PenTool className="w-4 h-4" />
                <span>Bút tự do</span>
              </button>

              <button
                onClick={() => {
                  sound.playTone(550, 0.05);
                  setDrawTool("circle");
                }}
                className={`min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                  drawTool === "circle"
                    ? "bg-violet-600 text-white shadow-md ring-2 ring-violet-300"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                title="Khoanh tròn hoặc elip"
              >
                <CircleIcon className="w-4 h-4" />
                <span>Khoanh tròn</span>
              </button>

              <button
                onClick={() => {
                  sound.playTone(580, 0.05);
                  setDrawTool("rect");
                }}
                className={`min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                  drawTool === "rect"
                    ? "bg-violet-600 text-white shadow-md ring-2 ring-violet-300"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                title="Khung chữ nhật đóng hàng chữ"
              >
                <Square className="w-4 h-4" />
                <span>Chữ nhật</span>
              </button>

              <button
                onClick={() => {
                  sound.playTone(480, 0.05);
                  setDrawTool("select");
                }}
                className={`min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                  drawTool === "select"
                    ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                title="Chọn nét để xem hoặc xóa"
              >
                <MousePointer className="w-4 h-4" />
                <span>Chọn nét</span>
              </button>
            </div>

            {/* Nhóm nhãn đánh giá nét */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  sound.playTone(500, 0.04);
                  setGradeTag("loi");
                }}
                className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                  gradeTag === "loi"
                    ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-300"
                    : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
                }`}
                title="Khoanh nét cần sửa (màu đỏ)"
              >
                <span>❌ Sửa</span>
              </button>

              <button
                onClick={() => {
                  sound.playTone(550, 0.04);
                  setGradeTag("chuan");
                }}
                className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                  gradeTag === "chuan"
                    ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300"
                    : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                }`}
                title="Khoanh nét viết đẹp (màu xanh)"
              >
                <span>✅ Đẹp</span>
              </button>

              <button
                onClick={() => {
                  sound.playTone(520, 0.04);
                  setGradeTag("chu_y");
                }}
                className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                  gradeTag === "chu_y"
                    ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-300"
                    : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50"
                }`}
                title="Cần chú ý rèn thêm (màu cam)"
              >
                <span>⚠️ Chú ý</span>
              </button>
            </div>

            {/* Nhóm tính năng đa năng: Xoay ảnh 90°, Thu phóng, Hoàn tác, Xóa */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleRotateImage}
                disabled={isRotating}
                className="min-h-[42px] min-w-[42px] p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all flex items-center justify-center"
                title="Xoay ảnh 90° nếu ảnh chụp bị ngược"
              >
                <RotateCw className={`w-4 h-4 ${isRotating ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={() => setZoomLevel((z) => Math.min(2, +(z + 0.25).toFixed(2)))}
                className="min-h-[42px] min-w-[42px] p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all flex items-center justify-center"
                title="Phóng to"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                onClick={() => setZoomLevel((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
                className="min-h-[42px] min-w-[42px] p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all flex items-center justify-center"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {zoomLevel !== 1 && (
                <button
                  onClick={() => setZoomLevel(1)}
                  className="min-h-[42px] px-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold active:scale-95"
                  title="Về kích thước chuẩn 100%"
                >
                  100%
                </button>
              )}

              <button
                onClick={handleUndoAnnotation}
                disabled={annotations.length === 0}
                className="min-h-[42px] min-w-[42px] p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center"
                title="Hoàn tác nét vừa vẽ (Undo)"
              >
                <Undo2 className="w-4 h-4" />
              </button>

              <button
                onClick={handleClearAllAnnotations}
                disabled={annotations.length === 0}
                className="min-h-[42px] min-w-[42px] p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 disabled:opacity-40 active:scale-95 transition-all flex items-center justify-center"
                title="Xóa tất cả các nét đã khoanh"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* BỐ CỤC CHÍNH: 2 CỘT (CANVAS BÊN TRÁI + KẾT QUẢ ĐÁNH GIÁ BÊN PHẢI) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* CỘT TRÁI (7 CỘT HOẶC 12 CỘT NẾU CHƯA CHẤM): CANVAS KHUNG VẼ */}
            <div className={`${result ? "lg:col-span-7" : "lg:col-span-12"} space-y-4`}>
              {/* KHUNG CANVAS CHỨA ẢNH & LỚP SVG TƯƠNG TÁC */}
              <div className="bg-slate-900 rounded-3xl p-2 sm:p-3 shadow-2xl relative overflow-hidden">
                <div
                  className="relative rounded-2xl overflow-auto flex items-center justify-center bg-black/40 min-h-[380px] max-h-[75vh]"
                  style={{ touchAction: drawTool === "select" ? "auto" : "none" }}
                >
                  <div
                    className="relative transition-transform duration-150 origin-top"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: "center top",
                    }}
                  >
                    {/* Ảnh bài viết */}
                    <img
                      src={selectedImage}
                      alt="Bài tập viết của bé"
                      className="w-full h-auto max-h-[70vh] object-contain rounded-xl select-none pointer-events-none block mx-auto"
                      draggable={false}
                    />

                    {/* SVG Bounding Boxes Overlay */}
                    {showBoundingBoxes && (
                      <svg
                        ref={svgRef}
                        viewBox="0 0 1000 1000"
                        preserveAspectRatio="none"
                        className={`absolute inset-0 w-full h-full select-none ${
                          drawTool === "select" ? "cursor-default" : "cursor-crosshair"
                        }`}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                      >
                        {/* 1. Các nét người dùng đã khoanh */}
                        {annotations.map((annot, idx) => {
                          const isSelected = activeBoxId === annot.id;
                          const colors = getColorStyles(annot.loai);

                          let shapeElement = null;

                          if (annot.shape === "freehand" && annot.points && annot.points.length > 1) {
                            const pathD = pointsToSvgPath(annot.points, true);
                            shapeElement = (
                              <path
                                d={pathD}
                                fill={isSelected ? colors.fill.replace("0.18", "0.32") : colors.fill}
                                stroke={colors.stroke}
                                strokeWidth={isSelected ? 4 : 2.5}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                              />
                            );
                          } else if (annot.shape === "circle" && annot.ellipse) {
                            const [cx, cy, rx, ry] = annot.ellipse;
                            shapeElement = (
                              <ellipse
                                cx={cx}
                                cy={cy}
                                rx={rx}
                                ry={ry}
                                fill={isSelected ? colors.fill.replace("0.18", "0.32") : colors.fill}
                                stroke={colors.stroke}
                                strokeWidth={isSelected ? 4 : 2.5}
                              />
                            );
                          } else {
                            const [ymin, xmin, ymax, xmax] = annot.box_2d;
                            const w = Math.max(10, xmax - xmin);
                            const h = Math.max(10, ymax - ymin);
                            shapeElement = (
                              <rect
                                x={xmin}
                                y={ymin}
                                width={w}
                                height={h}
                                rx={6}
                                fill={isSelected ? colors.fill.replace("0.18", "0.32") : colors.fill}
                                stroke={colors.stroke}
                                strokeWidth={isSelected ? 4 : 2.5}
                              />
                            );
                          }

                          const [ymin, xmin] = annot.box_2d;

                          return (
                            <g
                              key={annot.id || idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                sound.playTone(550, 0.05);
                                setActiveBoxId(annot.id);
                              }}
                              className="cursor-pointer transition-opacity hover:opacity-90"
                            >
                              {shapeElement}

                              {/* CHUẨN GIAO DIỆN MONG MUỐN: VÒNG TRÒN NÉT ĐỨT + ĐƯỜNG CHỈ DẪN CALLOUT */}
                              {annot.callout && (
                                <g className="pointer-events-none">
                                  {/* Vòng tròn nét đứt bao quanh vị trí lỗi */}
                                  <circle
                                    cx={annot.callout.target[0]}
                                    cy={annot.callout.target[1]}
                                    r={annot.callout.radius || 24}
                                    fill="none"
                                    stroke={colors.stroke}
                                    strokeWidth={3}
                                    strokeDasharray="6 4"
                                  />
                                  {/* Đường chỉ dẫn chéo từ vòng tròn ra điểm neo */}
                                  <line
                                    x1={annot.callout.target[0]}
                                    y1={annot.callout.target[1]}
                                    x2={annot.callout.anchor[0]}
                                    y2={annot.callout.anchor[1]}
                                    stroke={colors.stroke}
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                  />
                                  {/* Chấm tròn đỏ tại đầu mút (chuẩn GiaoDienMongMuon.png) */}
                                  <circle
                                    cx={annot.callout.anchor[0]}
                                    cy={annot.callout.anchor[1]}
                                    r={5.5}
                                    fill={colors.stroke}
                                  />
                                  {/* Nhãn tooltip nhỏ tại điểm neo */}
                                  <g transform={`translate(${annot.callout.anchor[0] + 6}, ${annot.callout.anchor[1] - 12})`}>
                                    <rect
                                      x={0}
                                      y={0}
                                      width={Math.max(120, (annot.callout.title || annot.tieu_de).length * 7.5 + 18)}
                                      height={24}
                                      rx={6}
                                      fill="#0f172a"
                                      stroke={colors.stroke}
                                      strokeWidth={1.5}
                                    />
                                    <text
                                      x={8}
                                      y={16}
                                      fill="#ffffff"
                                      fontSize="11"
                                      fontWeight="bold"
                                      fontFamily="sans-serif"
                                    >
                                      {annot.callout.title || annot.tieu_de}
                                    </text>
                                  </g>
                                </g>
                              )}

                              {/* Tag nhãn nhỏ phía trên nét nếu không có callout */}
                              {!annot.callout && (
                                <>
                                  <rect
                                    x={xmin}
                                    y={Math.max(4, ymin - 22)}
                                    width={Math.max(40, (annot.chu?.length || 4) * 8 + 32)}
                                    height={20}
                                    fill={colors.stroke}
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
                                    {annot.chu} #{idx + 1}
                                  </text>
                                </>
                              )}
                            </g>
                          );
                        })}

                        {/* 2. Phần tử xem trước khi đang kéo chuột/tay (Zero React Re-render) */}
                        <path
                          ref={previewPathRef}
                          d=""
                          fill="rgba(239, 68, 68, 0.18)"
                          stroke="#ef4444"
                          strokeWidth={3}
                          strokeDasharray="4 3"
                          className="hidden pointer-events-none"
                        />
                        <ellipse
                          ref={previewEllipseRef}
                          cx={0}
                          cy={0}
                          rx={0}
                          ry={0}
                          fill="rgba(239, 68, 68, 0.18)"
                          stroke="#ef4444"
                          strokeWidth={3}
                          strokeDasharray="4 3"
                          className="hidden pointer-events-none"
                        />
                        <rect
                          ref={previewRectRef}
                          x={0}
                          y={0}
                          width={0}
                          height={0}
                          rx={6}
                          fill="rgba(239, 68, 68, 0.18)"
                          stroke="#ef4444"
                          strokeWidth={3}
                          strokeDasharray="4 3"
                          className="hidden pointer-events-none"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Hiệu ứng quét tia Laser khi AI đang phân tích */}
                {isEvaluating && (
                  <div className="absolute inset-0 bg-violet-600/20 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
                    <div className="w-full h-1 bg-linear-to-r from-transparent via-violet-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-bounce" />
                    <div className="bg-white/95 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-violet-200">
                      <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                      <div className="text-left">
                        <span className="text-xs font-black text-slate-800 block">
                          AI DeepSeek đang phân tích các nét khoanh...
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Đo độ cao ô ly chuẩn và tổng hợp nhận xét sư phạm
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* BẢNG ĐIỀU KHIỂN NÉT ĐANG CHỌN (NẾU CÓ CHỌN NÉT) */}
              {activeAnnotation && (
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    activeAnnotation.loai === "loi"
                      ? "bg-rose-50/90 border-rose-200"
                      : activeAnnotation.loai === "chuan"
                      ? "bg-emerald-50/90 border-emerald-200"
                      : "bg-amber-50/90 border-amber-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase text-white ${
                          getColorStyles(activeAnnotation.loai).badgeBg
                        }`}
                      >
                        {getColorStyles(activeAnnotation.loai).name}
                      </span>
                      <h4 className="text-sm font-black text-slate-900">
                        {activeAnnotation.tieu_de}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => speakBoxGuidance(activeAnnotation)}
                        className="min-h-[36px] px-3 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 border border-slate-200"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-violet-600" />
                        <span>Nghe sửa nét này</span>
                      </button>

                      <button
                        onClick={handleDeleteActiveAnnotation}
                        className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center gap-1 shadow-2xs active:scale-95 border border-rose-200"
                        title="Xóa nét này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-700">Đổi trạng thái:</span>
                    <button
                      onClick={() => handleUpdateActiveTag("loi")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeAnnotation.loai === "loi"
                          ? "bg-rose-600 text-white"
                          : "bg-white text-rose-700 border border-rose-200"
                      }`}
                    >
                      ❌ Cần sửa
                    </button>
                    <button
                      onClick={() => handleUpdateActiveTag("chuan")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeAnnotation.loai === "chuan"
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      ✅ Nét đẹp
                    </button>
                    <button
                      onClick={() => handleUpdateActiveTag("chu_y")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        activeAnnotation.loai === "chu_y"
                          ? "bg-amber-500 text-white"
                          : "bg-white text-amber-700 border border-amber-200"
                      }`}
                    >
                      ⚠️ Chú ý
                    </button>
                  </div>

                  {/* KHUNG SOI NÉT VIẾT CHUẨN GIAO DIỆN MONG MUỐN (DARK Ô LY GRID) */}
                  <div id="dark-grid-inspector" className="mt-3 p-4 rounded-3xl bg-[#090d16] border-2 border-slate-800 text-white shadow-2xl relative overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${activeAnnotation.loai === "loi" ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
                        <h4 className="text-sm font-black text-slate-100 tracking-wide">
                          {activeAnnotation.loai === "loi" ? "Ví dụ nét viết chưa đạt" : "Soi chi tiết nét viết"}
                        </h4>
                      </div>

                      {/* Bộ nút chuyển đổi 3 chế độ xem đối chiếu */}
                      <div className="flex flex-wrap items-center gap-2">
                        {activeAnnotation.loai === "loi" && (
                          <button
                            onClick={() => setInspectMode("illustration")}
                            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 ${
                              inspectMode === "illustration"
                                ? "bg-rose-600 text-white shadow-md ring-2 ring-rose-400"
                                : "bg-slate-800 text-slate-300 hover:text-white"
                            }`}
                          >
                            <span>🎯 Minh họa lỗi</span>
                          </button>
                        )}
                        <button
                          onClick={() => setInspectMode("student")}
                          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 ${
                            inspectMode === "student"
                              ? "bg-amber-600 text-white shadow-md ring-2 ring-amber-400"
                              : "bg-slate-800 text-slate-300 hover:text-white"
                          }`}
                        >
                          <span>✍️ Nét bé viết</span>
                        </button>
                        {activeAnnotation.teacher_sample_url && (
                          <button
                            onClick={() => setInspectMode("teacher")}
                            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center gap-1.5 ${
                              inspectMode === "teacher"
                                ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400"
                                : "bg-slate-800 text-slate-300 hover:text-white"
                            }`}
                          >
                            <span>🎓 Mẫu cô giáo</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* VÙNG HIỂN THỊ CHỮ VÀ LƯỚI Ô LY CHUẨN GIAODIENMONGMUON.PNG */}
                    <div className="relative w-full aspect-[4/3] max-w-sm mx-auto rounded-2xl bg-[#050811] border border-slate-800/90 flex items-center justify-center overflow-hidden shadow-inner">
                      {inspectMode === "illustration" ? (
                        /* CHẾ ĐỘ 1: MINH HỌA GIAO DIỆN MONG MUỐN CHUẨN 100% */
                        <img
                          src="/data/samples/giao_dien_mong_muon_a_loi.png"
                          alt="Ví dụ nét viết chưa đạt chuẩn"
                          className="w-full h-full object-contain select-none"
                        />
                      ) : (
                        /* CHẾ ĐỘ 2 & 3: LƯỚI Ô LY DARK NAVY + NÉT BÉ HOẶC CÔ GIÁO */
                        <>
                          {/* Lưới ô ly SVG nền tối */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none select-none opacity-40" viewBox="0 0 300 225">
                            <defs>
                              <pattern id="darkOlyGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#2563eb" strokeWidth="0.8" />
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#darkOlyGrid)" />
                            {/* Đường kẻ ngang đậm số 1 (baseline) */}
                            <line x1="0" y1="165" x2="300" y2="165" stroke="#3b82f6" strokeWidth="2.5" />
                            {/* Đường kẻ ngang 3 (độ cao 2 ly) */}
                            <line x1="0" y1="105" x2="300" y2="105" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 3" />
                          </svg>

                          {/* Hình ảnh nét viết */}
                          <img
                            src={
                              inspectMode === "teacher" && activeAnnotation.teacher_sample_url
                                ? activeAnnotation.teacher_sample_url
                                : activeAnnotation.sample_crop_url || "/data/samples/crop_a_loi_nho_cao.jpg"
                            }
                            alt="Soi nét chữ"
                            className="w-auto h-3/4 object-contain z-10 select-none drop-shadow-md rounded-lg"
                          />

                          {/* Vòng tròn nét đứt và chỉ dẫn nếu ở chế độ nét bé viết và có lỗi */}
                          {inspectMode === "student" && activeAnnotation.loai === "loi" && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 300 225">
                              {/* Vòng tròn nét đứt đỏ quanh điểm lỗi */}
                              <circle cx="152" cy="98" r="26" fill="rgba(239, 68, 68, 0.08)" stroke="#ef4444" strokeWidth="3" strokeDasharray="6 4" />
                              {/* Đường chỉ dẫn chéo lên góc trên bên phải */}
                              <line x1="170" y1="80" x2="225" y2="35" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                              {/* Chấm tròn đỏ ở đầu mút */}
                              <circle cx="225" cy="35" r="6" fill="#ef4444" />
                            </svg>
                          )}
                        </>
                      )}
                    </div>

                    {/* Nhận xét và hướng dẫn sư phạm */}
                    <div className="mt-3 text-xs space-y-1.5 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                      <p className="font-bold text-slate-200">
                        📌 <span className="text-amber-400">Đánh giá hình học:</span> {activeAnnotation.nhan_xet}
                      </p>
                      {activeAnnotation.huong_dan_sua && (
                        <p className="text-slate-300">
                          💡 <span className="text-emerald-400">Cách sửa tay cho bé:</span> {activeAnnotation.huong_dan_sua}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* THANH HÀNH ĐỘNG DUY NHẤT: BẤM NÚT ĐỂ AI CHẤM BÀI VIẾT */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleReset}
                  disabled={isEvaluating}
                  className="min-h-[46px] px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Đổi ảnh khác</span>
                </button>

                <button
                  onClick={handleEvaluateWithAi}
                  disabled={isEvaluating}
                  className={`min-h-[48px] px-7 py-3 rounded-2xl font-black text-sm sm:text-base flex items-center gap-2.5 shadow-xl transition-all active:scale-95 ${
                    isEvaluating
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : "bg-linear-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white shadow-emerald-200"
                  }`}
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang Phân Tích & Chấm Điểm...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>
                        AI Chấm Bài Viết {annotations.length > 0 ? `(Đã khoanh ${annotations.length} nét)` : ""}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* CỘT PHẢI (5 CỘT): KẾT QUẢ ĐÁNH GIÁ SƯ PHẠM KHI AI CHẤM XONG */}
            {result && (
              <div className="lg:col-span-5 space-y-4 min-w-0">
                <div className="bg-white rounded-3xl p-5 border-2 border-emerald-200 shadow-2xl space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  {/* Điểm số & Xếp loại tổng quát */}
                  <div className="p-5 rounded-3xl bg-linear-to-br from-emerald-500 via-teal-600 to-indigo-600 text-white shadow-lg flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                        Kết Quả Đánh Giá Lớp 1
                      </span>
                      <h3 className="text-lg sm:text-xl font-black truncate">{result.xep_loai}</h3>
                      <p className="text-xs text-emerald-100 leading-relaxed line-clamp-3">
                        {result.nhan_xet_chung}
                      </p>
                    </div>

                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-center shrink-0 border border-white/30">
                      <span className="text-3xl sm:text-4xl font-black block leading-none">
                        {result.tong_diem}
                      </span>
                      <span className="text-[10px] font-bold uppercase opacity-90">Thang 100</span>
                    </div>
                  </div>

                  {/* Nút bấm nghe cô giáo đọc nhận xét */}
                  <div className="p-3 bg-violet-50 rounded-2xl border border-violet-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-violet-600 shrink-0" />
                      <span className="text-xs font-bold text-violet-950">
                        Nghe cô giáo đọc nhận xét:
                      </span>
                    </div>
                    <button
                      onClick={toggleSpeech}
                      className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs active:scale-95 ${
                        isSpeaking
                          ? "bg-rose-500 hover:bg-rose-600 text-white"
                          : "bg-violet-600 hover:bg-violet-700 text-white"
                      }`}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Dừng đọc</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Nghe cô đọc</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 6 Tiêu chuẩn chấm điểm Bộ GD&ĐT */}
                  <div className="space-y-2">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-violet-600" />
                      6 Tiêu Chí Chuẩn Lớp 1 (Thang 10)
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between font-bold text-slate-700 mb-1">
                          <span className="truncate">1. Đúng mẫu ô ly</span>
                          <span className="text-violet-600">{result.tieu_chi.dung_mau_chu}/10</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-600 rounded-full"
                            style={{ width: `${(result.tieu_chi.dung_mau_chu / 10) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between font-bold text-slate-700 mb-1">
                          <span className="truncate">2. Lực tay đều</span>
                          <span className="text-violet-600">{result.tieu_chi.do_deu_net}/10</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-600 rounded-full"
                            style={{ width: `${(result.tieu_chi.do_deu_net / 10) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between font-bold text-slate-700 mb-1">
                          <span className="truncate">3. Khoảng cách</span>
                          <span className="text-violet-600">{result.tieu_chi.khoang_cach}/10</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-600 rounded-full"
                            style={{ width: `${(result.tieu_chi.khoang_cach / 10) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between font-bold text-slate-700 mb-1">
                          <span className="truncate">4. Thẳng dòng 1</span>
                          <span className="text-violet-600">{result.tieu_chi.do_thang_hang}/10</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-600 rounded-full"
                            style={{ width: `${(result.tieu_chi.do_thang_hang / 10) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between font-bold text-slate-700 mb-1">
                          <span className="truncate">5. Vở sạch sẽ</span>
                          <span className="text-violet-600">{result.tieu_chi.trinh_bay}/10</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-600 rounded-full"
                            style={{ width: `${(result.tieu_chi.trinh_bay / 10) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex justify-between font-bold text-slate-700 mb-1">
                          <span className="truncate">6. Nét nối & dấu</span>
                          <span className="text-violet-600">{result.tieu_chi.net_co_ban}/10</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-600 rounded-full"
                            style={{ width: `${(result.tieu_chi.net_co_ban / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Điểm sáng đáng khen */}
                  {result.diem_tot?.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1.5">
                      <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Điểm Sáng Đáng Khen Của Bé:
                      </span>
                      <ul className="text-xs text-emerald-950 space-y-1 list-disc list-inside">
                        {result.diem_tot.map((dt, i) => (
                          <li key={i}>{dt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Chỗ cần cải thiện */}
                  {result.loi_can_cai_thien?.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 space-y-1.5">
                      <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        Chỗ Cần Luyện Thêm Để Đẹp Hơn:
                      </span>
                      <ul className="text-xs text-amber-950 space-y-1 list-disc list-inside">
                        {result.loi_can_cai_thien.map((lc, i) => (
                          <li key={i}>{lc}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lời khuyên cho Ba Mẹ */}
                  {result.nhan_xet_phu_huynh && (
                    <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-950 space-y-1">
                      <span className="font-black text-indigo-900 block">
                        🏡 Lời Khuyên Dành Riêng Cho Ba Mẹ:
                      </span>
                      <p className="leading-relaxed">{result.nhan_xet_phu_huynh}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
