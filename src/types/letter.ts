export interface BasicStroke {
  id: string;
  name: string;
  cardId: number;
  height: string;
  description: string;
  previewSvg?: string;
}

export interface LetterCardData {
  id: string;
  letter: string;
  upper: string;
  lower: string;
  soundName: string; // Tên âm: "Âm a", "Âm bờ", "Âm cờ"...
  cardId?: number;
  illustration: {
    word: string;
    image?: string;
    meaning: string;
  };
  writingGuide: {
    height: string; // vd: "2 ô ly" hoặc "5 ô ly"
    strokes: string[];
    sampleSvg?: string;
  };
  pronunciation: {
    mouthShape: string; // Mô tả khẩu hình: "Mở rộng miệng tự nhiên"
    tonguePosition: string; // Vị trí lưỡi: "Lưỡi hạ thấp tự nhiên"
    vocalAirflow: string; // Luồng hơi: "Dây thanh rung đều, hơi thoát tự nhiên"
    guideTips?: string; // Lời khuyên phụ huynh khi sửa ngọng
  };
}

export type MainCategory = "letters" | "numbers";

export type LetterSubMode = "flashcard" | "strokes" | "writing" | "mouth" | "quiz";

export type NumberSubMode = "card" | "counting" | "writing" | "bonds" | "guide";
