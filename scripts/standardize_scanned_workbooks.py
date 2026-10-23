#!/usr/bin/env python3
"""
Bộ công cụ chuẩn hóa bản quét vở tập viết học sinh & sách mẫu (ScanSnap Booklet Normalizer)
- Tự động xoay chiều thẳng đứng (Deskew / Auto-orient)
- Tách trang đôi (2-page spread) thành các trang đơn chuẩn khổ dọc (Portrait)
- Tự động sắp xếp lại trật tự trang từ quy cách ghim lồng (Booklet Imposition) thành bản đọc tuần tự từ Trang 1 đến Trang 48 (Bài 1 -> Bài 80)
- Tăng cường độ tương phản, làm sạch nền giấy trắng sáng và khử bóng viền quét
"""

import cv2
import pymupdf
import numpy as np
import os
import sys
import time

# Trật tự 48 trang sách chuẩn theo quy cách ghim lồng (Booklet Imposition) của vở 24 tờ quét
PAGE_SPEC = [
    (1, 'R'),   # Trang 01: Bìa trước (Tập Viết 1 Tập Một)
    (2, 'L'),   # Trang 02: Chào em vào lớp một
    (3, 'R'),   # Trang 03: Nét cơ bản (c, o, l...)
    (4, 'L'),   # Trang 04: Số 1 đến 10
    (5, 'R'),   # Trang 05: Bài 1, 2
    (6, 'L'),   # Trang 06: Bài 3, 4
    (7, 'R'),   # Trang 07: Bài 5, 6
    (8, 'L'),   # Trang 08: Bài 7, 8
    (9, 'R'),   # Trang 09: Bài 9, 10
    (10, 'L'),  # Trang 10: Bài 11, 12
    (11, 'R'),  # Trang 11: Bài 13
    (12, 'L'),  # Trang 12: Bài 14, 15
    (13, 'R'),  # Trang 13: Bài 16
    (14, 'L'),  # Trang 14: Bài 17, 18
    (15, 'R'),  # Trang 15: Bài 19
    (16, 'L'),  # Trang 16: Bài 20, 21
    (17, 'R'),  # Trang 17: Bài 22
    (18, 'L'),  # Trang 18: Bài 23, 24
    (19, 'R'),  # Trang 19: Bài 25
    (20, 'L'),  # Trang 20: Bài 26, 27
    (21, 'R'),  # Trang 21: Bài 28
    (22, 'L'),  # Trang 22: Bài 29, 30
    (23, 'R'),  # Trang 23: Bài 31, 32
    (24, 'L'),  # Trang 24: Bài 33, 34
    (24, 'R'),  # Trang 25: Bài 35, 36
    (23, 'L'),  # Trang 26: Bài 37, 38
    (22, 'R'),  # Trang 27: Bài 39, 40
    (21, 'L'),  # Trang 28: Bài 41, 42
    (20, 'R'),  # Trang 29: Bài 43, 44
    (19, 'L'),  # Trang 30: Bài 45, 46
    (18, 'R'),  # Trang 31: Bài 47, 48
    (17, 'L'),  # Trang 32: Bài 49, 50
    (16, 'R'),  # Trang 33: Bài 51, 52
    (15, 'L'),  # Trang 34: Bài 53, 54
    (14, 'R'),  # Trang 35: Bài 55, 56
    (13, 'L'),  # Trang 36: Bài 57, 58
    (12, 'R'),  # Trang 37: Bài 59, 60
    (11, 'L'),  # Trang 38: Bài 61, 62
    (10, 'R'),  # Trang 39: Bài 63, 64
    (9, 'L'),   # Trang 40: Bài 65, 66
    (8, 'R'),   # Trang 41: Bài 67, 68
    (7, 'L'),   # Trang 42: Bài 69, 70
    (5, 'L'),   # Trang 43: Bài 71, 72
    (4, 'R'),   # Trang 44: Bài 73, 74
    (3, 'L'),   # Trang 45: Bài 75, 76
    (2, 'R'),   # Trang 46: Bài 77, 78
    (1, 'L'),   # Trang 47: Bài 79, 80
    (6, 'R'),   # Trang 48: Luyện viết chữ cỡ nhỏ (bìa trong cuối sách)
]

TARGET_W, TARGET_H = 1400, 2200

def get_upright_sheet(img):
    h, w = img.shape[:2]
    # Đưa về khổ ngang (landscape) nếu đang nằm dọc
    if h > w:
        img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
        h, w = img.shape[:2]
    
    # Phân tích dải hoa văn trang trí và huy hiệu 'BÀI' ở phần trên vs dưới
    top_8 = img[:int(h*0.08), :]
    bot_8 = img[int(h*0.92):, :]
    top_dark = np.mean(top_8 < 225)
    bot_dark = np.mean(bot_8 < 225)
    
    upper_top = img[int(h*0.02):int(h*0.10), :]
    upper_bot = img[int(h*0.40):int(h*0.48), :]
    upper_top_dark = np.mean(upper_top < 200)
    upper_bot_dark = np.mean(upper_bot < 200)
    
    score_0 = (top_dark - bot_dark) + (upper_top_dark - upper_bot_dark)
    
    # So sánh với trường hợp lộn ngược 180 độ
    im180 = cv2.rotate(img, cv2.ROTATE_180)
    top_8_r = im180[:int(h*0.08), :]
    bot_8_r = im180[int(h*0.92):, :]
    upper_top_r = im180[int(h*0.02):int(h*0.10), :]
    upper_bot_r = im180[int(h*0.40):int(h*0.48), :]
    score_180 = (np.mean(top_8_r < 225) - np.mean(bot_8_r < 225)) + (np.mean(upper_top_r < 200) - np.mean(upper_bot_r < 200))
    
    if score_180 > score_0:
        return im180
    return img

def standardize_pdf(input_path, output_path):
    t0 = time.time()
    doc = pymupdf.open(input_path)
    if len(doc) != 24:
        raise ValueError(f"Tài liệu '{input_path}' có {len(doc)} trang, cần 24 trang quét đôi.")
    
    sheets = []
    for i in range(len(doc)):
        p = doc[i]
        img_list = p.get_images()
        base_img = doc.extract_image(img_list[0][0])
        img_arr = cv2.imdecode(np.frombuffer(base_img['image'], np.uint8), cv2.IMREAD_COLOR)
        up = get_upright_sheet(img_arr)
        sheets.append(up)
    
    out_doc = pymupdf.open()
    for p_num, (s_idx, side) in enumerate(PAGE_SPEC, start=1):
        sheet = sheets[s_idx - 1]
        sh_h, sh_w = sheet.shape[:2]
        mid = sh_w // 2
        page_raw = sheet[:, :mid] if side == 'L' else sheet[:, mid:]
        
        # Cắt mép viền bóng scanner (12px)
        p_h, p_w = page_raw.shape[:2]
        cropped = page_raw[12:p_h-12, 12:p_w-12]
        
        # Cân bằng trắng & tăng độ tương phản nền giấy
        page_f = cropped.astype(np.float32)
        cleaned = np.clip(page_f * (255.0 / 238.0), 0, 255).astype(np.uint8)
        
        # Scale chuẩn kích thước và ghi vào PDF
        resized = cv2.resize(cleaned, (TARGET_W, TARGET_H), interpolation=cv2.INTER_AREA)
        _, buf = cv2.imencode('.jpg', resized, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
        
        pdf_page = out_doc.new_page(width=TARGET_W * 72 / 150, height=TARGET_H * 72 / 150)
        pdf_page.insert_image(pdf_page.rect, stream=buf.tobytes())
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    out_doc.save(output_path, garbage=3, deflate=True)
    size_mb = os.path.getsize(output_path) / 1024 / 1024
    print(f"✅ Hoàn tất '{os.path.basename(output_path)}' ({size_mb:.2f} MB, 48 trang chuẩn) trong {time.time()-t0:.2f}s")

if __name__ == "__main__":
    base_dir = "/Users/admin/Desktop/BeVuiHocChuVaSo/DuLieuChuViet"
    targets = [
        ("DuLieuCoGiaoViet", "TapVietChanLy1.pdf"),
        ("DuLieuCoGiaoViet", "TapVietChanLy2.pdf"),
        ("DuLieuCoGiaoViet", "TapVietChanLy3.pdf"),
        ("DuLieuCoGiaoViet", "TapVietChanLy4.pdf"),
        ("DuLieuHocSinhViet", "HocSinhChuDep1.pdf"),
        ("DuLieuHocSinhViet", "HocSinhChuDep2.pdf"),
        ("DuLieuHocSinhViet", "HocSinhChuXau1.pdf"),
        ("DuLieuHocSinhViet", "HocSinhChuXau2.pdf"),
    ]
    for folder, fname in targets:
        in_p = os.path.join(base_dir, folder, fname)
        out_p = os.path.join(base_dir, folder, fname.replace(".pdf", "_BanDienTu.pdf"))
        standardize_pdf(in_p, out_p)
