<script setup lang="ts">
</script>

<template>
  <div class="auth-layout">
    <!-- Left: brand panel (hidden on mobile) -->
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
  background:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(135deg, rgba(139, 125, 255, 0.1), transparent 34%),
    linear-gradient(315deg, rgba(68, 212, 255, 0.1), transparent 32%),
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

/* Mobile: single column, brand hidden */
@media (max-width: 860px) {
  .auth-layout {
    grid-template-columns: 1fr;
  }

  .auth-layout__brand {
    display: none;
  }

  .auth-layout__form {
    min-height: 100dvh;
    padding: var(--space-8) var(--space-4) var(--space-5);
  }
}

/* Tablet: narrower brand panel */
@media (min-width: 861px) and (max-width: 1160px) {
  .auth-layout {
    grid-template-columns: 5fr 7fr;
  }
}
</style>
