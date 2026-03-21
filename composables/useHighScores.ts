import { ref } from 'vue';

import { LEVELS, type Level } from '~/types/vocabulary';

export type LevelHighScore = {
  score: number;
  streak: number;
};

export const HIGH_SCORE_STORAGE_KEY = 'lexi-formosa-high-scores-v2';

export const createEmptyHighScores = (): Record<Level, LevelHighScore> => ({
  1: { score: 0, streak: 0 },
  2: { score: 0, streak: 0 },
  3: { score: 0, streak: 0 },
});

const toFiniteNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const parseLevelHighScore = (value: unknown): LevelHighScore => {
  if (typeof value === 'number') {
    return {
      score: toFiniteNumber(value),
      streak: 0,
    };
  }

  if (value && typeof value === 'object') {
    return {
      score: toFiniteNumber((value as { score?: unknown }).score),
      streak: toFiniteNumber((value as { streak?: unknown }).streak),
    };
  }

  return { score: 0, streak: 0 };
};

const readStoredHighScores = (): Record<Level, LevelHighScore> => {
  if (typeof window === 'undefined') {
    return createEmptyHighScores();
  }

  try {
    const stored = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);

    if (!stored) {
      return createEmptyHighScores();
    }

    const parsed = JSON.parse(stored) as Partial<Record<Level, unknown>>;
    const next = createEmptyHighScores();

    for (const level of LEVELS) {
      next[level] = parseLevelHighScore(parsed[level]);
    }

    return next;
  } catch {
    return createEmptyHighScores();
  }
};

const persistHighScores = (highScores: Record<Level, LevelHighScore>) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify(highScores));
  } catch {
    // Keep the game playable even when storage is unavailable.
  }
};

export const useHighScores = () => {
  const highScores = ref<Record<Level, LevelHighScore>>(createEmptyHighScores());

  const loadHighScores = () => {
    highScores.value = readStoredHighScores();
  };

  const updateLevelRecord = (level: Level, score: number, streak: number) => {
    const currentRecord = highScores.value[level];
    const nextScore = Math.max(currentRecord.score, score);
    const nextStreak = Math.max(currentRecord.streak, streak);

    if (nextScore === currentRecord.score && nextStreak === currentRecord.streak) {
      return false;
    }

    highScores.value = {
      ...highScores.value,
      [level]: {
        score: nextScore,
        streak: nextStreak,
      },
    };
    persistHighScores(highScores.value);
    return true;
  };

  return {
    highScores,
    loadHighScores,
    updateLevelRecord,
  };
};
