<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  levelLabel: string;
  score: number;
  streak: number;
  missesInRow: number;
  maxMisses: number;
  trad: string;
  katakanaReading: string;
  pinyinReading: string;
  canPlayAudio: boolean;
  isSpeaking: boolean;
}>();

const emit = defineEmits<{
  toggleAudio: [];
}>();

const audioButtonLabel = computed(() => (props.isSpeaking ? '停止' : '読み上げ'));
const missLabel = computed(() => `${props.missesInRow} / ${props.maxMisses}`);
</script>

<template>
  <article class="question-stage">
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
        <div class="question-stage__stat">
          <dt>Miss</dt>
          <dd>{{ missLabel }}</dd>
        </div>
      </dl>

      <button
        class="audio-button"
        type="button"
        :disabled="!props.canPlayAudio"
        :class="{ 'audio-button--active': props.isSpeaking }"
        @click="emit('toggleAudio')"
      >
        {{ audioButtonLabel }}
      </button>
    </div>

    <strong class="question-stage__trad trad-word">{{ props.trad }}</strong>

    <div v-if="props.katakanaReading || props.pinyinReading" class="question-stage__readings">
      <p v-if="props.katakanaReading" class="question-stage__reading question-stage__reading--kana">
        {{ props.katakanaReading }}
      </p>
      <p v-if="props.pinyinReading" class="question-stage__reading question-stage__reading--pinyin">
        {{ props.pinyinReading }}
      </p>
    </div>
  </article>
</template>
