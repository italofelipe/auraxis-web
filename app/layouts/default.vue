<script setup lang="ts">
import {
  LayoutDashboard,
  Briefcase,
  Target,
  Wrench,
  Bell,
  Share2,
  Sparkles,
  Calculator,
  CreditCard,
  User,
  ArrowLeftRight,
  PiggyBank,
  Focus as FocusIcon,
  ShieldCheck,
  LockKeyhole,
} from "lucide-vue-next";
// UiAppShell and ProfileCompletionModal are auto-imported from app/components/.
// Feature-owned components in app/features/*/components/ are NOT auto-imported
// (flat-registry convention from #343) — must be imported explicitly.
import type { AppShellNavItem, AppShellUser } from "~/components/ui/UiAppShell/UiAppShell.types";
import { useUserProfileQuery } from "~/features/profile/composables/use-user-profile-query";
import { useUserStore } from "~/stores/user";
import { useLogout } from "~/composables/useLogout";
import { isFeatureEnabled } from "~/shared/feature-flags";
import { useOnboarding } from "~/features/onboarding/composables/useOnboarding";
import { useAdminAccess } from "~/features/admin/model/admin-access";
import AdminImpersonationBanner from "~/features/admin/impersonation/components/AdminImpersonationBanner.vue";
import OnboardingWizard from "~/features/onboarding/components/OnboardingWizard.vue";
import OnboardingTriggerButton from "~/features/onboarding/components/OnboardingTriggerButton.vue";

const { t } = useI18n();
const route = useRoute();
const sessionStore = useSessionStore();
const userStore = useUserStore();
const { logout } = useLogout();
const { isAdmin } = useAdminAccess();

useUserProfileQuery();

/**
 * Full nav item definitions with optional feature flag keys.
 * Items whose flagKey resolves to disabled are hidden from the sidebar so users
 * are not confused by navigation links leading to "Em breve" pages.
 *
 * To re-enable an item: set its flag status to "enabled-prod" in
 * config/feature-flags.json.
 */
interface NavItemDefinition extends AppShellNavItem {
  flagKey?: string;
}

const ALL_NAV_ITEMS = computed<NavItemDefinition[]>(() => [
  { key: "dashboard", label: t("nav.dashboard"), to: "/dashboard", icon: LayoutDashboard },
  { key: "focus", label: t("nav.focus"), to: "/focus", icon: FocusIcon, flagKey: "web.pages.focus" },
  { key: "transactions", label: t("nav.transactions"), to: "/transactions", icon: ArrowLeftRight },
  { key: "insights", label: t("nav.insights"), to: "/insights", icon: Sparkles, flagKey: "web.pages.insights" },
  { key: "portfolio", label: t("nav.portfolio"), to: "/portfolio", icon: Briefcase, flagKey: "web.pages.portfolio" },
  { key: "goals", label: t("nav.goals"), to: "/goals", icon: Target, flagKey: "web.pages.goals" },
  { key: "budgets", label: t("nav.budgets"), to: "/budgets", icon: PiggyBank, flagKey: "web.pages.budgets" },
  { key: "alerts", label: t("nav.alerts"), to: "/alerts", icon: Bell, flagKey: "web.pages.alerts" },
  { key: "simulations", label: t("nav.simulations"), to: "/simulations", icon: Calculator, flagKey: "web.pages.simulations" },
  { key: "sharedEntries", label: t("nav.sharedEntries"), to: "/shared-entries", icon: Share2, flagKey: "web.pages.shared-entries" },
  { key: "tools", label: t("nav.tools"), to: "/tools", icon: Wrench },
  { key: "subscription", label: t("nav.subscription"), to: "/subscription", icon: CreditCard },
  { key: "personalData", label: t("nav.personalData"), to: "/settings/profile", icon: User },
  { key: "privacyCenter", label: "Privacidade", to: "/settings/privacy", icon: LockKeyhole, flagKey: "web.pages.settings.privacy-center" },
  ...(isAdmin.value ? [{ key: "admin", label: "Admin", to: "/admin", icon: ShieldCheck }] : []),
]);

const NAV_ITEMS = computed<AppShellNavItem[]>(() =>
  ALL_NAV_ITEMS.value
    .filter((item) => !item.flagKey || isFeatureEnabled(item.flagKey))
    .map(({ flagKey: _flagKey, ...navItem }) => navItem),
);

const user = computed<AppShellUser>(() => ({
  name: userStore.profile?.name || sessionStore.userEmail || t("user.fallbackName"),
  description: t("user.accountDescription"),
  avatarUrl: undefined,
}));

const pageTitle = computed(() => (route.meta.pageTitle as string | undefined) ?? "Auraxis");
const pageSubtitle = computed(() => route.meta.pageSubtitle as string | undefined);

const onboarding = useOnboarding();
const { shouldShow: showOnboardingWizard } = onboarding;

const showProfileModal = ref(false);
const shouldHoldSecondaryModals = computed(() => sessionStore.emailConfirmed === false);

const _profileModalFlagKey = computed((): string => {
  const uid = userStore.profile?.id ?? sessionStore.userEmail ?? "guest";
  return `auraxis:profile_modal_seen:${uid}`;
});
const _isProfileModalDismissed = computed((): boolean => {
  if (typeof localStorage === "undefined") { return false; }
  return localStorage.getItem(_profileModalFlagKey.value) === "1";
});

/** Persists the profile modal dismissal flag to localStorage for the current user. */
const _dismissProfileModal = (): void => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(_profileModalFlagKey.value, "1");
  }
};

watch(
  () => userStore.isLoaded && !userStore.isProfileComplete,
  (shouldShow) => {
    if (shouldShow && !_isProfileModalDismissed.value && !showOnboardingWizard.value && !shouldHoldSecondaryModals.value) {
      showProfileModal.value = true;
    }
  },
  { immediate: true },
);

/**
 * Handles profile modal close (Preencher depois): persists dismissal flag and hides modal.
 */
function onProfileModalClose(): void {
  _dismissProfileModal();
  showProfileModal.value = false;
}

/** Signs out the current user, clears all state, and redirects to login. */
function onLogout(): void {
  logout();
}

/** Opens the primary settings page from the user menu. */
function onUserSettings(): void {
  void navigateTo("/settings/profile");
}

/** Restarts the guided onboarding from the user menu. */
function onReplayOnboarding(): void {
  onboarding.reset();
  onboarding.start();
}
</script>

<template>
  <div class="app-root">
    <AdminImpersonationBanner />
    <EmailConfirmationModal />
    <BillingStatusBanner />
    <UiAppShell
    :nav-items="NAV_ITEMS"
    :user="user"
    :page-title="pageTitle"
    :page-subtitle="pageSubtitle"
    @user-logout="onLogout"
    @user-settings="onUserSettings"
    @user-onboarding="onReplayOnboarding"
  >
    <template #topbar-extras>
      <TopbarSubscriptionBadge />
    </template>
    <slot />
    <ProfileCompletionModal
      :open="showProfileModal"
      @close="onProfileModalClose()"
      @saved="showProfileModal = false"
    />
  </UiAppShell>
  <OnboardingWizard />
  <OnboardingTriggerButton />
  </div>
</template>
