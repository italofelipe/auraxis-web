<script setup lang="ts">
import { CheckCircle2 } from "lucide-vue-next";
import { NButton } from "naive-ui";

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated"],
});

useSeoMeta({
  title: t("pages.checkout.success.meta.title"),
  description: t("pages.checkout.success.meta.description"),
});
</script>

<template>
  <div class="checkout-success">
    <div class="checkout-success__card">
      <CheckCircle2 class="checkout-success__icon" :size="64" />
      <h1>{{ $t('pages.checkout.success.title') }}</h1>
      <p>{{ $t('pages.checkout.success.description') }}</p>
      <div class="checkout-success__actions">
        <NButton type="primary" tag="a" href="/dashboard">
          {{ $t('pages.checkout.success.cta') }}
        </NButton>
        <NButton type="default" tag="a" href="/subscription">
          {{ $t('pages.checkout.success.viewSubscription') }}
        </NButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-success {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--space-4);
}

.checkout-success__card {
  text-align: center;
  max-width: 480px;
  display: grid;
  gap: var(--space-3);
  justify-items: center;
}

.checkout-success__icon {
  color: var(--color-positive);
}

.checkout-success__card h1 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-lg);
}

.checkout-success__card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.checkout-success__actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  justify-content: center;
}
</style>
