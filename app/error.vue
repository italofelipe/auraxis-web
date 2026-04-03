<script setup lang="ts">
import type { NuxtError } from "nuxt/app";

const props = defineProps<{
  error: NuxtError;
}>();

const is404 = computed(() => props.error.statusCode === 404);

/**
 * Clears the error and navigates the user back to the home page.
 */
const handleGoHome = async (): Promise<void> => {
  await clearError({ redirect: "/" });
};
</script>

<template>
  <div class="error-page">
    <div class="error-content">
      <p class="error-code">
        {{ error.statusCode }}
      </p>
      <p class="error-message">
        {{ is404 ? "Página não encontrada." : "Ocorreu um erro inesperado." }}
      </p>
      <NuxtLink to="/" class="error-home-link" @click.prevent="handleGoHome">
        Voltar ao início
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.error-content {
  text-align: center;
  max-width: 480px;
}

.error-code {
  font-size: var(--error-code-font-size, clamp(4rem, 10vw, 8rem));
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight, 1);
  margin-bottom: 1rem;
  color: var(--color-primary);
}

.error-message {
  font-size: var(--font-size-lg);
  margin-bottom: 2rem;
  color: var(--color-text-secondary);
}

.error-home-link {
  display: inline-block;
  padding: 0.75rem 2rem;
  background-color: var(--color-primary);
  color: var(--color-white, #fff);
  border-radius: var(--border-radius-md);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
}
</style>
