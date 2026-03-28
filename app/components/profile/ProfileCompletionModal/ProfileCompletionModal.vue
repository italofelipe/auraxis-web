<script setup lang="ts">
import { NModal, useMessage } from "naive-ui";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import UiFormField from "~/shared/components/UiFormField/UiFormField.vue";
import {
  userProfileSchema,
  GENDER_OPTIONS,
  INVESTOR_PROFILE_OPTIONS,
  BRAZIL_UF_OPTIONS,
  type UserProfileSchema,
} from "~/schemas/user-profile";
import { useUpdateProfileMutation } from "~/features/profile/composables/use-update-profile-mutation";
import { useUserStore } from "~/stores/user";
import type {
  ProfileCompletionModalProps,
  ProfileCompletionModalEmits,
} from "./ProfileCompletionModal.types";
import type { UpdateUserProfileRequest } from "~/features/profile/contracts/user-profile.dto";

const props = defineProps<ProfileCompletionModalProps>();
const emit = defineEmits<ProfileCompletionModalEmits>();

const message = useMessage();
const userStore = useUserStore();
const { mutate, isPending } = useUpdateProfileMutation();

const { defineField, errors, handleSubmit, setValues } = useForm<UserProfileSchema>({
  validationSchema: toTypedSchema(userProfileSchema),
  initialValues: {
    gender: undefined,
    birth_date: "",
    monthly_income: undefined,
    net_worth: undefined,
    monthly_expenses: undefined,
    state_uf: undefined,
    occupation: "",
    investor_profile: undefined,
    financial_objectives: "",
    initial_investment: undefined,
    monthly_investment: undefined,
    investment_goal_date: "",
  },
});

/**
 * Casts a nullable string field to the desired enum type, returning undefined when null.
 *
 * @param value Nullable string from the profile DTO.
 * @returns Typed value or undefined.
 */
const castEnum = <T,>(value: string | null): T | undefined =>
  (value ?? undefined) as T | undefined;

/**
 * Normalises a nullable string field to an empty string fallback.
 *
 * @param value Nullable string from the profile DTO.
 * @returns The string value or empty string.
 */
const strOrEmpty = (value: string | null): string => value ?? "";

/**
 * Normalises a nullable number field to undefined when absent.
 *
 * @param value Nullable number from the profile DTO.
 * @returns The number or undefined.
 */
const numOrUndef = (value: number | null): number | undefined => value ?? undefined;

/**
 * Maps a raw UserProfileDto to VeeValidate form initial values.
 *
 * @param p The profile DTO from the user store.
 * @returns Partial form values to pass to setValues.
 */
const mapProfileToFormValues = (p: NonNullable<typeof userStore.profile>): Partial<UserProfileSchema> => ({
  gender: castEnum<UserProfileSchema["gender"]>(p.gender),
  birth_date: strOrEmpty(p.birth_date),
  monthly_income: numOrUndef(p.monthly_income),
  net_worth: numOrUndef(p.net_worth),
  monthly_expenses: numOrUndef(p.monthly_expenses),
  state_uf: castEnum<UserProfileSchema["state_uf"]>(p.state_uf),
  occupation: strOrEmpty(p.occupation),
  investor_profile: castEnum<UserProfileSchema["investor_profile"]>(p.investor_profile),
  financial_objectives: strOrEmpty(p.financial_objectives),
  initial_investment: numOrUndef(p.initial_investment),
  monthly_investment: numOrUndef(p.monthly_investment),
  investment_goal_date: strOrEmpty(p.investment_goal_date),
});

/**
 * Pre-fills the form with data from the current user store profile.
 * Only called when the modal is opened and a profile is available.
 */
const prefillFromProfile = (): void => {
  const p = userStore.profile;
  if (!p) { return; }
  setValues(mapProfileToFormValues(p));
};

// Pre-fill form with existing profile data when modal opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) { prefillFromProfile(); }
  },
  { immediate: true },
);

const [gender, genderAttrs] = defineField("gender");
const [birthDate, birthDateAttrs] = defineField("birth_date");
const [monthlyIncome, monthlyIncomeAttrs] = defineField("monthly_income");
const [netWorth, netWorthAttrs] = defineField("net_worth");
const [monthlyExpenses, monthlyExpensesAttrs] = defineField("monthly_expenses");
const [stateUf, stateUfAttrs] = defineField("state_uf");
const [occupation, occupationAttrs] = defineField("occupation");
const [investorProfile, investorProfileAttrs] = defineField("investor_profile");
const [financialObjectives, financialObjectivesAttrs] = defineField("financial_objectives");
const [initialInvestment, initialInvestmentAttrs] = defineField("initial_investment");
const [monthlyInvestment, monthlyInvestmentAttrs] = defineField("monthly_investment");
const [investmentGoalDate, investmentGoalDateAttrs] = defineField("investment_goal_date");

/**
 * Converts a numeric value to a decimal string for the API payload.
 *
 * @param value The number to convert, or undefined to omit the field.
 * @returns Decimal string representation, or undefined when value is absent.
 */
const toDecimalString = (value: number | undefined): string | undefined =>
  value !== undefined && value !== null ? String(value) : undefined;

/**
 * Maps validated form values to the API request payload.
 *
 * @param values Validated form values from VeeValidate.
 * @returns Typed API request body for PUT /user/profile.
 */
const buildPayload = (values: UserProfileSchema): UpdateUserProfileRequest => ({
  gender: values.gender,
  birth_date: values.birth_date,
  monthly_income: String(values.monthly_income),
  net_worth: String(values.net_worth),
  monthly_expenses: String(values.monthly_expenses),
  state_uf: values.state_uf,
  occupation: values.occupation,
  investor_profile: values.investor_profile,
  financial_objectives: values.financial_objectives,
  ...(values.initial_investment !== undefined && {
    initial_investment: toDecimalString(values.initial_investment),
  }),
  ...(values.monthly_investment !== undefined && {
    monthly_investment: toDecimalString(values.monthly_investment),
  }),
  ...(values.investment_goal_date && {
    investment_goal_date: values.investment_goal_date,
  }),
});

const onSubmit = handleSubmit((values: UserProfileSchema) => {
  mutate(buildPayload(values), {
    onSuccess: () => {
      message.success("Seus dados foram atualizados", { duration: 3500 });
      emit("saved");
    },
    onError: () => {
      message.error("Houve um problema ao atualizar os dados", { duration: 4000 });
    },
  });
});

const GENDER_LABELS: Record<string, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  outro: "Outro",
};

const INVESTOR_PROFILE_LABELS: Record<string, string> = {
  conservador: "Conservador",
  explorador: "Explorador",
  entusiasta: "Entusiasta",
};
</script>

<template>
  <NModal
    :show="props.open"
    :mask-closable="false"
    class="profile-modal"
    transform-origin="center"
    @update:show="(v) => { if (!v) emit('close'); }"
  >
    <div class="profile-modal__container">
      <!-- Header -->
      <div class="profile-modal__header">
        <div>
          <h2 class="profile-modal__title">Complete seu perfil</h2>
          <p class="profile-modal__subtitle">
            Preencha seus dados financeiros para personalizar sua experiência no Auraxis.
          </p>
        </div>
        <button
          class="profile-modal__close"
          type="button"
          aria-label="Fechar modal"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Form -->
      <form class="profile-modal__form" novalidate @submit.prevent="onSubmit">
        <!-- Required section -->
        <div class="profile-modal__section-label">Dados pessoais e financeiros *</div>

        <div class="profile-modal__grid">
          <!-- Gender -->
          <UiFormField label="Gênero" field-id="pm-gender" :error="errors.gender" required>
            <select
              id="pm-gender"
              v-model="gender"
              class="profile-modal__select"
              :class="{ 'profile-modal__input--error': !!errors.gender }"
              :disabled="isPending"
              v-bind="genderAttrs"
            >
              <option value="" disabled>Selecione</option>
              <option
                v-for="opt in GENDER_OPTIONS"
                :key="opt"
                :value="opt"
              >{{ GENDER_LABELS[opt] }}</option>
            </select>
          </UiFormField>

          <!-- Birth date -->
          <UiFormField label="Data de nascimento" field-id="pm-birth-date" :error="errors.birth_date" required>
            <input
              id="pm-birth-date"
              v-model="birthDate"
              class="profile-modal__input"
              :class="{ 'profile-modal__input--error': !!errors.birth_date }"
              type="date"
              :disabled="isPending"
              v-bind="birthDateAttrs"
            >
          </UiFormField>

          <!-- Monthly income -->
          <UiFormField label="Renda mensal (R$)" field-id="pm-income" :error="errors.monthly_income" required>
            <input
              id="pm-income"
              v-model="monthlyIncome"
              class="profile-modal__input"
              :class="{ 'profile-modal__input--error': !!errors.monthly_income }"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              :disabled="isPending"
              v-bind="monthlyIncomeAttrs"
            >
          </UiFormField>

          <!-- Net worth -->
          <UiFormField label="Patrimônio líquido (R$)" field-id="pm-networth" :error="errors.net_worth" required>
            <input
              id="pm-networth"
              v-model="netWorth"
              class="profile-modal__input"
              :class="{ 'profile-modal__input--error': !!errors.net_worth }"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              :disabled="isPending"
              v-bind="netWorthAttrs"
            >
          </UiFormField>

          <!-- Monthly expenses -->
          <UiFormField label="Gastos mensais (R$)" field-id="pm-expenses" :error="errors.monthly_expenses" required>
            <input
              id="pm-expenses"
              v-model="monthlyExpenses"
              class="profile-modal__input"
              :class="{ 'profile-modal__input--error': !!errors.monthly_expenses }"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              :disabled="isPending"
              v-bind="monthlyExpensesAttrs"
            >
          </UiFormField>

          <!-- State UF -->
          <UiFormField label="Estado (UF)" field-id="pm-state" :error="errors.state_uf" required>
            <select
              id="pm-state"
              v-model="stateUf"
              class="profile-modal__select"
              :class="{ 'profile-modal__input--error': !!errors.state_uf }"
              :disabled="isPending"
              v-bind="stateUfAttrs"
            >
              <option value="" disabled>Selecione</option>
              <option v-for="uf in BRAZIL_UF_OPTIONS" :key="uf" :value="uf">{{ uf }}</option>
            </select>
          </UiFormField>

          <!-- Occupation -->
          <UiFormField label="Profissão" field-id="pm-occupation" :error="errors.occupation" required>
            <input
              id="pm-occupation"
              v-model="occupation"
              class="profile-modal__input"
              :class="{ 'profile-modal__input--error': !!errors.occupation }"
              type="text"
              placeholder="Ex.: Engenheiro de Software"
              maxlength="128"
              :disabled="isPending"
              v-bind="occupationAttrs"
            >
          </UiFormField>

          <!-- Investor profile -->
          <UiFormField label="Perfil de investidor" field-id="pm-inv-profile" :error="errors.investor_profile" required>
            <select
              id="pm-inv-profile"
              v-model="investorProfile"
              class="profile-modal__select"
              :class="{ 'profile-modal__input--error': !!errors.investor_profile }"
              :disabled="isPending"
              v-bind="investorProfileAttrs"
            >
              <option value="" disabled>Selecione</option>
              <option
                v-for="opt in INVESTOR_PROFILE_OPTIONS"
                :key="opt"
                :value="opt"
              >{{ INVESTOR_PROFILE_LABELS[opt] }}</option>
            </select>
          </UiFormField>
        </div>

        <!-- Financial objectives (full width) -->
        <UiFormField
          label="Objetivos financeiros"
          field-id="pm-objectives"
          :error="errors.financial_objectives"
          required
        >
          <textarea
            id="pm-objectives"
            v-model="financialObjectives"
            class="profile-modal__textarea"
            :class="{ 'profile-modal__input--error': !!errors.financial_objectives }"
            placeholder="Ex.: Aposentadoria antecipada, compra de imóvel..."
            rows="3"
            :disabled="isPending"
            v-bind="financialObjectivesAttrs"
          />
        </UiFormField>

        <!-- Optional section -->
        <div class="profile-modal__section-label profile-modal__section-label--optional">
          Informações opcionais
        </div>

        <div class="profile-modal__grid">
          <!-- Initial investment -->
          <UiFormField label="Investimento inicial (R$)" field-id="pm-init-inv" :error="errors.initial_investment">
            <input
              id="pm-init-inv"
              v-model="initialInvestment"
              class="profile-modal__input"
              :class="{ 'profile-modal__input--error': !!errors.initial_investment }"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              :disabled="isPending"
              v-bind="initialInvestmentAttrs"
            >
          </UiFormField>

          <!-- Monthly investment -->
          <UiFormField label="Aporte mensal (R$)" field-id="pm-monthly-inv" :error="errors.monthly_investment">
            <input
              id="pm-monthly-inv"
              v-model="monthlyInvestment"
              class="profile-modal__input"
              :class="{ 'profile-modal__input--error': !!errors.monthly_investment }"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              :disabled="isPending"
              v-bind="monthlyInvestmentAttrs"
            >
          </UiFormField>

          <!-- Investment goal date -->
          <UiFormField label="Data meta de investimento" field-id="pm-goal-date" :error="errors.investment_goal_date">
            <input
              id="pm-goal-date"
              v-model="investmentGoalDate"
              class="profile-modal__input"
              :class="{ 'profile-modal__input--error': !!errors.investment_goal_date }"
              type="date"
              :disabled="isPending"
              v-bind="investmentGoalDateAttrs"
            >
          </UiFormField>
        </div>

        <!-- Actions -->
        <div class="profile-modal__actions">
          <button
            type="button"
            class="profile-modal__btn-secondary"
            :disabled="isPending"
            @click="emit('close')"
          >
            Preencher depois
          </button>

          <button
            type="submit"
            class="profile-modal__btn-primary"
            :disabled="isPending"
            :aria-busy="isPending"
          >
            <span v-if="isPending" class="profile-modal__spinner" aria-hidden="true" />
            {{ isPending ? "Salvando..." : "Atualizar dados" }}
          </button>
        </div>
      </form>
    </div>
  </NModal>
</template>

<style scoped>
.profile-modal__container {
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-outline-soft);
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.profile-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
}

.profile-modal__title {
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1);
}

.profile-modal__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.profile-modal__close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: var(--font-size-md);
  padding: 4px;
  line-height: 1;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.profile-modal__close:hover {
  color: var(--color-text-primary);
}

.profile-modal__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.profile-modal__section-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-brand-400);
  padding-bottom: var(--space-1);
  border-bottom: 1px solid var(--color-outline-soft);
}

.profile-modal__section-label--optional {
  color: var(--color-text-muted);
}

.profile-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.profile-modal__input,
.profile-modal__select,
.profile-modal__textarea {
  width: 100%;
  padding: 10px var(--space-2);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-family: var(--font-body);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
}

.profile-modal__textarea {
  resize: vertical;
  min-height: 80px;
}

.profile-modal__input::placeholder,
.profile-modal__textarea::placeholder {
  color: var(--color-text-subtle);
}

.profile-modal__input:focus,
.profile-modal__select:focus,
.profile-modal__textarea:focus {
  border-color: var(--color-brand-600);
  box-shadow: 0 0 0 2px var(--color-brand-glow-xs);
}

.profile-modal__input--error {
  border-color: var(--color-negative) !important;
}

.profile-modal__input:disabled,
.profile-modal__select:disabled,
.profile-modal__textarea:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.profile-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-outline-soft);
}

.profile-modal__btn-secondary {
  padding: 10px var(--space-3);
  background: transparent;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  font-family: var(--font-body);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.profile-modal__btn-secondary:hover:not(:disabled) {
  border-color: var(--color-brand-600);
  color: var(--color-text-primary);
}

.profile-modal__btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.profile-modal__btn-primary {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: 10px var(--space-4);
  background: var(--color-brand-500);
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-neutral-950);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-body);
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.profile-modal__btn-primary:hover:not(:disabled) {
  background: var(--color-brand-400);
}

.profile-modal__btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.profile-modal__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: var(--color-neutral-950);
  border-radius: 50%;
  animation: pm-spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes pm-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 540px) {
  .profile-modal__grid {
    grid-template-columns: 1fr;
  }
  .profile-modal__container {
    padding: var(--space-3);
  }
}
</style>
