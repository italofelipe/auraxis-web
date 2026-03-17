<script setup lang="ts">
import { NSkeleton, NSpace } from "naive-ui";

import { useWalletSummaryQuery } from "~/composables/useWallet";
import WalletSummaryCard from "~/features/wallet/components/WalletSummaryCard.vue";
import PositionsList from "~/features/wallet/components/PositionsList.vue";

definePageMeta({ middleware: ["authenticated"] });

const walletQuery = useWalletSummaryQuery();

const isEmpty = computed(() => {
  const data = walletQuery.data.value;
  return data !== undefined && data.positions.length === 0 && data.totalPatrimony === 0;
});
</script>

<template>
  <div class="carteira-page">
    <header class="carteira-page__header">
      <h1>Carteira</h1>
      <p class="carteira-page__subtitle">
        Acompanhe seu patrimônio, posições e evolução ao longo do tempo.
      </p>
    </header>

    <!-- Loading state -->
    <NSpace v-if="walletQuery.isLoading.value" vertical :size="16">
      <NSkeleton height="140px" :sharp="false" />
      <NSkeleton height="260px" :sharp="false" />
    </NSpace>

    <!-- Error state -->
    <UiBaseCard v-else-if="walletQuery.isError.value" title="Erro ao carregar carteira">
      <p class="carteira-page__support-copy">
        Não foi possível carregar sua carteira. Tente novamente.
      </p>
    </UiBaseCard>

    <!-- Empty state -->
    <UiBaseCard v-else-if="isEmpty" title="Carteira vazia">
      <p class="carteira-page__support-copy">
        Você ainda não tem ativos cadastrados. Adicione seu primeiro ativo para
        começar a acompanhar seu patrimônio.
      </p>
    </UiBaseCard>

    <!-- Loaded state -->
    <NSpace v-else-if="walletQuery.data.value" vertical :size="16">
      <WalletSummaryCard :summary="walletQuery.data.value" />
      <PositionsList :positions="walletQuery.data.value.positions" />
    </NSpace>
  </div>
</template>

<style scoped>
.carteira-page {
  display: grid;
  gap: var(--space-4, 16px);
  padding: var(--space-4, 16px);
}

.carteira-page__header {
  margin-bottom: var(--space-2, 8px);
}

.carteira-page__subtitle {
  margin: var(--space-1, 4px) 0 0;
  color: var(--color-text-subtle, #888);
}

.carteira-page__support-copy {
  margin: 0;
  color: var(--color-text-subtle, #888);
}
</style>
