import { watch, type InjectionKey, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { useMessage } from "naive-ui";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";

import {
  userProfileSchema,
  type UserProfileSchema,
} from "~/schemas/user-profile";
import { useUpdateProfileMutation } from "~/features/profile/composables/use-update-profile-mutation";
import { useUserStore } from "~/stores/user";
import type { UpdateUserProfileRequest } from "~/features/profile/contracts/user-profile.dto";

export type ProfileCompletionFormBindings = ReturnType<typeof useProfileCompletionForm>;

export const PROFILE_COMPLETION_FORM_KEY: InjectionKey<ProfileCompletionFormBindings> =
  Symbol("ProfileCompletionForm");

export interface UseProfileCompletionFormOptions {
  open: Ref<boolean>;
  emit: (event: "saved" | "close") => void;
}

/**
 * Casts a nullable string field to the desired enum type, returning undefined when null.
 *
 * @param value Nullable string from the profile DTO.
 * @returns Typed value or undefined.
 */
function castEnum<T>(value: string | null): T | undefined {
  return (value ?? undefined) as T | undefined;
}

/**
 * Normalises a nullable string field to an empty string fallback.
 *
 * @param value Nullable string from the profile DTO.
 * @returns The string value or empty string.
 */
function strOrEmpty(value: string | null): string {
  return value ?? "";
}

/**
 * Normalises a nullable number field to undefined when absent.
 *
 * @param value Nullable number from the profile DTO.
 * @returns The number or undefined.
 */
function numOrUndef(value: number | null): number | undefined {
  return value ?? undefined;
}

/**
 * Converts a numeric value to a decimal string for the API payload.
 *
 * @param value The number to convert, or undefined to omit the field.
 * @returns Decimal string representation, or undefined when value is absent.
 */
function toDecimalString(value: number | undefined): string | undefined {
  return value !== undefined && value !== null ? String(value) : undefined;
}

/**
 * Maps validated form values to the API request payload.
 *
 * @param values Validated form values from VeeValidate.
 * @returns Typed API request body for PUT /user/profile.
 */
function buildPayload(values: UserProfileSchema): UpdateUserProfileRequest {
  return {
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
  };
}

/* eslint-disable max-lines-per-function, max-statements, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types -- return type inferred from composable shape */
/**
 * Encapsulates VeeValidate form state, prefill lifecycle, submit mutation and
 * label helpers for the ProfileCompletionModal.
 *
 * @param opts Reactive `open` flag and the host emit handler.
 * @returns Field tuples (model + attrs), errors, isPending, onSubmit and label helpers.
 */
export function useProfileCompletionForm(opts: UseProfileCompletionFormOptions) {
  const { open, emit } = opts;

  const { t } = useI18n();
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
   * Maps a raw UserProfileDto to VeeValidate form initial values.
   *
   * @param p The profile DTO from the user store.
   * @returns Partial form values to pass to setValues.
   */
  function mapProfileToFormValues(
    p: NonNullable<typeof userStore.profile>,
  ): Partial<UserProfileSchema> {
    return {
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
    };
  }

  /** Pre-fills the form with data from the current user store profile. */
  function prefillFromProfile(): void {
    const p = userStore.profile;
    if (!p) { return; }
    setValues(mapProfileToFormValues(p));
  }

  watch(
    () => open.value,
    (isOpen) => { if (isOpen) { prefillFromProfile(); } },
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

  const onSubmit = handleSubmit((values: UserProfileSchema) => {
    mutate(buildPayload(values), {
      onSuccess: () => {
        message.success(t("pages.profile.modal.messages.success"), { duration: 3500 });
        emit("saved");
      },
      onError: () => {
        message.error(t("pages.profile.modal.messages.error"), { duration: 4000 });
      },
    });
  });

  /**
   * Returns the localized label for a gender option.
   *
   * @param opt The gender option key (e.g., "masculino").
   * @returns Localized label string.
   */
  function genderLabel(opt: string): string {
    return t(`pages.profile.modal.genderOptions.${opt}`, opt);
  }

  /**
   * Returns the localized label for an investor profile option.
   *
   * @param opt The investor profile key (e.g., "conservador").
   * @returns Localized title string.
   */
  function investorProfileLabel(opt: string): string {
    return t(`investorProfile.result.${opt}.title`, opt);
  }

  return {
    gender, genderAttrs,
    birthDate, birthDateAttrs,
    monthlyIncome, monthlyIncomeAttrs,
    netWorth, netWorthAttrs,
    monthlyExpenses, monthlyExpensesAttrs,
    stateUf, stateUfAttrs,
    occupation, occupationAttrs,
    investorProfile, investorProfileAttrs,
    financialObjectives, financialObjectivesAttrs,
    initialInvestment, initialInvestmentAttrs,
    monthlyInvestment, monthlyInvestmentAttrs,
    investmentGoalDate, investmentGoalDateAttrs,
    errors,
    isPending,
    onSubmit,
    genderLabel,
    investorProfileLabel,
  };
}
/* eslint-enable max-lines-per-function, max-statements, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types */
