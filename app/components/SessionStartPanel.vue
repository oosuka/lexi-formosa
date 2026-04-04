<script setup lang="ts">
const props = defineProps<{
  levelLabel: string;
  levelSummary: string;
  summaryItems: string[];
  canStartSession: boolean;
  loadError: string | null;
}>();

const emit = defineEmits<{
  start: [];
}>();
</script>

<template>
  <section class="session-start-panel" aria-labelledby="session-start-title">
    <h2 id="session-start-title" class="session-start-title">{{ props.levelLabel }}</h2>

    <p class="session-start-summary-copy">{{ props.levelSummary }}</p>

    <div class="session-start-panel__actions">
      <button
        class="primary-button session-start-button"
        type="button"
        :disabled="!props.canStartSession"
        aria-keyshortcuts="Enter"
        @click="emit('start')"
      >
        ゲームを始める
      </button>
    </div>

    <ul class="session-start-list">
      <li v-for="item in props.summaryItems" :key="item">{{ item }}</li>
    </ul>

    <p v-if="props.loadError" class="session-start-error">{{ props.loadError }}</p>
  </section>
</template>
