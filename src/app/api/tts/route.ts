import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text")?.trim();

    if (!text) {
      return new NextResponse("Missing text parameter", { status: 400 });
    }

    // Giới hạn độ dài để đảm bảo API phản hồi nhanh và chính xác
    const cleanText = text.slice(0, 300);

    // Sử dụng dịch vụ phát âm tiếng Việt tự nhiên chuẩn giọng bản ngữ
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(
      cleanText
    )}`;

    const response = await fetch(ttsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
    });

    if (!response.ok) {
      return new NextResponse("TTS fetch failed", { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=604800, immutable", // Cache 7 ngày
      },
    });
  } catch (error) {
    console.error("Error in /api/tts:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
