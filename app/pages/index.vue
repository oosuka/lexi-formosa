<script setup lang="ts">
import { usePreferredReducedMotion } from '@vueuse/core';

import { useFeedbackAudio } from '~/composables/useFeedbackAudio';
import { type LevelHighScore, useHighScores } from '~/composables/useHighScores';
import { useTraditionalTrainer } from '~/composables/useTraditionalTrainer';
import { useTrainerAudio } from '~/composables/useTrainerAudio';
import { useTrainerSessionUi } from '~/composables/useTrainerSessionUi';
import { formatKatakanaReading, formatPinyinReading } from '~/utils/pronunciation';
import { LEVEL_COPY } from '~/utils/trainer';
import { loadVocabularyMetadata } from '~/utils/vocabulary';
import {
  LEVELS,
  type Level,
  type QuestionChoice,
  type VocabularyMetadata,
} from '~~/shared/types/vocabulary';

const trainer = useTraditionalTrainer();
const appVersion = useRuntimeConfig().public.appVersion;
const reducedMotionPreference = usePreferredReducedMotion();
type MetadataStatus = 'loading' | 'ready' | 'failed';

const formatVocabularyCountLabel = (
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

const sessionStartPending = ref(true);
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

const reducedMotion = computed(() => reducedMotionPreference.value === 'reduce');
const currentQuestion = computed(() => trainer.game.value.currentQuestion);
const currentQuestionTrad = computed(() => currentQuestion.value?.trad ?? null);
const pageLoading = computed(
  () => !fatalError.value && (trainer.isLoading.value || !currentQuestion.value)
);
const selectedChoiceId = computed(() => trainer.game.value.selectedChoiceId);
const currentQuestionId = computed(() => currentQuestion.value?.questionId ?? null);
const pinyinReading = computed(() => formatPinyinReading(currentQuestion.value?.pronunciation));
const katakanaReading = computed(() => formatKatakanaReading(currentQuestion.value?.pronunciation));
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
  '4択から1つ選択',
  '正解で10点獲得',
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
  remainingMisses,
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
const levelCards = computed(() =>
  LEVELS.map((level) => ({
    level,
    ...LEVEL_COPY[level],
    count: vocabularyMetadata.value?.counts[level] ?? null,
    countLabel: formatVocabularyCountLabel(
      vocabularyMetadata.value?.counts[level],
      metadataStatus.value
    ),
  }))
);
const activeHighScoreCard = computed(
  () => highScoreCards.value.find((item) => item.active) ?? highScoreCards.value[0] ?? null
);
const selectedLevelCard = computed(
  () =>
    levelCards.value.find((item) => item.level === trainer.game.value.level) ??
    levelCards.value[0] ??
    null
);
const selectedLevelWordCountLabel = computed(() =>
  formatVocabularyWordsLabel(
    vocabularyMetadata.value?.counts[trainer.game.value.level],
    metadataStatus.value
  )
);
const isCriticalLife = computed(
  () => remainingMisses.value === 1 && !showSessionStart.value && !isGameOver.value
);

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

  if (choice.id === selectedChoiceId.value) {
    return '選択';
  }

  return '';
};

const syncSessionRecordBaseline = () => {
  sessionRecordBaseline.value = {
    ...sessionRecordBaseline.value,
    [trainer.game.value.level]: {
      ...highScores.value[trainer.game.value.level],
    },
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
  if (typeof window === 'undefined') {
    return;
  }

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
};

const selectLevel = async (level: Level) => {
  fatalError.value = null;
  clearUiError();
  void feedbackAudio.playLevelSelectSound();

  try {
    await trainer.setLevel(level);
    await nextTick();
    trainerAudio.clearPendingQuestionAudio();
    if (!sessionStartPending.value) {
      trainerAudio.requestCurrentQuestionAudio();
    }
  } catch (error) {
    applyUiError(error, 'レベルの切り替えに失敗しました。');
  }
};

const answer = (choiceId: string) => {
  clearUiError();
  trainerAudio.clearPendingQuestionAudio();
  const result = trainer.submitAnswer(choiceId);

  if (trainer.game.value.status === 'finished') {
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

  sessionStartPending.value = false;
  trainerAudio.requestCurrentQuestionAudio();
};

const startSession = () => {
  if (!canStartSession.value) {
    return;
  }

  fatalError.value = null;
  clearUiError();
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
      startSession();
      return;
    }

    if (answered.value && !isLoading.value && !hasFatalLoadError.value) {
      event.preventDefault();
      void moveToNextQuestion();
    }

    return;
  }

  if (showSessionStart.value || revealAnswer.value || isLoading.value || hasFatalLoadError.value) {
    return;
  }

  const shortcutIndex = Number.parseInt(event.key, 10) - 1;

  if (!Number.isInteger(shortcutIndex) || shortcutIndex < 0) {
    return;
  }

  const choice = currentQuestion.value?.choices[shortcutIndex];

  if (!choice) {
    return;
  }

  event.preventDefault();
  answer(choice.id);
};

const resetSession = async () => {
  fatalError.value = null;
  clearUiError();
  const previousSessionStartPending = sessionStartPending.value;
  sessionStartPending.value = true;
  trainerAudio.clearPendingQuestionAudio();

  try {
    await trainer.resetSession();
    await nextTick();
    scrollPageToTop();
  } catch (error) {
    sessionStartPending.value = previousSessionStartPending;
    applyUiError(error, '最初からのやり直しに失敗しました。');
  }
};

const restartSession = async () => {
  fatalError.value = null;
  clearUiError();

  try {
    await trainer.resetSession();
    await nextTick();
    syncSessionRecordBaseline();
    sessionStartPending.value = false;
    trainerAudio.requestCurrentQuestionAudio();
    scrollPageToTop();
  } catch (error) {
    applyUiError(error, 'ゲームの再開に失敗しました。');
  }
};

const handleSpeechVoicesChanged = () => {
  trainerAudio.handleVoicesChanged();
};

onMounted(async () => {
  loadHighScores();

  trainerAudio.setup();
  feedbackAudio.setup();
  window.addEventListener('keydown', handleGlobalKeydown);
  window.speechSynthesis?.addEventListener?.('voiceschanged', handleSpeechVoicesChanged);

  void loadVocabularyMetadata()
    .then((metadata) => {
      vocabularyMetadata.value = metadata;
      metadataStatus.value = 'ready';
    })
    .catch(() => {
      metadataStatus.value = 'failed';
    });

  try {
    await trainer.initialize();
  } catch (error) {
    applyFatalError(error, '語彙データの初期化に失敗しました。');
    return;
  }

  sessionStartPending.value = true;
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
  window.speechSynthesis?.removeEventListener?.('voiceschanged', handleSpeechVoicesChanged);
  trainerAudio.dispose();
  feedbackAudio.cleanup();
});

useSeoMeta({
  title: 'LexiFormosa',
  description: '台湾で使われる繁体字の単語を、日本語4択で学べるローカル向けゲーム。',
});
</script>

<template>
  <main
    class="page-shell"
    :class="{ 'page-shell--play': !showSessionStart, 'reduce-motion': reducedMotion }"
  >
    <section v-if="showSessionStart" class="hero-panel hero-panel--start-screen">
      <div
        class="hero-brand surface-card hero-brand--start-screen"
      >
        <div class="hero-topline">
          <p class="eyebrow">Taiwanese Trainer</p>
          <span class="app-version">v{{ appVersion }}</span>
        </div>
        <h1>LexiFormosa</h1>
        <p class="hero-text">
          台湾華語の繁体字単語を、日本語4択で練習。
        </p>
        <div class="hero-meta">
          <span>{{ vocabularyMetadata?.total?.toLocaleString() ?? '...' }}語収録</span>
          <span>ローカル動作</span>
        </div>
      </div>

      <div class="hero-stats-panel surface-card hero-stats-panel--start-screen">
        <div class="panel-heading">
          <p class="panel-kicker">RECORDS</p>
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
            <div class="record-card-topline">
              <span class="record-level">{{ item.label }}</span>
            </div>
            <div class="record-stats record-stats--start-screen">
              <div class="record-stat">
                <span class="record-stat-label">最高スコア</span>
                <strong>{{ item.score }}</strong>
              </div>
              <div class="record-stat">
                <span class="record-stat-label">最高連続数</span>
                <strong>{{ item.streak }}</strong>
              </div>
            </div>
          </button>
        </div>
        <article v-if="activeHighScoreCard" class="record-card record-card--mobile-summary" aria-live="polite">
          <div class="record-mobile-score">
            <span class="record-stat-label">最高スコア</span>
            <strong>{{ activeHighScoreCard.score }}</strong>
          </div>
          <div class="record-mobile-streak">
            <span class="record-stat-label">最高連続数</span>
            <strong>{{ activeHighScoreCard.streak }}</strong>
          </div>
        </article>
      </div>
    </section>

    <section v-if="showSessionStart" class="session-module surface-card">
      <div class="session-module__header">
        <p class="panel-kicker">PLAY</p>
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
              <div class="level-card-topline">
                <span class="level-badge">{{ item.label }}</span>
                <span class="level-count">
                  {{ formatVocabularyWordsLabel(item.count, metadataStatus) }}
                </span>
              </div>
              <strong>{{ item.summary }}</strong>
            </button>
          </div>
        </aside>

        <SessionStartPanel
          :summary-items="sessionStartSummaryItems"
          :can-start-session="canStartSession"
          :load-error="uiError"
          :selected-level-label="
            selectedLevelCard?.label ?? LEVEL_COPY[trainer.game.value.level].label
          "
          :selected-level-count-label="selectedLevelWordCountLabel"
          :selected-level-score="currentLevelHighScore.score"
          :selected-level-streak="currentLevelHighScore.streak"
          @start="startSession()"
        />
      </div>
    </section>

    <section v-else class="workspace-grid workspace-grid--play">
      <section
        class="quiz-panel surface-card"
        :class="{
          'quiz-panel--lobby': showSessionStart,
          'quiz-panel--correct': feedbackTone === 'correct',
          'quiz-panel--correct-impact': feedbackTone === 'correct',
          'quiz-panel--incorrect': feedbackTone === 'incorrect',
          'quiz-panel--incorrect-impact': feedbackTone === 'incorrect',
          'quiz-panel--game-over': isGameOver,
          'quiz-panel--critical': isCriticalLife,
        }"
      >
        <template v-if="hasFatalLoadError">
          <article class="question-stage">
            <div class="question-stage__topline">
              <span class="word-chip">初期設定</span>
              <button class="audio-button" type="button" disabled>読み上げ</button>
            </div>
            <strong class="question-stage__trad question-stage__trad--loading">辞書データがありません</strong>
            <p class="question-stage__help">{{ fatalError }}</p>
            <div class="audio-start-notice">
              <p>初回は辞書データを同梱していません。</p>
              <code>npm run setup:data</code>
            </div>
          </article>
        </template>
        <template v-else-if="currentQuestion">
          <QuestionStage
            :level-label="LEVEL_COPY[currentQuestion.level].label"
            :score="score"
            :streak="streak"
            :remaining-misses="remainingMisses"
            :trad="currentQuestion.trad"
            :katakana-reading="katakanaReading"
            :pinyin-reading="pinyinReading"
            :can-play-audio="canPlayAudio"
            :is-speaking="isSpeaking"
            :critical-life="isCriticalLife"
            @toggle-audio="togglePronunciationAudio()"
          />
        </template>
        <template v-else>
          <article class="question-stage">
            <div class="question-stage__topline">
              <span class="word-chip">読み込み中</span>
              <button class="audio-button" type="button" disabled>読み上げ</button>
            </div>
            <strong class="question-stage__trad question-stage__trad--loading">問題を準備しています</strong>
            <p class="question-stage__help">選択したレベルの単語を読み込んでいます。</p>
          </article>
        </template>

        <template v-if="currentQuestion && !showSessionStart && !hasFatalLoadError">
          <div class="choice-grid">
            <button
              v-for="(choice, index) in currentQuestion?.choices ?? []"
              :key="choice.id"
              class="choice-card"
              :class="choiceClass(choice)"
              type="button"
              :disabled="revealAnswer || isLoading"
              :aria-label="`${index + 1}. ${choice.label}`"
              :aria-keyshortcuts="String(index + 1)"
              @click="answer(choice.id)"
            >
              <span class="choice-label">{{ choice.label }}</span>
              <span v-if="choiceStateLabel(choice)" class="choice-state">
                {{ choiceStateLabel(choice) }}
              </span>
            </button>
          </div>

          <GameOverPanel
            v-if="isGameOver"
            :feedback-badge="feedbackBadge"
            :game-over-title="gameOverTitle"
            :game-over-summary="gameOverSummary"
            :celebration-tone="gameOverCelebrationTone"
            :load-error="uiError"
            :score="score"
            :best-run-streak="bestRunStreak"
            :current-level-high-score="currentLevelHighScore"
            :game-over-achievements="gameOverAchievements"
            @restart="restartSession()"
            @reset="resetSession()"
          />
          <div
            v-else-if="answered || isLoading || feedbackView.uiError"
            class="feedback-row"
            :class="{
              'feedback-row--embedded': true,
              'feedback-row--stacked': true,
              'feedback-row--correct': feedbackTone === 'correct',
              'feedback-row--incorrect': feedbackTone === 'incorrect',
              'feedback-row--loading': feedbackTone === 'loading',
            }"
          >
            <ResultBanner
              v-if="feedbackView.variant === 'banner'"
              :tone="feedbackView.tone"
              :badge="feedbackView.badge"
              :show-badge="feedbackView.tone === 'loading'"
              :message="feedbackView.message"
              :ui-error="feedbackView.uiError"
            />
            <div v-else class="feedback-copy feedback-copy--idle feedback-copy--embedded" aria-live="polite">
              <p class="feedback-copy__message">{{ feedbackView.message }}</p>
              <p v-if="feedbackView.uiError" class="feedback-error">{{ feedbackView.uiError }}</p>
            </div>
          </div>
          <div v-if="revealAnswer" class="answer-support-row">
            <div v-if="externalLookupLinks.length > 0" class="lookup-panel">
              <p class="lookup-panel-label">外部辞書で確認</p>
              <div class="lookup-links">
                <a
                  v-for="link in externalLookupLinks"
                  :key="link.id"
                  class="ghost-button lookup-link"
                  :href="link.href"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ link.label }}
                </a>
              </div>
            </div>
            <div v-if="!isGameOver" class="answer-support-actions">
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
                class="ghost-button ghost-button--subtle secondary-action-button"
                type="button"
                :disabled="trainer.isLoading.value || hasFatalLoadError"
                @click="resetSession()"
              >
                トップへ戻る
              </button>
            </div>
          </div>
        </template>
      </section>
    </section>
  </main>
</template>
