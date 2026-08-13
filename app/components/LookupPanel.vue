<script setup lang="ts">
type LookupLink = {
  id: string;
  label: string;
  href: string;
};

const props = defineProps<{
  links: LookupLink[];
  secondary?: boolean;
}>();
</script>

<template>
  <details
    v-if="props.links.length > 0"
    class="lookup-panel"
    :class="{ 'lookup-panel--secondary': props.secondary }"
  >
    <summary>外部辞書で確認</summary>
    <div class="lookup-links">
      <a
        v-for="link in props.links"
        :key="link.id"
        class="lookup-link"
        :href="link.href"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ link.label }}
      </a>
    </div>
  </details>
</template>
