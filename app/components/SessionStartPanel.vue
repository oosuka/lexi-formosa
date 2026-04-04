<script setup lang="ts">
const props = defineProps<{
  currentLevelLabel: string;
  currentLevelCountLabel: string;
  canStartSession: boolean;
  loadError: string | null;
}>();

const emit = defineEmits<{
  start: [];
}>();
</script>

<template>
  <section class="session-start-panel">
    <div class="session-start-panel__hero">
      <p class="session-start-kicker">Arcade Lobby</p>
      <strong class="session-start-title">準備OK。</strong>
      <div class="session-start-chips" aria-label="選択中の開始条件">
        <span class="session-start-chip">{{ props.currentLevelLabel }}</span>
        <span class="session-start-chip">{{ props.currentLevelCountLabel }}</span>
      </div>
    </div>

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
      <p v-if="props.loadError" class="session-start-error">{{ props.loadError }}</p>
    </div>
  </section>
</template>
