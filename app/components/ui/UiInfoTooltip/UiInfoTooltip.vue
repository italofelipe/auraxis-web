<script setup lang="ts">
import { NButton, NTooltip } from "naive-ui";

import UiIcon from "../UiIcon/UiIcon.vue";
import type { UiInfoTooltipProps } from "./UiInfoTooltip.types";

const props = withDefaults(defineProps<UiInfoTooltipProps>(), {
  label: "Entender este conceito",
  placement: "top",
});
</script>

<template>
  <NTooltip :placement="props.placement" trigger="hover">
    <template #trigger>
      <NButton
        text
        type="default"
        class="ui-info-tooltip__trigger"
        :aria-label="props.label"
      >
        <UiIcon
          name="info"
          :size="16"
          :decorative="false"
          :label="props.label"
        />
      </NButton>
    </template>

    <span class="ui-info-tooltip__content">{{ props.content }}</span>
  </NTooltip>
</template>

<style scoped>
.ui-info-tooltip__trigger {
  padding: 0;
  min-width: auto;
  color: var(--color-text-muted);
}

.ui-info-tooltip__trigger:hover {
  color: var(--color-brand-300);
}

.ui-info-tooltip__content {
  display: inline-flex;
  max-width: 280px;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}
</style>
