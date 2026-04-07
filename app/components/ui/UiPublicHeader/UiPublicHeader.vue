<script setup lang="ts">
import { useSessionStore } from "~/stores/session";
import type { UiPublicHeaderProps } from "./UiPublicHeader.types";

const props = withDefaults(defineProps<UiPublicHeaderProps>(), {
  authenticated: undefined,
});

const { t } = useI18n();
const sessionStore = useSessionStore();

/** Whether the current visitor has an active session. */
const isAuthenticated = computed<boolean>(() =>
  props.authenticated !== undefined ? props.authenticated : sessionStore.isAuthenticated,
);

const menuOpen = ref(false);

/** Toggles the mobile navigation drawer. */
const toggleMenu = (): void => {
  menuOpen.value = !menuOpen.value;
};

/** Closes the mobile menu (e.g. after navigating). */
const closeMenu = (): void => {
  menuOpen.value = false;
};
</script>

<template>
  <header class="ui-public-header">
    <div class="ui-public-header__container">
      <!-- Brand -->
      <NuxtLink
        to="/"
        class="ui-public-header__brand"
        :aria-label="t('components.publicHeader.brand')"
        @click="closeMenu"
      >
        {{ t('components.publicHeader.brand') }}
      </NuxtLink>

      <!-- Desktop navigation -->
      <nav
        class="ui-public-header__nav"
        :aria-label="t('components.publicHeader.navAriaLabel')"
      >
        <NuxtLink
          to="/tools"
          class="ui-public-header__nav-link"
          active-class="ui-public-header__nav-link--active"
        >
          {{ t('components.publicHeader.nav.tools') }}
        </NuxtLink>
        <NuxtLink
          to="/plans"
          class="ui-public-header__nav-link"
          active-class="ui-public-header__nav-link--active"
        >
          {{ t('components.publicHeader.nav.plans') }}
        </NuxtLink>
      </nav>

      <!-- Desktop CTAs -->
      <div class="ui-public-header__actions">
        <template v-if="isAuthenticated">
          <NuxtLink to="/dashboard" class="ui-public-header__btn ui-public-header__btn--ghost">
            {{ t('components.publicHeader.cta.dashboard') }}
          </NuxtLink>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="ui-public-header__btn ui-public-header__btn--ghost">
            {{ t('components.publicHeader.cta.login') }}
          </NuxtLink>
          <NuxtLink to="/register" class="ui-public-header__btn ui-public-header__btn--primary">
            {{ t('components.publicHeader.cta.register') }}
          </NuxtLink>
        </template>
      </div>

      <!-- Mobile hamburger -->
      <button
        class="ui-public-header__hamburger"
        type="button"
        :aria-expanded="menuOpen"
        :aria-label="menuOpen
          ? t('components.publicHeader.mobileMenuCloseAriaLabel')
          : t('components.publicHeader.mobileMenuAriaLabel')"
        @click="toggleMenu"
      >
        <span class="ui-public-header__hamburger-bar" />
        <span class="ui-public-header__hamburger-bar" />
        <span class="ui-public-header__hamburger-bar" />
      </button>
    </div>

    <!-- Mobile drawer -->
    <div
      v-if="menuOpen"
      class="ui-public-header__mobile-menu"
      role="dialog"
      :aria-label="t('components.publicHeader.mobileMenuAriaLabel')"
    >
      <nav class="ui-public-header__mobile-nav" :aria-label="t('components.publicHeader.navAriaLabel')">
        <NuxtLink
          to="/tools"
          class="ui-public-header__mobile-link"
          active-class="ui-public-header__mobile-link--active"
          @click="closeMenu"
        >
          {{ t('components.publicHeader.nav.tools') }}
        </NuxtLink>
        <NuxtLink
          to="/plans"
          class="ui-public-header__mobile-link"
          active-class="ui-public-header__mobile-link--active"
          @click="closeMenu"
        >
          {{ t('components.publicHeader.nav.plans') }}
        </NuxtLink>
      </nav>

      <div class="ui-public-header__mobile-actions">
        <template v-if="isAuthenticated">
          <NuxtLink
            to="/dashboard"
            class="ui-public-header__btn ui-public-header__btn--primary ui-public-header__btn--full"
            @click="closeMenu"
          >
            {{ t('components.publicHeader.cta.dashboard') }}
          </NuxtLink>
        </template>
        <template v-else>
          <NuxtLink
            to="/login"
            class="ui-public-header__btn ui-public-header__btn--ghost ui-public-header__btn--full"
            @click="closeMenu"
          >
            {{ t('components.publicHeader.cta.login') }}
          </NuxtLink>
          <NuxtLink
            to="/register"
            class="ui-public-header__btn ui-public-header__btn--primary ui-public-header__btn--full"
            @click="closeMenu"
          >
            {{ t('components.publicHeader.cta.register') }}
          </NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.ui-public-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: color-mix(in srgb, var(--color-bg-base) 92%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-outline-soft);
}

.ui-public-header__container {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: var(--space-4);
  padding-block: var(--space-3);
}

/* ── Brand ─────────────────────────────────────────────────────────────────── */
.ui-public-header__brand {
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  text-decoration: none;
  flex-shrink: 0;
}

.ui-public-header__brand:hover {
  color: var(--color-brand-500);
}

/* ── Desktop nav ────────────────────────────────────────────────────────────── */
.ui-public-header__nav {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex: 1;
}

.ui-public-header__nav-link {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  transition: color 0.15s ease, background 0.15s ease;
}

.ui-public-header__nav-link:hover,
.ui-public-header__nav-link:focus-visible {
  color: var(--color-text-primary);
  background: var(--color-neutral-100);
  outline: none;
}

.ui-public-header__nav-link--active {
  color: var(--color-brand-600);
  font-weight: var(--font-weight-semibold);
}

/* ── CTA buttons ────────────────────────────────────────────────────────────── */
.ui-public-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

.ui-public-header__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--space-1) + 2px) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
  cursor: pointer;
  border: none;
}

.ui-public-header__btn--ghost {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid transparent;
}

.ui-public-header__btn--ghost:hover {
  color: var(--color-text-primary);
  background: var(--color-neutral-100);
}

.ui-public-header__btn--primary {
  background: var(--color-brand-500);
  /* #1a0700 on #ffbe4d → ~11.9:1 contrast, WCAG 2.1 AA ✓ */
  color: #1a0700;
}

.ui-public-header__btn--primary:hover {
  background: var(--color-brand-600, #e6a800);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--color-brand-500) 40%, transparent);
}

.ui-public-header__btn--full {
  width: 100%;
}

/* ── Hamburger ──────────────────────────────────────────────────────────────── */
.ui-public-header__hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  padding: var(--space-1);
  background: transparent;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: auto;
}

.ui-public-header__hamburger-bar {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--color-text-primary);
  border-radius: var(--radius-sm);
  transition: background 0.15s ease;
}

/* ── Mobile menu ────────────────────────────────────────────────────────────── */
.ui-public-header__mobile-menu {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4) var(--space-4);
  border-top: 1px solid var(--color-outline-soft);
  background: var(--color-bg-base);
}

.ui-public-header__mobile-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.ui-public-header__mobile-link {
  display: block;
  padding: var(--space-2) var(--space-2);
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  transition: color 0.15s ease, background 0.15s ease;
}

.ui-public-header__mobile-link:hover {
  color: var(--color-text-primary);
  background: var(--color-neutral-100);
}

.ui-public-header__mobile-link--active {
  color: var(--color-brand-600);
  font-weight: var(--font-weight-semibold);
}

.ui-public-header__mobile-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .ui-public-header__nav,
  .ui-public-header__actions {
    display: none;
  }

  .ui-public-header__hamburger {
    display: flex;
  }
}
</style>
