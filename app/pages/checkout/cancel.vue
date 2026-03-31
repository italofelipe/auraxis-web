<script setup lang="ts">
import { XCircle } from "lucide-vue-next";
import { NButton } from "naive-ui";

const { t } = useI18n();

useSeoMeta({
  title: t("pages.checkout.cancel.meta.title"),
  description: t("pages.checkout.cancel.meta.description"),
});
</script>

<template>
  <div class="checkout-cancel">
    <div class="checkout-cancel__card">
      <XCircle class="checkout-cancel__icon" :size="64" />
      <h1>{{ $t('pages.checkout.cancel.title') }}</h1>
      <p>{{ $t('pages.checkout.cancel.description') }}</p>
      <div class="checkout-cancel__actions">
        <NButton type="primary" tag="a" href="/plans">
          {{ $t('pages.checkout.cancel.cta') }}
        </NButton>
        <NButton type="default" tag="a" href="/dashboard">
          {{ $t('pages.checkout.cancel.backToDashboard') }}
        </NButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout-cancel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--space-4);
}

.checkout-cancel__card {
  text-align: center;
  max-width: 480px;
  display: grid;
  gap: var(--space-3);
  justify-items: center;
}

.checkout-cancel__icon {
  color: var(--color-text-muted);
}

.checkout-cancel__card h1 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-lg);
}

.checkout-cancel__card p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.checkout-cancel__actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  justify-content: center;
}
</style>
