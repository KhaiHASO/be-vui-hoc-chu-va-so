# ĐẶC TẢ KIẾN TRÚC VÀ HỌC LIỆU DỰ ÁN (PROJECT SPECIFICATION & ARCHITECTURE)

> **Dự án:** Bé Học Tiếng Việt & Toán Tiền Tiểu Học (Lớp 1) – Bé Vui Học Số  
> **Nền tảng:** Web Application (Mobile/Tablet First)  
> **Bộ học liệu nền tảng:** Bộ 80 thẻ học quy chuẩn (151 trang, file gốc `BỘ THẺ.pdf`)

---

## 1. PHÂN BỔ 4 MODULE THEO MỤC TIÊU DỰ ÁN

Bám sát tài liệu [MucTieu.txt](file:///Users/admin/Desktop/DuAnTiengViet/MucTieu.txt):

| Module | Tên Module | Phạm vi Thẻ học | Trọng tâm sư phạm & Kỹ thuật | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **Module 1** | **Kiểm Tra Nét Chữ Viết Tay** | Thẻ 1 – 70 | Hướng dẫn phụ huynh nhận biết lỗi sai (độ cao, độ rộng, nét khuyết, nét móc); Module Computer Vision / AI phân tích ảnh chụp vở viết. | *Đang chuẩn bị* |
| **Module 2** | **Bài Tập Bổ Trợ Đọc & Viết** | Thẻ 1 – 70 | Lộ trình từng bước: Nét cơ bản ➔ Âm ➔ Vần ➔ Ghép tiếng ➔ Từ và câu ứng dụng. | *Đang chuẩn bị* |
| **Module 3** | **Chuẩn Hóa Phát Âm & Khẩu Hình** | Toàn bộ âm vần | Hướng dẫn khẩu hình răng, môi, lưỡi, luồng hơi; Tích hợp camera soi gương (Split-screen) và ghi âm đối chiếu. | *Đang chuẩn bị* |
| **Module 4** | **Nhận Diện Số, Tập Đếm & Tách - Gộp** | Thẻ 71 – 80 (Trang 125+) | Nhận diện chữ số 1–10; Đếm số lượng con vật; 5 Hoạt động Tách - Gộp chuẩn Singapore Math CPA; Tập viết trên lưới ô ly 4 dòng kẻ. | **✅ Hoàn thành 100%** |

---

## 2. KIẾN TRÚC SỐ HÓA DỮ LIỆU MODULE 4 (CHỮ SỐ 1 ĐẾN 10)

### 2.1. Quy trình xử lý học liệu gốc
1. **Bóc tách ảnh thẻ (PyMuPDF):** Script [extract_module_numbers.py](file:///Users/admin/Desktop/DuAnTiengViet/extract_module_numbers.py) đọc file `BỘ THẺ.pdf`, trích xuất ảnh thẻ mặt trước và mặt sau cho 10 số (tương ứng Thẻ 71 đến 80).
2. **Xóa sạch mã QR & Watermark bên thứ 3:** Tự động vẽ đè vùng che phủ màu trắng chuẩn để giữ tính độc lập của nền tảng, không phụ thuộc máy chủ bên thứ ba.
3. **Trích xuất Audio bản ghi chuẩn sư phạm:**
   - Quét mã QR gốc trên từng thẻ để lấy đường dẫn MP3 chất lượng cao.
   - Tải về và chuẩn hóa tên file: `web/public/audio/module_numbers/so_{1..10}.mp3`.
   - Giọng đọc ấm áp, chuẩn ngữ điệu giáo viên tiểu học, hướng dẫn từng nét viết và khẩu quyết tách - gộp.

### 2.2. Cấu trúc Schema Dữ Liệu `numbers_data.json`
```json
{
  "id": 1,
  "number": 1,
  "text": "Số 1",
  "word": "Một",
  "card_id": 71,
  "illustration": {
    "title": "Một con chim sâu",
    "quantity": 1,
    "animal": "chim sâu"
  },
  "writing_guide": {
    "height": "2 ô ly",
    "strokes": [
      "Nét 1: Nét xiên phải (từ đường kẻ 2 lên đường kẻ 3)",
      "Nét 2: Nét thẳng đứng (kéo xuống đường kẻ 1)"
    ]
  },
  "number_bonds": [
    { "whole": 1, "part1": 1, "part2": 0, "text": "1 gồm 1 và 0" }
  ],
  "audio_url": "/audio/module_numbers/so_1.mp3"
}
```

---

## 3. CÁC TÍNH NĂNG VÀ ĐỔI MỚI KỸ THUẬT NỔI BẬT

### 3.1. Kiến Trúc Dual-Canvas Engine ([WritingCanvas.tsx](file:///Users/admin/Desktop/DuAnTiengViet/web/src/components/WritingCanvas.tsx))
- **Vấn đề đã giải quyết:** Trước đây khi bé vẽ trên điện thoại, việc gọi `useState` mỗi khi di ngón tay làm React re-render liên tục gây giật khựng, đơ cảm ứng và mất nét.
- **Giải pháp:**
  - Tách thành 2 thẻ `<canvas>` chồng lớp: Canvas nền tĩnh vẽ lưới ô ly chuẩn tiểu học (chỉ vẽ 1 lần), Canvas trên hứng nét vẽ trực tiếp.
  - Sử dụng native touch listener `{ passive: false }` kết hợp `e.preventDefault()` để triệt tiêu hoàn toàn độ trễ cuộn trang của iOS Safari / Chrome Mobile.
  - Nắn mượt nét vẽ bằng đường cong Bézier bậc 2 (`quadraticCurveTo`).
  - Quản lý tọa độ hoàn toàn qua `useRef`, không kích hoạt React re-render trong vòng lặp vẽ.

### 3.2. Hệ Thống 5 Hoạt Động Tách - Gộp Số (Singapore Math CPA)
Áp dụng tiến trình nhận thức: **C (Concrete - Trực quan cụ thể) ➔ P (Pictorial - Hình ảnh tượng trưng) ➔ A (Abstract - Trừu tượng hóa ký hiệu)**:
1. **Sơ Đồ Phân Nhánh (Abstract):** Cột mốc tư duy với bóng số cha và hai bóng số con.
2. **Kéo Thả Hai Rổ (Concrete):** Bé kéo thả từng quả táo vào rổ A và rổ B, trực tiếp thấy số lượng được chia đôi.
3. **Bàn Tính Hạt Ten-Frame (Pictorial):** Lưới 10 ô kinh điển quốc tế giúp trẻ hình dung số lượng nhanh chóng mà không cần đếm từng hạt.
4. **Cân Đòn Thăng Bằng (Concrete to Abstract):** Bé xếp các quả cân lên đĩa cân, khi tổng hai bên bằng nhau cân sẽ cân bằng kèm hiệu ứng chuông reo.
5. **Đố Vui Điền Số (Rapid Recall):** Hộp bí mật che một phần số, rèn phản xạ nhanh cho trẻ.
