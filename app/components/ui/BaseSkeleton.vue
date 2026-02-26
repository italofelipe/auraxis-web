<template>
  <div class="base-skeleton" aria-hidden="true" />
</template>

<style scoped>
.base-skeleton {
  height: 24px;
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    rgba(65, 57, 57, 0.12) 0%,
    rgba(65, 57, 57, 0.22) 50%,
    rgba(65, 57, 57, 0.12) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}
</style>
