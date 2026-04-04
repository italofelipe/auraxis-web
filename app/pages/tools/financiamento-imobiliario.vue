<script setup lang="ts">
import { computed, ref } from "vue";
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInputNumber,
  NSpace,
  NTag,
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
  FINANCIAMENTO_TABLE_YEAR,
  calculateFinanciamento,
  createDefaultFinanciamentoFormState,
  validateFinanciamentoForm,
  type FinanciamentoFormState,
  type FinanciamentoResult,
} from "~/features/tools/model/financiamento-imobiliario";
import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
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
  title: t("financiamentoImobiliario.seo.title"),
  description: t("financiamentoImobiliario.seo.description"),
  ogTitle: t("financiamentoImobiliario.seo.ogTitle"),
  ogDescription: t("financiamentoImobiliario.seo.ogDescription"),
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
  useCalculatorFormState<FinanciamentoFormState>(createDefaultFinanciamentoFormState);

const result = ref<FinanciamentoResult | null>(null);
const savedSimulationId = ref<string | null>(null);
const goalAdded = ref(false);

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
  const errors = validateFinanciamentoForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`financiamentoImobiliario.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalAdded.value = false;
  result.value = calculateFinanciamento(form.value);
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
      label: t("financiamentoImobiliario.results.downPayment"),
      value: formatBrl(result.value.downPayment),
    },
    {
      label: t("financiamentoImobiliario.results.sacFirstPayment"),
      value: formatBrl(result.value.sac.firstPayment),
    },
    {
      label: t("financiamentoImobiliario.results.pricePayment"),
      value: formatBrl(result.value.price.firstPayment),
    },
    {
      label: t("financiamentoImobiliario.results.cetEstimated"),
      value: `${result.value.cetEstimatedPct.toFixed(2)}% a.a.`,
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
      name: t("financiamentoImobiliario.simulation.defaultName", { year: new Date().getFullYear() }),
      toolSlug: "financiamento_imobiliario",
      inputs: { ...form.value },
      result: {
        loanAmount: result.value.loanAmount,
        downPayment: result.value.downPayment,
        sacFirstPayment: result.value.sac.firstPayment,
        sacLastPayment: result.value.sac.lastPayment,
        sacTotalInterest: result.value.sac.totalInterest,
        pricePayment: result.value.price.firstPayment,
        priceTotalInterest: result.value.price.totalInterest,
        cetEstimatedPct: result.value.cetEstimatedPct,
      },
    });
    savedSimulationId.value = simulation.id;
    return simulation.id;
  } catch (err) {
    captureException(err, { context: "financiamento-imobiliario/save-simulation" });
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

// ─── Goal bridge (premium) ────────────────────────────────────────────────────

/**
 * Saves the simulation then creates a goal from the loan amount.
 */
async function handleAddAsGoal(): Promise<void> {
  if (!result.value) { return; }

  await ensureSimulationSaved();

  try {
    await createGoalMutation.mutateAsync({
      name: t("financiamentoImobiliario.simulation.goalName"),
      target_amount: result.value.loanAmount,
    });
    goalAdded.value = true;
  } catch (err) {
    captureException(err, { context: "financiamento-imobiliario/add-as-goal" });
    toast.error(getErrorMessage(err));
  }
}

// ─── Derived states ───────────────────────────────────────────────────────────

const isBridging = computed(
  () => saveSimulationMutation.isPending.value || createGoalMutation.isPending.value,
);

const isSaved = computed(() => savedSimulationId.value !== null);
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root. -->
  <div class="fin-imob-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout v-if="isAuthenticated" name="default">
    <div class="fin-imob-page fin-imob-page--authenticated">
      <div class="fin-imob-page__layout">
        <!-- Form column -->
        <div class="fin-imob-page__form-col">
          <UiPageHeader
            :title="t('financiamentoImobiliario.hero.title')"
            :subtitle="t('financiamentoImobiliario.hero.subtitle')"
          />

          <UiGlassPanel class="fin-imob-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('financiamentoImobiliario.form.title')">
                <NFormItem :label="t('financiamentoImobiliario.form.propertyValue')">
                  <NInputNumber
                    :value="form.propertyValue"
                    :placeholder="t('financiamentoImobiliario.form.propertyValuePlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ propertyValue: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('financiamentoImobiliario.form.downPaymentPct')">
                  <NInputNumber
                    :value="form.downPaymentPct"
                    :min="0"
                    :max="99"
                    :precision="1"
                    style="width: 100%"
                    @update:value="(v) => patch({ downPaymentPct: v ?? 20 })"
                  />
                </NFormItem>

                <NFormItem :label="t('financiamentoImobiliario.form.termMonths')">
                  <NInputNumber
                    :value="form.termMonths"
                    :min="12"
                    :max="360"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ termMonths: v ?? 360 })"
                  />
                </NFormItem>

                <NFormItem :label="t('financiamentoImobiliario.form.annualRatePct')">
                  <NInputNumber
                    :value="form.annualRatePct"
                    :placeholder="t('financiamentoImobiliario.form.annualRatePlaceholder')"
                    :min="0"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ annualRatePct: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('financiamentoImobiliario.form.insuranceMonthly')">
                  <NInputNumber
                    :value="form.insuranceMonthly"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ insuranceMonthly: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem :label="t('financiamentoImobiliario.form.adminFeeMonthly')">
                  <NInputNumber
                    :value="form.adminFeeMonthly"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ adminFeeMonthly: v ?? 0 })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="warning" style="margin-top:12px">
                {{ validationError }}
              </NAlert>

              <div class="fin-imob-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('financiamentoImobiliario.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :loading="isBridging" :style="{ flex: 1 }">
                  {{ t('financiamentoImobiliario.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Results column -->
        <div class="fin-imob-page__results-col">
          <UiStickySummaryCard v-if="result">
            <CalculatorResultSummary
              :label="t('financiamentoImobiliario.results.loanAmount')"
              :value="formatBrl(result.loanAmount)"
              :metrics="summaryMetrics"
            />

            <NSpace vertical style="margin-top: 16px">
              <NButton
                v-if="isAuthenticated"
                :loading="saveSimulationMutation.isPending.value"
                :disabled="isSaved"
                block
                @click="handleSaveSimulation"
              >
                {{ isSaved ? t('financiamentoImobiliario.actions.saved') : t('financiamentoImobiliario.actions.save') }}
              </NButton>

              <NButton
                v-if="hasPremiumAccess"
                type="primary"
                :loading="createGoalMutation.isPending.value"
                :disabled="goalAdded"
                block
                @click="handleAddAsGoal"
              >
                {{ goalAdded ? t('financiamentoImobiliario.actions.goalAdded') : t('financiamentoImobiliario.actions.addAsGoal') }}
              </NButton>
            </NSpace>
          </UiStickySummaryCard>

          <template v-if="result">
            <!-- SAC vs PRICE comparison table -->
            <UiSurfaceCard>
              <p class="fin-imob-page__section-title">{{ t('financiamentoImobiliario.results.comparisonTitle') }}</p>
              <div class="fin-imob-page__comparison-table">
                <div class="fin-imob-page__comparison-header">
                  <span />
                  <span class="fin-imob-page__comparison-col-label">{{ t('financiamentoImobiliario.results.sacLabel') }}</span>
                  <span class="fin-imob-page__comparison-col-label">{{ t('financiamentoImobiliario.results.priceLabel') }}</span>
                </div>
                <div class="fin-imob-page__comparison-row">
                  <span>{{ t('financiamentoImobiliario.results.firstPayment') }}</span>
                  <span>{{ formatBrl(result.sac.firstPayment) }}</span>
                  <span>{{ formatBrl(result.price.firstPayment) }}</span>
                </div>
                <div class="fin-imob-page__comparison-row">
                  <span>{{ t('financiamentoImobiliario.results.lastPayment') }}</span>
                  <span>{{ formatBrl(result.sac.lastPayment) }}</span>
                  <span>{{ formatBrl(result.price.lastPayment) }}</span>
                </div>
                <div class="fin-imob-page__comparison-row">
                  <span>{{ t('financiamentoImobiliario.results.totalInterest') }}</span>
                  <span class="fin-imob-page__value--negative">{{ formatBrl(result.sac.totalInterest) }}</span>
                  <span class="fin-imob-page__value--negative">{{ formatBrl(result.price.totalInterest) }}</span>
                </div>
                <div class="fin-imob-page__comparison-row fin-imob-page__comparison-row--total">
                  <span>{{ t('financiamentoImobiliario.results.totalPaid') }}</span>
                  <span class="fin-imob-page__value--bold">{{ formatBrl(result.sac.totalPaid) }}</span>
                  <span class="fin-imob-page__value--bold">{{ formatBrl(result.price.totalPaid) }}</span>
                </div>
                <div class="fin-imob-page__comparison-row">
                  <span>{{ t('financiamentoImobiliario.results.savingsVsPrice') }}</span>
                  <span class="fin-imob-page__value--positive">{{ formatBrl(result.price.totalPaid - result.sac.totalPaid) }}</span>
                  <span>—</span>
                </div>
              </div>
            </UiSurfaceCard>

            <!-- CET summary -->
            <UiSurfaceCard>
              <NThing
                :title="t('financiamentoImobiliario.results.cetEstimated')"
                :description="`${result.cetEstimatedPct.toFixed(2)}% a.a.`"
              />
              <NAlert type="warning" style="margin-top: 12px">
                {{ t('financiamentoImobiliario.disclaimer.cet', { year: FINANCIAMENTO_TABLE_YEAR }) }}
              </NAlert>
            </UiSurfaceCard>
          </template>
        </div>
      </div>
    </div>
  </NuxtLayout>

  <!-- ═══ GUEST — standalone public page ════════════════════════════════════ -->
  <div v-else class="fin-imob-page">
    <header class="fin-imob-page__header">
      <div class="fin-imob-page__brand">
        <span class="fin-imob-page__brand-mark">Auraxis</span>
        <span class="fin-imob-page__brand-copy">{{ t('financiamentoImobiliario.header.publicTool') }}</span>
      </div>
      <div class="fin-imob-page__header-actions">
        <NButton quaternary @click="router.push('/tools')">{{ t('financiamentoImobiliario.header.otherTools') }}</NButton>
        <NButton type="primary" @click="router.push('/register')">{{ t('financiamentoImobiliario.header.createAccount') }}</NButton>
      </div>
    </header>

    <main class="fin-imob-page__content">
      <section class="fin-imob-page__hero">
        <div class="fin-imob-page__hero-copy">
          <NTag round type="warning">{{ t('financiamentoImobiliario.hero.badge') }}</NTag>
          <UiPageHeader
            :title="t('financiamentoImobiliario.hero.title')"
            :subtitle="t('financiamentoImobiliario.hero.subtitle')"
          />
        </div>

        <UiGlassPanel glow class="fin-imob-page__form-panel">
          <NForm @submit.prevent="handleCalculate">
            <CalculatorFormSection :title="t('financiamentoImobiliario.form.title')">
              <NFormItem :label="t('financiamentoImobiliario.form.propertyValue')">
                <NInputNumber
                  :value="form.propertyValue"
                  :placeholder="t('financiamentoImobiliario.form.propertyValuePlaceholder')"
                  :min="0"
                  :precision="2"
                  prefix="R$"
                  style="width: 100%"
                  @update:value="(v) => patch({ propertyValue: v })"
                />
              </NFormItem>

              <NFormItem :label="t('financiamentoImobiliario.form.downPaymentPct')">
                <NInputNumber
                  :value="form.downPaymentPct"
                  :min="0"
                  :max="99"
                  :precision="1"
                  style="width: 100%"
                  @update:value="(v) => patch({ downPaymentPct: v ?? 20 })"
                />
              </NFormItem>

              <NFormItem :label="t('financiamentoImobiliario.form.termMonths')">
                <NInputNumber
                  :value="form.termMonths"
                  :min="12"
                  :max="360"
                  :precision="0"
                  style="width: 100%"
                  @update:value="(v) => patch({ termMonths: v ?? 360 })"
                />
              </NFormItem>

              <NFormItem :label="t('financiamentoImobiliario.form.annualRatePct')">
                <NInputNumber
                  :value="form.annualRatePct"
                  :placeholder="t('financiamentoImobiliario.form.annualRatePlaceholder')"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  @update:value="(v) => patch({ annualRatePct: v })"
                />
              </NFormItem>

              <NFormItem :label="t('financiamentoImobiliario.form.insuranceMonthly')">
                <NInputNumber
                  :value="form.insuranceMonthly"
                  :min="0"
                  :precision="2"
                  prefix="R$"
                  style="width: 100%"
                  @update:value="(v) => patch({ insuranceMonthly: v ?? 0 })"
                />
              </NFormItem>

              <NFormItem :label="t('financiamentoImobiliario.form.adminFeeMonthly')">
                <NInputNumber
                  :value="form.adminFeeMonthly"
                  :min="0"
                  :precision="2"
                  prefix="R$"
                  style="width: 100%"
                  @update:value="(v) => patch({ adminFeeMonthly: v ?? 0 })"
                />
              </NFormItem>
            </CalculatorFormSection>

            <NAlert v-if="validationError" type="warning" style="margin-top:12px">
              {{ validationError }}
            </NAlert>

            <div class="fin-imob-page__form-actions">
              <NButton v-if="isDirty" quaternary @click="handleReset">
                {{ t('financiamentoImobiliario.form.reset') }}
              </NButton>
              <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                {{ t('financiamentoImobiliario.form.calculate') }}
              </NButton>
            </div>
          </NForm>
        </UiGlassPanel>
      </section>

      <section v-if="result" class="fin-imob-page__results-section">
        <div class="fin-imob-page__layout">
          <div class="fin-imob-page__results-main">
            <!-- SAC vs PRICE comparison table -->
            <UiSurfaceCard>
              <p class="fin-imob-page__section-title">{{ t('financiamentoImobiliario.results.comparisonTitle') }}</p>
              <div class="fin-imob-page__comparison-table">
                <div class="fin-imob-page__comparison-header">
                  <span />
                  <span class="fin-imob-page__comparison-col-label">{{ t('financiamentoImobiliario.results.sacLabel') }}</span>
                  <span class="fin-imob-page__comparison-col-label">{{ t('financiamentoImobiliario.results.priceLabel') }}</span>
                </div>
                <div class="fin-imob-page__comparison-row">
                  <span>{{ t('financiamentoImobiliario.results.firstPayment') }}</span>
                  <span>{{ formatBrl(result.sac.firstPayment) }}</span>
                  <span>{{ formatBrl(result.price.firstPayment) }}</span>
                </div>
                <div class="fin-imob-page__comparison-row">
                  <span>{{ t('financiamentoImobiliario.results.lastPayment') }}</span>
                  <span>{{ formatBrl(result.sac.lastPayment) }}</span>
                  <span>{{ formatBrl(result.price.lastPayment) }}</span>
                </div>
                <div class="fin-imob-page__comparison-row">
                  <span>{{ t('financiamentoImobiliario.results.totalInterest') }}</span>
                  <span class="fin-imob-page__value--negative">{{ formatBrl(result.sac.totalInterest) }}</span>
                  <span class="fin-imob-page__value--negative">{{ formatBrl(result.price.totalInterest) }}</span>
                </div>
                <div class="fin-imob-page__comparison-row fin-imob-page__comparison-row--total">
                  <span>{{ t('financiamentoImobiliario.results.totalPaid') }}</span>
                  <span class="fin-imob-page__value--bold">{{ formatBrl(result.sac.totalPaid) }}</span>
                  <span class="fin-imob-page__value--bold">{{ formatBrl(result.price.totalPaid) }}</span>
                </div>
                <div class="fin-imob-page__comparison-row">
                  <span>{{ t('financiamentoImobiliario.results.savingsVsPrice') }}</span>
                  <span class="fin-imob-page__value--positive">{{ formatBrl(result.price.totalPaid - result.sac.totalPaid) }}</span>
                  <span>—</span>
                </div>
              </div>
            </UiSurfaceCard>

            <!-- CET summary -->
            <UiSurfaceCard>
              <NThing
                :title="t('financiamentoImobiliario.results.cetEstimated')"
                :description="`${result.cetEstimatedPct.toFixed(2)}% a.a.`"
              />
              <NAlert type="warning" style="margin-top: 12px">
                {{ t('financiamentoImobiliario.disclaimer.cet', { year: FINANCIAMENTO_TABLE_YEAR }) }}
              </NAlert>
            </UiSurfaceCard>
          </div>

          <div class="fin-imob-page__results-aside">
            <UiStickySummaryCard>
              <CalculatorResultSummary
                :label="t('financiamentoImobiliario.results.loanAmount')"
                :value="formatBrl(result.loanAmount)"
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
/* ── Root & page ─────────────────────────────────────────────────────────────── */
.fin-imob-root {
  display: contents;
}

.fin-imob-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

/* ── Authenticated layout ─────────────────────────────────────────────────── */
.fin-imob-page--authenticated {
  padding: var(--space-6, 24px);
}

.fin-imob-page__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .fin-imob-page__layout {
    grid-template-columns: 1fr;
  }
}

.fin-imob-page__form-col,
.fin-imob-page__results-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.fin-imob-page__form-panel {
  width: 100%;
}

/* ── Form actions ────────────────────────────────────────────────────────────── */
.fin-imob-page__form-actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}

/* ── Guest header ────────────────────────────────────────────────────────────── */
.fin-imob-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-bottom: 1px solid var(--color-outline-subtle);
  background: var(--color-bg-elevated);
}

.fin-imob-page__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
}

.fin-imob-page__brand-mark {
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
  color: var(--color-text-primary);
}

.fin-imob-page__brand-copy {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.fin-imob-page__header-actions {
  display: flex;
  gap: var(--space-2, 8px);
}

/* ── Guest hero ──────────────────────────────────────────────────────────────── */
.fin-imob-page__content {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8, 32px) var(--space-6, 24px);
}

.fin-imob-page__hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8, 32px);
  align-items: start;
  margin-bottom: var(--space-8, 32px);
}

@media (max-width: 768px) {
  .fin-imob-page__hero {
    grid-template-columns: 1fr;
  }
}

.fin-imob-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

/* ── Results section (guest) ─────────────────────────────────────────────────── */
.fin-imob-page__results-section {
  margin-top: var(--space-6, 24px);
}

.fin-imob-page__results-main,
.fin-imob-page__results-aside {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

/* ── Section title ───────────────────────────────────────────────────────────── */
.fin-imob-page__section-title {
  font-weight: var(--font-weight-semibold, 600);
  font-size: var(--font-size-body-sm, 13px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-3, 12px) 0;
}

/* ── Comparison table ────────────────────────────────────────────────────────── */
.fin-imob-page__comparison-table {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}

.fin-imob-page__comparison-header,
.fin-imob-page__comparison-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: var(--space-2, 8px);
  align-items: center;
  font-size: var(--font-size-body-sm, 13px);
  padding: var(--space-1, 4px) 0;
}

.fin-imob-page__comparison-col-label {
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-secondary);
  text-align: right;
}

.fin-imob-page__comparison-row {
  border-top: 1px solid var(--color-outline-subtle);
}

.fin-imob-page__comparison-row span:not(:first-child) {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.fin-imob-page__comparison-row--total {
  font-weight: var(--font-weight-semibold, 600);
}

/* ── Values ──────────────────────────────────────────────────────────────────── */
.fin-imob-page__value--positive {
  color: var(--color-semantic-positive, #22c55e);
  font-variant-numeric: tabular-nums;
}

.fin-imob-page__value--negative {
  color: var(--color-semantic-negative, #ef4444);
  font-variant-numeric: tabular-nums;
}

.fin-imob-page__value--bold {
  font-weight: var(--font-weight-semibold, 600);
  font-variant-numeric: tabular-nums;
}
</style>
