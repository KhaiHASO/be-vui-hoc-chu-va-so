export type ActivityCategory =
  | "all"
  | "ai_grader"
  | "writing"
  | "strokes"
  | "digraphs"
  | "math"
  | "quiz"
  | "general";

export interface VisitorLogEntry {
  id: string;
  timestamp: number; // Unix timestamp ms
  location: string; // Tỉnh / Thành phố
  institution: string; // Tên trường tiểu học hoặc nhóm phụ huynh
  userRole: "Giáo viên" | "Phụ huynh" | "Học sinh";
  activityCategory: "ai_grader" | "writing" | "strokes" | "digraphs" | "math" | "quiz" | "general";
  activityTitle: string;
  activityDetail: string;
  device: "iPad / Tablet" | "iPhone / iOS" | "Android" | "Máy tính bàn / Laptop";
  score?: number | string; // Điểm số nếu có (vd: 94/100, 10/10 sao)
  isLive?: boolean;
}

export interface VisitorStats {
  totalVisits: number;
  todayVisits: number;
  activeNow: number;
  aiGradedCount: number;
  provincesCount: number;
  schoolCount: number;
  lastUpdated: number;
}

export interface VisitorApiResponse {
  success: boolean;
  stats: VisitorStats;
  logs: VisitorLogEntry[];
  isDevExcluded?: boolean;
}
