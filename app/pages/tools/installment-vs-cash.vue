<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";
import {
  BarChart3,
  Target,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
} from "lucide-vue-next";
import {
  NAlert,
  NButton,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSpace,
  NThing,
  NTag,
  useMessage,
} from "naive-ui";

import { captureException } from "~/core/observability";
import { useAuthRedirectContext } from "~/composables/useAuthRedirectContext";
import { useSessionStore } from "~/stores/session";
import { useToolContextStore } from "~/stores/toolContext";
import { useEntitlementClient } from "~/features/paywall/services/entitlement.client";
import { useCreateGoalFromInstallmentVsCashMutation } from "~/features/tools/queries/use-create-goal-from-installment-vs-cash-mutation";
import { useCreatePlannedExpenseFromInstallmentVsCashMutation } from "~/features/tools/queries/use-create-planned-expense-from-installment-vs-cash-mutation";
import { useInstallmentVsCashCalculateMutation } from "~/features/tools/queries/use-installment-vs-cash-calculate-mutation";
import { useSaveInstallmentVsCashMutation } from "~/features/tools/queries/use-save-installment-vs-cash-mutation";
import {
  createDefaultInstallmentVsCashFormState,
  getRecommendationLabel,
  INSTALLMENT_VS_CASH_PUBLIC_PATH,
  INSTALLMENT_VS_CASH_TOOL_ID,
  isInstallmentVsCashCalculation,
  isInstallmentVsCashPendingPayload,
  toInstallmentVsCashCalculationRequest,
  validateInstallmentVsCashForm,
  type CreateInstallmentVsCashGoalPayload,
  type CreateInstallmentVsCashPlannedExpensePayload,
  type InstallmentVsCashCalculation,
  type InstallmentVsCashFormState,
  type InstallmentVsCashSavedSimulation,
  type SelectedPaymentOption,
} from "~/features/tools/model/installment-vs-cash";

definePageMeta({
  layout: false,
});

const { t } = useI18n();

useSeoMeta({
  title: t("pages.installmentVsCash.seo.title"),
  description: t("pages.installmentVsCash.seo.description"),
  ogTitle: t("pages.installmentVsCash.seo.ogTitle"),
  ogDescription: t("pages.installmentVsCash.seo.ogDescription"),
  twitterCard: "summary_large_image",
});

useHead({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: t("pages.installmentVsCash.faq.q1"),
            acceptedAnswer: {
              "@type": "Answer",
              text: t("pages.installmentVsCash.faq.a1"),
            },
          },
          {
            "@type": "Question",
            name: t("pages.installmentVsCash.faq.q2"),
            acceptedAnswer: {
              "@type": "Answer",
              text: t("pages.installmentVsCash.faq.a2"),
            },
          },
        ],
      }),
    },
  ],
});
const message = useMessage();
const router = useRouter();
const sessionStore = useSessionStore();
const toolContextStore = useToolContextStore();
const { saveRedirect } = useAuthRedirectContext();
const entitlementClient = useEntitlementClient();

const form = ref<InstallmentVsCashFormState>(
  createDefaultInstallmentVsCashFormState(),
);
const calculation = ref<InstallmentVsCashCalculation | null>(null);
const savedSimulation = ref<InstallmentVsCashSavedSimulation | null>(null);
const validationMessage = ref<string | null>(null);
const showGoalModal = ref(false);
const showExpenseModal = ref(false);

const goalForm = reactive<{
  title: string;
  selectedOption: SelectedPaymentOption;
  description: string;
  targetDate: number | null;
}>({
  title: "",
  selectedOption: "cash",
  description: "",
  targetDate: null,
});

const plannedExpenseForm = reactive<{
  title: string;
  selectedOption: SelectedPaymentOption;
  description: string;
  dueDate: number | null;
  firstDueDate: number | null;
  upfrontDueDate: number | null;
}>({
  title: "",
  selectedOption: "installment",
  description: "",
  dueDate: null,
  firstDueDate: null,
  upfrontDueDate: null,
});

const calculateMutation = useInstallmentVsCashCalculateMutation();
const saveMutation = useSaveInstallmentVsCashMutation();
const createGoalMutation = useCreateGoalFromInstallmentVsCashMutation();
const createPlannedExpenseMutation =
  useCreatePlannedExpenseFromInstallmentVsCashMutation();

sessionStore.restore();

const premiumAccessQuery: UseQueryReturnType<boolean, Error> = useQuery({
  queryKey: ["entitlements", "advanced_simulations", INSTALLMENT_VS_CASH_TOOL_ID],
  enabled: computed<boolean>(() => sessionStore.isAuthenticated),
  queryFn: (): Promise<boolean> => {
    return entitlementClient.checkEntitlement("advanced_simulations");
  },
});

/**
 * Whether the current user has a live authenticated session.
 *
 * @returns True when a session is available.
 */
const isAuthenticated = computed<boolean>(() => {
  sessionStore.restore();
  return sessionStore.isAuthenticated;
});

/**
 * Whether the current user can use premium bridge actions.
 *
 * @returns True when the entitlement query resolved positively.
 */
const hasPremiumAccess = computed<boolean>(() => {
  return premiumAccessQuery.data.value === true;
});

/**
 * Combined activity flag for premium bridge actions.
 *
 * @returns True when a premium bridge mutation is pending.
 */
const isBridging = computed<boolean>(() => {
  return createGoalMutation.isPending.value
    || createPlannedExpenseMutation.isPending.value;
});

/**
 * Reports an operational error to observability and shows a user-friendly message.
 *
 * @param error The original runtime error.
 * @param context Stable context label for observability.
 * @param fallbackMessage Human-readable message shown in the UI.
 */
const handleOperationalError = (
  error: unknown,
  context: string,
  fallbackMessage: string,
): void => {
  captureException(error, {
    context,
    extra: {
      toolId: INSTALLMENT_VS_CASH_TOOL_ID,
    },
  });
  message.error(fallbackMessage);
};

/**
 * Builds a YYYY-MM-DD string from a date-picker timestamp.
 *
 * @param value Epoch milliseconds from Naive UI.
 * @returns ISO calendar string or undefined.
 */
const toIsoDate = (value: number | null): string | undefined => {
  if (value === null) {
    return undefined;
  }

  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Persists the current page state before redirecting the user to login.
 */
const persistContextAndRedirectToLogin = (): void => {
  if (calculation.value === null) {
    return;
  }

  toolContextStore.save(
    INSTALLMENT_VS_CASH_TOOL_ID,
    calculation.value,
    { form: form.value },
  );
  saveRedirect(INSTALLMENT_VS_CASH_PUBLIC_PATH);
  void router.push("/login");
};

/**
 * Ensures a saved simulation exists before a premium bridge action.
 *
 * @returns The saved simulation reference.
 */
const ensureSavedSimulation = async (): Promise<InstallmentVsCashSavedSimulation> => {
  if (savedSimulation.value !== null) {
    return savedSimulation.value;
  }

  const currentCalculation = calculation.value;
  if (currentCalculation === null) {
    throw new Error(t("pages.installmentVsCash.errors.noSimulation"));
  }

  const response = await saveMutation.mutateAsync(
    toInstallmentVsCashCalculationRequest(form.value),
  );
  savedSimulation.value = response.simulation;
  return response.simulation;
};

/**
 * Runs the public calculation using the current form values.
 */
const handleCalculate = async (): Promise<void> => {
  const errors = validateInstallmentVsCashForm(form.value);
  if (errors.length > 0) {
    validationMessage.value = errors[0]?.message ?? t("pages.installmentVsCash.errors.validateForm");
    return;
  }

  validationMessage.value = null;
  savedSimulation.value = null;
  try {
    calculation.value = await calculateMutation.mutateAsync(
      toInstallmentVsCashCalculationRequest(form.value),
    );
  } catch (error: unknown) {
    handleOperationalError(
      error,
      "tools.installment_vs_cash.calculate",
      t("pages.installmentVsCash.errors.calculate"),
    );
  }
};

/**
 * Saves the current calculation or redirects the visitor to login first.
 */
const handleSave = async (): Promise<void> => {
  if (calculation.value === null) {
    return;
  }

  if (!isAuthenticated.value) {
    persistContextAndRedirectToLogin();
    return;
  }

  try {
    const response = await saveMutation.mutateAsync(
      toInstallmentVsCashCalculationRequest(form.value),
    );
    savedSimulation.value = response.simulation;
    message.success(t("pages.installmentVsCash.success.saved"));
  } catch (error: unknown) {
    handleOperationalError(
      error,
      "tools.installment_vs_cash.save",
      t("pages.installmentVsCash.errors.save"),
    );
  }
};

/**
 * Opens the goal bridge or routes the user to the appropriate gate.
 */
const handleGoalAction = async (): Promise<void> => {
  if (calculation.value === null) {
    return;
  }

  if (!isAuthenticated.value) {
    persistContextAndRedirectToLogin();
    return;
  }

  if (!hasPremiumAccess.value) {
    void router.push("/plans");
    return;
  }

  try {
    await ensureSavedSimulation();
    goalForm.title = form.value.scenarioLabel.trim() || t("pages.installmentVsCash.goalModal.defaultTitle");
    goalForm.selectedOption = calculation.value.result.recommendedOption === "installment"
      ? "installment"
      : "cash";
    showGoalModal.value = true;
  } catch (error: unknown) {
    handleOperationalError(
      error,
      "tools.installment_vs_cash.goal.prefill",
      t("pages.installmentVsCash.errors.goalPrefill"),
    );
  }
};

/**
 * Opens the planned-expense bridge or routes the user to the appropriate gate.
 */
const handleExpenseAction = async (): Promise<void> => {
  if (calculation.value === null) {
    return;
  }

  if (!isAuthenticated.value) {
    persistContextAndRedirectToLogin();
    return;
  }

  if (!hasPremiumAccess.value) {
    void router.push("/plans");
    return;
  }

  try {
    await ensureSavedSimulation();
    plannedExpenseForm.title = form.value.scenarioLabel.trim() || t("pages.installmentVsCash.expenseModal.defaultTitle");
    plannedExpenseForm.selectedOption =
      calculation.value.result.recommendedOption === "cash" ? "cash" : "installment";
    showExpenseModal.value = true;
  } catch (error: unknown) {
    handleOperationalError(
      error,
      "tools.installment_vs_cash.expense.prefill",
      t("pages.installmentVsCash.errors.expensePrefill"),
    );
  }
};

/**
 * Submits the goal bridge modal.
 */
const submitGoalBridge = async (): Promise<void> => {
  const simulation = savedSimulation.value;
  if (simulation === null) {
    message.error(t("pages.installmentVsCash.errors.saveBeforeGoal"));
    return;
  }

  const payload: CreateInstallmentVsCashGoalPayload = {
    title: goalForm.title.trim(),
    selectedOption: goalForm.selectedOption,
    description: goalForm.description.trim() || undefined,
    targetDate: toIsoDate(goalForm.targetDate),
  };

  try {
    const response = await createGoalMutation.mutateAsync({
      simulationId: simulation.id,
      payload,
    });

    savedSimulation.value = response.simulation;
    showGoalModal.value = false;
    message.success(t("pages.installmentVsCash.success.goalCreated"));
  } catch (error: unknown) {
    handleOperationalError(
      error,
      "tools.installment_vs_cash.goal.submit",
      t("pages.installmentVsCash.errors.goalSubmit"),
    );
  }
};

/**
 * Submits the planned-expense bridge modal.
 */
const submitExpenseBridge = async (): Promise<void> => {
  const simulation = savedSimulation.value;
  if (simulation === null) {
    message.error(t("pages.installmentVsCash.errors.saveBeforeExpense"));
    return;
  }

  const payload: CreateInstallmentVsCashPlannedExpensePayload = {
    title: plannedExpenseForm.title.trim(),
    selectedOption: plannedExpenseForm.selectedOption,
    description: plannedExpenseForm.description.trim() || undefined,
    dueDate: plannedExpenseForm.selectedOption === "cash"
      ? toIsoDate(plannedExpenseForm.dueDate)
      : undefined,
    firstDueDate: plannedExpenseForm.selectedOption === "installment"
      ? toIsoDate(plannedExpenseForm.firstDueDate)
      : undefined,
    upfrontDueDate: toIsoDate(plannedExpenseForm.upfrontDueDate),
  };

  try {
    const response = await createPlannedExpenseMutation.mutateAsync({
      simulationId: simulation.id,
      payload,
    });

    savedSimulation.value = response.simulation;
    showExpenseModal.value = false;
    message.success(
      t("pages.installmentVsCash.success.expensesCreated", { count: response.transactions.length }),
    );
  } catch (error: unknown) {
    handleOperationalError(
      error,
      "tools.installment_vs_cash.expense.submit",
      t("pages.installmentVsCash.errors.expenseSubmit"),
    );
  }
};

/**
 * Restores pending context after a login redirect when the visitor returns to the page.
 */
onMounted((): void => {
  toolContextStore.restore();

  if (toolContextStore.pendingToolId !== INSTALLMENT_VS_CASH_TOOL_ID) {
    return;
  }

  if (isInstallmentVsCashPendingPayload(toolContextStore.pendingPayload)) {
    form.value = toolContextStore.pendingPayload.form;
  }

  if (isInstallmentVsCashCalculation(toolContextStore.pendingResult)) {
    calculation.value = toolContextStore.pendingResult;
  }

  toolContextStore.clear();
});
</script>

<template>
  <!-- Transparent root wrapper required by vue/no-multiple-template-root.
       display:contents makes it invisible to the layout engine. -->
  <div class="installment-vs-cash-root">
  <!-- ═══ AUTHENTICATED VIEW — tool inside the app shell ══════════════════ -->
  <NuxtLayout v-if="isAuthenticated" name="default">
    <main class="installment-vs-cash-page__content installment-vs-cash-page__content--in-app">
      <section class="installment-vs-cash-page__hero">
        <div class="installment-vs-cash-page__hero-copy">
          <NTag round type="warning">
            {{ t('pages.installmentVsCash.hero.badge') }}
          </NTag>
          <UiPageHeader
            :title="t('pages.installmentVsCash.hero.title')"
            :subtitle="t('pages.installmentVsCash.hero.subtitle')"
          />

          <NSpace vertical :size="16">
            <NThing
              :title="t('pages.installmentVsCash.hero.featureBasic')"
              :description="t('pages.installmentVsCash.hero.featureBasicDesc')"
            />
            <NThing
              :title="t('pages.installmentVsCash.hero.featureAdvanced')"
              :description="t('pages.installmentVsCash.hero.featureAdvancedDesc')"
            />
          </NSpace>
        </div>

        <UiGlassPanel glow class="installment-vs-cash-page__hero-panel">
          <InstallmentVsCashCalculatorForm
            v-model="form"
            :loading="calculateMutation.isPending.value"
            @submit="handleCalculate"
          />

          <NAlert
            v-if="validationMessage"
            type="warning"
            class="installment-vs-cash-page__alert"
          >
            {{ validationMessage }}
          </NAlert>

          <NAlert
            v-if="calculateMutation.isError.value"
            type="error"
            class="installment-vs-cash-page__alert"
          >
            {{ t('pages.installmentVsCash.errors.calculate') }}
          </NAlert>
        </UiGlassPanel>
      </section>

      <section v-if="calculation" class="installment-vs-cash-page__results">
        <InstallmentVsCashResults :calculation="calculation" />

        <UiSurfaceCard>
          <NThing
            :title="t('pages.installmentVsCash.results.nextStep')"
            :description="`${getRecommendationLabel(calculation.result.recommendedOption)}.`"
          />

          <InstallmentVsCashActionBar
            class="installment-vs-cash-page__actions"
            :is-authenticated="isAuthenticated"
            :has-premium-access="hasPremiumAccess"
            :is-saving="saveMutation.isPending.value"
            :is-bridging="isBridging"
            :has-saved-simulation="savedSimulation !== null"
            @save="handleSave"
            @goal="handleGoalAction"
            @expense="handleExpenseAction"
          />
        </UiSurfaceCard>
      </section>

      <section class="installment-vs-cash-page__seo">
        <UiSurfaceCard>
          <NSpace vertical :size="16">
            <NThing
              :title="t('pages.installmentVsCash.seoSection.considers')"
              :description="t('pages.installmentVsCash.seoSection.considersDesc')"
            />
            <NThing
              :title="t('pages.installmentVsCash.seoSection.notReplaces')"
              :description="t('pages.installmentVsCash.seoSection.notReplacesDesc')"
            />
            <NThing
              :title="t('pages.installmentVsCash.seoSection.howToUse')"
              :description="t('pages.installmentVsCash.seoSection.howToUseDesc')"
            />
          </NSpace>
        </UiSurfaceCard>
      </section>
    </main>
  </NuxtLayout>

  <!-- ═══ GUEST VIEW — standalone branded page ════════════════════════════ -->
  <div v-else class="installment-vs-cash-page">
    <header class="installment-vs-cash-page__header">
      <div class="installment-vs-cash-page__brand">
        <span class="installment-vs-cash-page__brand-mark">Auraxis</span>
        <span class="installment-vs-cash-page__brand-copy">{{ t('pages.installmentVsCash.header.publicTool') }}</span>
      </div>

      <div class="installment-vs-cash-page__header-actions">
        <NButton quaternary @click="router.push('/tools')">
          {{ t('pages.installmentVsCash.header.otherTools') }}
        </NButton>
        <NButton type="primary" @click="router.push('/register')">
          {{ t('pages.installmentVsCash.header.createAccount') }}
        </NButton>
      </div>
    </header>

    <main class="installment-vs-cash-page__content">
      <section class="installment-vs-cash-page__hero">
        <div class="installment-vs-cash-page__hero-copy">
          <NTag round type="warning">
            {{ t('pages.installmentVsCash.hero.badge') }}
          </NTag>
          <UiPageHeader
            :title="t('pages.installmentVsCash.hero.title')"
            :subtitle="t('pages.installmentVsCash.hero.subtitle')"
          />

          <NSpace vertical :size="16">
            <NThing
              :title="t('pages.installmentVsCash.hero.featureBasic')"
              :description="t('pages.installmentVsCash.hero.featureBasicDesc')"
            />
            <NThing
              :title="t('pages.installmentVsCash.hero.featureAdvanced')"
              :description="t('pages.installmentVsCash.hero.featureAdvancedDesc')"
            />
          </NSpace>
        </div>

        <UiGlassPanel glow class="installment-vs-cash-page__hero-panel">
          <InstallmentVsCashCalculatorForm
            v-model="form"
            :loading="calculateMutation.isPending.value"
            @submit="handleCalculate"
          />

          <NAlert
            v-if="validationMessage"
            type="warning"
            class="installment-vs-cash-page__alert"
          >
            {{ validationMessage }}
          </NAlert>

          <NAlert
            v-if="calculateMutation.isError.value"
            type="error"
            class="installment-vs-cash-page__alert"
          >
            {{ t('pages.installmentVsCash.errors.calculate') }}
          </NAlert>
        </UiGlassPanel>
      </section>

      <section v-if="calculation" class="installment-vs-cash-page__results">
        <InstallmentVsCashResults :calculation="calculation" />

        <UiSurfaceCard>
          <NThing
            :title="t('pages.installmentVsCash.results.nextStep')"
            :description="`${getRecommendationLabel(calculation.result.recommendedOption)}.`"
          />

          <InstallmentVsCashActionBar
            class="installment-vs-cash-page__actions"
            :is-authenticated="isAuthenticated"
            :has-premium-access="hasPremiumAccess"
            :is-saving="saveMutation.isPending.value"
            :is-bridging="isBridging"
            :has-saved-simulation="savedSimulation !== null"
            @save="handleSave"
            @goal="handleGoalAction"
            @expense="handleExpenseAction"
          />
        </UiSurfaceCard>
      </section>

      <section class="installment-vs-cash-page__seo">
        <UiSurfaceCard>
          <NSpace vertical :size="16">
            <NThing
              :title="t('pages.installmentVsCash.seoSection.considers')"
              :description="t('pages.installmentVsCash.seoSection.considersDesc')"
            />
            <NThing
              :title="t('pages.installmentVsCash.seoSection.notReplaces')"
              :description="t('pages.installmentVsCash.seoSection.notReplacesDesc')"
            />
            <NThing
              :title="t('pages.installmentVsCash.seoSection.howToUse')"
              :description="t('pages.installmentVsCash.seoSection.howToUseDesc')"
            />
          </NSpace>
        </UiSurfaceCard>
      </section>
    </main>

    <!-- ─── Guest CTA — invite visitors to create a free account ─────────── -->
    <section class="ivc-guest-cta" :aria-label="t('pages.installmentVsCash.guestCta.ariaLabel')">
      <div class="ivc-guest-cta__inner">
        <!-- ── Headline ─────────────────────────────────────────────────── -->
        <div class="ivc-guest-cta__headline">
          <div class="ivc-guest-cta__badge">
            <Sparkles :size="14" aria-hidden="true" />
            {{ t('pages.installmentVsCash.guestCta.badge') }}
          </div>
          <h2 class="ivc-guest-cta__title">
            {{ t('pages.installmentVsCash.guestCta.title') }}
          </h2>
          <p class="ivc-guest-cta__subtitle">
            {{ t('pages.installmentVsCash.guestCta.subtitle') }}
          </p>
        </div>

        <!-- ── Feature cards ────────────────────────────────────────────── -->
        <ul class="ivc-guest-cta__features" aria-label="Recursos inclusos">
          <li class="ivc-guest-cta__feature">
            <div class="ivc-guest-cta__feature-icon ivc-guest-cta__feature-icon--blue">
              <BarChart3 :size="22" aria-hidden="true" />
            </div>
            <div>
              <strong class="ivc-guest-cta__feature-title">
                {{ t('pages.installmentVsCash.guestCta.features.portfolio.title') }}
              </strong>
              <span class="ivc-guest-cta__feature-desc">
                {{ t('pages.installmentVsCash.guestCta.features.portfolio.desc') }}
              </span>
            </div>
          </li>

          <li class="ivc-guest-cta__feature">
            <div class="ivc-guest-cta__feature-icon ivc-guest-cta__feature-icon--green">
              <Target :size="22" aria-hidden="true" />
            </div>
            <div>
              <strong class="ivc-guest-cta__feature-title">
                {{ t('pages.installmentVsCash.guestCta.features.goals.title') }}
              </strong>
              <span class="ivc-guest-cta__feature-desc">
                {{ t('pages.installmentVsCash.guestCta.features.goals.desc') }}
              </span>
            </div>
          </li>

          <li class="ivc-guest-cta__feature">
            <div class="ivc-guest-cta__feature-icon ivc-guest-cta__feature-icon--purple">
              <ShieldCheck :size="22" aria-hidden="true" />
            </div>
            <div>
              <strong class="ivc-guest-cta__feature-title">
                {{ t('pages.installmentVsCash.guestCta.features.security.title') }}
              </strong>
              <span class="ivc-guest-cta__feature-desc">
                {{ t('pages.installmentVsCash.guestCta.features.security.desc') }}
              </span>
            </div>
          </li>

          <li class="ivc-guest-cta__feature">
            <div class="ivc-guest-cta__feature-icon ivc-guest-cta__feature-icon--amber">
              <Zap :size="22" aria-hidden="true" />
            </div>
            <div>
              <strong class="ivc-guest-cta__feature-title">
                {{ t('pages.installmentVsCash.guestCta.features.tools.title') }}
              </strong>
              <span class="ivc-guest-cta__feature-desc">
                {{ t('pages.installmentVsCash.guestCta.features.tools.desc') }}
              </span>
            </div>
          </li>
        </ul>

        <!-- ── Actions ──────────────────────────────────────────────────── -->
        <div class="ivc-guest-cta__actions">
          <NButton
            type="primary"
            size="large"
            class="ivc-guest-cta__primary-btn"
            @click="router.push('/register')"
          >
            {{ t('pages.installmentVsCash.guestCta.registerCta') }}
            <ArrowRight :size="16" aria-hidden="true" />
          </NButton>

          <NButton
            quaternary
            size="large"
            @click="router.push('/login')"
          >
            {{ t('pages.installmentVsCash.guestCta.loginCta') }}
          </NButton>
        </div>

        <!-- ── Trust line ────────────────────────────────────────────────── -->
        <p class="ivc-guest-cta__trust">
          {{ t('pages.installmentVsCash.guestCta.trust') }}
        </p>
      </div>
    </section>
  </div>

  <!-- ─── Modals — teleport to <body>, safe outside layout branches ─────── -->
  <NModal
    v-model:show="showGoalModal"
    preset="card"
    :title="t('pages.installmentVsCash.goalModal.title')"
    class="installment-vs-cash-page__modal"
  >
    <NForm label-placement="top">
      <NFormItem :label="t('pages.installmentVsCash.goalModal.titleLabel')">
        <NInput v-model:value="goalForm.title" />
      </NFormItem>

      <NFormItem :label="t('pages.installmentVsCash.goalModal.descriptionLabel')">
        <NInput v-model:value="goalForm.description" type="textarea" />
      </NFormItem>

      <NFormItem :label="t('pages.installmentVsCash.goalModal.targetDateLabel')">
        <NDatePicker
          v-model:value="goalForm.targetDate"
          type="date"
          clearable
        />
      </NFormItem>

      <NSpace justify="end">
        <NButton @click="showGoalModal = false">{{ t('pages.installmentVsCash.goalModal.cancel') }}</NButton>
        <NButton
          type="primary"
          :loading="createGoalMutation.isPending.value"
          @click="submitGoalBridge"
        >
          {{ t('pages.installmentVsCash.goalModal.submit') }}
        </NButton>
      </NSpace>
    </NForm>
  </NModal>

  <NModal
    v-model:show="showExpenseModal"
    preset="card"
    :title="t('pages.installmentVsCash.expenseModal.title')"
    class="installment-vs-cash-page__modal"
  >
    <NForm label-placement="top">
      <NFormItem :label="t('pages.installmentVsCash.expenseModal.titleLabel')">
        <NInput v-model:value="plannedExpenseForm.title" />
      </NFormItem>

      <NFormItem :label="t('pages.installmentVsCash.expenseModal.descriptionLabel')">
        <NInput v-model:value="plannedExpenseForm.description" type="textarea" />
      </NFormItem>

      <NFormItem :label="t('pages.installmentVsCash.expenseModal.modeLabel')">
        <UiSegmentedControl
          v-model="plannedExpenseForm.selectedOption"
          :options="[
            { label: t('pages.installmentVsCash.expenseModal.cashLabel'), value: 'cash' },
            { label: t('pages.installmentVsCash.expenseModal.installmentLabel'), value: 'installment' },
          ]"
          :aria-label="t('pages.installmentVsCash.expenseModal.modeAriaLabel')"
        />
      </NFormItem>

      <NFormItem
        v-if="plannedExpenseForm.selectedOption === 'cash'"
        :label="t('pages.installmentVsCash.expenseModal.dueDateLabel')"
      >
        <NDatePicker
          v-model:value="plannedExpenseForm.dueDate"
          type="date"
          clearable
        />
      </NFormItem>

      <NFormItem
        v-else
        :label="t('pages.installmentVsCash.expenseModal.firstDueDateLabel')"
      >
        <NDatePicker
          v-model:value="plannedExpenseForm.firstDueDate"
          type="date"
          clearable
        />
      </NFormItem>

      <NFormItem v-if="form.feesEnabled" :label="t('pages.installmentVsCash.expenseModal.upfrontDateLabel')">
        <NDatePicker
          v-model:value="plannedExpenseForm.upfrontDueDate"
          type="date"
          clearable
        />
      </NFormItem>

      <NSpace justify="end">
        <NButton @click="showExpenseModal = false">{{ t('pages.installmentVsCash.expenseModal.cancel') }}</NButton>
        <NButton
          type="primary"
          :loading="createPlannedExpenseMutation.isPending.value"
          @click="submitExpenseBridge"
        >
          {{ t('pages.installmentVsCash.expenseModal.submit') }}
        </NButton>
      </NSpace>
    </NForm>
  </NModal>
  </div>
</template>

<style scoped>
/* Transparent wrapper needed for single-root template constraint. */
.installment-vs-cash-root {
  display: contents;
}

.installment-vs-cash-page {
  min-height: 100dvh;
  background:
    radial-gradient(circle at top right, var(--color-brand-glow-xs), transparent 28%),
    linear-gradient(180deg, var(--color-bg-surface) 0%, var(--color-bg-base) 100%);
  color: var(--color-text-primary);
}

.installment-vs-cash-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
}

.installment-vs-cash-page__brand {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.installment-vs-cash-page__brand-mark {
  font-family: var(--font-heading);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
}

.installment-vs-cash-page__brand-copy {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.installment-vs-cash-page__header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.installment-vs-cash-page__content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-4) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.installment-vs-cash-page__hero {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: minmax(0, 1.1fr) minmax(380px, 0.9fr);
  align-items: start;
}

.installment-vs-cash-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-5);
}

.installment-vs-cash-page__hero-panel {
  position: sticky;
  top: var(--space-3);
}

.installment-vs-cash-page__alert {
  margin-top: var(--space-2);
}

.installment-vs-cash-page__results {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.installment-vs-cash-page__actions {
  margin-top: var(--space-2);
}

.installment-vs-cash-page__seo {
  padding-bottom: var(--space-4);
}

:deep(.installment-vs-cash-page__modal) {
  width: min(720px, calc(100vw - 32px));
}

@media (max-width: 1023px) {
  .installment-vs-cash-page__hero {
    grid-template-columns: 1fr;
  }

  .installment-vs-cash-page__hero-copy {
    padding-top: var(--space-2);
  }

  .installment-vs-cash-page__hero-panel {
    position: static;
  }
}

@media (max-width: 767px) {
  .installment-vs-cash-page__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .installment-vs-cash-page__content {
    padding-inline: var(--space-2);
  }
}

/* ── In-app variant (authenticated, inside NuxtLayout default) ───────────── */
.installment-vs-cash-page__content--in-app {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-4) var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

/* ── Guest CTA section ───────────────────────────────────────────────────── */
.ivc-guest-cta {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 70% 50%, color-mix(in srgb, var(--color-brand-500) 8%, transparent), transparent 60%),
    linear-gradient(180deg, var(--color-bg-base) 0%, var(--color-bg-surface) 100%);
  border-top: 1px solid var(--color-outline-soft);
  padding: var(--space-6) var(--space-4);
  margin-top: var(--space-4);
}

.ivc-guest-cta::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 80%, color-mix(in srgb, var(--color-brand-500) 5%, transparent), transparent 50%);
  pointer-events: none;
}

.ivc-guest-cta__inner {
  position: relative;
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5);
  text-align: center;
}

/* ── Badge ────────────────────────────────────────────────────────────────── */
.ivc-guest-cta__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-brand-500) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-brand-500) 25%, transparent);
  color: var(--color-brand-400);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

/* ── Headline ─────────────────────────────────────────────────────────────── */
.ivc-guest-cta__headline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.ivc-guest-cta__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-lg);
  line-height: var(--line-height-heading-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  max-width: 600px;
}

.ivc-guest-cta__subtitle {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  max-width: 520px;
  line-height: 1.6;
}

/* ── Feature grid ─────────────────────────────────────────────────────────── */
.ivc-guest-cta__features {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  width: 100%;
  text-align: left;
}

.ivc-guest-cta__feature {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.ivc-guest-cta__feature:hover {
  border-color: color-mix(in srgb, var(--color-brand-500) 35%, transparent);
  transform: translateY(-2px);
}

.ivc-guest-cta__feature-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.ivc-guest-cta__feature-icon--blue {
  background: color-mix(in srgb, #3b82f6 12%, transparent);
  color: #3b82f6;
}

.ivc-guest-cta__feature-icon--green {
  background: color-mix(in srgb, var(--color-positive) 12%, transparent);
  color: var(--color-positive);
}

.ivc-guest-cta__feature-icon--purple {
  background: color-mix(in srgb, #a855f7 12%, transparent);
  color: #a855f7;
}

.ivc-guest-cta__feature-icon--amber {
  background: color-mix(in srgb, #f59e0b 12%, transparent);
  color: #f59e0b;
}

.ivc-guest-cta__feature-title {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.ivc-guest-cta__feature-desc {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* ── Actions ──────────────────────────────────────────────────────────────── */
.ivc-guest-cta__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: center;
}

.ivc-guest-cta__primary-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

/* ── Trust line ───────────────────────────────────────────────────────────── */
.ivc-guest-cta__trust {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 639px) {
  .ivc-guest-cta__features {
    grid-template-columns: 1fr;
  }

  .ivc-guest-cta__title {
    font-size: var(--font-size-heading-md);
  }

  .ivc-guest-cta__actions {
    flex-direction: column;
    width: 100%;
  }
}
</style>
