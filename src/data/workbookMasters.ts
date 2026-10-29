// src/data/workbookMasters.ts
// Quản lý và tra cứu 310 mẫu chữ viết chuẩn tiểu học đã được vector hóa màu đỏ (#dc2626)

import rawMastersData from "./workbook_masters.json";

export interface WorkbookMasterItem {
  name: string;
  slug: string;
  category: "letter" | "rhyme" | "word" | "sentence";
  width: number;
  height: number;
  aspectRatio: number;
  svgUrl: string;
  pngUrl: string;
  redPngUrl: string;
}

export interface WorkbookMastersDataset {
  total: number;
  generatedAt: string;
  color: string;
  masters: WorkbookMasterItem[];
  lookup: Record<string, string>;
  singleLetters: Record<string, string>;
}

export const WORKBOOK_MASTERS: WorkbookMastersDataset = rawMastersData as WorkbookMastersDataset;

// Fast lookup cache
const lookupMap: Map<string, string> = new Map(Object.entries(WORKBOOK_MASTERS.lookup));
const mastersMap: Map<string, WorkbookMasterItem> = new Map(
  WORKBOOK_MASTERS.masters.map((m) => [m.name.toLowerCase().normalize("NFC"), m])
);

/**
 * Bỏ dấu tiếng Việt để fallback
 */
export function stripVietnameseDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFC");
}

/**
 * Tìm kiếm đường dẫn mẫu chữ chuẩn (Red Vector SVG hoặc PNG)
 * @param text Chữ cái, vần, từ hoặc câu cần đối chiếu (ví dụ: "a", "uông", "áo thêu", "nhà bà có cà chua")
 * @param preferSvg True để dùng vector SVG siêu nét, False để dùng PNG
 */
export function getTeacherMasterUrl(text: string, preferSvg = true): string {
  if (!text || text === "..." || text.includes("chưa rõ") || text.includes("chua ro")) {
    return "";
  }

  // Chuẩn hóa Unicode NFC và chữ thường
  const norm = text.toLowerCase().normalize("NFC").trim();
  const cleanPunct = norm.replace(/[,.\-!?;:"'()]+/g, " ").replace(/\s+/g, " ").trim();

  // 1. Tìm chính xác trong lookup
  let foundSvg = lookupMap.get(norm) || lookupMap.get(cleanPunct);

  // 2. Nếu chưa thấy, thử tìm dạng không dấu
  if (!foundSvg) {
    const unaccented = stripVietnameseDiacritics(cleanPunct);
    foundSvg = lookupMap.get(unaccented);
  }

  // 3. Fallback: Nếu là từ ghép chưa có, lấy chữ cái đầu tiên
  if (!foundSvg && cleanPunct.length > 0) {
    const firstChar = cleanPunct.charAt(0);
    foundSvg = lookupMap.get(firstChar) || WORKBOOK_MASTERS.singleLetters[firstChar];
  }

  if (!foundSvg) {
    return "";
  }

  if (!preferSvg) {
    // Chuyển /data/red_vectors/[name].svg -> /data/teacher_masters/master_[name].png
    const baseName = foundSvg.replace("/data/red_vectors/", "").replace(".svg", "");
    return `/data/teacher_masters/master_${baseName}.png`;
  }

  return foundSvg;
}

/**
 * Lấy thông tin chi tiết của mẫu chữ (kích thước, tỷ lệ ô ly, phân loại)
 */
export function getTeacherMasterInfo(text: string): WorkbookMasterItem | null {
  if (!text) return null;
  const norm = text.toLowerCase().normalize("NFC").trim();
  const cleanPunct = norm.replace(/[,.\-!?;:"'()]+/g, " ").replace(/\s+/g, " ").trim();

  if (mastersMap.has(norm)) return mastersMap.get(norm)!;
  if (mastersMap.has(cleanPunct)) return mastersMap.get(cleanPunct)!;

  // Tra qua url
  const svgUrl = getTeacherMasterUrl(text, true);
  if (!svgUrl) return null;

  const baseName = svgUrl.replace("/data/red_vectors/", "").replace(".svg", "").toLowerCase();
  return mastersMap.get(baseName) || null;
}
