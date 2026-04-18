<script setup lang="ts">
import { PieChart } from "lucide-vue-next";
</script>

<template>
  <aside class="auth-brand" :aria-label="$t('authBrandPanel.ariaLabel')">
    <!-- Logo -->
    <a class="auth-brand__logo" href="/">
      <span class="auth-brand__logo-mark" aria-hidden="true">
        <PieChart :size="16" />
      </span>
      <span class="auth-brand__logo-name">Auraxis</span>
    </a>

    <!-- Copy block -->
    <div class="auth-brand__copy">
      <span class="auth-brand__badge">{{ $t('authBrandPanel.badge') }}</span>
      <h1 class="auth-brand__headline">
        {{ $t('authBrandPanel.taglineLine1') }}
        {{ $t('authBrandPanel.taglineLine2') }}
      </h1>
      <p class="auth-brand__sub">{{ $t('authBrandPanel.sub') }}</p>
    </div>

    <!-- Highlights grid -->
    <div class="auth-brand__highlights">
      <AuthFeatureList />
    </div>
  </aside>
</template>

<style scoped>
.auth-brand {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  min-height: 100dvh;
  padding: var(--space-8);
  border-right: 1px solid var(--color-outline-soft);
  background: linear-gradient(170deg, rgba(18, 26, 42, 0.88), rgba(5, 7, 13, 0.95));
  color: var(--color-text-primary);
  overflow: hidden;
}

/* Logo */
.auth-brand__logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: var(--font-weight-extrabold);
  letter-spacing: 0.01em;
  text-decoration: none;
  color: inherit;
}

.auth-brand__logo-mark {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, var(--accent-cyan, #44d4ff), var(--accent-violet, #8b7dff));
  color: #0b1626;
  font-weight: var(--font-weight-extrabold);
}

.auth-brand__logo-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
}

/* Badge */
.auth-brand__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  border: 1px solid var(--border-strong, rgba(68, 212, 255, 0.4));
  border-radius: var(--radius-full);
  padding: 7px 12px;
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent-cyan, #44d4ff);
  background: rgba(68, 212, 255, 0.1);
}

/* Copy */
.auth-brand__copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-brand__headline {
  font-size: clamp(var(--font-size-3xl), 4vw, var(--font-size-4xl));
  line-height: 1.08;
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.01em;
  margin: 0;
}

.auth-brand__sub {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  max-width: 48ch;
  margin: 0;
}

/* Highlights */
.auth-brand__highlights {
  margin-top: auto;
}
</style>
