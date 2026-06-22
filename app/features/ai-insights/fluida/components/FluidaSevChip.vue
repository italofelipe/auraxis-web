<script setup lang="ts">
import { computed } from "vue";

import type { FluidaSeverityPresentation } from "../model/insight-fluida";

const props = defineProps<{
  severity: FluidaSeverityPresentation;
}>();

const toneClass = computed(() => `fluida-sev-chip--${props.severity.tone}`);
</script>

<template>
  <span class="fluida-sev-chip" :class="toneClass">{{ severity.label }}</span>
</template>

<style scoped>
.fluida-sev-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  white-space: nowrap;
  padding: 3px var(--space-2);
  border-radius: var(--fluida-radius-pill);
  font-size: var(--fluida-size-kicker);
  font-weight: var(--fluida-weight-strong);
}

.fluida-sev-chip--success {
  color: var(--fluida-pos);
  background: var(--fluida-sev-ok-bg);
}

.fluida-sev-chip--warning {
  color: var(--fluida-warn);
  background: var(--fluida-sev-warn-bg);
}

.fluida-sev-chip--danger {
  color: var(--fluida-neg);
  background: var(--fluida-sev-alert-bg);
}

.fluida-sev-chip--neutral {
  color: var(--fluida-muted);
  background: var(--fluida-surface-2);
}
</style>
