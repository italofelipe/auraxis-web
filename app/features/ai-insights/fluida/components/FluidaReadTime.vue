<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  minutes: number;
}>();

const { t } = useI18n();
</script>

<template>
  <span class="fluida-read-time">{{ t("insights.fluida.readTime", { min: minutes }) }}</span>
</template>

<style scoped>
.fluida-read-time {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  white-space: nowrap;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--fluida-radius-pill);
  background: var(--fluida-brand-soft);
  color: var(--fluida-brand);
  font-size: var(--fluida-size-caption);
  font-weight: var(--fluida-weight-strong);
}
</style>
