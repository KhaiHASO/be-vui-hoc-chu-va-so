import paramiko
import sys
import time

HOST = "160.250.4.210"
USER = "root"
PASS = "Bevuihocchuvaso@@123"
REPO_URL = "https://github.com/KhaiHASO/be-vui-hoc-chu-va-so.git"
APP_DIR = "/var/www/be-vui-hoc-chu-va-so"
APP_NAME = "be-vui-hoc-chu-va-so"

def run_cmd(ssh, cmd, title=None):
    if title:
        print(f"\n==========================================")
        print(f"▶ {title}")
        print(f"==========================================")
    print(f"$ {cmd.strip()}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    while True:
        line = stdout.readline()
        if not line:
            break
        print(line, end="")
        sys.stdout.flush()
        
    exit_status = stdout.channel.recv_exit_status()
    err = stderr.read().decode().strip()
    if err and exit_status != 0:
        print(f"STDERR: {err}")
    if exit_status != 0:
        print(f"❌ Exit status: {exit_status}")
    else:
        print(f"✓ Hoàn tất!")
    return exit_status

def main():
    print(f"🚀 Đang kết nối SSH tới {USER}@{HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(HOST, username=USER, password=PASS, timeout=20)
        print("✓ Đăng nhập SSH thành công vào VPS!")
    except Exception as e:
        print(f"❌ Lỗi kết nối SSH: {e}")
        sys.exit(1)

    # 1. Tạo 2GB Swap Memory (chống tràn RAM khi build Next.js)
    swap_cmd = """
    if [ ! -f /swapfile ]; then
        echo "Tạo 2GB Swap Memory..."
        fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo "/swapfile none swap sw 0 0" >> /etc/fstab
    fi
    free -m
    """
    run_cmd(ssh, swap_cmd, "Thiết lập Swap Memory")

    # 2. Cập nhật và cài đặt git, nginx, curl
    apt_cmd = """
    apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y git nginx curl xz-utils
    """
    run_cmd(ssh, apt_cmd, "Cài đặt Git, Nginx, Curl")

    # 3. Cài đặt Node.js v22 LTS trực tiếp từ binary chính thức
    node_cmd = """
    if ! command -v node >/dev/null 2>&1; then
        echo "Tải và giải nén Node.js v22 LTS..."
        curl -fsSL https://nodejs.org/dist/v22.14.0/node-v22.14.0-linux-x64.tar.xz | tar -xJ -C /usr/local --strip-components=1
    fi
    node -v
    npm -v
    npm install -g pnpm pm2
    pnpm -v
    pm2 -v
    """
    run_cmd(ssh, node_cmd, "Cài đặt Node.js v22, pnpm & PM2")

    # 4. Clone mã nguồn từ GitHub
    git_cmd = f"""
    mkdir -p /var/www
    cd /var/www
    rm -rf {APP_NAME}
    git clone {REPO_URL}
    cd {APP_NAME}
    git log -1 --oneline
    """
    run_cmd(ssh, git_cmd, "Clone repository từ GitHub")

    # 5. Cài đặt dependencies và Build Next.js
    build_cmd = f"""
    cd {APP_DIR}
    pnpm install
    pnpm build
    """
    run_cmd(ssh, build_cmd, "Cài đặt dependencies & Build Next.js")

    # 6. Chạy ứng dụng qua PM2
    pm2_cmd = f"""
    cd {APP_DIR}
    pm2 delete {APP_NAME} 2>/dev/null || true
    pm2 start "pnpm start -p 3000" --name {APP_NAME}
    pm2 save
    """
    run_cmd(ssh, pm2_cmd, "Cấu hình tiến trình PM2")

    # 7. Cấu hình Nginx Reverse Proxy
    nginx_conf = f"""
cat << 'EOF' > /etc/nginx/sites-available/default
server {{
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    location / {{
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }}
}}
EOF
    nginx -t && systemctl restart nginx
    """
    run_cmd(ssh, nginx_conf, "Cấu hình Nginx Reverse Proxy Port 80 -> 3000")

    # 8. Kiểm tra tình trạng dịch vụ
    status_cmd = f"""
    echo "=== PM2 STATUS ==="
    pm2 status
    echo "\n=== NGINX STATUS ==="
    systemctl is-active nginx
    echo "\n=== LOCAL HTTP TEST ==="
    curl -I http://127.0.0.1:3000
    """
    run_cmd(ssh, status_cmd, "Kiểm tra tình trạng hệ thống")

    ssh.close()
    print("\n🎉 TRIỂN KHAI HOÀN TẤT 100% LÊN VPS 160.250.4.210!")
    print(f"👉 Truy cập ngay: http://{HOST}")

if __name__ == "__main__":
    main()
