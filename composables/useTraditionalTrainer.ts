import type { AnswerResult, GameState, Level } from '~/types/vocabulary';
import { buildQuestion, getCorrectChoice, RECENT_WINDOW_SIZE } from '~/utils/trainer';
import { loadVocabularyLevel } from '~/utils/vocabulary';

export const MAX_MISSES_IN_ROW = 3;
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

const createGameState = (level: Level): GameState => ({
  level,
  score: 0,
  streak: 0,
  bestStreak: 0,
  missesInRow: 0,
  rounds: 0,
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

  const initialize = async (level = game.value.level) => {
    const requestId = latestInitializeRequestId.value + 1;
    latestInitializeRequestId.value = requestId;
    isLoading.value = true;

    try {
      const pool = await ensureLevelLoaded(level);

      if (latestInitializeRequestId.value !== requestId) {
        return;
      }

      game.value = {
        ...createGameState(level),
        currentQuestion: buildQuestion(pool, level, []),
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
    const nextStatus = nextMissesInRow >= MAX_MISSES_IN_ROW ? 'finished' : 'answered';
    const scoreGain = correct ? getScoreForCorrectAnswer(nextStreak) : 0;

    game.value.selectedChoiceId = choiceId;
    game.value.lastCorrect = correct;
    game.value.status = nextStatus;
    game.value.rounds += 1;
    game.value.streak = nextStreak;
    game.value.bestStreak = Math.max(game.value.bestStreak, nextStreak);
    game.value.missesInRow = nextMissesInRow;
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
    game.value.currentQuestion = buildQuestion(
      pool,
      game.value.level,
      game.value.recentQuestionIds
    );
    game.value.selectedChoiceId = null;
    game.value.lastCorrect = null;
    game.value.status = 'ready';
  };

  const resetSession = async (level = game.value.level) => {
    await initialize(level);
  };

  const setLevel = async (level: Level) => {
    await resetSession(level);
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
