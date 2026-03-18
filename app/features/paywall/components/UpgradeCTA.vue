<script setup lang="ts">
import { NButton } from "naive-ui";
import { Lock } from "lucide-vue-next";
import { useRouter } from "#app";

const router = useRouter();

/** Navigates the user to the plans page. */
const goToPlanos = (): void => {
  void router.push("/planos");
};
</script>

<template>
  <div class="upgrade-cta">
    <Lock class="upgrade-cta__icon" :size="32" />
    <p class="upgrade-cta__title">Recurso Premium</p>
    <p class="upgrade-cta__subtitle">
      Faça upgrade para acessar este recurso
    </p>
    <NButton type="primary" size="medium" @click="goToPlanos">
      Ver planos
    </NButton>
  </div>
</template>

<style scoped>
.upgrade-cta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  text-align: center;
}

.upgrade-cta__icon {
  color: var(--color-warning, #f59e0b);
}

.upgrade-cta__title {
  margin: 0;
  font-size: var(--font-size-body-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-900);
}

.upgrade-cta__subtitle {
  margin: 0;
  font-size: var(--font-size-body-sm);
  color: var(--color-neutral-600);
}
</style>
