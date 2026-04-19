<script setup lang="ts">
const props = defineProps<{
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
    <h2 id="session-start-title" class="visually-hidden">セッション開始</h2>

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

    <ul class="session-start-list" aria-label="ゲームルール">
      <li v-for="item in props.summaryItems" :key="item">{{ item }}</li>
    </ul>

    <p v-if="props.loadError" class="session-start-error">{{ props.loadError }}</p>
  </section>
</template>
