<script setup lang="ts">
import AuthBrandPanel from "~/features/auth/components/AuthBrandPanel/AuthBrandPanel.vue";
import AuthFeatureList from "~/features/auth/components/AuthFeatureList/AuthFeatureList.vue";
</script>

<template>
  <div class="auth-layout">
    <!-- Left: brand panel (hidden on mobile) -->
    <div class="auth-layout__brand" aria-hidden="false">
      <AuthBrandPanel />
      <div class="auth-layout__features">
        <AuthFeatureList />
      </div>
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
  grid-template-columns: 1fr 1fr;
  min-height: 100dvh;
}

/* Left column */
.auth-layout__brand {
  position: relative;
  display: flex;
  flex-direction: column;
}

.auth-layout__features {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-6);
  z-index: 1;
}

/* Right column */
.auth-layout__form {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-surface);
  padding: var(--space-5) var(--space-4);
}

.auth-layout__form-inner {
  width: 100%;
  max-width: 440px;
}

/* Mobile: single column, brand hidden */
@media (max-width: 767px) {
  .auth-layout {
    grid-template-columns: 1fr;
  }

  .auth-layout__brand {
    display: none;
  }

  .auth-layout__form {
    min-height: 100dvh;
    padding: var(--space-4) var(--space-3);
  }
}

/* Tablet: narrower brand panel */
@media (min-width: 768px) and (max-width: 1023px) {
  .auth-layout {
    grid-template-columns: 5fr 7fr;
  }
}
</style>
