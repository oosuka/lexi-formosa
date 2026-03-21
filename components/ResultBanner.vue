<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  tone: 'correct' | 'incorrect' | 'loading';
  badge: string;
  message: string;
  uiError?: string | null;
}>();

const toneClass = computed(() => `result-banner--${props.tone}`);
</script>

<template>
  <article class="result-banner" :class="toneClass" aria-live="polite">
    <div class="result-banner__copy">
      <span class="feedback-pill result-banner__badge" :class="`feedback-pill--${props.tone}`">
        {{ props.badge }}
      </span>
      <p v-if="props.uiError" class="result-banner__error">{{ props.uiError }}</p>
      <p class="result-banner__message">{{ props.message }}</p>
    </div>
  </article>
</template>
