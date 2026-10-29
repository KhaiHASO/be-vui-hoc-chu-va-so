#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vectorize Workbook Handwriting Templates into Red Vector Masks (SVG & Transparent Red PNG)
Processes all 310 scanned handwriting templates from 'Vở tập viết' into clean,
responsive, transparent red vectors (#dc2626) and PNG companions.
"""

import os
import re
import sys
import json
import unicodedata
import subprocess
from concurrent.futures import ProcessPoolExecutor, as_completed
import time

SRC_DIR = "/Users/macos/Desktop/BeVuiHocChuVaSo/Vở tập viết"
PROJECT_ROOT = "/Users/macos/Desktop/BeVuiHocChuVaSo"
OUT_SVG_DIR = os.path.join(PROJECT_ROOT, "public/data/red_vectors")
OUT_TEACHER_DIR = os.path.join(PROJECT_ROOT, "public/data/teacher_masters")
DATA_DIR = os.path.join(PROJECT_ROOT, "src/data")
PUBLIC_DATA_DIR = os.path.join(PROJECT_ROOT, "public/data")

def remove_accents(s: str) -> str:
    """Strip Vietnamese diacritics to pure ASCII."""
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = s.replace('đ', 'd').replace('Đ', 'D')
    return unicodedata.normalize('NFC', s)

def make_slug(s: str) -> str:
    """Generate safe ASCII slug."""
    s = remove_accents(s).lower()
    s = re.sub(r'[^a-z0-9]+', '_', s)
    return s.strip('_')

def get_category(name: str) -> str:
    words = name.split()
    if len(words) == 1:
        if len(name) == 1 or name.lower() in [
            'a', 'ă', 'â', 'b', 'c', 'd', 'đ', 'e', 'ê', 'g', 'h', 'i', 'k',
            'l', 'm', 'n', 'o', 'ô', 'ơ', 'p', 'q', 'r', 's', 't', 'u', 'ư', 'v', 'x', 'y'
        ]:
            return 'letter'
        return 'rhyme'
    if len(words) <= 3 and len(name) < 15:
        return 'word'
    return 'sentence'

def process_single_file(filename: str):
    src_path = os.path.join(SRC_DIR, filename)
    name_no_ext = os.path.splitext(filename)[0]
    nfc_name = unicodedata.normalize("NFC", name_no_ext).strip()

    # Get dimensions
    try:
        dim_out = subprocess.check_output(
            ["magick", "identify", "-format", "%w %h", src_path],
            stderr=subprocess.DEVNULL
        ).decode().strip()
        width, height = map(int, dim_out.split())
    except Exception:
        width, height = 250, 300

    # Temporary PBM path
    tmp_pbm = f"/tmp/potrace_{os.getpid()}_{hash(filename)}.pbm"
    tmp_svg = f"/tmp/potrace_{os.getpid()}_{hash(filename)}.svg"

    try:
        # 1. Binarize ink: Paper background & light blue grid lines -> Pure White (255)
        # Ink strokes -> Pure Black (0)
        cmd_pbm = [
            "magick", src_path,
            "-colorspace", "Gray",
            "-threshold", "65%",
            tmp_pbm
        ]
        subprocess.run(cmd_pbm, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # 2. Trace vector paths with potrace
        # -t 12 eliminates stray noise / grid remnants
        # -C #dc2626 colors the vector curves in rich vivid red
        cmd_potrace = [
            "potrace", tmp_pbm,
            "-s",
            "-t", "12",
            "-C", "#dc2626",
            "-o", tmp_svg
        ]
        subprocess.run(cmd_potrace, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # 3. Post-process SVG for responsive Web UI
        with open(tmp_svg, "r", encoding="utf-8") as f:
            svg_content = f.read()

        # Replace fixed pt width/height with 100% so viewBox controls responsive scaling
        responsive_svg = re.sub(
            r'width="[^"]+"\s+height="[^"]+"',
            'width="100%" height="100%"',
            svg_content,
            count=1
        )

        # Write final SVG to public/data/red_vectors/[nfc_name].svg
        dest_svg_path = os.path.join(OUT_SVG_DIR, f"{nfc_name}.svg")
        with open(dest_svg_path, "w", encoding="utf-8") as f:
            f.write(responsive_svg)

        # Also write teacher master SVG alias
        teacher_svg_path = os.path.join(OUT_TEACHER_DIR, f"master_{nfc_name}.svg")
        with open(teacher_svg_path, "w", encoding="utf-8") as f:
            f.write(responsive_svg)

        # 4. Generate transparent red PNG companion
        # Alpha channel = inverted binarized strokes, Color = #dc2626
        dest_png_path = os.path.join(OUT_SVG_DIR, f"{nfc_name}.png")
        teacher_png_path = os.path.join(OUT_TEACHER_DIR, f"master_{nfc_name}.png")

        cmd_png = f"magick \"{tmp_pbm}\" -negate \( +clone -fill \"#dc2626\" -colorize 100% \) +swap -compose CopyOpacity -composite \"{dest_png_path}\""
        subprocess.run(cmd_png, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # Copy to teacher_masters
        subprocess.run(f"cp \"{dest_png_path}\" \"{teacher_png_path}\"", shell=True, check=True)

        category = get_category(nfc_name)
        slug = make_slug(nfc_name)

        return {
            "name": nfc_name,
            "slug": slug,
            "category": category,
            "width": width,
            "height": height,
            "aspectRatio": round(width / height, 3) if height > 0 else 1.0,
            "svgUrl": f"/data/red_vectors/{nfc_name}.svg",
            "pngUrl": f"/data/teacher_masters/master_{nfc_name}.png",
            "redPngUrl": f"/data/red_vectors/{nfc_name}.png",
            "success": True
        }

    except Exception as e:
        return {
            "name": nfc_name,
            "success": False,
            "error": str(e)
        }
    finally:
        if os.path.exists(tmp_pbm):
            os.remove(tmp_pbm)
        if os.path.exists(tmp_svg):
            os.remove(tmp_svg)

def main():
    start_time = time.time()
    os.makedirs(OUT_SVG_DIR, exist_ok=True)
    os.makedirs(OUT_TEACHER_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(PUBLIC_DATA_DIR, exist_ok=True)

    files = [f for f in os.listdir(SRC_DIR) if f.endswith(".png")]
    print(f"Bắt đầu chuyển đổi {len(files)} file mẫu chữ viết sang vector đỏ...")

    items = []
    # Use ProcessPoolExecutor across multi-core CPU
    cpu_cores = os.cpu_count() or 8
    with ProcessPoolExecutor(max_workers=cpu_cores) as executor:
        future_map = {executor.submit(process_single_file, f): f for f in files}
        completed = 0
        for future in as_completed(future_map):
            res = future.result()
            if res.get("success"):
                items.append(res)
            else:
                print(f"Lỗi khi xử lý {res['name']}: {res.get('error')}")
            completed += 1
            if completed % 50 == 0 or completed == len(files):
                print(f"Đã xử lý {completed}/{len(files)} file...")

    # Sort items nicely: letters first, then rhymes, then words, then sentences
    cat_order = {"letter": 1, "rhyme": 2, "word": 3, "sentence": 4}
    items.sort(key=lambda x: (cat_order.get(x["category"], 99), x["name"]))

    # Build comprehensive lookup mapping
    lookup = {}
    for it in items:
        name = it["name"]
        norm = name.lower().strip()
        svg_url = it["svgUrl"]
        png_url = it["pngUrl"]

        # Exact normalized
        lookup[norm] = svg_url
        # Without punctuation (comma, period)
        clean_punct = re.sub(r'[,.\-!?]+', '', norm).strip()
        lookup[clean_punct] = svg_url

        # ASCII unaccented
        ascii_name = remove_accents(norm)
        if ascii_name not in lookup:
            lookup[ascii_name] = svg_url
        clean_ascii = remove_accents(clean_punct)
        if clean_ascii not in lookup:
            lookup[clean_ascii] = svg_url

        # Slug
        slug = it["slug"]
        if slug not in lookup:
            lookup[slug] = svg_url

    # Add single letter fallbacks
    single_letters = {it["name"].lower(): it["svgUrl"] for it in items if it["category"] == "letter"}

    dataset = {
        "total": len(items),
        "generatedAt": time.strftime("%Y-%m-%d %H:%M:%S"),
        "color": "#dc2626",
        "masters": items,
        "lookup": lookup,
        "singleLetters": single_letters
    }

    # Write JSON metadata to src/data/workbook_masters.json and public/data/workbook_masters.json
    json_path_src = os.path.join(DATA_DIR, "workbook_masters.json")
    json_path_public = os.path.join(PUBLIC_DATA_DIR, "workbook_masters.json")

    with open(json_path_src, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    with open(json_path_public, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    elapsed = time.time() - start_time
    print(f"\n Hoàn tất 100% ({len(items)}/{len(files)} files) trong {elapsed:.2f}s!")
    print(f"- Thư mục SVG Vector: {OUT_SVG_DIR} ({len(os.listdir(OUT_SVG_DIR))} files)")
    print(f"- Thư mục Teacher Masters: {OUT_TEACHER_DIR} ({len(os.listdir(OUT_TEACHER_DIR))} files)")
    print(f"- File Metadata JSON: {json_path_src}")

if __name__ == "__main__":
    main()
