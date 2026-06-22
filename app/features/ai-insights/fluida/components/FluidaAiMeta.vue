<script setup lang="ts">
import { useI18n } from "vue-i18n";

import type { FluidaMeta } from "../model/insight-fluida";

const props = defineProps<{
  meta: FluidaMeta;
}>();

const { t } = useI18n();

const provenance = t("insights.fluida.provenance", {
  model: props.meta.model,
  generatedAt: props.meta.generatedAt,
  reference: props.meta.referenceLabel,
});
</script>

<template>
  <footer class="fluida-meta">
    <p class="fluida-meta__text">{{ meta.privacyNote }}</p>
    <p class="fluida-meta__provenance">{{ provenance }}</p>
  </footer>
</template>

<style scoped>
.fluida-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: var(--space-4);
  border-radius: var(--fluida-radius-card);
  background: var(--fluida-surface-2);
}

.fluida-meta__text,
.fluida-meta__provenance {
  margin: 0;
  font-size: var(--fluida-size-caption);
  line-height: var(--fluida-leading-snug);
  color: var(--fluida-muted);
}

.fluida-meta__provenance {
  opacity: 0.85;
}
</style>
