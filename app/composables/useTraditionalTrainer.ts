import {
  buildDailyRouteQuestionIds,
  buildQuestion,
  DAILY_ROUTE_LENGTH,
  getCorrectChoice,
  getLocalDateKey,
  RECENT_WINDOW_SIZE,
} from '~/utils/trainer';
import { loadVocabularyLevel } from '~/utils/vocabulary';
import type { AnswerResult, GameState, Level } from '~~/shared/types/vocabulary';

export const MAX_MISSES_IN_ROW = 3;
export type TrainerRouteOptions = {
  dateKey?: string;
  reviewQuestionIds?: string[];
  routeIndex?: number;
};
export const getScoreForCorrectAnswer = (nextStreak: number) => {
  if (nextStreak >= 7) {
    return 25;
  }

  if (nextStreak >= 5) {
    return 20;
  }

  if (nextStreak >= 3) {
    return 15;
  }

  return 10;
};

const createGameState = (
  level: Level,
  routeIndex = 0,
  routeQuestionIds: string[] = [],
  reviewQuestionIds: string[] = []
): GameState => ({
  level,
  score: 0,
  streak: 0,
  bestStreak: 0,
  missesInRow: 0,
  rounds: 0,
  correctAnswers: 0,
  routeLength: DAILY_ROUTE_LENGTH,
  routeIndex,
  routeQuestionIds,
  reviewQuestionIds,
  finishReason: null,
  status: 'ready',
  currentQuestion: null,
  selectedChoiceId: null,
  lastCorrect: null,
  recentQuestionIds: [],
});

export const useTraditionalTrainer = () => {
  const game = useState<GameState>('traditional-trainer-game', () => createGameState(1));
  const loadedLevels = useState<
    Partial<Record<Level, Awaited<ReturnType<typeof loadVocabularyLevel>>>>
  >('traditional-trainer-levels', () => ({}));
  const isLoading = useState<boolean>('traditional-trainer-loading', () => false);
  const latestInitializeRequestId = useState<number>(
    'traditional-trainer-initialize-request-id',
    () => 0
  );

  const correctChoice = computed(() =>
    game.value.currentQuestion ? getCorrectChoice(game.value.currentQuestion) : null
  );

  const ensureLevelLoaded = async (level: Level) => {
    if (!loadedLevels.value[level]) {
      loadedLevels.value[level] = await loadVocabularyLevel(level);
    }

    return loadedLevels.value[level] ?? [];
  };

  const initialize = async (level = game.value.level, options: TrainerRouteOptions = {}) => {
    const requestId = latestInitializeRequestId.value + 1;
    latestInitializeRequestId.value = requestId;
    isLoading.value = true;

    try {
      const pool = await ensureLevelLoaded(level);

      if (latestInitializeRequestId.value !== requestId) {
        return;
      }

      const dateKey = options.dateKey ?? getLocalDateKey();
      const reviewQuestionIds = options.reviewQuestionIds ?? [];
      const routeIndex = Math.max(0, Math.floor(options.routeIndex ?? 0));
      const routeQuestionIds = buildDailyRouteQuestionIds(
        pool,
        level,
        dateKey,
        reviewQuestionIds,
        DAILY_ROUTE_LENGTH,
        routeIndex
      );
      const firstQuestionId = routeQuestionIds[0];

      game.value = {
        ...createGameState(level, routeIndex, routeQuestionIds, reviewQuestionIds),
        currentQuestion: buildQuestion(pool, level, [], firstQuestionId),
      };
    } catch (error) {
      if (latestInitializeRequestId.value !== requestId) {
        return;
      }

      throw error;
    } finally {
      if (latestInitializeRequestId.value === requestId) {
        isLoading.value = false;
      }
    }
  };

  const submitAnswer = (choiceId: string): AnswerResult => {
    if (!game.value.currentQuestion || !correctChoice.value) {
      throw new Error('Question is not ready yet.');
    }

    if (game.value.status === 'answered' || game.value.status === 'finished') {
      return {
        correct: game.value.lastCorrect ?? false,
        correctChoiceId: correctChoice.value.id,
      };
    }

    const correct = choiceId === correctChoice.value.id;
    const nextStreak = correct ? game.value.streak + 1 : 0;
    const nextMissesInRow = correct ? 0 : game.value.missesInRow + 1;
    const nextRounds = game.value.rounds + 1;
    const finishReason =
      nextMissesInRow >= MAX_MISSES_IN_ROW
        ? 'misses'
        : nextRounds >= game.value.routeLength
          ? 'route-complete'
          : null;
    const nextStatus = finishReason ? 'finished' : 'answered';
    const scoreGain = correct ? getScoreForCorrectAnswer(nextStreak) : 0;

    game.value.selectedChoiceId = choiceId;
    game.value.lastCorrect = correct;
    game.value.status = nextStatus;
    game.value.rounds = nextRounds;
    game.value.correctAnswers += correct ? 1 : 0;
    game.value.streak = nextStreak;
    game.value.bestStreak = Math.max(game.value.bestStreak, nextStreak);
    game.value.missesInRow = nextMissesInRow;
    game.value.finishReason = finishReason;
    game.value.score += scoreGain;
    game.value.recentQuestionIds = [
      ...game.value.recentQuestionIds,
      game.value.currentQuestion.questionId,
    ].slice(-RECENT_WINDOW_SIZE);

    return {
      correct,
      correctChoiceId: correctChoice.value.id,
    };
  };

  const nextQuestion = () => {
    if (game.value.status === 'finished') {
      return;
    }

    const pool = loadedLevels.value[game.value.level] ?? [];
    const nextQuestionId = game.value.routeQuestionIds[game.value.rounds];

    game.value.currentQuestion = buildQuestion(
      pool,
      game.value.level,
      game.value.recentQuestionIds,
      nextQuestionId
    );
    game.value.selectedChoiceId = null;
    game.value.lastCorrect = null;
    game.value.status = 'ready';
  };

  const resetSession = async (level = game.value.level, options: TrainerRouteOptions = {}) => {
    await initialize(level, options);
  };

  const setLevel = async (level: Level, options: TrainerRouteOptions = {}) => {
    await resetSession(level, options);
  };

  return {
    game,
    correctChoice,
    isLoading,
    initialize,
    submitAnswer,
    nextQuestion,
    resetSession,
    setLevel,
  };
};
