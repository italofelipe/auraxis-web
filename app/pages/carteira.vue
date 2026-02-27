<script setup lang="ts">
import { useWalletSummaryQuery } from "~/composables/useWallet";
import { formatCurrency } from "~/utils/currency";

definePageMeta({ middleware: ["authenticated"] });

const walletSummaryQuery = useWalletSummaryQuery();
</script>

<template>
  <BaseCard title="Carteira">
    <BaseSkeleton v-if="walletSummaryQuery.isLoading.value" />

    <template v-else>
      <p class="wallet-total">Total: {{ formatCurrency(walletSummaryQuery.data.value?.total ?? 0) }}</p>

      <ul class="wallet-list">
        <li v-for="asset in walletSummaryQuery.data.value?.assets ?? []" :key="asset.id">
          <span>{{ asset.name }}</span>
          <span>{{ formatCurrency(asset.amount) }}</span>
          <span>{{ asset.allocation }}%</span>
        </li>
      </ul>
    </template>
  </BaseCard>
</template>

<style scoped>
.wallet-total {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-heading-md);
  line-height: var(--line-height-heading-md);
  font-weight: 700;
}

.wallet-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: var(--space-1);
}

.wallet-list li {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: var(--space-2);
  padding: var(--space-1) 0;
  border-bottom: 1px solid var(--color-outline-subtle);
}
</style>
