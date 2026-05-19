<script setup lang="ts">
import {
  Activity,
  ArrowLeft,
  BadgeCheck,
  Eye,
  Flag,
  LogOut,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-vue-next";
import { useLogout } from "~/composables/useLogout";
import AdminImpersonationBanner from "~/features/admin/impersonation/components/AdminImpersonationBanner.vue";
import { useUserProfileQuery } from "~/features/profile/composables/use-user-profile-query";
import { useSessionStore } from "~/stores/session";
import { useUserStore } from "~/stores/user";

const route = useRoute();
const sessionStore = useSessionStore();
const userStore = useUserStore();
const { logout } = useLogout();

useUserProfileQuery();

const navItems = [
  { key: "overview", label: "Visão geral", to: "/admin", icon: Activity, disabled: false },
  { key: "users", label: "Usuários", to: "/admin/users", icon: Users, disabled: false },
  { key: "insights", label: "Insights IA", to: "/admin/insights", icon: Sparkles, disabled: false },
  { key: "flags", label: "Feature flags", to: "/admin/flags", icon: Flag, disabled: false },
  { key: "impersonation", label: "Impersonação", to: "/admin/impersonation", icon: Eye, disabled: false },
] as const;

const adminName = computed(() => userStore.profile?.name || sessionStore.userEmail || "Admin");
const adminEmail = computed(() => userStore.profile?.email || sessionStore.userEmail || "Sessão admin");
const pageTitle = computed(() => (route.meta.pageTitle as string | undefined) ?? "Admin Auraxis");
const pageSubtitle = computed(() => route.meta.pageSubtitle as string | undefined);

/** Signs out from the admin shell using the shared logout flow. */
const onLogout = (): void => {
  logout();
};
</script>

<template>
  <div class="admin-layout">
    <AdminImpersonationBanner />
    <aside class="admin-layout__sidebar">
      <NuxtLink class="admin-layout__brand" to="/admin">
        <span class="admin-layout__brand-mark" aria-hidden="true">
          <ShieldCheck :size="18" />
        </span>
        <span>
          <strong>Admin Auraxis</strong>
          <small>Operações seguras</small>
        </span>
      </NuxtLink>

      <nav class="admin-layout__nav" aria-label="Navegação administrativa">
        <NuxtLink
          v-for="item in navItems"
          :key="item.key"
          class="admin-layout__nav-item"
          :class="{
            'admin-layout__nav-item--active': route.path === item.to,
            'admin-layout__nav-item--disabled': item.disabled,
          }"
          :to="item.disabled ? route.path : item.to"
          :aria-disabled="item.disabled ? 'true' : undefined"
        >
          <component :is="item.icon" :size="18" aria-hidden="true" />
          <span>{{ item.label }}</span>
          <small v-if="item.disabled">Em breve</small>
        </NuxtLink>
      </nav>

      <div class="admin-layout__sidebar-footer">
        <NuxtLink class="admin-layout__back-link" to="/dashboard">
          <ArrowLeft :size="16" aria-hidden="true" />
          Voltar ao app
        </NuxtLink>
      </div>
    </aside>

    <div class="admin-layout__main">
      <header class="admin-layout__topbar">
        <div class="admin-layout__title-block">
          <p class="admin-layout__eyebrow">
            <BadgeCheck :size="14" aria-hidden="true" />
            Área restrita
          </p>
          <h1>{{ pageTitle }}</h1>
          <p v-if="pageSubtitle">{{ pageSubtitle }}</p>
        </div>

        <div class="admin-layout__actions">
          <button class="admin-layout__search" type="button" disabled>
            <Search :size="16" aria-hidden="true" />
            Buscar em breve
          </button>
          <div class="admin-layout__identity">
            <span>{{ adminName }}</span>
            <small>{{ adminEmail }}</small>
          </div>
          <button class="admin-layout__logout" type="button" @click="onLogout">
            <LogOut :size="16" aria-hidden="true" />
            Sair
          </button>
        </div>
      </header>

      <main class="admin-layout__content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  box-sizing: border-box;
  width: 100%;
  max-width: 100vw;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  overflow-x: hidden;
  background: var(--color-bg-base);
  color: var(--color-text-primary);
}

.admin-layout :deep(.admin-impersonation-banner) {
  grid-column: 1 / -1;
}

.admin-layout *,
.admin-layout *::before,
.admin-layout *::after {
  box-sizing: border-box;
}

.admin-layout__sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  background:
    linear-gradient(180deg, var(--color-bg-surface) 0%, var(--color-bg-elevated) 100%);
  border-right: 1px solid var(--color-outline-soft);
}

.admin-layout__brand,
.admin-layout__back-link,
.admin-layout__nav-item {
  text-decoration: none;
}

.admin-layout__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-primary);
}

.admin-layout__brand-mark {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--color-text-on-brand);
  background: var(--gradient-brand);
  box-shadow: var(--shadow-brand-glow-sm);
}

.admin-layout__brand strong,
.admin-layout__identity span {
  display: block;
  font-weight: var(--font-weight-bold);
}

.admin-layout__brand small,
.admin-layout__identity small {
  display: block;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.admin-layout__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.admin-layout__nav-item {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px var(--space-2);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  border: 1px solid transparent;
}

.admin-layout__nav-item--active {
  color: var(--color-brand-700);
  background: var(--color-brand-glow-xs);
  border-color: var(--color-brand-200);
}

.admin-layout__nav-item--disabled {
  opacity: 0.68;
  cursor: not-allowed;
}

.admin-layout__nav-item small {
  margin-left: auto;
  font-size: var(--font-size-xs);
  color: var(--color-text-subtle);
}

.admin-layout__sidebar-footer {
  margin-top: auto;
}

.admin-layout__back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.admin-layout__main {
  min-width: 0;
  max-width: 100%;
  display: flex;
  flex-direction: column;
}

.admin-layout__topbar {
  min-width: 0;
  max-width: 100%;
  min-height: 96px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--color-outline-soft);
  background: var(--color-bg-surface);
}

.admin-layout__title-block {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.admin-layout__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: var(--color-brand-700);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.admin-layout__title-block h1 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-2xl);
  overflow-wrap: anywhere;
}

.admin-layout__title-block p {
  margin: 0;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}

.admin-layout__actions {
  min-width: 0;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.admin-layout__search,
.admin-layout__logout {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  border-radius: var(--radius-full);
  padding: 0 var(--space-2);
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.admin-layout__search {
  color: var(--color-text-muted);
}

.admin-layout__identity {
  min-width: 160px;
  max-width: 100%;
}

.admin-layout__content {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  padding: var(--space-5);
  overflow: auto;
}

@media (max-width: 920px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }

  .admin-layout__main {
    width: 100vw;
    max-width: 100vw;
    overflow-x: hidden;
  }

  .admin-layout__sidebar {
    position: static;
    border-right: 0;
    border-bottom: 1px solid var(--color-outline-soft);
  }

  .admin-layout__nav {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: var(--space-1);
  }

  .admin-layout__nav-item {
    flex: 0 0 auto;
  }

  .admin-layout__sidebar-footer {
    display: none;
  }

  .admin-layout__topbar {
    width: 100%;
    max-width: 100%;
    align-items: flex-start;
    flex-direction: column;
    padding: var(--space-3);
    overflow-x: hidden;
  }

  .admin-layout__actions {
    width: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    justify-content: flex-start;
  }

  .admin-layout__search,
  .admin-layout__logout,
  .admin-layout__identity {
    width: 100%;
    min-width: 0;
  }

  .admin-layout__content {
    width: 100%;
    max-width: 100%;
    padding: var(--space-3);
    overflow-x: hidden;
  }
}
</style>
