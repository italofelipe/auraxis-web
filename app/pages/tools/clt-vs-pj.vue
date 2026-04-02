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
  NTooltip,
} from "naive-ui";
import { Info } from "lucide-vue-next";
import { useRouter } from "#app";

import { captureException } from "~/core/observability";
import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import { useSessionStore } from "~/stores/session";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";
import { useCreateGoalMutation } from "~/features/goals/queries/use-create-goal-mutation";
import {
  PJ_REGIMES,
  PJ_TABLE_YEAR,
  calculateCltVsPj,
  createDefaultCltVsPjFormState,
  validateCltVsPjForm,
  type CltVsPjFormState,
  type CltVsPjResult,
} from "~/features/tools/model/clt-vs-pj";
import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import UiStickySummaryCard from "~/components/ui/UiStickySummaryCard/UiStickySummaryCard.vue";
import UiPageHeader from "~/components/ui/UiPageHeader/UiPageHeader.vue";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";

definePageMeta({ layout: false });

const { t, n } = useI18n();
const router = useRouter();
const sessionStore = useSessionStore();

useSeoMeta({
  title: t("cltVsPj.seo.title"),
  description: t("cltVsPj.seo.description"),
  ogTitle: t("cltVsPj.seo.ogTitle"),
  ogDescription: t("cltVsPj.seo.ogDescription"),
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
  useCalculatorFormState<CltVsPjFormState>(createDefaultCltVsPjFormState);

const result = ref<CltVsPjResult | null>(null);
const savedSimulationId = ref<string | null>(null);
const goalCreated = ref(false);

// ─── Select options ───────────────────────────────────────────────────────────

const pjRegimeOptions = computed(() =>
  PJ_REGIMES.map((regime) => ({
    label: t(`cltVsPj.form.regimes.${regime}`),
    value: regime,
  })),
);

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
  const errors = validateCltVsPjForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`cltVsPj.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalCreated.value = false;
  result.value = calculateCltVsPj(form.value);
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
      label: t("cltVsPj.results.cltNet"),
      value: formatBrl(result.value.cltNetMonthly),
    },
    {
      label: t("cltVsPj.results.pjNet"),
      value: formatBrl(result.value.pjNetMonthly),
    },
    {
      label: t("cltVsPj.results.breakEven"),
      value: formatBrl(result.value.breakEvenInvoice),
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
      name: t("cltVsPj.simulation.defaultName", { year: new Date().getFullYear() }),
      toolSlug: "clt_vs_pj",
      inputs: { ...form.value },
      result: { ...result.value },
    });
    savedSimulationId.value = simulation.id;
    return simulation.id;
  } catch (err) {
    captureException(err, { context: "clt-vs-pj/save-simulation" });
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
  const targetAmount = result.value.pjIsMoreProfitable
    ? result.value.pjNetMonthly
    : result.value.cltNetMonthly;
  try {
    await createGoalMutation.mutateAsync({
      name: t("cltVsPj.simulation.goalName"),
      target_amount: targetAmount,
    });
    goalCreated.value = true;
  } catch (err) {
    captureException(err, { context: "clt-vs-pj/create-goal" });
  }
}
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root. -->
  <div class="clt-vs-pj-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout v-if="isAuthenticated" name="default">
    <div class="clt-vs-pj-page clt-vs-pj-page--authenticated">
      <div class="clt-vs-pj-page__layout">
        <!-- Form column -->
        <div class="clt-vs-pj-page__form-col">
          <UiPageHeader
            :title="t('cltVsPj.hero.title')"
            :subtitle="t('cltVsPj.hero.subtitle')"
          />

          <UiGlassPanel class="clt-vs-pj-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('cltVsPj.form.cltTitle')">
                <NFormItem :label="t('cltVsPj.form.cltGrossSalary')">
                  <NInputNumber
                    :value="form.cltGrossSalary"
                    :placeholder="t('cltVsPj.form.grossSalaryPlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ cltGrossSalary: v })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('cltVsPj.form.cltVT') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('cltVsPj.form.cltVTTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.cltVT"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ cltVT: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem :label="t('cltVsPj.form.cltVR')">
                  <NInputNumber
                    :value="form.cltVR"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ cltVR: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem :label="t('cltVsPj.form.dependents')">
                  <NInputNumber
                    :value="form.dependents"
                    :min="0"
                    :max="20"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ dependents: v ?? 0 })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <CalculatorFormSection :title="t('cltVsPj.form.pjTitle')">
                <NFormItem :label="t('cltVsPj.form.pjRegime')">
                  <NSelect
                    :value="form.pjRegime"
                    :options="pjRegimeOptions"
                    style="width: 100%"
                    @update:value="(v) => patch({ pjRegime: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('cltVsPj.form.pjMonthlyInvoice')">
                  <NInputNumber
                    :value="form.pjMonthlyInvoice"
                    :placeholder="t('cltVsPj.form.invoicePlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ pjMonthlyInvoice: v })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('cltVsPj.form.pjFixedCosts') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('cltVsPj.form.pjFixedCostsTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.pjFixedCosts"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ pjFixedCosts: v ?? 0 })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="warning" style="margin-top:12px">
                {{ validationError }}
              </NAlert>

              <div class="clt-vs-pj-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('cltVsPj.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                  {{ t('cltVsPj.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Results column -->
        <div class="clt-vs-pj-page__results-col">
          <UiStickySummaryCard v-if="result">
            <CalculatorResultSummary
              :label="t(result.pjIsMoreProfitable ? 'cltVsPj.results.pjWins' : 'cltVsPj.results.cltWins')"
              :value="formatBrl(result.pjIsMoreProfitable ? result.pjNetMonthly : result.cltNetMonthly)"
              :metrics="summaryMetrics"
            />
          </UiStickySummaryCard>

          <template v-if="result">
            <!-- Comparison card -->
            <UiSurfaceCard>
              <div class="clt-vs-pj-page__comparison">
                <div class="clt-vs-pj-page__comparison-col">
                  <p class="clt-vs-pj-page__col-label">{{ t('cltVsPj.results.cltColumn') }}</p>
                  <p class="clt-vs-pj-page__col-value">{{ formatBrl(result.cltNetMonthly) }}</p>
                  <p class="clt-vs-pj-page__col-sub">{{ t('cltVsPj.results.employerCost', { value: formatBrl(result.cltEmployerTotalCost) }) }}</p>
                </div>
                <div class="clt-vs-pj-page__vs">VS</div>
                <div class="clt-vs-pj-page__comparison-col">
                  <p class="clt-vs-pj-page__col-label">{{ t('cltVsPj.results.pjColumn') }}</p>
                  <p class="clt-vs-pj-page__col-value">{{ formatBrl(result.pjNetMonthly) }}</p>
                  <p class="clt-vs-pj-page__col-sub">{{ t('cltVsPj.results.taxAmount', { value: formatBrl(result.pjTaxAmount) }) }}</p>
                </div>
              </div>

              <div class="clt-vs-pj-page__verdict" :class="result.pjIsMoreProfitable ? 'clt-vs-pj-page__verdict--pj' : 'clt-vs-pj-page__verdict--clt'">
                {{ t(result.pjIsMoreProfitable ? 'cltVsPj.results.pjAdvantage' : 'cltVsPj.results.cltAdvantage', { value: formatBrl(result.monthlyDifference) }) }}
              </div>
            </UiSurfaceCard>

            <!-- Break-even card -->
            <UiSurfaceCard>
              <p class="clt-vs-pj-page__breakeven-label">{{ t('cltVsPj.results.breakEvenLabel') }}</p>
              <p class="clt-vs-pj-page__breakeven-value">{{ formatBrl(result.breakEvenInvoice) }}</p>
              <p class="clt-vs-pj-page__breakeven-note">{{ t('cltVsPj.results.breakEvenNote') }}</p>
            </UiSurfaceCard>

            <!-- Action bar -->
            <UiSurfaceCard class="clt-vs-pj-page__action-bar">
              <NSpace vertical :size="8">
                <NButton
                  block
                  :loading="saveSimulationMutation.isPending.value"
                  :disabled="!!savedSimulationId || saveSimulationMutation.isPending.value"
                  @click="handleSaveSimulation"
                >
                  {{ savedSimulationId ? t('cltVsPj.actions.saved') : t('cltVsPj.actions.save') }}
                </NButton>

                <NButton
                  v-if="hasPremiumAccess"
                  block
                  type="primary"
                  :loading="createGoalMutation.isPending.value"
                  :disabled="goalCreated || createGoalMutation.isPending.value"
                  @click="handleAddAsGoal"
                >
                  {{ goalCreated ? t('cltVsPj.actions.goalAdded') : t('cltVsPj.actions.addAsGoal') }}
                </NButton>

                <NThing
                  v-if="!hasPremiumAccess"
                  :title="t('cltVsPj.premiumCta.title')"
                  :description="t('cltVsPj.premiumCta.description')"
                >
                  <template #footer>
                    <NButton size="small" type="warning" @click="router.push('/subscription')">
                      {{ t('cltVsPj.premiumCta.upgrade') }}
                    </NButton>
                  </template>
                </NThing>
              </NSpace>
            </UiSurfaceCard>

            <!-- Disclaimer -->
            <UiSurfaceCard>
              <NAlert type="warning">
                {{ t('cltVsPj.disclaimer.note', { year: PJ_TABLE_YEAR }) }}
              </NAlert>
            </UiSurfaceCard>
          </template>
        </div>
      </div>
    </div>
  </NuxtLayout>

  <!-- ═══ GUEST — standalone public page ════════════════════════════════════ -->
  <div v-else class="clt-vs-pj-page">
    <header class="clt-vs-pj-page__header">
      <div class="clt-vs-pj-page__brand">
        <span class="clt-vs-pj-page__brand-mark">Auraxis</span>
        <span class="clt-vs-pj-page__brand-copy">{{ t('cltVsPj.header.publicTool') }}</span>
      </div>
      <div class="clt-vs-pj-page__header-actions">
        <NButton quaternary @click="router.push('/tools')">{{ t('cltVsPj.header.otherTools') }}</NButton>
        <NButton type="primary" @click="router.push('/register')">{{ t('cltVsPj.header.createAccount') }}</NButton>
      </div>
    </header>

    <main class="clt-vs-pj-page__content">
      <section class="clt-vs-pj-page__hero">
        <div class="clt-vs-pj-page__hero-copy">
          <NTag round type="warning">{{ t('cltVsPj.hero.badge') }}</NTag>
          <UiPageHeader
            :title="t('cltVsPj.hero.title')"
            :subtitle="t('cltVsPj.hero.subtitle')"
          />
        </div>

        <UiGlassPanel glow class="clt-vs-pj-page__form-panel">
          <NForm @submit.prevent="handleCalculate">
            <CalculatorFormSection :title="t('cltVsPj.form.cltTitle')">
              <NFormItem :label="t('cltVsPj.form.cltGrossSalary')">
                <NInputNumber
                  :value="form.cltGrossSalary"
                  :placeholder="t('cltVsPj.form.grossSalaryPlaceholder')"
                  :min="0"
                  :precision="2"
                  prefix="R$"
                  style="width: 100%"
                  @update:value="(v) => patch({ cltGrossSalary: v })"
                />
              </NFormItem>

              <NFormItem :label="t('cltVsPj.form.dependents')">
                <NInputNumber
                  :value="form.dependents"
                  :min="0"
                  :max="20"
                  :precision="0"
                  style="width: 100%"
                  @update:value="(v) => patch({ dependents: v ?? 0 })"
                />
              </NFormItem>
            </CalculatorFormSection>

            <CalculatorFormSection :title="t('cltVsPj.form.pjTitle')">
              <NFormItem :label="t('cltVsPj.form.pjRegime')">
                <NSelect
                  :value="form.pjRegime"
                  :options="pjRegimeOptions"
                  style="width: 100%"
                  @update:value="(v) => patch({ pjRegime: v })"
                />
              </NFormItem>

              <NFormItem :label="t('cltVsPj.form.pjMonthlyInvoice')">
                <NInputNumber
                  :value="form.pjMonthlyInvoice"
                  :placeholder="t('cltVsPj.form.invoicePlaceholder')"
                  :min="0"
                  :precision="2"
                  prefix="R$"
                  style="width: 100%"
                  @update:value="(v) => patch({ pjMonthlyInvoice: v })"
                />
              </NFormItem>
            </CalculatorFormSection>

            <NAlert v-if="validationError" type="warning" style="margin-top:12px">
              {{ validationError }}
            </NAlert>

            <div class="clt-vs-pj-page__form-actions">
              <NButton v-if="isDirty" quaternary @click="handleReset">
                {{ t('cltVsPj.form.reset') }}
              </NButton>
              <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                {{ t('cltVsPj.form.calculate') }}
              </NButton>
            </div>
          </NForm>
        </UiGlassPanel>
      </section>

      <section v-if="result" class="clt-vs-pj-page__results-section">
        <div class="clt-vs-pj-page__layout">
          <div class="clt-vs-pj-page__results-main">
            <UiSurfaceCard>
              <p class="clt-vs-pj-page__section-title">{{ t('cltVsPj.results.title') }}</p>
              <div class="clt-vs-pj-page__comparison">
                <div class="clt-vs-pj-page__comparison-col">
                  <p class="clt-vs-pj-page__col-label">{{ t('cltVsPj.results.cltColumn') }}</p>
                  <p class="clt-vs-pj-page__col-value">{{ formatBrl(result.cltNetMonthly) }}</p>
                </div>
                <div class="clt-vs-pj-page__vs">VS</div>
                <div class="clt-vs-pj-page__comparison-col">
                  <p class="clt-vs-pj-page__col-label">{{ t('cltVsPj.results.pjColumn') }}</p>
                  <p class="clt-vs-pj-page__col-value">{{ formatBrl(result.pjNetMonthly) }}</p>
                </div>
              </div>

              <div class="clt-vs-pj-page__verdict" :class="result.pjIsMoreProfitable ? 'clt-vs-pj-page__verdict--pj' : 'clt-vs-pj-page__verdict--clt'">
                {{ t(result.pjIsMoreProfitable ? 'cltVsPj.results.pjAdvantage' : 'cltVsPj.results.cltAdvantage', { value: formatBrl(result.monthlyDifference) }) }}
              </div>
            </UiSurfaceCard>

            <UiSurfaceCard>
              <p class="clt-vs-pj-page__breakeven-label">{{ t('cltVsPj.results.breakEvenLabel') }}</p>
              <p class="clt-vs-pj-page__breakeven-value">{{ formatBrl(result.breakEvenInvoice) }}</p>
              <p class="clt-vs-pj-page__breakeven-note">{{ t('cltVsPj.results.breakEvenNote') }}</p>
            </UiSurfaceCard>

            <UiSurfaceCard>
              <NAlert type="warning">
                {{ t('cltVsPj.disclaimer.note', { year: PJ_TABLE_YEAR }) }}
              </NAlert>
            </UiSurfaceCard>
          </div>

          <div class="clt-vs-pj-page__results-aside">
            <UiStickySummaryCard>
              <CalculatorResultSummary
                :label="t(result.pjIsMoreProfitable ? 'cltVsPj.results.pjWins' : 'cltVsPj.results.cltWins')"
                :value="formatBrl(result.pjIsMoreProfitable ? result.pjNetMonthly : result.cltNetMonthly)"
                :metrics="summaryMetrics"
              />
            </UiStickySummaryCard>

            <!-- Guest CTA -->
            <ToolGuestCta />
          </div>
        </div>
      </section>
    </main>
  </div>
  </div>
</template>

<style scoped>
.clt-vs-pj-root {
  display: contents;
}

.clt-vs-pj-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

.clt-vs-pj-page--authenticated {
  padding: var(--space-6, 24px);
}

.clt-vs-pj-page__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .clt-vs-pj-page__layout {
    grid-template-columns: 1fr;
  }
}

.clt-vs-pj-page__form-col,
.clt-vs-pj-page__results-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.clt-vs-pj-page__form-panel {
  width: 100%;
}

.clt-vs-pj-page__form-actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}

.clt-vs-pj-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-bottom: 1px solid var(--color-outline-subtle);
  background: var(--color-bg-elevated);
}

.clt-vs-pj-page__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
}

.clt-vs-pj-page__brand-mark {
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
  color: var(--color-text-primary);
}

.clt-vs-pj-page__brand-copy {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.clt-vs-pj-page__header-actions {
  display: flex;
  gap: var(--space-2, 8px);
}

.clt-vs-pj-page__content {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8, 32px) var(--space-6, 24px);
}

.clt-vs-pj-page__hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8, 32px);
  align-items: start;
  margin-bottom: var(--space-8, 32px);
}

@media (max-width: 768px) {
  .clt-vs-pj-page__hero {
    grid-template-columns: 1fr;
  }
}

.clt-vs-pj-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

.clt-vs-pj-page__results-section {
  margin-top: var(--space-6, 24px);
}

.clt-vs-pj-page__results-main,
.clt-vs-pj-page__results-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.clt-vs-pj-page__section-title {
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-3, 12px) 0;
}

.clt-vs-pj-page__comparison {
  display: flex;
  align-items: center;
  gap: var(--space-4, 16px);
  padding: var(--space-4, 16px) 0;
}

.clt-vs-pj-page__comparison-col {
  flex: 1;
  text-align: center;
}

.clt-vs-pj-page__col-label {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-1, 4px) 0;
}

.clt-vs-pj-page__col-value {
  font-size: var(--font-size-body-xl, 20px);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  margin: 0;
}

.clt-vs-pj-page__col-sub {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-muted);
  margin: var(--space-1, 4px) 0 0 0;
}

.clt-vs-pj-page__vs {
  font-size: var(--font-size-body-sm, 13px);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-text-muted);
}

.clt-vs-pj-page__verdict {
  text-align: center;
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-sm, 13px);
  padding: var(--space-2, 8px) var(--space-3, 12px);
  border-radius: var(--radius-md, 6px);
  margin-top: var(--space-2, 8px);
}

.clt-vs-pj-page__verdict--pj {
  background: color-mix(in srgb, var(--color-semantic-positive, #22c55e) 15%, transparent);
  color: var(--color-semantic-positive, #22c55e);
}

.clt-vs-pj-page__verdict--clt {
  background: color-mix(in srgb, var(--color-brand-600, #0284c7) 15%, transparent);
  color: var(--color-brand-600, #0284c7);
}

.clt-vs-pj-page__breakeven-label {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-1, 4px) 0;
}

.clt-vs-pj-page__breakeven-value {
  font-size: var(--font-size-body-xl, 20px);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
  margin: 0 0 var(--space-1, 4px) 0;
}

.clt-vs-pj-page__breakeven-note {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

.clt-vs-pj-page__action-bar {
  flex-shrink: 0;
}
</style>
