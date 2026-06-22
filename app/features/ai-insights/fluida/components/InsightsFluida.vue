<script setup lang="ts">
import { computed, ref } from "vue";

import FluidaAiMeta from "./FluidaAiMeta.vue";
import FluidaAlertList from "./FluidaAlertList.vue";
import FluidaChartBeat from "./FluidaChartBeat.vue";
import FluidaCompareBeat from "./FluidaCompareBeat.vue";
import FluidaLead from "./FluidaLead.vue";
import FluidaMasthead from "./FluidaMasthead.vue";
import FluidaPullStat from "./FluidaPullStat.vue";
import FluidaSeguir from "./FluidaSeguir.vue";
import FluidaStatTiles from "./FluidaStatTiles.vue";
import FluidaTextBeat from "./FluidaTextBeat.vue";
import { useInsightsFluida } from "../composables/use-insights-fluida";
import { useI18n } from "vue-i18n";
import { useTheme } from "~/composables/useTheme";
import { useAIInsights } from "~/features/ai-insights/composables/useAIInsights";

// Real AI source: the shared generated insight carries the additive Fluida
// fields (`paragraphs` / `retro` / `series` / `highlights`). When absent the
// mapper falls back to the mock so the screen is never empty. The /insights hub
// reads the cross-cutting `general` dimension.
const { currentResult } = useAIInsights();
const insight = computed(() => currentResult.value?.fluida ?? null);

const fluida = useInsightsFluida({ insight, dimension: "general" });
const { t } = useI18n();

// Local editorial light/dark scope. Initialised from the global app theme, then
// toggled independently via the masthead without touching the app-wide theme.
const { resolvedTheme } = useTheme();
const schemeOverride = ref<"light" | "dark" | null>(null);
const scheme = computed<"light" | "dark">(
  () => schemeOverride.value ?? (resolvedTheme.value === "dark" ? "dark" : "light"),
);

/**
 * Flips the editorial reading between light and dark, independent of the global
 * app theme. The first toggle pins an explicit scheme; subsequent toggles invert
 * it.
 */
const toggleScheme = (): void => {
  schemeOverride.value = scheme.value === "dark" ? "light" : "dark";
};

const view = fluida.view;

// Beat layout helpers — keep the orchestrator template declarative.
const paragraphs = computed(() => view.value.paragraphs);
const sectionLabels = computed(() => ({
  compare: t("insights.fluida.sections.compare"),
  rhythm: t("insights.fluida.sections.rhythm"),
  alerts: t("insights.fluida.sections.alerts"),
  highlights: t("insights.fluida.sections.highlights"),
}));
</script>

<template>
  <div class="fluida" :data-fluida-scheme="scheme">
    <FluidaMasthead
      :cadence="fluida.cadence.value"
      :theme="fluida.theme.value"
      :tabs="fluida.tabs.value"
      :scheme="scheme"
      @update:cadence="fluida.setCadence"
      @update:theme="fluida.setTheme"
      @toggle-scheme="toggleScheme"
    />

    <div class="fluida__body">
      <article class="fluida__wrap">
        <FluidaLead :lead="view.lead" />

        <!-- General reading: comparison cards + chart + alerts -->
        <template v-if="view.isGeneral">
          <section v-if="view.compare" class="fluida__beat" aria-labelledby="fluida-compare">
            <span id="fluida-compare" class="fluida__kicker">{{ sectionLabels.compare }}</span>
            <FluidaCompareBeat :cards="view.compare" />
          </section>

          <hr class="fluida__divider" >

          <FluidaTextBeat
            v-if="paragraphs[0]"
            :text="paragraphs[0]"
            lead
            :accent-color="view.lead.accentColor"
          />

          <section class="fluida__beat" aria-labelledby="fluida-rhythm">
            <span id="fluida-rhythm" class="fluida__kicker">{{ sectionLabels.rhythm }}</span>
            <FluidaChartBeat :chart="view.chart" :cadence="view.cadence" />
          </section>

          <FluidaTextBeat v-if="paragraphs[1]" :text="paragraphs[1]" />

          <div v-if="paragraphs[2] && view.pullStat" class="fluida__split">
            <FluidaTextBeat :text="paragraphs[2]" />
            <FluidaPullStat :stat="view.pullStat" :accent-color="view.lead.accentColor" />
          </div>
          <FluidaTextBeat v-else-if="paragraphs[2]" :text="paragraphs[2]" />

          <FluidaTextBeat v-if="paragraphs[3]" :text="paragraphs[3]" />

          <section v-if="view.alerts" class="fluida__beat" aria-labelledby="fluida-alerts">
            <span id="fluida-alerts" class="fluida__kicker">{{ sectionLabels.alerts }}</span>
            <FluidaAlertList :alerts="view.alerts" />
          </section>
        </template>

        <!-- Theme reading: numeric tiles + interleaved text/pull-stat -->
        <template v-else>
          <section
            v-if="view.highlights"
            class="fluida__beat"
            aria-labelledby="fluida-highlights"
          >
            <span id="fluida-highlights" class="fluida__kicker">{{
              sectionLabels.highlights
            }}</span>
            <FluidaStatTiles :tiles="view.highlights" />
          </section>

          <hr class="fluida__divider" >

          <FluidaTextBeat
            v-if="paragraphs[0]"
            :text="paragraphs[0]"
            lead
            :accent-color="view.lead.accentColor"
          />

          <div v-if="paragraphs[1] && view.highlights?.[0]" class="fluida__split">
            <FluidaTextBeat :text="paragraphs[1]" />
            <FluidaPullStat :stat="view.highlights[0]" :accent-color="view.lead.accentColor" />
          </div>
          <FluidaTextBeat v-else-if="paragraphs[1]" :text="paragraphs[1]" />

          <FluidaTextBeat v-if="paragraphs[2]" :text="paragraphs[2]" />
        </template>

        <FluidaSeguir :text="view.nextStep" />
        <FluidaAiMeta :meta="view.meta" />
      </article>
    </div>
  </div>
</template>

<style scoped>
.fluida {
  background: var(--fluida-page);
  color: var(--fluida-ink);
  min-height: 100%;
}

.fluida__body {
  padding: var(--space-6) var(--space-5) var(--space-8);
}

.fluida__wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: var(--fluida-max-width);
  margin: 0 auto;
}

.fluida__beat {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.fluida__kicker {
  font-size: var(--fluida-size-label);
  font-weight: var(--fluida-weight-strong);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--fluida-muted);
}

.fluida__divider {
  width: 100%;
  height: 1px;
  margin: 0;
  border: none;
  background: var(--fluida-line-soft);
}

.fluida__split {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: var(--space-5);
  align-items: center;
}

@media (max-width: 720px) {
  .fluida__body {
    padding: var(--space-5) var(--space-4) var(--space-7);
  }

  .fluida__split {
    grid-template-columns: 1fr;
  }
}
</style>
