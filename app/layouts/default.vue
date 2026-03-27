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
} from "lucide-vue-next";
// UiAppShell is auto-imported via the components config in nuxt.config.ts
// (app/shared/components is registered as a scan directory).
import type { AppShellNavItem, AppShellUser } from "~/shared/components/UiAppShell/UiAppShell.types";
import ProfileCompletionModal from "~/features/profile/components/ProfileCompletionModal/ProfileCompletionModal.vue";
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
]);

const user = computed<AppShellUser>(() => ({
  name: userStore.profile?.name || sessionStore.userEmail || t("user.fallbackName"),
  description: t("user.accountDescription"),
  avatarUrl: undefined,
}));

const pageTitle = computed(() => (route.meta.pageTitle as string | undefined) ?? "Auraxis");
const pageSubtitle = computed(() => route.meta.pageSubtitle as string | undefined);

const showProfileModal = ref(false);

watch(
  () => userStore.isLoaded && !userStore.isProfileComplete,
  (shouldShow) => {
    if (shouldShow) {
      showProfileModal.value = true;
    }
  },
  { immediate: true },
);

/** Signs out the current user and redirects to login. */
function onLogout(): void {
  sessionStore.signOut();
  router.push("/login");
}
</script>

<template>
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
      @close="showProfileModal = false"
      @saved="showProfileModal = false"
    />
  </UiAppShell>
</template>
