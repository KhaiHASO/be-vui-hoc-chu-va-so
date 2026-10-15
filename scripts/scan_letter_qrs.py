import fitz
import subprocess
import os
import re
import requests
import json
import time

doc = fitz.open("BỘ THẺ.pdf")

cards_meta = [
    {"id": 12, "letter": "A", "name": "Chữ A", "slug": "a", "type": "vowel"},
    {"id": 13, "letter": "Ă", "name": "Chữ Ă", "slug": "aw", "type": "vowel"},
    {"id": 14, "letter": "Â", "name": "Chữ Â", "slug": "aa", "type": "vowel"},
    {"id": 15, "letter": "B", "name": "Chữ B", "slug": "b", "type": "consonant"},
    {"id": 16, "letter": "C", "name": "Chữ C", "slug": "c", "type": "consonant"},
    {"id": 17, "letter": "D", "name": "Chữ D", "slug": "d", "type": "consonant"},
    {"id": 18, "letter": "Đ", "name": "Chữ Đ", "slug": "dd", "type": "consonant"},
    {"id": 19, "letter": "E", "name": "Chữ E", "slug": "e", "type": "vowel"},
    {"id": 20, "letter": "Ê", "name": "Chữ Ê", "slug": "ee", "type": "vowel"},
    {"id": 21, "letter": "G", "name": "Chữ G", "slug": "g", "type": "consonant"},
    {"id": 22, "letter": "H", "name": "Chữ H", "slug": "h", "type": "consonant"},
    {"id": 23, "letter": "I", "name": "Chữ I", "slug": "i", "type": "vowel"},
    {"id": 24, "letter": "K", "name": "Chữ K", "slug": "k", "type": "consonant"},
    {"id": 25, "letter": "L", "name": "Chữ L", "slug": "l", "type": "consonant"},
    {"id": 26, "letter": "M", "name": "Chữ M", "slug": "m", "type": "consonant"},
    {"id": 27, "letter": "N", "name": "Chữ N", "slug": "n", "type": "consonant"},
    {"id": 28, "letter": "O", "name": "Chữ O", "slug": "o", "type": "vowel"},
    {"id": 29, "letter": "Ô", "name": "Chữ Ô", "slug": "oo", "type": "vowel"},
    {"id": 30, "letter": "Ơ", "name": "Chữ Ơ", "slug": "ow", "type": "vowel"},
    {"id": 31, "letter": "P", "name": "Chữ P", "slug": "p", "type": "consonant"},
    {"id": 32, "letter": "Q", "name": "Chữ Q", "slug": "q", "type": "consonant"},
    {"id": 33, "letter": "R", "name": "Chữ R", "slug": "r", "type": "consonant"},
    {"id": 34, "letter": "S", "name": "Chữ S", "slug": "s", "type": "consonant"},
    {"id": 35, "letter": "T", "name": "Chữ T", "slug": "t", "type": "consonant"},
    {"id": 36, "letter": "U", "name": "Chữ U", "slug": "u", "type": "vowel"},
    {"id": 37, "letter": "Ư", "name": "Chữ Ư", "slug": "uw", "type": "vowel"},
    {"id": 38, "letter": "V", "name": "Chữ V", "slug": "v", "type": "consonant"},
    {"id": 39, "letter": "X", "name": "Chữ X", "slug": "x", "type": "consonant"},
    {"id": 40, "letter": "Y", "name": "Chữ Y", "slug": "y", "type": "vowel"}
]

out_cache = "scripts/qr_cache_letters.json"
cache = {}
if os.path.exists(out_cache):
    with open(out_cache, "r", encoding="utf-8") as f:
        cache = json.load(f)

print(f"Loaded {len(cache)} cached items.")

headers = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
}

for item in cards_meta:
    cid = str(item["id"])
    if cid in cache and cache[cid].get("audio_url") and cache[cid].get("video_url"):
        print(f"Card {cid} ({item['letter']}): CACHED")
        continue

    p_idx = (item["id"] - 1) * 2
    page = doc[p_idx]
    pix = page.get_pixmap(dpi=200)
    tmp_path = f"/tmp/card_scan_{cid}.png"
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
            print(f"Error {url}: {e}")
            
    cache[cid] = {
        "id": item["id"],
        "letter": item["letter"],
        "slug": item["slug"],
        "qr_urls": qr_urls,
        "audio_url": audio_url,
        "video_url": video_url
    }
    print(f"Card {cid} ({item['letter']}): audio={bool(audio_url)}, video={bool(video_url)}")
    with open(out_cache, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)
    time.sleep(0.3)

print("Finished scanning all letters QR codes!")
