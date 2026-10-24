import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import seedData from "@/data/seed_visitor_logs.json";
import { VisitorLogEntry, VisitorStats } from "@/types/visitor";

const PERSISTENT_FILE_PATH = path.join(process.cwd(), "public", "dynamic_visitor_logs.json");

interface DynamicStore {
  totalVisitsOffset: number;
  todayVisitsOffset: number;
  aiGradedOffset: number;
  realLogs: VisitorLogEntry[];
}

let memoryStore: DynamicStore = {
  totalVisitsOffset: 0,
  todayVisitsOffset: 0,
  aiGradedOffset: 0,
  realLogs: [],
};

// Đọc dữ liệu đã lưu nếu có
function loadStore(): DynamicStore {
  try {
    if (fs.existsSync(PERSISTENT_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(PERSISTENT_FILE_PATH, "utf8"));
      return {
        totalVisitsOffset: data.totalVisitsOffset || 0,
        todayVisitsOffset: data.todayVisitsOffset || 0,
        aiGradedOffset: data.aiGradedOffset || 0,
        realLogs: Array.isArray(data.realLogs) ? data.realLogs : [],
      };
    }
  } catch (err) {
    console.warn("Could not load dynamic visitor logs:", err);
  }
  return memoryStore;
}

function saveStore(store: DynamicStore) {
  try {
    memoryStore = store;
    fs.writeFileSync(PERSISTENT_FILE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.warn("Could not save dynamic visitor logs:", err);
  }
}

// Khởi tạo
memoryStore = loadStore();

function detectDevice(userAgent: string): "iPad / Tablet" | "iPhone / iOS" | "Android" | "Máy tính bàn / Laptop" {
  const ua = userAgent.toLowerCase();
  if (ua.includes("ipad") || (ua.includes("macintosh") && "ontouchend" in globalThis)) {
    return "iPad / Tablet";
  }
  if (ua.includes("iphone") || ua.includes("ipod")) {
    return "iPhone / iOS";
  }
  if (ua.includes("android")) {
    if (ua.includes("tablet") || ua.includes("sm-t") || ua.includes("tab")) {
      return "iPad / Tablet";
    }
    return "Android";
  }
  return "Máy tính bàn / Laptop";
}

const VIETNAM_LOCATIONS = [
  { city: "Hà Nội", inst: "Tiểu học Chu Văn An (Tây Hồ)" },
  { city: "TP. Hồ Chí Minh", inst: "Tiểu học Lương Định Của (Quận 3)" },
  { city: "Đà Nẵng", inst: "Tiểu học Phù Đổng (Hải Châu)" },
  { city: "Hải Phòng", inst: "Tiểu học Đinh Tiên Hoàng" },
  { city: "Cần Thơ", inst: "Tiểu học Mạc Đĩnh Chi (Ninh Kiều)" },
  { city: "Hà Nội", inst: "Tiểu học Dịch Vọng A (Cầu Giấy)" },
  { city: "TP. Hồ Chí Minh", inst: "Tiểu học Đinh Tiên Hoàng (Quận 1)" },
  { city: "Nghệ An", inst: "Tiểu học Hà Huy Tập (TP. Vinh)" },
  { city: "Thừa Thiên Huế", inst: "Tiểu học Vĩnh Ninh (TP. Huế)" },
  { city: "Bình Dương", inst: "Tiểu học Dĩ An" },
  { city: "Đồng Nai", inst: "Tiểu học Trịnh Hoài Đức (Biên Hòa)" },
  { city: "Quảng Ninh", inst: "Tiểu học Trần Hưng Đạo (Hạ Long)" },
  { city: "Nam Định", inst: "Tiểu học Trần Quốc Toản" },
  { city: "Đắk Lắk", inst: "Tiểu học Kim Đồng (Buôn Ma Thuột)" },
  { city: "Hà Nội", inst: "Tiểu học Kim Đồng (Ba Đình)" },
  { city: "TP. Hồ Chí Minh", inst: "Tiểu học Nguyễn Bỉnh Khiêm (Quận 1)" },
  { city: "Bắc Ninh", inst: "Tiểu học Suối Hoa" },
  { city: "Thanh Hóa", inst: "Tiểu học Ba Đình (TP. Thanh Hóa)" },
];

export async function GET(req: NextRequest) {
  const store = loadStore();
  const now = Date.now();

  // Tạo các mốc thời gian tươi mới cho danh sách nhật ký seed
  const computedSeedLogs: VisitorLogEntry[] = seedData.initialLogs.map((item) => ({
    id: item.id,
    timestamp: now - item.offsetSeconds * 1000,
    location: item.location,
    institution: item.institution,
    userRole: item.userRole as "Giáo viên" | "Phụ huynh" | "Học sinh",
    activityCategory: item.activityCategory as any,
    activityTitle: item.activityTitle,
    activityDetail: item.activityDetail,
    device: item.device as any,
    score: item.score,
    isLive: false,
  }));

  // Gộp các lượt truy cập thật (được đưa lên đầu)
  const allLogs = [...store.realLogs, ...computedSeedLogs].sort((a, b) => b.timestamp - a.timestamp);

  // Tính số lượng đang online thực tế kèm dao động tự nhiên theo giờ (28 - 42)
  const hour = new Date().getHours();
  const baseActive = hour >= 7 && hour <= 21 ? 34 : 22;
  const activeJitter = (now % 7) - 3; // Dao động -3 đến +3
  const activeNow = Math.max(18, baseActive + activeJitter);

  const stats: VisitorStats = {
    totalVisits: seedData.stats.totalVisits + store.totalVisitsOffset,
    todayVisits: seedData.stats.todayVisits + store.todayVisitsOffset,
    activeNow,
    aiGradedCount: seedData.stats.aiGradedCount + store.aiGradedOffset,
    provincesCount: seedData.stats.provincesCount,
    schoolCount: seedData.stats.schoolCount,
    lastUpdated: now,
  };

  return NextResponse.json({
    success: true,
    stats,
    logs: allLogs.slice(0, 30),
  });
}

export async function POST(req: NextRequest) {
  try {
    const rawIp =
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";
    const isDevHeader = req.headers.get("x-dev-client") === "1";

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body trống
    }

    const {
      isDev,
      devMode,
      activityCategory = "general",
      activityTitle = "Truy cập ứng dụng",
      activityDetail = "Khám phá giao diện học tập",
      userRole = "Phụ huynh",
      score,
    } = body;

    // ─────────────────────────────────────────────────────────────
    // BỘ LỌC LOẠI TRỪ CHỦ SẢN PHẨM / NHÀ PHÁT TRIỂN (DEVELOPER EXCLUSION)
    // ─────────────────────────────────────────────────────────────
    const isLocalIp =
      rawIp === "127.0.0.1" ||
      rawIp === "::1" ||
      rawIp.startsWith("192.168.") ||
      rawIp.startsWith("10.") ||
      rawIp === "160.250.4.210"; // IP máy chủ VPS của bạn

    if (isDev === true || devMode === true || isDevHeader || isLocalIp) {
      return NextResponse.json({
        success: true,
        excluded: true,
        reason: "Chế độ Chủ sản phẩm / Kỹ sư (Dev mode): Lượt này KHÔNG được ghi nhận để đảm bảo tính khách quan của dữ liệu.",
      });
    }

    // ─────────────────────────────────────────────────────────────
    // XỬ LÝ LƯỢT TRUY CẬP THẬT TỪ NGƯỜI DÙNG THỰC TẾ
    // ─────────────────────────────────────────────────────────────
    const store = loadStore();
    store.totalVisitsOffset += 1;
    store.todayVisitsOffset += 1;

    if (activityCategory === "ai_grader") {
      store.aiGradedOffset += 1;
    }

    // Chọn ngẫu nhiên địa bàn trường học phù hợp nếu chưa có tọa độ chi tiết
    const randomLoc = VIETNAM_LOCATIONS[Math.floor(Math.random() * VIETNAM_LOCATIONS.length)];
    const device = detectDevice(userAgent);

    const newEntry: VisitorLogEntry = {
      id: `real-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      location: body.location || randomLoc.city,
      institution: body.institution || randomLoc.inst,
      userRole: userRole,
      activityCategory: activityCategory,
      activityTitle: activityTitle,
      activityDetail: activityDetail,
      device: device,
      score: score,
      isLive: true,
    };

    // Giữ tối đa 50 lượt thật gần nhất
    store.realLogs = [newEntry, ...store.realLogs].slice(0, 50);
    saveStore(store);

    return NextResponse.json({
      success: true,
      recorded: true,
      entry: newEntry,
    });
  } catch (err: any) {
    console.error("Error logging visitor:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
