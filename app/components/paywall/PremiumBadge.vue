<script setup lang="ts">
import { Crown } from "lucide-vue-next";

</script>

<template>
  <span class="premium-badge">
    <Crown class="premium-badge__icon" :size="12" />
    {{ $t('paywall.premium') }}
  </span>
</template>

<style scoped>
.premium-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--border-radius-small, 4px);
  background-color: var(--color-warning-light, #fef3c7);
  color: var(--color-warning-dark, #92400e);
  font-size: var(--font-size-body-xs, 11px);
  font-weight: var(--font-weight-semibold);
  line-height: 1.4;
}

.premium-badge__icon {
  flex-shrink: 0;
}
</style>
