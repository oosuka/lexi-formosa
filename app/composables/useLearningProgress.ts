import { computed, ref } from 'vue';

import { getLocalDateKey } from '~/utils/trainer';
import { LEVELS, type Level } from '~~/shared/types/vocabulary';

export const LEARNING_PROGRESS_STORAGE_KEY = 'lexi-formosa-learning-progress-v1';
export const MAX_WORD_MASTERY = 3;

export type RouteMedal = 'none' | 'bronze' | 'silver' | 'gold';

export type WordLearningRecord = {
  level: Level;
  mastery: number;
  correct: number;
  incorrect: number;
  lastSeenOn: string;
};

export type DailyRouteResult = {
  score: number;
  correctAnswers: number;
  bestStreak: number;
  completed: boolean;
  completedRoutes: number;
  medal: RouteMedal;
};

export type LearningProgress = {
  words: Record<string, WordLearningRecord>;
  daily: {
    dateKey: string;
    results: Partial<Record<Level, DailyRouteResult>>;
  };
};

const createEmptyLearningProgress = (dateKey: string): LearningProgress => ({
  words: {},
  daily: {
    dateKey,
    results: {},
  },
});

const toSafeInteger = (value: unknown, maximum = Number.MAX_SAFE_INTEGER): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return Math.min(maximum, Math.max(0, Math.floor(value)));
};

const isLevel = (value: unknown): value is Level =>
  typeof value === 'number' && LEVELS.includes(value as Level);

const isRouteMedal = (value: unknown): value is RouteMedal =>
  value === 'none' || value === 'bronze' || value === 'silver' || value === 'gold';

const parseWordRecord = (value: unknown): WordLearningRecord | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<WordLearningRecord>;

  if (!isLevel(candidate.level)) {
    return null;
  }

  return {
    level: candidate.level,
    mastery: toSafeInteger(candidate.mastery, MAX_WORD_MASTERY),
    correct: toSafeInteger(candidate.correct),
    incorrect: toSafeInteger(candidate.incorrect),
    lastSeenOn: typeof candidate.lastSeenOn === 'string' ? candidate.lastSeenOn : '',
  };
};

const parseDailyResult = (value: unknown): DailyRouteResult | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<DailyRouteResult>;

  return {
    score: toSafeInteger(candidate.score),
    correctAnswers: toSafeInteger(candidate.correctAnswers, 10),
    bestStreak: toSafeInteger(candidate.bestStreak),
    completed: candidate.completed === true,
    completedRoutes: toSafeInteger(candidate.completedRoutes),
    medal: isRouteMedal(candidate.medal) ? candidate.medal : 'none',
  };
};

const readStoredProgress = (dateKey: string): LearningProgress => {
  if (typeof window === 'undefined') {
    return createEmptyLearningProgress(dateKey);
  }

  try {
    const stored = window.localStorage.getItem(LEARNING_PROGRESS_STORAGE_KEY);

    if (!stored) {
      return createEmptyLearningProgress(dateKey);
    }

    const parsed = JSON.parse(stored) as Partial<LearningProgress>;
    const words: Record<string, WordLearningRecord> = {};

    if (parsed.words && typeof parsed.words === 'object') {
      for (const [id, value] of Object.entries(parsed.words)) {
        const record = parseWordRecord(value);

        if (record) {
          words[id] = record;
        }
      }
    }

    const results: Partial<Record<Level, DailyRouteResult>> = {};
    const storedDateKey = parsed.daily?.dateKey;

    if (storedDateKey === dateKey && parsed.daily?.results) {
      for (const level of LEVELS) {
        const result = parseDailyResult(parsed.daily.results[level]);

        if (result) {
          results[level] = result;
        }
      }
    }

    return {
      words,
      daily: {
        dateKey,
        results,
      },
    };
  } catch {
    return createEmptyLearningProgress(dateKey);
  }
};

const persistProgress = (progress: LearningProgress) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LEARNING_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Keep the game playable when storage is unavailable.
  }
};

export const getRouteMedal = (correctAnswers: number): RouteMedal => {
  if (correctAnswers >= 10) {
    return 'gold';
  }

  if (correctAnswers >= 8) {
    return 'silver';
  }

  if (correctAnswers >= 6) {
    return 'bronze';
  }

  return 'none';
};

export const useLearningProgress = () => {
  const dateKey = ref(getLocalDateKey());
  const progress = ref<LearningProgress>(createEmptyLearningProgress(dateKey.value));

  const loadLearningProgress = (nextDateKey = getLocalDateKey()) => {
    dateKey.value = nextDateKey;
    progress.value = readStoredProgress(nextDateKey);
  };

  const recordAnswer = (questionId: string, level: Level, correct: boolean) => {
    const current = progress.value.words[questionId] ?? {
      level,
      mastery: 0,
      correct: 0,
      incorrect: 0,
      lastSeenOn: '',
    };
    const next: WordLearningRecord = {
      level,
      mastery: correct
        ? Math.min(MAX_WORD_MASTERY, current.mastery + 1)
        : Math.max(0, current.mastery - 1),
      correct: current.correct + (correct ? 1 : 0),
      incorrect: current.incorrect + (correct ? 0 : 1),
      lastSeenOn: dateKey.value,
    };

    progress.value = {
      ...progress.value,
      words: {
        ...progress.value.words,
        [questionId]: next,
      },
    };
    persistProgress(progress.value);
  };

  const recordRouteResult = (
    level: Level,
    result: Omit<DailyRouteResult, 'medal' | 'completedRoutes'>
  ) => {
    const current = progress.value.daily.results[level];
    const correctAnswers = Math.max(current?.correctAnswers ?? 0, result.correctAnswers);
    const next: DailyRouteResult = {
      score: Math.max(current?.score ?? 0, result.score),
      correctAnswers,
      bestStreak: Math.max(current?.bestStreak ?? 0, result.bestStreak),
      completed: Boolean(current?.completed || result.completed),
      completedRoutes: (current?.completedRoutes ?? 0) + (result.completed ? 1 : 0),
      medal: getRouteMedal(correctAnswers),
    };

    progress.value = {
      ...progress.value,
      daily: {
        dateKey: dateKey.value,
        results: {
          ...progress.value.daily.results,
          [level]: next,
        },
      },
    };
    persistProgress(progress.value);
  };

  const getReviewQuestionIds = (level: Level): string[] =>
    Object.entries(progress.value.words)
      .filter(([, record]) => record.level === level && record.incorrect > 0 && record.mastery < 2)
      .sort(([, left], [, right]) => {
        if (left.mastery !== right.mastery) {
          return left.mastery - right.mastery;
        }

        if (left.incorrect !== right.incorrect) {
          return right.incorrect - left.incorrect;
        }

        return left.lastSeenOn.localeCompare(right.lastSeenOn);
      })
      .map(([id]) => id);

  const reviewCounts = computed<Record<Level, number>>(() => ({
    1: getReviewQuestionIds(1).length,
    2: getReviewQuestionIds(2).length,
    3: getReviewQuestionIds(3).length,
  }));
  const masteredCounts = computed<Record<Level, number>>(() => {
    const counts: Record<Level, number> = { 1: 0, 2: 0, 3: 0 };

    for (const record of Object.values(progress.value.words)) {
      if (record.mastery >= MAX_WORD_MASTERY) {
        counts[record.level] += 1;
      }
    }

    return counts;
  });
  const todayResults = computed(() => progress.value.daily.results);
  const completedRouteCounts = computed<Record<Level, number>>(() => ({
    1: progress.value.daily.results[1]?.completedRoutes ?? 0,
    2: progress.value.daily.results[2]?.completedRoutes ?? 0,
    3: progress.value.daily.results[3]?.completedRoutes ?? 0,
  }));

  return {
    dateKey,
    progress,
    reviewCounts,
    masteredCounts,
    todayResults,
    completedRouteCounts,
    loadLearningProgress,
    recordAnswer,
    recordRouteResult,
    getReviewQuestionIds,
  };
};
