<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import FluidaCadenceToggle from "./FluidaCadenceToggle.vue";
import FluidaThemeTabs from "./FluidaThemeTabs.vue";
import type { FluidaCadence, FluidaThemeId, FluidaThemeMeta } from "../model/insight-fluida";

const props = defineProps<{
  cadence: FluidaCadence;
  theme: FluidaThemeId;
  tabs: readonly FluidaThemeMeta[];
  scheme: "light" | "dark";
}>();

const emit = defineEmits<{
  (event: "update:cadence", value: FluidaCadence): void;
  (event: "update:theme", value: FluidaThemeId): void;
  (event: "toggle-scheme"): void;
}>();

const { t } = useI18n();

const cadenceSubtitle = computed(() =>
  props.cadence === "daily"
    ? t("insights.fluida.cadence.dailyReading")
    : t("insights.fluida.cadence.weeklyReading"),
);

const schemeToggleLabel = computed(() =>
  props.scheme === "dark" ? t("insights.fluida.theme.toLight") : t("insights.fluida.theme.toDark"),
);
</script>

<template>
  <header class="fluida-masthead">
    <div class="fluida-masthead__inner">
      <div class="fluida-masthead__top">
        <div class="fluida-masthead__brand">
          <span class="fluida-masthead__mark" aria-hidden="true">AI</span>
          <span class="fluida-masthead__brand-copy">
            <span class="fluida-masthead__brand-name">{{ t("insights.fluida.brand") }}</span>
            <span class="fluida-masthead__brand-sub">{{ cadenceSubtitle }}</span>
          </span>
        </div>
        <div class="fluida-masthead__controls">
          <FluidaCadenceToggle
            :cadence="cadence"
            @update:cadence="emit('update:cadence', $event)"
          />
          <button
            type="button"
            class="fluida-masthead__scheme"
            :title="schemeToggleLabel"
            :aria-label="schemeToggleLabel"
            @click="emit('toggle-scheme')"
          >
            <span aria-hidden="true">{{ scheme === "dark" ? "☀" : "☾" }}</span>
          </button>
        </div>
      </div>
      <FluidaThemeTabs :tabs="tabs" :active="theme" @update:active="emit('update:theme', $event)" />
    </div>
  </header>
</template>

<style scoped>
.fluida-masthead {
  position: sticky;
  top: 0;
  z-index: 5;
  border-bottom: 1px solid var(--fluida-line);
  background: var(--fluida-surface);
  padding: var(--space-4) var(--space-5);
}

.fluida-masthead__inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 940px;
  margin: 0 auto;
}

.fluida-masthead__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.fluida-masthead__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.fluida-masthead__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--fluida-radius-chip);
  background: var(--fluida-brand);
  color: var(--fluida-on-accent);
  font-size: var(--fluida-size-caption);
  font-weight: var(--fluida-weight-heavy);
}

.fluida-masthead__brand-copy {
  display: flex;
  flex-direction: column;
}

.fluida-masthead__brand-name {
  font-size: var(--fluida-size-section);
  font-weight: var(--fluida-weight-heavy);
  letter-spacing: -0.02em;
  color: var(--fluida-ink);
}

.fluida-masthead__brand-sub {
  font-size: var(--fluida-size-caption);
  color: var(--fluida-muted);
}

.fluida-masthead__controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.fluida-masthead__scheme {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--fluida-radius-pill);
  border: 1px solid var(--fluida-line);
  background: var(--fluida-surface);
  color: var(--fluida-body);
  font-size: var(--fluida-size-prose);
  cursor: pointer;
  box-shadow: var(--fluida-shadow);
  transition: transform var(--motion-fast), background var(--motion-fast);
}

.fluida-masthead__scheme:hover {
  transform: translateY(-1px);
}

@media (max-width: 720px) {
  .fluida-masthead {
    position: static;
  }

  .fluida-masthead__top {
    flex-wrap: wrap;
  }
}
</style>
