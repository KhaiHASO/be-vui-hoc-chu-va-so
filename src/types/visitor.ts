export interface RealAccessLog {
  id: string;
  timestamp: number; // Unix timestamp ms
  timeStr: string; // Định dạng ngày giờ: "14:25:30 24/10/2026"
  ip: string; // IP gốc (được lưu trên server)
  maskedIp: string; // IP che nhẹ 3 số cuối: "115.76.49.xxx"
  city: string; // "Biên Hòa", "Hà Nội", "TP. Hồ Chí Minh"
  region: string; // "Đồng Nai", "Hà Nội", "Sài Gòn"
  country: string; // "Việt Nam", "Nhật Bản", "Hoa Kỳ"
  isp: string; // "Viettel Group", "VNPT", "FPT Telecom"
  device: "Máy tính bàn / Laptop" | "Điện thoại Di động" | "iPad / Máy tính bảng" | "Bot Tìm kiếm";
  browser: string; // "Chrome 155", "Safari 17.5", "Edge 128"
  os: string; // "macOS", "iOS", "Android", "Windows"
  actionType: "page_view" | "letter_view" | "writing_practice" | "ai_grader" | "strokes" | "digraphs" | "math_game" | "parent_guide";
  actionName: string; // Mô tả hành động thực tế bé hoặc phụ huynh thực hiện
  path: string; // Đường dẫn tương tác
  isDev: boolean; // true nếu là Chủ sản phẩm / Kỹ sư
  statusCode: number; // 200, 206...
}

export interface RealAccessStats {
  totalVisits: number;
  todayVisits: number;
  activeNow: number;
  uniqueIpsCount: number;
  uniqueProvincesCount: number;
  topProvinces: { name: string; count: number }[];
  topDevices: { name: string; count: number }[];
  lastUpdated: number;
}

export interface AccessLogApiResponse {
  success: boolean;
  stats: RealAccessStats;
  logs: RealAccessLog[];
  isClientDev: boolean;
  clientIp: string;
  clientLocation: string;
}
