<script setup lang="ts">
import { usePreferredReducedMotion } from '@vueuse/core';

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
const reducedMotionPreference = usePreferredReducedMotion();
const speechSupported = ref(false);
const isSpeaking = ref(false);
const preferredVoice = ref<SpeechSynthesisVoice | null>(null);
const audioEffectsSupported = ref(false);
const pendingQuestionAudioId = ref<string | null>(null);
const audioStartRequired = ref(false);
const loadError = ref<string | null>(null);
let utterance: SpeechSynthesisUtterance | null = null;
let audioContext: AudioContext | null = null;
let pendingAudioRetryTimer: ReturnType<typeof window.setTimeout> | null = null;
const vocabularyMetadata = ref<VocabularyMetadata | null>(null);

const reducedMotion = computed(() => reducedMotionPreference.value === 'reduce');
const currentQuestion = computed(() => trainer.game.value.currentQuestion);
const hasFatalLoadError = computed(() => Boolean(loadError.value && !currentQuestion.value));
const isLoading = computed(
  () => !loadError.value && (trainer.isLoading.value || !currentQuestion.value)
);
const score = computed(() => trainer.game.value.score);
const streak = computed(() => trainer.game.value.streak);
const rounds = computed(() => trainer.game.value.rounds);
const answered = computed(() => trainer.game.value.status === 'answered');
const selectedChoiceId = computed(() => trainer.game.value.selectedChoiceId);
const lastCorrect = computed(() => trainer.game.value.lastCorrect);
const currentQuestionId = computed(() => currentQuestion.value?.questionId ?? null);
const pinyinReading = computed(() => formatPinyinReading(currentQuestion.value?.pronunciation));
const katakanaReading = computed(() => formatKatakanaReading(currentQuestion.value?.pronunciation));
const canPlayAudio = computed(() => speechSupported.value && Boolean(currentQuestion.value?.trad));
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
  }))
);

const choiceClass = (choice: QuestionChoice) => {
  if (!answered.value) {
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
  if (!answered.value) {
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
    return '語彙データを読み込んでいます。';
  }

  if (loadError.value) {
    return loadError.value;
  }

  if (!answered.value) {
    return '正しい日本語を1枚だけ選びます。';
  }

  return lastCorrect.value
    ? '正解です。次の問題でテンポ良く続けられます。'
    : `不正解です。正解は「${trainer.correctChoice.value.label}」です。`;
});

const feedbackBadge = computed(() => {
  if (feedbackTone.value === 'loading') {
    return 'Loading';
  }

  if (feedbackTone.value === 'correct') {
    return 'Correct';
  }

  if (feedbackTone.value === 'incorrect') {
    return 'Miss';
  }

  return 'Ready';
});

const selectLevel = async (level: Level) => {
  loadError.value = null;

  try {
    await trainer.setLevel(level);
    await nextTick();
    requestCurrentQuestionAudio();
  } catch (error) {
    applyLoadError(error, 'レベル切替に失敗しました。');
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

const clearPendingAudioRetry = () => {
  if (pendingAudioRetryTimer) {
    window.clearTimeout(pendingAudioRetryTimer);
    pendingAudioRetryTimer = null;
  }
};

const clearPendingQuestionAudio = () => {
  pendingQuestionAudioId.value = null;
  audioStartRequired.value = false;
  isSpeaking.value = false;
  clearPendingAudioRetry();

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
    audioStartRequired.value = false;
    pendingQuestionAudioId.value = null;
    clearPendingAudioRetry();
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

const requestCurrentQuestionAudio = (userInitiated = false) => {
  if (typeof window === 'undefined' || !speechSupported.value || !currentQuestionId.value) {
    clearPendingQuestionAudio();
    return;
  }

  pendingQuestionAudioId.value = currentQuestionId.value;
  playCurrentQuestionAudio();
  clearPendingAudioRetry();
  if (!userInitiated) {
    pendingAudioRetryTimer = window.setTimeout(() => {
      if (pendingQuestionAudioId.value === currentQuestionId.value && !isSpeaking.value) {
        audioStartRequired.value = true;
      }
    }, 350);
  }
};

const answer = (choiceId: string) => {
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
    !audioStartRequired.value &&
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
    clearPendingAudioRetry();
    return;
  }

  requestCurrentQuestionAudio(true);
};

const moveToNextQuestion = async () => {
  trainer.nextQuestion();
  await nextTick();
  requestCurrentQuestionAudio(true);
};

const resetSession = async () => {
  loadError.value = null;

  try {
    await trainer.resetSession();
    await nextTick();
    requestCurrentQuestionAudio(true);
  } catch (error) {
    applyLoadError(error, 'セッションの初期化に失敗しました。');
  }
};

onMounted(async () => {
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

  const [metadataResult, initializeResult] = await Promise.allSettled([
    loadVocabularyMetadata(),
    trainer.initialize(),
  ]);

  if (metadataResult.status === 'fulfilled') {
    vocabularyMetadata.value = metadataResult.value;
  }

  if (initializeResult.status === 'rejected') {
    applyLoadError(initializeResult.reason, '語彙データの初期化に失敗しました。');
    return;
  }

  await nextTick();
  requestCurrentQuestionAudio();
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
  }

  clearPendingAudioRetry();

  if (audioContext && audioContext.state !== 'closed') {
    void audioContext.close();
    audioContext = null;
  }
});

useSeoMeta({
  title: 'LexiFormosa',
  description: '臺灣華語寄りの繁體字単語を、日本語4択で学べるローカル向けゲーム。',
});
</script>

<template>
  <main class="page-shell" :class="{ 'reduce-motion': reducedMotion }">
    <section class="hero-panel">
      <div class="hero-brand surface-card">
        <p class="eyebrow">Taiwan Traditional Chinese Trainer</p>
        <h1>LexiFormosa</h1>
        <p class="hero-text">
          臺灣で使われる繁體字だけを、日本語4択で磨くローカル学習ゲーム。
          単語のかたち、意味、読みを、静かなテンポで反復できます。
        </p>
        <div class="hero-meta">
          <span>繁體字 only</span>
          <span>{{ vocabularyMetadata?.total?.toLocaleString() ?? '...' }} words</span>
          <span>Local first</span>
        </div>
      </div>

      <div class="hero-stats-panel surface-card">
        <div class="panel-heading">
          <p class="panel-kicker">Session</p>
          <h2>現在の進行</h2>
        </div>
        <div class="hero-stats">
          <article class="metric-card">
            <span class="metric-label">Score</span>
            <strong>{{ score }}</strong>
          </article>
          <article class="metric-card">
            <span class="metric-label">Streak</span>
            <strong>{{ streak }}</strong>
          </article>
          <article class="metric-card">
            <span class="metric-label">Rounds</span>
            <strong>{{ rounds }}</strong>
          </article>
        </div>
      </div>
    </section>

    <section class="workspace-grid">
      <aside class="level-panel surface-card">
        <div class="panel-heading">
          <p class="panel-kicker">Level</p>
          <h2>出題レンジ</h2>
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
                {{ item.count === null ? 'Loading...' : `${item.count.toLocaleString()}語` }}
              </span>
            </div>
            <strong>{{ item.summary }}</strong>
          </button>
        </div>

        <div class="hint-block">
          <p>ルール</p>
          <ul>
            <li>繁體字のみ出題</li>
            <li>正解は4択のうち1つだけ</li>
            <li>正解ごとに10ポイント</li>
          </ul>
        </div>
      </aside>

      <section
        class="quiz-panel surface-card"
        :class="{
          'quiz-panel--correct': feedbackTone === 'correct',
          'quiz-panel--incorrect': feedbackTone === 'incorrect',
        }"
      >
        <div class="panel-heading">
          <p class="panel-kicker">Question</p>
          <h2>この単語の意味は？</h2>
        </div>

        <article class="word-card">
          <template v-if="hasFatalLoadError">
            <div class="word-card-top">
              <span class="word-chip">Setup</span>
              <button class="audio-button" type="button" disabled>音声</button>
            </div>
            <strong class="trad-word trad-word--loading">辞書データ未生成</strong>
            <p class="word-help">{{ loadError }}</p>
            <div class="audio-start-notice">
              <p>clone 直後は辞書データを同梱していません。</p>
              <code>npm run setup:data</code>
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
                {{ isSpeaking ? '停止' : '音声' }}
              </button>
            </div>
            <strong class="trad-word">{{ currentQuestion.trad }}</strong>
            <div v-if="katakanaReading || pinyinReading" class="reading-stack">
              <p v-if="katakanaReading" class="reading-kana">{{ katakanaReading }}</p>
              <p v-if="pinyinReading" class="reading-pinyin">{{ pinyinReading }}</p>
            </div>
            <p class="word-help">臺灣華語寄りの繁體字単語から出題しています。</p>
            <div v-if="audioStartRequired" class="audio-start-notice">
              <p>ブラウザ制限のため、最初の1回だけ音声開始が必要です。</p>
              <button class="ghost-button audio-start-button" type="button" @click="togglePronunciationAudio()">
                音声を開始
              </button>
            </div>
          </template>
          <template v-else>
            <div class="word-card-top">
              <span class="word-chip">Loading</span>
              <button class="audio-button" type="button" disabled>音声</button>
            </div>
            <strong class="trad-word trad-word--loading">準備中</strong>
            <p class="word-help">選択中のレベルの語彙を読み込んでいます。</p>
          </template>
        </article>

        <div class="choice-grid">
          <button
            v-for="choice in currentQuestion?.choices ?? []"
            :key="choice.id"
            class="choice-card"
            :class="choiceClass(choice)"
            type="button"
            :disabled="answered || isLoading"
            @click="answer(choice.id)"
          >
            <span class="choice-label">{{ choice.label }}</span>
            <span v-if="choiceStateLabel(choice)" class="choice-state">
              {{ choiceStateLabel(choice) }}
            </span>
          </button>
        </div>

        <div
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
              リセット
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
      </section>
    </section>
  </main>
</template>
