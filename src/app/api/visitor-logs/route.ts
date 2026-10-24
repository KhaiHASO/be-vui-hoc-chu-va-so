import { NextRequest, NextResponse } from "next/server";
import {
  recordRealEvent,
  getRealStats,
  getAllLogs,
  lookupGeoIp,
  maskIp,
} from "@/lib/realAccessLogger";

export async function GET(req: NextRequest) {
  try {
    const rawIp =
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";

    const { searchParams } = new URL(req.url);
    const includeDev = searchParams.get("includeDev") === "1";

    const { stats, isClientDev } = getRealStats(rawIp);
    const logs = getAllLogs({ includeDev });
    const clientGeo = await lookupGeoIp(rawIp);

    return NextResponse.json({
      success: true,
      stats,
      logs: logs.slice(0, 50),
      isClientDev,
      clientIp: maskIp(rawIp),
      clientLocation: `${clientGeo.city}, ${clientGeo.region} (${clientGeo.isp})`,
    });
  } catch (err: any) {
    console.error("Lỗi khi đọc nhật ký truy cập thực tế:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawIp =
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body trống
    }

    const {
      actionType = "page_view",
      actionName = "Truy cập ứng dụng",
      path = "/",
      isDev = false,
    } = body;

    const newLog = await recordRealEvent({
      ip: rawIp,
      userAgent,
      actionType,
      actionName,
      path,
      isDevClient: isDev,
    });

    return NextResponse.json({
      success: true,
      recorded: true,
      entry: newLog,
    });
  } catch (err: any) {
    console.error("Lỗi khi ghi nhận nhật ký truy cập thực tế:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
