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
  <section class="session-start-panel">
    <div class="session-start-panel__lead">
      <p class="session-start-kicker">Focused Learning Desk</p>
      <strong class="session-start-title">{{ props.startPanelTitle }}</strong>
      <p class="session-start-text">
        {{ props.startPanelCopy }}
      </p>
    </div>
    <dl class="session-start-meta" aria-label="Session settings">
      <div class="session-start-meta-item">
        <dt>Level</dt>
        <dd>{{ props.currentLevelLabel }}</dd>
      </div>
      <div class="session-start-meta-item">
        <dt>Count</dt>
        <dd>{{ props.currentLevelCountLabel }}</dd>
      </div>
      <div class="session-start-meta-item">
        <dt>Sound</dt>
        <dd>{{ props.startPanelModeLabel }}</dd>
        <span class="session-start-meta-note">
          {{ props.speechSupported ? 'ブラウザ音声あり' : '音声なしで開始' }}
        </span>
      </div>
    </dl>

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

    <div class="session-start-support">
      <article class="session-start-detail">
        <p class="session-start-detail-label">Session</p>
        <strong>{{ props.hasPreviousRounds ? '同じレベルで最初からやり直す' : '最初の1問から始める' }}</strong>
        <p>選んだレベルの最初の問題から始まります。3連続正解からスコアにボーナスが付きます。</p>
      </article>
      <article class="session-start-detail">
        <p class="session-start-detail-label">Records</p>
        <strong>開始前の記録は左のサイドパネルで確認できます</strong>
        <p>レベルごとの最高得点と最高連続数を、学習の前後で見比べられます。</p>
      </article>
    </div>
  </section>
</template>
