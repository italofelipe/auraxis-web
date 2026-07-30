<script setup lang="ts">
import { computed, watch } from "vue";
import { PanelLeftClose, PanelLeftOpen, PieChart, X } from "lucide-vue-next";
import { useRoute } from "vue-router";
import { useSidebarState } from "~/composables/useSidebarState";
import { useResponsiveShell } from "~/composables/useResponsiveShell";
import { useOverlayKeyboard } from "~/composables/useOverlayKeyboard/useOverlayKeyboard";
import UiSidebarNav from "../UiSidebarNav/UiSidebarNav.vue";
import UiTopbar from "../UiTopbar/UiTopbar.vue";
import type { UiAppShellProps, UiAppShellEmits } from "./UiAppShell.types";

withDefaults(defineProps<UiAppShellProps>(), {
  pageSubtitle: undefined,
  topbarActions: () => [],
});

const emit = defineEmits<UiAppShellEmits>();

const route = useRoute();
const { isCollapsed, toggle } = useSidebarState();
const { isMobile, isDrawerOpen, openDrawer, closeDrawer } =
  useResponsiveShell();

const currentRoute = computed(() => route.path);

// No mobile a sidebar é drawer: recolher não faz sentido ali, e o estado
// persistido não pode vazar para esse modo.
const isRailCollapsed = computed(() => isCollapsed.value && !isMobile.value);
const toggleLabel = computed(() =>
  isRailCollapsed.value ? "Expandir menu lateral" : "Recolher menu lateral",
);

// O drawer mobile fechava só por clique no overlay — inalcançável por teclado.
// Esc agora fecha; o backdrop segue aria-hidden, porque backdrop não é botão.
useOverlayKeyboard({
  isOpen: (): boolean => isMobile.value && isDrawerOpen.value,
  onClose: closeDrawer,
});

// Close the mobile navigation drawer whenever the route changes so that
// selecting a destination from the hamburger menu dismisses the drawer.
watch(
  () => route.path,
  () => {
    closeDrawer();
  },
);
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
        'ui-app-shell__sidebar--collapsed': isRailCollapsed,
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
        <span v-if="!isRailCollapsed" class="ui-app-shell__logo-text">Auraxis</span>

        <button
          v-if="!isMobile"
          type="button"
          class="ui-app-shell__toggle"
          :aria-label="toggleLabel"
          :aria-expanded="!isRailCollapsed"
          aria-controls="ui-app-shell-nav"
          @click="toggle"
        >
          <PanelLeftOpen v-if="isRailCollapsed" :size="16" aria-hidden="true" />
          <PanelLeftClose v-else :size="16" aria-hidden="true" />
        </button>

        <button
          v-if="isMobile && isDrawerOpen"
          type="button"
          class="ui-app-shell__toggle"
          aria-label="Fechar menu"
          @click="closeDrawer"
        >
          <X :size="16" aria-hidden="true" />
        </button>
      </div>

      <!-- Nav -->
      <UiSidebarNav
        id="ui-app-shell-nav"
        :items="navItems"
        :collapsed="isRailCollapsed"
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
        @user-onboarding="emit('user-onboarding')"
        @user-logout="emit('user-logout')"
        @menu-toggle="openDrawer"
      >
        <template #extras>
          <slot name="topbar-extras" />
        </template>
      </UiTopbar>

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
  /*
   * 256px cortava "Lançamentos Compartilhados" por 13px — o único rótulo que
   * não cabia. 272px acomoda com folga.
   *
   * O deslocamento do drawer deriva da mesma variável: quando a largura era
   * repetida como literal nos dois lugares, mudar uma sem a outra deixava a
   * gaveta fechada com uma faixa visível na borda da tela.
   */
  --sidebar-width: 272px;
  --sidebar-width-collapsed: 72px;

  width: var(--sidebar-width);
  flex-shrink: 0;
  height: 100vh;
  background: var(--color-bg-surface);
  border-right: 1px solid var(--color-outline-soft);
  display: flex;
  flex-direction: column;
  /* Token em vez de duração solta: sob prefers-reduced-motion ele zera e a
     largura passa a mudar de uma vez, sem varredura na tela. */
  transition: width var(--motion-standard);
  overflow: hidden;
}

.ui-app-shell__sidebar--collapsed {
  width: var(--sidebar-width-collapsed);
}

/* Mobile: sidebar é drawer */
.ui-app-shell__sidebar--drawer {
  position: fixed;
  left: calc(var(--sidebar-width) * -1);
  top: 0;
  z-index: 200;
  transition: left var(--motion-standard);
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

/*
 * Recolhida sobram 48px de conteúdo — não cabem a marca (32px) e o botão (28px)
 * lado a lado, e o `overflow: hidden` do aside apenas esconderia o excesso.
 * Empilhar mantém os dois inteiros dentro dos 80px de altura do cabeçalho.
 */
.ui-app-shell__sidebar--collapsed .ui-app-shell__logo {
  flex-direction: column;
  justify-content: center;
  gap: var(--space-1);
  padding: 0;
}

/* Toggle de recolher/expandir */
.ui-app-shell__toggle {
  display: flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: auto;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background var(--motion-fast),
    color var(--motion-fast);
}

.ui-app-shell__sidebar--collapsed .ui-app-shell__toggle {
  margin-left: 0;
}

.ui-app-shell__toggle:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
}

.ui-app-shell__toggle:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 1px;
}

.ui-app-shell__logo-mark {
  width: 32px;
  height: 32px;
  background: var(--gradient-brand);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-on-brand);
  flex-shrink: 0;
  box-shadow: var(--shadow-brand-glow-sm);
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
  background: var(--color-overlay-scrim);
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
