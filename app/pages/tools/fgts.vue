<script setup lang="ts">
import { computed } from "vue";
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInputNumber,
  NSelect,
  NSpace,
  NThing,
  NTooltip,
} from "naive-ui";
import { Info } from "lucide-vue-next";

import {
  FGTS_TABLE_YEAR,
  FGTS_TERMINATION_TYPES,
  calculateFgts,
  createDefaultFgtsFormState,
  validateFgtsForm,
  type FgtsFormState,
  type FgtsResult,
} from "~/features/tools/model/fgts";
import { useToolPage } from "~/features/tools/composables/use-tool-page";
import { useToolPageStructuredData } from "~/features/tools/composables/useToolPageStructuredData";
import { FGTS_FAQS } from "~/features/tools/content/fgts-faqs";
import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import ToolSaveResult from "~/components/tool/ToolSaveResult/ToolSaveResult.vue";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import LaborCalculatorMarketPulsePage from "~/components/tool/LaborCalculatorMarketPulse/LaborCalculatorMarketPulsePage.vue";

definePageMeta({ layout: false });

const { t } = useI18n();

useSeoMeta({
  title: t("fgts.seo.title"),
  description: t("fgts.seo.description"),
  ogTitle: t("fgts.seo.ogTitle"),
  ogDescription: t("fgts.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

useToolPageStructuredData({
  slug: "fgts",
  name: t("fgts.seo.title"),
  description: t("fgts.seo.description"),
  faqs: FGTS_FAQS,
});

const {
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
} = useToolPage<FgtsFormState, FgtsResult>({
  createDefaultState: createDefaultFgtsFormState,
  buildSimulationPayload: ({ form, result, t }) => ({
    toolId: "fgts-balance",
    ruleVersion: "2026.04",
    metadata: { label: t("fgts.simulation.defaultName", { year: new Date().getFullYear() }) },
    inputs: { ...form },
    result: { ...result },
  }),
  getGoalPayload: ({ result, t }) => ({
    name: t("fgts.simulation.goalName"),
    target_amount: result.projectedBalance,
  }),
});

// ─── Select options ───────────────────────────────────────────────────────────

const terminationTypeOptions = computed(() =>
  FGTS_TERMINATION_TYPES.map((type) => ({
    label: t(`fgts.form.terminationTypes.${type}`),
    value: type,
  })),
);

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Validates the form and triggers the calculation when valid.
 */
function handleCalculate(): void {
  const errors = validateFgtsForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`fgts.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalAdded.value = false;
  result.value = calculateFgts(form.value);
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

// ─── Summary metrics ──────────────────────────────────────────────────────────

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    {
      label: t("fgts.results.monthlyDeposit"),
      value: formatBrl(result.value.monthlyDeposit),
    },
    {
      label: t("fgts.results.totalDeposited"),
      value: formatBrl(result.value.totalDeposited),
    },
    {
      label: t("fgts.results.correctionAmount"),
      value: `+ ${formatBrl(result.value.correctionAmount)}`,
    },
    {
      label: t("fgts.results.fineAmount"),
      value: result.value.fineAmount > 0
        ? `+ ${formatBrl(result.value.fineAmount)}`
        : formatBrl(0),
    },
  ];
});
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root. -->
  <div class="fgts-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="fgts-page fgts-page--authenticated">
      <LaborCalculatorMarketPulsePage
        class="labor-calculator-market-pulse fgts-page__market-pulse"
        eyebrow="Calculadora trabalhista"
        :title="t('fgts.hero.title')"
        :subtitle="t('fgts.hero.subtitle')"
        context-label="Depósito mensal"
        context-value="8% CLT"
        context-helper="Projeta saldo, correção e multa conforme o tipo de desligamento."
        :has-result="Boolean(result)"
      >
        <template #form>
          <UiGlassPanel class="fgts-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('fgts.form.title')">
                <NFormItem :label="t('fgts.form.grossSalary')">
                  <NInputNumber
                    :value="form.grossSalary"
                    :placeholder="t('fgts.form.grossSalaryPlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ grossSalary: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('fgts.form.yearsOfService')">
                  <NInputNumber
                    :value="form.yearsOfService"
                    :min="0"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ yearsOfService: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem :label="t('fgts.form.monthsOfService')">
                  <NInputNumber
                    :value="form.monthsOfService"
                    :min="0"
                    :max="11"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ monthsOfService: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('fgts.form.currentBalance') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('fgts.form.currentBalanceTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.currentBalance"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ currentBalance: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('fgts.form.trRatePct') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('fgts.form.trRatePctTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.trRatePct"
                    :min="0"
                    :precision="2"
                    suffix="%"
                    style="width: 100%"
                    @update:value="(v) => patch({ trRatePct: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem :label="t('fgts.form.terminationType')">
                  <NSelect
                    :value="form.terminationType"
                    :options="terminationTypeOptions"
                    style="width: 100%"
                    @update:value="(v) => patch({ terminationType: v })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="warning" style="margin-top:12px">
                {{ validationError }}
              </NAlert>

              <div class="fgts-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('fgts.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                  {{ t('fgts.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </template>

        <template #results>
          <div v-if="result" class="fgts-page__summary-card">
            <CalculatorResultSummary
              :label="t('fgts.results.projectedBalance')"
              :value="formatBrl(result.projectedBalance)"
              :metrics="summaryMetrics"
            />
          </div>
        </template>

        <template #breakdown>
          <UiSurfaceCard v-if="result">
            <div class="fgts-page__breakdown">
              <div class="fgts-page__breakdown-row">
                <span>{{ t('fgts.results.monthlyDeposit') }}</span>
                <span>{{ formatBrl(result.monthlyDeposit) }}</span>
              </div>
              <div class="fgts-page__breakdown-row">
                <span>{{ t('fgts.results.totalDeposited') }}</span>
                <span>{{ formatBrl(result.totalDeposited) }}</span>
              </div>
              <div class="fgts-page__breakdown-row fgts-page__breakdown-row--bonus">
                <span>{{ t('fgts.results.correctionAmount') }}</span>
                <span>+ {{ formatBrl(result.correctionAmount) }}</span>
              </div>
              <div class="fgts-page__breakdown-row fgts-page__breakdown-row--total">
                <span>{{ t('fgts.results.projectedBalance') }}</span>
                <span class="fgts-page__value--gross">{{ formatBrl(result.projectedBalance) }}</span>
              </div>
              <div v-if="result.fineAmount > 0" class="fgts-page__breakdown-row fgts-page__breakdown-row--bonus">
                <span>{{ t('fgts.results.fineAmount') }}</span>
                <span>+ {{ formatBrl(result.fineAmount) }}</span>
              </div>
              <div v-if="result.governmentFineAmount > 0" class="fgts-page__breakdown-row">
                <span>{{ t('fgts.results.governmentFineAmount') }}</span>
                <span>{{ formatBrl(result.governmentFineAmount) }}</span>
              </div>
              <div class="fgts-page__breakdown-row fgts-page__breakdown-row--net">
                <span>{{ t('fgts.results.withdrawableAmount') }}</span>
                <span :class="result.canWithdraw ? 'fgts-page__value--positive' : 'fgts-page__value--muted'">
                  {{ result.canWithdraw ? formatBrl(result.withdrawableAmount) : t('fgts.results.cannotWithdraw') }}
                </span>
              </div>
            </div>
          </UiSurfaceCard>
        </template>

        <template #scenario>
          <p class="fgts-page__scenario-note">
            A barra resume a composição entre saldo projetado, multa rescisória e saque disponível.
          </p>
        </template>

        <template #formula>
          <ul class="fgts-page__formula-list">
            <li>Depósito mensal: salário bruto multiplicado por 8%.</li>
            <li>Saldo projetado: saldo atual somado aos depósitos mensais com correção anual.</li>
            <li>Multa: 40% sem justa causa, 20% por acordo e zero nas demais modalidades.</li>
          </ul>
        </template>

        <template #actions>
          <template v-if="result">
            <ToolSaveResult
              intent="receivable"
              :label="t('fgts.hero.title')"
              :amount="result.withdrawableAmount"
            />

            <UiSurfaceCard class="fgts-page__action-bar">
              <NSpace vertical :size="8">
                <NButton
                  block
                  :loading="saveSimulationMutation.isPending.value"
                  :disabled="!!savedSimulationId || saveSimulationMutation.isPending.value"
                  @click="handleSaveSimulation"
                >
                  {{ savedSimulationId ? t('fgts.actions.saved') : t('fgts.actions.save') }}
                </NButton>

                <NButton
                  v-if="hasPremiumAccess"
                  block
                  type="primary"
                  :loading="createGoalMutation.isPending.value"
                  :disabled="goalAdded || createGoalMutation.isPending.value"
                  @click="handleAddAsGoal"
                >
                  {{ goalAdded ? t('fgts.actions.goalAdded') : t('fgts.actions.addAsGoal') }}
                </NButton>

                <NThing
                  v-if="!hasPremiumAccess"
                  :title="t('fgts.premiumCta.title')"
                  :description="t('fgts.premiumCta.description')"
                >
                  <template #footer>
                    <NButton size="small" type="warning" @click="router.push('/subscription')">
                      {{ t('fgts.premiumCta.upgrade') }}
                    </NButton>
                  </template>
                </NThing>
              </NSpace>
            </UiSurfaceCard>

            <UiSurfaceCard>
              <NAlert type="warning">
                {{ t('fgts.disclaimer.legal', { year: FGTS_TABLE_YEAR }) }}
              </NAlert>
            </UiSurfaceCard>
          </template>
        </template>
      </LaborCalculatorMarketPulsePage>
    </div>
        <!-- Guest CTA — shown below result for unauthenticated users -->
        <ToolGuestCta v-if="!isAuthenticated" />
  </NuxtLayout>
  </div>
</template>

<style scoped>
.fgts-root {
  display: contents;
}

.fgts-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

.fgts-page__form-panel {
  width: 100%;
}

.fgts-page__form-actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}

.fgts-page__summary-card {
  display: contents;
}

.fgts-page__scenario-note,
.fgts-page__formula-list {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.55;
}

.fgts-page__formula-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 18px;
}

.fgts-page__breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.fgts-page__breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-primary);
  padding: var(--space-1, 4px) 0;
}

.fgts-page__breakdown-row--bonus {
  color: var(--color-semantic-positive, #22c55e);
}

.fgts-page__breakdown-row--total {
  border-top: 1px solid var(--color-outline-subtle);
  padding-top: var(--space-2, 8px);
  margin-top: var(--space-1, 4px);
  font-weight: var(--font-weight-semibold, 600);
}

.fgts-page__breakdown-row--net {
  border-top: 2px solid var(--color-outline-soft);
  padding-top: var(--space-2, 8px);
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
}

.fgts-page__value--positive {
  color: var(--color-semantic-positive, #22c55e);
  font-variant-numeric: tabular-nums;
}

.fgts-page__value--gross {
  font-weight: var(--font-weight-semibold, 600);
  font-variant-numeric: tabular-nums;
}

.fgts-page__value--muted {
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.fgts-page__action-bar {
  flex-shrink: 0;
}
</style>
