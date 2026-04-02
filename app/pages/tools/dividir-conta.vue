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
} from "naive-ui";
import { useRouter } from "#app";

import { captureException } from "~/core/observability";
import { useCalculatorFormState } from "~/features/tools/composables/use-calculator-form-state";
import { useSessionStore } from "~/stores/session";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import { useSaveSimulationMutation } from "~/features/simulations/queries/use-save-simulation-mutation";
import { useCreateGoalMutation } from "~/features/goals/queries/use-create-goal-mutation";
import {
  DIVIDIR_CONTA_MODES,
  calculateDividirConta,
  createDefaultDividirContaFormState,
  validateDividirContaForm,
  type DividirContaFormState,
  type DividirContaResult,
} from "~/features/tools/model/dividir-conta";
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
  title: t("dividirConta.seo.title"),
  description: t("dividirConta.seo.description"),
  ogTitle: t("dividirConta.seo.ogTitle"),
  ogDescription: t("dividirConta.seo.ogDescription"),
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
  useCalculatorFormState<DividirContaFormState>(createDefaultDividirContaFormState);

const result = ref<DividirContaResult | null>(null);
const savedSimulationId = ref<string | null>(null);
const goalAdded = ref(false);

// ─── Select options ───────────────────────────────────────────────────────────

const modeOptions = computed(() =>
  DIVIDIR_CONTA_MODES.map((mode) => ({
    label: t(`dividirConta.form.mode${mode.charAt(0).toUpperCase()}${mode.slice(1)}`),
    value: mode,
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

// ─── Individual amounts management ───────────────────────────────────────────

/**
 * Synchronizes the individualAmounts array length with the current people count.
 *
 * @param count New number of people.
 */
function syncIndividualAmounts(count: number): void {
  const current = form.value.individualAmounts;
  const next = Array.from({ length: count }, (_, i) => current[i] ?? null);
  patch({ individualAmounts: next });
}

/**
 * Handles change in number of people, keeping the amounts array in sync.
 *
 * @param count New number of people.
 */
function handlePeopleChange(count: number | null): void {
  const safe = count ?? 2;
  patch({ people: safe });
  syncIndividualAmounts(safe);
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Validates the form and triggers the calculation when valid.
 */
function handleCalculate(): void {
  const errors = validateDividirContaForm(form.value);
  if (errors.length > 0) {
    const first = errors[0];
    setValidationError(first ? t(`dividirConta.${first.messageKey}`) : null);
    return;
  }
  setValidationError(null);
  savedSimulationId.value = null;
  goalAdded.value = false;
  result.value = calculateDividirConta(form.value);
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
      label: t("dividirConta.results.totalWithFees"),
      value: formatBrl(result.value.totalWithFees),
    },
    {
      label: t("dividirConta.results.serviceFee"),
      value: formatBrl(result.value.serviceFeeBrl),
    },
    {
      label: t("dividirConta.results.tip"),
      value: formatBrl(result.value.tipBrl),
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
      name: t("dividirConta.simulation.defaultName", { people: form.value.people }),
      toolSlug: "dividir_conta",
      inputs: { ...form.value },
      result: { ...result.value },
    });
    savedSimulationId.value = simulation.id;
    return simulation.id;
  } catch (err) {
    captureException(err, { context: "dividir-conta/save-simulation" });
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
 * Saves the simulation then creates a goal from the per-person equal amount.
 */
async function handleAddAsGoal(): Promise<void> {
  if (!result.value) { return; }

  await ensureSimulationSaved();

  try {
    await createGoalMutation.mutateAsync({
      name: t("dividirConta.simulation.goalName", { people: form.value.people }),
      target_amount: result.value.perPersonEqual,
    });
    goalAdded.value = true;
  } catch (err) {
    captureException(err, { context: "dividir-conta/add-as-goal" });
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
  <div class="dividir-conta-root">
  <!-- ═══ AUTHENTICATED — app shell ══════════════════════════════════════════ -->
  <NuxtLayout v-if="isAuthenticated" name="default">
    <div class="dividir-conta-page dividir-conta-page--authenticated">
      <div class="dividir-conta-page__layout">
        <!-- Form column -->
        <div class="dividir-conta-page__form-col">
          <UiPageHeader
            :title="t('dividirConta.hero.title')"
            :subtitle="t('dividirConta.hero.subtitle')"
          />

          <UiGlassPanel class="dividir-conta-page__form-panel">
            <NForm @submit.prevent="handleCalculate">
              <CalculatorFormSection :title="t('dividirConta.form.title')">
                <NFormItem :label="t('dividirConta.form.total')">
                  <NInputNumber
                    :value="form.total"
                    :placeholder="t('dividirConta.form.totalPlaceholder')"
                    :min="0"
                    :precision="2"
                    prefix="R$"
                    style="width: 100%"
                    @update:value="(v) => patch({ total: v })"
                  />
                </NFormItem>

                <NFormItem :label="t('dividirConta.form.serviceFeePct')">
                  <NInputNumber
                    :value="form.serviceFeePct"
                    :min="0"
                    :max="100"
                    :precision="1"
                    style="width: 100%"
                    @update:value="(v) => patch({ serviceFeePct: v ?? 10 })"
                  />
                </NFormItem>

                <NFormItem :label="t('dividirConta.form.tipPct')">
                  <NInputNumber
                    :value="form.tipPct"
                    :min="0"
                    :max="100"
                    :precision="1"
                    style="width: 100%"
                    @update:value="(v) => patch({ tipPct: v ?? 0 })"
                  />
                </NFormItem>

                <NFormItem :label="t('dividirConta.form.people')">
                  <NInputNumber
                    :value="form.people"
                    :min="2"
                    :max="50"
                    :precision="0"
                    style="width: 100%"
                    @update:value="handlePeopleChange"
                  />
                </NFormItem>

                <NFormItem :label="t('dividirConta.form.mode')">
                  <NSelect
                    :value="form.mode"
                    :options="modeOptions"
                    style="width: 100%"
                    @update:value="(v) => patch({ mode: v })"
                  />
                </NFormItem>

                <template v-if="form.mode === 'individual'">
                  <NFormItem
                    v-for="i in form.people"
                    :key="i"
                    :label="t('dividirConta.form.individualAmountLabel', { n: i })"
                  >
                    <NInputNumber
                      :value="form.individualAmounts[i - 1]"
                      :min="0"
                      :precision="2"
                      prefix="R$"
                      style="width: 100%"
                      @update:value="(v) => {
                        const updated = [...form.individualAmounts];
                        updated[i - 1] = v;
                        patch({ individualAmounts: updated });
                      }"
                    />
                  </NFormItem>
                </template>
              </CalculatorFormSection>

              <NAlert v-if="validationError" type="error" style="margin-bottom: 16px">
                {{ validationError }}
              </NAlert>

              <NSpace style="margin-top: 16px">
                <NButton type="primary" attr-type="submit" :loading="isBridging">
                  {{ t('dividirConta.form.calculate') }}
                </NButton>
                <NButton quaternary @click="handleReset">
                  {{ t('dividirConta.form.reset') }}
                </NButton>
              </NSpace>
            </NForm>
          </UiGlassPanel>
        </div>

        <!-- Result column -->
        <div v-if="result" class="dividir-conta-page__result-col">
          <UiStickySummaryCard>
            <CalculatorResultSummary
              :label="t('dividirConta.results.perPersonEqual')"
              :value="formatBrl(result.perPersonEqual)"
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
                {{ isSaved ? t('dividirConta.actions.saved') : t('dividirConta.actions.save') }}
              </NButton>

              <!-- Premium: add as goal -->
              <NButton
                v-if="hasPremiumAccess"
                type="primary"
                :loading="createGoalMutation.isPending.value"
                :disabled="goalAdded"
                block
                @click="handleAddAsGoal"
              >
                {{ goalAdded ? t('dividirConta.actions.goalAdded') : t('dividirConta.actions.addAsGoal') }}
              </NButton>
            </NSpace>
          </UiStickySummaryCard>

          <!-- Individual breakdown -->
          <UiSurfaceCard v-if="form.mode === 'individual'" class="dividir-conta-page__breakdown">
            <p class="dividir-conta-page__breakdown-title">
              {{ t('dividirConta.results.individualBreakdown') }}
            </p>
            <NThing
              v-for="(amount, idx) in result.perPersonIndividual"
              :key="idx"
              :title="t('dividirConta.results.person', { n: idx + 1 })"
              :description="formatBrl(amount)"
            />
          </UiSurfaceCard>

          <p class="dividir-conta-page__disclaimer">
            {{ t('dividirConta.disclaimer.note') }}
          </p>
        </div>
      </div>
    </div>
  </NuxtLayout>

  <!-- ═══ GUEST — standalone public layout ════════════════════════════════════ -->
  <div v-else class="dividir-conta-page dividir-conta-page--guest">
    <!-- Brand header -->
    <header class="dividir-conta-page__header">
      <NTag round type="success" size="small">
        {{ t('dividirConta.header.publicTool') }}
      </NTag>
      <NButton quaternary @click="router.push('/auth/login')">
        {{ t('dividirConta.header.createAccount') }}
      </NButton>
    </header>

    <!-- Hero -->
    <div class="dividir-conta-page__hero">
      <NTag round size="small">{{ t('dividirConta.hero.badge') }}</NTag>
      <h1 class="dividir-conta-page__hero-title">{{ t('dividirConta.hero.title') }}</h1>
      <p class="dividir-conta-page__hero-subtitle">{{ t('dividirConta.hero.subtitle') }}</p>
    </div>

    <!-- Form -->
    <div class="dividir-conta-page__content">
      <UiGlassPanel class="dividir-conta-page__form-panel">
        <NForm @submit.prevent="handleCalculate">
          <CalculatorFormSection :title="t('dividirConta.form.title')">
            <NFormItem :label="t('dividirConta.form.total')">
              <NInputNumber
                :value="form.total"
                :placeholder="t('dividirConta.form.totalPlaceholder')"
                :min="0"
                :precision="2"
                prefix="R$"
                style="width: 100%"
                @update:value="(v) => patch({ total: v })"
              />
            </NFormItem>

            <NFormItem :label="t('dividirConta.form.serviceFeePct')">
              <NInputNumber
                :value="form.serviceFeePct"
                :min="0"
                :max="100"
                :precision="1"
                style="width: 100%"
                @update:value="(v) => patch({ serviceFeePct: v ?? 10 })"
              />
            </NFormItem>

            <NFormItem :label="t('dividirConta.form.tipPct')">
              <NInputNumber
                :value="form.tipPct"
                :min="0"
                :max="100"
                :precision="1"
                style="width: 100%"
                @update:value="(v) => patch({ tipPct: v ?? 0 })"
              />
            </NFormItem>

            <NFormItem :label="t('dividirConta.form.people')">
              <NInputNumber
                :value="form.people"
                :min="2"
                :max="50"
                :precision="0"
                style="width: 100%"
                @update:value="handlePeopleChange"
              />
            </NFormItem>

            <NFormItem :label="t('dividirConta.form.mode')">
              <NSelect
                :value="form.mode"
                :options="modeOptions"
                style="width: 100%"
                @update:value="(v) => patch({ mode: v })"
              />
            </NFormItem>

            <template v-if="form.mode === 'individual'">
              <NFormItem
                v-for="i in form.people"
                :key="i"
                :label="t('dividirConta.form.individualAmountLabel', { n: i })"
              >
                <NInputNumber
                  :value="form.individualAmounts[i - 1]"
                  :min="0"
                  :precision="2"
                  prefix="R$"
                  style="width: 100%"
                  @update:value="(v) => {
                    const updated = [...form.individualAmounts];
                    updated[i - 1] = v;
                    patch({ individualAmounts: updated });
                  }"
                />
              </NFormItem>
            </template>
          </CalculatorFormSection>

          <NAlert v-if="validationError" type="error" style="margin-bottom: 16px">
            {{ validationError }}
          </NAlert>

          <NSpace style="margin-top: 16px">
            <NButton type="primary" attr-type="submit">
              {{ t('dividirConta.form.calculate') }}
            </NButton>
            <NButton quaternary @click="handleReset">
              {{ t('dividirConta.form.reset') }}
            </NButton>
          </NSpace>
        </NForm>
      </UiGlassPanel>

      <!-- Result -->
      <div v-if="result" class="dividir-conta-page__result">
        <UiSurfaceCard>
          <CalculatorResultSummary
            :label="t('dividirConta.results.perPersonEqual')"
            :value="formatBrl(result.perPersonEqual)"
            :metrics="summaryMetrics"
          />
        </UiSurfaceCard>

        <UiSurfaceCard v-if="form.mode === 'individual'" class="dividir-conta-page__breakdown">
          <p class="dividir-conta-page__breakdown-title">
            {{ t('dividirConta.results.individualBreakdown') }}
          </p>
          <NThing
            v-for="(amount, idx) in result.perPersonIndividual"
            :key="idx"
            :title="t('dividirConta.results.person', { n: idx + 1 })"
            :description="formatBrl(amount)"
          />
        </UiSurfaceCard>

        <!-- Guest CTA -->
        <ToolGuestCta />

        <p class="dividir-conta-page__disclaimer">
          {{ t('dividirConta.disclaimer.note') }}
        </p>
      </div>
    </div>
  </div>
  </div>
</template>
