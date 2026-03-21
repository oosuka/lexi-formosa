<script setup lang="ts">
import { usePreferredReducedMotion } from '@vueuse/core';

import { useFeedbackAudio } from '~/composables/useFeedbackAudio';
import { type LevelHighScore, useHighScores } from '~/composables/useHighScores';
import { useTrainerAudio } from '~/composables/useTrainerAudio';
import { useTrainerSessionUi } from '~/composables/useTrainerSessionUi';
import {
  LEVELS,
  type Level,
  type QuestionChoice,
  type VocabularyMetadata,
} from '~/types/vocabulary';
import { formatKatakanaReading, formatPinyinReading } from '~/utils/pronunciation';
import { LEVEL_COPY } from '~/utils/trainer';
import { loadVocabularyMetadata } from '~/utils/vocabulary';

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
const speechSupported = trainerAudio.speechSupported;
const isSpeaking = trainerAudio.isSpeaking;
const canPlayAudio = computed(
  () => trainerAudio.speechSupported.value && Boolean(currentQuestionTrad.value)
);
const currentLevelCard = computed(() => LEVEL_COPY[trainer.game.value.level]);
const currentLevelCount = computed(
  () => vocabularyMetadata.value?.counts[trainer.game.value.level] ?? null
);
const currentLevelCountLabel = computed(() =>
  formatVocabularyCountLabel(currentLevelCount.value, metadataStatus.value)
);
const sessionUi = useTrainerSessionUi({
  game: trainer.game,
  sessionStartPending,
  fatalError,
  isLoading: pageLoading,
  speechSupported: trainerAudio.speechSupported,
  highScores,
  sessionRecordBaseline,
  correctChoiceLabel: computed(() => trainer.correctChoice.value?.label ?? null),
});
const {
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
  answerMessage,
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

const choiceClass = (choice: QuestionChoice) => {
  if (!revealAnswer.value) {
    return '';
  }

  if (choice.correct) {
    return 'choice-card--correct';
  }

  if (choice.id === selectedChoiceId.value) {
    return 'choice-card--incorrect';
  }

  return 'choice-card--muted';
};

const choiceStateLabel = (choice: QuestionChoice) => {
  if (!revealAnswer.value) {
    return '';
  }

  if (choice.correct) {
    return 'Correct';
  }

  if (choice.id === selectedChoiceId.value) {
    return 'Your Pick';
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

const selectLevel = async (level: Level) => {
  fatalError.value = null;
  clearUiError();

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
  void feedbackAudio.playFeedbackSound(result.correct);
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
  trainerAudio.requestCurrentQuestionAudio();
};

const moveToNextQuestion = async () => {
  clearUiError();

  try {
    trainer.nextQuestion();
    await nextTick();
    trainerAudio.requestCurrentQuestionAudio();
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
  } catch (error) {
    applyUiError(error, 'ゲームの再開に失敗しました。');
  }
};

onMounted(async () => {
  loadHighScores();

  trainerAudio.setup();
  feedbackAudio.setup();
  window.addEventListener('keydown', handleGlobalKeydown);

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
  trainerAudio.cleanup();
  feedbackAudio.cleanup();
});

useSeoMeta({
  title: 'LexiFormosa',
  description: '台湾で使われる繁体字の単語を、日本語4択で学べるローカル向けゲーム。',
});
</script>

<template>
  <main class="page-shell" :class="{ 'reduce-motion': reducedMotion }">
    <section class="hero-panel">
      <div class="hero-brand surface-card">
        <div class="hero-topline">
          <p class="eyebrow">Taiwan Traditional Chinese Trainer</p>
          <span class="app-version">v{{ appVersion }}</span>
        </div>
        <h1>LexiFormosa</h1>
        <p class="hero-text">
          台湾で使われる繁体字の単語を、日本語の4択で学べるローカル用ゲームです。<br />
          文字の形、意味、読み方を、落ち着いたテンポで繰り返し確認できます。
        </p>
        <div class="hero-meta">
          <span>繁体字のみ</span>
          <span>{{ vocabularyMetadata?.total?.toLocaleString() ?? '...' }}語収録</span>
          <span>ローカル動作</span>
        </div>
      </div>

      <div class="hero-stats-panel surface-card">
        <div class="panel-heading">
          <p class="panel-kicker">{{ sessionPanelKicker }}</p>
          <h2>{{ sessionPanelTitle }}</h2>
        </div>
        <div v-if="showSessionStart" class="record-grid">
          <article
            v-for="item in highScoreCards"
            :key="item.level"
            class="record-card"
            :class="{ 'record-card--active': item.active }"
          >
            <div class="record-card-topline">
              <span class="record-level">{{ item.label }}</span>
              <span v-if="item.active" class="record-current">Current</span>
            </div>
            <div class="record-stats">
              <div class="record-stat">
                <span class="record-stat-label">Best Score</span>
                <strong>{{ item.score }}</strong>
              </div>
              <div class="record-stat">
                <span class="record-stat-label">Best Streak</span>
                <strong>{{ item.streak }}</strong>
              </div>
            </div>
          </article>
        </div>
        <div v-else class="hero-stats">
          <article v-for="item in sessionMetricCards" :key="item.id" class="metric-card">
            <span class="metric-label">{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <span class="metric-help">{{ item.help }}</span>
          </article>
        </div>
      </div>
    </section>

    <section class="workspace-grid" :class="{ 'workspace-grid--focus': !showLevelPanel }">
      <aside v-if="showLevelPanel" class="level-panel surface-card">
        <div class="panel-heading">
          <p class="panel-kicker">Level</p>
          <h2>出題レベル</h2>
        </div>

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
                {{ item.countLabel }}
              </span>
            </div>
            <strong>{{ item.summary }}</strong>
          </button>
        </div>

        <div class="hint-block">
          <p>ルール</p>
          <ul>
            <li>すべて繁体字の単語</li>
            <li>正解は4択のうち1つだけ</li>
            <li>3回続けて間違えると終了</li>
            <li>正解で10点<br />3連続正解からボーナス</li>
          </ul>
        </div>
      </aside>

      <section
        class="quiz-panel surface-card"
        :class="{
          'quiz-panel--correct': feedbackTone === 'correct',
          'quiz-panel--incorrect': feedbackTone === 'incorrect',
          'quiz-panel--game-over': isGameOver,
        }"
      >
        <div class="panel-heading">
          <p class="panel-kicker">Question</p>
          <h2>この単語の意味は？</h2>
        </div>

        <article class="word-card">
          <template v-if="hasFatalLoadError">
            <div class="word-card-top">
              <span class="word-chip">初期設定</span>
              <button class="audio-button" type="button" disabled>読み上げ</button>
            </div>
            <strong class="trad-word trad-word--loading">辞書データがありません</strong>
            <p class="word-help">{{ fatalError }}</p>
            <div class="audio-start-notice">
              <p>初回は辞書データを同梱していません。</p>
              <code>npm run setup:data</code>
            </div>
          </template>
          <template v-else-if="showSessionStart">
            <SessionStartPanel
              :current-level-label="currentLevelCard.label"
              :start-panel-mode-label="startPanelModeLabel"
              :start-panel-title="startPanelTitle"
              :start-panel-copy="startPanelCopy"
              :current-level-count-label="currentLevelCountLabel"
              :speech-supported="speechSupported"
              :can-start-session="canStartSession"
              :load-error="uiError"
              :has-previous-rounds="rounds > 0"
              @start="startSession()"
            />
          </template>
          <template v-else-if="currentQuestion">
            <div class="word-card-top">
              <span class="word-chip">{{ LEVEL_COPY[currentQuestion.level].label }}</span>
              <button
                class="audio-button"
                type="button"
                :disabled="!canPlayAudio"
                :class="{ 'audio-button--active': isSpeaking }"
                @click="togglePronunciationAudio()"
              >
                {{ isSpeaking ? '停止' : '読み上げ' }}
              </button>
            </div>
            <strong class="trad-word">{{ currentQuestion.trad }}</strong>
            <div v-if="katakanaReading || pinyinReading" class="reading-stack">
              <p v-if="katakanaReading" class="reading-kana">{{ katakanaReading }}</p>
              <p v-if="pinyinReading" class="reading-pinyin">{{ pinyinReading }}</p>
            </div>
          </template>
          <template v-else>
            <div class="word-card-top">
              <span class="word-chip">読み込み中</span>
              <button class="audio-button" type="button" disabled>読み上げ</button>
            </div>
            <strong class="trad-word trad-word--loading">問題を準備しています</strong>
            <p class="word-help">選択したレベルの単語を読み込んでいます。</p>
          </template>
        </article>

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
            :load-error="uiError"
            :score="score"
            :best-run-streak="bestRunStreak"
            :current-level-high-score="currentLevelHighScore"
            :game-over-achievements="gameOverAchievements"
            @restart="restartSession()"
            @reset="resetSession()"
          />
          <div
            v-else
            class="feedback-row"
            :class="{
              'feedback-row--correct': feedbackTone === 'correct',
              'feedback-row--incorrect': feedbackTone === 'incorrect',
              'feedback-row--loading': feedbackTone === 'loading',
            }"
          >
            <div class="feedback-copy" aria-live="polite">
              <span class="feedback-pill" :class="`feedback-pill--${feedbackTone}`">
                {{ feedbackBadge }}
              </span>
              <p v-if="uiError" class="feedback-error">{{ uiError }}</p>
              <p>{{ answerMessage }}</p>
            </div>
            <div class="feedback-actions">
              <button
                class="ghost-button"
                type="button"
                :disabled="trainer.isLoading.value || hasFatalLoadError"
                @click="resetSession()"
              >
                最初からやり直す
              </button>
              <button
                class="primary-button"
                type="button"
                :disabled="!answered || isLoading"
                aria-keyshortcuts="Enter"
                @click="moveToNextQuestion()"
              >
                次の問題
              </button>
            </div>
          </div>
          <div v-if="revealAnswer && externalLookupLinks.length > 0" class="lookup-panel">
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
        </template>
      </section>
    </section>
  </main>
</template>
