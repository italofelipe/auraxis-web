<script setup lang="ts">
import { useI18n } from "vue-i18n";

import type { InstallmentPreview } from "~/features/transactions/utils/preview-installments";

/**
 * Preview textual do parcelamento (tx-1 / #866):
 * "12x de R$ 100,00 a partir de 17/05/2026 até 17/04/2027".
 */
const props = defineProps<{ preview: InstallmentPreview | null }>();

const { t } = useI18n();
</script>

<template>
  <p v-if="props.preview" class="installment-preview" data-testid="installment-preview">
    {{
      t("transaction.form.installment.preview", {
        count: props.preview.totalCount,
        value: props.preview.perInstallment,
        first: props.preview.firstDate,
        last: props.preview.lastDate,
      })
    }}
  </p>
</template>

<style scoped>
.installment-preview {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
