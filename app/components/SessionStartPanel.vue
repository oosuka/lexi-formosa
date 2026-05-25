<script setup lang="ts">
const props = defineProps<{
  summaryItems: string[];
  canStartSession: boolean;
  loadError: string | null;
  selectedLevelLabel: string;
  selectedLevelCountLabel: string;
  selectedLevelScore: number;
  selectedLevelStreak: number;
}>();

const emit = defineEmits<{
  start: [];
}>();
</script>

<template>
  <section class="session-start-panel" aria-labelledby="session-start-title">
    <h2 id="session-start-title" class="visually-hidden">セッション開始</h2>

    <article class="session-start-current-level" aria-live="polite">
      <div class="session-start-current-level__topline">
        <span class="session-start-current-level__level">{{ props.selectedLevelLabel }}</span>
        <span class="session-start-current-level__count">{{ props.selectedLevelCountLabel }}</span>
      </div>
      <div class="session-start-current-level__stats">
        <div class="session-start-current-level__stat">
          <span class="record-stat-label">Best Score</span>
          <strong>{{ props.selectedLevelScore }}</strong>
        </div>
        <div class="session-start-current-level__stat">
          <span class="record-stat-label">Best Streak</span>
          <strong>{{ props.selectedLevelStreak }}</strong>
        </div>
      </div>
    </article>

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

    <div class="session-start-rules">
      <ul class="session-start-list" aria-label="ゲームルール">
        <li v-for="item in props.summaryItems" :key="item">{{ item }}</li>
      </ul>
    </div>

    <p v-if="props.loadError" class="session-start-error">{{ props.loadError }}</p>
  </section>
</template>
