<script setup lang="ts">
import { computed } from "vue";
import {
  NAlert,
  NButton,
  NCheckbox,
  NForm,
  NFormItem,
  NInputNumber,
  NSpace,
  NThing,
} from "naive-ui";

import { useToolPage } from "~/features/tools/composables/use-tool-page";
import {
  CDB_TABLE_YEAR,
  calculateCdbLciLca,
  createDefaultCdbLciLcaFormState,
  validateCdbLciLcaForm,
  type CdbLciLcaFormState,
  type CdbLciLcaResult,
} from "~/features/tools/model/cdb-lci-lca";
import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import ToolSaveResult from "~/components/tool/ToolSaveResult/ToolSaveResult.vue";
import UiStickySummaryCard from "~/components/ui/UiStickySummaryCard/UiStickySummaryCard.vue";
import UiPageHeader from "~/components/ui/UiPageHeader/UiPageHeader.vue";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";

definePageMeta({ layout: false });

const {
  t,
  router,
  isAuthenticated,
  hasPremiumAccess,
  formatBrl,
  form,
  validationError,
  isDirty,
  patch,
  reset,
  setValidationError,
  result,
  savedSimulationId,
  goalAdded,
  saveSimulationMutation,
  createGoalMutation,
  handleSaveSimulation,
  handleAddAsGoal,
  isBridging,
  isSaved,
} = useToolPage<CdbLciLcaFormState, CdbLciLcaResult>({
  createDefaultState: createDefaultCdbLciLcaFormState,
  buildSimulationPayload: ({ form, result, t }) => ({
    toolId: "cdb-lci-lca",
    ruleVersion: "2026.04",
    metadata: { label: t("cdbLciLca.simulation.defaultName", { year: new Date().getFullYear() }) },
    inputs: { ...form },
    result: {
      bestOption: result.bestOption,
      cdbNetAmount: result.cdb.netAmount,
      lciNetAmount: result.lci.netAmount,
      lcaNetAmount: result.lca.netAmount,
      poupancaNetAmount: result.poupanca.netAmount,
    },
  }),
  getGoalPayload: ({ result, t }) => ({
    name: t("cdbLciLca.simulation.goalName"),
    target_amount: Math.max(
      result.cdb.netAmount,
      result.lci.netAmount,
      result.lca.netAmount,
      result.poupanca.netAmount,
    ),
  }),
});

useSeoMeta({
  title: t("cdbLciLca.seo.title"),
  description: t("cdbLciLca.seo.description"),
  ogTitle: t("cdbLciLca.seo.ogTitle"),
  ogDescription: t("cdbLciLca.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

/**
 * Formats a decimal rate as a percentage string with 2 decimal places.
 *
 * @param rate - Decimal rate (e.g. 0.175).
 * @returns Formatted percentage string (e.g. "17.50%").
 */
function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

/**
 * Validates the form and triggers the calculation when valid.
 */
function handleCalculate(): void {
  const errors = validateCdbLciLcaForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`cdbLciLca.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalAdded.value = false;
  result.value = calculateCdbLciLca(form.value);
}

/**
 * Resets the form to its initial state and clears the result.
 */
function handleReset(): void {
  reset();
  result.value = null;
  savedSimulationId.value = null;
  goalAdded.value = false;
}

const bestNetAmount = computed<number>(() => {
  if (!result.value) { return 0; }
  const candidates = [
    result.value.cdb.netAmount,
    result.value.lci.netAmount,
    result.value.lca.netAmount,
  ].filter((v) => v > 0);
  return Math.max(...candidates, result.value.poupanca.netAmount);
});

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    { label: t("cdbLciLca.results.cdbNet"), value: formatBrl(result.value.cdb.netAmount) },
    { label: t("cdbLciLca.results.lciNet"), value: formatBrl(result.value.lci.netAmount) },
    { label: t("cdbLciLca.results.lcaNet"), value: formatBrl(result.value.lca.netAmount) },
    { label: t("cdbLciLca.results.poupancaNet"), value: formatBrl(result.value.poupanca.netAmount) },
  ];
});
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root. -->
  <div class="cdb-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="cdb-page cdb-page--authenticated">
      <div class="cdb-page__layout">
        <!-- Form column -->
        <div class="cdb-page__form-col">
          <UiPageHeader
            :title="t('cdbLciLca.hero.title')"
            :subtitle="t('cdbLciLca.hero.subtitle')"
          />

          <UiGlassPanel class="cdb-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('cdbLciLca.form.sectionInvestment')">
                <NFormItem :label="t('cdbLciLca.form.amount')">
                  <NInputNumber
                    :value="form.amount"
                    :placeholder="t('cdbLciLca.form.amountPlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ amount: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('cdbLciLca.form.termDays')">
                  <NInputNumber
                    :value="form.termDays"
                    :min="1"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ termDays: v ?? 365 })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <CalculatorFormSection :title="t('cdbLciLca.form.sectionRates')">
                <NFormItem :label="t('cdbLciLca.form.cdbRatePct')">
                  <NInputNumber
                    :value="form.cdbRatePct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ cdbRatePct: v })"
                  />
                  <p class="cdb-page__hint">{{ t('cdbLciLca.form.cdbRateHint') }}</p>
                </NFormItem>

                <NFormItem :label="t('cdbLciLca.form.lciRatePct')">
                  <NInputNumber
                    :value="form.lciRatePct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ lciRatePct: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('cdbLciLca.form.lcaRatePct')">
                  <NInputNumber
                    :value="form.lcaRatePct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ lcaRatePct: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('cdbLciLca.form.cdiRatePct')">
                  <NInputNumber
                    :value="form.cdiRatePct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ cdiRatePct: v ?? 10.65 })"
                  />
                  <p class="cdb-page__hint">{{ t('cdbLciLca.form.cdiHint') }}</p>
                </NFormItem>

                <NFormItem :label="t('cdbLciLca.form.selicRatePct')">
                  <NInputNumber
                    :value="form.selicRatePct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ selicRatePct: v ?? 10.75 })"
                  />
                  <p class="cdb-page__hint">{{ t('cdbLciLca.form.selicHint') }}</p>
                </NFormItem>

                <NFormItem :label="t('cdbLciLca.form.ipcaRatePct')">
                  <NInputNumber
                    :value="form.ipcaRatePct"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ ipcaRatePct: v ?? 4.5 })"
                  />
                </NFormItem>

                <NFormItem>
                  <NCheckbox
                    :checked="form.includeIof"
                    @update:checked="(v) => patch({ includeIof: v })"
                  >
                    {{ t('cdbLciLca.form.includeIof') }}
                  </NCheckbox>
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="form.includeIof" type="warning" style="margin-top:12px">
                {{ t('cdbLciLca.form.iofDisclaimer') }}
              </NAlert>

              <NAlert v-if="validationError" type="warning" style="margin-top:12px">
                {{ validationError }}
              </NAlert>

              <div class="cdb-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('cdbLciLca.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :loading="isBridging" :style="{ flex: 1 }">
                  {{ t('cdbLciLca.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Results column -->
        <div class="cdb-page__results-col">
          <UiStickySummaryCard v-if="result">
            <CalculatorResultSummary
              :label="t('cdbLciLca.results.bestOption', { name: result.bestOption })"
              :value="formatBrl(bestNetAmount)"
              :metrics="summaryMetrics"
            />

            <ToolSaveResult
              intent="goal"
              :label="t('cdbLciLca.hero.title')"
              :amount="bestNetAmount"
            />

            <NSpace vertical style="margin-top: 16px">
              <NButton
                v-if="isAuthenticated"
                :loading="saveSimulationMutation.isPending.value"
                :disabled="isSaved"
                block
                @click="handleSaveSimulation"
              >
                {{ isSaved ? t('cdbLciLca.actions.saved') : t('cdbLciLca.actions.save') }}
              </NButton>

              <NButton
                v-if="hasPremiumAccess"
                :loading="createGoalMutation.isPending.value"
                :disabled="goalAdded"
                block
                type="warning"
                @click="handleAddAsGoal"
              >
                {{ goalAdded ? t('cdbLciLca.actions.goalAdded') : t('cdbLciLca.actions.addAsGoal') }}
              </NButton>

              <NThing
                v-if="isAuthenticated && !hasPremiumAccess"
                :title="t('cdbLciLca.premiumCta.title')"
                :description="t('cdbLciLca.premiumCta.description')"
              >
                <template #footer>
                  <NButton size="small" type="warning" @click="router.push('/subscription')">
                    {{ t('cdbLciLca.premiumCta.upgrade') }}
                  </NButton>
                </template>
              </NThing>
            </NSpace>
          </UiStickySummaryCard>

          <template v-if="result">
            <!-- Ranking -->
            <UiSurfaceCard>
              <p class="cdb-page__section-title">{{ t('cdbLciLca.results.rankingTitle') }}</p>
              <div class="cdb-page__ranking">
                <div
                  v-for="(entry, idx) in result.ranking"
                  :key="entry.name"
                  class="cdb-page__ranking-row"
                  :class="{ 'cdb-page__ranking-row--best': idx === 0 }"
                >
                  <span class="cdb-page__ranking-position">{{ idx + 1 }}.</span>
                  <span class="cdb-page__ranking-name">{{ entry.name }}</span>
                  <span class="cdb-page__ranking-amount">{{ formatBrl(entry.netAmount) }}</span>
                </div>
              </div>
            </UiSurfaceCard>

            <!-- CDB detail -->
            <UiSurfaceCard v-if="form.cdbRatePct !== null">
              <p class="cdb-page__section-title">{{ t('cdbLciLca.results.cdbDetail') }}</p>
              <div class="cdb-page__breakdown">
                <div class="cdb-page__breakdown-row">
                  <span>{{ t('cdbLciLca.results.grossReturn') }}</span>
                  <span>{{ formatBrl(result.cdb.grossReturn) }}</span>
                </div>
                <div class="cdb-page__breakdown-row cdb-page__breakdown-row--deduction">
                  <span>{{ t('cdbLciLca.results.irAmount', { rate: formatPct(result.cdb.irRate) }) }}</span>
                  <span>− {{ formatBrl(result.cdb.irAmount) }}</span>
                </div>
                <div class="cdb-page__breakdown-row cdb-page__breakdown-row--net">
                  <span>{{ t('cdbLciLca.results.netReturn') }}</span>
                  <span class="cdb-page__value--positive">{{ formatBrl(result.cdb.netReturn) }}</span>
                </div>
                <div class="cdb-page__breakdown-row">
                  <span>{{ t('cdbLciLca.results.realReturn') }}</span>
                  <span>{{ formatPct(result.cdb.realReturn) }}</span>
                </div>
              </div>
            </UiSurfaceCard>

            <!-- LCI/LCA detail -->
            <UiSurfaceCard v-if="form.lciRatePct !== null || form.lcaRatePct !== null">
              <p class="cdb-page__section-title">{{ t('cdbLciLca.results.exemptDetail') }}</p>
              <div class="cdb-page__breakdown">
                <template v-if="form.lciRatePct !== null">
                  <div class="cdb-page__breakdown-row cdb-page__breakdown-row--label">
                    <span>LCI</span>
                  </div>
                  <div class="cdb-page__breakdown-row">
                    <span>{{ t('cdbLciLca.results.grossReturn') }}</span>
                    <span>{{ formatBrl(result.lci.grossReturn) }}</span>
                  </div>
                  <div class="cdb-page__breakdown-row cdb-page__breakdown-row--net">
                    <span>{{ t('cdbLciLca.results.netAmount') }}</span>
                    <span class="cdb-page__value--positive">{{ formatBrl(result.lci.netAmount) }}</span>
                  </div>
                </template>
                <template v-if="form.lcaRatePct !== null">
                  <div class="cdb-page__breakdown-row cdb-page__breakdown-row--label">
                    <span>LCA</span>
                  </div>
                  <div class="cdb-page__breakdown-row">
                    <span>{{ t('cdbLciLca.results.grossReturn') }}</span>
                    <span>{{ formatBrl(result.lca.grossReturn) }}</span>
                  </div>
                  <div class="cdb-page__breakdown-row cdb-page__breakdown-row--net">
                    <span>{{ t('cdbLciLca.results.netAmount') }}</span>
                    <span class="cdb-page__value--positive">{{ formatBrl(result.lca.netAmount) }}</span>
                  </div>
                </template>
              </div>
            </UiSurfaceCard>

            <!-- Disclaimer -->
            <UiSurfaceCard>
              <NAlert type="warning">
                {{ t('cdbLciLca.disclaimer.note', { year: CDB_TABLE_YEAR }) }}
              </NAlert>
            </UiSurfaceCard>
          </template>
        </div>
      </div>
    </div>
        <!-- Guest CTA — shown below result for unauthenticated users -->
        <ToolGuestCta v-if="!isAuthenticated" />
  </NuxtLayout>
  </div>
</template>

<style scoped>
.cdb-root {
  display: contents;
}

.cdb-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

.cdb-page--authenticated {
  padding: var(--space-6, 24px);
}

.cdb-page__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .cdb-page__layout {
    grid-template-columns: 1fr;
  }
}

.cdb-page__form-col,
.cdb-page__results-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.cdb-page__form-panel {
  width: 100%;
}

.cdb-page__form-actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}

.cdb-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-bottom: 1px solid var(--color-outline-subtle);
  background: var(--color-bg-elevated);
}

.cdb-page__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
}

.cdb-page__brand-mark {
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
  color: var(--color-text-primary);
}

.cdb-page__brand-copy {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cdb-page__header-actions {
  display: flex;
  gap: var(--space-2, 8px);
}

.cdb-page__content {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8, 32px) var(--space-6, 24px);
}

.cdb-page__hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8, 32px);
  align-items: start;
  margin-bottom: var(--space-8, 32px);
}

@media (max-width: 768px) {
  .cdb-page__hero {
    grid-template-columns: 1fr;
  }
}

.cdb-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

.cdb-page__results-section {
  margin-top: var(--space-6, 24px);
}

.cdb-page__results-main,
.cdb-page__results-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.cdb-page__section-title {
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-3, 12px) 0;
}

.cdb-page__hint {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-muted);
  margin: var(--space-1, 4px) 0 0 0;
}

.cdb-page__ranking {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.cdb-page__ranking-row {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  padding: var(--space-2, 8px) 0;
  border-bottom: 1px solid var(--color-outline-subtle);
  font-size: var(--font-size-body-sm, 13px);
}

.cdb-page__ranking-row--best {
  color: var(--color-semantic-positive, #22c55e);
  font-weight: var(--font-weight-bold, 700);
}

.cdb-page__ranking-position {
  width: 1.5em;
  color: var(--color-text-muted);
}

.cdb-page__ranking-name {
  flex: 1;
}

.cdb-page__ranking-amount {
  font-variant-numeric: tabular-nums;
  font-weight: var(--font-weight-semibold, 600);
}

.cdb-page__breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.cdb-page__breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-body-sm, 13px);
  padding: var(--space-1, 4px) 0;
}

.cdb-page__breakdown-row--label {
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-secondary);
  border-top: 1px dashed var(--color-outline-subtle);
  padding-top: var(--space-2, 8px);
  margin-top: var(--space-1, 4px);
}

.cdb-page__breakdown-row--deduction {
  color: var(--color-text-secondary);
}

.cdb-page__breakdown-row--net {
  border-top: 2px solid var(--color-outline-soft);
  padding-top: var(--space-2, 8px);
  font-weight: var(--font-weight-bold, 700);
}

.cdb-page__value--positive {
  color: var(--color-semantic-positive, #22c55e);
  font-variant-numeric: tabular-nums;
}
</style>
