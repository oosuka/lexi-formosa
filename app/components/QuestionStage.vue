<script setup lang="ts">
import { PhSpeakerHigh } from '@phosphor-icons/vue';

import { MAX_MISSES_IN_ROW } from '~/composables/useTraditionalTrainer';

const SpeakerIcon = PhSpeakerHigh;

const props = defineProps<{
  levelLabel: string;
  score: number;
  streak: number;
  remainingMisses: number;
  routePosition: number;
  routeLength: number;
  routeNumber: number;
  answeredRounds: number;
  trad: string;
  katakanaReading: string;
  pinyinReading: string;
  canPlayAudio: boolean;
  isSpeaking: boolean;
  criticalLife: boolean;
  isReviewWord: boolean;
}>();

const emit = defineEmits<{
  toggleAudio: [];
  exit: [];
}>();

const lifeSlots = computed(() =>
  Array.from({ length: MAX_MISSES_IN_ROW }, (_, index) => ({
    id: `life-${index + 1}`,
    active: index < props.remainingMisses,
  }))
);

const routeSlots = computed(() =>
  Array.from({ length: props.routeLength }, (_, index) => ({
    id: `route-${index + 1}`,
    completed: index < props.answeredRounds,
    current: index === props.routePosition - 1 && index >= props.answeredRounds,
  }))
);

const audioButtonLabel = computed(() => (props.isSpeaking ? '音声を停止' : '音声を再生'));
</script>

<template>
  <article class="question-stage">
    <header class="route-topbar">
      <p class="route-topbar__title">ルート{{ props.routeNumber }}の10語</p>
      <p class="route-topbar__position" aria-live="polite">
        <strong>{{ props.routePosition }}</strong> / {{ props.routeLength }}
      </p>
      <button class="route-exit-button" type="button" @click="emit('exit')">終了</button>
    </header>

    <ol class="route-track" :aria-label="`${props.routeLength}問中${props.routePosition}問目`">
      <li
        v-for="slot in routeSlots"
        :key="slot.id"
        class="route-track__slot"
        :class="{
          'route-track__slot--completed': slot.completed,
          'route-track__slot--current': slot.current,
        }"
        aria-hidden="true"
      />
    </ol>

    <div class="question-stage__hud">
      <p class="question-stage__level">{{ props.levelLabel }}</p>
      <dl class="question-stage__stats">
        <div class="question-stage__stat">
          <dt>スコア</dt>
          <dd>{{ props.score }}</dd>
        </div>
        <div class="question-stage__stat question-stage__stat--streak">
          <dt>連続</dt>
          <dd>{{ props.streak }}</dd>
        </div>
        <div
          class="question-stage__stat question-stage__stat--remaining"
          :class="{ 'question-stage__stat--critical': props.criticalLife }"
        >
          <dt>残り</dt>
          <dd>
            <span class="visually-hidden">残り{{ props.remainingMisses }}回</span>
            <span
              class="life-meter"
              :class="{ 'life-meter--critical': props.criticalLife }"
              role="meter"
              :aria-label="`残り${props.remainingMisses}回`"
              :aria-valuenow="props.remainingMisses"
              :aria-valuemin="0"
              :aria-valuemax="MAX_MISSES_IN_ROW"
            >
              <span
                v-for="slot in lifeSlots"
                :key="slot.id"
                class="life-meter__slot"
                :class="{ 'life-meter__slot--active': slot.active }"
                aria-hidden="true"
              />
            </span>
          </dd>
        </div>
      </dl>
    </div>

    <div class="question-stage__word-focus">
      <span v-if="props.isReviewWord" class="review-word-label">復習語</span>
      <strong class="question-stage__trad trad-word">{{ props.trad }}</strong>

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
        <component :is="SpeakerIcon" :size="22" weight="fill" aria-hidden="true" />
        <span>{{ audioButtonLabel }}</span>
      </button>
    </div>
  </article>
</template>
