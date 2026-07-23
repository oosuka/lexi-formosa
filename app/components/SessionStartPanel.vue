<script setup lang="ts">
const props = defineProps<{
  summaryItems: string[];
  canStartSession: boolean;
  loadError: string | null;
  selectedLevelLabel: string;
  selectedLevelCountLabel: string;
  selectedLevelScore: number;
  selectedLevelStreak: number;
  reviewCount: number;
  masteredCount: number;
  todayCorrect: number;
  todayMedalLabel: string;
  completedRoutes: number;
  routeNumber: number;
}>();

const emit = defineEmits<{
  start: [];
}>();

const routeHeading = computed(() =>
  props.completedRoutes > 0 ? '次の10語へ進む。' : '10問だけ、集中して進む。'
);
const startButtonLabel = computed(() =>
  props.completedRoutes > 0 ? '次の10語を始める' : '今日の10語でゲームを始める'
);
</script>

<template>
  <section class="session-start-panel" aria-labelledby="session-start-title">
    <div class="session-start-heading">
      <p class="panel-kicker">今日のルート {{ props.routeNumber }}</p>
      <h2 id="session-start-title">{{ routeHeading }}</h2>
      <p>1ルート10問。完走するたび、次は未出題中心の10語に進みます。</p>
    </div>

    <ol class="route-track route-track--preview" aria-label="10問のルート">
      <li v-for="index in 10" :key="index" class="route-track__slot" aria-hidden="true" />
    </ol>

    <article class="session-start-current-level" aria-live="polite">
      <div class="session-start-current-level__topline">
        <span class="session-start-current-level__level">{{ props.selectedLevelLabel }}</span>
        <span class="session-start-current-level__count">{{ props.selectedLevelCountLabel }}</span>
      </div>
      <div class="session-start-current-level__stats">
        <div class="session-start-current-level__stat">
          <span class="record-stat-label">最高スコア</span>
          <strong>{{ props.selectedLevelScore }}</strong>
        </div>
        <div class="session-start-current-level__stat">
          <span class="record-stat-label">最高連続数</span>
          <strong>{{ props.selectedLevelStreak }}</strong>
        </div>
        <div class="session-start-current-level__stat">
          <span class="record-stat-label">復習待ち</span>
          <strong>{{ props.reviewCount }}</strong>
        </div>
        <div class="session-start-current-level__stat">
          <span class="record-stat-label">定着した語</span>
          <strong>{{ props.masteredCount }}</strong>
        </div>
      </div>
      <p v-if="props.todayCorrect > 0 || props.completedRoutes > 0" class="today-route-result">
        <span>本日 {{ props.completedRoutes }}ルート完走</span>
        <span>ベスト {{ props.todayCorrect }} / 10</span>
        <span v-if="props.todayMedalLabel" class="today-route-result__medal">
          {{ props.todayMedalLabel }}
        </span>
      </p>
    </article>

    <div class="session-start-panel__actions">
      <button
        class="primary-button session-start-button"
        type="button"
        :disabled="!props.canStartSession"
        aria-keyshortcuts="Enter"
        @click="emit('start')"
      >
        {{ startButtonLabel }}
      </button>
      <p>データはこの端末だけに保存されます</p>
    </div>

    <ul class="session-start-list" aria-label="ゲームルール">
      <li v-for="item in props.summaryItems" :key="item">{{ item }}</li>
    </ul>

    <p v-if="props.loadError" class="session-start-error">{{ props.loadError }}</p>
  </section>
</template>
