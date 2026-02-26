<template>
  <div class="layout-shell">
    <header class="layout-header">
      <div class="layout-brand">Auraxis</div>
      <nav class="layout-nav">
        <NuxtLink to="/dashboard">Dashboard</NuxtLink>
        <NuxtLink to="/carteira">Carteira</NuxtLink>
        <NuxtLink to="/tools">Ferramentas</NuxtLink>
      </nav>
    </header>

    <main class="layout-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout-shell {
  min-height: 100dvh;
}

.layout-header {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid rgba(38, 33, 33, 0.08);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
}

.layout-brand {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  color: var(--color-neutral-950);
}

.layout-nav {
  display: flex;
  gap: var(--space-2);
  font-weight: 600;
  color: var(--color-neutral-700);
}

.layout-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-3);
}
</style>
