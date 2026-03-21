<script setup lang="ts">
const props = defineProps<{
  currentLevelLabel: string;
  startPanelModeLabel: string;
  startPanelTitle: string;
  startPanelCopy: string;
  currentLevelCountLabel: string;
  speechSupported: boolean;
  canStartSession: boolean;
  loadError: string | null;
  hasPreviousRounds: boolean;
}>();

const emit = defineEmits<{
  start: [];
}>();
</script>

<template>
  <div class="session-start-panel">
    <div class="session-start-topline">
      <span class="word-chip">{{ props.currentLevelLabel }}</span>
      <span class="session-start-mode">{{ props.startPanelModeLabel }}</span>
    </div>
    <div class="session-start-copy">
      <p class="session-start-kicker">Ready to Launch</p>
      <strong class="session-start-title">{{ props.startPanelTitle }}</strong>
      <p class="session-start-text">
        {{ props.startPanelCopy }}
      </p>
    </div>
    <div class="session-start-meta">
      <span>{{ props.currentLevelLabel }}</span>
      <span>{{ props.currentLevelCountLabel }}</span>
      <span>{{ props.speechSupported ? 'ブラウザ音声あり' : '音声なしで開始' }}</span>
    </div>
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

  <div class="session-start-grid">
    <article class="session-start-detail">
      <p class="session-start-detail-label">Session</p>
      <strong>{{ props.hasPreviousRounds ? '同じレベルで最初からやり直す' : '最初の1問から始める' }}</strong>
      <p>選んだレベルの最初の問題から始まります。3連続正解からスコアにボーナスが付きます。</p>
    </article>
    <article class="session-start-detail">
      <p class="session-start-detail-label">Dictionary</p>
      <strong>意味に迷ったら外部辞書で確認できます</strong>
      <p>回答後は Google 翻訳と Weblio の確認リンクを下部に表示します。</p>
    </article>
  </div>
</template>
