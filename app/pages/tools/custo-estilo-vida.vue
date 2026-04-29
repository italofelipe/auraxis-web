<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpace,
  NThing,
  useMessage,
} from "naive-ui";

import { captureException } from "~/core/observability";
import { useApiError } from "~/composables/useApiError";
import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import { useSessionStore } from "~/stores/session";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";
import { useCreateGoalMutation } from "~/features/goals/queries/use-create-goal-mutation";
import {
  calculateCustoEstiloVida,
  createDefaultExpense,
  createDefaultCustoEstiloVidaFormState,
  decodeQueryToForm,
  encodeFormToQuery,
  validateCustoEstiloVidaForm,
  type CustoEstiloVidaFormState,
  type CustoEstiloVidaResult,
} from "~/features/tools/model/custo-estilo-vida";
import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import ToolSaveResult from "~/components/tool/ToolSaveResult/ToolSaveResult.vue";
import UiStickySummaryCard from "~/components/ui/UiStickySummaryCard/UiStickySummaryCard.vue";
import UiPageHeader from "~/components/ui/UiPageHeader/UiPageHeader.vue";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";

definePageMeta({ layout: false });

const { t, n } = useI18n();
const toast = useMessage();
const { getErrorMessage } = useApiError();
const sessionStore = useSessionStore();

useSeoMeta({
  title: t("custoEstiloVida.seo.title"),
  description: t("custoEstiloVida.seo.description"),
  ogTitle: t("custoEstiloVida.seo.ogTitle"),
  ogDescription: t("custoEstiloVida.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

const isAuthenticated = computed<boolean>(() => sessionStore.isAuthenticated);
const premiumAccessQuery = useEntitlementQuery("advanced_simulations");
const hasPremiumAccess = computed<boolean>(() => premiumAccessQuery.data.value === true);

const { form, validationError, patch, reset, setValidationError } =
  useCalculatorFormState<CustoEstiloVidaFormState>(createDefaultCustoEstiloVidaFormState);

const result = ref<CustoEstiloVidaResult | null>(null);
const savedSimulationId = ref<string | null>(null);
const goalAdded = ref(false);
const shareUrl = ref<string | null>(null);

const saveSimulationMutation = useSaveSimulationMutation();
const createGoalMutation = useCreateGoalMutation();

/**
 * @param value
 * @returns BRL-formatted string.
 */
function formatBrl(value: number): string {
  return n(value, "currency");
}

/**
 * @returns void
 */
function addExpense(): void {
  patch({ expenses: [...form.value.expenses, createDefaultExpense()] });
}

/**
 *
 * @param index
 */
function removeExpense(index: number): void {
  if (form.value.expenses.length <= 1) { return; }
  const expenses = [...form.value.expenses];
  expenses.splice(index, 1);
  patch({ expenses });
}

/**
 *
 * @param index
 * @param field
 * @param value
 */
function updateExpense(index: number, field: string, value: unknown): void {
  const expenses = [...form.value.expenses];
  const current = expenses[index];
  if (!current) { return; }
  expenses[index] = { ...current, [field]: value };
  patch({ expenses });
}

onMounted(() => {
  if (typeof window === "undefined") { return; }
  const data = new URLSearchParams(window.location.search).get("d");
  if (!data) { return; }
  const decoded = decodeQueryToForm(data);
  if (!decoded) { return; }
  if (decoded.expenses) { patch({ expenses: decoded.expenses }); }
  if (decoded.annualReturnPct !== undefined) { patch({ annualReturnPct: decoded.annualReturnPct }); }
  if (decoded.horizonYears !== undefined) { patch({ horizonYears: decoded.horizonYears }); }
});

/**
 *
 */
function handleCalculate(): void {
  const errors = validateCustoEstiloVidaForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`custoEstiloVida.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalAdded.value = false;
  result.value = calculateCustoEstiloVida(form.value);
  shareUrl.value = `${window.location.origin}${window.location.pathname}?d=${encodeFormToQuery(form.value)}`;
}

/**
 *
 */
function handleReset(): void {
  reset();
  result.value = null;
  savedSimulationId.value = null;
  goalAdded.value = false;
  shareUrl.value = null;
}

/**
 *
 */
function handleCopyShareUrl(): void {
  if (shareUrl.value) {
    navigator.clipboard.writeText(shareUrl.value);
    toast.success(t("custoEstiloVida.actions.copied"));
  }
}

/**
 * @returns Saved simulation ID or null.
 */
async function ensureSimulationSaved(): Promise<string | null> {
  if (savedSimulationId.value) { return savedSimulationId.value; }
  if (!result.value) { return null; }
  try {
    const sim = await saveSimulationMutation.mutateAsync({
      toolId: "cost-of-lifestyle",
      ruleVersion: "2026.04",
      metadata: { label: t("custoEstiloVida.simulation.defaultName") },
      inputs: { ...form.value },
      result: {
        totalOpportunityCost: result.value.totalOpportunityCost,
        totalMonthlyCost: result.value.totalMonthlyCost,
      },
    });
    savedSimulationId.value = sim.id;
    return sim.id;
  } catch (err) {
    captureException(err, { context: "custo-estilo-vida/save-simulation" });
    toast.error(getErrorMessage(err));
    return null;
  }
}

/**
 *
 */
async function handleSaveSimulation(): Promise<void> { await ensureSimulationSaved(); }

/**
 *
 */
async function handleAddAsGoal(): Promise<void> {
  if (!result.value) { return; }
  await ensureSimulationSaved();
  try {
    await createGoalMutation.mutateAsync({
      name: t("custoEstiloVida.simulation.goalName"),
      target_amount: result.value.totalOpportunityCost,
    });
    goalAdded.value = true;
  } catch (err) {
    captureException(err, { context: "custo-estilo-vida/add-as-goal" });
    toast.error(getErrorMessage(err));
  }
}

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    { label: t("custoEstiloVida.results.totalMonthly"), value: formatBrl(result.value.totalMonthlyCost) },
    { label: t("custoEstiloVida.results.totalAnnual"), value: formatBrl(result.value.totalAnnualCost) },
    { label: t("custoEstiloVida.results.horizon"), value: `${result.value.horizonYears} anos` },
  ];
});

const isSaved = computed(() => savedSimulationId.value !== null);
const isBridging = computed(() => saveSimulationMutation.isPending.value || createGoalMutation.isPending.value);
</script>

<template>
  <div class="custo-estilo-vida-root">
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="custo-estilo-vida-page">
      <div class="custo-estilo-vida-page__layout">
        <div class="custo-estilo-vida-page__form-col">
          <UiPageHeader
            :title="t('custoEstiloVida.hero.title')"
            :subtitle="t('custoEstiloVida.hero.subtitle')"
          />

          <UiGlassPanel>
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('custoEstiloVida.form.title')">
                <div v-for="(exp, i) in form.expenses" :key="i" class="custo-estilo-vida-page__expense-row">
                  <NFormItem :label="t('custoEstiloVida.form.expenseName')">
                    <NInput :value="exp.name" :placeholder="t('custoEstiloVida.form.expenseNamePlaceholder')" @update:value="(v) => updateExpense(i, 'name', v)" />
                  </NFormItem>
                  <NFormItem :label="t('custoEstiloVida.form.monthlyAmount')">
                    <NInputNumber :value="exp.monthlyAmount" :min="0" :precision="2" prefix="R$" style="width: 100%" @update:value="(v) => updateExpense(i, 'monthlyAmount', v ?? 0)" />
                  </NFormItem>
                  <NButton v-if="form.expenses.length > 1" quaternary size="small" @click="removeExpense(i)">
                    {{ t('custoEstiloVida.form.removeExpense') }}
                  </NButton>
                </div>

                <NButton size="small" style="margin-bottom: 16px" @click="addExpense">
                  {{ t('custoEstiloVida.form.addExpense') }}
                </NButton>

                <NFormItem :label="t('custoEstiloVida.form.annualReturnPct')">
                  <NInputNumber :value="form.annualReturnPct" :min="0" :precision="2" style="width: 100%" @update:value="(v) => patch({ annualReturnPct: v ?? 12 })" />
                </NFormItem>

                <NFormItem :label="t('custoEstiloVida.form.horizonYears')">
                  <NInputNumber :value="form.horizonYears" :min="1" :precision="0" style="width: 100%" @update:value="(v) => patch({ horizonYears: v ?? 10 })" />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="error" style="margin-bottom: 16px">
                {{ validationError }}
              </NAlert>

              <NSpace style="margin-top: 16px">
                <NButton type="primary" attr-type="submit" :loading="isBridging">
                  {{ t('custoEstiloVida.form.calculate') }}
                </NButton>
                <NButton quaternary @click="handleReset">
                  {{ t('custoEstiloVida.form.reset') }}
                </NButton>
              </NSpace>
            </NForm>
          </UiGlassPanel>
        </div>

        <div v-if="result" class="custo-estilo-vida-page__result-col">
          <UiStickySummaryCard>
            <CalculatorResultSummary
              :label="t('custoEstiloVida.results.totalOpportunityCost')"
              :value="formatBrl(result.totalOpportunityCost)"
              :metrics="summaryMetrics"
            />

            <ToolSaveResult
              intent="goal"
              :label="t('custoEstiloVida.hero.title')"
              :amount="result.totalOpportunityCost"
            />

            <NSpace vertical style="margin-top: 16px">
              <NButton v-if="isAuthenticated" :loading="saveSimulationMutation.isPending.value" :disabled="isSaved" block @click="handleSaveSimulation">
                {{ isSaved ? t('custoEstiloVida.actions.saved') : t('custoEstiloVida.actions.save') }}
              </NButton>
              <NButton v-if="hasPremiumAccess" type="primary" :loading="createGoalMutation.isPending.value" :disabled="goalAdded" block @click="handleAddAsGoal">
                {{ goalAdded ? t('custoEstiloVida.actions.goalAdded') : t('custoEstiloVida.actions.addAsGoal') }}
              </NButton>
              <NButton v-if="shareUrl" block quaternary @click="handleCopyShareUrl">
                {{ t('custoEstiloVida.actions.copyShareUrl') }}
              </NButton>
            </NSpace>
          </UiStickySummaryCard>

          <UiSurfaceCard>
            <NThing
              v-for="exp in result.expenses"
              :key="exp.name"
              :title="exp.name"
              :description="`${formatBrl(exp.monthlyAmount)}/mês → ${formatBrl(exp.opportunityCost)} em ${result.horizonYears} anos`"
            />
          </UiSurfaceCard>

          <p class="custo-estilo-vida-page__disclaimer">{{ t('custoEstiloVida.disclaimer.note') }}</p>
        </div>
      </div>
    </div>
    <ToolGuestCta v-if="!isAuthenticated" />
  </NuxtLayout>
  </div>
</template>
