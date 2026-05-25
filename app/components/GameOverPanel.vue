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

const achievementByKey = computed(
  () =>
    Object.fromEntries(props.gameOverAchievements.map((item) => [item.key, item])) as Partial<
      Record<GameOverAchievement['key'], GameOverAchievement>
    >
);
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

    <div
      v-if="props.gameOverAchievements.length > 0"
      class="game-over-level-best"
    >
      <p class="game-over-section-label">Level Best</p>
      <div class="game-over-stats">
        <div
          class="game-over-stat game-over-stat--subtle"
          :class="{
            'game-over-stat--best-new': achievementByKey.score?.tone === 'new',
            'game-over-stat--best-tie': achievementByKey.score?.tone === 'tie',
          }"
        >
          <span>Score</span>
          <strong>{{ props.currentLevelHighScore.score }}</strong>
          <span v-if="achievementByKey.score" class="game-over-best-status">
            <span class="game-over-best-badge">{{ achievementByKey.score.badge }}</span>
            <span class="game-over-best-note">{{ achievementByKey.score.note }}</span>
          </span>
        </div>
        <div
          class="game-over-stat game-over-stat--subtle"
          :class="{
            'game-over-stat--best-new': achievementByKey.streak?.tone === 'new',
            'game-over-stat--best-tie': achievementByKey.streak?.tone === 'tie',
          }"
        >
          <span>Streak</span>
          <strong>{{ props.currentLevelHighScore.streak }}</strong>
          <span v-if="achievementByKey.streak" class="game-over-best-status">
            <span class="game-over-best-badge">{{ achievementByKey.streak.badge }}</span>
            <span class="game-over-best-note">{{ achievementByKey.streak.note }}</span>
          </span>
        </div>
      </div>
    </div>
    <div v-else class="game-over-level-best game-over-level-best--compact">
      <p class="game-over-section-label">Level Best</p>
      <div class="game-over-compact-best">
        <span>Score {{ props.currentLevelHighScore.score }}</span>
        <span>Streak {{ props.currentLevelHighScore.streak }}</span>
      </div>
    </div>

    <div class="game-over-actions">
      <button class="primary-button" type="button" @click="emit('restart')">もう一度始める</button>
      <button
        class="ghost-button ghost-button--subtle secondary-action-button"
        type="button"
        @click="emit('reset')"
      >
        トップへ戻る
      </button>
    </div>
  </section>
</template>
