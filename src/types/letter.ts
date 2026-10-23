export interface BasicStroke {
  id: number;
  name: string;
  slug: string;
  desc: string;
  letters: string[];
  audio_url: string;
  video_url?: string;
  assets: {
    card_front: string;
    card_back: string;
  };
}

export interface DigraphData {
  id: number;
  name: string;
  slug: string;
  sample: string;
  audio_url: string;
  video_url?: string;
  assets: {
    card_front: string;
    card_back: string;
  };
}

export interface LetterCardData {
  id: number;
  card_id: number;
  letter: string;
  name: string;
  slug: string;
  type: "vowel" | "consonant";
  illu_word: string;
  stroke_count: number;
  writing_steps: string[];
  mouth_shape: string;
  parent_tip: string;
  forms: {
    upper_print: string;
    lower_print: string;
    upper_cursive: string;
    lower_cursive: string;
  };
  back_content: {
    type: "vowel" | "consonant";
    vowel_words?: string[];
    compatible_vowels?: string[];
    phonics_matrix?: Record<string, string[]>;
    phrases?: string[];
  };
  audio_url: string;
  video_url?: string;
  assets: {
    card_front: string;
    card_back: string;
    writing_guide: string;
    illustration: string;
    forms_guide?: string;
  };
}

export type MainCategory = "letters" | "numbers";

export type LetterSubMode =
  | "flashcard"
  | "strokes"
  | "digraphs"
  | "writing"
  | "grader"
  | "quiz";

export type NumberSubMode = "card" | "counting" | "writing" | "bonds" | "guide";

export type AnnotationShape = "freehand" | "circle" | "rect";

export interface HandwritingBoundingBox {
  id: string;
  shape?: AnnotationShape; // 'freehand' = vẽ tay tự do, 'circle' = khoanh tròn/elip, 'rect' = khung chữ nhật
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] theo tỷ lệ 0 - 1000
  points?: [number, number][]; // Dành cho nét vẽ tay tự do (freehand lasso)
  ellipse?: [number, number, number, number]; // [centerX, centerY, radiusX, radiusY] theo thang 0 - 1000
  loai: "loi" | "chuan" | "chu_y"; // 'loi' = đỏ, 'chuan' = xanh lá, 'chu_y' = vàng cam
  chu: string;
  tieu_de: string;
  nhan_xet: string;
  huong_dan_sua?: string;
  // Chuẩn hiển thị GiaoDienMongMuon: Vòng tròn nét đứt + Đường chỉ dẫn callout
  callout?: {
    target: [number, number]; // [x, y] điểm lỗi trên nét (tâm vòng tròn nét đứt)
    anchor: [number, number]; // [x, y] điểm mút của đường chỉ dẫn (đầu chấm tròn)
    radius: number;           // bán kính vòng tròn nét đứt
    title?: string;
  };
  sample_crop_url?: string; // Ảnh crop chi tiết ô chữ để soi nét
  teacher_sample_url?: string; // Ảnh crop chữ mẫu chuẩn cô giáo đối chiếu
}

export interface HandwritingEvaluationResult {
  anh_hop_le: boolean;
  ly_do?: string;
  tong_diem: number;
  xep_loai: string;
  tieu_chi: {
    dung_mau_chu: number;
    do_deu_net: number;
    khoang_cach: number;
    do_thang_hang: number;
    trinh_bay: number;
    net_co_ban: number;
  };
  nhan_xet_chung: string;
  diem_tot: string[];
  loi_can_cai_thien: string[];
  goi_y_luyen_tap: string[];
  vi_du_minh_hoa: Array<{
    chu: string;
    nhan_xet: string;
    sai_o_dau: string;
    can_cai_thien: string;
  }>;
  bounding_boxes?: HandwritingBoundingBox[];
  nhan_xet_phu_huynh: string;
}
