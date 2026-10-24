import fs from "fs";
import path from "path";
import { RealAccessLog, RealAccessStats } from "@/types/visitor";

const LOGS_FILE = path.join(process.cwd(), "data", "real_access_logs.json");
const GEO_CACHE_FILE = path.join(process.cwd(), "data", "geoip_cache.json");
const NGINX_LOG_PATH = "/var/log/nginx/access.log";

// Danh sách IP của Chủ sản phẩm / Kỹ sư (để tự động nhận diện và loại trừ)
const DEV_IPS = new Set(["115.76.49.85", "115.76.48.73", "127.0.0.1", "::1", "160.250.4.210"]);

// Bộ nhớ đệm GeoIP
let geoCache: Record<string, { city: string; region: string; country: string; isp: string }> = {};

// Bộ nhớ đệm danh sách log
let inMemoryLogs: RealAccessLog[] = [];
// Bộ nhớ theo dõi session online trong 5 phút gần nhất: IP -> lastSeenMs
const activeSessions = new Map<string, number>();

// Đọc Geo Cache
function loadGeoCache() {
  try {
    if (fs.existsSync(GEO_CACHE_FILE)) {
      geoCache = JSON.parse(fs.readFileSync(GEO_CACHE_FILE, "utf8"));
    }
  } catch (e) {
    console.warn("Could not load geo cache:", e);
  }
}

function saveGeoCache() {
  try {
    const dir = path.dirname(GEO_CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(GEO_CACHE_FILE, JSON.stringify(geoCache, null, 2), "utf8");
  } catch (e) {
    console.warn("Could not save geo cache:", e);
  }
}

// Đọc Logs từ file
function loadLogsFromFile(): RealAccessLog[] {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(LOGS_FILE, "utf8"));
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn("Could not load real logs from file:", e);
  }
  return [];
}

function saveLogsToFile() {
  try {
    const dir = path.dirname(LOGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOGS_FILE, JSON.stringify(inMemoryLogs.slice(0, 500), null, 2), "utf8");
  } catch (e) {
    console.warn("Could not save real logs to file:", e);
  }
}

// Phân giải thông tin thiết bị và hệ điều hành thực tế từ User-Agent
export function parseUserAgent(uaString: string) {
  const ua = uaString.toLowerCase();

  // 1. Loại thiết bị
  let device: RealAccessLog["device"] = "Máy tính bàn / Laptop";
  if (ua.includes("googlebot") || ua.includes("spider") || ua.includes("crawler") || ua.includes("headlesschrome")) {
    device = "Bot Tìm kiếm";
  } else if (ua.includes("ipad") || (ua.includes("macintosh") && ua.includes("mobile"))) {
    device = "iPad / Máy tính bảng";
  } else if (ua.includes("tablet") || ua.includes("sm-t") || ua.includes("tab")) {
    device = "iPad / Máy tính bảng";
  } else if (ua.includes("iphone") || ua.includes("ipod") || (ua.includes("android") && ua.includes("mobile"))) {
    device = "Điện thoại Di động";
  }

  // 2. Hệ điều hành
  let os = "Khác";
  if (ua.includes("mac os x") || ua.includes("macintosh")) os = "macOS";
  else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("cpu iphone os")) os = "iOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("windows nt 10") || ua.includes("windows nt 11")) os = "Windows 10/11";
  else if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("linux")) os = "Linux";

  // 3. Trình duyệt
  let browser = "Trình duyệt Web";
  if (ua.includes("edg/")) browser = "Microsoft Edge";
  else if (ua.includes("chrome") && !ua.includes("edg")) browser = "Google Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Apple Safari";
  else if (ua.includes("firefox")) browser = "Mozilla Firefox";
  else if (ua.includes("coccoc")) browser = "Cốc Cốc";

  return { device, os, browser };
}

// Tra cứu GeoIP thời gian thực
export async function lookupGeoIp(ip: string) {
  if (geoCache[ip]) return geoCache[ip];

  // IP nội bộ / Localhost
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip === "160.250.4.210"
  ) {
    const localInfo = { city: "Máy chủ Localhost", region: "Hệ thống Dev", country: "Việt Nam", isp: "Nội bộ VPS" };
    geoCache[ip] = localInfo;
    return localInfo;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,regionName,isp&lang=vi`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.status === "success") {
        const info = {
          city: data.city || "Hồ Chí Minh",
          region: data.regionName || data.city || "Việt Nam",
          country: data.country || "Việt Nam",
          isp: data.isp || "Nhà mạng Internet",
        };
        geoCache[ip] = info;
        saveGeoCache();
        return info;
      }
    }
  } catch {
    // Timeout hoặc lỗi kết nối ra ngoài
  }

  // Fallback nếu không kết nối được
  const fallback = { city: "Việt Nam", region: "Khu vực Việt Nam", country: "Việt Nam", isp: "Nhà mạng Viễn thông" };
  geoCache[ip] = fallback;
  return fallback;
}

export function maskIp(ip: string): string {
  if (!ip) return "127.0.0.xxx";
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  return ip.slice(0, Math.max(4, ip.length - 4)) + "xxx";
}

// Định dạng thời gian Việt Nam
export function formatVietnamTime(ms: number): string {
  const date = new Date(ms);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  const d = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  return `${time} ${d}`;
}

// Khởi tạo
loadGeoCache();
inMemoryLogs = loadLogsFromFile();

// Xóa sạch toàn bộ lịch sử truy cập
export function clearAllLogs() {
  inMemoryLogs = [];
  activeSessions.clear();
  try {
    if (fs.existsSync(LOGS_FILE)) {
      fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2), "utf8");
    }
  } catch (err) {
    console.warn("Could not clear logs file:", err);
  }
}

// ─────────────────────────────────────────────────────────────
// CÁC HÀM XỬ LÝ CHÍNH ĐƯỢC GỌI TỪ ROUTE
// ─────────────────────────────────────────────────────────────

export async function recordRealEvent(params: {
  ip: string;
  userAgent: string;
  actionType: RealAccessLog["actionType"];
  actionName: string;
  path?: string;
  isDevClient?: boolean;
}): Promise<RealAccessLog> {
  const { ip, userAgent, actionType, actionName, path: reqPath = "/", isDevClient = false } = params;

  const isDev = isDevClient || DEV_IPS.has(ip);
  const { device, os, browser } = parseUserAgent(userAgent);
  const geo = await lookupGeoIp(ip);

  const timestamp = Date.now();
  const newLog: RealAccessLog = {
    id: `log-${timestamp}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp,
    timeStr: formatVietnamTime(timestamp),
    ip,
    maskedIp: maskIp(ip),
    city: geo.city,
    region: geo.region,
    country: geo.country,
    isp: geo.isp,
    device,
    browser,
    os,
    actionType,
    actionName,
    path: reqPath,
    isDev,
    statusCode: 200,
  };

  // Cập nhật session online
  activeSessions.set(ip, timestamp);

  // Đưa lên đầu danh sách
  inMemoryLogs = [newLog, ...inMemoryLogs].slice(0, 500);
  saveLogsToFile();

  return newLog;
}

export function getRealStats(clientIp?: string) {
  const now = Date.now();
  // Dọn dẹp session quá 5 phút
  for (const [ip, lastSeen] of activeSessions.entries()) {
    if (now - lastSeen > 5 * 60 * 1000) {
      activeSessions.delete(ip);
    }
  }

  // Đếm số người đang online (không tính Dev IP nếu Dev đang online)
  let activeCount = 0;
  for (const ip of activeSessions.keys()) {
    if (!DEV_IPS.has(ip)) activeCount++;
  }
  const activeNow = activeCount;

  // Thống kê theo ngày hôm nay (0h00)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayMs = startOfDay.getTime();

  const realVisitorLogs = inMemoryLogs.filter((l) => !l.isDev);
  const totalVisits = realVisitorLogs.length;
  const todayVisits = realVisitorLogs.filter((l) => l.timestamp >= startOfDayMs).length;

  const uniqueIps = new Set(realVisitorLogs.map((l) => l.ip));
  const uniqueProvinces = new Set(realVisitorLogs.map((l) => l.region).filter(Boolean));

  // Thống kê Tỉnh thành
  const provinceCounts: Record<string, number> = {};
  for (const l of realVisitorLogs) {
    const r = l.region || l.city || "Khác";
    provinceCounts[r] = (provinceCounts[r] || 0) + 1;
  }
  const topProvinces = Object.entries(provinceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Thống kê Thiết bị
  const deviceCounts: Record<string, number> = {};
  for (const l of realVisitorLogs) {
    deviceCounts[l.device] = (deviceCounts[l.device] || 0) + 1;
  }
  const topDevices = Object.entries(deviceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const isClientDev = clientIp ? DEV_IPS.has(clientIp) : false;

  const stats: RealAccessStats = {
    totalVisits,
    todayVisits,
    activeNow,
    uniqueIpsCount: uniqueIps.size,
    uniqueProvincesCount: uniqueProvinces.size,
    topProvinces,
    topDevices,
    lastUpdated: now,
  };

  return { stats, isClientDev };
}

export function getAllLogs(options?: { includeDev?: boolean }): RealAccessLog[] {
  const includeDev = options?.includeDev ?? false;
  if (includeDev) return inMemoryLogs;
  return inMemoryLogs.filter((l) => !l.isDev);
}
