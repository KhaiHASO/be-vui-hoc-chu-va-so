import fitz
import subprocess
import os
import re
import requests
import json
import time

doc = fitz.open("BỘ THẺ.pdf")

stroke_names = [
    {"id": 1, "name": "Nét hất", "slug": "net-hat"},
    {"id": 2, "name": "Nét móc xuôi", "slug": "net-moc-xuoi"},
    {"id": 3, "name": "Nét móc ngược", "slug": "net-moc-nguoc"},
    {"id": 4, "name": "Nét móc 2 đầu", "slug": "net-moc-2-dau"},
    {"id": 5, "name": "Nét khuyết trên", "slug": "net-khuyet-tren"},
    {"id": 6, "name": "Nét khuyết dưới", "slug": "net-khuyet-duoi"},
    {"id": 7, "name": "Nét cong kín", "slug": "net-cong-kin"},
    {"id": 8, "name": "Nét cong hở phải", "slug": "net-cong-ho-phai"},
    {"id": 9, "name": "Nét cong hở trái", "slug": "net-cong-ho-trai"},
    {"id": 10, "name": "Nét thắt trên", "slug": "net-that-tren"},
    {"id": 11, "name": "Nét thắt giữa", "slug": "net-that-giua"}
]

out_cache = "scripts/qr_cache_strokes.json"
cache = {}
if os.path.exists(out_cache):
    with open(out_cache, "r", encoding="utf-8") as f:
        cache = json.load(f)

headers = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
}

for item in stroke_names:
    cid = str(item["id"])
    if cid in cache and cache[cid].get("audio_url"):
        continue
    p_idx = (item["id"] - 1) * 2
    page = doc[p_idx]
    pix = page.get_pixmap(dpi=200)
    tmp_path = f"/tmp/stroke_scan_{cid}.png"
    pix.save(tmp_path)
    res = subprocess.run(["/opt/homebrew/bin/zbarimg", "-q", tmp_path], capture_output=True, text=True)
    if os.path.exists(tmp_path):
        os.remove(tmp_path)
    qr_urls = [line.replace("QR-Code:", "").strip() for line in res.stdout.split("\n") if line.strip().startswith("QR-Code:")]
    audio_url = None
    video_url = None
    for url in qr_urls:
        try:
            r = requests.get(url, headers=headers, timeout=8)
            target = r.url
            if "youtube.com" in target or "youtu.be" in target:
                video_url = target
                continue
            redirects = re.findall(r'window\.location\.href\s*=\s*["\']([^"\']+)["\']', r.text)
            if redirects:
                target = redirects[0]
            if "music" in target or "storage2.me-qr.com" in target or "qr.me-qr.com/music" in target:
                mr = requests.get(target, headers=headers, timeout=8)
                audios = re.findall(r'(https?://storage2\.me-qr\.com/[^\s"\'<>]+\.m4a)', mr.text)
                if audios:
                    audio_url = audios[0]
            elif "youtube.com" in target or "youtu.be" in target:
                video_url = target
        except Exception as e:
            pass
    cache[cid] = {
        "id": item["id"],
        "name": item["name"],
        "slug": item["slug"],
        "qr_urls": qr_urls,
        "audio_url": audio_url,
        "video_url": video_url
    }
    print(f"Stroke {cid} ({item['name']}): audio={bool(audio_url)}, video={bool(video_url)}")
    with open(out_cache, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)
    time.sleep(0.3)
print("Finished strokes scan!")
