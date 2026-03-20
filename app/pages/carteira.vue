<script setup lang="ts">
import { NSkeleton, NSpace } from "naive-ui";

import { useWalletSummaryQuery } from "~/composables/useWallet";
import WalletSummaryCard from "~/features/wallet/components/WalletSummaryCard.vue";
import PositionsList from "~/features/wallet/components/PositionsList.vue";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Carteira",
  pageSubtitle: "Acompanhe seu patrimônio, posições e evolução",
});

const walletQuery = useWalletSummaryQuery();

const isEmpty = computed(() => {
  const data = walletQuery.data.value;
  return data !== undefined && data.positions.length === 0 && data.totalPatrimony === 0;
});
</script>

<template>
  <div class="carteira-page">
    <NSpace v-if="walletQuery.isLoading.value" vertical :size="16">
      <NSkeleton height="140px" :sharp="false" />
      <NSkeleton height="260px" :sharp="false" />
    </NSpace>

    <UiBaseCard v-else-if="walletQuery.isError.value" title="Erro ao carregar carteira">
      <p class="carteira-page__support-copy">
        Não foi possível carregar sua carteira. Tente novamente.
      </p>
    </UiBaseCard>

    <UiBaseCard v-else-if="isEmpty" title="Carteira vazia">
      <p class="carteira-page__support-copy">
        Você ainda não tem ativos cadastrados. Adicione seu primeiro ativo para
        começar a acompanhar seu patrimônio.
      </p>
    </UiBaseCard>

    <NSpace v-else-if="walletQuery.data.value" vertical :size="16">
      <WalletSummaryCard :summary="walletQuery.data.value" />
      <PositionsList :positions="walletQuery.data.value.positions" />
    </NSpace>
  </div>
</template>

<style scoped>
.carteira-page {
  display: grid;
  gap: var(--space-4);
}

.carteira-page__support-copy {
  margin: 0;
  color: var(--color-text-muted);
}
</style>
