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
  display: grid;
  grid-template-columns: 1.08fr 0.92fr;
  min-height: 100dvh;
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
  padding: var(--space-8) var(--space-5);
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
    padding: var(--space-5) var(--space-4);
  }
}

/* Tablet: narrower brand panel */
@media (min-width: 861px) and (max-width: 1160px) {
  .auth-layout {
    grid-template-columns: 5fr 7fr;
  }
}
</style>
