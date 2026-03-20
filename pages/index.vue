<script setup lang="ts">
import { usePreferredReducedMotion } from '@vueuse/core';

import { getScoreForCorrectAnswer, MAX_MISSES_IN_ROW } from '~/composables/useTraditionalTrainer';
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
const HIGH_SCORE_STORAGE_KEY = 'lexi-formosa-high-scores-v2';
type LevelHighScore = {
  score: number;
  streak: number;
};

const createEmptyHighScores = (): Record<Level, LevelHighScore> => ({
  1: { score: 0, streak: 0 },
  2: { score: 0, streak: 0 },
  3: { score: 0, streak: 0 },
});

const speechSupported = ref(false);
const isSpeaking = ref(false);
const preferredVoice = ref<SpeechSynthesisVoice | null>(null);
const audioEffectsSupported = ref(false);
const pendingQuestionAudioId = ref<string | null>(null);
const sessionStartPending = ref(true);
const loadError = ref<string | null>(null);
let utterance: SpeechSynthesisUtterance | null = null;
let audioContext: AudioContext | null = null;
const vocabularyMetadata = ref<VocabularyMetadata | null>(null);
const metadataStatus = ref<'loading' | 'ready' | 'failed'>('loading');
const highScores = ref<Record<Level, LevelHighScore>>(createEmptyHighScores());
const sessionRecordBaseline = ref<Record<Level, LevelHighScore>>(createEmptyHighScores());

const reducedMotion = computed(() => reducedMotionPreference.value === 'reduce');
const currentQuestion = computed(() => trainer.game.value.currentQuestion);
const hasFatalLoadError = computed(() => Boolean(loadError.value && !currentQuestion.value));
const showSessionStart = computed(
  () => sessionStartPending.value && Boolean(currentQuestion.value)
);
const showLevelPanel = computed(
  () => showSessionStart.value || hasFatalLoadError.value || isLoading.value
);
const isGameOver = computed(() => trainer.game.value.status === 'finished');
const isLoading = computed(
  () => !loadError.value && (trainer.isLoading.value || !currentQuestion.value)
);
const score = computed(() => trainer.game.value.score);
const streak = computed(() => trainer.game.value.streak);
const bestRunStreak = computed(() => trainer.game.value.bestStreak);
const missesInRow = computed(() => trainer.game.value.missesInRow);
const remainingMisses = computed(() => Math.max(0, MAX_MISSES_IN_ROW - missesInRow.value));
const rounds = computed(() => trainer.game.value.rounds);
const answered = computed(() => trainer.game.value.status === 'answered');
const revealAnswer = computed(
  () => trainer.game.value.status === 'answered' || trainer.game.value.status === 'finished'
);
const selectedChoiceId = computed(() => trainer.game.value.selectedChoiceId);
const lastCorrect = computed(() => trainer.game.value.lastCorrect);
const currentQuestionId = computed(() => currentQuestion.value?.questionId ?? null);
const pinyinReading = computed(() => formatPinyinReading(currentQuestion.value?.pronunciation));
const katakanaReading = computed(() => formatKatakanaReading(currentQuestion.value?.pronunciation));
const canPlayAudio = computed(() => speechSupported.value && Boolean(currentQuestion.value?.trad));
const currentLevelCard = computed(() => LEVEL_COPY[trainer.game.value.level]);
const currentLevelCount = computed(
  () => vocabularyMetadata.value?.counts[trainer.game.value.level] ?? null
);
const currentLevelCountLabel = computed(() => {
  if (metadataStatus.value === 'failed') {
    return '語数未取得';
  }

  if (currentLevelCount.value === null) {
    return '読み込み中';
  }

  return `${currentLevelCount.value.toLocaleString()}語`;
});
const canStartSession = computed(
  () => showSessionStart.value && !trainer.isLoading.value && Boolean(currentQuestion.value)
);
const startPanelTitle = computed(() =>
  rounds.value > 0 ? '同じレベルでもう一度始める' : 'このレベルで始める'
);
const startPanelCopy = computed(() =>
  speechSupported.value
    ? '始めると、最初の問題を表示して読み上げも始まります。'
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
    active: trainer.game.value.level === level,
  }))
);
const currentLevelHighScore = computed(() => highScores.value[trainer.game.value.level]);
const gameOverAchievements = computed(() => {
  if (!isGameOver.value) {
    return [];
  }

  const baseline = sessionRecordBaseline.value[trainer.game.value.level];
  const achievements: Array<{
    key: 'score' | 'streak';
    badge: string;
    label: string;
    value: number;
    note: string;
    tone: 'new' | 'tie';
  }> = [];

  if (score.value > baseline.score) {
    achievements.push({
      key: 'score',
      badge: 'NEW BEST',
      label: 'Score',
      value: score.value,
      note: '自己ベストを更新',
      tone: 'new',
    });
  } else if (score.value > 0 && score.value === baseline.score) {
    achievements.push({
      key: 'score',
      badge: 'RECORD TIED',
      label: 'Score',
      value: score.value,
      note: '自己ベストと同記録',
      tone: 'tie',
    });
  }

  if (bestRunStreak.value > baseline.streak) {
    achievements.push({
      key: 'streak',
      badge: 'NEW BEST',
      label: 'Streak',
      value: bestRunStreak.value,
      note: '自己ベストを更新',
      tone: 'new',
    });
  } else if (bestRunStreak.value > 0 && bestRunStreak.value === baseline.streak) {
    achievements.push({
      key: 'streak',
      badge: 'RECORD TIED',
      label: 'Streak',
      value: bestRunStreak.value,
      note: '自己ベストと同記録',
      tone: 'tie',
    });
  }

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

  return '3回続けて不正解になったため、ここで終了です。';
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
const feedbackTone = computed(() => {
  if (isLoading.value) {
    return 'loading';
  }

  if (!answered.value) {
    return 'idle';
  }

  return lastCorrect.value ? 'correct' : 'incorrect';
});

const levelCards = computed(() =>
  LEVELS.map((level) => ({
    level,
    ...LEVEL_COPY[level],
    count: vocabularyMetadata.value?.counts[level] ?? null,
    countLabel:
      metadataStatus.value === 'failed'
        ? '語数未取得'
        : vocabularyMetadata.value?.counts[level] === null ||
            vocabularyMetadata.value?.counts[level] === undefined
          ? '読み込み中'
          : `${vocabularyMetadata.value.counts[level].toLocaleString()}語`,
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

const answerMessage = computed(() => {
  if (isLoading.value) {
    return '問題データを読み込んでいます。';
  }

  if (showSessionStart.value) {
    return startPanelCopy.value;
  }

  if (loadError.value) {
    return loadError.value;
  }

  if (isGameOver.value) {
    return '3回続けて不正解でした。';
  }

  if (!answered.value) {
    return '4つの選択肢から、意味に合うものを1つ選んでください。';
  }

  return lastCorrect.value
    ? `正解です。+${getScoreForCorrectAnswer(streak.value)}点`
    : `不正解です。正解は「${trainer.correctChoice.value.label}」です。あと${remainingMisses.value}回で終了`;
});

const feedbackBadge = computed(() => {
  if (feedbackTone.value === 'loading') {
    return 'Loading';
  }

  if (showSessionStart.value) {
    return 'Start';
  }

  if (isGameOver.value) {
    return 'Game Over';
  }

  if (feedbackTone.value === 'correct') {
    return 'Correct';
  }

  if (feedbackTone.value === 'incorrect') {
    return 'Miss';
  }

  return 'Ready';
});

const loadHighScores = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const stored = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);

    if (!stored) {
      return;
    }

    const parsed = JSON.parse(stored) as Partial<Record<Level, unknown>>;
    const next = createEmptyHighScores();

    for (const level of LEVELS) {
      const levelValue = parsed[level];

      if (typeof levelValue === 'number') {
        next[level] = {
          score: Number.isFinite(levelValue) ? levelValue : 0,
          streak: 0,
        };
        continue;
      }

      if (levelValue && typeof levelValue === 'object') {
        const scoreValue = (levelValue as { score?: unknown }).score;
        const streakValue = (levelValue as { streak?: unknown }).streak;

        next[level] = {
          score: Number.isFinite(scoreValue) ? Number(scoreValue) : 0,
          streak: Number.isFinite(streakValue) ? Number(streakValue) : 0,
        };
      }
    }

    highScores.value = next;
  } catch {
    highScores.value = createEmptyHighScores();
  }
};

const saveHighScores = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify(highScores.value));
  } catch {
    // Keep the game playable even when storage is unavailable.
  }
};

const syncSessionRecordBaseline = () => {
  sessionRecordBaseline.value = {
    ...sessionRecordBaseline.value,
    [trainer.game.value.level]: {
      ...highScores.value[trainer.game.value.level],
    },
  };
};

const selectLevel = async (level: Level) => {
  loadError.value = null;

  try {
    await trainer.setLevel(level);
    await nextTick();
    clearPendingQuestionAudio();
    if (!sessionStartPending.value) {
      requestCurrentQuestionAudio();
    }
  } catch (error) {
    applyLoadError(error, 'レベルの切り替えに失敗しました。');
  }
};

const getAudioContext = async () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const BrowserAudioContext =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!BrowserAudioContext) {
    return null;
  }

  audioContext ??= new BrowserAudioContext();

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  return audioContext;
};

const playToneSequence = async (
  tones: Array<{
    frequency: number;
    duration: number;
    gain: number;
    type?: OscillatorType;
  }>
) => {
  const context = await getAudioContext();

  if (!context) {
    return;
  }

  const startAt = context.currentTime + 0.02;

  tones.forEach((tone, index) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const offset = tones.slice(0, index).reduce((sum, item) => sum + item.duration, 0);
    const toneStart = startAt + offset;
    const toneEnd = toneStart + tone.duration;

    oscillator.type = tone.type ?? 'sine';
    oscillator.frequency.setValueAtTime(tone.frequency, toneStart);
    gainNode.gain.setValueAtTime(0.0001, toneStart);
    gainNode.gain.exponentialRampToValueAtTime(tone.gain, toneStart + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, toneEnd);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(toneStart);
    oscillator.stop(toneEnd + 0.02);
  });
};

const playFeedbackSound = async (correct: boolean) => {
  if (!audioEffectsSupported.value) {
    return;
  }

  await playToneSequence(
    correct
      ? [
          { frequency: 660, duration: 0.08, gain: 0.04, type: 'triangle' },
          { frequency: 880, duration: 0.12, gain: 0.05, type: 'triangle' },
          { frequency: 1108, duration: 0.18, gain: 0.04, type: 'sine' },
        ]
      : [
          { frequency: 320, duration: 0.11, gain: 0.045, type: 'sawtooth' },
          { frequency: 240, duration: 0.16, gain: 0.04, type: 'sawtooth' },
        ]
  );
};

const clearPendingQuestionAudio = () => {
  pendingQuestionAudioId.value = null;
  isSpeaking.value = false;

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

const getLoadErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const applyLoadError = (error: unknown, fallback: string) => {
  loadError.value = getLoadErrorMessage(error, fallback);
  clearPendingQuestionAudio();
};

const playCurrentQuestionAudio = () => {
  if (typeof window === 'undefined' || !currentQuestion.value || !speechSupported.value) {
    return;
  }

  syncPreferredVoice();

  utterance = new SpeechSynthesisUtterance(currentQuestion.value.trad);
  utterance.lang = preferredVoice.value?.lang ?? 'zh-TW';
  utterance.rate = 0.82;
  utterance.pitch = 1;

  if (preferredVoice.value) {
    utterance.voice = preferredVoice.value;
  }

  utterance.onstart = () => {
    isSpeaking.value = true;
    pendingQuestionAudioId.value = null;
  };
  utterance.onend = () => {
    isSpeaking.value = false;
  };
  utterance.onerror = () => {
    isSpeaking.value = false;
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
};

const requestCurrentQuestionAudio = () => {
  if (typeof window === 'undefined' || !speechSupported.value || !currentQuestionId.value) {
    clearPendingQuestionAudio();
    return;
  }

  pendingQuestionAudioId.value = currentQuestionId.value;
  playCurrentQuestionAudio();
};

const answer = (choiceId: string) => {
  clearPendingQuestionAudio();
  const result = trainer.submitAnswer(choiceId);
  void playFeedbackSound(result.correct);
};

const syncPreferredVoice = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    preferredVoice.value = null;
    return;
  }

  const voices = window.speechSynthesis.getVoices();
  preferredVoice.value =
    voices.find((voice) => voice.lang.toLowerCase().startsWith('zh-tw')) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('zh-hk')) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('zh')) ??
    null;
};

const handleVoicesChanged = () => {
  syncPreferredVoice();
  if (
    pendingQuestionAudioId.value === currentQuestionId.value &&
    !sessionStartPending.value &&
    !isSpeaking.value &&
    !window.speechSynthesis.speaking
  ) {
    requestCurrentQuestionAudio();
  }
};

const togglePronunciationAudio = () => {
  if (typeof window === 'undefined' || !speechSupported.value) {
    return;
  }

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    isSpeaking.value = false;
    pendingQuestionAudioId.value = null;
    return;
  }

  sessionStartPending.value = false;
  requestCurrentQuestionAudio();
};

const startSession = () => {
  if (!canStartSession.value) {
    return;
  }

  loadError.value = null;
  syncSessionRecordBaseline();
  sessionStartPending.value = false;
  requestCurrentQuestionAudio();
};

const moveToNextQuestion = async () => {
  trainer.nextQuestion();
  await nextTick();
  requestCurrentQuestionAudio();
};

const resetSession = async () => {
  loadError.value = null;
  const previousSessionStartPending = sessionStartPending.value;
  sessionStartPending.value = true;
  clearPendingQuestionAudio();

  try {
    await trainer.resetSession();
    await nextTick();
  } catch (error) {
    sessionStartPending.value = previousSessionStartPending;
    applyLoadError(error, '最初からのやり直しに失敗しました。');
  }
};

const restartSession = async () => {
  loadError.value = null;

  try {
    await trainer.resetSession();
    await nextTick();
    syncSessionRecordBaseline();
    sessionStartPending.value = false;
    requestCurrentQuestionAudio();
  } catch (error) {
    applyLoadError(error, 'ゲームの再開に失敗しました。');
  }
};

onMounted(async () => {
  loadHighScores();

  audioEffectsSupported.value =
    typeof window !== 'undefined' &&
    Boolean(
      window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    );

  if (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  ) {
    speechSupported.value = true;
    syncPreferredVoice();
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
  }

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
    applyLoadError(error, '語彙データの初期化に失敗しました。');
    return;
  }

  sessionStartPending.value = true;
});

watch(
  [score, bestRunStreak, () => trainer.game.value.level] as const,
  ([currentScore, currentBestStreak, currentLevel]) => {
    const currentRecord = highScores.value[currentLevel];
    const nextScore = Math.max(currentRecord.score, currentScore);
    const nextStreak = Math.max(currentRecord.streak, currentBestStreak);

    if (nextScore === currentRecord.score && nextStreak === currentRecord.streak) {
      return;
    }

    highScores.value = {
      ...highScores.value,
      [currentLevel]: {
        score: nextScore,
        streak: nextStreak,
      },
    };
    saveHighScores();
  },
  { flush: 'post' }
);

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
  }

  if (audioContext && audioContext.state !== 'closed') {
    void audioContext.close();
    audioContext = null;
  }
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
            <p class="word-help">{{ loadError }}</p>
            <div class="audio-start-notice">
              <p>初回は辞書データを同梱していません。</p>
              <code>npm run setup:data</code>
            </div>
          </template>
          <template v-else-if="showSessionStart">
            <div class="session-start-panel">
              <div class="session-start-topline">
                <span class="word-chip">{{ currentLevelCard.label }}</span>
                <span class="session-start-mode">{{ startPanelModeLabel }}</span>
              </div>
              <div class="session-start-copy">
                <p class="session-start-kicker">Ready to Launch</p>
                <strong class="session-start-title">{{ startPanelTitle }}</strong>
                <p class="session-start-text">
                  {{ startPanelCopy }}
                </p>
              </div>
              <div class="session-start-meta">
                <span>{{ currentLevelCard.label }}</span>
                <span>
                  {{ currentLevelCountLabel }}
                </span>
                <span>{{ speechSupported ? 'ブラウザ音声あり' : '音声なしで開始' }}</span>
              </div>
              <button
                class="primary-button session-start-button"
                type="button"
                :disabled="!canStartSession"
                @click="startSession()"
              >
                ゲームを始める
              </button>
              <p v-if="loadError" class="session-start-error">{{ loadError }}</p>
            </div>
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

        <template v-if="showSessionStart">
          <div class="session-start-grid">
            <article class="session-start-detail">
              <p class="session-start-detail-label">Session</p>
              <strong>{{ rounds > 0 ? '同じレベルで最初からやり直す' : '最初の1問から始める' }}</strong>
              <p>
                選んだレベルの最初の問題から始まります。3連続正解からスコアにボーナスが付きます。
              </p>
            </article>
            <article class="session-start-detail">
              <p class="session-start-detail-label">Dictionary</p>
              <strong>意味に迷ったら外部辞書で確認できます</strong>
              <p>
                回答後は Google 翻訳と Weblio の確認リンクを下部に表示します。
              </p>
            </article>
          </div>
        </template>
        <template v-else>
          <div class="choice-grid">
            <button
              v-for="choice in currentQuestion?.choices ?? []"
              :key="choice.id"
              class="choice-card"
              :class="choiceClass(choice)"
              type="button"
              :disabled="revealAnswer || isLoading"
              @click="answer(choice.id)"
            >
              <span class="choice-label">{{ choice.label }}</span>
              <span v-if="choiceStateLabel(choice)" class="choice-state">
                {{ choiceStateLabel(choice) }}
              </span>
            </button>
          </div>

          <div v-if="isGameOver" class="game-over-panel">
            <div class="game-over-copy">
              <span class="feedback-pill feedback-pill--game-over">{{ feedbackBadge }}</span>
              <strong class="game-over-title">{{ gameOverTitle }}</strong>
              <p>{{ gameOverSummary }}</p>
              <p v-if="loadError" class="game-over-error">{{ loadError }}</p>
            </div>
            <div class="game-over-stats">
              <div class="game-over-stat">
                <span>この回の得点</span>
                <strong>{{ score }}</strong>
              </div>
              <div class="game-over-stat">
                <span>この回の最高連続</span>
                <strong>{{ bestRunStreak }}</strong>
              </div>
              <div class="game-over-stat game-over-stat--subtle">
                <span>このレベルの最高得点</span>
                <strong>{{ currentLevelHighScore.score }}</strong>
              </div>
              <div class="game-over-stat game-over-stat--subtle">
                <span>このレベルの最高連続</span>
                <strong>{{ currentLevelHighScore.streak }}</strong>
              </div>
            </div>
            <div v-if="gameOverAchievements.length > 0" class="game-over-achievement-grid">
              <article
                v-for="item in gameOverAchievements"
                :key="item.key"
                class="game-over-achievement"
                :class="`game-over-achievement--${item.tone}`"
              >
                <span class="achievement-badge">{{ item.badge }}</span>
                <span class="achievement-label">{{ item.label }}</span>
                <strong class="achievement-value">{{ item.value }}</strong>
                <span class="achievement-note">{{ item.note }}</span>
              </article>
            </div>
            <div class="feedback-actions">
              <button class="primary-button" type="button" @click="restartSession()">
                もう一度始める
              </button>
              <button class="ghost-button" type="button" @click="resetSession()">
                トップへ戻る
              </button>
            </div>
          </div>
          <div
            v-else
            class="feedback-row"
            :class="{
              'feedback-row--correct': feedbackTone === 'correct',
              'feedback-row--incorrect': feedbackTone === 'incorrect',
              'feedback-row--loading': feedbackTone === 'loading',
            }"
          >
            <div class="feedback-copy">
              <span class="feedback-pill" :class="`feedback-pill--${feedbackTone}`">
                {{ feedbackBadge }}
              </span>
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
