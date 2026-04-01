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

import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import { useSessionStore } from "~/stores/session";
import {
  BR_TAX_TABLE_YEAR,
  calculateThirteenthSalary,
  createDefaultThirteenthSalaryFormState,
  validateThirteenthSalaryForm,
  type ThirteenthSalaryFormState,
  type ThirteenthSalaryResult,
} from "~/features/tools/model/thirteenth-salary";
import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import CalculatorResultSummary from "~/components/tool/CalculatorResultSummary/CalculatorResultSummary.vue";
import UiStickySummaryCard from "~/components/ui/UiStickySummaryCard/UiStickySummaryCard.vue";
import UiPageHeader from "~/components/ui/UiPageHeader/UiPageHeader.vue";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";

definePageMeta({ layout: false });

const { t, n } = useI18n();
const router = useRouter();
const sessionStore = useSessionStore();

useSeoMeta({
  title: t("thirteenthSalary.seo.title"),
  description: t("thirteenthSalary.seo.description"),
  ogTitle: t("thirteenthSalary.seo.ogTitle"),
  ogDescription: t("thirteenthSalary.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

const isAuthenticated = computed(() => sessionStore.isAuthenticated);

const { form, validationError, isDirty, patch, reset, setValidationError } =
  useCalculatorFormState<ThirteenthSalaryFormState>(createDefaultThirteenthSalaryFormState);

const result = ref<ThirteenthSalaryResult | null>(null);

const monthsOptions = computed(() =>
  Array.from({ length: 12 }, (_, i) => ({
    label: t(`thirteenthSalary.months.${i + 1}`),
    value: i + 1,
  })),
);

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
 * Validates the form and triggers the calculation when valid.
 */
function handleCalculate(): void {
  const errors = validateThirteenthSalaryForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`thirteenthSalary.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  result.value = calculateThirteenthSalary(form.value);
}

/**
 * Resets the form to its initial state and clears the result.
 */
function handleReset(): void {
  reset();
  result.value = null;
}

const summaryMetrics = computed(() => {
  if (!result.value) { return []; }
  return [
    {
      label: t("thirteenthSalary.results.totalGross"),
      value: formatBrl(result.value.totalGross),
    },
    {
      label: t("thirteenthSalary.results.totalInss"),
      value: `− ${formatBrl(result.value.totalInss)}`,
    },
    {
      label: t("thirteenthSalary.results.totalIrrf"),
      value: `− ${formatBrl(result.value.totalIrrf)}`,
    },
  ];
});
</script>

<template>
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout v-if="isAuthenticated" name="default">
    <div class="thirteenth-salary-page thirteenth-salary-page--authenticated">
      <div class="thirteenth-salary-page__layout">
        <div class="thirteenth-salary-page__form-col">
          <UiPageHeader
            :title="t('thirteenthSalary.hero.title')"
            :subtitle="t('thirteenthSalary.hero.subtitle')"
          />

          <UiGlassPanel class="thirteenth-salary-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('thirteenthSalary.form.title')">
                <NFormItem :label="t('thirteenthSalary.form.grossSalary')">
                  <NInputNumber
                    :value="form.grossSalary"
                    :placeholder="t('thirteenthSalary.form.grossSalaryPlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ grossSalary: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('thirteenthSalary.form.monthsWorked')">
                  <NSelect
                    :value="form.monthsWorked"
                    :options="monthsOptions"
                    style="width: 100%"
                    @update:value="(v) => patch({ monthsWorked: v })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('thirteenthSalary.form.variablePay') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left: 4px; cursor: help; vertical-align: middle;" />
                      </template>
                      {{ t('thirteenthSalary.form.variablePayTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.variablePay"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ variablePay: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('thirteenthSalary.form.advancePaid') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left: 4px; cursor: help; vertical-align: middle;" />
                      </template>
                      {{ t('thirteenthSalary.form.advancePayTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.advancePaid"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ advancePaid: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem>
                  <template #label>
                    {{ t('thirteenthSalary.form.dependents') }}
                    <NTooltip>
                      <template #trigger>
                        <Info :size="14" style="margin-left: 4px; cursor: help; vertical-align: middle;" />
                      </template>
                      {{ t('thirteenthSalary.form.dependentsTooltip') }}
                    </NTooltip>
                  </template>
                  <NInputNumber
                    :value="form.dependents"
                    :min="0"
                    :max="10"
                    :precision="0"
                    style="width: 100%"
                    @update:value="(v) => patch({ dependents: v ?? 0 })"
                  />
                </NFormItem>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="warning" style="margin-top: 12px">
                {{ validationError }}
              </NAlert>

              <div class="thirteenth-salary-page__form-actions">
                <NButton
                  v-if="isDirty"
                  quaternary
                  @click="handleReset"
                >
                  {{ t('thirteenthSalary.form.reset') }}
                </NButton>
                <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                  {{ t('thirteenthSalary.form.calculate') }}
                </NButton>
              </div>
            </NForm>
          </UiGlassPanel>
        </div>

        <div class="thirteenth-salary-page__results-col">
          <UiStickySummaryCard v-if="result">
            <CalculatorResultSummary
              :label="t('thirteenthSalary.results.totalNet')"
              :value="formatBrl(result.totalNet)"
              :reason="t('thirteenthSalary.results.totalNetNote')"
              :metrics="summaryMetrics"
            />
          </UiStickySummaryCard>

          <template v-if="result">
            <UiSurfaceCard class="thirteenth-salary-page__installment-card">
              <div class="thirteenth-salary-page__installment">
                <div class="thirteenth-salary-page__installment-header">
                  <span class="thirteenth-salary-page__installment-title">
                    {{ t('thirteenthSalary.results.firstInstallment') }}
                  </span>
                  <NTag size="small" type="default" round>
                    {{ t('thirteenthSalary.results.firstInstallmentDate') }}
                  </NTag>
                </div>
                <div class="thirteenth-salary-page__installment-rows">
                  <div class="thirteenth-salary-page__installment-row">
                    <span>{{ t('thirteenthSalary.results.firstInstallmentGross') }}</span>
                    <span>{{ formatBrl(result.firstInstallment.gross) }}</span>
                  </div>
                  <div class="thirteenth-salary-page__installment-row thirteenth-salary-page__installment-row--net">
                    <span>{{ t('thirteenthSalary.results.firstInstallmentNet') }}</span>
                    <span class="thirteenth-salary-page__value--positive">{{ formatBrl(result.firstInstallment.net) }}</span>
                  </div>
                </div>
                <p class="thirteenth-salary-page__installment-note">
                  {{ t('thirteenthSalary.results.firstInstallmentNote') }}
                </p>
              </div>
            </UiSurfaceCard>

            <UiSurfaceCard class="thirteenth-salary-page__installment-card">
              <div class="thirteenth-salary-page__installment">
                <div class="thirteenth-salary-page__installment-header">
                  <span class="thirteenth-salary-page__installment-title">
                    {{ t('thirteenthSalary.results.secondInstallment') }}
                  </span>
                  <NTag size="small" type="default" round>
                    {{ t('thirteenthSalary.results.secondInstallmentDate') }}
                  </NTag>
                </div>
                <div class="thirteenth-salary-page__installment-rows">
                  <div class="thirteenth-salary-page__installment-row">
                    <span>{{ t('thirteenthSalary.results.secondInstallmentGross') }}</span>
                    <span>{{ formatBrl(result.secondInstallment.gross) }}</span>
                  </div>
                  <div class="thirteenth-salary-page__installment-row thirteenth-salary-page__installment-row--deduction">
                    <span>{{ t('thirteenthSalary.results.deductionInss') }}</span>
                    <span class="thirteenth-salary-page__value--negative">− {{ formatBrl(result.secondInstallment.inss) }}</span>
                  </div>
                  <div class="thirteenth-salary-page__installment-row thirteenth-salary-page__installment-row--deduction">
                    <span>{{ t('thirteenthSalary.results.deductionIrrf') }}</span>
                    <span class="thirteenth-salary-page__value--negative">− {{ formatBrl(result.secondInstallment.irrf) }}</span>
                  </div>
                  <div class="thirteenth-salary-page__installment-row thirteenth-salary-page__installment-row--net">
                    <span>{{ t('thirteenthSalary.results.secondInstallmentNet') }}</span>
                    <span class="thirteenth-salary-page__value--positive">{{ formatBrl(result.secondInstallment.net) }}</span>
                  </div>
                </div>
              </div>
            </UiSurfaceCard>

            <UiSurfaceCard>
              <p class="thirteenth-salary-page__disclaimer">
                {{ t('thirteenthSalary.disclaimer.tableYear', { year: BR_TAX_TABLE_YEAR }) }}
              </p>
              <p class="thirteenth-salary-page__disclaimer">
                {{ t('thirteenthSalary.disclaimer.notFinancialAdvice') }}
              </p>
            </UiSurfaceCard>
          </template>
        </div>
      </div>
    </div>
  </NuxtLayout>

  <!-- ═══ GUEST — standalone public page ════════════════════════════════════ -->
  <div v-else class="thirteenth-salary-page">
    <header class="thirteenth-salary-page__header">
      <div class="thirteenth-salary-page__brand">
        <span class="thirteenth-salary-page__brand-mark">Auraxis</span>
        <span class="thirteenth-salary-page__brand-copy">{{ t('thirteenthSalary.header.publicTool') }}</span>
      </div>
      <div class="thirteenth-salary-page__header-actions">
        <NButton quaternary @click="router.push('/tools')">
          {{ t('thirteenthSalary.header.otherTools') }}
        </NButton>
        <NButton type="primary" @click="router.push('/register')">
          {{ t('thirteenthSalary.header.createAccount') }}
        </NButton>
      </div>
    </header>

    <main class="thirteenth-salary-page__content">
      <section class="thirteenth-salary-page__hero">
        <div class="thirteenth-salary-page__hero-copy">
          <NTag round type="warning">
            {{ t('thirteenthSalary.hero.badge') }}
          </NTag>
          <UiPageHeader
            :title="t('thirteenthSalary.hero.title')"
            :subtitle="t('thirteenthSalary.hero.subtitle')"
          />
        </div>

        <UiGlassPanel glow class="thirteenth-salary-page__form-panel">
          <NForm @submit.prevent="handleCalculate">
            <CalculatorFormSection :title="t('thirteenthSalary.form.title')">
              <NFormItem :label="t('thirteenthSalary.form.grossSalary')">
                <NInputNumber
                  :value="form.grossSalary"
                  :placeholder="t('thirteenthSalary.form.grossSalaryPlaceholder')"
                  :min="0"
                  :precision="2"
                  prefix="R$"
                  style="width: 100%"
                  @update:value="(v) => patch({ grossSalary: v })"
                />
              </NFormItem>

              <NFormItem :label="t('thirteenthSalary.form.monthsWorked')">
                <NSelect
                  :value="form.monthsWorked"
                  :options="monthsOptions"
                  style="width: 100%"
                  @update:value="(v) => patch({ monthsWorked: v })"
                />
              </NFormItem>

              <NFormItem>
                <template #label>
                  {{ t('thirteenthSalary.form.variablePay') }}
                  <NTooltip>
                    <template #trigger>
                      <Info :size="14" style="margin-left: 4px; cursor: help; vertical-align: middle;" />
                    </template>
                    {{ t('thirteenthSalary.form.variablePayTooltip') }}
                  </NTooltip>
                </template>
                <NInputNumber
                  :value="form.variablePay"
                  :min="0"
                  :precision="2"
                  prefix="R$"
                  style="width: 100%"
                  @update:value="(v) => patch({ variablePay: v ?? 0 })"
                />
              </NFormItem>

              <NFormItem>
                <template #label>
                  {{ t('thirteenthSalary.form.dependents') }}
                  <NTooltip>
                    <template #trigger>
                      <Info :size="14" style="margin-left: 4px; cursor: help; vertical-align: middle;" />
                    </template>
                    {{ t('thirteenthSalary.form.dependentsTooltip') }}
                  </NTooltip>
                </template>
                <NInputNumber
                  :value="form.dependents"
                  :min="0"
                  :max="10"
                  :precision="0"
                  style="width: 100%"
                  @update:value="(v) => patch({ dependents: v ?? 0 })"
                />
              </NFormItem>
            </CalculatorFormSection>

            <NAlert v-if="validationError" type="warning" style="margin-top: 12px">
              {{ validationError }}
            </NAlert>

            <div class="thirteenth-salary-page__form-actions">
              <NButton
                v-if="isDirty"
                quaternary
                @click="handleReset"
              >
                {{ t('thirteenthSalary.form.reset') }}
              </NButton>
              <NButton type="primary" attr-type="submit" :style="{ flex: 1 }">
                {{ t('thirteenthSalary.form.calculate') }}
              </NButton>
            </div>
          </NForm>
        </UiGlassPanel>
      </section>

      <section v-if="result" class="thirteenth-salary-page__results-section">
        <div class="thirteenth-salary-page__layout">
          <div class="thirteenth-salary-page__results-main">
            <UiSurfaceCard class="thirteenth-salary-page__installment-card">
              <div class="thirteenth-salary-page__installment">
                <div class="thirteenth-salary-page__installment-header">
                  <span class="thirteenth-salary-page__installment-title">
                    {{ t('thirteenthSalary.results.firstInstallment') }}
                  </span>
                  <NTag size="small" type="default" round>
                    {{ t('thirteenthSalary.results.firstInstallmentDate') }}
                  </NTag>
                </div>
                <div class="thirteenth-salary-page__installment-rows">
                  <div class="thirteenth-salary-page__installment-row">
                    <span>{{ t('thirteenthSalary.results.firstInstallmentGross') }}</span>
                    <span>{{ formatBrl(result.firstInstallment.gross) }}</span>
                  </div>
                  <div class="thirteenth-salary-page__installment-row thirteenth-salary-page__installment-row--net">
                    <span>{{ t('thirteenthSalary.results.firstInstallmentNet') }}</span>
                    <span class="thirteenth-salary-page__value--positive">{{ formatBrl(result.firstInstallment.net) }}</span>
                  </div>
                </div>
                <p class="thirteenth-salary-page__installment-note">
                  {{ t('thirteenthSalary.results.firstInstallmentNote') }}
                </p>
              </div>
            </UiSurfaceCard>

            <UiSurfaceCard class="thirteenth-salary-page__installment-card">
              <div class="thirteenth-salary-page__installment">
                <div class="thirteenth-salary-page__installment-header">
                  <span class="thirteenth-salary-page__installment-title">
                    {{ t('thirteenthSalary.results.secondInstallment') }}
                  </span>
                  <NTag size="small" type="default" round>
                    {{ t('thirteenthSalary.results.secondInstallmentDate') }}
                  </NTag>
                </div>
                <div class="thirteenth-salary-page__installment-rows">
                  <div class="thirteenth-salary-page__installment-row">
                    <span>{{ t('thirteenthSalary.results.secondInstallmentGross') }}</span>
                    <span>{{ formatBrl(result.secondInstallment.gross) }}</span>
                  </div>
                  <div class="thirteenth-salary-page__installment-row thirteenth-salary-page__installment-row--deduction">
                    <span>{{ t('thirteenthSalary.results.deductionInss') }}</span>
                    <span class="thirteenth-salary-page__value--negative">− {{ formatBrl(result.secondInstallment.inss) }}</span>
                  </div>
                  <div class="thirteenth-salary-page__installment-row thirteenth-salary-page__installment-row--deduction">
                    <span>{{ t('thirteenthSalary.results.deductionIrrf') }}</span>
                    <span class="thirteenth-salary-page__value--negative">− {{ formatBrl(result.secondInstallment.irrf) }}</span>
                  </div>
                  <div class="thirteenth-salary-page__installment-row thirteenth-salary-page__installment-row--net">
                    <span>{{ t('thirteenthSalary.results.secondInstallmentNet') }}</span>
                    <span class="thirteenth-salary-page__value--positive">{{ formatBrl(result.secondInstallment.net) }}</span>
                  </div>
                </div>
              </div>
            </UiSurfaceCard>

            <UiSurfaceCard>
              <p class="thirteenth-salary-page__disclaimer">
                {{ t('thirteenthSalary.disclaimer.tableYear', { year: BR_TAX_TABLE_YEAR }) }}
              </p>
              <p class="thirteenth-salary-page__disclaimer">
                {{ t('thirteenthSalary.disclaimer.notFinancialAdvice') }}
              </p>
            </UiSurfaceCard>
          </div>

          <div class="thirteenth-salary-page__results-aside">
            <UiStickySummaryCard>
              <CalculatorResultSummary
                :label="t('thirteenthSalary.results.totalNet')"
                :value="formatBrl(result.totalNet)"
                :reason="t('thirteenthSalary.results.totalNetNote')"
                :metrics="summaryMetrics"
              />
            </UiStickySummaryCard>

            <UiSurfaceCard class="thirteenth-salary-page__guest-cta">
              <NSpace vertical :size="12">
                <NThing
                  :title="t('thirteenthSalary.guestCta.title')"
                  :description="t('thirteenthSalary.guestCta.description')"
                />
                <NSpace>
                  <NButton type="primary" @click="router.push('/register')">
                    {{ t('thirteenthSalary.guestCta.createAccount') }}
                  </NButton>
                  <NButton quaternary @click="router.push('/login')">
                    {{ t('thirteenthSalary.guestCta.login') }}
                  </NButton>
                </NSpace>
              </NSpace>
            </UiSurfaceCard>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.thirteenth-salary-page {
  min-height: 100vh;
  background: var(--color-bg-base);
  display: flex;
  flex-direction: column;
}

.thirteenth-salary-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
}

.thirteenth-salary-page__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.thirteenth-salary-page__brand-mark {
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.thirteenth-salary-page__brand-copy {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.thirteenth-salary-page__header-actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.thirteenth-salary-page__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-4);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.thirteenth-salary-page__hero {
  display: grid;
  gap: var(--space-4);
  align-items: start;
}

.thirteenth-salary-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.thirteenth-salary-page__form-panel {
  padding: var(--space-4);
}

.thirteenth-salary-page__form-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.thirteenth-salary-page__layout {
  display: flex;
  gap: var(--space-4);
  align-items: start;
}

.thirteenth-salary-page--authenticated .thirteenth-salary-page__layout {
  padding: var(--space-4);
}

.thirteenth-salary-page__form-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.thirteenth-salary-page__results-col {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.thirteenth-salary-page__results-section {
  width: 100%;
}

.thirteenth-salary-page__results-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.thirteenth-salary-page__results-aside {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.thirteenth-salary-page__installment-card {
  padding: 0;
}

.thirteenth-salary-page__installment {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.thirteenth-salary-page__installment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}

.thirteenth-salary-page__installment-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.thirteenth-salary-page__installment-rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.thirteenth-salary-page__installment-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.thirteenth-salary-page__installment-row--net {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  padding-top: var(--space-1);
  border-top: 1px solid var(--color-border-subtle);
  margin-top: var(--space-1);
}

.thirteenth-salary-page__installment-note {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 0;
}

.thirteenth-salary-page__value--positive {
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
}

.thirteenth-salary-page__value--negative {
  color: var(--color-error);
}

.thirteenth-salary-page__disclaimer {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-1);
}

.thirteenth-salary-page__guest-cta {
  background: var(--color-bg-elevated);
}

@media (max-width: 900px) {
  .thirteenth-salary-page__layout {
    flex-direction: column;
  }

  .thirteenth-salary-page__results-col,
  .thirteenth-salary-page__results-aside {
    width: 100%;
  }

  .thirteenth-salary-page__hero {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 901px) {
  .thirteenth-salary-page__hero {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
