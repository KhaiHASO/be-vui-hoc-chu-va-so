import os
import json
import fitz
from PIL import Image

def extract_module_numbers():
    pdf_path = "BỘ THẺ.pdf"
    base_out = "data/module_numbers"
    cards_dir = os.path.join(base_out, "cards")
    illu_dir = os.path.join(base_out, "illustrations")
    writing_dir = os.path.join(base_out, "writing_guides")
    animals_dir = os.path.join(base_out, "animals")

    os.makedirs(cards_dir, exist_ok=True)
    os.makedirs(illu_dir, exist_ok=True)
    os.makedirs(writing_dir, exist_ok=True)
    os.makedirs(animals_dir, exist_ok=True)

    doc = fitz.open(pdf_path)

    number_meta = [
        {
            "num": 1, "card_id": 71, "word": "số một",
            "item_name": "chú sư tử", "unit": "chú",
            "single_xref": 3646,
            "strokes": 2,
            "writing_steps": [
                "Nét 1: Đặt bút ở giữa ô ly (đường kẻ 2), viết nét xiên phải lên góc trên bên phải (đường kẻ 3).",
                "Nét 2: Từ điểm dừng của nét 1, chuyển hướng kéo thẳng đứng xuống dòng kẻ ngang số 1."
            ],
            "common_mistakes": "Viết nét xiên quá dài hoặc kéo nét thẳng bị xiên vẹo, không vuông góc với dòng kẻ.",
            "parent_tip": "Cho bé giơ 1 ngón tay, đếm 1 chú sư tử, hỏi: '1 gồm 1 và mấy?' -> '1 gồm 1 và 0'."
        },
        {
            "num": 2, "card_id": 72, "word": "số hai",
            "item_name": "chú gà trống", "unit": "chú",
            "single_xref": None,
            "strokes": 2,
            "writing_steps": [
                "Nét 1: Kết hợp nét cong trên và nét xiên lượn xuống góc trái dưới (dòng kẻ 1).",
                "Nét 2: Nét ngang lượn sóng nhẹ từ trái sang phải trên dòng kẻ ngang số 1."
            ],
            "common_mistakes": "Đầu số 2 bị bẹt hoặc chân số 2 quá ngắn, chưa tạo được nét lượn sóng mềm mại.",
            "parent_tip": "Cho bé đếm 2 chú gà trống gáy vang, đố bé: 'Có 2 cái kẹo chia cho 2 bạn, mỗi bạn được mấy cái?'."
        },
        {
            "num": 3, "card_id": 73, "word": "số ba",
            "item_name": "chú vịt con", "unit": "chú",
            "single_xref": 3676,
            "strokes": 2,
            "writing_steps": [
                "Nét 1: Nét cong hở trái phía trên, dừng ở giữa thân chữ số.",
                "Nét 2: Nét cong hở trái phía dưới to hơn nét trên một chút, dừng bút trên dòng kẻ 1."
            ],
            "common_mistakes": "Hai nửa cong không cân đối hoặc phần thắt ở giữa bị hở, lưng số 3 bị gãy.",
            "parent_tip": "Đố con: 'Gộp 1 chú vịt và 2 chú vịt thì được mấy chú vịt?' -> 'Được 3 chú vịt!'."
        },
        {
            "num": 4, "card_id": 74, "word": "số bốn",
            "item_name": "chú thỏ trắng", "unit": "chú",
            "single_xref": None,
            "strokes": 3,
            "writing_steps": [
                "Nét 1: Đặt bút trên đỉnh (đường kẻ 3), kéo nét xiên trái xuống giữa ô ly (đường kẻ 2).",
                "Nét 2: Kéo nét ngang sang phải rộng khoảng 1 ô ly.",
                "Nét 3: Nét thẳng đứng ngắn cắt ngang qua nét 2, dừng trên dòng kẻ 1."
            ],
            "common_mistakes": "Nét ngang kéo quá dài hoặc nét đứng số 3 cắt lệch tâm nét ngang.",
            "parent_tip": "Cho con 4 chiếc bút, bảo con chia thành 2 phần bằng nhau: '4 gồm 2 và 2'."
        },
        {
            "num": 5, "card_id": 75, "word": "số năm",
            "item_name": "chú bò sữa", "unit": "chú",
            "single_xref": None,
            "strokes": 3,
            "writing_steps": [
                "Nét 1: Đặt bút ở đường kẻ 3, kéo thẳng đứng xuống giữa ô (đường kẻ 2).",
                "Nét 2: Từ điểm dừng nét 1, viết nét cong hở trái xuống dòng kẻ 1, lượn lên một chút.",
                "Nét 3: Đặt bút tại điểm bắt đầu nét 1, viết nét ngang ngắn sang phải trên đường kẻ 3."
            ],
            "common_mistakes": "Viết nét ngang trước làm lệch thân hoặc bụng số 5 quá nhỏ so với thân.",
            "parent_tip": "Xòe 1 bàn tay có 5 ngón: 'Bàn tay có 5 ngón, gồm 1 ngón cái và 4 ngón còn lại!'."
        },
        {
            "num": 6, "card_id": 76, "word": "số sáu",
            "item_name": "chú mèo con", "unit": "chú",
            "single_xref": None,
            "strokes": 1,
            "writing_steps": [
                "Nét 1: Nét liền bắt đầu từ đường kẻ 3, lượn cong sang trái xuống dòng kẻ 1 rồi uốn tròn lên tạo nét cong kín (bụng số 6)."
            ],
            "common_mistakes": "Bụng số 6 không khép kín hoặc lưng quá thẳng, không có độ cong lượn tự nhiên.",
            "parent_tip": "Đố con: 'Có 6 chú mèo, 3 chú đang ngủ thì còn mấy chú đang chơi?'."
        },
        {
            "num": 7, "card_id": 77, "word": "số bảy",
            "item_name": "chú ốc sên", "unit": "chú",
            "single_xref": None,
            "strokes": 3,
            "writing_steps": [
                "Nét 1: Nét ngang trên đỉnh (đường kẻ 3).",
                "Nét 2: Nét xiên trái từ điểm cuối nét 1 xuống dòng kẻ 1.",
                "Nét 3: Nét ngang ngắn cắt ngang thân nét xiên (ở đường kẻ 2)."
            ],
            "common_mistakes": "Nét xiên quá dốc làm số 7 bị đổ ngã hoặc quên gạch nét ngang giữa thân.",
            "parent_tip": "Một tuần có 7 ngày, con đếm xem có mấy ngày đi học và mấy ngày được nghỉ cuối tuần."
        },
        {
            "num": 8, "card_id": 78, "word": "số tám",
            "item_name": "chú bướm xinh", "unit": "chú",
            "single_xref": None,
            "strokes": 1,
            "writing_steps": [
                "Nét 1: Nét liền uốn lượn hình chữ S từ trên xuống dưới, vòng qua đáy rồi lượn chéo ngược lên điểm xuất phát khép kín."
            ],
            "common_mistakes": "Vẽ 2 hình tròn rời rạc chồng lên nhau thay vì viết một nét liền lượn sóng liên tục.",
            "parent_tip": "Cho bé quan sát hình dáng số 8 giống đôi cánh chú bướm xinh đẹp."
        },
        {
            "num": 9, "card_id": 79, "word": "số chín",
            "item_name": "chú ong mật", "unit": "chú",
            "single_xref": None,
            "strokes": 1,
            "writing_steps": [
                "Nét 1: Nét liền gồm một nét cong kín ở trên (đường kẻ 2 lên 3) nối liền nét cong lượn xuống dòng kẻ 1 rồi vòng sang trái."
            ],
            "common_mistakes": "Đầu số 9 không khép kín hoặc móc dưới uốn cong ngược chiều sang phải.",
            "parent_tip": "Đố con so sánh số 6 và số 9: 'Số 9 lộn ngược lại sẽ thành số mấy nhỉ?'."
        },
        {
            "num": 10, "card_id": 80, "word": "số mười",
            "item_name": "chú kiến cần cù", "unit": "chú",
            "single_xref": None,
            "strokes": 3,
            "writing_steps": [
                "Số 10 gồm 2 chữ số: chữ số 1 đứng trước và chữ số 0 đứng sau.",
                "Viết số 1 trước (2 nét, cao 2 ô ly).",
                "Cách một khoảng nửa ô ly, viết chữ số 0 (nét cong kín hình bầu dục, cao 2 ô ly)."
            ],
            "common_mistakes": "Khoảng cách giữa số 1 và số 0 quá xa hoặc quá dính nhau; số 0 bị méo.",
            "parent_tip": "Hai bàn tay bé có tất cả 10 ngón. 'Gộp 5 ngón tay phải và 5 ngón tay trái được 10 ngón tay!'."
        }
    ]

    all_data = []

    for item in number_meta:
        num = item["num"]
        card_id = item["card_id"]
        front_page_idx = 124 + (num - 1) * 2
        back_page_idx = front_page_idx + 1

        front_page = doc[front_page_idx]
        back_page = doc[back_page_idx]

        # 1. Che sạch mã QR bên thứ 3 ở góc dưới bên trái mặt trước
        qr_clean_rect = fitz.Rect(0, 425, 125, 538)
        front_page.draw_rect(qr_clean_rect, color=(1, 1, 1), fill=(1, 1, 1))

        # 2. Render thẻ nguyên bản sạch (200 DPI cho sắc nét)
        front_card_file = f"card_{card_id}_front.png"
        back_card_file = f"card_{card_id}_back.png"
        front_card_path = os.path.join(cards_dir, front_card_file)
        back_card_path = os.path.join(cards_dir, back_card_file)

        front_pix = front_page.get_pixmap(dpi=200)
        front_pix.save(front_card_path)

        back_pix = back_page.get_pixmap(dpi=200)
        back_pix.save(back_card_path)

        # 3. Cắt tranh minh họa đếm số (vùng elip)
        ellipse_rect = fitz.Rect(305, 10, 732, 260)
        illu_file = f"illu_so_{num}.png"
        illu_path = os.path.join(illu_dir, illu_file)
        illu_pix = front_page.get_pixmap(clip=ellipse_rect, dpi=200)
        illu_pix.save(illu_path)

        # 4. Cắt khung hướng dẫn viết nét số
        writing_rect = fitz.Rect(555, 335, 765, 538)
        writing_file = f"writing_so_{num}.png"
        writing_path = os.path.join(writing_dir, writing_file)
        writing_pix = front_page.get_pixmap(clip=writing_rect, dpi=200)
        writing_pix.save(writing_path)

        # 5. Trích xuất con vật đơn lẻ phục vụ mini-game
        animal_file = f"animal_so_{num}.jpeg"
        animal_path = os.path.join(animals_dir, animal_file)
        found_animal = False
        target_xref = item.get("single_xref")

        if target_xref:
            bimg = doc.extract_image(target_xref)
            with open(animal_path, "wb") as f:
                f.write(bimg["image"])
            found_animal = True
        else:
            for img_info in front_page.get_images():
                xref = img_info[0]
                base_img = doc.extract_image(xref)
                w, h = base_img["width"], base_img["height"]
                # Ảnh con vật đơn thường có kích thước từ 100 đến 300px, không phải QR (200x200 png) hay chấm tròn (11x11)
                if w > 80 and h > 80 and not (w == 200 and h == 200 and base_img["ext"] == "png"):
                    with open(animal_path, "wb") as f:
                        f.write(base_img["image"])
                    found_animal = True
                    break

        # 6. Tạo danh sách tất cả các cặp tách - gộp số (Bonds)
        all_bonds = []
        for a in range(0, num + 1):
            b = num - a
            all_bonds.append({
                "part_a": a,
                "part_b": b,
                "total": num,
                "split_sentence": f"{num} gồm {a} và {b}",
                "combine_sentence": f"gộp {a} và {b} được {num}"
            })

        sample_part_a = 1
        sample_part_b = num - 1 if num > 1 else 0

        card_entry = {
            "id": num,
            "card_id": card_id,
            "number": num,
            "word": item["word"],
            "item_name": item["item_name"],
            "unit": item["unit"],
            "count": num,
            "sample_bond": {
                "total": num,
                "part_a": sample_part_a,
                "part_b": sample_part_b,
                "dot_representation": {
                    "total": num,
                    "part_a": sample_part_a,
                    "part_b": sample_part_b
                },
                "sentences": [
                    f"{num} gồm {sample_part_a} và {sample_part_b}",
                    f"gộp {sample_part_a} và {sample_part_b} được {num}"
                ]
            },
            "all_bonds": all_bonds,
            "writing_guide": {
                "stroke_count": item["strokes"],
                "steps": item["writing_steps"],
                "common_mistakes": item["common_mistakes"],
                "image_url": f"assets/writing_guides/{writing_file}"
            },
            "parent_tips": {
                "prompt_question": f"Đố con {num} gồm mấy và mấy?",
                "daily_activity": item["parent_tip"]
            },
            "assets": {
                "card_front": f"assets/cards/{front_card_file}",
                "card_back": f"assets/cards/{back_card_file}",
                "illustration": f"assets/illustrations/{illu_file}",
                "writing_guide": f"assets/writing_guides/{writing_file}",
                "single_animal": f"assets/animals/{animal_file}" if found_animal else None
            }
        }
        all_data.append(card_entry)

    # Lưu dữ liệu JSON tổng hợp
    json_path = os.path.join(base_out, "numbers_data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"Bóc tách thành công toàn bộ dữ liệu cho 10 số (Thẻ 71 - 80).")
    print(f"Dữ liệu JSON lưu tại: {json_path}")
    print(f"Tổng số ảnh thẻ: {len(os.listdir(cards_dir))}")
    print(f"Tổng số tranh đếm: {len(os.listdir(illu_dir))}")
    print(f"Tổng số hướng dẫn viết: {len(os.listdir(writing_dir))}")
    print(f"Tổng số con vật đơn: {len(os.listdir(animals_dir))}")

if __name__ == "__main__":
    extract_module_numbers()
