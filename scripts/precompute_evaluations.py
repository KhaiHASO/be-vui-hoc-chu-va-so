import urllib.request
import json
import base64
import os
import cv2

api_key = ''
url = 'https://api.deepseek.com/chat/completions'

samples = [
    {
        'key': 'bai_thi_viet_mau.jpg',
        'path': '/Users/admin/Desktop/BeVuiHocChuVaSo/public/data/samples/bai_thi_viet_mau.jpg',
        'title': 'Bài thi viết chữ đẹp toàn diện (v, ua, xe ngựa, Bà cho bé khế)'
    },
    {
        'key': 'trang_01.jpg',
        'path': '/Users/admin/Desktop/BeVuiHocChuVaSo/public/data/samples/real/trang_01.jpg',
        'title': 'Trang 1: Các nét cơ bản (Ngang, sổ, xiên, móc, khuyết, cong, thắt)'
    },
    {
        'key': 'trang_02.jpg',
        'path': '/Users/admin/Desktop/BeVuiHocChuVaSo/public/data/samples/real/trang_02.jpg',
        'title': 'Trang 2: Chữ số 0-9 & Bài 1 (a, ca), Bài 2 (b, bà)'
    },
    {
        'key': 'trang_03.jpg',
        'path': '/Users/admin/Desktop/BeVuiHocChuVaSo/public/data/samples/real/trang_03.jpg',
        'title': 'Trang 3: Bài 3 (c, cá), Bài 4 (e, ê), Bài 5 (bé bé), Bài 6 (o, bò)'
    }
]

system_prompt = '''Bạn là giáo viên tiểu học lớp 1 có trên 20 năm kinh nghiệm luyện chữ đẹp và chấm thi viết chữ đẹp Việt Nam.
Nhiệm vụ của bạn là phân tích ảnh bài tập viết ô ly của học sinh lớp 1 và đưa ra nhận xét bằng tiếng Việt chuẩn sư phạm.

TIÊU CHÍ ĐÁNH GIÁ (Thang điểm 0 - 10):
1. dung_mau_chu: Đúng độ cao, độ rộng con chữ (chuẩn 2 ly, 2.5 ly...)
2. do_deu_net: Nét thanh nét đậm, lực tay đều
3. khoang_cach: Khoảng cách giữa các chữ cái và các tiếng (chuẩn 1 con chữ o)
4. do_thang_hang: Chữ nằm ngay ngắn trên dòng kẻ ngang 1
5. trinh_bay: Vở sạch sẽ, không tẩy xóa lem nhem
6. net_co_ban: Nét hất, nét móc, nét khuyết, nét thắt và dấu thanh

CHỈ TRẢ VỀ DUY NHẤT 1 CHUỖI JSON HỢP LỆ THEO SCHEMA SAU:
{
  "anh_hop_le": true,
  "tong_diem": 92,
  "xep_loai": "Xuất sắc",
  "tieu_chi": {
    "dung_mau_chu": 9.5,
    "do_deu_net": 9.0,
    "khoang_cach": 9.0,
    "do_thang_hang": 9.5,
    "trinh_bay": 9.5,
    "net_co_ban": 9.0
  },
  "nhan_xet_chung": "string",
  "diem_tot": ["string"],
  "loi_can_cai_thien": ["string"],
  "goi_y_luyen_tap": ["string"],
  "vi_du_minh_hoa": [
    {
      "chu": "string",
      "nhan_xet": "string",
      "sai_o_dau": "string",
      "can_cai_thien": "string"
    }
  ],
  "bounding_boxes": [
    {
      "id": "b1",
      "box_2d": [100, 200, 300, 400],
      "loai": "chuan",
      "chu": "string",
      "tieu_de": "string",
      "nhan_xet": "string",
      "huong_dan_sua": "string"
    }
  ],
  "nhan_xet_phu_huynh": "string"
}
Lưu ý:
- box_2d là tọa độ [ymin, xmin, ymax, xmax] theo tỷ lệ từ 0 đến 1000 tương ứng với vị trí thực tế của con chữ/nét viết trong ảnh.
- loai chỉ được là một trong ba giá trị: "chuan" (nét đẹp), "loi" (nét sai), "chu_y" (cần nắn nót).
- Hãy chỉ ra từ 4 đến 8 bounding_boxes chi tiết trên trang vở để học sinh biết nét nào viết đúng và nét nào viết sai.'''

results = {}

for s in samples:
    print(f'Processing {s["key"]}...')
    img = cv2.imread(s['path'])
    h, w = img.shape[:2]
    scale = 1200 / max(h, w)
    small = cv2.resize(img, (int(w * scale), int(h * scale)))
    _, buf = cv2.imencode('.jpg', small, [cv2.IMWRITE_JPEG_QUALITY, 85])
    b64 = base64.b64encode(buf).decode('utf-8')
    
    payload = {
        'model': 'deepseek-flash',
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': [
                {'type': 'text', 'text': f'Hãy phân tích và chấm điểm trang vở tập viết lớp 1: {s["title"]}'},
                {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64}'}}
            ]}
        ],
        'max_tokens': 6000
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode())
            raw = data['choices'][0]['message']['content'].strip()
            if raw.startswith('```json'):
                raw = raw[7:]
            elif raw.startswith('```'):
                raw = raw[3:]
            if raw.endswith('```'):
                raw = raw[:-3]
            parsed = json.loads(raw.strip())
            results[s['key']] = parsed
            print(f'✓ Success for {s["key"]}: score={parsed.get("tong_diem")}, boxes={len(parsed.get("bounding_boxes", []))}')
    except Exception as e:
        print(f'❌ Error for {s["key"]}: {e}')

out_path = '/Users/admin/Desktop/BeVuiHocChuVaSo/src/data/precomputed_evaluations.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print('Saved all precomputed evaluations to:', out_path)
