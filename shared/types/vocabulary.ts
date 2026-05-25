export const LEVELS = [1, 2, 3] as const;

// Level 1 = 1文字, Level 2 = 2文字, Level 3 = 3文字以上
export type Level = (typeof LEVELS)[number];

export interface VocabEntry {
  id: string;
  trad: string;
  ja: string;
  senseTag?: string;
  distractorTags?: string[];
  level: Level;
  length: number;
  category: string;
  taiwanPriority: true;
  sources: string[];
  tocflLevel?: number;
  pronunciation?: string;
  notes?: string;
}

export interface QuestionChoice {
  id: string;
  label: string;
  correct: boolean;
}

export interface QuestionRound {
  questionId: string;
  trad: string;
  level: Level;
  pronunciation?: string;
  choices: QuestionChoice[];
}

export interface AnswerResult {
  correct: boolean;
  correctChoiceId: string;
}

export interface GameState {
  level: Level;
  score: number;
  streak: number;
  bestStreak: number;
  missesInRow: number;
  rounds: number;
  status: 'ready' | 'answered' | 'finished';
  currentQuestion: QuestionRound | null;
  selectedChoiceId: string | null;
  lastCorrect: boolean | null;
  recentQuestionIds: string[];
}

export interface VocabularyMetadata {
  total: number;
  counts: Record<Level, number>;
}
