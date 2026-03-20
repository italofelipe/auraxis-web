<script setup lang="ts">
// FEAT-01 — AuthBrandPanel
// Left-side branding panel for the split auth layout.
// Static by design; no props needed.
</script>

<template>
  <aside class="auth-brand-panel" aria-label="Auraxis — painel de marca">
    <div class="auth-brand-panel__inner">
      <!-- Logo -->
      <div class="auth-brand-panel__logo" aria-label="Auraxis">
        <span class="auth-brand-panel__logo-mark">A</span>
        <span class="auth-brand-panel__logo-name">uraxis</span>
      </div>

      <!-- Headline -->
      <div class="auth-brand-panel__copy">
        <p class="auth-brand-panel__tagline">
          Dados financeiros complexos.<br>
          Clareza radical.
        </p>
        <p class="auth-brand-panel__sub">
          Gerencie seu patrimônio, metas e transações em um único lugar — com a precisão que você merece.
        </p>
      </div>

      <!-- Decorative accent -->
      <div class="auth-brand-panel__accent" aria-hidden="true" />
    </div>

    <!-- Background aurora -->
    <div class="auth-brand-panel__aurora" aria-hidden="true">
      <div class="auth-brand-panel__aurora-blob auth-brand-panel__aurora-blob--a" />
      <div class="auth-brand-panel__aurora-blob auth-brand-panel__aurora-blob--b" />
    </div>
  </aside>
</template>

<style scoped>
.auth-brand-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  min-height: 100dvh;
  padding: var(--space-5) var(--space-6);
  background: var(--color-bg-base);
  overflow: hidden;
  color: var(--color-text-primary);
}

.auth-brand-panel__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 380px;
}

/* Logo */
.auth-brand-panel__logo {
  display: flex;
  align-items: baseline;
  gap: 1px;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-lg);
  line-height: 1;
}

.auth-brand-panel__logo-mark {
  color: var(--color-brand-400);
  font-weight: var(--font-weight-bold);
}

.auth-brand-panel__logo-name {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
}

/* Copy */
.auth-brand-panel__copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.auth-brand-panel__tagline {
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-xl);
  line-height: var(--line-height-heading-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.auth-brand-panel__sub {
  font-size: var(--font-size-md);
  line-height: var(--line-height-md);
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 320px;
}

/* Gold accent bar */
.auth-brand-panel__accent {
  width: 48px;
  height: 3px;
  background: var(--color-brand-400);
  border-radius: var(--radius-full);
}

/* Aurora blobs */
.auth-brand-panel__aurora {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.auth-brand-panel__aurora-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.25;
}

.auth-brand-panel__aurora-blob--a {
  width: 420px;
  height: 420px;
  top: -80px;
  left: -100px;
  background: radial-gradient(circle, var(--color-brand-700) 0%, transparent 70%);
}

.auth-brand-panel__aurora-blob--b {
  width: 320px;
  height: 320px;
  bottom: -60px;
  right: -60px;
  background: radial-gradient(circle, var(--color-brand-500) 0%, transparent 70%);
  opacity: 0.15;
}
</style>
