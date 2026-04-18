<script setup lang="ts">
import { computed } from "vue";
import { PieChart } from "lucide-vue-next";
import { useRoute } from "vue-router";
import { useSidebarState } from "~/composables/useSidebarState";
import { useResponsiveShell } from "~/composables/useResponsiveShell";
import UiSidebarNav from "../UiSidebarNav/UiSidebarNav.vue";
import UiTopbar from "../UiTopbar/UiTopbar.vue";
import type { UiAppShellProps, UiAppShellEmits } from "./UiAppShell.types";

withDefaults(defineProps<UiAppShellProps>(), {
  pageSubtitle: undefined,
  topbarActions: () => [],
});

const emit = defineEmits<UiAppShellEmits>();

const route = useRoute();
const { isCollapsed } = useSidebarState();
const { isMobile, isDrawerOpen, openDrawer, closeDrawer } =
  useResponsiveShell();

const currentRoute = computed(() => route.path);
</script>

<template>
  <div class="ui-app-shell">
    <!-- Overlay mobile -->
    <Transition name="ui-app-shell-overlay">
      <div
        v-if="isMobile && isDrawerOpen"
        class="ui-app-shell__overlay"
        aria-hidden="true"
        @click="closeDrawer"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      class="ui-app-shell__sidebar"
      :class="{
        'ui-app-shell__sidebar--collapsed': isCollapsed && !isMobile,
        'ui-app-shell__sidebar--drawer': isMobile,
        'ui-app-shell__sidebar--drawer-open': isMobile && isDrawerOpen,
      }"
      aria-label="Navegação principal"
    >
      <!-- Logo -->
      <div class="ui-app-shell__logo">
        <div class="ui-app-shell__logo-mark" aria-hidden="true">
          <PieChart :size="16" />
        </div>
        <span v-if="!isCollapsed" class="ui-app-shell__logo-text"
          >Auraxis</span
        >
      </div>

      <!-- Nav -->
      <UiSidebarNav
        :items="navItems"
        :collapsed="isCollapsed && !isMobile"
        :current-route="currentRoute"
        class="ui-app-shell__nav"
      />
    </aside>

    <!-- Main area -->
    <div class="ui-app-shell__main">
      <UiTopbar
        :title="pageTitle"
        :subtitle="pageSubtitle"
        :actions="topbarActions"
        :user-name="user.name"
        :user-description="user.description"
        :user-avatar-url="user.avatarUrl"
        :show-menu-button="isMobile"
        @action="(key) => emit('topbar-action', key)"
        @user-settings="emit('user-settings')"
        @user-logout="emit('user-logout')"
        @menu-toggle="openDrawer"
      />

      <main class="ui-app-shell__content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.ui-app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg-base);
  position: relative;
}

/* Sidebar */
.ui-app-shell__sidebar {
  width: 256px;
  flex-shrink: 0;
  height: 100vh;
  background: var(--color-bg-surface);
  border-right: 1px solid var(--color-outline-soft);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  overflow: hidden;
}

.ui-app-shell__sidebar--collapsed {
  width: 72px;
}

/* Mobile: sidebar é drawer */
.ui-app-shell__sidebar--drawer {
  position: fixed;
  left: -256px;
  top: 0;
  z-index: 200;
  transition: left 0.25s ease;
}

.ui-app-shell__sidebar--drawer-open {
  left: 0;
}

/* Logo */
.ui-app-shell__logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 80px;
  padding: 0 var(--space-3);
  border-bottom: 1px solid var(--color-outline-soft);
  flex-shrink: 0;
}

.ui-app-shell__logo-mark {
  width: 32px;
  height: 32px;
  background: linear-gradient(145deg, var(--accent-cyan, #44d4ff), var(--accent-violet, #8b7dff));
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-bg-base);
  flex-shrink: 0;
  box-shadow: 0 0 12px rgba(68, 212, 255, 0.2);
}

.ui-app-shell__logo-text {
  font-family: var(--font-heading);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  white-space: nowrap;
}

/* Nav */
.ui-app-shell__nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Overlay */
.ui-app-shell__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 199;
}

.ui-app-shell-overlay-enter-active,
.ui-app-shell-overlay-leave-active {
  transition: opacity 0.2s ease;
}

.ui-app-shell-overlay-enter-from,
.ui-app-shell-overlay-leave-to {
  opacity: 0;
}

/* Main */
.ui-app-shell__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.ui-app-shell__content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3) var(--space-4);
}
</style>
