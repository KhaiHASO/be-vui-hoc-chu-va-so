import os
import json
import re
import fitz
import requests
from PIL import Image

def download_audio(url, target_path):
    if os.path.exists(target_path) and os.path.getsize(target_path) > 1000:
        return True
    try:
        headers = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)"}
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code == 200 and len(r.content) > 1000:
            with open(target_path, "wb") as f:
                f.write(r.content)
            return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
    return False

def clean_and_render_card(doc, page_idx, out_path, is_front=True):
    # Open page fresh
    page = doc[page_idx]
    if is_front:
        # Detect QR codes (approx 180-240px square, in lower area y > 350)
        for img_info in page.get_image_info(xrefs=True):
            w, h = img_info["width"], img_info["height"]
            bbox = img_info["bbox"]
            if (180 <= w <= 240 and 180 <= h <= 240) and bbox[1] > 350:
                # Cover QR code and labels with clean white rect
                clean_rect = fitz.Rect(bbox[0] - 8, bbox[1] - 8, bbox[2] + 8, bbox[3] + 40)
                page.draw_rect(clean_rect, color=(1, 1, 1), fill=(1, 1, 1))
                
        # Also cover bottom right page footer if it has third-party text
        footer_rect = fitz.Rect(320, 490, 720, 538)
        page.draw_rect(footer_rect, color=(1, 1, 1), fill=(1, 1, 1))

    pix = page.get_pixmap(dpi=200)
    pix.save(out_path)

def extract_all():
    pdf_path = "BỘ THẺ.pdf"
    doc = fitz.open(pdf_path)

    # 1. Paths setup
    base_letters = "public/data/module_letters"
    cards_letters_dir = os.path.join(base_letters, "cards")
    writing_dir = os.path.join(base_letters, "writing_guides")
    illu_dir = os.path.join(base_letters, "illustrations")
    audio_letters_dir = "public/audio/module_letters"

    base_strokes = "public/data/module_strokes"
    cards_strokes_dir = os.path.join(base_strokes, "cards")
    audio_strokes_dir = "public/audio/module_strokes"

    base_digraphs = "public/data/module_digraphs"
    cards_digraphs_dir = os.path.join(base_digraphs, "cards")
    audio_digraphs_dir = "public/audio/module_digraphs"

    for d in [cards_letters_dir, writing_dir, illu_dir, audio_letters_dir,
              cards_strokes_dir, audio_strokes_dir, cards_digraphs_dir, audio_digraphs_dir]:
        os.makedirs(d, exist_ok=True)

    with open("scripts/qr_cache_letters.json", "r", encoding="utf-8") as f:
        qr_letters = json.load(f)
    with open("scripts/qr_cache_strokes.json", "r", encoding="utf-8") as f:
        qr_strokes = json.load(f)
    with open("scripts/qr_cache_digraphs.json", "r", encoding="utf-8") as f:
        qr_digraphs = json.load(f)

    # --- 2. EXTRACT 29 LETTERS (Cards 12 to 40) ---
    print("\n--- EXTRACTING 29 LETTERS ---")
    letters_meta = [
        {"id": 12, "letter": "A", "slug": "a", "type": "vowel", "illu_word": "la",
         "stroke_count": 2,
         "writing_steps": [
             "Nét 1: Nét cong kín cao 2 ô ly, rộng 1.5 ô ly, đặt bút dưới đường kẻ 3, lia bút sang trái viết nét cong kín.",
             "Nét 2: Lia bút lên đường kẻ 3, viết nét móc ngược sát vào nét cong kín, dừng bút ở đường kẻ 2."
         ],
         "mouth_shape": "Miệng mở rộng tự nhiên, hàm dưới hơi hạ, luồng hơi thoát đều từ cuống họng.",
         "vowel_words": ["cá", "nhà", "bà", "ngã", "đá", "lá"],
         "parent_tip": "Cho bé mở to miệng phát âm 'A - A - A' như khi đi khám bác sĩ, tìm các đồ vật quanh nhà có âm A như: cái ca, quả na, con cá."
        },
        {"id": 13, "letter": "Ă", "slug": "aw", "type": "vowel", "illu_word": "ăn",
         "stroke_count": 3,
         "writing_steps": [
             "Nét 1: Nét cong kín cao 2 ô ly.",
             "Nét 2: Nét móc ngược cao 2 ô ly dừng bút ở đường kẻ 2.",
             "Nét 3: Nét cong dưới nhỏ (dấu á) đặt cân đối phía trên đầu chữ a, dưới đường kẻ 4."
         ],
         "mouth_shape": "Miệng mở hơi hẹp hơn âm A một chút, phát âm ngắn, dứt khoát: 'Ă'.",
         "vowel_words": ["khăn", "ăn", "mắt", "nằm", "rắn", "lặn"],
         "parent_tip": "Nhắc con: chữ Ă giống chữ A đội một chiếc thuyền cong nhỏ xinh xắn trên đầu."
        },
        {"id": 14, "letter": "Â", "slug": "aa", "type": "vowel", "illu_word": "ấm",
         "stroke_count": 3,
         "writing_steps": [
             "Nét 1: Nét cong kín cao 2 ô ly.",
             "Nét 2: Nét móc ngược cao 2 ô ly dừng ở đường kẻ 2.",
             "Nét 3: Dấu nón (gồm nét xiên trái và xiên phải ngắn nhọn) đặt cân đối trên đầu chữ a."
         ],
         "mouth_shape": "Miệng mở vừa, hai môi hơi tròn nhẹ, luồng hơi phát âm gọn: 'Â'.",
         "vowel_words": ["phấn", "cấm", "ấm", "nhẫn", "nấm", "cân"],
         "parent_tip": "Chữ Â giống như bạn A đang đội chiếc nón lá che nắng mưa!"
        },
        {"id": 15, "letter": "B", "slug": "b", "type": "consonant", "illu_word": "bà",
         "stroke_count": 1,
         "writing_steps": [
             "Nét 1: Nét liền kết hợp nét khuyết trên và nét thắt trên cao 5 ô ly, uốn lượn thắt nhỏ ở đường kẻ 3 rồi dừng bút."
         ],
         "mouth_shape": "Hai môi mím chặt nhẹ chặn luồng hơi, sau đó mở bật môi phát âm 'bờ' trầm ấm.",
         "vowels": ["a", "o", "ô", "ơ", "e", "ê", "i", "u", "ư"],
         "phrases": ["bà ba", "bò bê", "bề bề", "bế bé"],
         "parent_tip": "Cho bé sờ nhẹ lên môi khi phát âm 'bờ' để cảm nhận hai môi mím lại rồi mở bật ra."
        },
        {"id": 16, "letter": "C", "slug": "c", "type": "consonant", "illu_word": "cá",
         "stroke_count": 1,
         "writing_steps": [
             "Nét 1: Đặt bút dưới đường kẻ 3 một chút, viết nét cong hở phải cao 2 ô ly, dừng bút ở giữa đường kẻ 1 và 2."
         ],
         "mouth_shape": "Cuống lưỡi nâng lên chạm ngạc mềm chặn hơi, bật nhẹ âm 'cờ'.",
         "vowels": ["a", "o", "ô", "ơ", "u", "ư"],
         "phrases": ["cô giáo", "lọ cà", "con công", "cà tím"],
         "parent_tip": "Chữ C chỉ đi với a, o, ô, ơ, u, ư; không đi với e, ê, i (khi đó phải dùng chữ K)."
        },
        {"id": 17, "letter": "D", "slug": "d", "type": "consonant", "illu_word": "dê",
         "stroke_count": 2,
         "writing_steps": [
             "Nét 1: Nét cong kín cao 2 ô ly.",
             "Nét 2: Từ đường kẻ 5 kéo nét móc ngược dài 4 ô ly sát nét cong kín, dừng bút ở đường kẻ 2."
         ],
         "mouth_shape": "Đầu lưỡi chạm vào chân răng hàm trên, bật luồng hơi ra tạo âm 'dờ'.",
         "vowels": ["a", "o", "ô", "ơ", "e", "ê", "i", "u", "ư"],
         "phrases": ["da dẻ", "dễ dãi", "dế mèn", "du mục"],
         "parent_tip": "Phân biệt D và Đ: Chữ D chưa có que gạch ngang, đọc là 'dờ' như con dê."
        },
        {"id": 18, "letter": "Đ", "slug": "dd", "type": "consonant", "illu_word": "đỗ",
         "stroke_count": 3,
         "writing_steps": [
             "Nét 1: Nét cong kín cao 2 ô ly.",
             "Nét 2: Nét móc ngược dài 4 ô ly từ đường kẻ 5.",
             "Nét 3: Nét gạch ngang ngắn ở đường kẻ 4 cắt ngang thân nét móc."
         ],
         "mouth_shape": "Đầu lưỡi áp sát chặt chân răng hàm trên, bật dứt khoát âm 'đờ'.",
         "vowels": ["a", "o", "ô", "ơ", "e", "ê", "i", "u", "ư"],
         "phrases": ["đi bộ", "đò đầy", "đu đủ", "đỏ đắn"],
         "parent_tip": "Chữ Đ giống chữ D nhưng có thêm chiếc thắt lưng ngang bụng ở đường kẻ 4."
        },
        {"id": 19, "letter": "E", "slug": "e", "type": "vowel", "illu_word": "be",
         "stroke_count": 1,
         "writing_steps": [
             "Nét 1: Đặt bút trên đường kẻ 1, viết nét xiên lượn cong sang phải lên đường kẻ 3 rồi uốn cong hở phải xuống đường kẻ 1, cao 2 ô ly."
         ],
         "mouth_shape": "Miệng bẹt sang hai bên, khóe môi kéo nhẹ sang hai tai, lưỡi nâng nhẹ: 'E'.",
         "vowel_words": ["mẹ", "nghe", "me", "vẽ", "tre", "bé"],
         "parent_tip": "Cho bé nhoẻn miệng cười thật tươi khi phát âm âm E!"
        },
        {"id": 20, "letter": "Ê", "slug": "ee", "type": "vowel", "illu_word": "bê",
         "stroke_count": 2,
         "writing_steps": [
             "Nét 1: Viết chữ e cao 2 ô ly.",
             "Nét 2: Lia bút lên trên đường kẻ 3, viết dấu nón cân đối đỉnh nón nhọn."
         ],
         "mouth_shape": "Miệng mở hơi hẹp hơn âm E, luồng hơi dồn về phía vòm họng: 'Ê'.",
         "vowel_words": ["lê", "bê", "bế", "nhện", "nến", "nệm"],
         "parent_tip": "Chữ Ê chính là chữ E được đội chiếc nón xinh xắn."
        },
        {"id": 21, "letter": "G", "slug": "g", "type": "consonant", "illu_word": "gà",
         "stroke_count": 2,
         "writing_steps": [
             "Nét 1: Nét cong kín cao 2 ô ly.",
             "Nét 2: Nét khuyết dưới kéo từ đường kẻ 3 xuống dưới dòng kẻ 1 sâu 3 ô ly (tổng cao 5 ô ly), dừng bút ở đường kẻ 2."
         ],
         "mouth_shape": "Cuống lưỡi chạm ngạc mềm, hạ cuống lưỡi xuống tạo âm xát thanh quản 'gờ'.",
         "vowels": ["a", "o", "ô", "ơ", "u", "ư"],
         "phrases": ["gà con", "cửa gỗ", "ổ gà", "gấu trúc"],
         "parent_tip": "Chữ G có cái bụng tròn và chiếc đuôi khuyết dài thon thả như đuôi gà."
        },
        {"id": 22, "letter": "H", "slug": "h", "type": "consonant", "illu_word": "hổ",
         "stroke_count": 2,
         "writing_steps": [
             "Nét 1: Nét khuyết trên cao 5 ô ly, dừng bút ở dòng kẻ 1.",
             "Nét 2: Rê bút lên gần đường kẻ 2, viết nét móc hai đầu cao 2 ô ly, dừng bút ở đường kẻ 2."
         ],
         "mouth_shape": "Miệng mở tự nhiên, luồng hơi đi nhẹ nhàng qua thanh môn tạo âm 'hờ'.",
         "vowels": ["a", "o", "ô", "ơ", "e", "ê", "i", "u", "ư"],
         "phrases": ["hoa hồng", "hồ hởi", "hạ hồi", "hú hí"],
         "parent_tip": "Lưu ý bé viết nét khuyết trên thẳng lưng, không bị gù hay cong vẹo."
        },
        {"id": 23, "letter": "I", "slug": "i", "type": "vowel", "illu_word": "bí",
         "stroke_count": 2,
         "writing_steps": [
             "Nét 1: Nét hất từ đường kẻ 2 lên đường kẻ 3.",
             "Nét 2: Kéo thẳng xuống dòng kẻ 1 rồi uốn móc ngược lên đường kẻ 2; chấm một chấm nhỏ trên đầu."
         ],
         "mouth_shape": "Khóe miệng bè sang hai bên, mặt lưỡi nâng cao gần chạm ngạc cứng: 'I'.",
         "vowel_words": ["bi", "chỉ", "đi", "mì", "ca sĩ", "bí đỏ"],
         "parent_tip": "Chữ I ngắn có chấm nhỏ xinh trên đầu, phát âm trong trẻo như tiếng chim hót."
        },
        {"id": 24, "letter": "K", "slug": "k", "type": "consonant", "illu_word": "kem",
         "stroke_count": 2,
         "writing_steps": [
             "Nét 1: Nét khuyết trên cao 5 ô ly.",
             "Nét 2: Nét thắt giữa cao 2 ô ly, tạo vòng thắt tròn nhỏ ở giữa đường kẻ 2 rồi móc ngược ra đường kẻ 2."
         ],
         "mouth_shape": "Cuống lưỡi nâng cao chạm vòm họng mềm, phát âm 'cờ' (viết là K khi đi với e, ê, i, y).",
         "vowels": ["e", "ê", "i", "y"],
         "phrases": ["kì cọ", "kệ gỗ", "kẻ ô", "kì đà"],
         "parent_tip": "Quy tắc chính tả: K luôn luôn đi với e, ê, i, y (như que kem, cái kệ, cây kim)."
        },
        {"id": 25, "letter": "L", "slug": "l", "type": "consonant", "illu_word": "lê",
         "stroke_count": 1,
         "writing_steps": [
             "Nét 1: Đặt bút ở đường kẻ 2, viết nét khuyết trên cao 5 ô ly, uốn chân mở rộng tạo nét móc ngược dừng ở đường kẻ 2."
         ],
         "mouth_shape": "Đầu lưỡi cong lên chạm vòm lợi trên, luồng hơi thoát ra hai bên tạo âm rung 'lờ'.",
         "vowels": ["a", "o", "ô", "ơ", "e", "ê", "i", "u", "ư"],
         "phrases": ["lá lốt", "lo lắng", "lũy tre", "lễ hội"],
         "parent_tip": "Rèn cho bé uốn đầu lưỡi lên chạm vòm họng để không bị ngọng giữa L và N."
        },
        {"id": 26, "letter": "M", "slug": "m", "type": "consonant", "illu_word": "me",
         "stroke_count": 3,
         "writing_steps": [
             "Nét 1: Nét móc xuôi cao 2 ô ly.",
             "Nét 2: Rê bút lên đường kẻ 2, viết nét móc xuôi thứ hai rộng 1.5 ô ly.",
             "Nét 3: Nét móc hai đầu cao 2 ô ly, dừng bút ở đường kẻ 2."
         ],
         "mouth_shape": "Hai môi khép kín lại, luồng hơi thoát lên khoang mũi tạo âm vang 'mờ'.",
         "vowels": ["a", "o", "ô", "ơ", "e", "ê", "i", "u", "ư"],
         "phrases": ["mẹ bế", "mơ màng", "mùa màng", "mỡ màng"],
         "parent_tip": "Chữ M có 3 cái chân (3 nét móc), giống như ba ngọn đồi nhỏ nhấp nhô."
        },
        {"id": 27, "letter": "N", "slug": "n", "type": "consonant", "illu_word": "nơ",
         "stroke_count": 2,
         "writing_steps": [
             "Nét 1: Nét móc xuôi cao 2 ô ly, dừng ở dòng kẻ 1.",
             "Nét 2: Rê bút lên đường kẻ 2, viết nét móc hai đầu rộng 1.5 ô ly, dừng ở đường kẻ 2."
         ],
         "mouth_shape": "Đầu lưỡi áp sát vòm lợi phía trên chặn hơi, luồng hơi thoát qua mũi: 'nờ'.",
         "vowels": ["a", "o", "ô", "ơ", "e", "ê", "i", "u", "ư"],
         "phrases": ["nụ cười", "nơ đỏ", "nắng nôi", "nô đùa"],
         "parent_tip": "Chữ N có 2 chân nét móc, đọc thẳng lưỡi không cong môi."
        },
        {"id": 28, "letter": "O", "slug": "o", "type": "vowel", "illu_word": "co",
         "stroke_count": 1,
         "writing_steps": [
             "Nét 1: Đặt bút dưới đường kẻ 3, lia bút sang trái viết nét cong kín tròn đều cao 2 ô ly rộng 1.5 ô ly."
         ],
         "mouth_shape": "Hai môi mở tròn to tự nhiên như quả trứng gà, luồng hơi thoát đều: 'O'.",
         "vowel_words": ["ong", "võng", "cõng", "nóng", "bóng", "bò"],
         "parent_tip": "Câu vè kinh điển: 'O tròn như quả trứng gà - Ô thì đội mũ - Ơ thì có râu'!"
        },
        {"id": 29, "letter": "Ô", "slug": "oo", "type": "vowel", "illu_word": "cô",
         "stroke_count": 2,
         "writing_steps": [
             "Nét 1: Viết chữ o tròn đều cao 2 ô ly.",
             "Nét 2: Lia bút lên trên đường kẻ 3, viết dấu nón cân đối ở giữa đỉnh đầu."
         ],
         "mouth_shape": "Hai môi chúm tròn nhỏ hơn âm O, hơi nhô về phía trước: 'Ô'.",
         "vowel_words": ["cô", "ô tô", "ông", "hồ", "cổng", "cổ"],
         "parent_tip": "Chữ O đội thêm chiếc mũ nón lá xinh xắn thành chữ Ô."
        },
        {"id": 30, "letter": "Ơ", "slug": "ow", "type": "vowel", "illu_word": "bơ",
         "stroke_count": 2,
         "writing_steps": [
             "Nét 1: Viết chữ o cao 2 ô ly.",
             "Nét 2: Đặt bút trên đường kẻ 3 góc trên bên phải, viết nét râu cong nhỏ nhắn."
         ],
         "mouth_shape": "Môi mở dẹt tự nhiên không chúm tròn, hàm dưới hơi đưa ra: 'Ơ'.",
         "vowel_words": ["vở", "bơ", "cờ", "thở", "nơ", "mơ"],
         "parent_tip": "Chữ O có thêm chiếc râu mép bên phải sẽ biến thành chữ Ơ."
        },
        {"id": 31, "letter": "P", "slug": "p", "type": "consonant", "illu_word": "pin",
         "stroke_count": 2,
         "writing_steps": [
             "Nét 1: Nét hất từ đường kẻ 2 lên đường kẻ 3, rồi kéo thẳng đứng xuống dưới dòng kẻ 1 sâu 2 ô ly (tổng cao 4 ô ly).",
             "Nét 2: Rê bút lên đường kẻ 2, viết nét móc hai đầu dừng ở đường kẻ 2."
         ],
         "mouth_shape": "Hai môi mím chặt chặn hơi rồi bật luồng hơi mạnh ra ngoài tạo âm 'pờ'.",
         "vowels": ["a", "o", "ô", "ơ", "e", "ê", "i", "u", "ư"],
         "phrases": ["pa nô", "đèn pin", "pi a nô", "pa tê"],
         "parent_tip": "Chữ P thường kết hợp với H để tạo thành PH (như bát phở, bông hoa phượng)."
        },
        {"id": 32, "letter": "Q", "slug": "q", "type": "consonant", "illu_word": "quà",
         "stroke_count": 2,
         "writing_steps": [
             "Nét 1: Nét cong kín cao 2 ô ly.",
             "Nét 2: Lia bút lên đường kẻ 3, kéo nét thẳng đứng sát nét cong xuống dưới đường kẻ 1 sâu 2 ô ly (tổng cao 4 ô ly)."
         ],
         "mouth_shape": "Môi chúm lại, chữ Q luôn đi liền với chữ U tạo thành cụm 'quờ'.",
         "vowels": ["a", "e", "ê", "i", "o"],
         "phrases": ["quê hương", "quả ngọt", "quần áo", "quạt mát"],
         "parent_tip": "Chữ Q luôn luôn có bạn thân U đi cùng, tạo thành 'qu' như món quà, quê hương."
        },
        {"id": 33, "letter": "R", "slug": "r", "type": "consonant", "illu_word": "rổ",
         "stroke_count": 1,
         "writing_steps": [
             "Nét 1: Đặt bút ở dòng kẻ 1, viết nét xiên phải lên quá đường kẻ 3, thắt xoắn nhỏ rồi đưa ngang sang phải, uốn cong kéo móc ngược xuống dòng kẻ 1 dừng ở đường kẻ 2."
         ],
         "mouth_shape": "Đầu lưỡi cong lên chạm sát ngạc cứng, luồng hơi làm rung nhẹ đầu lưỡi tạo âm rung 'rờ'.",
         "vowels": ["a", "o", "ô", "ơ", "e", "ê", "i", "u", "ư"],
         "phrases": ["ra vào", "rổ rá", "rủ rỉ", "rực rỡ"],
         "parent_tip": "Hướng dẫn con rung nhẹ đầu lưỡi khi phát âm 'rờ' như tiếng gầm chú hổ con."
        },
        {"id": 34, "letter": "S", "slug": "s", "type": "consonant", "illu_word": "sâu",
         "stroke_count": 1,
         "writing_steps": [
             "Nét 1: Đặt bút trên đường kẻ 1, viết nét xiên lên quá đường kẻ 3, tạo thắt nhỏ ở đỉnh rồi uốn nét cong hở trái xuống đường kẻ 1 lượn vào trong."
         ],
         "mouth_shape": "Mặt lưỡi uốn cong về phía sau ngạc cứng, luồng hơi ma sát thoát qua khe lưỡi tạo âm xát 'sờ' nặng.",
         "vowels": ["a", "o", "ô", "ơ", "e", "ê", "i", "u", "ư"],
         "phrases": ["sứ sở", "su su", "sen hồng", "sóng biếc"],
         "parent_tip": "Phân biệt S (sờ cong, sờ nặng - uốn lưỡi) và X (xờ xe - lưỡi thẳng nhẹ)."
        },
        {"id": 35, "letter": "T", "slug": "t", "type": "consonant", "illu_word": "táo",
         "stroke_count": 3,
         "writing_steps": [
             "Nét 1: Nét hất từ đường kẻ 2 lên đường kẻ 3.",
             "Nét 2: Lia bút lên đường kẻ 4, kéo thẳng đứng xuống dòng kẻ 1 rồi uốn móc ngược lên đường kẻ 2 (cao 3 ô ly).",
             "Nét 3: Nét gạch ngang ngắn trên đường kẻ 3."
         ],
         "mouth_shape": "Đầu lưỡi chạm chặt vào mặt sau của răng hàm trên, bật mạnh luồng hơi tạo âm 'tờ'.",
         "vowels": ["a", "o", "ô", "ơ", "e", "ê", "i", "u", "ư"],
         "phrases": ["tổ chim", "tà áo", "tủ kính", "tươi tốt"],
         "parent_tip": "Chữ T cao 3 ô ly, có chiếc tay dang ngang ở đường kẻ 3."
        },
        {"id": 36, "letter": "U", "slug": "u", "type": "vowel", "illu_word": "tủ",
         "stroke_count": 2,
         "writing_steps": [
             "Nét 1: Nét hất từ đường kẻ 2 lên đường kẻ 3 kết hợp nét móc ngược to rộng 1.5 ô ly.",
             "Nét 2: Lia bút lên đường kẻ 3, viết nét móc ngược thứ hai rộng 1 ô ly, dừng ở đường kẻ 2 (cao 2 ô ly)."
         ],
         "mouth_shape": "Môi chúm tròn nhỏ nhô ra phía trước nhiều nhất, cuống lưỡi nâng cao: 'U'.",
         "vowel_words": ["lúa", "lu", "cú", "ru", "su su", "nụ"],
         "parent_tip": "Chữ U giống như một chiếc thuyền buồm êm ả lướt sóng."
        },
        {"id": 37, "letter": "Ư", "slug": "uw", "type": "vowel", "illu_word": "củ từ",
         "stroke_count": 3,
         "writing_steps": [
             "Nét 1: Viết chữ u cao 2 ô ly.",
             "Nét 2: Đặt bút trên đường kẻ 3 góc trên bên phải, viết nét râu móc nhỏ nhắn."
         ],
         "mouth_shape": "Môi mở dẹt tự nhiên không chúm, hàm dưới hơi đưa ra nhẹ, phát âm 'Ư'.",
         "vowel_words": ["mực", "gừng", "sư tử", "thư", "trứng", "lưng"],
         "parent_tip": "Chữ U có thêm nét râu móc xinh xắn bên phải sẽ biến thành chữ Ư."
        },
        {"id": 38, "letter": "V", "slug": "v", "type": "consonant", "illu_word": "vẽ",
         "stroke_count": 1,
         "writing_steps": [
             "Nét 1: Đặt bút ở đường kẻ 2, viết nét móc hai đầu uốn lượn xuống đường kẻ 1 rồi vòng lên đường kẻ 3, tạo thắt nhỏ dừng ở đường kẻ 3."
         ],
         "mouth_shape": "Răng cửa hàm trên chạm nhẹ vào môi dưới, luồng hơi xát qua khe hở tạo âm 'vờ'.",
         "vowels": ["a", "o", "ô", "ơ", "e", "ê", "i", "u", "ư"],
         "phrases": ["vở vẽ", "vỏ sò", "vui vẻ", "vé xe"],
         "parent_tip": "Cho bé quan sát răng trên chạm khẽ vào môi dưới khi phát âm 'vờ'."
        },
        {"id": 39, "letter": "X", "slug": "x", "type": "consonant", "illu_word": "xe",
         "stroke_count": 2,
         "writing_steps": [
             "Nét 1: Nét cong hở trái cao 2 ô ly.",
             "Nét 2: Nét cong hở phải cao 2 ô ly tựa lưng vào nét cong thứ nhất."
         ],
         "mouth_shape": "Đầu lưỡi duỗi thẳng đặt gần chân răng hàm dưới, luồng hơi ma sát nhẹ thoát ra tạo âm 'xờ' nhẹ.",
         "vowels": ["a", "o", "ô", "ơ", "e", "ê", "i", "u", "ư"],
         "phrases": ["xe lu", "xù xì", "xứ sở", "lì xì"],
         "parent_tip": "Chữ X giống như hai bạn cong đang tựa lưng vào nhau cùng ngắm sao trời."
        },
        {"id": 40, "letter": "Y", "slug": "y", "type": "vowel", "illu_word": "y tá",
         "stroke_count": 3,
         "writing_steps": [
             "Nét 1: Nét hất từ đường kẻ 2 lên đường kẻ 3 kết hợp nét móc ngược to.",
             "Nét 2: Lia bút lên đường kẻ 3, viết nét khuyết dưới dài 5 ô ly kéo sâu xuống dưới đường kẻ 1 ba ô ly, dừng ở đường kẻ 2."
         ],
         "mouth_shape": "Miệng bè nhẹ sang hai bên tương tự âm I, phát âm 'i dài'.",
         "vowel_words": ["y sĩ", "kỵ sĩ", "vật lý", "y tá", "yếm", "yên xe"],
         "parent_tip": "Chữ Y dài có đuôi khuyết dài 5 ô ly, khác chữ I ngắn chỉ cao 2 ô ly."
        }
    ]

    all_letters_data = []

    # Tone marks standard list
    tone_marks = [
        {"name": "không dấu", "symbol": "", "example": "ba"},
        {"name": "huyền", "symbol": " ` ", "example": "bà"},
        {"name": "sắc", "symbol": " ´ ", "example": "bá"},
        {"name": "hỏi", "symbol": " ̉ ", "example": "bả"},
        {"name": "ngã", "symbol": " ~ ", "example": "bã"},
        {"name": "nặng", "symbol": " . ", "example": "bạ"}
    ]

    for item in letters_meta:
        cid = item["id"]
        slug = item["slug"]
        letter = item["letter"]
        p_front_idx = (cid - 1) * 2
        p_back_idx = p_front_idx + 1

        front_card_file = f"card_{cid}_front.png"
        back_card_file = f"card_{cid}_back.png"
        front_card_path = os.path.join(cards_letters_dir, front_card_file)
        back_card_path = os.path.join(cards_letters_dir, back_card_file)

        # Clean QR and render cards
        clean_and_render_card(doc, p_front_idx, front_card_path, is_front=True)
        clean_and_render_card(doc, p_back_idx, back_card_path, is_front=False)

        # Crop writing guide
        front_page = doc[p_front_idx]
        writing_rect = fitz.Rect(350, 15, 755, 420)
        writing_file = f"writing_chu_{slug}.png"
        writing_path = os.path.join(writing_dir, writing_file)
        writing_pix = front_page.get_pixmap(clip=writing_rect, dpi=250)
        writing_pix.save(writing_path)

        # Crop illustration
        illu_rect = fitz.Rect(20, 220, 335, 475)
        illu_file = f"illu_chu_{slug}.png"
        illu_path = os.path.join(illu_dir, illu_file)
        illu_pix = front_page.get_pixmap(clip=illu_rect, dpi=200)
        illu_pix.save(illu_path)

        # Download audio from cache
        qr_info = qr_letters.get(str(cid), {})
        audio_url = qr_info.get("audio_url")
        audio_local_file = f"chu_{slug}.m4a"
        audio_local_path = os.path.join(audio_letters_dir, audio_local_file)
        if audio_url:
            download_audio(audio_url, audio_local_path)

        # Build phonics matrix for back
        back_matrix = {}
        if item["type"] == "consonant":
            # Build 6 tones combinations for each vowel
            for v in item.get("vowels", []):
                # Standard tone mark rules for grade 1
                base = letter.lower() + v
                # Tone combinations lookup dictionary or generator
                tones_words = generate_tones_for_syllable(letter.lower(), v)
                back_matrix[v] = tones_words

        card_entry = {
            "id": cid,
            "card_id": cid,
            "letter": letter,
            "name": f"Chữ {letter}",
            "slug": slug,
            "type": item["type"],
            "illu_word": item["illu_word"],
            "stroke_count": item["stroke_count"],
            "writing_steps": item["writing_steps"],
            "mouth_shape": item["mouth_shape"],
            "parent_tip": item["parent_tip"],
            "forms": {
                "upper_print": letter.upper(),
                "lower_print": letter.lower(),
                "upper_cursive": letter.upper(),
                "lower_cursive": letter.lower()
            },
            "back_content": {
                "type": item["type"],
                "vowel_words": item.get("vowel_words", []),
                "compatible_vowels": item.get("vowels", []),
                "phonics_matrix": back_matrix,
                "phrases": item.get("phrases", [])
            },
            "audio_url": f"/audio/module_letters/{audio_local_file}",
            "video_url": qr_info.get("video_url"),
            "assets": {
                "card_front": f"/data/module_letters/cards/{front_card_file}",
                "card_back": f"/data/module_letters/cards/{back_card_file}",
                "writing_guide": f"/data/module_letters/writing_guides/{writing_file}",
                "illustration": f"/data/module_letters/illustrations/{illu_file}"
            }
        }
        all_letters_data.append(card_entry)
        print(f"Processed Letter {letter} (Card {cid})")

    with open("public/data/module_letters/letters_data.json", "w", encoding="utf-8") as f:
        json.dump(all_letters_data, f, ensure_ascii=False, indent=2)

    # --- 3. EXTRACT 11 STROKES (Cards 1 to 11) ---
    print("\n--- EXTRACTING 11 STROKES ---")
    strokes_meta = [
        {"id": 1, "name": "Nét hất", "slug": "net-hat", "letters": ["i", "u", "ư", "t", "p"],
         "desc": "Đặt bút trên dòng kẻ 2, đưa nét xiên nhẹ lên góc trên dòng kẻ 3."},
        {"id": 2, "name": "Nét móc xuôi", "slug": "net-moc-xuoi", "letters": ["n", "m", "v"],
         "desc": "Đặt bút giữa ô ly, uốn cong lượn tròn chạm dòng kẻ 3 rồi kéo thẳng xuống dòng kẻ 1."},
        {"id": 3, "name": "Nét móc ngược", "slug": "net-moc-nguoc", "letters": ["i", "t", "u"],
         "desc": "Kéo thẳng từ trên xuống, chạm dòng kẻ 1 rồi uốn cong móc ngược lên dòng kẻ 2."},
        {"id": 4, "name": "Nét móc 2 đầu", "slug": "net-moc-2-dau", "letters": ["p", "n", "m"],
         "desc": "Kết hợp nét móc xuôi ở đầu và nét móc ngược ở cuối, tạo đường lượn mềm mại."},
        {"id": 5, "name": "Nét khuyết trên", "slug": "net-khuyet-tren", "letters": ["l", "b", "h", "k"],
         "desc": "Nét xiên lượn tròn qua đường kẻ 6, uốn khuyết rồi kéo thẳng đứng xuống dòng kẻ 1, cao 5 ô ly."},
        {"id": 6, "name": "Nét khuyết dưới", "slug": "net-khuyet-duoi", "letters": ["g", "y"],
         "desc": "Kéo thẳng đứng xuống dưới dòng kẻ 1 sâu 3 ô ly, uốn cong khuyết lượn lên dòng kẻ 2."},
        {"id": 7, "name": "Nét cong kín", "slug": "net-cong-kin", "letters": ["o", "ô", "ơ", "q", "a", "d", "đ"],
         "desc": "Nét cong tròn khép kín hoàn hảo cao 2 ô ly, rộng 1.5 ô ly."},
        {"id": 8, "name": "Nét cong hở phải", "slug": "net-cong-ho-phai", "letters": ["c", "x", "e", "ê"],
         "desc": "Lưng cong sang trái, mở rộng hở về phía bên phải, cao 2 ô ly."},
        {"id": 9, "name": "Nét cong hở trái", "slug": "net-cong-ho-trai", "letters": ["x"],
         "desc": "Lưng cong sang phải, mở rộng hở về phía bên trái, cao 2 ô ly."},
        {"id": 10, "name": "Nét thắt trên", "slug": "net-that-tren", "letters": ["v", "b", "r"],
         "desc": "Đưa bút lên chạm đường kẻ 3, tạo vòng thắt tròn nhỏ ở góc trên rồi lượn ngang."},
        {"id": 11, "name": "Nét thắt giữa", "slug": "net-that-giua", "letters": ["k"],
         "desc": "Đưa bút vào giữa thân chữ ở đường kẻ 2, tạo vòng xoắn thắt nhỏ rồi móc chân ra."}
    ]

    all_strokes_data = []
    for item in strokes_meta:
        cid = item["id"]
        slug = item["slug"]
        p_front_idx = (cid - 1) * 2
        p_back_idx = p_front_idx + 1

        front_file = f"card_stroke_{cid}_front.png"
        back_file = f"card_stroke_{cid}_back.png"
        front_path = os.path.join(cards_strokes_dir, front_file)
        back_path = os.path.join(cards_strokes_dir, back_file)

        clean_and_render_card(doc, p_front_idx, front_path, is_front=True)
        clean_and_render_card(doc, p_back_idx, back_path, is_front=False)

        qr_info = qr_strokes.get(str(cid), {})
        audio_url = qr_info.get("audio_url")
        audio_file = f"net_{slug}.m4a"
        audio_path = os.path.join(audio_strokes_dir, audio_file)
        if audio_url:
            download_audio(audio_url, audio_path)

        all_strokes_data.append({
            "id": cid,
            "name": item["name"],
            "slug": slug,
            "desc": item["desc"],
            "letters": item["letters"],
            "audio_url": f"/audio/module_strokes/{audio_file}",
            "video_url": qr_info.get("video_url"),
            "assets": {
                "card_front": f"/data/module_strokes/cards/{front_file}",
                "card_back": f"/data/module_strokes/cards/{back_file}"
            }
        })
        print(f"Processed Stroke {item['name']} (Card {cid})")

    with open("public/data/module_strokes/strokes_data.json", "w", encoding="utf-8") as f:
        json.dump(all_strokes_data, f, ensure_ascii=False, indent=2)

    # --- 4. EXTRACT 14 DIGRAPHS (Cards 41 to 54) ---
    print("\n--- EXTRACTING 14 DIGRAPHS ---")
    digraphs_meta = [
        {"id": 41, "name": "Ch", "slug": "ch", "sample": "chó"},
        {"id": 42, "name": "Kh", "slug": "kh", "sample": "khỉ"},
        {"id": 43, "name": "Nh", "slug": "nh", "sample": "nhà"},
        {"id": 44, "name": "Th", "slug": "th", "sample": "thỏ"},
        {"id": 45, "name": "Ph", "slug": "ph", "sample": "phở"},
        {"id": 46, "name": "Gh", "slug": "gh", "sample": "ghế"},
        {"id": 47, "name": "Ng", "slug": "ng", "sample": "ngựa"},
        {"id": 48, "name": "Ngh", "slug": "ngh", "sample": "nghệ"},
        {"id": 49, "name": "Tr", "slug": "tr", "sample": "tre"},
        {"id": 50, "name": "Gi", "slug": "gi", "sample": "giỏ"},
        {"id": 51, "name": "Qu", "slug": "qu", "sample": "quà"},
        {"id": 52, "name": "ia", "slug": "ia", "sample": "mía"},
        {"id": 53, "name": "ua", "slug": "ua", "sample": "cua"},
        {"id": 54, "name": "ưa", "slug": "ua_moc", "sample": "dừa"}
    ]

    all_digraphs_data = []
    for item in digraphs_meta:
        cid = item["id"]
        slug = item["slug"]
        p_front_idx = (cid - 1) * 2
        p_back_idx = p_front_idx + 1

        front_file = f"card_digraph_{cid}_front.png"
        back_file = f"card_digraph_{cid}_back.png"
        front_path = os.path.join(cards_digraphs_dir, front_file)
        back_path = os.path.join(cards_digraphs_dir, back_file)

        clean_and_render_card(doc, p_front_idx, front_path, is_front=True)
        clean_and_render_card(doc, p_back_idx, back_path, is_front=False)

        qr_info = qr_digraphs.get(str(cid), {})
        audio_url = qr_info.get("audio_url")
        audio_file = f"am_{slug}.m4a"
        audio_path = os.path.join(audio_digraphs_dir, audio_file)
        if audio_url:
            download_audio(audio_url, audio_path)

        all_digraphs_data.append({
            "id": cid,
            "name": item["name"],
            "slug": slug,
            "sample": item["sample"],
            "audio_url": f"/audio/module_digraphs/{audio_file}",
            "video_url": qr_info.get("video_url"),
            "assets": {
                "card_front": f"/data/module_digraphs/cards/{front_file}",
                "card_back": f"/data/module_digraphs/cards/{back_file}"
            }
        })
        print(f"Processed Digraph {item['name']} (Card {cid})")

    with open("public/data/module_digraphs/digraphs_data.json", "w", encoding="utf-8") as f:
        json.dump(all_digraphs_data, f, ensure_ascii=False, indent=2)

    print("\n✅ TOÀN BỘ HỌC LIỆU BỘ THẺ ĐÃ ĐƯỢC BÓC TÁCH HOÀN HẢO!")

def generate_tones_for_syllable(c, v):
    # Vietnamese tones map
    tones_map = {
        "a": ["a", "à", "á", "ả", "ã", "ạ"],
        "o": ["o", "ò", "ó", "ỏ", "õ", "ọ"],
        "ô": ["ô", "ồ", "ố", "ổ", "ỗ", "ộ"],
        "ơ": ["ơ", "ờ", "ớ", "ở", "ỡ", "ợ"],
        "e": ["e", "è", "é", "ẻ", "ẽ", "ẹ"],
        "ê": ["ê", "ề", "ế", "ể", "ễ", "ệ"],
        "i": ["i", "ì", "í", "ỉ", "ĩ", "ị"],
        "u": ["u", "ù", "ú", "ủ", "ũ", "ụ"],
        "ư": ["ư", "ừ", "ứ", "ử", "ữ", "ự"],
        "y": ["y", "ỳ", "ý", "ỷ", "ỹ", "ỵ"]
    }
    v_tones = tones_map.get(v, [v]*6)
    return [c + vt for vt in v_tones]

if __name__ == "__main__":
    extract_all()
