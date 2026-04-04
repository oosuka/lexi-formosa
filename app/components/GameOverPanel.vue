<script setup lang="ts">
import type { LevelHighScore } from '~/composables/useHighScores';

type GameOverAchievement = {
  key: 'score' | 'streak';
  badge: string;
  label: string;
  value: number;
  note: string;
  tone: 'new' | 'tie';
};

const props = defineProps<{
  feedbackBadge: string;
  gameOverTitle: string;
  gameOverSummary: string;
  celebrationTone: 'none' | 'single' | 'double';
  loadError: string | null;
  score: number;
  bestRunStreak: number;
  currentLevelHighScore: LevelHighScore;
  gameOverAchievements: GameOverAchievement[];
}>();

const emit = defineEmits<{
  restart: [];
  reset: [];
}>();
</script>

<template>
  <section
    class="game-over-panel"
    :class="{
      'game-over-panel--celebration': props.celebrationTone !== 'none',
      'game-over-panel--celebration-double': props.celebrationTone === 'double',
    }"
  >
    <div class="game-over-copy">
      <p v-if="props.celebrationTone !== 'none'" class="game-over-celebration-badge">
        {{ props.celebrationTone === 'double' ? 'Double Record' : 'New Record' }}
      </p>
      <p v-if="props.gameOverTitle" class="game-over-kicker">{{ props.gameOverTitle }}</p>
      <strong class="game-over-title">{{ props.feedbackBadge }}</strong>
      <p class="game-over-summary">{{ props.gameOverSummary }}</p>
      <p v-if="props.loadError" class="game-over-error">{{ props.loadError }}</p>
    </div>

    <div class="game-over-level-best">
      <p class="game-over-section-label">This Session</p>
      <div class="game-over-summary-grid">
        <article class="game-over-stat game-over-stat--primary">
          <span>Score</span>
          <strong>{{ props.score }}</strong>
        </article>
        <article class="game-over-stat game-over-stat--primary">
          <span>Streak</span>
          <strong>{{ props.bestRunStreak }}</strong>
        </article>
      </div>
    </div>

    <div class="game-over-level-best">
      <p class="game-over-section-label">Level Best</p>
      <div class="game-over-stats">
        <div class="game-over-stat game-over-stat--subtle">
          <span>Score</span>
          <strong>{{ props.currentLevelHighScore.score }}</strong>
        </div>
        <div class="game-over-stat game-over-stat--subtle">
          <span>Streak</span>
          <strong>{{ props.currentLevelHighScore.streak }}</strong>
        </div>
      </div>
    </div>

    <div v-if="props.gameOverAchievements.length > 0" class="game-over-achievement-grid">
      <article
        v-for="item in props.gameOverAchievements"
        :key="item.key"
        class="game-over-achievement"
        :class="`game-over-achievement--${item.tone}`"
      >
        <span class="achievement-badge">{{ item.badge }}</span>
        <span class="achievement-label">{{ item.label }}</span>
        <strong class="achievement-value">{{ item.value }}</strong>
        <span class="achievement-note">{{ item.note }}</span>
      </article>
    </div>

    <div class="game-over-actions">
      <button class="ghost-button ghost-button--subtle" type="button" @click="emit('reset')">
        トップへ戻る
      </button>
      <button class="primary-button" type="button" @click="emit('restart')">もう一度始める</button>
    </div>
  </section>
</template>
