# KỸ THUẬT QUẢN LÝ VPS VÀ DEPLOY TRỰC TIẾP QUA PYTHON SSH (PARAMIKO) & PLAYWRIGHT

> **Tài liệu kỹ thuật nội bộ dự án Bé Học Tiếng Việt & Toán Lớp 1**  
> **Mục tiêu:** Lưu trữ phương pháp tự động hóa triển khai ứng dụng web (Next.js/Node.js) lên VPS cá nhân với tốc độ tức thì (~10–15 giây), không phụ thuộc vào hàng đợi CI/CD (GitHub Actions), đảm bảo Zero-Downtime và tích hợp kiểm thử thị giác tự động (Playwright Multi-viewport Audit).

---

## 1. SO SÁNH: DIRECT SSH AUTOMATION VS. CI/CD TRUYỀN THỐNG

| Tiêu chí | GitHub Actions CI/CD truyền thống | Direct SSH Automation (Paramiko + PM2) |
| :--- | :--- | :--- |
| **Thời gian triển khai** | **2 – 5 phút** (phải chờ cấp runner, cài pnpm/node từ đầu) | **10 – 15 giây** (tận dụng môi trường Node/pnpm có sẵn trên VPS) |
| **Chi phí / Quota** | Trừ vào số phút chạy miễn phí (2.000 phút/tháng) | **Hoàn toàn miễn phí**, không phụ thuộc tài nguyên bên thứ 3 |
| **Phản hồi lỗi (Feedback Loop)** | Phải vào web GitHub Actions F5 để xem log | Log `stdout`/`stderr` truyền thẳng về Terminal thời gian thực |
| **Xử lý xung đột code** | Thường fail pipeline, phải commit fix từ local | Agent phát hiện xung đột và xử lý trực tiếp tại chỗ |
| **Phù hợp nhất cho** | Dự án doanh nghiệp, nhiều người đóng góp, release định kỳ | Giai đoạn phát triển thần tốc, Pair programming giữa người & AI |

---

## 2. KIẾN TRÚC VÀ QUY TRÌNH THỰC THI (ATOMIC DEPLOYMENT PIPELINE)

```
[Máy Local / AI Agent]
     │
     ├── 1. git commit & git push origin main (qua SSH/Token cục bộ)
     │
     ├── 2. Mở kết nối SSH Socket (Python paramiko qua Port 22)
     │        │
     │        ▼
     │   [Remote VPS Server]
     │        ├── git checkout -- . (Dọn sạch file sinh tạm)
     │        ├── git pull origin main (Kéo mã nguồn mới nhất)
     │        ├── cd web && pnpm build (Biên dịch Turbopack / Next.js)
     │        └── pm2 reload <app_name> (Zero-downtime hot reload)
     │
     └── 3. Kích hoạt Playwright Visual Audit (Local headless browser)
              ├── Request tới VPS: http://<IP_OR_DOMAIN>
              ├── Chụp ảnh iPhone (375x812), iPad (768x1024), Desktop (1280x800)
              └── Đánh giá UI, đảm bảo không lỗi vỡ khung / tràn viền
```

---

## 3. TRIỂN KHAI MÃ NGUỒN PYTHON AUTOMATION (PARAMIKO)

### 3.1. Kịch bản Triển khai & Cập nhật Nhanh (Fast Reload Script)

Dưới đây là mã nguồn Python mẫu để triển khai tức thì mỗi khi có commit mới (được cấu hình trong [deploy_vps.py](file:///Users/admin/Desktop/DuAnTiengViet/deploy_vps.py)):

```python
import paramiko
import sys

VPS_HOST = "160.250.4.230"
VPS_USER = "root"
VPS_PASS = "Bevuihocso@@123" # Hoặc sử dụng SSH Private Key
REPO_DIR = "/var/www/be-hoc-tieng-viet-toan-lop-1"
APP_NAME = "be-vui-hoc-so"

def deploy():
    print(f"🚀 Kết nối SSH tới {VPS_USER}@{VPS_HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=15)
    print("✓ Đăng nhập SSH thành công!")

    # Chuỗi lệnh đồng bộ nguyên tử (Atomic Commands)
    commands = f"""
    cd {REPO_DIR} && \
    git checkout -- . && \
    git pull origin main && \
    cd web && \
    pnpm build && \
    pm2 reload {APP_NAME}
    """

    print("▶ Đang thực thi lệnh trên VPS...")
    stdin, stdout, stderr = ssh.exec_command(commands)

    # Đọc log đầu ra theo thời gian thực (Streaming output)
    while True:
        line = stdout.readline()
        if not line:
            break
        print(line, end="")
        sys.stdout.flush()

    exit_code = stdout.channel.recv_exit_status()
    err_msg = stderr.read().decode().strip()

    if exit_code != 0:
        print(f"❌ Deploy thất bại với mã lỗi {exit_code}:")
        print(err_msg)
    else:
        print("🎉 Deploy thành công! Ứng dụng đã được cập nhật không gián đoạn.")

    ssh.close()

if __name__ == "__main__":
    deploy()
```

### 3.2. Cơ chế Không gián đoạn (Zero-Downtime Reload) của PM2
- Lệnh `pm2 restart` sẽ ngắt tiến trình cũ trước rồi mới bật tiến trình mới, gây ra khoảng thời gian chết (downtime từ 2–5 giây khiến người dùng truy cập bị lỗi 502 Bad Gateway).
- Lệnh `pm2 reload` kích hoạt tiến trình mới chạy song song, đợi khi tiến trình mới sẵn sàng nhận request thì mới hủy tiến trình cũ. Do đó người dùng **hoàn toàn không cảm nhận được gián đoạn**.

---

## 4. BÍ QUYẾT TỐI ƯU HÓA HỆ THỐNG VPS CHO NEXT.JS / NODE.JS

1. **Thiết lập Swap Memory (2GB - 4GB):**
   - Với các gói VPS cấu hình thấp (1GB - 2GB RAM), khi chạy `next build` hoặc `pnpm build`, bộ biên dịch TypeScript và Webpack/Turbopack sẽ ngốn RAM và dễ bị Linux kernel kích hoạt cơ chế `OOM Killer` (Out Of Memory) làm văng tiến trình.
   - Bắt buộc tạo Swap file để chống tràn RAM:
     ```bash
     fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
     chmod 600 /swapfile
     mkswap /swapfile
     swapon /swapfile
     echo "/swapfile none swap sw 0 0" >> /etc/fstab
     ```
2. **Cài đặt Node.js LTS trực tiếp từ Binary chính thức:**
   - Thay vì dùng apt-get (thường bị phiên bản cũ) hay nvm (gặp khó khăn khi chạy script không mở shell interactive), tải file nén `.tar.xz` từ `nodejs.org` rồi giải nén thẳng vào `/usr/local` giúp mọi người dùng và cronjob đều gọi được `node` ngay lập tức.
3. **Cấu hình Nginx Reverse Proxy chuẩn:**
   - Proxy chuyển tiếp port nội bộ (`3000`) ra ngoài Internet qua port 80 / 443 với đầy đủ header `Host`, `X-Real-IP`, `X-Forwarded-For`.

---

## 5. TỰ ĐỘNG HÓA KIỂM THỬ GIAO DIỆN SAU KHI DEPLOY (PLAYWRIGHT VISUAL AUDIT)

Sau khi deploy xong lên VPS, kịch bản Playwright ([web/scripts/verify_ui.mjs](file:///Users/admin/Desktop/DuAnTiengViet/web/scripts/verify_ui.mjs)) tự động kiểm tra trang web trên 3 thiết bị chính:
- **Mobile iPhone (375 × 812, touch: true)**
- **Tablet iPad (768 × 1024, touch: true)**
- **Desktop (1280 × 800)**
Chụp ảnh màn hình lưu tại `.ui_audit/` để kiểm tra độ hoàn thiện giao diện trước khi bàn giao.
