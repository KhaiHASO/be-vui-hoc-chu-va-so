# HƯỚNG DẪN CÀI ĐẶT, VẬN HÀNH VÀ TRIỂN KHAI (OPERATIONS & DEPLOYMENT GUIDE)

> **Dự án:** Bé Học Tiếng Việt & Toán Tiền Tiểu Học (Lớp 1)  
> **Repository:** [KhaiHASO/be-hoc-tieng-viet-toan-lop-1](https://github.com/KhaiHASO/be-hoc-tieng-viet-toan-lop-1.git)

---

## 1. YÊU CẦU HỆ THỐNG
- **Node.js:** >= v20.x hoặc v22.x LTS.
- **Package Manager:** `pnpm` (khuyên dùng) hoặc `npm`.
- **Python:** >= 3.10 (phục vụ script bóc tách dữ liệu và deploy VPS).
- **Thư viện Python (tuỳ chọn khi chạy script xử lý dữ liệu):**
  ```bash
  pip install pymupdf zxing-cpp pillow paramiko
  ```

---

## 2. CHẠY ỨNG DỤNG CỤC BỘ (LOCAL DEVELOPMENT)

### 2.1. Cài đặt và khởi động Web Next.js
```bash
# 1. Đi vào thư mục web
cd web

# 2. Cài đặt thư viện phụ thuộc
pnpm install

# 3. Khởi chạy server phát triển
pnpm dev
```
Mở trình duyệt tại: `http://localhost:3000` (hoặc mở bằng IP mạng LAN nội bộ để kiểm tra trực tiếp trên điện thoại/iPad).

---

## 3. KIỂM THỬ THỊ GIÁC TỰ ĐỘNG (PLAYWRIGHT VISUAL AUDIT)

Để đảm bảo giao diện đạt chuẩn kỹ thuật, không bị tràn viền hay vỡ khung trên mọi thiết bị:
```bash
cd web
node scripts/verify_ui.mjs
```
Kịch bản sẽ tự động khởi chạy trình duyệt không đầu và chụp ảnh màn hình ở 3 độ phân giải:
- Mobile: `375 x 812` (iPhone)
- Tablet: `768 x 1024` (iPad)
- Desktop: `1280 x 800` (MacBook/Laptop)
Ảnh chụp được lưu tại thư mục `web/.ui_audit/`.

---

## 4. TỰ ĐỘNG HÓA TRIỂN KHAI LÊN VPS (DIRECT SSH DEPLOY)

Khi có bản cập nhật mới đã commit vào Git:
```bash
# 1. Đẩy mã nguồn lên GitHub
git add .
git commit -m "feat/fix: mô tả nội dung"
git push origin main

# 2. Kích hoạt kịch bản deploy tự động lên VPS
python3 deploy_vps.py
```

### Kịch bản `deploy_vps.py` sẽ tự động:
1. Kết nối SSH an toàn vào VPS `160.250.4.230`.
2. Dọn dẹp cache và thực thi `git pull origin main`.
3. Chạy `pnpm build` biên dịch tối ưu bản production.
4. Chạy `pm2 reload be-vui-hoc-so` để cập nhật ứng dụng tức thì với **Zero-Downtime**.
5. Trả log trực tiếp về màn hình máy lập trình.
