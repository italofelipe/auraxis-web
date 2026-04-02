<script setup lang="ts">
import { computed } from "vue";
import { PieChart, Menu, X } from "lucide-vue-next";
import { useRoute } from "vue-router";
import { useSidebarState } from "~/composables/useSidebarState";
import { useResponsiveShell } from "~/composables/useResponsiveShell";
import UiSidebarNav from "../UiSidebarNav/UiSidebarNav.vue";
import type { UiToolsShellProps } from "./UiToolsShell.types";

/**
 * Layout shell for the tools suite (Finance Hub).
 *
 * Renders a two-column layout: a collapsible sidebar on the left and a
 * scrollable main content area on the right. No user topbar is included
 * because the tools area is accessible regardless of full authentication.
 *
 * Slots:
 * - `default` — main content area
 * - `sidebar-footer` — optional block at the bottom of the sidebar,
 *    typically used for an upgrade/upsell prompt
 */

withDefaults(defineProps<UiToolsShellProps>(), {
  navItems: () => [],
});

const route = useRoute();
const { isCollapsed, toggle } = useSidebarState();
const { isMobile, isDrawerOpen, openDrawer, closeDrawer } = useResponsiveShell();

/** The active route path for highlighting the current nav item. */
const currentRoute = computed(() => route.path);
</script>

<template>
  <div class="ui-tools-shell">
    <!-- Mobile overlay -->
    <Transition name="ui-tools-shell-overlay">
      <div
        v-if="isMobile && isDrawerOpen"
        class="ui-tools-shell__overlay"
        aria-hidden="true"
        @click="closeDrawer"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      class="ui-tools-shell__sidebar"
      :class="{
        'ui-tools-shell__sidebar--collapsed': isCollapsed && !isMobile,
        'ui-tools-shell__sidebar--drawer': isMobile,
        'ui-tools-shell__sidebar--drawer-open': isMobile && isDrawerOpen,
      }"
      aria-label="Navegação de ferramentas"
    >
      <!-- Sidebar header: logo + toggle -->
      <div class="ui-tools-shell__logo">
        <div class="ui-tools-shell__logo-mark" aria-hidden="true">
          <PieChart :size="16" />
        </div>
        <span v-if="!isCollapsed || isMobile" class="ui-tools-shell__logo-text">
          Auraxis
        </span>

        <!-- Desktop collapse toggle -->
        <button
          v-if="!isMobile"
          class="ui-tools-shell__toggle"
          :aria-label="isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'"
          @click="toggle"
        >
          <Menu v-if="isCollapsed" :size="16" aria-hidden="true" />
          <X v-else :size="16" aria-hidden="true" />
        </button>

        <!-- Mobile close button -->
        <button
          v-if="isMobile && isDrawerOpen"
          class="ui-tools-shell__toggle"
          aria-label="Fechar menu"
          @click="closeDrawer"
        >
          <X :size="16" aria-hidden="true" />
        </button>
      </div>

      <!-- Nav -->
      <UiSidebarNav
        :items="navItems"
        :collapsed="isCollapsed && !isMobile"
        :current-route="currentRoute"
        class="ui-tools-shell__nav"
      />

      <!-- Sidebar footer (e.g. upgrade prompt) -->
      <div v-if="$slots['sidebar-footer']" class="ui-tools-shell__sidebar-footer">
        <slot name="sidebar-footer" />
      </div>
    </aside>

    <!-- Main content area -->
    <div class="ui-tools-shell__main">
      <!-- Mobile topbar with menu toggle -->
      <div v-if="isMobile" class="ui-tools-shell__mobile-bar">
        <button
          class="ui-tools-shell__toggle"
          aria-label="Abrir menu"
          @click="openDrawer"
        >
          <Menu :size="20" aria-hidden="true" />
        </button>
        <span class="ui-tools-shell__mobile-brand">Auraxis</span>
      </div>

      <main class="ui-tools-shell__content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ── Root ──────────────────────────────────────────────────────── */
.ui-tools-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg-base);
  position: relative;
}

/* ── Sidebar ───────────────────────────────────────────────────── */
.ui-tools-shell__sidebar {
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

.ui-tools-shell__sidebar--collapsed {
  width: 72px;
}

/* Mobile: sidebar becomes a drawer */
.ui-tools-shell__sidebar--drawer {
  position: fixed;
  left: -256px;
  top: 0;
  z-index: 200;
  transition: left 0.25s ease;
}

.ui-tools-shell__sidebar--drawer-open {
  left: 0;
}

/* ── Logo / header ─────────────────────────────────────────────── */
.ui-tools-shell__logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 64px;
  padding: 0 var(--space-3);
  border-bottom: 1px solid var(--color-outline-soft);
  flex-shrink: 0;
}

.ui-tools-shell__logo-mark {
  width: 32px;
  height: 32px;
  background: var(--color-brand-600);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-bg-base);
  flex-shrink: 0;
  box-shadow: var(--shadow-brand-glow-sm);
}

.ui-tools-shell__logo-text {
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  white-space: nowrap;
  flex: 1;
}

/* ── Collapse toggle ───────────────────────────────────────────── */
.ui-tools-shell__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;
}

.ui-tools-shell__toggle:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

/* ── Nav ───────────────────────────────────────────────────────── */
.ui-tools-shell__nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ── Sidebar footer ────────────────────────────────────────────── */
.ui-tools-shell__sidebar-footer {
  flex-shrink: 0;
  border-top: 1px solid var(--color-outline-soft);
  padding: var(--space-3);
}

/* ── Overlay (mobile) ──────────────────────────────────────────── */
.ui-tools-shell__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 199;
}

.ui-tools-shell-overlay-enter-active,
.ui-tools-shell-overlay-leave-active {
  transition: opacity 0.2s ease;
}

.ui-tools-shell-overlay-enter-from,
.ui-tools-shell-overlay-leave-to {
  opacity: 0;
}

/* ── Main ──────────────────────────────────────────────────────── */
.ui-tools-shell__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* ── Mobile topbar ─────────────────────────────────────────────── */
.ui-tools-shell__mobile-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 56px;
  padding: 0 var(--space-4);
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-outline-soft);
  flex-shrink: 0;
}

.ui-tools-shell__mobile-brand {
  font-family: var(--font-heading);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

/* ── Content ───────────────────────────────────────────────────── */
.ui-tools-shell__content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
}
</style>
