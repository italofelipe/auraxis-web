<script setup lang="ts">
import { NAlert, NButton } from "naive-ui";

const emit = defineEmits<{ upgrade: []; dismiss: [] }>();

const { t } = useI18n();
</script>

<template>
  <!-- 429 do backend: as 3 importações gratuitas do mês acabaram. -->
  <NAlert
    type="info"
    :title="t('import.upsell.title')"
    closable
    data-testid="import-upsell"
    @close="emit('dismiss')"
  >
    <p>{{ t("import.upsell.description") }}</p>
    <NButton type="primary" size="small" @click="emit('upgrade')">
      {{ t("import.upsell.action") }}
    </NButton>
  </NAlert>
</template>
