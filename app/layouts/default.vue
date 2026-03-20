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

const route = useRoute();
const router = useRouter();
const sessionStore = useSessionStore();

const NAV_ITEMS: AppShellNavItem[] = [
  { key: "dashboard", label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { key: "carteira", label: "Carteira", to: "/carteira", icon: Briefcase },
  { key: "metas", label: "Metas", to: "/metas", icon: Target },
  { key: "alertas", label: "Alertas", to: "/alertas", icon: Bell },
  { key: "simulacoes", label: "Simulações", to: "/simulacoes", icon: Calculator },
  { key: "compartilhamentos", label: "Compartilhamentos", to: "/compartilhamentos", icon: Share2 },
  { key: "tools", label: "Ferramentas", to: "/tools", icon: Wrench },
  { key: "assinatura", label: "Assinatura", to: "/assinatura", icon: CreditCard },
];

const user = computed<AppShellUser>(() => ({
  name: sessionStore.userEmail ?? "Usuário",
  description: "Conta pessoal",
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
