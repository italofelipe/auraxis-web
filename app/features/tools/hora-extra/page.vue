<script setup lang="ts">
import { computed, ref } from "vue";
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInputNumber,
  NSpace,
  NThing,
  NTooltip,
} from "naive-ui";
import { Info } from "lucide-vue-next";

import { captureException } from "~/core/observability";
import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import { useToolPageContext } from "~/features/tools/composables/use-tool-page-context";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";
import {
  BR_TAX_TABLE_YEAR,
  CLT_DEFAULT_HOURS_PER_MONTH,
  calculateHoraExtra,
  createDefaultHoraExtraFormState,
  validateHoraExtraForm,
  type HoraExtraFormState,
  type HoraExtraResult,
} from "~/features/tools/model/hora-extra";

import HoraExtraResultPanel from "./HoraExtraResult.vue";
import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import UiStickySummaryCard from "~/components/ui/UiStickySummaryCard/UiStickySummaryCard.vue";
import UiPageHeader from "~/components/ui/UiPageHeader/UiPageHeader.vue";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";

defineOptions({ name: "HoraExtraPage" });

const { t, toast, getErrorMessage, router, isAuthenticated, hasPremiumAccess, formatBrl } =
  useToolPageContext();

// ─── Calculator form state ────────────────────────────────────────────────────

const { form, validationError, isDirty, patch, reset, setValidationError } =
  useCalculatorFormState<HoraExtraFormState>(createDefaultHoraExtraFormState);

const result = ref<HoraExtraResult | null>(null);
const savedSimulationId = ref<string | null>(null);

// ─── Mutations ────────────────────────────────────────────────────────────────

const saveSimulationMutation = useSaveSimulationMutation();

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Validates the form and triggers the calculation when valid.
 *
 * @returns void
 */
function handleCalculate(): void {
  const errors = validateHoraExtraForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`horaExtra.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  result.value = calculateHoraExtra(form.value);
}

/**
 * Resets the form to its initial state and clears the result.
 *
 * @returns void
 */
function handleReset(): void {
  reset();
  result.value = null;
  savedSimulationId.value = null;
}

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    { label: t("horaExtra.results.totalOvertimeGross"), value: formatBrl(result.value.totalOvertimeGross) },
    {
      label: t("horaExtra.results.inssOvertimeImpact"),
      value: result.value.inssOvertimeImpact > 0
        ? `\u2212 ${formatBrl(result.value.inssOvertimeImpact)}`
        : formatBrl(0),
    },
    { label: t("horaExtra.results.hourlyRate"), value: formatBrl(result.value.hourlyRate) },
    { label: t("horaExtra.results.totalOvertimeHours"), value: `${result.value.totalOvertimeHours}h` },
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
      name: t("horaExtra.simulation.defaultName", { year: new Date().getFullYear() }),
      toolSlug: "hora_extra",
      inputs: { ...form.value },
      result: { ...result.value },
    });
    savedSimulationId.value = simulation.id;
    return simulation.id;
  } catch (err) {
    captureException(err, { context: "hora-extra/save-simulation" });
    toast.error(getErrorMessage(err));
    return null;
  }
}

/**
 * Handles the Save Simulation button click.
 *
 * @returns void
 */
async function handleSaveSimulation(): Promise<void> {
  await ensureSimulationSaved();
}
</script>

<template>
  <div class="hora-extra-root">
  <!-- ═══ AUTHENTICATED ═══════════════════════════════════════════════════════ -->
  <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
    <div class="hora-extra-page hora-extra-page--authenticated">
      <div class="hora-extra-page__layout">
        <!-- Form column -->
        <div class="hora-extra-page__form-col">
          <UiPageHeader
            :title="t('horaExtra.hero.title')"
            :subtitle="t('horaExtra.hero.subtitle')"
          />

          <UiGlassPanel class="hora-extra-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('horaExtra.form.title')">
                <NFormItem :label="t('horaExtra.form.grossSalary')">
                  <NInputNumber
                    :value="form.grossSalary"
                    :placeholder="t('horaExtra.form.grossSalaryPlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ grossSalary: v })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('horaExtra.form.hoursPerMonth') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('horaExtra.form.hoursPerMonthTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.hoursPerMonth"
                    :min="1"
                    :max="744"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ hoursPerMonth: v ?? CLT_DEFAULT_HOURS_PER_MONTH })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('horaExtra.form.hours50') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('horaExtra.form.hours50Tooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.hours50"
                    :min="0"
                    :precision="1"
                    style="width: 100%"
                    @update:value="(v) => patch({ hours50: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('horaExtra.form.hours75') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('horaExtra.form.hours75Tooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.hours75"
                    :min="0"
                    :precision="1"
                    style="width: 100%"
                    @update:value="(v) => patch({ hours75: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('horaExtra.form.hours100') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left:4px;cursor:help;vertical-align:middle;" />
                      </template>
                      {{ t('horaExtra.form.hours100Tooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.hours100"
                    :min="0"
                    :precision="1"
                    style="width: 100%"
                    @update:value="(v) => patch({ hours100: v ?? 0 })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="warning" style="margin-top:12px">
                {{ validationError }}
              </NAlert>

              <div class="hora-extra-page__form-actions">
                <NButton v-if="isDirty" quaternary @click="handleReset">
                  {{ t('horaExtra.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                  {{ t('horaExtra.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Results column -->
        <div class="hora-extra-page__results-col">
          <UiStickySummaryCard v-if="result">
            <CalculatorResultSummary
              :label="t('horaExtra.results.netOvertimeEstimate')"
              :value="formatBrl(result.netOvertimeEstimate)"
              :metrics="summaryMetrics"
            />
          </UiStickySummaryCard>

          <template v-if="result">
            <UiSurfaceCard>
              <div class="hora-extra-page__breakdown">
                <HoraExtraResultPanel :result="result" />
              </div>
            </UiSurfaceCard>

            <!-- Action bar -->
            <UiSurfaceCard class="hora-extra-page__action-bar">
              <NSpace vertical :size="8">
                <NButton
                  block
                  :loading="saveSimulationMutation.isPending.value"
                  :disabled="!!savedSimulationId || saveSimulationMutation.isPending.value"
                  @click="handleSaveSimulation"
                >
                  {{ savedSimulationId ? t('horaExtra.actions.saved') : t('horaExtra.actions.save') }}
                </NButton>

                <NThing
                  v-if="!hasPremiumAccess"
                  :title="t('thirteenthSalary.premiumCta.title')"
                  :description="t('thirteenthSalary.premiumCta.description')"
                >
                  <template #footer>
                    <NButton size="small" type="warning" @click="router.push('/subscription')">
                      {{ t('thirteenthSalary.premiumCta.upgrade') }}
                    </NButton>
                  </template>
                </NThing>
              </NSpace>
            </UiSurfaceCard>

            <UiSurfaceCard>
              <p class="hora-extra-page__disclaimer">
                {{ t('horaExtra.disclaimer.tableYear', { year: BR_TAX_TABLE_YEAR }) }}
              </p>
              <p class="hora-extra-page__disclaimer">
                {{ t('horaExtra.disclaimer.irNotIncluded') }}
              </p>
            </UiSurfaceCard>
          </template>
        </div>
      </div>
    </div>
      <ToolGuestCta v-if="!isAuthenticated" />
  </NuxtLayout>
  </div>
</template>

<style scoped>
.hora-extra-root {
  display: contents;
}

.hora-extra-page {
  min-height: 100vh;
  background: var(--color-bg-base);
}

.hora-extra-page--authenticated {
  padding: var(--space-6, 24px);
}

.hora-extra-page__layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  max-width: 1100px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .hora-extra-page__layout {
    grid-template-columns: 1fr;
  }
}

.hora-extra-page__form-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.hora-extra-page__results-col {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.hora-extra-page__form-panel {
  width: 100%;
}

.hora-extra-page__form-actions {
  display: flex;
  gap: var(--space-2, 8px);
  margin-top: var(--space-4, 16px);
}

.hora-extra-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-6, 24px);
  border-bottom: 1px solid var(--color-outline-subtle);
  background: var(--color-bg-elevated);
}

.hora-extra-page__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
}

.hora-extra-page__brand-mark {
  font-weight: var(--font-weight-bold, 700);
  font-size: var(--font-size-body-md, 15px);
  color: var(--color-text-primary);
}

.hora-extra-page__brand-copy {
  font-size: var(--font-size-body-xs, 11px);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hora-extra-page__header-actions {
  display: flex;
  gap: var(--space-2, 8px);
}

.hora-extra-page__content {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-8, 32px) var(--space-6, 24px);
}

.hora-extra-page__hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6, 24px);
  align-items: start;
}

@media (max-width: 768px) {
  .hora-extra-page__hero {
    grid-template-columns: 1fr;
  }
}

.hora-extra-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
}

.hora-extra-page__results-section {
  margin-top: var(--space-8, 32px);
}

.hora-extra-page__results-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.hora-extra-page__results-aside {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 16px);
}

.hora-extra-page__section-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-3, 12px);
}

.hora-extra-page__action-bar {
  display: flex;
  flex-direction: column;
}

.hora-extra-page__disclaimer {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-1, 4px);
}
</style>
