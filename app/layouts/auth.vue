<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "#app";

import LoginSummaryBar from "~/components/auth/LoginSummaryBar/LoginSummaryBar.vue";

const { t } = useI18n();
const route = useRoute();

/** A barra-resumo financeira é exclusiva da tela de login. */
const isLogin = computed<boolean>(() => route.path.startsWith("/login"));
</script>

<template>
  <div class="auth-shell">
    <!-- Topbar -->
    <header class="auth-shell__topbar">
      <NuxtLink to="/" class="auth-shell__logo">
        <span class="auth-shell__logo-mark" aria-hidden="true">A</span>
        <span class="auth-shell__logo-name">Auraxis</span>
      </NuxtLink>
      <nav class="auth-shell__nav" :aria-label="$t('authBrandPanel.ariaLabel')">
        <NuxtLink to="/login" class="auth-shell__nav-btn">
          {{ t("auth.topbar.signIn") }}
        </NuxtLink>
        <NuxtLink to="/register" class="auth-shell__nav-btn auth-shell__nav-btn--primary">
          {{ t("auth.topbar.createAccount") }}
        </NuxtLink>
      </nav>
    </header>

    <!-- Centered block: hero (left) + form (right) -->
    <div class="auth-shell__center">
      <div class="auth-shell__row">
        <div class="auth-shell__hero">
          <AuthBrandPanel />
        </div>
        <main class="auth-shell__form" role="main">
          <div class="auth-shell__form-inner">
            <slot />
          </div>
        </main>
      </div>

      <LoginSummaryBar v-if="isLogin" class="auth-shell__summary" />
    </div>

    <!-- Footer -->
    <footer class="auth-shell__footer">
      <span>{{ t("auth.footer.copyright") }}</span>
      <span class="auth-shell__footer-links">
        <NuxtLink to="/blog">{{ t("auth.footer.blog") }}</NuxtLink>
        <NuxtLink to="/privacy">{{ t("auth.footer.privacy") }}</NuxtLink>
        <NuxtLink to="/terms">{{ t("auth.footer.terms") }}</NuxtLink>
        <NuxtLink to="/cookies">{{ t("auth.footer.cookies") }}</NuxtLink>
      </span>
    </footer>
  </div>
</template>

<style scoped>
.auth-shell {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  --auth-grid-line: color-mix(in srgb, var(--color-text-primary) 3.5%, transparent);
  background:
    linear-gradient(var(--auth-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--auth-grid-line) 1px, transparent 1px),
    linear-gradient(135deg, var(--color-brand-glow-2xs), transparent 34%),
    linear-gradient(315deg, var(--color-brand-glow-xs), transparent 32%),
    var(--color-bg-base);
  background-size: 36px 36px, 36px 36px, auto, auto, auto;
  color: var(--color-text-primary);
}

/* Topbar */
.auth-shell__topbar {
  flex: none;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(var(--space-4), 4vw, var(--space-9));
}

.auth-shell__logo {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  text-decoration: none;
  color: inherit;
}

.auth-shell__logo-mark {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--color-brand-500), var(--color-accent));
  color: var(--color-text-on-brand);
  font-weight: var(--font-weight-extrabold);
  font-size: var(--font-size-lg);
}

.auth-shell__logo-name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

.auth-shell__nav {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.auth-shell__nav-btn {
  display: inline-flex;
  align-items: center;
  height: 42px;
  padding: 0 22px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  transition: filter 160ms ease, transform 160ms ease;
}

.auth-shell__nav-btn--primary {
  border: none;
  padding: 0 24px;
  background: linear-gradient(135deg, var(--color-brand-600, #12a37d), var(--color-brand-700, #0c7c84));
  color: var(--color-text-on-brand);
}

.auth-shell__nav-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.03);
}

/* Centered block */
.auth-shell__center {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 clamp(var(--space-4), 4vw, var(--space-9));
}

.auth-shell__row {
  width: 100%;
  max-width: 1180px;
  display: flex;
  gap: clamp(var(--space-6), 4vw, 56px);
  align-items: center;
}

.auth-shell__hero {
  flex: 1;
  min-width: 0;
}

.auth-shell__form {
  flex: none;
  width: 404px;
}

.auth-shell__form-inner {
  width: 100%;
}

.auth-shell__summary {
  width: 100%;
  max-width: 1180px;
  margin-top: clamp(var(--space-4), 3vh, 30px);
}

/* Footer */
.auth-shell__footer {
  flex: none;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(var(--space-4), 4vw, var(--space-9));
  border-top: 1px solid var(--color-outline-soft);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.auth-shell__footer-links {
  display: flex;
  gap: var(--space-5);
}

.auth-shell__footer-links a {
  color: var(--color-text-secondary);
  text-decoration: none;
}

.auth-shell__footer-links a:hover {
  color: var(--color-text-primary);
}

/* Tablet: tighten the central block but keep hero + form side by side. */
@media (max-width: 1100px) {
  .auth-shell__form {
    width: 360px;
  }

  .auth-shell__row {
    gap: var(--space-6);
  }
}

/* Mobile: scrolling is allowed; the form comes first (focus on the action). */
@media (max-width: 860px) {
  .auth-shell {
    height: auto;
    min-height: 100dvh;
    overflow: visible;
  }

  .auth-shell__center {
    padding: var(--space-5) var(--space-4) var(--space-6);
  }

  .auth-shell__row {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: var(--space-6);
  }

  .auth-shell__form {
    width: 100%;
  }

  .auth-shell__summary {
    margin-top: var(--space-5);
  }

  .auth-shell__footer {
    height: auto;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-4);
    text-align: center;
  }

  .auth-shell__footer-links {
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-3);
  }
}
</style>
