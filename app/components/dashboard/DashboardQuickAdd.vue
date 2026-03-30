<script setup lang="ts">
import { ref } from "vue";
import { NButton, NSpace } from "naive-ui";
import type { TransactionTypeDto } from "~/features/transactions/contracts/transaction.dto";

const { t } = useI18n();

/** Which modal is currently open (null = none). */
const openModal = ref<TransactionTypeDto | null>(null);

/**
 * Opens the quick-add modal for the given transaction type.
 *
 * @param type "income" or "expense".
 */
const openForm = (type: TransactionTypeDto): void => {
  openModal.value = type;
};

/** Closes any open quick-add modal. */
const closeForm = (): void => {
  openModal.value = null;
};
</script>

<template>
  <div class="dashboard-quick-add">
    <NSpace :size="8">
      <!-- Income button -->
      <NButton
        type="success"
        size="medium"
        class="dashboard-quick-add__btn dashboard-quick-add__btn--income"
        @click="openForm('income')"
      >
        <template #icon>
          <span class="dashboard-quick-add__icon" aria-hidden="true">+</span>
        </template>
        {{ t('dashboard.quickAdd.income') }}
      </NButton>

      <!-- Expense button -->
      <NButton
        type="error"
        size="medium"
        class="dashboard-quick-add__btn dashboard-quick-add__btn--expense"
        @click="openForm('expense')"
      >
        <template #icon>
          <span class="dashboard-quick-add__icon" aria-hidden="true">−</span>
        </template>
        {{ t('dashboard.quickAdd.expense') }}
      </NButton>
    </NSpace>

    <!-- Income modal -->
    <QuickTransactionForm
      :visible="openModal === 'income'"
      type="income"
      @update:visible="closeForm"
      @success="closeForm"
    />

    <!-- Expense modal -->
    <QuickTransactionForm
      :visible="openModal === 'expense'"
      type="expense"
      @update:visible="closeForm"
      @success="closeForm"
    />
  </div>
</template>

<style scoped>
.dashboard-quick-add {
  display: flex;
  align-items: center;
}

.dashboard-quick-add__icon {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  line-height: 1;
}
</style>
