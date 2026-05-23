<script setup lang="ts">
import {
  Briefcase,
  CalendarDays,
  MapPin,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-vue-next";

import { useUserStore } from "~/stores/user";
import { useUserProfileQuery } from "~/features/profile/composables/use-user-profile-query";
import { formatCurrency } from "~/utils/currency";

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Dados Pessoais",
  pageSubtitle: "Seu perfil e preferências",
});

useHead({ title: "Dados Pessoais | Auraxis" });

useUserProfileQuery();

const userStore = useUserStore();

const showEditModal = ref(false);

/** Returns the display label for a given investor_profile value. */
const investorProfileLabel = computed((): string => {
  switch (userStore.profile?.investor_profile) {
    case "conservador": return t("pages.settings.profile.investorProfile.conservador");
    case "explorador": return t("pages.settings.profile.investorProfile.explorador");
    case "entusiasta": return t("pages.settings.profile.investorProfile.entusiasta");
    default: return t("pages.settings.profile.investorProfile.undefined");
  }
});

/** Returns the CSS color for the investor profile badge. */
const investorProfileColor = computed((): string => {
  switch (userStore.profile?.investor_profile) {
    case "conservador": return "var(--color-info)";
    case "explorador": return "var(--color-brand-500)";
    case "entusiasta": return "var(--color-positive)";
    default: return "var(--color-text-muted)";
  }
});

/**
 * Formats a birth_date string from yyyy-mm-dd to dd/mm/yyyy for display.
 *
 * @param value The birth date string in yyyy-mm-dd format, or null/undefined.
 * @returns Formatted date string in dd/mm/yyyy, or "—" when absent.
 */
function formatBirthDate(value: string | null | undefined): string {
  if (!value) { return "—"; }
  const parts = value.split("-");
  if (parts.length !== 3) { return value; }
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

/**
 * Formats a monetary value using the application currency formatter.
 *
 * @param value The number to format, or null/undefined when absent.
 * @returns Formatted currency string, or "—" when the value is absent.
 */
function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) { return "—"; }
  return formatCurrency(value);
}

/**
 * Returns the value as a string, or a dash placeholder when absent.
 *
 * @param value The raw string value from the profile DTO.
 * @returns The value as-is, or "—" when null, undefined, or empty.
 */
function displayValue(value: string | null | undefined): string {
  if (!value) { return "—"; }
  return value;
}

const financialSummaryItems = computed(() => [
  {
    icon: TrendingUp,
    label: t("pages.settings.profile.fields.monthlyIncome"),
    value: formatMoney(userStore.profile?.monthly_income),
  },
  {
    icon: Wallet,
    label: t("pages.settings.profile.fields.monthlyExpenses"),
    value: formatMoney(userStore.profile?.monthly_expenses),
  },
  {
    icon: ShieldCheck,
    label: t("pages.settings.profile.fields.netWorth"),
    value: formatMoney(userStore.profile?.net_worth),
  },
]);

const detailItems = computed(() => [
  {
    icon: UserRound,
    label: t("pages.settings.profile.fields.gender"),
    value: displayValue(userStore.profile?.gender),
  },
  {
    icon: CalendarDays,
    label: t("pages.settings.profile.fields.birthDate"),
    value: formatBirthDate(userStore.profile?.birth_date),
  },
  {
    icon: MapPin,
    label: t("pages.settings.profile.fields.stateUf"),
    value: displayValue(userStore.profile?.state_uf),
  },
  {
    icon: Briefcase,
    label: t("pages.settings.profile.fields.occupation"),
    value: displayValue(userStore.profile?.occupation),
  },
  {
    icon: Target,
    label: t("pages.settings.profile.fields.financialObjectives"),
    value: displayValue(userStore.profile?.financial_objectives),
  },
]);
</script>

<template>
  <div class="profile-page">
    <div class="profile-page__header">
      <div class="profile-page__title-block">
        <span class="profile-page__title">{{ $t('pages.settings.profile.title') }}</span>
        <span class="profile-page__subtitle">{{ $t('pages.settings.profile.subtitle') }}</span>
      </div>
      <button class="profile-page__edit-btn" @click="showEditModal = true">
        {{ $t('pages.settings.profile.editProfile') }}
      </button>
    </div>

    <div
      v-if="!userStore.isProfileComplete"
      class="profile-page__warning"
    >
      <span class="profile-page__warning-text">
        {{ $t('pages.settings.profile.incompleteWarning') }}
      </span>
      <button class="profile-page__warning-cta" @click="showEditModal = true">
        {{ $t('pages.settings.profile.completeProfile') }}
      </button>
    </div>

    <section class="profile-page__surface">
      <div class="profile-page__identity">
        <div class="profile-page__identity-main">
          <span class="profile-page__avatar" aria-hidden="true">
            <UserRound :size="24" />
          </span>
          <div>
            <div class="profile-page__name">{{ userStore.profile?.name ?? "—" }}</div>
            <div class="profile-page__email">{{ userStore.profile?.email ?? "—" }}</div>
          </div>
        </div>
        <button
          class="profile-page__investor-badge"
          :style="{ backgroundColor: investorProfileColor, borderColor: investorProfileColor }"
          @click="showEditModal = true"
        >
          {{ investorProfileLabel }}
        </button>
      </div>

      <div class="profile-page__divider" />

      <div class="profile-page__summary" aria-label="Resumo financeiro do perfil">
        <div
          v-for="item in financialSummaryItems"
          :key="item.label"
          class="profile-page__summary-item"
        >
          <span class="profile-page__summary-icon" aria-hidden="true">
            <component :is="item.icon" :size="18" />
          </span>
          <div>
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </div>

      <div class="profile-page__section-heading">
        <span>Informações do perfil</span>
        <small>Dados usados para personalizar projeções, metas e leitura financeira.</small>
      </div>

      <div class="profile-page__fields">
        <div
          v-for="item in detailItems"
          :key="item.label"
          class="profile-page__field"
        >
          <span class="profile-page__field-icon" aria-hidden="true">
            <component :is="item.icon" :size="17" />
          </span>
          <div>
            <span class="profile-page__field-label">{{ item.label }}</span>
            <span class="profile-page__field-value">{{ item.value }}</span>
          </div>
        </div>
        <div class="profile-page__field">
          <span class="profile-page__field-icon" aria-hidden="true">
            <ShieldCheck :size="17" />
          </span>
          <div>
            <span class="profile-page__field-label">{{ $t('pages.settings.profile.fields.investorProfile') }}</span>
            <span class="profile-page__field-value">{{ investorProfileLabel }}</span>
          </div>
        </div>
      </div>
    </section>

    <ProfileCompletionModal
      :open="showEditModal"
      @close="showEditModal = false"
      @saved="showEditModal = false"
    />
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
}

.profile-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.profile-page__title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-page__title {
  font-size: var(--font-size-lg, 1.25rem);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.profile-page__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.profile-page__edit-btn {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-brand-500);
  background: transparent;
  color: var(--color-brand-500);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.profile-page__edit-btn:hover {
  background: var(--color-brand-500);
  color: var(--color-text-on-brand);
}

.profile-page__warning {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding: var(--space-2) var(--space-3);
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
}

.profile-page__warning-text {
  font-size: var(--font-size-sm);
  color: var(--color-warning-text);
}

.profile-page__warning-cta {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-warning);
  background: transparent;
  color: var(--color-warning-text);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  white-space: nowrap;
}

.profile-page__warning-cta:hover {
  background: var(--color-warning);
  color: var(--color-text-on-brand);
}

.profile-page__surface {
  display: grid;
  gap: var(--space-3);
  overflow: hidden;
}

.profile-page__identity {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.profile-page__identity-main {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.profile-page__avatar,
.profile-page__summary-icon,
.profile-page__field-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: var(--radius-full);
  background: var(--color-brand-hover-surface);
  color: var(--color-brand-500);
}

.profile-page__avatar {
  width: 52px;
  height: 52px;
}

.profile-page__name {
  font-size: var(--font-size-lg, 1.25rem);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.profile-page__email {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.profile-page__investor-badge {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full, 9999px);
  border: 2px solid;
  background: transparent;
  color: var(--color-text-on-brand);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}

.profile-page__investor-badge:hover {
  opacity: 0.85;
}

.profile-page__divider {
  height: 1px;
  background: var(--color-outline-soft);
}

.profile-page__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.profile-page__summary-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 84px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  background: var(--color-bg-elevated);
}

.profile-page__summary-icon {
  width: 42px;
  height: 42px;
}

.profile-page__summary-item div > span {
  display: block;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.profile-page__summary-item strong {
  display: block;
  margin-top: 4px;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.profile-page__section-heading {
  display: grid;
  gap: 4px;
}

.profile-page__section-heading span {
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}

.profile-page__section-heading small {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.profile-page__fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-3);
}

.profile-page__field {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  min-height: 72px;
  padding: var(--space-2) 0;
}

.profile-page__field > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.profile-page__field-icon {
  width: 34px;
  height: 34px;
  margin-top: 2px;
  background: var(--color-bg-elevated);
}

.profile-page__field-label {
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.profile-page__field-value {
  display: block;
  font-size: var(--font-size-base, 1rem);
  color: var(--color-text-primary);
  line-height: 1.35;
  overflow-wrap: anywhere;
}

@media (max-width: 760px) {
  .profile-page {
    padding: var(--space-3);
  }

  .profile-page__summary {
    grid-template-columns: 1fr;
  }

  .profile-page__summary-item {
    min-height: auto;
  }
}
</style>
