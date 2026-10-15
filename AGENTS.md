# QUY CHUẨN KỸ THUẬT GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX ENGINEERING STANDARDS)
> **Mục tiêu tối thượng:** Tuyệt đối chấm dứt tình trạng giao diện "lỏ" (lố, lẹm, tràn viền, vỡ khung, đơ giật cảm ứng trên mobile/tablet). Mọi mã nguồn giao diện do AI tạo ra hoặc sửa đổi đều phải đạt chuẩn Senior Frontend Engineer.

---

## 1. NGUYÊN TẮC BẤT DI BẤT DỊCH VỀ BỐ CỤC (RESPONSIVE & FLUID LAYOUT)

### ❌ CÁC LỖI NGHIÊM CẤM (ZERO TOLERANCE)
1. **Tuyệt đối không dùng kích thước cố định pixel** cho các container bố cục (`w-[500px]`, `w-[600px]`, `h-[400px]`...). Bắt buộc dùng `w-full max-w-xl`, `max-w-4xl`, hoặc tỉ lệ `aspect-[4/3]`, `aspect-square`.
2. **Không dùng cỡ chữ khổng lồ cố định** (`text-[280px]`...). Bắt buộc dùng responsive Tailwind: `text-6xl sm:text-8xl md:text-9xl` hoặc CSS `clamp(3rem, 15vw, 10rem)`.
3. **Cấm bỏ quên `min-w-0` trong Flexbox:** Khi dùng `flex` có chứa văn bản dài hoặc thẻ con linh hoạt, bắt buộc phải có `min-w-0` để flex container không bị tràn ngang khỏi màn hình điện thoại.
4. **Không dùng `h-screen` hay `100vh` cho layout toàn màn hình:** Trên iOS Safari / Chrome Android, thanh URL sẽ che mất phần chân trang. Bắt buộc dùng `min-h-[100dvh]` hoặc `h-[100dvh]`.
5. **Cấm để chữ dính sát viền màn hình:** Mọi trang/modal luôn có lề an toàn tối thiểu `px-4 sm:px-6 md:px-8`.

### ✅ BỐ CỤC CHUẨN
- **Container chuẩn:** `w-full max-w-5xl mx-auto px-4 sm:px-6`
- **Flex wrap linh hoạt:** `flex flex-wrap items-center justify-between gap-3`
- **Grid tự co giãn:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6`
- **Xử lý tràn văn bản:** `truncate` hoặc `break-words` khi hiển thị nội dung động.

---

## 2. QUY CHUẨN CẢM ỨNG DI ĐỘNG (TOUCH TARGETS & ERGONOMICS)

1. **Chuẩn kích thước nút bấm Apple HIG & Google Material:**
   - Mọi nút bấm, icon bấm được trên màn hình cảm ứng phải có diện tích chạm tối thiểu **`44px x 44px`** (dùng `min-h-[44px] min-w-[44px]` hoặc padding `p-3`).
   - Khoảng cách giữa các nút cạnh nhau tối thiểu là `8px` (`gap-2` trở lên) để tránh chạm nhầm.
2. **Phản hồi xúc giác trực quan (Visual Feedback):**
   - Mọi nút tương tác bắt buộc có trạng thái `active:scale-95 transition-transform` hoặc `active:bg-slate-200` để người dùng cảm nhận được nút đã nhận lệnh.
3. **Chống phóng to / Menu đen iOS ngoài ý muốn:**
   - Với các vùng tương tác đặc thù (vẽ canvas, kéo thả, chơi game):
     `touchAction: "none"`, `WebkitUserSelect: "none"`, `userSelect: "none"`, `WebkitTouchCallout: "none"`.

---

## 3. QUY TRÌNH PHÁT TRIỂN CANVAS & TƯƠNG TÁC ĐỒ HỌA

Khi làm việc với `<canvas>` (bảng viết chữ, vẽ hình, kéo thả):
1. **Kiến trúc tách lớp (Multi-layer Canvas):**
   - Tuyệt đối không vẽ nền tĩnh (lưới ô ly, khung viền) chung một canvas với nét vẽ tương tác.
   - Luôn tách: Canvas nền (chỉ vẽ 1 lần) và Canvas tương tác (hứng nét vẽ của bé).
2. **Chuẩn hóa tọa độ cảm ứng 1:1 theo thời gian thực:**
   - Bắt buộc tính tỷ lệ: `scaleX = canvas.width / rect.width`, `scaleY = canvas.height / rect.height`.
   - Lấy tọa độ: `x = (clientX - rect.left) * scaleX`, `y = (clientY - rect.top) * scaleY`.
3. **CẤM KÍCH HOẠT REACT RE-RENDER KHI ĐANG VẼ:**
   - Dùng `useRef` để theo dõi tọa độ và trạng thái `isDrawing`. Không dùng `useState` trong vòng lặp vẽ, tránh rớt khung hình (frame drop / giật giật).
4. **Bắt buộc dùng Native Touch Listeners với `{ passive: false }`:**
   - Bắt `touchstart`, `touchmove`, `touchend` và gọi `e.preventDefault()` để triệt tiêu độ trễ nhận diện cuộn trang của Safari/Chrome di động.
5. **Nắn mượt nét vẽ (Bézier Smoothing):** Dùng `quadraticCurveTo` thay vì nối đường gấp khúc nhọn.

---

## 4. TIÊU CHUẨN DESIGN SYSTEM DÀNH CHO TRẺ EM & GIÁO DỤC

1. **Màu sắc tươi sáng, độ tương phản cao:**
   - Dùng bảng màu Pastel có điểm nhấn rực rỡ (tím tím học sinh `#7c3aed`, xanh hy vọng `#2563eb`, đỏ cam phấn khởi `#ea580c`, ngọc lục bảo `#059669`).
   - Đảm bảo độ tương phản văn bản đạt chuẩn WCAG AA (tối thiểu 4.5:1 với chữ thường).
2. **Bo tròn thân thiện (Child-friendly rounded borders):**
   - Khung thẻ, hộp hội thoại dùng `rounded-2xl` hoặc `rounded-3xl`.
   - Nút bấm dùng `rounded-xl` hoặc `rounded-2xl`.
3. **Phông chữ:** Rõ ràng, nét thẳng, chữ số dễ nhận biết (tránh phông cách điệu quá mức khiến trẻ nhầm lẫn số).

---

## 5. BẮT BUỘC KIỂM THỬ TRỰC QUAN (VISUAL VERIFICATION PROTOCOL)

> **Mỗi khi sửa đổi bất kỳ giao diện nào, trước khi báo hoàn thành cho người dùng:**
1. Chạy script chụp ảnh tự động: `pnpm verify-ui` hoặc `python3 scripts/verify_ui.py`.
2. Kiểm tra ảnh chụp ở 3 chế độ:
   - **Mobile Viewport (375 × 812):** Đảm bảo không tràn ngang, không che nút, chữ không bị teo nhỏ hoặc đè lên nhau.
   - **Tablet Viewport (768 × 1024):** Bố cục 2 cột phân bổ cân đối.
   - **Desktop Viewport (1440 × 900):** Tận dụng không gian rộng rãi nhưng không bị loãng.
3. Nếu phát hiện bất kỳ lỗi lệch, tràn, lố viền nào ➔ **Tự động sửa mã nguồn ngay lập tức** rồi mới nghiệm thu!
