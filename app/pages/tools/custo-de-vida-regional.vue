<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { EChartsOption } from "echarts";
import {
  NAlert,
  NButton,
  NForm,
  NFormItem,
  NInputNumber,
  NProgress,
  NSelect,
  NSpace,
  NThing,
  useMessage,
} from "naive-ui";

import { useSessionStore } from "~/stores/session";
import {
  EXPENSE_CATEGORY_KEYS,
  UF_CODES,
  calculateRegionalCost,
  createDefaultRegionalCostFormState,
  decodeQueryToForm,
  encodeFormToQuery,
  getRegionalEntry,
  validateRegionalCostForm,
  type ExpenseCategoryKey,
  type RegionalCostFormState,
  type RegionalCostResult,
} from "~/features/tools/model/custo-de-vida-regional";
import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import CalculatorFormSection from "~/components/tool/CalculatorFormSection/CalculatorFormSection.vue";
import ToolGuestCta from "~/components/tool/ToolGuestCta/ToolGuestCta.vue";
import UiPageHeader from "~/components/ui/UiPageHeader/UiPageHeader.vue";
import UiGlassPanel from "~/components/ui/UiGlassPanel/UiGlassPanel.vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import UiStickySummaryCard from "~/components/ui/UiStickySummaryCard/UiStickySummaryCard.vue";
import UiChart from "~/components/ui/UiChart.vue";

definePageMeta({ layout: false });

const { t, n } = useI18n();
const toast = useMessage();
const sessionStore = useSessionStore();

useSeoMeta({
  title: () => t("custoVidaRegional.seo.title"),
  description: () => t("custoVidaRegional.seo.description"),
  ogTitle: () => t("custoVidaRegional.seo.ogTitle"),
  ogDescription: () => t("custoVidaRegional.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

const isAuthenticated = computed<boolean>(() => sessionStore.isAuthenticated);

const ufOptions = UF_CODES.map((code) => ({
  label: `${getRegionalEntry(code)?.name ?? code} (${code})`,
  value: code,
}));

const { form, validationError, patch, reset, setValidationError } =
  useCalculatorFormState<RegionalCostFormState>(createDefaultRegionalCostFormState);

const result = ref<RegionalCostResult | null>(null);
const shareUrl = ref<string | null>(null);

/**
 * @param value Numeric amount.
 * @returns BRL-formatted string.
 */
function formatBrl(value: number): string {
  return n(value, "currency");
}

/**
 * @param key Expense category key.
 * @returns Localized category label.
 */
function categoryLabel(key: ExpenseCategoryKey): string {
  return t(`custoVidaRegional.categories.${key}`);
}

onMounted(() => {
  if (typeof globalThis.window === "undefined") {
    return;
  }
  const data = new URLSearchParams(globalThis.location.search).get("d");
  if (!data) {
    return;
  }
  const decoded = decodeQueryToForm(data);
  if (decoded) {
    patch(decoded);
    handleCalculate();
  }
});

/**
 * Validates and computes the regional cost result.
 */
function handleCalculate(): void {
  const errors = validateRegionalCostForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`custoVidaRegional.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  result.value = calculateRegionalCost(form.value);
  if (typeof globalThis.window !== "undefined") {
    shareUrl.value = `${globalThis.location.origin}${globalThis.location.pathname}?d=${encodeFormToQuery(form.value)}`;
  }
}

/**
 * Resets the form and clears the result.
 */
function handleReset(): void {
  reset();
  result.value = null;
  shareUrl.value = null;
}

/**
 * @returns Localized share message text.
 */
function shareMessage(): string {
  const pct = result.value ? Math.round(result.value.committedPct) : 0;
  return t("custoVidaRegional.share.message", { pct });
}

/**
 * Copies the share URL to the clipboard.
 */
async function handleCopyShareUrl(): Promise<void> {
  if (!shareUrl.value) {
    return;
  }
  await navigator.clipboard.writeText(shareUrl.value);
  toast.success(t("custoVidaRegional.share.copied"));
}

const whatsappShareHref = computed<string>(() => {
  if (!shareUrl.value) {
    return "#";
  }
  const text = encodeURIComponent(`${shareMessage()} ${shareUrl.value}`);
  return `https://wa.me/?text=${text}`;
});

const twitterShareHref = computed<string>(() => {
  if (!shareUrl.value) {
    return "#";
  }
  const text = encodeURIComponent(shareMessage());
  const url = encodeURIComponent(shareUrl.value);
  return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
});

const committedProgressStatus = computed<"success" | "warning" | "error">(() => {
  const pct = result.value?.committedPct ?? 0;
  if (pct <= 70) {
    return "success";
  }
  if (pct <= 90) {
    return "warning";
  }
  return "error";
});

const scoreStatus = computed<"success" | "warning" | "error">(() => {
  const score = result.value?.sustainabilityScore ?? 0;
  if (score >= 70) {
    return "success";
  }
  if (score >= 40) {
    return "warning";
  }
  return "error";
});

const summaryMetrics = computed(() => {
  if (!result.value) {
    return [];
  }
  return [
    { label: t("custoVidaRegional.results.totalAnnual"), value: formatBrl(result.value.totalAnnualCost) },
    { label: t("custoVidaRegional.results.monthlySavings"), value: formatBrl(result.value.monthlySavings) },
    { label: t("custoVidaRegional.results.savingsRate"), value: `${result.value.savingsRatePct}%` },
  ];
});

const regionalLabel = computed<string>(() => {
  if (!result.value) {
    return "";
  }
  const r = result.value.regional;
  const pct = Math.abs(Math.round(r.costVsRegionalPct));
  if (r.costVsRegionalPct > 1) {
    return t("custoVidaRegional.results.costVsRegionalAbove", { pct });
  }
  if (r.costVsRegionalPct < -1) {
    return t("custoVidaRegional.results.costVsRegionalBelow", { pct });
  }
  return t("custoVidaRegional.results.costVsRegionalEqual");
});

const retirementLabel = computed<string>(() => {
  if (!result.value) {
    return "";
  }
  if (result.value.yearsToRetirement === null) {
    return t("custoVidaRegional.results.retirementNever");
  }
  return t("custoVidaRegional.results.retirementYears", {
    years: Math.ceil(result.value.yearsToRetirement),
  });
});

/** Donut chart of the per-category spending breakdown. */
const breakdownChartOption = computed<EChartsOption>(() => {
  if (!result.value) {
    return {} as EChartsOption;
  }
  const data = result.value.categories
    .filter((c) => c.amount > 0)
    .map((c) => ({ name: categoryLabel(c.key), value: c.amount }));
  return {
    tooltip: {
      trigger: "item",
      formatter: (params: unknown): string => {
        const p = params as { name: string; value: number; percent: number };
        return `${p.name}: ${formatBrl(p.value)} (${p.percent}%)`;
      },
    },
    legend: { bottom: 0 },
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        avoidLabelOverlap: true,
        label: { show: false },
        data,
      },
    ],
  } as unknown as EChartsOption;
});
</script>

<template>
  <div class="custo-vida-regional-root">
    <NuxtLayout :name="isAuthenticated ? 'default' : 'tools-public'">
      <div class="custo-vida-regional-page">
        <div class="custo-vida-regional-page__layout">
          <div class="custo-vida-regional-page__form-col">
            <UiPageHeader
              :title="t('custoVidaRegional.hero.title')"
              :subtitle="t('custoVidaRegional.hero.subtitle')"
            />

            <UiGlassPanel>
              <NForm @submit.prevent="handleCalculate">
                <CalculatorFormSection :title="t('custoVidaRegional.form.title')">
                  <NFormItem :label="t('custoVidaRegional.form.uf')">
                    <NSelect
                      :value="form.uf"
                      :options="ufOptions"
                      filterable
                      :placeholder="t('custoVidaRegional.form.ufPlaceholder')"
                      @update:value="(v) => patch({ uf: v })"
                    />
                  </NFormItem>

                  <NFormItem :label="t('custoVidaRegional.form.monthlyIncome')">
                    <NInputNumber
                      :value="form.monthlyIncome"
                      :min="0"
                      :precision="2"
                      prefix="R$"
                      style="width: 100%"
                      @update:value="(v) => patch({ monthlyIncome: v ?? 0 })"
                    />
                  </NFormItem>

                  <NFormItem
                    v-for="key in EXPENSE_CATEGORY_KEYS"
                    :key="key"
                    :label="t(`custoVidaRegional.form.${key}`)"
                  >
                    <NInputNumber
                      :value="(form[key] as number)"
                      :min="0"
                      :precision="2"
                      prefix="R$"
                      style="width: 100%"
                      @update:value="(v) => patch({ [key]: v ?? 0 })"
                    />
                  </NFormItem>
                </CalculatorFormSection>

                <NAlert v-if="validationError" type="error" style="margin-bottom: 16px">
                  {{ validationError }}
                </NAlert>

                <NSpace style="margin-top: 16px">
                  <NButton type="primary" attr-type="submit">
                    {{ t('custoVidaRegional.form.calculate') }}
                  </NButton>
                  <NButton quaternary @click="handleReset">
                    {{ t('custoVidaRegional.form.reset') }}
                  </NButton>
                </NSpace>
              </NForm>
            </UiGlassPanel>
          </div>

          <div v-if="result" class="custo-vida-regional-page__result-col">
            <!-- Sustainability score + committed % -->
            <UiStickySummaryCard>
              <div class="custo-vida-regional-page__score">
                <p class="custo-vida-regional-page__score-title">
                  {{ t('custoVidaRegional.results.sustainabilityTitle') }}
                </p>
                <NProgress
                  type="circle"
                  :percentage="result.sustainabilityScore"
                  :status="scoreStatus"
                />
                <p class="custo-vida-regional-page__score-hint">
                  {{ t('custoVidaRegional.results.sustainabilityHint') }}
                </p>
              </div>

              <div class="custo-vida-regional-page__committed">
                <span class="custo-vida-regional-page__committed-value">
                  {{ result.committedPct }}%
                </span>
                <span class="custo-vida-regional-page__committed-label">
                  {{ t('custoVidaRegional.results.committedPct') }}
                </span>
                <NProgress
                  :percentage="Math.min(result.committedPct, 100)"
                  :status="committedProgressStatus"
                  :show-indicator="false"
                />
              </div>

              <NThing
                :title="t('custoVidaRegional.results.totalMonthly')"
                :description="formatBrl(result.totalMonthlyCost)"
              />
              <NThing
                v-for="metric in summaryMetrics"
                :key="metric.label"
                :title="metric.label"
                :description="metric.value"
              />

              <NSpace v-if="shareUrl" vertical style="margin-top: 16px">
                <p class="custo-vida-regional-page__share-title">
                  {{ t('custoVidaRegional.share.title') }}
                </p>
                <NSpace>
                  <NButton tag="a" :href="whatsappShareHref" target="_blank" rel="noopener" size="small">
                    {{ t('custoVidaRegional.share.whatsapp') }}
                  </NButton>
                  <NButton tag="a" :href="twitterShareHref" target="_blank" rel="noopener" size="small">
                    {{ t('custoVidaRegional.share.twitter') }}
                  </NButton>
                  <NButton size="small" quaternary data-testid="copy-share-url" @click="handleCopyShareUrl">
                    {{ t('custoVidaRegional.share.copyLink') }}
                  </NButton>
                </NSpace>
              </NSpace>
            </UiStickySummaryCard>

            <!-- Regional comparison -->
            <UiSurfaceCard>
              <p class="custo-vida-regional-page__section-title">
                {{ t('custoVidaRegional.results.regionalTitle', { uf: result.regional.name }) }}
              </p>
              <p class="custo-vida-regional-page__regional-headline">{{ regionalLabel }}</p>
              <NThing
                :title="t('custoVidaRegional.results.regionalAvgCost')"
                :description="formatBrl(result.regional.avgCost)"
              />
              <NThing
                :title="t('custoVidaRegional.results.regionalAvgIncome')"
                :description="formatBrl(result.regional.avgIncome)"
              />
            </UiSurfaceCard>

            <!-- Category breakdown -->
            <UiSurfaceCard>
              <p class="custo-vida-regional-page__section-title">
                {{ t('custoVidaRegional.results.breakdownTitle') }}
              </p>
              <UiChart :option="breakdownChartOption" height="260px" />
            </UiSurfaceCard>

            <!-- Retirement projection -->
            <UiSurfaceCard>
              <p class="custo-vida-regional-page__section-title">
                {{ t('custoVidaRegional.results.retirementTitle') }}
              </p>
              <p class="custo-vida-regional-page__retirement">{{ retirementLabel }}</p>
              <NThing
                :title="t('custoVidaRegional.results.targetWealth')"
                :description="formatBrl(result.targetWealth)"
              />
              <p class="custo-vida-regional-page__hint">
                {{ t('custoVidaRegional.results.retirementHint', { rate: 4 }) }}
              </p>
            </UiSurfaceCard>

            <!-- Register CTA (guests only) -->
            <UiSurfaceCard v-if="!isAuthenticated" class="custo-vida-regional-page__cta-card">
              <p class="custo-vida-regional-page__cta-title">{{ t('custoVidaRegional.cta.title') }}</p>
              <p class="custo-vida-regional-page__cta-desc">{{ t('custoVidaRegional.cta.description') }}</p>
              <NuxtLink to="/register">
                <NButton type="primary" block>{{ t('custoVidaRegional.cta.button') }}</NButton>
              </NuxtLink>
            </UiSurfaceCard>

            <p class="custo-vida-regional-page__disclaimer">{{ t('custoVidaRegional.disclaimer.note') }}</p>
          </div>
        </div>

        <!-- FAQ for SEO -->
        <section class="custo-vida-regional-page__faq" aria-label="FAQ">
          <h2>{{ t('custoVidaRegional.faq.title') }}</h2>
          <details
            v-for="(item, i) in (t('custoVidaRegional.faq.items', []) as unknown as Array<{ q: string; a: string }>)"
            :key="i"
            class="custo-vida-regional-page__faq-item"
          >
            <summary>{{ item.q }}</summary>
            <p>{{ item.a }}</p>
          </details>
        </section>
      </div>
      <ToolGuestCta v-if="!isAuthenticated" />
    </NuxtLayout>
  </div>
</template>

<style scoped>
.custo-vida-regional-page {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: clamp(var(--space-3), 3vw, var(--space-5));
}

.custo-vida-regional-page__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-4);
  align-items: start;
}

.custo-vida-regional-page__result-col {
  display: grid;
  gap: var(--space-3);
}

.custo-vida-regional-page__score {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  text-align: center;
  margin-bottom: var(--space-3);
}

.custo-vida-regional-page__score-title,
.custo-vida-regional-page__section-title {
  margin: 0 0 var(--space-2);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.custo-vida-regional-page__score-hint,
.custo-vida-regional-page__hint {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.custo-vida-regional-page__committed {
  display: grid;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
}

.custo-vida-regional-page__committed-value {
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.custo-vida-regional-page__committed-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.custo-vida-regional-page__regional-headline,
.custo-vida-regional-page__retirement {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-brand-500);
}

.custo-vida-regional-page__share-title {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.custo-vida-regional-page__cta-card {
  background: color-mix(in srgb, var(--color-brand-500) 8%, transparent);
}

.custo-vida-regional-page__cta-title {
  margin: 0 0 var(--space-1);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.custo-vida-regional-page__cta-desc {
  margin: 0 0 var(--space-3);
  color: var(--color-text-secondary);
}

.custo-vida-regional-page__disclaimer {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.custo-vida-regional-page__faq {
  margin-top: var(--space-5);
  max-width: 820px;
}

.custo-vida-regional-page__faq-item {
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-outline-soft);
}

.custo-vida-regional-page__faq-item summary {
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

@media (max-width: 860px) {
  .custo-vida-regional-page__layout {
    grid-template-columns: 1fr;
  }
}
</style>
