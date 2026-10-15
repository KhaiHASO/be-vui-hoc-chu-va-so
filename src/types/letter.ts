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
  };
}

export type MainCategory = "letters" | "numbers";

export type LetterSubMode = "flashcard" | "strokes" | "digraphs" | "writing" | "mouth" | "quiz";

export type NumberSubMode = "card" | "counting" | "writing" | "bonds" | "guide";
