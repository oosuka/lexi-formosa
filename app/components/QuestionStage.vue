<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps<{
  levelLabel: string;
  score: number;
  streak: number;
  remainingMisses: number;
  trad: string;
  katakanaReading: string;
  pinyinReading: string;
  canPlayAudio: boolean;
  isSpeaking: boolean;
  reducedMotion: boolean;
  lowLifeShakeSequence: number;
}>();

const emit = defineEmits<{
  toggleAudio: [];
}>();

const audioButtonLabel = () => (props.isSpeaking ? '音声を停止' : '音声を再生');
const lowLifeShakeActive = ref(false);
let lowLifeShakeTimeout: ReturnType<typeof setTimeout> | null = null;
const LOW_LIFE_SHAKE_DURATION_MS = 420;

const clearLowLifeShake = () => {
  if (lowLifeShakeTimeout) {
    clearTimeout(lowLifeShakeTimeout);
    lowLifeShakeTimeout = null;
  }

  lowLifeShakeActive.value = false;
};

const triggerLowLifeShake = () => {
  if (props.reducedMotion) {
    clearLowLifeShake();
    return;
  }

  clearLowLifeShake();
  lowLifeShakeActive.value = true;
  lowLifeShakeTimeout = setTimeout(() => {
    lowLifeShakeActive.value = false;
    lowLifeShakeTimeout = null;
  }, LOW_LIFE_SHAKE_DURATION_MS);
};

watch(
  () => props.lowLifeShakeSequence,
  (nextLowLifeShakeSequence, previousLowLifeShakeSequence) => {
    if (
      nextLowLifeShakeSequence === previousLowLifeShakeSequence ||
      nextLowLifeShakeSequence === 0 ||
      props.remainingMisses !== 1
    ) {
      return;
    }

    triggerLowLifeShake();
  },
  {
    immediate: true,
  }
);

watch(
  () => props.remainingMisses,
  (nextRemainingMisses) => {
    if (nextRemainingMisses !== 1) {
      clearLowLifeShake();
    }
  }
);

watch(
  () => props.reducedMotion,
  (nextReducedMotion) => {
    if (nextReducedMotion) {
      clearLowLifeShake();
    }
  }
);

onBeforeUnmount(() => {
  clearLowLifeShake();
});
</script>

<template>
  <article class="question-stage" :class="{ 'question-stage--low-life-shake': lowLifeShakeActive }">
    <div class="question-stage__hud">
      <div class="question-stage__meta">
        <span class="question-stage__level">{{ props.levelLabel }}</span>
      </div>

      <dl class="question-stage__stats">
        <div class="question-stage__stat">
          <dt>Score</dt>
          <dd>{{ props.score }}</dd>
        </div>
        <div class="question-stage__stat">
          <dt>Streak</dt>
          <dd>{{ props.streak }}</dd>
        </div>
        <div class="question-stage__stat question-stage__stat--remaining">
          <dt>Life</dt>
          <dd>{{ props.remainingMisses }}</dd>
        </div>
      </dl>
    </div>

    <strong class="question-stage__trad trad-word">{{ props.trad }}</strong>

    <div class="question-stage__readings-bar">
      <div v-if="props.katakanaReading || props.pinyinReading" class="question-stage__readings">
        <p v-if="props.katakanaReading" class="question-stage__reading question-stage__reading--kana">
          {{ props.katakanaReading }}
        </p>
        <p v-if="props.pinyinReading" class="question-stage__reading question-stage__reading--pinyin">
          {{ props.pinyinReading }}
        </p>
      </div>

      <button
        class="audio-button"
        type="button"
        :disabled="!props.canPlayAudio"
        :class="{ 'audio-button--active': props.isSpeaking }"
        :aria-pressed="props.isSpeaking"
        @click="emit('toggleAudio')"
      >
        {{ audioButtonLabel() }}
      </button>
    </div>
  </article>
</template>
