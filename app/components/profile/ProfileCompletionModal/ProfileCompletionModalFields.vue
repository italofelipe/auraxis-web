<script setup lang="ts">
import { inject } from "vue";
import {
  GENDER_OPTIONS,
  INVESTOR_PROFILE_OPTIONS,
  BRAZIL_UF_OPTIONS,
} from "~/schemas/user-profile";
import {
  PROFILE_COMPLETION_FORM_KEY,
  type ProfileCompletionFormBindings,
} from "./useProfileCompletionForm";

defineOptions({ name: "ProfileCompletionModalFields" });

const form = inject<ProfileCompletionFormBindings>(PROFILE_COMPLETION_FORM_KEY)!;
</script>

<template>
  <div class="profile-modal-fields">
    <div class="profile-modal__section-label">{{ $t('pages.profile.modal.sectionRequired') }}</div>

    <div class="profile-modal__grid">
      <UiFormField :label="$t('pages.profile.modal.labels.gender')" field-id="pm-gender" :error="form.errors.value.gender" required>
        <select
          id="pm-gender"
          v-model="form.gender.value"
          class="profile-modal__select"
          :class="{ 'profile-modal__input--error': !!form.errors.value.gender }"
          :disabled="form.isPending.value"
          v-bind="form.genderAttrs.value"
        >
          <option value="" disabled>{{ $t('pages.profile.modal.selectPlaceholder') }}</option>
          <option v-for="opt in GENDER_OPTIONS" :key="opt" :value="opt">
            {{ form.genderLabel(opt) }}
          </option>
        </select>
      </UiFormField>

      <UiFormField :label="$t('pages.profile.modal.labels.birthDate')" field-id="pm-birth-date" :error="form.errors.value.birth_date" required>
        <input
          id="pm-birth-date"
          v-model="form.birthDate.value"
          class="profile-modal__input"
          :class="{ 'profile-modal__input--error': !!form.errors.value.birth_date }"
          type="date"
          :disabled="form.isPending.value"
          v-bind="form.birthDateAttrs.value"
        >
      </UiFormField>

      <UiFormField :label="$t('pages.profile.modal.labels.monthlyIncome')" field-id="pm-income" :error="form.errors.value.monthly_income" required>
        <input
          id="pm-income"
          v-model="form.monthlyIncome.value"
          class="profile-modal__input"
          :class="{ 'profile-modal__input--error': !!form.errors.value.monthly_income }"
          type="number" min="0" step="0.01" placeholder="0,00"
          :disabled="form.isPending.value"
          v-bind="form.monthlyIncomeAttrs.value"
        >
      </UiFormField>

      <UiFormField :label="$t('pages.profile.modal.labels.netWorth')" field-id="pm-networth" :error="form.errors.value.net_worth" required>
        <input
          id="pm-networth"
          v-model="form.netWorth.value"
          class="profile-modal__input"
          :class="{ 'profile-modal__input--error': !!form.errors.value.net_worth }"
          type="number" min="0" step="0.01" placeholder="0,00"
          :disabled="form.isPending.value"
          v-bind="form.netWorthAttrs.value"
        >
      </UiFormField>

      <UiFormField :label="$t('pages.profile.modal.labels.monthlyExpenses')" field-id="pm-expenses" :error="form.errors.value.monthly_expenses" required>
        <input
          id="pm-expenses"
          v-model="form.monthlyExpenses.value"
          class="profile-modal__input"
          :class="{ 'profile-modal__input--error': !!form.errors.value.monthly_expenses }"
          type="number" min="0" step="0.01" placeholder="0,00"
          :disabled="form.isPending.value"
          v-bind="form.monthlyExpensesAttrs.value"
        >
      </UiFormField>

      <UiFormField :label="$t('pages.profile.modal.labels.stateUf')" field-id="pm-state" :error="form.errors.value.state_uf" required>
        <select
          id="pm-state"
          v-model="form.stateUf.value"
          class="profile-modal__select"
          :class="{ 'profile-modal__input--error': !!form.errors.value.state_uf }"
          :disabled="form.isPending.value"
          v-bind="form.stateUfAttrs.value"
        >
          <option value="" disabled>{{ $t('pages.profile.modal.selectPlaceholder') }}</option>
          <option v-for="uf in BRAZIL_UF_OPTIONS" :key="uf" :value="uf">{{ uf }}</option>
        </select>
      </UiFormField>

      <UiFormField :label="$t('pages.profile.modal.labels.occupation')" field-id="pm-occupation" :error="form.errors.value.occupation" required>
        <input
          id="pm-occupation"
          v-model="form.occupation.value"
          class="profile-modal__input"
          :class="{ 'profile-modal__input--error': !!form.errors.value.occupation }"
          type="text"
          :placeholder="$t('pages.profile.modal.placeholders.occupation')"
          maxlength="128"
          :disabled="form.isPending.value"
          v-bind="form.occupationAttrs.value"
        >
      </UiFormField>

      <UiFormField :label="$t('pages.profile.modal.labels.investorProfile')" field-id="pm-inv-profile" :error="form.errors.value.investor_profile" required>
        <select
          id="pm-inv-profile"
          v-model="form.investorProfile.value"
          class="profile-modal__select"
          :class="{ 'profile-modal__input--error': !!form.errors.value.investor_profile }"
          :disabled="form.isPending.value"
          v-bind="form.investorProfileAttrs.value"
        >
          <option value="" disabled>{{ $t('pages.profile.modal.selectPlaceholder') }}</option>
          <option v-for="opt in INVESTOR_PROFILE_OPTIONS" :key="opt" :value="opt">
            {{ form.investorProfileLabel(opt) }}
          </option>
        </select>
      </UiFormField>
    </div>

    <UiFormField
      :label="$t('pages.profile.modal.labels.financialObjectives')"
      field-id="pm-objectives"
      :error="form.errors.value.financial_objectives"
      required
    >
      <textarea
        id="pm-objectives"
        v-model="form.financialObjectives.value"
        class="profile-modal__textarea"
        :class="{ 'profile-modal__input--error': !!form.errors.value.financial_objectives }"
        :placeholder="$t('pages.profile.modal.placeholders.financialObjectives')"
        rows="3"
        :disabled="form.isPending.value"
        v-bind="form.financialObjectivesAttrs.value"
      />
    </UiFormField>

    <div class="profile-modal__section-label profile-modal__section-label--optional">
      {{ $t('pages.profile.modal.sectionOptional') }}
    </div>

    <div class="profile-modal__grid">
      <UiFormField :label="$t('pages.profile.modal.labels.initialInvestment')" field-id="pm-init-inv" :error="form.errors.value.initial_investment">
        <input
          id="pm-init-inv"
          v-model="form.initialInvestment.value"
          class="profile-modal__input"
          :class="/* v8 ignore next */ { 'profile-modal__input--error': !!form.errors.value.initial_investment }"
          type="number" min="0" step="0.01" placeholder="0,00"
          :disabled="form.isPending.value"
          v-bind="form.initialInvestmentAttrs.value"
        >
      </UiFormField>

      <UiFormField :label="$t('pages.profile.modal.labels.monthlyInvestment')" field-id="pm-monthly-inv" :error="form.errors.value.monthly_investment">
        <input
          id="pm-monthly-inv"
          v-model="form.monthlyInvestment.value"
          class="profile-modal__input"
          :class="/* v8 ignore next */ { 'profile-modal__input--error': !!form.errors.value.monthly_investment }"
          type="number" min="0" step="0.01" placeholder="0,00"
          :disabled="form.isPending.value"
          v-bind="form.monthlyInvestmentAttrs.value"
        >
      </UiFormField>

      <UiFormField :label="$t('pages.profile.modal.labels.investmentGoalDate')" field-id="pm-goal-date" :error="form.errors.value.investment_goal_date">
        <input
          id="pm-goal-date"
          v-model="form.investmentGoalDate.value"
          class="profile-modal__input"
          :class="/* v8 ignore next */ { 'profile-modal__input--error': !!form.errors.value.investment_goal_date }"
          type="date"
          :disabled="form.isPending.value"
          v-bind="form.investmentGoalDateAttrs.value"
        >
      </UiFormField>
    </div>
  </div>
</template>

<style scoped src="./profile-modal.css"></style>
