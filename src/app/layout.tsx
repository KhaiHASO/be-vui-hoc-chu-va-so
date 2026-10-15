import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bé Học Toán & Tiếng Việt Lớp 1 - Thẻ 71 đến 80: Nhận Diện & Tách Gộp Số",
  description:
    "Nền tảng tương tác giúp học sinh và phụ huynh lớp 1 học nhận diện số, tập đếm số lượng, viết đúng chuẩn nét và thành thạo bảng tách gộp số chuẩn Bộ Giáo Dục.",
  keywords: [
    "Toán lớp 1",
    "Tách gộp số",
    "Tập đếm số lượng",
    "Chữ số tiểu học",
    "Tập viết số",
    "Tiền tiểu học",
    "Bộ thẻ học tiếng Việt toán 1",
  ],
  authors: [{ name: "Dự Án Học Liệu Tiếng Việt & Toán Tiểu Học" }],
  openGraph: {
    title: "Bé Học Toán Lớp 1 - Nhận Diện, Tập Đếm & Tách Gộp Số",
    description: "Học trực quan 10 con số, trò chơi tập đếm, sơ đồ tách gộp số và luyện viết đúng chuẩn.",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
