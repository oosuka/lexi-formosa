<script setup lang="ts">
import type { Level } from '~/types/vocabulary';

type LevelOption = {
  level: Level;
  label: string;
  summary: string;
  countLabel: string;
  active: boolean;
};

const props = defineProps<{
  currentLevelLabel: string;
  currentLevelSummary: string;
  startPanelModeLabel: string;
  startPanelCopy: string;
  currentLevelCountLabel: string;
  levelOptions: LevelOption[];
  bestScore: number;
  bestStreak: number;
  canStartSession: boolean;
  loadError: string | null;
}>();

const emit = defineEmits<{
  start: [];
  'select-level': [level: Level];
}>();
</script>

<template>
  <section class="session-start-panel">
    <div class="session-start-panel__hero">
      <p class="session-start-kicker">Premium Launch Pad</p>
      <h3 class="session-start-heading">Ready to Launch</h3>
      <p class="session-start-text">
        {{ props.startPanelCopy }}
      </p>
    </div>

    <div class="session-start-level-selector" role="tablist" aria-label="Choose level">
      <button
        v-for="option in props.levelOptions"
        :key="option.level"
        class="session-start-level-option"
        :class="{ 'session-start-level-option--active': option.active }"
        type="button"
        role="tab"
        :aria-selected="option.active"
        :data-level-selector="option.level"
        :data-testid="`level-selector-${option.level}`"
        @click="emit('select-level', option.level)"
      >
        <span class="session-start-level-option__label">{{ option.label }}</span>
        <span class="session-start-level-option__summary">{{ option.summary }}</span>
        <span class="session-start-level-option__count">{{ option.countLabel }}</span>
      </button>
    </div>

    <article class="session-start-launch-card">
      <div class="session-start-launch-card__topline">
        <span class="session-start-launch-pill">{{ props.currentLevelLabel }}</span>
        <span class="session-start-launch-mode">{{ props.startPanelModeLabel }}</span>
      </div>

      <strong class="session-start-launch-title">{{ props.currentLevelSummary }}</strong>

      <dl class="session-start-launch-meta" aria-label="Launch settings">
        <div class="session-start-launch-meta-item">
          <dt>Count</dt>
          <dd>{{ props.currentLevelCountLabel }}</dd>
        </div>
        <div class="session-start-launch-meta-item">
          <dt>Mode</dt>
          <dd>{{ props.startPanelModeLabel }}</dd>
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
          Start Session
        </button>
        <p v-if="props.loadError" class="session-start-error">{{ props.loadError }}</p>
      </div>
    </article>

    <div class="session-start-progress-strip" aria-label="Best progress">
      <article class="session-start-progress-item">
        <span class="session-start-progress-label">Best Score</span>
        <strong>{{ props.bestScore }}</strong>
      </article>
      <article class="session-start-progress-item">
        <span class="session-start-progress-label">Best Streak</span>
        <strong>{{ props.bestStreak }}</strong>
      </article>
    </div>
  </section>
</template>
