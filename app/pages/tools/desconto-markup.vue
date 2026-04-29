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

import { captureException } from "~/core/observability";
import { useApiError } from "~/composables/useApiError";
import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import { useSessionStore } from "~/stores/session";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";
import { useCreateGoalMutation } from "~/features/goals/queries/use-create-goal-mutation";
import {
  DESCONTO_MARKUP_MODES,
  calculateDescontoMarkup,
  createDefaultDescontoMarkupFormState,
  validateDescontoMarkupForm,
  type DescontoMarkupFormState,
  type DescontoMarkupResult,
} from "~/features/tools/model/desconto-markup";
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
const sessionStore = useSessionStore();

useSeoMeta({
  title: t("descontoMarkup.seo.title"),
  description: t("descontoMarkup.seo.description"),
  ogTitle: t("descontoMarkup.seo.ogTitle"),
  ogDescription: t("descontoMarkup.seo.ogDescription"),
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

const { form, validationError, patch, reset, setValidationError } =
  useCalculatorFormState<DescontoMarkupFormState>(createDefaultDescontoMarkupFormState);

const result = ref<DescontoMarkupResult | null>(null);
const savedSimulationId = ref<string | null>(null);
const goalAdded = ref(false);

// ─── Select options ───────────────────────────────────────────────────────────

const modeOptions = computed(() =>
  DESCONTO_MARKUP_MODES.map((mode) => ({
    label: t(`descontoMarkup.form.mode${mode.charAt(0).toUpperCase()}${mode.slice(1)}`),
    value: mode,
  })),
);

// ─── Dynamic form labels ──────────────────────────────────────────────────────

const priceLabel = computed(() => {
  switch (form.value.mode) {
    case "desconto": return t("descontoMarkup.form.price");
    case "margem": return t("descontoMarkup.form.priceSale");
    case "reverso": return t("descontoMarkup.form.priceFinal");
    default: return t("descontoMarkup.form.price");
  }
});

const pctLabel = computed(() => {
  switch (form.value.mode) {
    case "desconto":
    case "reverso": return t("descontoMarkup.form.pctDesconto");
    case "markup": return t("descontoMarkup.form.pctMarkup");
    default: return t("descontoMarkup.form.pctDesconto");
  }
});

const showPrice = computed(() => form.value.mode !== "markup");
const showPct = computed(() => form.value.mode !== "margem");
const showCost = computed(() => form.value.mode === "markup" || form.value.mode === "margem");

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

/**
 * Returns the primary result label based on mode.
 *
 * @returns Translated label string.
 */
function getPrimaryResultLabel(): string {
  if (form.value.mode === "desconto") { return t("descontoMarkup.results.finalPrice"); }
  if (form.value.mode === "markup") { return t("descontoMarkup.results.salePrice"); }
  if (form.value.mode === "margem") { return t("descontoMarkup.results.marginPct"); }
  return t("descontoMarkup.results.originalPrice");
}

/**
 * Returns the primary result formatted value.
 *
 * @param res Calculation result.
 * @returns Formatted string.
 */
function getPrimaryResultValue(res: DescontoMarkupResult): string {
  if (res.mode === "margem") {
    return `${res.calculatedValue.toFixed(2)}%`;
  }
  return formatBrl(res.calculatedValue);
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Validates the form and triggers the calculation when valid.
 */
function handleCalculate(): void {
  const errors = validateDescontoMarkupForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`descontoMarkup.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalAdded.value = false;
  result.value = calculateDescontoMarkup(form.value);
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
  const metrics = [];

  if (result.value.mode === "desconto") {
    metrics.push({ label: t("descontoMarkup.results.savings"), value: formatBrl(result.value.savingsOrProfit) });
  } else if (result.value.mode === "markup" || result.value.mode === "margem") {
    metrics.push({ label: t("descontoMarkup.results.profit"), value: formatBrl(result.value.savingsOrProfit) });
  } else if (result.value.mode === "reverso") {
    metrics.push({ label: t("descontoMarkup.results.discount"), value: formatBrl(result.value.savingsOrProfit) });
  }

  return metrics;
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
      // TODO(simulations-canonical): 'desconto_markup' is not in the registry yet (DEC-196)
      toolId: "desconto_markup",
      ruleVersion: "2026.04",
      inputs: { ...form.value },
      result: { ...result.value },
    });
    savedSimulationId.value = simulation.id;
    return simulation.id;
  } catch (err) {
    captureException(err, { context: "desconto-markup/save-simulation" });
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
 * Saves the simulation then creates a goal from the calculated value.
 */
async function handleAddAsGoal(): Promise<void> {
  if (!result.value) { return; }

  await ensureSimulationSaved();

  try {
    await createGoalMutation.mutateAsync({
      name: t("descontoMarkup.simulation.goalName"),
      target_amount: result.value.calculatedValue,
    });
    goalAdded.value = true;
  } catch (err) {
    captureException(err, { context: "desconto-markup/add-as-goal" });
    toast.error(getErrorMessage(err));
  }
}

// ─── Derived action states ────────────────────────────────────────────────────

const isBridging = computed(
  () =>
    saveSimulationMutation.isPending.value ||
    createGoalMutation.isPending.value,
);

const isSaved = computed(() => savedSimulationId.value !== null);
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root. -->
  <div class="desconto-markup-root">
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="desconto-markup-page desconto-markup-page--authenticated">
      <div class="desconto-markup-page__layout">
        <!-- Form column -->
        <div class="desconto-markup-page__form-col">
          <UiPageHeader
            :title="t('descontoMarkup.hero.title')"
            :subtitle="t('descontoMarkup.hero.subtitle')"
          />

          <UiGlassPanel class="desconto-markup-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('descontoMarkup.form.mode')">
                <NFormItem :label="t('descontoMarkup.form.mode')">
                  <NSelect
                    :value="form.mode"
                    :options="modeOptions"
                    style="width: 100%"
                    @update:value="(v) => patch({ mode: v })"
                  />
                </NFormItem>

                <NFormItem v-if="showPrice" :label="priceLabel">
                  <NInputNumber
                    :value="form.price"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ price: v })"
                  />
                </NFormItem>

                <NFormItem v-if="showPct" :label="pctLabel">
                  <NInputNumber
                    :value="form.pct"
                    :min="0"
                    :max="form.mode === 'reverso' ? 99.99 : 100"
                    :precision="2"
                    style="width: 100%"
                    @update:value="(v) => patch({ pct: v })"
                  />
                </NFormItem>

                <NFormItem v-if="showCost" :label="t('descontoMarkup.form.cost')">
                  <NInputNumber
                    :value="form.cost"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ cost: v })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="error" style="margin-bottom: 16px">
                {{ validationError }}
              </NAlert>

              <NSpace style="margin-top: 16px">
                <NButton type="primary" attr-type="submit" :loading="isBridging">
                  {{ t('descontoMarkup.form.calculate') }}
                </NButton>
                <NButton quaternary @click="handleReset">
                  {{ t('descontoMarkup.form.reset') }}
                </NButton>
              </NSpace>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Result column -->
        <div v-if="result" class="desconto-markup-page__result-col">
          <UiStickySummaryCard>
            <CalculatorResultSummary
              :label="getPrimaryResultLabel()"
              :value="getPrimaryResultValue(result)"
              :metrics="summaryMetrics"
            />

            <NSpace vertical style="margin-top: 16px">
              <!-- Free: save simulation -->
              <NButton
                v-if="isAuthenticated"
                :loading="saveSimulationMutation.isPending.value"
                :disabled="isSaved"
                block
                @click="handleSaveSimulation"
              >
                {{ isSaved ? t('descontoMarkup.actions.saved') : t('descontoMarkup.actions.save') }}
              </NButton>

              <!-- Premium: add as goal -->
              <NButton
                v-if="hasPremiumAccess && result.mode !== 'margem'"
                type="primary"
                :loading="createGoalMutation.isPending.value"
                :disabled="goalAdded"
                block
                @click="handleAddAsGoal"
              >
                {{ goalAdded ? t('descontoMarkup.actions.goalAdded') : t('descontoMarkup.actions.addAsGoal') }}
              </NButton>
            </NSpace>
          </UiStickySummaryCard>

          <!-- Detail card -->
          <UiSurfaceCard class="desconto-markup-page__detail">
            <NThing
              v-if="result.mode === 'desconto'"
              :title="t('descontoMarkup.results.savings')"
              :description="formatBrl(result.savingsOrProfit)"
            />
            <NThing
              v-if="result.mode === 'markup' || result.mode === 'margem'"
              :title="t('descontoMarkup.results.profit')"
              :description="formatBrl(result.savingsOrProfit)"
            />
            <NThing
              v-if="result.mode === 'reverso'"
              :title="t('descontoMarkup.results.discount')"
              :description="formatBrl(result.savingsOrProfit)"
            />
          </UiSurfaceCard>

          <!-- Guest CTA — shown below result for unauthenticated users -->
          <ToolGuestCta v-if="!isAuthenticated" />
        </div>
      </div>
    </div>
  </NuxtLayout>
  </div>
</template>
