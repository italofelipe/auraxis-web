<script setup lang="ts">
</script>

<template>
  <div class="auth-layout">
    <!-- Left: brand panel -->
    <div class="auth-layout__brand" aria-hidden="false">
      <AuthBrandPanel />
    </div>

    <!-- Right: form area -->
    <main class="auth-layout__form" role="main">
      <div class="auth-layout__form-inner">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.auth-layout {
  position: relative;
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  min-height: 100dvh;
  --auth-grid-line: color-mix(in srgb, var(--color-text-primary) 4%, transparent);
  background:
    linear-gradient(var(--auth-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--auth-grid-line) 1px, transparent 1px),
    linear-gradient(135deg, var(--color-brand-glow-2xs), transparent 34%),
    linear-gradient(315deg, var(--color-brand-glow-xs), transparent 32%),
    var(--color-bg-base);
  background-size: 44px 44px, 44px 44px, auto, auto, auto;
  color: var(--color-text-primary);
}

/* Left column — brand panel */
.auth-layout__brand {
  position: relative;
  display: flex;
  flex-direction: column;
}

/* Right column — form */
.auth-layout__form {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: clamp(var(--space-5), 5vw, var(--space-9));
}

.auth-layout__form-inner {
  width: min(500px, 100%);
}

/* Mobile: single column with a compact brand prelude */
@media (max-width: 860px) {
  .auth-layout {
    grid-template-columns: 1fr;
    align-content: start;
  }

  .auth-layout__brand {
    display: flex;
    min-height: auto;
  }

  .auth-layout__form {
    min-height: auto;
    padding: var(--space-5) var(--space-4) var(--space-7);
  }
}

/* Tablet: narrower brand panel */
@media (min-width: 861px) and (max-width: 1160px) {
  .auth-layout {
    grid-template-columns: 5fr 7fr;
  }
}
</style>
