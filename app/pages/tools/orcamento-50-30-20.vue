<script setup lang="ts">
import { computed, ref } from "vue";
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInputNumber,
  NSelect,
  NSpace,
  NTag,
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
  calculateOrcamento,
  createDefaultOrcamentoFormState,
  validateOrcamentoForm,
  type OrcamentoFormState,
  type OrcamentoResult,
} from "~/features/tools/model/orcamento-50-30-20";
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
  title: t("orcamento5030.seo.title"),
  description: t("orcamento5030.seo.description"),
  ogTitle: t("orcamento5030.seo.ogTitle"),
  ogDescription: t("orcamento5030.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

const isAuthenticated = computed<boolean>(() => sessionStore.isAuthenticated);
const premiumAccessQuery = useEntitlementQuery("advanced_simulations");
const hasPremiumAccess = computed<boolean>(() => premiumAccessQuery.data.value === true);

const { form, validationError, patch, reset, setValidationError } =
  useCalculatorFormState<OrcamentoFormState>(createDefaultOrcamentoFormState);

const result = ref<OrcamentoResult | null>(null);
const savedSimulationId = ref<string | null>(null);
const goalAdded = ref(false);

const modeOptions = computed(() => [
  { label: t("orcamento5030.form.modeSimple"), value: "simple" },
  { label: t("orcamento5030.form.modeDetailed"), value: "detailed" },
]);

const categoryLabels: Record<string, string> = {
  needs: "Necessidades (50%)",
  wants: "Desejos (30%)",
  investments: "Investimentos (20%)",
};

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
function handleCalculate(): void {
  const errors = validateOrcamentoForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`orcamento5030.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalAdded.value = false;
  result.value = calculateOrcamento(form.value);
}

/**
 *
 */
function handleReset(): void {
  reset();
  result.value = null;
  savedSimulationId.value = null;
  goalAdded.value = false;
}

/**
 * @returns Saved simulation ID or null.
 */
async function ensureSimulationSaved(): Promise<string | null> {
  if (savedSimulationId.value) { return savedSimulationId.value; }
  if (!result.value) { return null; }
  try {
    const sim = await saveSimulationMutation.mutateAsync({
      name: t("orcamento5030.simulation.defaultName"),
      toolSlug: "orcamento_50_30_20",
      inputs: { ...form.value },
      result: { netIncome: result.value.netIncome, slices: result.value.slices },
    });
    savedSimulationId.value = sim.id;
    return sim.id;
  } catch (err) {
    captureException(err, { context: "orcamento-50-30-20/save-simulation" });
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
  const investmentSlice = result.value.slices.find((s) => s.category === "investments");
  try {
    await createGoalMutation.mutateAsync({
      name: t("orcamento5030.simulation.goalName"),
      target_amount: investmentSlice?.idealAmount ?? 0,
    });
    goalAdded.value = true;
  } catch (err) {
    captureException(err, { context: "orcamento-50-30-20/add-as-goal" });
    toast.error(getErrorMessage(err));
  }
}

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return result.value.slices.map((s) => ({
    label: categoryLabels[s.category] ?? s.category,
    value: formatBrl(s.idealAmount),
  }));
});

const isSaved = computed(() => savedSimulationId.value !== null);
const isBridging = computed(() => saveSimulationMutation.isPending.value || createGoalMutation.isPending.value);
</script>

<template>
  <div class="orcamento-5030-root">
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="orcamento-5030-page">
      <div class="orcamento-5030-page__layout">
        <div class="orcamento-5030-page__form-col">
          <UiPageHeader
            :title="t('orcamento5030.hero.title')"
            :subtitle="t('orcamento5030.hero.subtitle')"
          />

          <UiGlassPanel>
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('orcamento5030.form.title')">
                <NFormItem :label="t('orcamento5030.form.netIncome')">
                  <NInputNumber :value="form.netIncome" :min="0" :precision="2" prefix="R$" style="width: 100%" @update:value="(v) => patch({ netIncome: v })" />
                </NFormItem>

                <NFormItem :label="t('orcamento5030.form.mode')">
                  <NSelect :value="form.mode" :options="modeOptions" style="width: 100%" @update:value="(v) => patch({ mode: v })" />
                </NFormItem>

                <template v-if="form.mode === 'detailed'">
                  <NFormItem :label="t('orcamento5030.form.actualNeeds')">
                    <NInputNumber :value="form.actualNeeds" :min="0" :precision="2" prefix="R$" style="width: 100%" @update:value="(v) => patch({ actualNeeds: v ?? 0 })" />
                  </NFormItem>
                  <NFormItem :label="t('orcamento5030.form.actualWants')">
                    <NInputNumber :value="form.actualWants" :min="0" :precision="2" prefix="R$" style="width: 100%" @update:value="(v) => patch({ actualWants: v ?? 0 })" />
                  </NFormItem>
                  <NFormItem :label="t('orcamento5030.form.actualInvestments')">
                    <NInputNumber :value="form.actualInvestments" :min="0" :precision="2" prefix="R$" style="width: 100%" @update:value="(v) => patch({ actualInvestments: v ?? 0 })" />
                  </NFormItem>
                </template>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="error" style="margin-bottom: 16px">
                {{ validationError }}
              </NAlert>

              <NSpace style="margin-top: 16px">
                <NButton type="primary" attr-type="submit" :loading="isBridging">
                  {{ t('orcamento5030.form.calculate') }}
                </NButton>
                <NButton quaternary @click="handleReset">
                  {{ t('orcamento5030.form.reset') }}
                </NButton>
              </NSpace>
            </NForm>
          </UiGlassPanel>
        </div>

        <div v-if="result" class="orcamento-5030-page__result-col">
          <UiStickySummaryCard>
            <CalculatorResultSummary
              :label="t('orcamento5030.results.distribution')"
              :value="formatBrl(result.netIncome)"
              :metrics="summaryMetrics"
            />

            <ToolSaveResult
              intent="goal"
              :label="t('orcamento5030.hero.title')"
              :amount="result.slices.find((s) => s.category === 'investments')?.idealAmount ?? 0"
              :description="t('orcamento5030.results.investmentGoal')"
            />

            <NSpace vertical style="margin-top: 16px">
              <NButton v-if="isAuthenticated" :loading="saveSimulationMutation.isPending.value" :disabled="isSaved" block @click="handleSaveSimulation">
                {{ isSaved ? t('orcamento5030.actions.saved') : t('orcamento5030.actions.save') }}
              </NButton>
              <NButton v-if="hasPremiumAccess" type="primary" :loading="createGoalMutation.isPending.value" :disabled="goalAdded" block @click="handleAddAsGoal">
                {{ goalAdded ? t('orcamento5030.actions.goalAdded') : t('orcamento5030.actions.addAsGoal') }}
              </NButton>
            </NSpace>
          </UiStickySummaryCard>

          <UiSurfaceCard>
            <NThing v-for="s in result.slices" :key="s.category" :title="categoryLabels[s.category]" :description="formatBrl(s.idealAmount)">
              <template v-if="s.actualAmount !== null" #footer>
                <NSpace>
                  <span>{{ t('orcamento5030.results.actual') }}: {{ formatBrl(s.actualAmount) }} ({{ s.actualPct }}%)</span>
                  <NTag v-if="s.alert" type="error" round>{{ s.deviationPct! > 0 ? '+' : '' }}{{ s.deviationPct }}%</NTag>
                </NSpace>
              </template>
            </NThing>
          </UiSurfaceCard>

          <UiSurfaceCard v-if="result.surplus !== null">
            <NThing :title="t('orcamento5030.results.surplus')" :description="formatBrl(result.surplus)" />
          </UiSurfaceCard>
        </div>
      </div>
    </div>
    <ToolGuestCta v-if="!isAuthenticated" />
  </NuxtLayout>
  </div>
</template>
