<script setup lang="ts">
import {
  LayoutDashboard,
  Briefcase,
  Target,
  Wrench,
  Bell,
  Share2,
  Calculator,
  CreditCard,
  User,
  ArrowLeftRight,
} from "lucide-vue-next";
// UiAppShell and ProfileCompletionModal are auto-imported from app/components/.
import type { AppShellNavItem, AppShellUser } from "~/components/ui/UiAppShell/UiAppShell.types";
import { useUserProfileQuery } from "~/features/profile/composables/use-user-profile-query";
import { useUserStore } from "~/stores/user";
import { useLogout } from "~/composables/useLogout";
import { isFeatureEnabled } from "~/shared/feature-flags";

const { t } = useI18n();
const route = useRoute();
const sessionStore = useSessionStore();
const userStore = useUserStore();
const { logout } = useLogout();

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
  { key: "transactions", label: t("nav.transactions"), to: "/transactions", icon: ArrowLeftRight },
  { key: "portfolio", label: t("nav.portfolio"), to: "/portfolio", icon: Briefcase, flagKey: "web.pages.portfolio" },
  { key: "goals", label: t("nav.goals"), to: "/goals", icon: Target, flagKey: "web.pages.goals" },
  { key: "alerts", label: t("nav.alerts"), to: "/alerts", icon: Bell, flagKey: "web.pages.alerts" },
  { key: "simulations", label: t("nav.simulations"), to: "/simulations", icon: Calculator, flagKey: "web.pages.simulations" },
  { key: "sharedEntries", label: t("nav.sharedEntries"), to: "/shared-entries", icon: Share2, flagKey: "web.pages.shared-entries" },
  { key: "tools", label: t("nav.tools"), to: "/tools", icon: Wrench },
  { key: "subscription", label: t("nav.subscription"), to: "/subscription", icon: CreditCard },
  { key: "personalData", label: t("nav.personalData"), to: "/settings/profile", icon: User },
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

const showProfileModal = ref(false);

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
    if (shouldShow && !_isProfileModalDismissed.value) {
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
</script>

<template>
  <div class="app-root">
    <EmailConfirmationBanner />
    <BillingStatusBanner />
    <UiAppShell
    :nav-items="NAV_ITEMS"
    :user="user"
    :page-title="pageTitle"
    :page-subtitle="pageSubtitle"
    @user-logout="onLogout"
  >
    <slot />
    <ProfileCompletionModal
      :open="showProfileModal"
      @close="onProfileModalClose()"
      @saved="showProfileModal = false"
    />
  </UiAppShell>
  </div>
</template>
