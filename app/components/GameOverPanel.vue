<script setup lang="ts">
import { PhStar } from '@phosphor-icons/vue';

import type { LevelHighScore } from '~/composables/useHighScores';
import type { GameFinishReason } from '~~/shared/types/vocabulary';

const StarIcon = PhStar;

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
  correctAnswers: number;
  routeLength: number;
  bestRunStreak: number;
  finishReason: GameFinishReason | null;
  medalLabel: string;
  reviewCount: number;
  currentLevelHighScore: LevelHighScore;
  gameOverAchievements: GameOverAchievement[];
  lastTrad: string;
  lastCorrectLabel: string;
  lastSelectedLabel: string | null;
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
const restartLabel = computed(() =>
  props.finishReason === 'route-complete' ? '次の10語へ' : 'この10語に再挑戦'
);
const lastAnswerWasCorrect = computed(() => props.lastSelectedLabel === props.lastCorrectLabel);
</script>

<template>
  <section
    class="game-over-panel"
    :class="{
      'game-over-panel--complete': props.finishReason === 'route-complete',
      'game-over-panel--celebration': props.celebrationTone !== 'none',
    }"
    aria-labelledby="game-over-heading"
  >
    <div class="game-over-copy" aria-live="polite" aria-atomic="true" role="status">
      <p v-if="props.gameOverTitle" class="game-over-kicker">{{ props.gameOverTitle }}</p>
      <strong id="game-over-heading" class="game-over-title">{{ props.feedbackBadge }}</strong>
      <p class="game-over-summary">{{ props.gameOverSummary }}</p>
      <p v-if="props.loadError" class="game-over-error">{{ props.loadError }}</p>
    </div>

    <div v-if="props.medalLabel" class="route-medal">
      <component :is="StarIcon" :size="24" weight="fill" aria-hidden="true" />
      <span>{{ props.medalLabel }}</span>
    </div>

    <section class="game-over-last-answer" aria-labelledby="game-over-last-answer-title">
      <p id="game-over-last-answer-title" class="game-over-section-label">最後の単語</p>
      <div class="game-over-last-answer__grid">
        <div>
          <span>繁体字</span>
          <strong lang="zh-Hant-TW">{{ props.lastTrad }}</strong>
        </div>
        <div>
          <span>正解</span>
          <strong>{{ props.lastCorrectLabel }}</strong>
        </div>
      </div>
      <p
        v-if="props.lastSelectedLabel && !lastAnswerWasCorrect"
        class="game-over-last-answer__selected"
      >
        選んだ答え：{{ props.lastSelectedLabel }}
      </p>
    </section>

    <div class="game-over-summary-grid">
      <article class="game-over-stat game-over-stat--primary">
        <span>正解</span>
        <strong>{{ props.correctAnswers }} / {{ props.routeLength }}</strong>
      </article>
      <article class="game-over-stat game-over-stat--primary">
        <span>スコア</span>
        <strong>{{ props.score }}</strong>
      </article>
      <article class="game-over-stat game-over-stat--primary">
        <span>最高連続</span>
        <strong>{{ props.bestRunStreak }}</strong>
      </article>
    </div>

    <div class="game-over-learning-note">
      <span>復習待ち</span>
      <strong>{{ props.reviewCount }}語</strong>
      <p>次のルートに優先して出題します。</p>
    </div>

    <div class="game-over-level-best">
      <p class="game-over-section-label">レベル最高記録</p>
      <div class="game-over-stats">
        <div
          class="game-over-stat game-over-stat--subtle"
          :class="{
            'game-over-stat--best-new': achievementByKey.score?.tone === 'new',
            'game-over-stat--best-tie': achievementByKey.score?.tone === 'tie',
          }"
        >
          <span>スコア</span>
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
          <span>連続数</span>
          <strong>{{ props.currentLevelHighScore.streak }}</strong>
          <span v-if="achievementByKey.streak" class="game-over-best-status">
            <span class="game-over-best-badge">{{ achievementByKey.streak.badge }}</span>
            <span class="game-over-best-note">{{ achievementByKey.streak.note }}</span>
          </span>
        </div>
      </div>
    </div>

    <div class="game-over-actions">
      <button class="primary-button" type="button" @click="emit('restart')">
        {{ restartLabel }}
      </button>
      <button class="ghost-button secondary-action-button" type="button" @click="emit('reset')">
        トップへ戻る
      </button>
    </div>
  </section>
</template>
