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
  NThing,
  useMessage,
} from "naive-ui";
import { useRouter } from "#app";

import { captureException } from "~/core/observability";
import { useApiError } from "~/composables/useApiError";
import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import { useSessionStore } from "~/stores/session";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";
import { useCreateGoalMutation } from "~/features/goals/queries/use-create-goal-mutation";
import {
  MEI_ACTIVITY_TYPES,
  MEI_TABLE_YEAR,
  calculateMei,
  createDefaultMeiFormState,
  validateMeiForm,
  type MeiFormState,
  type MeiResult,
} from "~/features/tools/model/mei";
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
const router = useRouter();
const sessionStore = useSessionStore();

useSeoMeta({
  title: t("mei.seo.title"),
  description: t("mei.seo.description"),
  ogTitle: t("mei.seo.ogTitle"),
  ogDescription: t("mei.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

// ─── Session & access ─────────────────────────────────────────────────────────

const isAuthenticated = computed<boolean>(() => sessionStore.isAuthenticated);

const premiumAccessQuery = useEntitlementQuery("advanced_simulations");

/**
 * True when the authenticated user holds a premium subscription.
 */
const hasPremiumAccess = computed<boolean>(
  () => premiumAccessQuery.data.value === true,
);

// ─── Calculator form state ────────────────────────────────────────────────────

const { form, validationError, isDirty, patch, reset, setValidationError } =
  useCalculatorFormState<MeiFormState>(createDefaultMeiFormState);

const result = ref<MeiResult | null>(null);
const savedSimulationId = ref<string | null>(null);
const goalCreated = ref(false);

// ─── Select options ───────────────────────────────────────────────────────────

const activityOptions = computed(() =>
  MEI_ACTIVITY_TYPES.map((activity) => ({
    label: t(`mei.form.activities.${activity}`),
    value: activity,
  })),
);

const situationOptions = computed(() => [
  { label: t("mei.form.situations.pf_autonomo_sem_registro"), value: "pf_autonomo_sem_registro" },
  { label: t("mei.form.situations.pf_carne_leao"), value: "pf_carne_leao" },
  { label: t("mei.form.situations.already_mei"), value: "already_mei" },
]);

// ─── Mutations ────────────────────────────────────────────────────────────────

const saveSimulationMutation = useSaveSimulationMutation();
const createGoalMutation = useCreateGoalMutation();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a numeric value as Brazilian Real currency string.
 *
 * @param value Number to format.
 * @returns Formatted BRL string.
 */
function formatBrl(value: number): string {
  return n(value, "currency");
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Validates the form and triggers the calculation when valid.
 */
function handleCalculate(): void {
  const errors = validateMeiForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`mei.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalCreated.value = false;
  result.value = calculateMei(form.value);
}

/**
 * Resets the form to its initial state and clears the result.
 */
function handleReset(): void {
  reset();
  result.value = null;
  savedSimulationId.value = null;
  goalCreated.value = false;
}

// ─── Summary metrics ──────────────────────────────────────────────────────────

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    {
      label: t("mei.results.dasAnnual"),
      value: formatBrl(result.value.dasAnnual),
    },
    {
      label: t("mei.results.annualRevenue"),
      value: formatBrl(result.value.annualRevenueProjection),
    },
    {
      label: t("mei.results.savingsVsPF"),
      value: result.value.savingsVsPF > 0
        ? `${formatBrl(result.value.savingsVsPF)}/mês`
        : formatBrl(0),
    },
  ];
});

// ─── Save simulation ──────────────────────────────────────────────────────────

/**
 * Saves the current simulation and returns its id.
 *
 * @returns Simulation id or null on failure.
 */
async function ensureSimulationSaved(): Promise<string | null> {
  if (savedSimulationId.value) { return savedSimulationId.value; }
  if (!result.value) { return null; }

  try {
    const simulation = await saveSimulationMutation.mutateAsync({
      name: t("mei.simulation.defaultName", { year: new Date().getFullYear() }),
      toolSlug: "mei",
      inputs: { ...form.value },
      result: { ...result.value },
    });
    savedSimulationId.value = simulation.id;
    return simulation.id;
  } catch (err) {
    captureException(err, { context: "mei/save-simulation" });
    toast.error(getErrorMessage(err));
    return null;
  }
}

/**
 * Handles the Save Simulation button click.
 */
async function handleSaveSimulation(): Promise<void> {
  await ensureSimulationSaved();
}

/**
 * Handles the Add as Goal button click (premium).
 */
async function handleAddAsGoal(): Promise<void> {
  if (!result.value || goalCreated.value) { return; }
  try {
    await createGoalMutation.mutateAsync({
      name: t("mei.simulation.goalName"),
      target_amount: result.value.annualRevenueProjection,
    });
    goalCreated.value = true;
  } catch (err) {
    captureException(err, { context: "mei/create-goal" });
    toast.error(getErrorMessage(err));
  }
}
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root. -->
  <div class="mei-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="mei-page mei-page--authenticated">
      <div class="mei-page__layout">
        <!-- Form column -->
        <div class="mei-page__form-col">
          <UiPageHeader
            :title="t('mei.hero.title')"
            :subtitle="t('mei.hero.subtitle')"
          />

          <UiGlassPanel class="mei-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('mei.form.title')">
                <NFormItem :label="t('mei.form.activity')">
                  <NSelect
                    :value="form.activity"
                    :options="activityOptions"
                    style="width: 100%"
                    @update:value="(v) => patch({ activity: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('mei.form.monthlyRevenue')">
                  <NInputNumber
                    :value="form.monthlyRevenue"
                    :placeholder="t('mei.form.revenuePlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ monthlyRevenue: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('mei.form.currentSituation')">
                  <NSelect
                    :value="form.currentSituation"
                    :options="situationOptions"
                    style="width: 100%"
                    @update:value="(v) => patch({ currentSituation: v })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="warning" style="margin-top:12px">
                {{ validationError }}
              </NAlert>

              <div class="mei-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('mei.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                  {{ t('mei.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Results column -->
        <div class="mei-page__results-col">
          <UiStickySummaryCard v-if="result">
            <CalculatorResultSummary
              :label="t('mei.results.dasMontly')"
              :value="formatBrl(result.dasMontly)"
              :metrics="summaryMetrics"
            />
          </UiStickySummaryCard>

          <template v-if="result">
            <!-- DAS card -->
            <UiSurfaceCard>
              <div class="mei-page__breakdown">
                <div class="mei-page__breakdown-row">
                  <span>{{ t('mei.results.dasMontly') }}</span>
                  <span class="mei-page__value--primary">{{ formatBrl(result.dasMontly) }}</span>
                </div>
                <div class="mei-page__breakdown-row">
                  <span>{{ t('mei.results.dasAnnual') }}</span>
                  <span>{{ formatBrl(result.dasAnnual) }}</span>
                </div>
                <div class="mei-page__breakdown-row">
                  <span>{{ t('mei.results.annualRevenue') }}</span>
                  <span>{{ formatBrl(result.annualRevenueProjection) }}</span>
                </div>
              </div>

              <NAlert v-if="result.limitWarning" type="warning" style="margin-top:12px">
                {{ t('mei.results.limitWarning') }}
              </NAlert>
            </UiSurfaceCard>

            <!-- PF comparison card -->
            <UiSurfaceCard>
              <p class="mei-page__section-title">{{ t('mei.results.comparisonTitle') }}</p>
              <div class="mei-page__breakdown">
                <div class="mei-page__breakdown-row">
                  <span>{{ t('mei.results.pfInss') }}</span>
                  <span>{{ formatBrl(result.comparisonPF.inssMonthly) }}</span>
                </div>
                <div class="mei-page__breakdown-row">
                  <span>{{ t('mei.results.pfIrpf') }}</span>
                  <span>{{ formatBrl(result.comparisonPF.irpfMonthly) }}</span>
                </div>
                <div class="mei-page__breakdown-row mei-page__breakdown-row--total">
                  <span>{{ t('mei.results.pfTotalTax') }}</span>
                  <span>{{ formatBrl(result.comparisonPF.totalTaxPF) }}</span>
                </div>
                <div class="mei-page__breakdown-row" :class="result.meiIsMoreAdvantageous ? 'mei-page__breakdown-row--savings' : ''">
                  <span>{{ t('mei.results.savingsVsPF') }}</span>
                  <span>{{ formatBrl(result.savingsVsPF) }}/mês</span>
                </div>
              </div>
            </UiSurfaceCard>

            <!-- Benefits card -->
            <UiSurfaceCard>
              <p class="mei-page__section-title">{{ t('mei.results.benefitsTitle') }}</p>
              <ul class="mei-page__benefits-list">
                <li v-for="benefit in result.benefitsAvailable" :key="benefit" class="mei-page__benefit-item">
                  {{ t(`mei.results.benefits.${benefit}`) }}
                </li>
              </ul>
              <p class="mei-page__benefit-note">{{ t('mei.results.benefitsNote') }}</p>
            </UiSurfaceCard>

            <ToolSaveResult
              intent="expense"
              :label="t('mei.hero.title')"
              :amount="result.dasMontly"
            />

            <!-- Action bar -->
            <UiSurfaceCard class="mei-page__action-bar">
              <NSpace vertical :size="8">
                <NButton
                  block
                  :loading="saveSimulationMutation.isPending.value"
                  :disabled="!!savedSimulationId || saveSimulationMutation.isPending.value"
                  @click="handleSaveSimulation"
                >
                  {{ savedSimulationId ? t('mei.actions.saved') : t('mei.actions.save') }}
                </NButton>

                <NButton
                  v-if="hasPremiumAccess"
                  block
                  type="primary"
                  :loading="createGoalMutation.isPending.value"
                  :disabled="goalCreated || createGoalMutation.isPending.value"
                  @click="handleAddAsGoal"
                >
                  {{ goalCreated ? t('mei.actions.goalAdded') : t('mei.actions.addAsGoal') }}
                </NButton>

                <NThing
                  v-if="!hasPremiumAccess"
                  :title="t('mei.premiumCta.title')"
                  :description="t('mei.premiumCta.description')"
                >
                  <template #footer>
                    <NButton size="small" type="warning" @click="router.push('/subscription')">
                      {{ t('mei.premiumCta.upgrade') }}
                    </NButton>
                  </template>
                </NThing>
              </NSpace>
            </UiSurfaceCard>

            <!-- Disclaimer -->
            <UiSurfaceCard>
              <NAlert type="warning">
                {{ t('mei.disclaimer.note', { year: MEI_TABLE_YEAR }) }}
                <a href="https://www.gov.br/mei" target="_blank" rel="noopener noreferrer" class="mei-page__disclaimer-link">
                  {{ t('mei.disclaimer.portalLink') }}
                </a>
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
.mei-root {
  display: contents;
}

.mei-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

.mei-page--authenticated {
  padding: var(--space-6, 24px);
}

.mei-page__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .mei-page__layout {
    grid-template-columns: 1fr;
  }
}

.mei-page__form-col,
.mei-page__results-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.mei-page__form-panel {
  width: 100%;
}

.mei-page__form-actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}

.mei-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-bottom: 1px solid var(--color-outline-subtle);
  background: var(--color-bg-elevated);
}

.mei-page__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
}

.mei-page__brand-mark {
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
  color: var(--color-text-primary);
}

.mei-page__brand-copy {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.mei-page__header-actions {
  display: flex;
  gap: var(--space-2, 8px);
}

.mei-page__content {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8, 32px) var(--space-6, 24px);
}

.mei-page__hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8, 32px);
  align-items: start;
  margin-bottom: var(--space-8, 32px);
}

@media (max-width: 768px) {
  .mei-page__hero {
    grid-template-columns: 1fr;
  }
}

.mei-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

.mei-page__results-section {
  margin-top: var(--space-6, 24px);
}

.mei-page__results-main,
.mei-page__results-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.mei-page__section-title {
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-3, 12px) 0;
}

.mei-page__breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.mei-page__breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-primary);
  padding: var(--space-1, 4px) 0;
}

.mei-page__breakdown-row--total {
  border-top: 1px solid var(--color-outline-subtle);
  padding-top: var(--space-2, 8px);
  margin-top: var(--space-1, 4px);
  font-weight: var(--font-weight-semibold, 600);
}

.mei-page__breakdown-row--savings {
  color: var(--color-semantic-positive, #22c55e);
}

.mei-page__value--primary {
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
  font-variant-numeric: tabular-nums;
}

.mei-page__benefits-list {
  margin: 0;
  padding-left: var(--space-4, 16px);
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 4px);
}

.mei-page__benefit-item {
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-primary);
}

.mei-page__benefit-note {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-muted);
  margin: var(--space-3, 12px) 0 0 0;
  line-height: 1.5;
}

.mei-page__disclaimer-link {
  color: inherit;
  text-decoration: underline;
  margin-left: var(--space-1, 4px);
}

.mei-page__action-bar {
  flex-shrink: 0;
}
</style>
