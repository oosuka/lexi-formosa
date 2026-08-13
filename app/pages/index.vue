<script setup lang="ts">
import { PhStar } from '@phosphor-icons/vue';

import { useFeedbackAudio } from '~/composables/useFeedbackAudio';
import { type LevelHighScore, useHighScores } from '~/composables/useHighScores';
import {
  getRouteMedal,
  type RouteMedal,
  useLearningProgress,
} from '~/composables/useLearningProgress';
import { useTraditionalTrainer } from '~/composables/useTraditionalTrainer';
import { useTrainerAudio } from '~/composables/useTrainerAudio';
import { useTrainerSessionUi } from '~/composables/useTrainerSessionUi';
import { formatKatakanaReading, formatPinyinReading } from '~/utils/pronunciation';
import { getLocalDateKey, LEVEL_COPY } from '~/utils/trainer';
import { loadVocabularyMetadata } from '~/utils/vocabulary';
import {
  LEVELS,
  type Level,
  type QuestionChoice,
  type VocabularyMetadata,
} from '~~/shared/types/vocabulary';

const StarIcon = PhStar;

type MetadataStatus = 'loading' | 'ready' | 'failed';
type QuestionStageExpose = {
  requestExit: () => Promise<void>;
};

const trainer = useTraditionalTrainer();
const learningProgress = useLearningProgress();
const appVersion = useRuntimeConfig().public.appVersion;
const sessionStartPending = ref(true);
const initializedRouteDateKey = ref<string | null>(null);
const fatalError = ref<string | null>(null);
const uiError = ref<string | null>(null);
const { highScores, loadHighScores, updateLevelRecord } = useHighScores();
const vocabularyMetadata = ref<VocabularyMetadata | null>(null);
const metadataStatus = ref<MetadataStatus>('loading');
const sessionRecordBaseline = ref<Record<Level, LevelHighScore>>({
  1: { score: 0, streak: 0 },
  2: { score: 0, streak: 0 },
  3: { score: 0, streak: 0 },
});
const questionStageRef = ref<QuestionStageExpose | null>(null);

const formatVocabularyWordsLabel = (
  count: number | null | undefined,
  status: MetadataStatus
): string => {
  if (status === 'failed') {
    return '語数未取得';
  }

  if (count === null || count === undefined) {
    return '読み込み中';
  }

  return `${count.toLocaleString()}語`;
};

const formatMedalLabel = (medal: RouteMedal): string => {
  if (medal === 'gold') {
    return '金のことば切符';
  }

  if (medal === 'silver') {
    return '銀のことば切符';
  }

  if (medal === 'bronze') {
    return '銅のことば切符';
  }

  return '';
};

const routeOptions = (level: Level) => ({
  dateKey: learningProgress.dateKey.value,
  reviewQuestionIds: learningProgress.getReviewQuestionIds(level),
  routeIndex: learningProgress.completedRouteCounts.value[level],
});

const syncLearningProgressDate = () => {
  const nextDateKey = getLocalDateKey();

  if (learningProgress.dateKey.value !== nextDateKey) {
    learningProgress.loadLearningProgress(nextDateKey);
  }

  return nextDateKey;
};

const ensureCurrentRoute = async () => {
  const nextDateKey = syncLearningProgressDate();

  if (initializedRouteDateKey.value === nextDateKey) {
    return;
  }

  const level = trainer.game.value.level;
  await trainer.resetSession(level, routeOptions(level));
  initializedRouteDateKey.value = nextDateKey;
};

const currentQuestion = computed(() => trainer.game.value.currentQuestion);
const currentQuestionTrad = computed(() => currentQuestion.value?.trad ?? null);
const currentQuestionId = computed(() => currentQuestion.value?.questionId ?? null);
const currentRouteNumber = computed(() => trainer.game.value.routeIndex + 1);
const selectedChoiceId = computed(() => trainer.game.value.selectedChoiceId);
const selectedChoiceLabel = computed(
  () =>
    currentQuestion.value?.choices.find((choice) => choice.id === selectedChoiceId.value)?.label ??
    null
);
const pageLoading = computed(
  () => !fatalError.value && (trainer.isLoading.value || !currentQuestion.value)
);
const pinyinReading = computed(() => formatPinyinReading(currentQuestion.value?.pronunciation));
const katakanaReading = computed(() => formatKatakanaReading(currentQuestion.value?.pronunciation));
const currentQuestionIsReview = computed(() =>
  currentQuestionId.value
    ? trainer.game.value.reviewQuestionIds.includes(currentQuestionId.value)
    : false
);
const trainerAudio = useTrainerAudio({
  getQuestionId: () => currentQuestionId.value,
  getQuestionText: () => currentQuestionTrad.value,
  shouldReplayPending: () => !sessionStartPending.value,
});
const feedbackAudio = useFeedbackAudio();
const isSpeaking = trainerAudio.isSpeaking;
const canPlayAudio = computed(
  () => trainerAudio.speechSupported.value && Boolean(currentQuestionTrad.value)
);
const sessionStartSummaryItems = computed(() => [
  '1ルート10問・完走後は次の10語',
  '間違えた語は自動で復習',
  '3連続正解からボーナス',
  '3回連続不正解で終了',
]);
const sessionUi = useTrainerSessionUi({
  game: trainer.game,
  sessionStartPending,
  fatalError,
  uiError,
  isLoading: pageLoading,
  highScores,
  sessionRecordBaseline,
  correctChoiceLabel: computed(() => trainer.correctChoice.value?.label ?? null),
});
const {
  hasFatalLoadError,
  isLoading,
  showSessionStart,
  isGameOver,
  score,
  streak,
  bestRunStreak,
  correctAnswers,
  remainingMisses,
  rounds,
  routeLength,
  routePosition,
  finishReason,
  answered,
  revealAnswer,
  canStartSession,
  highScoreCards,
  currentLevelHighScore,
  gameOverAchievements,
  gameOverCelebrationTone,
  gameOverTitle,
  gameOverSummary,
  feedbackTone,
  feedbackView,
  feedbackBadge,
} = sessionUi;

const levelCards = computed(() =>
  LEVELS.map((level) => ({
    level,
    ...LEVEL_COPY[level],
    count: vocabularyMetadata.value?.counts[level] ?? null,
    countLabel: formatVocabularyWordsLabel(
      vocabularyMetadata.value?.counts[level],
      metadataStatus.value
    ),
    reviewCount: learningProgress.reviewCounts.value[level],
  }))
);
const activeHighScoreCard = computed(
  () => highScoreCards.value.find((item) => item.active) ?? highScoreCards.value[0] ?? null
);
const selectedLevelCard = computed(
  () => levelCards.value.find((item) => item.level === trainer.game.value.level) ?? null
);
const selectedLevelWordCountLabel = computed(() =>
  formatVocabularyWordsLabel(
    vocabularyMetadata.value?.counts[trainer.game.value.level],
    metadataStatus.value
  )
);
const selectedTodayResult = computed(
  () => learningProgress.todayResults.value[trainer.game.value.level] ?? null
);
const selectedCompletedRoutes = computed(
  () => learningProgress.completedRouteCounts.value[trainer.game.value.level]
);
const selectedTodayMedalLabel = computed(() =>
  formatMedalLabel(selectedTodayResult.value?.medal ?? 'none')
);
const gameOverMedalLabel = computed(() => formatMedalLabel(getRouteMedal(correctAnswers.value)));
const selectedReviewCount = computed(
  () => learningProgress.reviewCounts.value[trainer.game.value.level]
);
const selectedMasteredCount = computed(
  () => learningProgress.masteredCounts.value[trainer.game.value.level]
);
const isCriticalLife = computed(
  () => remainingMisses.value === 1 && !showSessionStart.value && !isGameOver.value
);
const showComboTicket = computed(
  () => !isGameOver.value && (!answered.value || trainer.game.value.lastCorrect === true)
);
const comboTicketLabel = computed(() => {
  if (streak.value >= 7) {
    return '連続正解中・次も +25点';
  }

  if (streak.value >= 5) {
    return `あと${7 - streak.value}問で +25点`;
  }

  if (streak.value >= 3) {
    return `あと${5 - streak.value}問で +20点`;
  }

  return `あと${3 - streak.value}問で +15点`;
});
const learningNote = computed(() => {
  if (!revealAnswer.value || isGameOver.value) {
    return '';
  }

  if (trainer.game.value.lastCorrect && currentQuestionIsReview.value) {
    return '復習語の定着度が上がりました。';
  }

  if (!trainer.game.value.lastCorrect) {
    return 'この単語を端末内の復習リストに追加しました。';
  }

  return '';
});
const externalLookupLinks = computed(() => {
  const trad = currentQuestion.value?.trad;

  if (!trad) {
    return [];
  }

  const encodedTrad = encodeURIComponent(trad);

  return [
    {
      id: 'google-translate',
      label: 'Google 翻訳で調べる',
      href: `https://translate.google.com/?sl=zh-TW&tl=ja&text=${encodedTrad}&op=translate`,
    },
    {
      id: 'weblio',
      label: 'Weblio で調べる',
      href: `https://cjjc.weblio.jp/content/${encodedTrad}`,
    },
  ];
});

const choiceClass = (choice: QuestionChoice) => {
  if (!revealAnswer.value) {
    return '';
  }

  if (choice.correct) {
    return feedbackTone.value === 'correct'
      ? 'choice-card--correct choice-card--correct-impact'
      : 'choice-card--correct choice-card--correct-reveal';
  }

  if (choice.id === selectedChoiceId.value) {
    return 'choice-card--incorrect choice-card--incorrect-impact';
  }

  return 'choice-card--muted';
};

const choiceStateLabel = (choice: QuestionChoice) => {
  if (!revealAnswer.value) {
    return '';
  }

  if (choice.correct) {
    return '正解';
  }

  return choice.id === selectedChoiceId.value ? '選択' : '';
};

const syncSessionRecordBaseline = () => {
  sessionRecordBaseline.value = {
    ...sessionRecordBaseline.value,
    [trainer.game.value.level]: { ...highScores.value[trainer.game.value.level] },
  };
};
const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
const clearUiError = () => {
  uiError.value = null;
};
const applyFatalError = (error: unknown, fallback: string) => {
  fatalError.value = getErrorMessage(error, fallback);
  uiError.value = null;
  trainerAudio.clearPendingQuestionAudio();
};
const applyUiError = (error: unknown, fallback: string) => {
  uiError.value = getErrorMessage(error, fallback);
  trainerAudio.clearPendingQuestionAudio();
};
const scrollPageToTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
};

const requestSessionExit = () => {
  void questionStageRef.value?.requestExit();
};

const selectLevel = async (level: Level) => {
  fatalError.value = null;
  clearUiError();
  void feedbackAudio.playLevelSelectSound();

  try {
    const dateKey = syncLearningProgressDate();
    await trainer.setLevel(level, routeOptions(level));
    initializedRouteDateKey.value = dateKey;
    await nextTick();
    trainerAudio.clearPendingQuestionAudio();
  } catch (error) {
    applyUiError(error, 'レベルの切り替えに失敗しました。');
  }
};

const answer = (choiceId: string) => {
  const questionId = currentQuestionId.value;
  const level = trainer.game.value.level;

  clearUiError();
  trainerAudio.clearPendingQuestionAudio();
  const result = trainer.submitAnswer(choiceId);

  if (questionId) {
    learningProgress.recordAnswer(questionId, level, result.correct);
  }

  if (trainer.game.value.status === 'finished') {
    learningProgress.recordRouteResult(level, {
      score: trainer.game.value.score,
      correctAnswers: trainer.game.value.correctAnswers,
      bestStreak: trainer.game.value.bestStreak,
      completed: trainer.game.value.finishReason === 'route-complete',
    });
    void nextTick(scrollPageToTop);

    void (async () => {
      await feedbackAudio.playGameOverSound();

      if (gameOverCelebrationTone.value !== 'none') {
        await feedbackAudio.playRecordCelebrationSound(gameOverCelebrationTone.value);
      }
    })();
    return;
  }

  void (async () => {
    await feedbackAudio.playFeedbackSound(result.correct);

    if (!result.correct && isCriticalLife.value) {
      await feedbackAudio.playCriticalLifeSound();
    }
  })();
};

const togglePronunciationAudio = () => {
  if (typeof window === 'undefined' || !trainerAudio.speechSupported.value) {
    return;
  }

  if (window.speechSynthesis.speaking || trainerAudio.isSpeaking.value) {
    trainerAudio.clearPendingQuestionAudio();
    return;
  }

  trainerAudio.requestCurrentQuestionAudio();
};

const startSession = async () => {
  if (!canStartSession.value) {
    return;
  }

  fatalError.value = null;
  clearUiError();

  try {
    await ensureCurrentRoute();
  } catch (error) {
    applyUiError(error, 'ゲームの開始に失敗しました。');
    return;
  }

  syncSessionRecordBaseline();
  sessionStartPending.value = false;
  void feedbackAudio.unlockAudioEffects();
  trainerAudio.requestCurrentQuestionAudio();
  void nextTick(scrollPageToTop);
};

const moveToNextQuestion = async () => {
  clearUiError();

  try {
    trainer.nextQuestion();
    await nextTick();
    trainerAudio.requestCurrentQuestionAudio();
    scrollPageToTop();
  } catch (error) {
    applyUiError(error, '次の問題への切り替えに失敗しました。');
  }
};

const resetSession = async () => {
  fatalError.value = null;
  clearUiError();
  const previousSessionStartPending = sessionStartPending.value;
  sessionStartPending.value = true;
  trainerAudio.clearPendingQuestionAudio();

  try {
    const level = trainer.game.value.level;
    const dateKey = syncLearningProgressDate();
    await trainer.resetSession(level, routeOptions(level));
    initializedRouteDateKey.value = dateKey;
    await nextTick();
    scrollPageToTop();
  } catch (error) {
    sessionStartPending.value = previousSessionStartPending;
    applyUiError(error, 'トップへ戻れませんでした。');
  }
};

const restartSession = async () => {
  fatalError.value = null;
  clearUiError();

  try {
    const level = trainer.game.value.level;
    const completed = trainer.game.value.finishReason === 'route-complete';
    const dateKey = completed ? syncLearningProgressDate() : learningProgress.dateKey.value;
    await trainer.resetSession(level, {
      dateKey,
      reviewQuestionIds: completed
        ? learningProgress.getReviewQuestionIds(level)
        : trainer.game.value.reviewQuestionIds,
      routeIndex: completed
        ? learningProgress.completedRouteCounts.value[level]
        : trainer.game.value.routeIndex,
    });
    initializedRouteDateKey.value = dateKey;
    await nextTick();
    syncSessionRecordBaseline();
    sessionStartPending.value = false;
    trainerAudio.requestCurrentQuestionAudio();
    scrollPageToTop();
  } catch (error) {
    applyUiError(error, 'ゲームの再開に失敗しました。');
  }
};

const isInteractiveShortcutTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName));

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return;
  }

  if (isInteractiveShortcutTarget(event.target)) {
    return;
  }

  if (event.key === 'Enter') {
    if (showSessionStart.value && canStartSession.value) {
      event.preventDefault();
      void startSession();
    } else if (answered.value && !isLoading.value && !hasFatalLoadError.value) {
      event.preventDefault();
      void moveToNextQuestion();
    }
    return;
  }

  if (showSessionStart.value || revealAnswer.value || isLoading.value || hasFatalLoadError.value) {
    return;
  }

  const shortcutIndex = Number.parseInt(event.key, 10) - 1;
  const choice = Number.isInteger(shortcutIndex)
    ? currentQuestion.value?.choices[shortcutIndex]
    : undefined;

  if (choice) {
    event.preventDefault();
    answer(choice.id);
  }
};

const handleVisibilityChange = () => {
  if (document.visibilityState !== 'visible' || !sessionStartPending.value) {
    return;
  }

  void ensureCurrentRoute().catch((error) => {
    applyUiError(error, '日付の更新に失敗しました。');
  });
};

onMounted(async () => {
  loadHighScores();
  learningProgress.loadLearningProgress();
  trainerAudio.setup();
  feedbackAudio.setup();
  window.addEventListener('keydown', handleGlobalKeydown);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.speechSynthesis?.addEventListener?.('voiceschanged', trainerAudio.handleVoicesChanged);

  void loadVocabularyMetadata()
    .then((metadata) => {
      vocabularyMetadata.value = metadata;
      metadataStatus.value = 'ready';
    })
    .catch(() => {
      metadataStatus.value = 'failed';
    });

  try {
    const level = trainer.game.value.level;
    await trainer.initialize(level, routeOptions(level));
    initializedRouteDateKey.value = learningProgress.dateKey.value;
  } catch (error) {
    applyFatalError(error, '語彙データの初期化に失敗しました。');
  }
});

watch(
  [score, bestRunStreak, () => trainer.game.value.level] as const,
  ([currentScore, currentBestStreak, currentLevel]) => {
    updateLevelRecord(currentLevel, currentScore, currentBestStreak);
  },
  { flush: 'post' }
);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.speechSynthesis?.removeEventListener?.('voiceschanged', trainerAudio.handleVoicesChanged);
  trainerAudio.dispose();
  feedbackAudio.cleanup();
});

useSeoMeta({
  title: 'LexiFormosa｜今日の10語',
  description: '台湾で使われる繁体字の単語を、1日10問の日本語4択で学べるローカルゲーム。',
});
</script>

<template>
  <main class="page-shell" :class="{ 'page-shell--play': !showSessionStart }">
    <template v-if="showSessionStart">
      <section class="hero-panel hero-panel--start-screen">
        <div class="hero-brand surface-card">
          <div class="hero-topline">
            <p class="eyebrow">LexiFormosa</p>
            <span class="app-version">v{{ appVersion }}</span>
          </div>
          <div>
            <p class="hero-overline">台湾華語を、短く深く。</p>
            <h1>今日の10語</h1>
            <p class="hero-text">1ルート10問。完走するたび、次の10語へ進みます。</p>
          </div>
          <div class="hero-meta">
            <span>{{ vocabularyMetadata?.total?.toLocaleString() ?? '...' }}語収録</span>
            <span>端末内で記録</span>
          </div>
        </div>

        <div class="hero-stats-panel surface-card">
          <div class="panel-heading">
            <p class="panel-kicker">レベル最高記録</p>
            <p>カードからレベルを選べます</p>
          </div>
          <div class="record-grid record-grid--start-screen">
            <button
              v-for="item in highScoreCards"
              :key="item.level"
              class="record-card record-card--desktop"
              :class="{ 'record-card--active': item.active }"
              type="button"
              :aria-pressed="item.active"
              :disabled="trainer.isLoading.value"
              @click="selectLevel(item.level)"
            >
              <span class="record-level">{{ item.label }}</span>
              <span class="record-card__value">{{ item.score }}点</span>
              <span class="record-card__streak">最高 {{ item.streak }}連続</span>
            </button>
          </div>
          <article v-if="activeHighScoreCard" class="record-card record-card--mobile-summary" aria-live="polite">
            <span class="record-level">{{ LEVEL_COPY[trainer.game.value.level].label }}</span>
            <strong>{{ activeHighScoreCard.score }}点</strong>
            <span>最高 {{ activeHighScoreCard.streak }}連続</span>
          </article>
        </div>
      </section>

      <section class="session-module surface-card">
        <div class="session-module__header">
          <p class="panel-kicker">レベルを選ぶ</p>
        </div>
        <div class="session-module__grid">
          <aside class="session-module__levels">
            <div class="level-list">
              <button
                v-for="item in levelCards"
                :key="item.level"
                class="level-card"
                :class="{ 'level-card--active': trainer.game.value.level === item.level }"
                type="button"
                :disabled="trainer.isLoading.value"
                @click="selectLevel(item.level)"
              >
                <span class="level-badge">{{ item.label }}</span>
                <span class="level-count">{{ item.countLabel }}</span>
                <span class="level-short-summary">{{ item.shortSummary }}</span>
                <strong>{{ item.summary }}</strong>
                <span v-if="item.reviewCount > 0" class="level-review-count">復習 {{ item.reviewCount }}語</span>
              </button>
            </div>
          </aside>

          <SessionStartPanel
            :summary-items="sessionStartSummaryItems"
            :can-start-session="canStartSession"
            :load-error="uiError"
            :selected-level-label="selectedLevelCard?.label ?? LEVEL_COPY[trainer.game.value.level].label"
            :selected-level-count-label="selectedLevelWordCountLabel"
            :selected-level-score="currentLevelHighScore.score"
            :selected-level-streak="currentLevelHighScore.streak"
            :review-count="selectedReviewCount"
            :mastered-count="selectedMasteredCount"
            :today-correct="selectedTodayResult?.correctAnswers ?? 0"
            :today-medal-label="selectedTodayMedalLabel"
            :completed-routes="selectedCompletedRoutes"
            :route-number="currentRouteNumber"
            @start="startSession()"
          />
        </div>
      </section>
    </template>

    <section v-else class="workspace-grid workspace-grid--play">
      <section
        class="quiz-panel surface-card"
        :class="{
          'quiz-panel--correct': feedbackTone === 'correct',
          'quiz-panel--incorrect': feedbackTone === 'incorrect',
          'quiz-panel--game-over': isGameOver,
          'quiz-panel--critical': isCriticalLife,
        }"
      >
        <template v-if="hasFatalLoadError">
          <article class="fatal-state">
            <p class="panel-kicker">初期設定</p>
            <h1>辞書データがありません</h1>
            <p>{{ fatalError }}</p>
            <code>npm run setup:data</code>
            <button class="ghost-button" type="button" @click="resetSession()">トップへ戻る</button>
          </article>
        </template>

        <template v-else-if="currentQuestion">
          <QuestionStage
            v-if="!isGameOver"
            ref="questionStageRef"
            :level-label="LEVEL_COPY[currentQuestion.level].label"
            :score="score"
            :streak="streak"
            :remaining-misses="remainingMisses"
            :route-position="routePosition"
            :route-length="routeLength"
            :route-number="currentRouteNumber"
            :answered-rounds="rounds"
            :trad="currentQuestion.trad"
            :katakana-reading="katakanaReading"
            :pinyin-reading="pinyinReading"
            :can-play-audio="canPlayAudio"
            :is-speaking="isSpeaking"
            :critical-life="isCriticalLife"
            :is-review-word="currentQuestionIsReview"
            @toggle-audio="togglePronunciationAudio()"
            @exit="resetSession()"
          />

          <div v-if="!isGameOver" class="choice-grid">
            <button
              v-for="(choice, index) in currentQuestion.choices"
              :key="choice.id"
              class="choice-card"
              :class="choiceClass(choice)"
              type="button"
              :disabled="revealAnswer || isLoading"
              :aria-label="`${index + 1}. ${choice.label}`"
              :aria-keyshortcuts="String(index + 1)"
              @click="answer(choice.id)"
            >
              <span class="choice-card__main">
                <span class="choice-index" aria-hidden="true">{{ index + 1 }}</span>
                <span class="choice-label">{{ choice.label }}</span>
              </span>
              <span v-if="choiceStateLabel(choice)" class="choice-state">
                {{ choiceStateLabel(choice) }}
              </span>
            </button>
          </div>

          <div v-if="showComboTicket" class="combo-ticket" aria-live="polite">
            <component :is="StarIcon" :size="22" weight="fill" aria-hidden="true" />
            <span class="combo-ticket__label">COMBO</span>
            <span class="combo-ticket__copy">{{ comboTicketLabel }}</span>
          </div>

          <GameOverPanel
            v-if="isGameOver"
            :feedback-badge="feedbackBadge"
            :game-over-title="gameOverTitle"
            :game-over-summary="gameOverSummary"
            :celebration-tone="gameOverCelebrationTone"
            :load-error="uiError"
            :score="score"
            :correct-answers="correctAnswers"
            :route-length="routeLength"
            :best-run-streak="bestRunStreak"
            :finish-reason="finishReason"
            :medal-label="gameOverMedalLabel"
            :review-count="selectedReviewCount"
            :current-level-high-score="currentLevelHighScore"
            :game-over-achievements="gameOverAchievements"
            :last-trad="currentQuestion.trad"
            :last-correct-label="trainer.correctChoice.value?.label ?? '不明'"
            :last-selected-label="selectedChoiceLabel"
            @restart="restartSession()"
            @reset="resetSession()"
          />

          <template v-if="!isGameOver">
            <div
              v-if="answered || isLoading || feedbackView.uiError || revealAnswer"
              class="response-panel"
              :class="{ 'response-panel--answer': revealAnswer }"
            >
              <div
                v-if="answered || isLoading || feedbackView.uiError"
                class="feedback-row"
                :class="`feedback-row--${feedbackTone}`"
              >
                <ResultBanner
                  v-if="feedbackView.variant === 'banner'"
                  :tone="feedbackView.tone"
                  :badge="feedbackView.badge"
                  :show-badge="feedbackView.tone === 'loading'"
                  :message="feedbackView.message"
                  :ui-error="feedbackView.uiError"
                />
                <p v-if="learningNote" class="learning-note">{{ learningNote }}</p>
              </div>

              <div v-if="revealAnswer" class="answer-support-row">
                <div class="answer-support-actions">
                  <button
                    class="primary-button"
                    type="button"
                    :disabled="!answered || isLoading"
                    aria-keyshortcuts="Enter"
                    @click="moveToNextQuestion()"
                  >
                    次の問題
                  </button>
                  <button
                    class="ghost-button secondary-action-button"
                    type="button"
                    @click="requestSessionExit()"
                  >
                    トップへ戻る
                  </button>
                </div>
                <LookupPanel :links="externalLookupLinks" />
              </div>
            </div>
          </template>

          <div
            v-if="isGameOver && revealAnswer"
            class="answer-support-row answer-support-row--game-over"
          >
            <LookupPanel :links="externalLookupLinks" secondary />
          </div>
        </template>

        <article v-else class="loading-state" aria-live="polite">
          <p class="panel-kicker">読み込み中</p>
          <strong>問題を準備しています</strong>
        </article>
      </section>
    </section>
  </main>
</template>
