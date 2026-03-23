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
import type { AppShellNavItem, AppShellUser } from "~/shared/components/UiAppShell/UiAppShell.types";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const sessionStore = useSessionStore();

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
  name: sessionStore.userEmail ?? t("user.fallbackName"),
  description: t("user.accountDescription"),
}));

const pageTitle = computed(() => (route.meta.pageTitle as string | undefined) ?? "Auraxis");
const pageSubtitle = computed(() => route.meta.pageSubtitle as string | undefined);

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
  </UiAppShell>
</template>
