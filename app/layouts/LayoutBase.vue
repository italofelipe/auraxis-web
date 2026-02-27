<template>
  <div class="layout-shell">
    <header class="layout-header">
      <div class="layout-brand">Auraxis</div>
      <nav class="layout-nav" aria-label="Main navigation">
        <NuxtLink to="/dashboard" class="nav-link" active-class="active">Dashboard</NuxtLink>
        <NuxtLink to="/carteira" class="nav-link" active-class="active">Carteira</NuxtLink>
        <NuxtLink to="/tools" class="nav-link" active-class="active">Ferramentas</NuxtLink>
        <NuxtLink to="/login" class="nav-link" active-class="active">Login</NuxtLink>
        <NuxtLink to="/register" class="nav-link" active-class="active">Register</NuxtLink>
      </nav>
    </header>

    <main class="layout-main" tabindex="0">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  border-bottom: 1px solid rgba(38, 33, 33, 0.08);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  z-index: 10;
}

.layout-brand {
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-lg);
  line-height: var(--line-height-heading-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-neutral-900);
}

.layout-nav {
  display: flex;
  gap: var(--space-4);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-700);
}

.nav-link {
  position: relative;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: inherit;
}

.nav-link:hover,
.nav-link:focus {
  outline: none;
  color: var(--color-brand-600);
  background-color: var(--color-brand-400);
}

.nav-link.active {
  color: var(--color-brand-600);
  font-weight: var(--font-weight-bold);
  background-color: var(--color-brand-500);
}

.layout-main {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4);
  outline-offset: 4px;
}

@media (max-width: 768px) {
  .layout-header {
    flex-wrap: wrap;
  }

  .layout-nav {
    width: 100%;
    justify-content: center;
    gap: var(--space-3);
    margin-top: var(--space-2);
    font-size: var(--font-size-body-sm);
    line-height: var(--line-height-body-sm);
  }
}
</style>
