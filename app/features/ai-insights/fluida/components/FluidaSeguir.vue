<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  text: string;
}>();

const { t } = useI18n();
</script>

<template>
  <aside class="fluida-seguir">
    <span class="fluida-seguir__eyebrow">{{ t("insights.fluida.nextStep") }}</span>
    <p class="fluida-seguir__text">{{ text }}</p>
  </aside>
</template>

<style scoped>
.fluida-seguir {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5) var(--space-5);
  border-radius: var(--fluida-radius-seguir);
  background: var(--fluida-seguir-grad);
  color: var(--fluida-on-accent);
}

.fluida-seguir__eyebrow {
  position: relative;
  font-size: var(--fluida-size-caption);
  font-weight: var(--fluida-weight-heavy);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.9;
}

.fluida-seguir__text {
  position: relative;
  margin: 0;
  font-size: var(--fluida-size-prose);
  line-height: var(--fluida-leading-lead);
  font-weight: var(--fluida-weight-medium);
}
</style>
