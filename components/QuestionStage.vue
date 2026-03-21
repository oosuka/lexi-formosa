<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  levelLabel: string;
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
</script>

<template>
  <article class="question-stage">
    <div class="question-stage__topline">
      <span class="word-chip">{{ props.levelLabel }}</span>
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

    <strong class="question-stage__trad">{{ props.trad }}</strong>

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
