"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { HandwritingEvaluationResult, HandwritingBoundingBox, AnnotationShape } from "@/types/letter";
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
  Eye,
  EyeOff,
  BookOpen,
  PenTool,
  Circle as CircleIcon,
  Square,
  MousePointer,
  Undo2,
  Trash2,
  Plus,
} from "lucide-react";
import { sound } from "@/utils/speech";
import confetti from "canvas-confetti";

// Danh sách các bài mẫu thực tế tiêu biểu từ sách "Chào em vào lớp một"
const REAL_SAMPLE_PRESETS = [
  {
    id: "sample_exam",
    title: "Bài thi viết chữ đẹp",
    sub: "Chữ v, ua, xe ngựa, Bà cho bé khế...",
    url: "/data/samples/bai_thi_viet_mau.jpg",
    badge: "Bài thi mẫu",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "sample_trang_01",
    title: "Trang 1: Các nét cơ bản",
    sub: "Ngang, sổ, xiên, móc, khuyết, thắt",
    url: "/data/samples/real/trang_01.jpg",
    badge: "Sách lớp 1",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "sample_trang_02",
    title: "Trang 2: Chữ số 0-9 & Bài 1-2",
    sub: "Tập viết chữ số & Chữ a, ca, b, bà",
    url: "/data/samples/real/trang_02.jpg",
    badge: "Số & Vần a, b",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "sample_trang_03",
    title: "Trang 3: Bài 3-6",
    sub: "Chữ c, e, o & Câu 'Ba bế bé.'",
    url: "/data/samples/real/trang_03.jpg",
    badge: "Câu ứng dụng",
    color: "from-emerald-500 to-teal-600",
  },
];

// Gợi ý tên các con chữ lớp 1 thông dụng để gán nhãn nhanh bằng 1 chạm
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [result, setResult] = useState<HandwritingEvaluationResult | null>(null);
  const [annotations, setAnnotations] = useState<HandwritingBoundingBox[]>([]);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Công cụ vẽ thủ công linh hoạt
  const [drawTool, setDrawTool] = useState<"freehand" | "circle" | "rect" | "select">("freehand");
  const [gradeTag, setGradeTag] = useState<"loi" | "chuan" | "chu_y">("loi");

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const previewPathRef = useRef<SVGPathElement>(null);
  const previewEllipseRef = useRef<SVGEllipseElement>(null);
  const previewRectRef = useRef<SVGRectElement>(null);
  const activeBoxCardRef = useRef<HTMLDivElement>(null);

  // Quản lý biến vẽ trực tiếp không qua React re-render để đạt 60fps mượt mà
  const isDrawingRef = useRef<boolean>(false);
  const currentPointsRef = useRef<[number, number][]>([]);
  const startPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Khôi phục custom API key từ localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("custom_deepseek_key") || localStorage.getItem("custom_openai_key");
      if (savedKey) setCustomApiKey(savedKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (typeof window !== "undefined") {
      if (customApiKey.trim()) {
        localStorage.setItem("custom_deepseek_key", customApiKey.trim());
      } else {
        localStorage.removeItem("custom_deepseek_key");
      }
      setShowSettings(false);
    }
  };

  const handleClearApiKey = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("custom_deepseek_key");
      localStorage.removeItem("custom_openai_key");
      setCustomApiKey("");
      setShowSettings(false);
    }
  };

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
  }, [drawTool]);

  // Cấu hình màu sắc theo loại nét
  const getColorStyles = (loai: "loi" | "chuan" | "chu_y") => {
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

  // Nén ảnh Canvas mượt mà trước khi lưu
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

  // Chọn ảnh từ máy tính
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sound.playTone(440, 0.08);
      setSelectedFileName(file.name);
      try {
        const optimized = await compressImage(file);
        setSelectedImage(optimized);
        setSelectedPresetId(null);
        setAnnotations([]);
        setResult(null);
        setActiveBoxId(null);
        setDrawTool("freehand"); // Mặc định chuyển sang công cụ vẽ khoanh tự do
      } catch (err) {
        console.error("Lỗi xử lý ảnh:", err);
      }
    }
  };

  // Chọn bài mẫu từ kho bài thi thực tế
  const handleSelectPreset = async (preset: (typeof REAL_SAMPLE_PRESETS)[0]) => {
    sound.playTone(523.25, 0.08);
    setSelectedPresetId(preset.id);
    setSelectedFileName(preset.id);
    setSelectedImage(preset.url);
    setActiveBoxId(null);
    setIsEvaluating(true);
    setResult(null);

    try {
      const res = await fetch("/api/evaluate-handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: preset.url,
          fileName: preset.id,
        }),
      });

      if (!res.ok) throw new Error("Lỗi khi tải dữ liệu bài mẫu");
      const data: HandwritingEvaluationResult = await res.json();
      setResult(data);

      const loadedBoxes = (data.bounding_boxes || []).map((b) => ({
        ...b,
        shape: b.shape || "rect",
      }));
      setAnnotations(loadedBoxes);

      if (loadedBoxes.length > 0) {
        setActiveBoxId(loadedBoxes[0].id);
      }

      if (data.anh_hop_le && data.tong_diem >= 80) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#7c3aed", "#10b981", "#f59e0b", "#ec4899"],
        });
      }
    } catch (err) {
      console.error("Lỗi tải mẫu:", err);
      alert("Không thể tải đánh giá mẫu, vui lòng thử lại!");
    } finally {
      setIsEvaluating(false);
    }
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
    if (drawTool === "select") return;
    const coords = getNormalizedCoords(e);
    if (!coords) return;

    // Giữ pointer capture để nét vẽ không bị trượt ra ngoài
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {}

    isDrawingRef.current = true;
    startPointRef.current = coords;
    currentPointsRef.current = [[coords.x, coords.y]];

    const colors = getColorStyles(gradeTag);

    // Cập nhật thuộc tính hiển thị cho phần tử preview tương ứng
    if (drawTool === "freehand" && previewPathRef.current) {
      previewPathRef.current.setAttribute("stroke", colors.stroke);
      previewPathRef.current.setAttribute("fill", colors.fill);
      previewPathRef.current.setAttribute("d", `M ${coords.x} ${coords.y}`);
      previewPathRef.current.classList.remove("hidden");
    } else if (drawTool === "circle" && previewEllipseRef.current) {
      previewEllipseRef.current.setAttribute("stroke", colors.stroke);
      previewEllipseRef.current.setAttribute("fill", colors.fill);
      previewEllipseRef.current.setAttribute("cx", coords.x.toString());
      previewEllipseRef.current.setAttribute("cy", coords.y.toString());
      previewEllipseRef.current.setAttribute("rx", "0");
      previewEllipseRef.current.setAttribute("ry", "0");
      previewEllipseRef.current.classList.remove("hidden");
    } else if (drawTool === "rect" && previewRectRef.current) {
      previewRectRef.current.setAttribute("stroke", colors.stroke);
      previewRectRef.current.setAttribute("fill", colors.fill);
      previewRectRef.current.setAttribute("x", coords.x.toString());
      previewRectRef.current.setAttribute("y", coords.y.toString());
      previewRectRef.current.setAttribute("width", "0");
      previewRectRef.current.setAttribute("height", "0");
      previewRectRef.current.classList.remove("hidden");
    }

    sound.playTone(600, 0.04);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current) return;
    const coords = getNormalizedCoords(e);
    if (!coords) return;

    if (drawTool === "freehand") {
      currentPointsRef.current.push([coords.x, coords.y]);
      if (previewPathRef.current) {
        previewPathRef.current.setAttribute("d", pointsToSvgPath(currentPointsRef.current, false));
      }
    } else if (drawTool === "circle" && previewEllipseRef.current) {
      const start = startPointRef.current;
      const cx = (start.x + coords.x) / 2;
      const cy = (start.y + coords.y) / 2;
      const rx = Math.abs(coords.x - start.x) / 2;
      const ry = Math.abs(coords.y - start.y) / 2;
      previewEllipseRef.current.setAttribute("cx", cx.toFixed(1));
      previewEllipseRef.current.setAttribute("cy", cy.toFixed(1));
      previewEllipseRef.current.setAttribute("rx", rx.toFixed(1));
      previewEllipseRef.current.setAttribute("ry", ry.toFixed(1));
    } else if (drawTool === "rect" && previewRectRef.current) {
      const start = startPointRef.current;
      const xmin = Math.min(start.x, coords.x);
      const ymin = Math.min(start.y, coords.y);
      const width = Math.abs(coords.x - start.x);
      const height = Math.abs(coords.y - start.y);
      previewRectRef.current.setAttribute("x", xmin.toFixed(1));
      previewRectRef.current.setAttribute("y", ymin.toFixed(1));
      previewRectRef.current.setAttribute("width", width.toFixed(1));
      previewRectRef.current.setAttribute("height", height.toFixed(1));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    // Ẩn các phần tử preview
    if (previewPathRef.current) previewPathRef.current.classList.add("hidden");
    if (previewEllipseRef.current) previewEllipseRef.current.classList.add("hidden");
    if (previewRectRef.current) previewRectRef.current.classList.add("hidden");

    const coords = getNormalizedCoords(e) || startPointRef.current;
    const id = `annot_${Date.now()}`;
    const nextIdx = annotations.length + 1;

    let newAnnotation: HandwritingBoundingBox | null = null;

    if (drawTool === "freehand") {
      const points = currentPointsRef.current;
      if (points.length >= 3) {
        const box_2d = computeBoundingBox(points);
        const w = box_2d[3] - box_2d[1];
        const h = box_2d[2] - box_2d[0];
        if (w >= 5 && h >= 5) {
          newAnnotation = {
            id,
            shape: "freehand",
            points,
            box_2d,
            loai: gradeTag,
            chu: `Nét ${nextIdx}`,
            tieu_de: gradeTag === "loi" ? "Nét cần rèn sửa" : gradeTag === "chuan" ? "Nét viết đẹp" : "Nét cần chú ý",
            nhan_xet: gradeTag === "loi" ? "Nét uốn hoặc độ cao chưa đạt chuẩn ô ly." : "Nét viết tròn trịa và đúng mẫu.",
            huong_dan_sua: gradeTag === "loi" ? "Căn lại độ cao con chữ đúng 2 ly trên đường kẻ 1." : "Giữ vững nét bút nắn nót này con nhé!",
          };
        }
      }
    } else if (drawTool === "circle") {
      const start = startPointRef.current;
      const cx = (start.x + coords.x) / 2;
      const cy = (start.y + coords.y) / 2;
      const rx = Math.abs(coords.x - start.x) / 2;
      const ry = Math.abs(coords.y - start.y) / 2;
      if (rx >= 5 && ry >= 5) {
        const box_2d: [number, number, number, number] = [
          Math.max(0, Math.round(cy - ry)),
          Math.max(0, Math.round(cx - rx)),
          Math.min(1000, Math.round(cy + ry)),
          Math.min(1000, Math.round(cx + rx)),
        ];
        newAnnotation = {
          id,
          shape: "circle",
          ellipse: [Math.round(cx), Math.round(cy), Math.round(rx), Math.round(ry)],
          box_2d,
          loai: gradeTag,
          chu: `Nét ${nextIdx}`,
          tieu_de: gradeTag === "loi" ? "Vùng nét cần sửa" : "Vùng nét chuẩn đẹp",
          nhan_xet: gradeTag === "loi" ? "Nét chữ uốn chưa đều tay." : "Chữ viết rất đều đặn.",
          huong_dan_sua: "Nắn nót theo đúng đường kẻ ô ly.",
        };
      }
    } else if (drawTool === "rect") {
      const start = startPointRef.current;
      const xmin = Math.min(start.x, coords.x);
      const ymin = Math.min(start.y, coords.y);
      const width = Math.abs(coords.x - start.x);
      const height = Math.abs(coords.y - start.y);
      if (width >= 8 && height >= 8) {
        const box_2d: [number, number, number, number] = [
          Math.round(ymin),
          Math.round(xmin),
          Math.round(ymin + height),
          Math.round(xmin + width),
        ];
        newAnnotation = {
          id,
          shape: "rect",
          box_2d,
          loai: gradeTag,
          chu: `Từ ${nextIdx}`,
          tieu_de: gradeTag === "loi" ? "Khoảng chữ cần lưu ý" : "Khung chữ đạt chuẩn",
          nhan_xet: "Khoảng cách và điểm nối nét.",
          huong_dan_sua: "Cách nhau đúng 1 con chữ o.",
        };
      }
    }

    if (newAnnotation) {
      setAnnotations((prev) => [...prev, newAnnotation]);
      setActiveBoxId(newAnnotation.id);
      sound.playTone(750, 0.08);
      // Tự động chuyển về công cụ chọn nét nếu muốn soi hoặc giữ vẽ tiếp
    }
  };

  // Hoàn tác nét vừa khoanh
  const handleUndoAnnotation = () => {
    sound.playTone(400, 0.06);
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

  // Cập nhật thông tin cho nét đang chọn (tên chữ, phân loại)
  const handleUpdateActiveLetter = (letterName: string) => {
    if (!activeBoxId) return;
    sound.playTone(550, 0.05);
    setAnnotations((prev) =>
      prev.map((a) => {
        if (a.id === activeBoxId) {
          return {
            ...a,
            chu: letterName,
            tieu_de: `${a.loai === "loi" ? "Nét sửa chữ" : "Chữ"} '${letterName}'`,
          };
        }
        return a;
      })
    );
  };

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

  // KÍCH HOẠT ĐÁNH GIÁ SƯ PHẠM QUA AI DỰA TRÊN CÁC NÉT ĐÃ KHOANH
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

  // Đọc hướng dẫn sửa của riêng 1 Bounding Box / Nét khoanh
  const speakBoxGuidance = (box: HandwritingBoundingBox) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const text = `${box.tieu_de}. ${box.nhan_xet}. Hướng dẫn: ${box.huong_dan_sua || "Con hãy nắn nót theo đúng dòng kẻ ô ly nhé!"}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Reset xóa ảnh làm lại
  const handleReset = () => {
    sound.playTone(440, 0.08);
    setSelectedImage(null);
    setSelectedFileName("");
    setSelectedPresetId(null);
    setAnnotations([]);
    setResult(null);
    setActiveBoxId(null);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Lấy nét đang chọn
  const activeAnnotation = annotations.find((a) => a.id === activeBoxId) || null;

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
      <div className="w-full max-w-5xl text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold bg-linear-to-r from-violet-100 via-indigo-100 to-emerald-100 text-violet-900 border border-violet-200 shadow-xs">
            <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
            Bảng Chấm Bài Sư Phạm • Khoanh Vùng & Soi Nét Thủ Công Linh Hoạt
          </span>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Cài đặt khóa API (Tùy chọn)"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">
          Khoanh Vùng & Chấm Điểm Nét Chữ Lớp 1
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl mx-auto leading-relaxed">
          Dùng bút khoanh tự do, hình tròn hoặc khung chữ nhật để chỉ đúng nét viết của học sinh, nghe cô giáo nhận xét và nhận bảng điểm chi tiết.
        </p>
      </div>

      {/* KHO BÀI THI MẪU THỰC TẾ (1-CHẠM DEMO HOÀN HẢO) */}
      <div className="w-full max-w-5xl mb-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Kho Vở Thực Tế (Sách "Chào em vào lớp một" & Bài thi)
          </span>
          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            Bấm 1 chạm xem ngay
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {REAL_SAMPLE_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between min-h-[90px] ${
                  isSelected
                    ? "bg-indigo-50/90 border-indigo-500 shadow-md ring-2 ring-indigo-400"
                    : "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 shadow-2xs"
                }`}
              >
                <div>
                  <span
                    className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md text-white bg-linear-to-r ${preset.color} mb-1`}
                  >
                    {preset.badge}
                  </span>
                  <h4 className="text-xs font-black text-slate-800 line-clamp-1">{preset.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{preset.sub}</p>
                </div>
                <div className="text-[10px] font-bold text-indigo-600 flex items-center gap-0.5 pt-1">
                  <span>Xem mẫu</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KHUNG THAO TÁC UPLOAD / CAMERA */}
      <div className="w-full max-w-5xl mb-4">
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
        </div>
      </div>

      {/* KHUNG HƯỚNG DẪN KHI CHƯA CÓ ẢNH */}
      {!selectedImage && (
        <div className="w-full max-w-4xl bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center text-2xl">
            ✏️
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Cách chấm bài & khoanh vùng nét chữ linh hoạt:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto pt-2">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-800 block mb-1">1. Tự do khoanh nét</span>
              Dùng chuột hoặc chạm tay vẽ vòng tròn/khoanh tự do quanh nét chữ cần chấm y như dùng bút đỏ thật.
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-800 block mb-1">2. Đánh dấu nét chuẩn/lỗi</span>
              Chọn màu Đỏ cho nét cần sửa, màu Xanh cho nét đẹp, màu Cam khi cần nhắc nhở bé.
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-800 block mb-1">3. AI tổng hợp bảng điểm</span>
              Bấm nút "AI Tổng Hợp Nhận Xét" để nhận bảng điểm 6 tiêu chí và nghe cô giáo đọc nhận xét toàn bài.
            </div>
          </div>
        </div>
      )}

      {/* KHUNG KẾT QUẢ & BẢNG VẼ THỦ CÔNG LINH HOẠT (LAYOUT 2 CỘT RESPONSIVE) */}
      {selectedImage && (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* CỘT TRÁI (7 CỘT): ẢNH + LỚP SVG VẼ THỦ CÔNG + THANH CÔNG CỤ + INSPECTOR */}
          <div className="lg:col-span-7 space-y-3 min-w-0">
            <div className="bg-white rounded-3xl p-3 sm:p-5 border-2 border-indigo-100 shadow-xl space-y-3">
              {/* THANH CÔNG CỤ KHOANH VÙNG THỦ CÔNG LINH HOẠT */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-violet-600" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Công Cụ Khoanh Nét Chữ
                    </span>
                    <span className="text-[11px] font-bold bg-violet-100 text-violet-800 px-2.5 py-0.5 rounded-full">
                      {annotations.length} nét đã khoanh
                    </span>
                  </div>

                  <button
                    onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                    className="min-h-[36px] px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
                  >
                    {showBoundingBoxes ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        <span>Ẩn nét</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Hiện nét</span>
                      </>
                    )}
                  </button>
                </div>

                {/* HÀNG LỰA CHỌN CÔNG CỤ VẼ & MÀU SẮC */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                  {/* Nhóm chọn hình dạng khoanh (Bút tự do / Khoanh tròn / Khung chữ nhật / Chọn) */}
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      onClick={() => {
                        sound.playTone(520, 0.05);
                        setDrawTool("freehand");
                      }}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                        drawTool === "freehand"
                          ? "bg-violet-600 text-white shadow-md ring-2 ring-violet-300"
                          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                      }`}
                      title="Khoanh bút vẽ tay tự do (như bút đỏ cô giáo)"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Bút tự do</span>
                    </button>

                    <button
                      onClick={() => {
                        sound.playTone(550, 0.05);
                        setDrawTool("circle");
                      }}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                        drawTool === "circle"
                          ? "bg-violet-600 text-white shadow-md ring-2 ring-violet-300"
                          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                      }`}
                      title="Khoanh tròn hoặc elip"
                    >
                      <CircleIcon className="w-3.5 h-3.5" />
                      <span>Khoanh tròn/Elip</span>
                    </button>

                    <button
                      onClick={() => {
                        sound.playTone(580, 0.05);
                        setDrawTool("rect");
                      }}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                        drawTool === "rect"
                          ? "bg-violet-600 text-white shadow-md ring-2 ring-violet-300"
                          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                      }`}
                      title="Khung chữ nhật"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Chữ nhật</span>
                    </button>

                    <button
                      onClick={() => {
                        sound.playTone(480, 0.05);
                        setDrawTool("select");
                      }}
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                        drawTool === "select"
                          ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300"
                          : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                      }`}
                      title="Chế độ chọn và nghe sửa nét"
                    >
                      <MousePointer className="w-3.5 h-3.5" />
                      <span>Chọn nét</span>
                    </button>
                  </div>

                  {/* Nhóm chọn loại nét (Màu đỏ / Xanh / Cam) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        sound.playTone(500, 0.04);
                        setGradeTag("loi");
                      }}
                      className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                        gradeTag === "loi"
                          ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-300"
                          : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
                      }`}
                      title="Nét cần sửa (màu đỏ)"
                    >
                      <span>❌ Sửa</span>
                    </button>

                    <button
                      onClick={() => {
                        sound.playTone(550, 0.04);
                        setGradeTag("chuan");
                      }}
                      className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                        gradeTag === "chuan"
                          ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300"
                          : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                      }`}
                      title="Nét viết chuẩn đẹp (màu xanh)"
                    >
                      <span>✅ Đẹp</span>
                    </button>

                    <button
                      onClick={() => {
                        sound.playTone(520, 0.04);
                        setGradeTag("chu_y");
                      }}
                      className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 ${
                        gradeTag === "chu_y"
                          ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-300"
                          : "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50"
                      }`}
                      title="Cần chú ý rèn thêm (màu cam)"
                    >
                      <span>⚠️ Chú ý</span>
                    </button>
                  </div>

                  {/* Nhóm Hoàn tác & Xóa */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleUndoAnnotation}
                      disabled={annotations.length === 0}
                      className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-30 text-slate-700 border border-slate-200 flex items-center justify-center active:scale-95 transition-all"
                      title="Hoàn tác nét vừa khoanh (Undo)"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleClearAllAnnotations}
                      disabled={annotations.length === 0}
                      className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 disabled:opacity-30 border border-slate-200 hover:border-rose-300 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                      title="Xóa hết các nét đã khoanh"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa hết</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* KHUNG ẢNH CHÍNH CÓ LỚP SVG VẼ THỦ CÔNG LINH HOẠT */}
              <div className="relative w-full max-h-[500px] rounded-2xl overflow-hidden bg-slate-900/5 border border-slate-200 flex items-center justify-center p-1">
                <div className="relative inline-block max-w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage}
                    alt="Bài viết của học sinh"
                    className="max-h-[470px] w-auto h-auto object-contain rounded-xl block select-none pointer-events-none"
                  />

                  {/* LỚP SVG TƯƠNG TÁC ĐỒ HỌA LINH HOẠT */}
                  {showBoundingBoxes && (
                    <svg
                      ref={svgRef}
                      className={`absolute inset-0 w-full h-full select-none ${
                        drawTool !== "select" ? "cursor-crosshair" : "cursor-pointer"
                      }`}
                      viewBox="0 0 1000 1000"
                      preserveAspectRatio="none"
                      style={{
                        touchAction: "none",
                        WebkitUserSelect: "none",
                        userSelect: "none",
                      }}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                    >
                      {/* 1. Các nét đã khoanh */}
                      {annotations.map((annot, idx) => {
                        const isActive = activeBoxId === annot.id;
                        const colors = getColorStyles(annot.loai);
                        const [ymin, xmin, ymax, xmax] = annot.box_2d || [0, 0, 100, 100];

                        return (
                          <g
                            key={annot.id || idx}
                            className="cursor-pointer transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              sound.playTone(600, 0.08);
                              setActiveBoxId(annot.id);
                              speakBoxGuidance(annot);
                            }}
                          >
                            {/* Nét khoanh tự do (Freehand Lasso) */}
                            {annot.shape === "freehand" && annot.points && (
                              <path
                                d={pointsToSvgPath(annot.points, true)}
                                fill={colors.fill}
                                stroke={colors.stroke}
                                strokeWidth={isActive ? 5 : 3}
                                strokeDasharray={isActive ? "none" : annot.loai === "loi" ? "6 3" : "none"}
                                className={isActive ? "filter drop-shadow-md animate-pulse" : ""}
                              />
                            )}

                            {/* Nét khoanh tròn / Elip */}
                            {annot.shape === "circle" && annot.ellipse && (
                              <ellipse
                                cx={annot.ellipse[0]}
                                cy={annot.ellipse[1]}
                                rx={annot.ellipse[2]}
                                ry={annot.ellipse[3]}
                                fill={colors.fill}
                                stroke={colors.stroke}
                                strokeWidth={isActive ? 5 : 3}
                                strokeDasharray={isActive ? "none" : annot.loai === "loi" ? "6 3" : "none"}
                                className={isActive ? "filter drop-shadow-md animate-pulse" : ""}
                              />
                            )}

                            {/* Khung chữ nhật */}
                            {(annot.shape === "rect" || (!annot.shape && annot.box_2d)) && (
                              <rect
                                x={xmin}
                                y={ymin}
                                width={Math.max(15, xmax - xmin)}
                                height={Math.max(15, ymax - ymin)}
                                fill={colors.fill}
                                stroke={colors.stroke}
                                strokeWidth={isActive ? 5 : 3}
                                rx={6}
                                strokeDasharray={isActive ? "none" : annot.loai === "loi" ? "6 3" : "none"}
                                className={isActive ? "filter drop-shadow-md animate-pulse" : ""}
                              />
                            )}

                            {/* Nhãn con chữ nhỏ trên đầu nét khoanh */}
                            <rect
                              x={xmin}
                              y={Math.max(4, ymin - 22)}
                              width={Math.max(34, (annot.chu?.length || 1) * 12 + 16)}
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
                          </g>
                        );
                      })}

                      {/* 2. Phần tử xem trước theo thời gian thực (Zero React Re-render!) */}
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

                {/* Hiệu ứng quét tia Laser khi AI đang phân tích */}
                {isEvaluating && (
                  <div className="absolute inset-0 bg-violet-600/15 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
                    <div className="w-full h-1 bg-linear-to-r from-transparent via-violet-500 to-transparent absolute top-1/2 -translate-y-1/2 animate-bounce" />
                    <div className="bg-white/95 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-violet-200">
                      <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                      <div className="text-left">
                        <span className="text-xs font-black text-slate-800 block">
                          AI Sư Phạm đang đối chiếu các nét khoanh...
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Đo độ cao chuẩn 2 ly, tính điểm và lập bảng nhận xét
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* HÀNG NÚT CHIPS TƯƠNG TÁC TỪNG NÉT ĐÃ KHOANH */}
              {annotations.length > 0 && (
                <div className="pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                      Danh sách các nét đã khoanh (Bấm để xem & nghe sửa):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (Xanh: Đẹp • Cam: Chú ý • Đỏ: Cần sửa)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {annotations.map((annot, idx) => {
                      const isActive = activeBoxId === annot.id;
                      const colors = getColorStyles(annot.loai);

                      return (
                        <button
                          key={annot.id || idx}
                          onClick={() => {
                            sound.playTone(600, 0.08);
                            setActiveBoxId(annot.id);
                            speakBoxGuidance(annot);
                          }}
                          className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-bold transition-all active:scale-95 border flex items-center gap-1.5 ${
                            isActive
                              ? `${colors.badgeBg} text-white shadow-md ring-2 ring-violet-300`
                              : annot.loai === "loi"
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              : annot.loai === "chuan"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          <span>{annot.loai === "loi" ? "❌" : annot.loai === "chuan" ? "✅" : "⚠️"}</span>
                          <span>{annot.chu} #{idx + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BẢNG ĐIỀU KHIỂN & SOI CHI TIẾT NÉT ĐANG CHỌN (INSPECTOR CARD) */}
              {activeAnnotation && (
                <div
                  ref={activeBoxCardRef}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all animate-in fade-in duration-300 ${
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
                        {activeAnnotation.tieu_de} (Chữ: "{activeAnnotation.chu}")
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
                        className="min-h-[36px] p-2 rounded-xl bg-white hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center shadow-2xs active:scale-95 border border-rose-200"
                        title="Xóa nét này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Thanh chọn nhanh tên con chữ và loại đánh giá */}
                  <div className="space-y-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-700">Gán nhanh tên chữ:</span>
                      {COMMON_LETTER_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => handleUpdateActiveLetter(chip)}
                          className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold transition-all active:scale-95 ${
                            activeAnnotation.chu === chip
                              ? "bg-violet-600 text-white border-violet-600"
                              : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                          }`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
                      <span className="font-bold text-slate-700">Đổi trạng thái:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleUpdateActiveTag("loi")}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                            activeAnnotation.loai === "loi"
                              ? "bg-rose-600 text-white"
                              : "bg-white text-rose-700 border border-rose-200"
                          }`}
                        >
                          ❌ Cần sửa
                        </button>
                        <button
                          onClick={() => handleUpdateActiveTag("chuan")}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                            activeAnnotation.loai === "chuan"
                              ? "bg-emerald-600 text-white"
                              : "bg-white text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          ✅ Nét đẹp
                        </button>
                        <button
                          onClick={() => handleUpdateActiveTag("chu_y")}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                            activeAnnotation.loai === "chu_y"
                              ? "bg-amber-500 text-white"
                              : "bg-white text-amber-700 border border-amber-200"
                          }`}
                        >
                          ⚠️ Chú ý
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <strong className="text-slate-800">Nhận xét:</strong>{" "}
                        <span className="text-slate-700">{activeAnnotation.nhan_xet}</span>
                      </div>
                      {activeAnnotation.huong_dan_sua && (
                        <div>
                          <strong className="text-emerald-800">Cách sửa đúng:</strong>{" "}
                          <span className="text-emerald-950 font-medium">
                            {activeAnnotation.huong_dan_sua}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Nút hành động đổi ảnh & kích hoạt AI tổng hợp bảng điểm */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  onClick={handleReset}
                  disabled={isEvaluating}
                  className="min-h-[44px] px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Đổi ảnh khác</span>
                </button>

                <button
                  onClick={handleEvaluateWithAi}
                  disabled={isEvaluating}
                  className={`min-h-[44px] px-6 py-2.5 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
                    isEvaluating
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : "bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-200"
                  }`}
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang Tổng Hợp Đánh Giá...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>AI Tổng Hợp Nhận Xét & Chấm Điểm</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (5 CỘT): KẾT QUẢ SƯ PHẠM + 6 TIÊU CHÍ + LỜI KHUYÊN */}
          <div className="lg:col-span-5 space-y-4 min-w-0">
            {result ? (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-emerald-200 shadow-2xl space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* 1. Header điểm số tổng quát */}
                <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-br from-emerald-500 via-teal-600 to-indigo-600 text-white shadow-lg flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                      Kết Quả Đánh Giá Lớp 1
                    </span>
                    <h3 className="text-lg sm:text-xl font-black truncate">{result.xep_loai}</h3>
                    <p className="text-xs text-emerald-100 leading-relaxed line-clamp-3">
                      {result.nhan_xet_chung}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-white/20 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 min-w-[90px] border border-white/30 shrink-0">
                    <span className="text-[11px] font-bold text-emerald-100">Tổng điểm</span>
                    <span className="text-3xl font-black text-amber-300">
                      {result.tong_diem}
                    </span>
                    <span className="text-[10px] text-white/80">Thang 100</span>
                  </div>
                </div>

                {/* Nút nghe cô giáo đọc nhận xét toàn bài */}
                <div className="flex items-center justify-between bg-violet-50 p-3 rounded-2xl border border-violet-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <Volume2 className="w-4 h-4 text-violet-600 shrink-0" />
                    <span className="text-xs font-bold text-violet-900 truncate">
                      Nghe cô giáo đọc nhận xét:
                    </span>
                  </div>
                  <button
                    onClick={toggleSpeech}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0 ${
                      isSpeaking
                        ? "bg-rose-600 text-white animate-pulse"
                        : "bg-violet-600 hover:bg-violet-700 text-white"
                    }`}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isSpeaking ? "Dừng đọc" : "Nghe cô đọc"}</span>
                  </button>
                </div>

                {/* 2. Bảng 6 Tiêu chí sư phạm chi tiết */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-violet-600" />
                    <span>6 Tiêu Chí Chuẩn Lớp 1 (Thang 10)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      {
                        key: "dung_mau_chu",
                        label: "1. Đúng mẫu & Độ cao 2 ly",
                        val: result.tieu_chi.dung_mau_chu,
                      },
                      {
                        key: "do_deu_net",
                        label: "2. Độ đều nét & Lực bút",
                        val: result.tieu_chi.do_deu_net,
                      },
                      {
                        key: "khoang_cach",
                        label: "3. Khoảng cách chữ & tiếng",
                        val: result.tieu_chi.khoang_cach,
                      },
                      {
                        key: "do_thang_hang",
                        label: "4. Độ thẳng hàng trên ô ly",
                        val: result.tieu_chi.do_thang_hang,
                      },
                      {
                        key: "trinh_bay",
                        label: "5. Giữ vở sạch & Chữ đẹp",
                        val: result.tieu_chi.trinh_bay,
                      },
                      {
                        key: "net_co_ban",
                        label: "6. Nét nối, thắt & Dấu thanh",
                        val: result.tieu_chi.net_co_ban,
                      },
                    ].map((crit) => (
                      <div
                        key={crit.key}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-700 truncate pr-1">{crit.label}</span>
                          <span className="text-violet-700 font-black shrink-0">{crit.val}/10</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
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
                <div className="space-y-2 pt-1">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                    <span className="text-xs font-black text-emerald-800 uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Điểm Sáng Đáng Khen Của Bé
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {result.diem_tot.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-emerald-600 font-black shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                    <span className="text-xs font-black text-amber-900 uppercase flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      Chỗ Cần Luyện Thêm Để Đẹp Hơn
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {result.loi_can_cai_thien.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-amber-600 font-black shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 4. Lời khuyên dành cho phụ huynh */}
                <div className="p-3.5 rounded-2xl bg-linear-to-r from-violet-50 to-indigo-50 border border-violet-200 flex items-start gap-2.5">
                  <span className="text-xl shrink-0">🏡</span>
                  <div className="text-xs space-y-0.5">
                    <span className="font-black text-violet-950 block">
                      Lời Khuyên Dành Cho Ba Mẹ:
                    </span>
                    <p className="text-slate-700 leading-relaxed">{result.nhan_xet_phu_huynh}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center text-xl">
                  ✏️
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Bảng Chấm Điểm Sư Phạm
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hãy dùng công cụ <strong>"Bút tự do"</strong> hoặc <strong>"Khoanh tròn"</strong> để khoanh các nét chữ bạn muốn chấm trên bài thi, sau đó bấm <strong>"AI Tổng Hợp Nhận Xét & Chấm Điểm"</strong> để xem bảng điểm!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>DeepSeek Flash Vision Đã Kích Hoạt Sẵn</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Hệ thống đã nạp sẵn khóa DeepSeek Flash Vision tốc độ cao. Bạn có thể sử dụng ngay mà không cần cấu hình thêm.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                API Key Riêng (DeepSeek hoặc OpenAI sk-...):
              </label>
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-violet-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {customApiKey && (
                <button
                  onClick={handleClearApiKey}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 min-h-[44px]"
                >
                  Xóa Key
                </button>
              )}
              <button
                onClick={() => setShowSettings(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 min-h-[44px]"
              >
                Đóng
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs min-h-[44px]"
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
