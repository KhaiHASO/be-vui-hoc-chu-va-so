export interface NumberBond {
  part_a: number;
  part_b: number;
  total: number;
  split_sentence: string;
  combine_sentence: string;
}

export interface WritingGuide {
  stroke_count: number;
  steps: string[];
  common_mistakes: string;
  image_url: string;
}

export interface ParentTips {
  prompt_question: string;
  daily_activity: string;
}

export interface NumberAssets {
  card_front: string;
  card_back: string;
  illustration: string;
  writing_guide: string;
  single_animal: string | null;
  audio_url: string; // Bản thu âm chuẩn của cô giáo trích xuất từ bộ thẻ
}

export interface NumberCardData {
  id: number;
  card_id: number;
  number: number;
  word: string;
  item_name: string;
  unit: string;
  count: number;
  sample_bond: {
    total: number;
    part_a: number;
    part_b: number;
    dot_representation: {
      total: number;
      part_a: number;
      part_b: number;
    };
    sentences: string[];
  };
  all_bonds: NumberBond[];
  writing_guide: WritingGuide;
  parent_tips: ParentTips;
  assets: NumberAssets;
}
