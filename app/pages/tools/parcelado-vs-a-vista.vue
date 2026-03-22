<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";
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
import { useEntitlementClient } from "~/features/paywall/api/entitlement.client";
import InstallmentVsCashActionBar from "~/features/tools/components/InstallmentVsCashActionBar.vue";
import InstallmentVsCashCalculatorForm from "~/features/tools/components/InstallmentVsCashCalculatorForm.vue";
import InstallmentVsCashResults from "~/features/tools/components/InstallmentVsCashResults.vue";
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

useSeoMeta({
  title: "Parcelado ou à vista: simule qual opção vale mais a pena | Auraxis",
  description:
    "Compare pagamento à vista e parcelado considerando desconto, inflação, custo de oportunidade e custos extras. Descubra qual opção fica mais vantajosa financeiramente.",
  ogTitle: "Parcelado ou à vista: descubra a melhor opção | Auraxis",
  ogDescription:
    "Ferramenta pública da Auraxis para comparar à vista e parcelado com clareza, premissas transparentes e resultado confiável.",
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
            name: "Quando vale a pena pagar parcelado?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Quando o valor presente do parcelamento fica abaixo do preço à vista dentro das premissas de taxa de oportunidade, inflação e custos extras informados.",
            },
          },
          {
            "@type": "Question",
            name: "Parcelado sem juros sempre é melhor?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Nem sempre. Se houver desconto relevante à vista ou custos extras, o pagamento único pode continuar mais vantajoso financeiramente.",
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
    throw new Error("Nenhuma simulação disponível para salvar.");
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
    validationMessage.value = errors[0]?.message ?? "Revise os dados informados.";
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
      "Não foi possível calcular agora. Revise os dados e tente novamente.",
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
    message.success("Simulação salva com sucesso.");
  } catch (error: unknown) {
    handleOperationalError(
      error,
      "tools.installment_vs_cash.save",
      "Não foi possível salvar a simulação agora.",
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
    void router.push("/planos");
    return;
  }

  try {
    await ensureSavedSimulation();
    goalForm.title = form.value.scenarioLabel.trim() || "Nova meta";
    goalForm.selectedOption = calculation.value.result.recommendedOption === "installment"
      ? "installment"
      : "cash";
    showGoalModal.value = true;
  } catch (error: unknown) {
    handleOperationalError(
      error,
      "tools.installment_vs_cash.goal.prefill",
      "Não foi possível preparar a criação da meta agora.",
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
    void router.push("/planos");
    return;
  }

  try {
    await ensureSavedSimulation();
    plannedExpenseForm.title = form.value.scenarioLabel.trim() || "Compra planejada";
    plannedExpenseForm.selectedOption =
      calculation.value.result.recommendedOption === "cash" ? "cash" : "installment";
    showExpenseModal.value = true;
  } catch (error: unknown) {
    handleOperationalError(
      error,
      "tools.installment_vs_cash.expense.prefill",
      "Não foi possível preparar a despesa planejada agora.",
    );
  }
};

/**
 * Submits the goal bridge modal.
 */
const submitGoalBridge = async (): Promise<void> => {
  const simulation = savedSimulation.value;
  if (simulation === null) {
    message.error("Salve a simulação antes de criar uma meta.");
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
    message.success("Meta criada a partir da simulação.");
  } catch (error: unknown) {
    handleOperationalError(
      error,
      "tools.installment_vs_cash.goal.submit",
      "Não foi possível criar a meta agora.",
    );
  }
};

/**
 * Submits the planned-expense bridge modal.
 */
const submitExpenseBridge = async (): Promise<void> => {
  const simulation = savedSimulation.value;
  if (simulation === null) {
    message.error("Salve a simulação antes de planejar a despesa.");
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
      `${response.transactions.length} lançamento(s) planejado(s) criado(s).`,
    );
  } catch (error: unknown) {
    handleOperationalError(
      error,
      "tools.installment_vs_cash.expense.submit",
      "Não foi possível planejar a despesa agora.",
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
  <div class="installment-vs-cash-page">
    <header class="installment-vs-cash-page__header">
      <div class="installment-vs-cash-page__brand">
        <span class="installment-vs-cash-page__brand-mark">Auraxis</span>
        <span class="installment-vs-cash-page__brand-copy">Ferramenta pública</span>
      </div>

      <div class="installment-vs-cash-page__header-actions">
        <NButton quaternary @click="router.push('/tools')">
          Ver outras ferramentas
        </NButton>
        <NButton type="primary" @click="router.push('/register')">
          Criar conta gratuita
        </NButton>
      </div>
    </header>

    <main class="installment-vs-cash-page__content">
      <section class="installment-vs-cash-page__hero">
        <div class="installment-vs-cash-page__hero-copy">
          <NTag round type="warning">
            Parcelado ou à vista
          </NTag>
          <UiPageHeader
            title="Descubra qual forma de pagamento fica mais vantajosa financeiramente"
            subtitle="A Auraxis compara preço à vista, parcelado, custo de oportunidade, inflação e custos extras para te dar uma recomendação clara e auditável."
          />

          <NSpace vertical :size="16">
            <NThing
              title="Resposta rápida para iniciantes"
              description="Você recebe um veredito direto em segundos, sem precisar entender matemática financeira."
            />
            <NThing
              title="Detalhamento confiável para experts"
              description="Expandimos a explicação com cronograma, valor presente, break-even e premissas usadas."
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
            Não foi possível calcular agora. Revise os dados e tente novamente.
          </NAlert>
        </UiGlassPanel>
      </section>

      <section v-if="calculation" class="installment-vs-cash-page__results">
        <InstallmentVsCashResults :calculation="calculation" />

        <UiSurfaceCard>
          <NThing
            title="Próximo passo"
            :description="`${getRecommendationLabel(calculation.result.recommendedOption)}. Se quiser, salve a simulação para acompanhar depois ou transforme-a em meta/despesa planejada.`"
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
              title="O que esta página considera"
              description="Desconto à vista, parcelamento, custo de oportunidade, inflação e custos extras iniciais."
            />
            <NThing
              title="O que esta página não substitui"
              description="Esta é uma simulação educativa baseada nas premissas informadas. Ela não substitui proposta comercial oficial, contrato ou aconselhamento financeiro."
            />
            <NThing
              title="Como usar melhor"
              description="Teste o mesmo item com e sem desconto à vista, com parcelas diferentes e com taxas mais conservadoras. Isso te ajuda a entender a sensibilidade da decisão."
            />
          </NSpace>
        </UiSurfaceCard>
      </section>
    </main>

    <NModal
      v-model:show="showGoalModal"
      preset="card"
      title="Incluir como meta"
      class="installment-vs-cash-page__modal"
    >
      <NForm label-placement="top">
        <NFormItem label="Título da meta">
          <NInput v-model:value="goalForm.title" />
        </NFormItem>

        <NFormItem label="Descrição">
          <NInput v-model:value="goalForm.description" type="textarea" />
        </NFormItem>

        <NFormItem label="Data alvo">
          <NDatePicker
            v-model:value="goalForm.targetDate"
            type="date"
            clearable
          />
        </NFormItem>

        <NSpace justify="end">
          <NButton @click="showGoalModal = false">Cancelar</NButton>
          <NButton
            type="primary"
            :loading="createGoalMutation.isPending.value"
            @click="submitGoalBridge"
          >
            Criar meta
          </NButton>
        </NSpace>
      </NForm>
    </NModal>

    <NModal
      v-model:show="showExpenseModal"
      preset="card"
      title="Planejar despesa"
      class="installment-vs-cash-page__modal"
    >
      <NForm label-placement="top">
        <NFormItem label="Título da despesa">
          <NInput v-model:value="plannedExpenseForm.title" />
        </NFormItem>

        <NFormItem label="Descrição">
          <NInput v-model:value="plannedExpenseForm.description" type="textarea" />
        </NFormItem>

        <NFormItem label="Modo selecionado">
          <UiSegmentedControl
            v-model="plannedExpenseForm.selectedOption"
            :options="[
              { label: 'À vista', value: 'cash' },
              { label: 'Parcelado', value: 'installment' },
            ]"
            aria-label="Modo da despesa planejada"
          />
        </NFormItem>

        <NFormItem
          v-if="plannedExpenseForm.selectedOption === 'cash'"
          label="Data do lançamento"
        >
          <NDatePicker
            v-model:value="plannedExpenseForm.dueDate"
            type="date"
            clearable
          />
        </NFormItem>

        <NFormItem
          v-else
          label="Primeiro vencimento"
        >
          <NDatePicker
            v-model:value="plannedExpenseForm.firstDueDate"
            type="date"
            clearable
          />
        </NFormItem>

        <NFormItem v-if="form.feesEnabled" label="Data dos custos iniciais">
          <NDatePicker
            v-model:value="plannedExpenseForm.upfrontDueDate"
            type="date"
            clearable
          />
        </NFormItem>

        <NSpace justify="end">
          <NButton @click="showExpenseModal = false">Cancelar</NButton>
          <NButton
            type="primary"
            :loading="createPlannedExpenseMutation.isPending.value"
            @click="submitExpenseBridge"
          >
            Planejar despesa
          </NButton>
        </NSpace>
      </NForm>
    </NModal>
  </div>
</template>

<style scoped>
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
</style>
