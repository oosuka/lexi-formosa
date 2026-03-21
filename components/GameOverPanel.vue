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
  <section class="game-over-panel">
    <div class="game-over-copy">
      <span class="feedback-pill feedback-pill--game-over">{{ props.feedbackBadge }}</span>
      <strong class="game-over-title">{{ props.gameOverTitle }}</strong>
      <p class="game-over-summary">{{ props.gameOverSummary }}</p>
      <p v-if="props.loadError" class="game-over-error">{{ props.loadError }}</p>
    </div>

    <div class="game-over-summary-grid">
      <article class="game-over-stat game-over-stat--primary">
        <span>Score</span>
        <strong>{{ props.score }}</strong>
      </article>
      <article class="game-over-stat game-over-stat--primary">
        <span>Best Streak</span>
        <strong>{{ props.bestRunStreak }}</strong>
      </article>
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
      <button class="primary-button" type="button" @click="emit('restart')">もう一度始める</button>
      <button class="ghost-button" type="button" @click="emit('reset')">トップへ戻る</button>
    </div>
  </section>
</template>
