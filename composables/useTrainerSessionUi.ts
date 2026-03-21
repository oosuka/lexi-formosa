import { computed, type Ref } from 'vue';

import { getScoreForCorrectAnswer, MAX_MISSES_IN_ROW } from '~/composables/useTraditionalTrainer';
import { type GameState, LEVELS, type Level } from '~/types/vocabulary';
import { LEVEL_COPY } from '~/utils/trainer';

import type { LevelHighScore } from './useHighScores';

type GameOverAchievement = {
  key: 'score' | 'streak';
  badge: string;
  label: string;
  value: number;
  note: string;
  tone: 'new' | 'tie';
};

type FeedbackView =
  | {
      variant: 'banner';
      tone: 'correct' | 'incorrect' | 'loading';
      badge: string;
      message: string;
      uiError: string | null;
    }
  | {
      variant: 'inline';
      message: string;
      uiError: string | null;
    };

type UseTrainerSessionUiOptions = {
  game: Ref<GameState>;
  sessionStartPending: Ref<boolean>;
  fatalError: Ref<string | null>;
  uiError: Ref<string | null>;
  isLoading: Ref<boolean>;
  speechSupported: Ref<boolean>;
  highScores: Ref<Record<Level, LevelHighScore>>;
  sessionRecordBaseline: Ref<Record<Level, LevelHighScore>>;
  correctChoiceLabel: Ref<string | null>;
};

const appendGameOverAchievement = (
  achievements: GameOverAchievement[],
  key: GameOverAchievement['key'],
  label: string,
  value: number,
  baselineValue: number
) => {
  if (value > baselineValue) {
    achievements.push({
      key,
      badge: 'NEW BEST',
      label,
      value,
      note: '自己ベストを更新',
      tone: 'new',
    });
    return;
  }

  if (value > 0 && value === baselineValue) {
    achievements.push({
      key,
      badge: 'RECORD TIED',
      label,
      value,
      note: '自己ベストと同記録',
      tone: 'tie',
    });
  }
};

export const useTrainerSessionUi = ({
  game,
  sessionStartPending,
  fatalError,
  uiError,
  isLoading,
  speechSupported,
  highScores,
  sessionRecordBaseline,
  correctChoiceLabel,
}: UseTrainerSessionUiOptions) => {
  const currentQuestion = computed(() => game.value.currentQuestion);
  const hasFatalLoadError = computed(() => Boolean(fatalError.value && !currentQuestion.value));
  const showSessionStart = computed(
    () => sessionStartPending.value && Boolean(currentQuestion.value)
  );
  const showLevelPanel = computed(
    () => showSessionStart.value || hasFatalLoadError.value || isLoading.value
  );
  const isGameOver = computed(() => game.value.status === 'finished');
  const score = computed(() => game.value.score);
  const streak = computed(() => game.value.streak);
  const bestRunStreak = computed(() => game.value.bestStreak);
  const missesInRow = computed(() => game.value.missesInRow);
  const remainingMisses = computed(() => Math.max(0, MAX_MISSES_IN_ROW - missesInRow.value));
  const rounds = computed(() => game.value.rounds);
  const answered = computed(() => game.value.status === 'answered');
  const revealAnswer = computed(
    () => game.value.status === 'answered' || game.value.status === 'finished'
  );
  const currentLevel = computed(() => game.value.level);
  const canStartSession = computed(
    () => showSessionStart.value && !isLoading.value && Boolean(currentQuestion.value)
  );
  const startPanelTitle = computed(() =>
    rounds.value > 0 ? '同じレベルでもう一度始める' : 'このレベルから始める'
  );
  const startPanelCopy = computed(() =>
    speechSupported.value
      ? '始めると、最初の問題が表示され、読み上げも始まります。'
      : '始めると、最初の問題を表示します。'
  );
  const startPanelModeLabel = computed(() =>
    speechSupported.value ? 'Sound Ready' : 'Visual Ready'
  );
  const sessionPanelKicker = computed(() => (showSessionStart.value ? 'Records' : 'Session'));
  const sessionPanelTitle = computed(() =>
    showSessionStart.value ? 'レベルごとの最高記録' : '今回の記録'
  );
  const sessionMetricCards = computed(() => [
    {
      id: 'score',
      label: 'Score',
      value: score.value,
      help: '現在の合計',
    },
    {
      id: 'streak',
      label: 'Streak',
      value: streak.value,
      help: '現在の連続数',
    },
    {
      id: 'rounds',
      label: 'Rounds',
      value: rounds.value,
      help: 'ここまでの問題数',
    },
  ]);
  const highScoreCards = computed(() =>
    LEVELS.map((level) => ({
      level,
      label: LEVEL_COPY[level].label,
      score: highScores.value[level].score,
      streak: highScores.value[level].streak,
      active: currentLevel.value === level,
    }))
  );
  const currentLevelHighScore = computed(() => highScores.value[currentLevel.value]);
  const gameOverAchievements = computed(() => {
    if (!isGameOver.value) {
      return [];
    }

    const baseline = sessionRecordBaseline.value[currentLevel.value];
    const achievements: GameOverAchievement[] = [];

    appendGameOverAchievement(achievements, 'score', 'Score', score.value, baseline.score);
    appendGameOverAchievement(
      achievements,
      'streak',
      'Streak',
      bestRunStreak.value,
      baseline.streak
    );

    return achievements;
  });
  const gameOverTitle = computed(() => {
    if (gameOverAchievements.value.some((achievement) => achievement.tone === 'new')) {
      return '新記録達成';
    }

    if (gameOverAchievements.value.some((achievement) => achievement.tone === 'tie')) {
      return '自己ベストタイ';
    }

    return '今回の結果';
  });
  const gameOverSummary = computed(() => {
    if (gameOverAchievements.value.some((achievement) => achievement.tone === 'new')) {
      return '今回のプレイで自己ベストを更新しました。';
    }

    if (gameOverAchievements.value.some((achievement) => achievement.tone === 'tie')) {
      return '今回のプレイで自己ベストに並びました。';
    }

    return '3回続けて不正解になったため、今回はここで終了です。';
  });
  const feedbackTone = computed(() => {
    if (isLoading.value) {
      return 'loading';
    }

    if (!answered.value) {
      return 'idle';
    }

    return game.value.lastCorrect ? 'correct' : 'incorrect';
  });
  const feedbackView = computed<FeedbackView>(() => {
    if (feedbackTone.value === 'loading') {
      return {
        variant: 'banner',
        tone: 'loading',
        badge: 'Loading',
        message: '問題データを読み込んでいます。',
        uiError: null,
      };
    }

    if (feedbackTone.value === 'correct') {
      return {
        variant: 'banner',
        tone: 'correct',
        badge: 'Correct',
        message: `正解です。+${getScoreForCorrectAnswer(streak.value)}点`,
        uiError: uiError.value,
      };
    }

    if (feedbackTone.value === 'incorrect') {
      return {
        variant: 'banner',
        tone: 'incorrect',
        badge: 'Miss',
        message: `不正解です。正解は「${correctChoiceLabel.value ?? '不明'}」です。あと${remainingMisses.value}回で終了します。`,
        uiError: uiError.value,
      };
    }

    return {
      variant: 'inline',
      message: '4つの選択肢から、意味に合うものを1つ選んでください。',
      uiError: uiError.value,
    };
  });
  const answerMessage = computed(() => {
    if (showSessionStart.value) {
      return startPanelCopy.value;
    }

    if (isGameOver.value) {
      return '3回続けて不正解でした。';
    }

    if (feedbackView.value.variant === 'inline') {
      return feedbackView.value.message;
    }

    return feedbackView.value.message;
  });
  const feedbackBadge = computed(() => {
    if (feedbackView.value.variant === 'banner') {
      return feedbackView.value.badge;
    }

    if (showSessionStart.value) {
      return 'Start';
    }

    if (isGameOver.value) {
      return 'Game Over';
    }

    return 'Ready';
  });

  return {
    hasFatalLoadError,
    isLoading,
    showSessionStart,
    showLevelPanel,
    isGameOver,
    score,
    streak,
    bestRunStreak,
    remainingMisses,
    rounds,
    answered,
    revealAnswer,
    canStartSession,
    startPanelTitle,
    startPanelCopy,
    startPanelModeLabel,
    sessionPanelKicker,
    sessionPanelTitle,
    sessionMetricCards,
    highScoreCards,
    currentLevelHighScore,
    gameOverAchievements,
    gameOverTitle,
    gameOverSummary,
    feedbackTone,
    feedbackView,
    answerMessage,
    feedbackBadge,
  };
};
