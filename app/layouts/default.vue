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
} from "lucide-vue-next";
// UiAppShell and ProfileCompletionModal are auto-imported from app/components/.
import type { AppShellNavItem, AppShellUser } from "~/components/ui/UiAppShell/UiAppShell.types";
import { useUserProfileQuery } from "~/features/profile/composables/use-user-profile-query";
import { useUserStore } from "~/stores/user";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const sessionStore = useSessionStore();
const userStore = useUserStore();

useUserProfileQuery();

const NAV_ITEMS = computed<AppShellNavItem[]>(() => [
  { key: "dashboard", label: t("nav.dashboard"), to: "/dashboard", icon: LayoutDashboard },
  { key: "portfolio", label: t("nav.portfolio"), to: "/portfolio", icon: Briefcase },
  { key: "goals", label: t("nav.goals"), to: "/goals", icon: Target },
  { key: "alerts", label: t("nav.alerts"), to: "/alerts", icon: Bell },
  { key: "simulations", label: t("nav.simulations"), to: "/simulations", icon: Calculator },
  { key: "sharedEntries", label: t("nav.sharedEntries"), to: "/shared-entries", icon: Share2 },
  { key: "tools", label: t("nav.tools"), to: "/tools", icon: Wrench },
  { key: "subscription", label: t("nav.subscription"), to: "/subscription", icon: CreditCard },
  { key: "personalData", label: t("nav.personalData"), to: "/settings/profile", icon: User },
]);

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

/** Signs out the current user and redirects to login. */
function onLogout(): void {
  sessionStore.signOut();
  router.push("/login");
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
