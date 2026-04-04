<script setup lang="ts">
import { computed } from 'vue';

const summaryMeta = computed(() =>
  props.levelSummary
    .split('。')
    .map((item) => item.trim())
    .filter(Boolean)
);

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
    <div class="session-start-panel__header">
      <h2 id="session-start-title" class="session-start-title">{{ props.levelLabel }}</h2>

      <div class="session-start-panel__actions session-start-panel__actions--align-end">
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
    </div>

    <div class="session-start-meta" aria-label="選択中レベルの要約">
      <span v-for="item in summaryMeta" :key="item" class="session-start-meta-item">{{ item }}</span>
    </div>

    <ul class="session-start-list">
      <li v-for="item in props.summaryItems" :key="item">{{ item }}</li>
    </ul>

    <p v-if="props.loadError" class="session-start-error">{{ props.loadError }}</p>
  </section>
</template>
