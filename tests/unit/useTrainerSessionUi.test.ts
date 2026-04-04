import { describe, expect, it } from 'vitest';
import { computed, ref } from 'vue';

import { useTrainerSessionUi } from '~/composables/useTrainerSessionUi';
import type { GameState } from '~~/shared/types/vocabulary';

import { questionOne } from '../fixtures/vocabulary';

const createGameState = (overrides: Partial<GameState> = {}): GameState => ({
  level: 1,
  score: 0,
  streak: 0,
  bestStreak: 0,
  missesInRow: 0,
  rounds: 0,
  status: 'ready',
  currentQuestion: questionOne,
  selectedChoiceId: null,
  lastCorrect: null,
  recentQuestionIds: [],
  ...overrides,
});

describe('useTrainerSessionUi', () => {
  it('開始前パネルの表示状態と開始コピーを返す', () => {
    const game = ref(createGameState());
    const sessionStartPending = ref(true);
    const fatalError = ref<string | null>(null);
    const uiError = ref<string | null>(null);
    const isLoading = ref(false);
    const speechSupported = ref(true);
    const highScores = ref({
      1: { score: 10, streak: 2 },
      2: { score: 0, streak: 0 },
      3: { score: 0, streak: 0 },
    });
    const sessionRecordBaseline = ref({
      1: { score: 10, streak: 2 },
      2: { score: 0, streak: 0 },
      3: { score: 0, streak: 0 },
    });
    const correctChoiceLabel = computed(() => 'こんにちは');

    const sessionUi = useTrainerSessionUi({
      game,
      sessionStartPending,
      fatalError,
      uiError,
      isLoading,
      speechSupported,
      highScores,
      sessionRecordBaseline,
      correctChoiceLabel,
    });

    expect(sessionUi.showSessionStart.value).toBe(true);
    expect(sessionUi.showLevelPanel.value).toBe(true);
    expect(sessionUi.startPanelTitle.value).toBe('このレベルから始める');
    expect(sessionUi.startPanelCopy.value).toContain('読み上げも始まります');
    expect(sessionUi.feedbackBadge.value).toBe('Start');
  });

  it('回答後は正誤に応じたメッセージと badge を返す', () => {
    const game = ref(
      createGameState({
        score: 10,
        streak: 1,
        rounds: 1,
        status: 'answered',
        selectedChoiceId: questionOne.questionId,
        lastCorrect: true,
      })
    );
    const sessionStartPending = ref(false);
    const fatalError = ref<string | null>(null);
    const uiError = ref<string | null>(null);
    const isLoading = ref(false);
    const speechSupported = ref(true);
    const highScores = ref({
      1: { score: 10, streak: 1 },
      2: { score: 0, streak: 0 },
      3: { score: 0, streak: 0 },
    });
    const sessionRecordBaseline = ref({
      1: { score: 0, streak: 0 },
      2: { score: 0, streak: 0 },
      3: { score: 0, streak: 0 },
    });
    const correctChoiceLabel = computed(() => 'こんにちは');

    const sessionUi = useTrainerSessionUi({
      game,
      sessionStartPending,
      fatalError,
      uiError,
      isLoading,
      speechSupported,
      highScores,
      sessionRecordBaseline,
      correctChoiceLabel,
    });

    expect(sessionUi.answered.value).toBe(true);
    expect(sessionUi.feedbackTone.value).toBe('correct');
    expect(sessionUi.answerMessage.value).toBe('正解。+10点獲得');
    expect(sessionUi.feedbackBadge.value).toBe('Correct');

    game.value = {
      ...game.value,
      streak: 0,
      missesInRow: 1,
      lastCorrect: false,
    };

    expect(sessionUi.feedbackTone.value).toBe('incorrect');
    expect(sessionUi.answerMessage.value).toContain(
      '不正解。正解は「こんにちは」。残り2回で終了します。'
    );
    expect(sessionUi.feedbackBadge.value).toBe('Miss');
    expect(sessionUi.feedbackView.value).toEqual({
      variant: 'banner',
      tone: 'incorrect',
      badge: 'Miss',
      message: '不正解。正解は「こんにちは」。残り2回で終了します。',
      uiError: null,
    });
  });

  it('未回答時はインライン案内を返して結果バナーを出さない', () => {
    const game = ref(createGameState());
    const sessionStartPending = ref(false);
    const fatalError = ref<string | null>(null);
    const uiError = ref<string | null>(null);
    const isLoading = ref(false);
    const speechSupported = ref(true);
    const highScores = ref({
      1: { score: 0, streak: 0 },
      2: { score: 0, streak: 0 },
      3: { score: 0, streak: 0 },
    });
    const sessionRecordBaseline = ref({
      1: { score: 0, streak: 0 },
      2: { score: 0, streak: 0 },
      3: { score: 0, streak: 0 },
    });
    const correctChoiceLabel = computed(() => 'こんにちは');

    const sessionUi = useTrainerSessionUi({
      game,
      sessionStartPending,
      fatalError,
      uiError,
      isLoading,
      speechSupported,
      highScores,
      sessionRecordBaseline,
      correctChoiceLabel,
    });

    expect(sessionUi.feedbackTone.value).toBe('idle');
    expect(sessionUi.feedbackBadge.value).toBe('Ready');
    expect(sessionUi.feedbackView.value).toEqual({
      variant: 'inline',
      message: '4つの選択肢から、意味に合うものを1つ選んでください。',
      uiError: null,
    });
  });

  it('致命エラー値があっても問題が残っていれば回答メッセージは維持する', () => {
    const game = ref(
      createGameState({
        score: 10,
        streak: 1,
        rounds: 1,
        status: 'answered',
        selectedChoiceId: questionOne.questionId,
        lastCorrect: true,
      })
    );
    const sessionStartPending = ref(false);
    const fatalError = ref<string | null>('next question failed');
    const uiError = ref<string | null>(null);
    const isLoading = ref(false);
    const speechSupported = ref(true);
    const highScores = ref({
      1: { score: 10, streak: 1 },
      2: { score: 0, streak: 0 },
      3: { score: 0, streak: 0 },
    });
    const sessionRecordBaseline = ref({
      1: { score: 0, streak: 0 },
      2: { score: 0, streak: 0 },
      3: { score: 0, streak: 0 },
    });
    const correctChoiceLabel = computed(() => 'こんにちは');

    const sessionUi = useTrainerSessionUi({
      game,
      sessionStartPending,
      fatalError,
      uiError,
      isLoading,
      speechSupported,
      highScores,
      sessionRecordBaseline,
      correctChoiceLabel,
    });

    expect(sessionUi.answerMessage.value).toBe('正解。+10点獲得');
    expect(sessionUi.hasFatalLoadError.value).toBe(false);
  });

  it('ゲームオーバー時は実績に応じたタイトルと要約を返す', () => {
    const game = ref(
      createGameState({
        score: 45,
        bestStreak: 4,
        missesInRow: 3,
        rounds: 6,
        status: 'finished',
      })
    );
    const sessionStartPending = ref(false);
    const fatalError = ref<string | null>(null);
    const uiError = ref<string | null>(null);
    const isLoading = ref(false);
    const speechSupported = ref(false);
    const highScores = ref({
      1: { score: 45, streak: 4 },
      2: { score: 0, streak: 0 },
      3: { score: 0, streak: 0 },
    });
    const sessionRecordBaseline = ref({
      1: { score: 30, streak: 3 },
      2: { score: 0, streak: 0 },
      3: { score: 0, streak: 0 },
    });
    const correctChoiceLabel = computed(() => 'こんにちは');

    const sessionUi = useTrainerSessionUi({
      game,
      sessionStartPending,
      fatalError,
      uiError,
      isLoading,
      speechSupported,
      highScores,
      sessionRecordBaseline,
      correctChoiceLabel,
    });

    expect(sessionUi.isGameOver.value).toBe(true);
    expect(sessionUi.gameOverAchievements.value).toHaveLength(2);
    expect(sessionUi.gameOverTitle.value).toBe('新記録達成');
    expect(sessionUi.gameOverSummary.value).toBe('今回のプレイで自己ベストを更新しました。');
    expect(sessionUi.feedbackBadge.value).toBe('Game Over');
  });
});
