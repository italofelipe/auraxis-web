<script setup lang="ts">
import { NButton, NModal, NText } from "naive-ui";

const props = defineProps<{ show: boolean; busy: boolean }>();

const emit = defineEmits<{ confirm: []; cancel: [] }>();

const { t } = useI18n();
</script>

<template>
  <!--
    Segundo modal do "terminar depois": diz exatamente o que será gravado antes
    de o usuário aceitar. O texto é o da especificação do PO, sem paráfrase.
  -->
  <NModal
    :show="props.show"
    preset="card"
    style="width: min(520px, 95vw)"
    :mask-closable="false"
    :aria-label="t('import.finishLater.title')"
    data-testid="import-finish-later-modal"
    @update:show="(value: boolean) => !value && emit('cancel')"
  >
    <NText>{{ t("import.finishLater.title") }}</NText>

    <template #footer>
      <div class="import-finish-later__actions">
        <NButton
          quaternary
          data-testid="import-finish-later-cancel"
          @click="emit('cancel')"
        >
          {{ t("import.finishLater.cancel") }}
        </NButton>
        <NButton
          type="primary"
          :loading="props.busy"
          :disabled="props.busy"
          data-testid="import-finish-later-confirm"
          @click="emit('confirm')"
        >
          {{ t("import.finishLater.confirm") }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.import-finish-later__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>
