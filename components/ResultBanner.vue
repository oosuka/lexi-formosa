<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  tone: 'correct' | 'incorrect' | 'loading';
  badge: string;
  message: string;
  uiError?: string | null;
}>();

const toneClass = computed(() => `result-banner--${props.tone}`);
const impactClass = computed(() => {
  if (props.tone === 'correct') {
    return 'result-banner--correct-impact';
  }

  if (props.tone === 'incorrect') {
    return 'result-banner--incorrect-impact';
  }

  return null;
});
</script>

<template>
  <article
    class="result-banner result-banner--embedded"
    :class="[toneClass, impactClass]"
    aria-live="polite"
  >
    <div class="result-banner__copy">
      <span class="feedback-pill result-banner__badge" :class="`feedback-pill--${props.tone}`">
        {{ props.badge }}
      </span>
      <p v-if="props.uiError" class="result-banner__error">{{ props.uiError }}</p>
      <p class="result-banner__message">{{ props.message }}</p>
    </div>
  </article>
</template>
