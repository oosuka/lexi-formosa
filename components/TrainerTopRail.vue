<script setup lang="ts">
const props = defineProps<{
  levelLabel: string;
  score: number;
  streak: number;
  missesInRow: number;
}>();
</script>

<template>
  <div class="trainer-top-rail">
    <div class="trainer-top-rail__meta">
      <span class="trainer-top-rail__eyebrow">Level</span>
      <strong class="trainer-top-rail__level">{{ props.levelLabel }}</strong>
    </div>

    <dl class="trainer-top-rail__stats">
      <div class="trainer-top-rail__stat">
        <dt>Score</dt>
        <dd>{{ props.score }}</dd>
      </div>
      <div class="trainer-top-rail__stat">
        <dt>Streak</dt>
        <dd>{{ props.streak }}</dd>
      </div>
      <div class="trainer-top-rail__stat">
        <dt>Miss</dt>
        <dd>{{ props.missesInRow }}</dd>
      </div>
    </dl>
  </div>
</template>
