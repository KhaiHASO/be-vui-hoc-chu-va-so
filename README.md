# Bé Vui Học Chữ Và Số (Tiền Tiểu Học & Lớp 1) 🎒📚⭐

> **Dự án phần mềm học liệu tương tác dự thi chính thức**  
> **Nền tảng:** Web Application hiện đại (Next.js 16 + React 19 + Tailwind CSS 4 + TypeScript)  
> **Bộ học liệu nền tảng:** Bộ 80 thẻ học quy chuẩn Bộ Giáo Dục & Đào Tạo (151 trang)

---

## 🌟 Kiến Trúc Bố Cục (App Shell Architecture)

Ứng dụng được thiết kế theo chuẩn sư phạm và công nghệ tiên tiến nhất dành cho lứa tuổi tiền tiểu học và phụ huynh đồng hành:
- **Thanh Điều Hướng Bên (Sidebar Navigation):** Tách bạch rõ ràng thành **2 Hạng Mục Lớn**:
  1. **🅰️ HỌC CHỮ (Tiếng Việt):**
     - 📖 **Thẻ Chữ Cái 3D:** Khám phá 29 chữ cái tiếng Việt với hiệu ứng lật thẻ 3D, từ minh họa sinh động và phát âm chuẩn.
     - ✨ **14 Nét Cơ Bản:** Lộ trình rèn luyện 14 nét viết chuẩn Bộ GD&ĐT (Nét hất, móc, cong, khuyết, xoắn, thắt...).
     - ✍️ **Bé Tập Viết Chữ:** Bảng vẽ ô ly 4 dòng kẻ áp dụng công nghệ **Dual-Canvas Engine** (lưới tĩnh + nét động), nét mờ đồ theo chuẩn chữ mẫu lớp 1.
     - 👄 **Khẩu Hình Phát Âm:** Hướng dẫn vị trí răng, môi, lưỡi, luồng hơi và tích hợp **Gương Soi Camera** đối chiếu trực tiếp.
     - 🎮 **Đố Vui Bắt Chữ:** Mini-game tìm chữ cái vui nhộn kèm nốt nhạc tương tác và pháo hoa khen ngợi.
  2. **🔢 HỌC SỐ (Toán Học):**
     - 🏷️ **Thẻ Học Số 3D:** Khám phá chữ số 1 – 10, tích hợp bản thu âm gốc của cô giáo tiểu học.
     - 🦁 **Bé Tập Đếm:** Tương tác chạm từng con vật để đếm kèm nốt nhạc thang âm C4–C5.
     - ✍️ **Bé Tập Viết Số:** Bảng vẽ ô ly với Dual-Canvas, hoàn tác nét và nắn cong Bézier.
     - ⚖️ **Thế Giới Tách - Gộp Số:** 5 trò chơi chuẩn quốc tế **Singapore Math CPA**:
       + 1. Sơ đồ nhánh tư duy
       + 2. Kéo thả phân loại 2 rổ
       + 3. Bàn tính 10 ô Ten-Frame
       + 4. Cân đòn thăng bằng toán học
       + 5. Hộp bí mật đố vui điền số
     - 👨‍👩‍👧 **Cẩm Nang Phụ Huynh:** 3 bước sư phạm và bảng tra cứu toàn bộ các trường hợp tách gộp.
- **Không Gian Tương Tác Trung Tâm (Main Playground):** Chiếm trọn tầm nhìn màn hình, viền bo tròn thân thiện, màu sắc tươi sáng, đạt chuẩn WCAG AA và không gian chạm cảm ứng tối thiểu `44px x 44px`.

---

## 🛠️ Công Nghệ Nền Tảng (Tech Stack)

* **Framework:** [Next.js 16](https://nextjs.org/) (Turbopack, App Router)
* **Thư viện UI:** [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/)
* **Ngôn ngữ:** [TypeScript 5](https://www.typescriptlang.org/) (Strict type-checking 100%)
* **Âm thanh:** Web Audio API (Hiệu ứng nốt nhạc tương tác) + HTML5 Audio Native
* **Icon & Hiệu ứng:** [Lucide React](https://lucide.dev/), Canvas Confetti
* **Kiểm thử thị giác:** [Playwright](https://playwright.dev/) (Multi-viewport Visual Audit)

---

## 🚀 Khởi Chạy Nhanh

```bash
# 1. Cài đặt các gói phụ thuộc
pnpm install

# 2. Khởi chạy môi trường phát triển
pnpm dev

# 3. Biên dịch bản sản xuất
pnpm build

# 4. Kiểm thử giao diện tự động trên 3 thiết bị (iPhone, iPad, Desktop)
pnpm verify-ui
```
Mở trình duyệt tại: **`http://localhost:3000`**.

---

## 🛡️ Tiêu Chuẩn Giao Diện (UI/UX Engineering)
Dự án được xây dựng và kiểm thử nghiêm ngặt theo quy chuẩn [AGENTS.md](AGENTS.md), đảm bảo mượt mà 100% trên cả điện thoại, iPad/máy tính bảng và máy tính để bàn.
