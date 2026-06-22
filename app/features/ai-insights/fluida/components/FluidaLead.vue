<script setup lang="ts">
import FluidaReadTime from "./FluidaReadTime.vue";
import FluidaSevChip from "./FluidaSevChip.vue";
import type { FluidaLeadView } from "../model/insight-fluida";

defineProps<{
  lead: FluidaLeadView;
}>();
</script>

<template>
  <header class="fluida-lead">
    <div class="fluida-lead__meta">
      <span class="fluida-lead__kicker" :style="{ color: lead.accentColor }">{{
        lead.kicker
      }}</span>
      <FluidaSevChip :severity="lead.severity" />
      <span class="fluida-lead__spacer" />
      <FluidaReadTime :minutes="lead.readMinutes" />
    </div>
    <h1 class="fluida-lead__headline">{{ lead.title }}</h1>
    <p class="fluida-lead__summary">{{ lead.summary }}</p>
  </header>
</template>

<style scoped>
.fluida-lead {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.fluida-lead__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.fluida-lead__kicker {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--fluida-size-kicker);
  font-weight: var(--fluida-weight-heavy);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.fluida-lead__spacer {
  flex: 1;
}

.fluida-lead__headline {
  margin: 0;
  font-family: var(--fluida-font-serif);
  font-size: var(--fluida-size-headline);
  line-height: var(--fluida-leading-headline);
  font-weight: var(--fluida-weight-headline);
  letter-spacing: -0.02em;
  color: var(--fluida-ink);
}

.fluida-lead__summary {
  margin: 0;
  font-size: var(--fluida-size-lead);
  line-height: var(--fluida-leading-lead);
  font-weight: var(--fluida-weight-medium);
  color: var(--fluida-body);
}

@media (max-width: 720px) {
  .fluida-lead__headline {
    font-size: var(--fluida-size-headline-narrow);
  }
}
</style>
