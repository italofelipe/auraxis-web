<script setup lang="ts">
import {
  Briefcase,
  BadgeCheck,
  CalendarDays,
  Compass,
  Mail,
  MapPin,
  Pencil,
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
const emptyLabel = "Não informado";

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
 * @returns Formatted date string in dd/mm/yyyy, or a friendly placeholder when absent.
 */
function formatBirthDate(value: string | null | undefined): string {
  if (!value) { return emptyLabel; }
  const parts = value.split("-");
  if (parts.length !== 3) { return value; }
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

/**
 * Formats a monetary value using the application currency formatter.
 *
 * @param value The number to format, or null/undefined when absent.
 * @returns Formatted currency string, or a friendly placeholder when the value is absent.
 */
function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) { return emptyLabel; }
  return formatCurrency(value);
}

/**
 * Returns the value as a string, or a friendly placeholder when absent.
 *
 * @param value The raw string value from the profile DTO.
 * @returns The value as-is, or a placeholder when null, undefined, or empty.
 */
function displayValue(value: string | null | undefined): string {
  if (!value || value.trim().length === 0) { return emptyLabel; }
  return value;
}

const financialSummaryItems = computed(() => [
  {
    icon: TrendingUp,
    label: t("pages.settings.profile.fields.monthlyIncome"),
    value: formatMoney(userStore.profile?.monthly_income),
    helper: "Base para projeções e metas.",
  },
  {
    icon: Wallet,
    label: t("pages.settings.profile.fields.monthlyExpenses"),
    value: formatMoney(userStore.profile?.monthly_expenses),
    helper: "Ajuda a medir folga mensal.",
  },
  {
    icon: ShieldCheck,
    label: t("pages.settings.profile.fields.netWorth"),
    value: formatMoney(userStore.profile?.net_worth),
    helper: "Referência para evolução patrimonial.",
  },
]);

const personalDetailItems = computed(() => [
  { icon: UserRound, label: t("pages.settings.profile.fields.gender"), value: displayValue(userStore.profile?.gender) },
  { icon: CalendarDays, label: t("pages.settings.profile.fields.birthDate"), value: formatBirthDate(userStore.profile?.birth_date) },
  { icon: MapPin, label: t("pages.settings.profile.fields.stateUf"), value: displayValue(userStore.profile?.state_uf) },
  { icon: Briefcase, label: t("pages.settings.profile.fields.occupation"), value: displayValue(userStore.profile?.occupation) },
]);

const preferenceItems = computed(() => [
  { icon: Target, label: t("pages.settings.profile.fields.financialObjectives"), value: displayValue(userStore.profile?.financial_objectives) },
  { icon: Compass, label: t("pages.settings.profile.fields.investorProfile"), value: investorProfileLabel.value },
]);
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <div class="profile-page__title-block">
        <span class="profile-page__title">{{ $t('pages.settings.profile.title') }}</span>
        <span class="profile-page__subtitle">{{ $t('pages.settings.profile.subtitle') }}</span>
      </div>
      <button class="profile-page__edit-btn" @click="showEditModal = true">
        <Pencil :size="16" aria-hidden="true" />
        {{ $t('pages.settings.profile.editProfile') }}
      </button>
    </header>

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
      <div class="profile-page__hero">
        <div class="profile-page__identity">
          <span class="profile-page__avatar" aria-hidden="true">
            <UserRound :size="30" />
          </span>
          <div class="profile-page__identity-copy">
            <span class="profile-page__eyebrow">Perfil financeiro</span>
            <h2>{{ displayValue(userStore.profile?.name) }}</h2>
            <p>
              <Mail :size="15" aria-hidden="true" />
              {{ displayValue(userStore.profile?.email) }}
            </p>
          </div>
        </div>

        <div class="profile-page__hero-aside">
          <button
            class="profile-page__investor-badge"
            :style="{ '--profile-badge-color': investorProfileColor }"
            @click="showEditModal = true"
          >
            <BadgeCheck :size="16" aria-hidden="true" />
            {{ investorProfileLabel }}
          </button>
          <p>
            Esses dados deixam projeções, metas e alertas mais próximos da sua realidade financeira.
          </p>
        </div>
      </div>

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
            <small>{{ item.helper }}</small>
          </div>
        </div>
      </div>

      <div class="profile-page__sections">
        <section class="profile-page__section">
          <div class="profile-page__section-heading">
            <span>Dados básicos</span>
            <small>Informações pessoais usadas para contexto e organização.</small>
          </div>
          <div class="profile-page__fields">
            <div
              v-for="item in personalDetailItems"
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
          </div>
        </section>

        <section class="profile-page__section profile-page__section--accent">
          <div class="profile-page__section-heading">
            <span>Preferências e objetivos</span>
            <small>O que guia as leituras, projeções e recomendações dentro do Auraxis.</small>
          </div>
          <div class="profile-page__fields profile-page__fields--stacked">
            <div
              v-for="item in preferenceItems"
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
          </div>
        </section>
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
  display: grid;
  gap: var(--space-4);
  min-width: 0;
  padding: var(--space-4);
}

.profile-page__header,
.profile-page__hero {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.profile-page__header {
  align-items: flex-start;
}

.profile-page__title-block {
  display: grid;
  gap: 4px;
}

.profile-page__title {
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
}

.profile-page__subtitle,
.profile-page__hero-aside p,
.profile-page__section-heading small,
.profile-page__summary-item small {
  color: var(--color-text-muted);
}

.profile-page__edit-btn,
.profile-page__warning-cta,
.profile-page__investor-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  white-space: nowrap;
}

.profile-page__edit-btn {
  border: 1px solid var(--color-brand-500);
  background: transparent;
  color: var(--color-brand-500);
  padding: 9px 14px;
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
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  background: var(--color-warning-bg);
  padding: var(--space-2) var(--space-3);
}

.profile-page__warning-text {
  color: var(--color-warning-text);
  font-size: var(--font-size-sm);
}

.profile-page__warning-cta {
  border: 1px solid var(--color-warning);
  background: transparent;
  color: var(--color-warning-text);
  padding: var(--space-1) var(--space-2);
}

.profile-page__warning-cta:hover {
  background: var(--color-warning);
  color: var(--color-text-on-brand);
}

.profile-page__surface {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}

.profile-page__hero {
  align-items: center;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 100% 0%, var(--color-brand-glow-2xs), transparent 34%),
    var(--color-bg-surface);
  padding: clamp(var(--space-4), 3vw, var(--space-6));
  box-shadow: var(--shadow-card);
}

.profile-page__identity {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
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
  width: 68px;
  height: 68px;
}

.profile-page__identity-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.profile-page__eyebrow,
.profile-page__summary-item div > span,
.profile-page__field-label {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.profile-page__identity-copy h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: clamp(var(--font-size-xl), 2vw, var(--font-size-2xl));
  line-height: 1.1;
}

.profile-page__identity-copy p {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: var(--color-text-secondary);
}

.profile-page__hero-aside {
  display: grid;
  justify-items: end;
  gap: var(--space-2);
  max-width: 360px;
  text-align: right;
}

.profile-page__hero-aside p {
  margin: 0;
  line-height: 1.5;
}

.profile-page__investor-badge {
  --profile-badge-color: var(--color-brand-500);
  border: 1px solid color-mix(in srgb, var(--profile-badge-color) 48%, transparent);
  background: color-mix(in srgb, var(--profile-badge-color) 16%, transparent);
  color: var(--profile-badge-color);
  padding: 8px 12px;
}

.profile-page__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.profile-page__summary-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  min-width: 0;
  min-height: 128px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  padding: var(--space-3);
  box-shadow: var(--shadow-card);
}

.profile-page__summary-icon {
  width: 46px;
  height: 46px;
}

.profile-page__summary-item div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.profile-page__summary-item strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  overflow-wrap: anywhere;
}

.profile-page__summary-item small {
  line-height: 1.4;
}

.profile-page__sections {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: var(--space-3);
  min-width: 0;
}

.profile-page__section {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  padding: var(--space-4);
}

.profile-page__section--accent {
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--color-brand-500) 9%, transparent), transparent 42%),
    var(--color-bg-surface);
}

.profile-page__section-heading {
  display: grid;
  gap: 4px;
}

.profile-page__section-heading span {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.profile-page__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.profile-page__fields--stacked {
  grid-template-columns: 1fr;
}

.profile-page__field {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  min-width: 0;
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-bg-elevated) 64%, transparent);
  padding: var(--space-3);
}

.profile-page__field > div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.profile-page__field-icon {
  width: 36px;
  height: 36px;
  background: var(--color-bg-elevated);
}

.profile-page__field-value {
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  line-height: 1.4;
  overflow-wrap: anywhere;
}

@media (max-width: 980px) {
  .profile-page__summary,
  .profile-page__sections {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .profile-page {
    padding: var(--space-3);
  }

  .profile-page__hero {
    align-items: flex-start;
  }

  .profile-page__hero-aside {
    justify-items: start;
    text-align: left;
  }

  .profile-page__fields {
    grid-template-columns: 1fr;
  }
}
</style>
