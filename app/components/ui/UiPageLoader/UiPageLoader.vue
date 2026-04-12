<script setup lang="ts">
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";
import type { UiPageLoaderProps } from "./UiPageLoader.types";

withDefaults(defineProps<UiPageLoaderProps>(), {
  rows: 3,
  withTitle: false,
});
</script>

<template>
  <div class="ui-page-loader" role="status" aria-label="Carregando…" aria-busy="true">
    <BaseSkeleton
      v-if="withTitle"
      class="ui-page-loader__title"
      height="28px"
      width="40%"
    />
    <BaseSkeleton
      v-for="n in rows"
      :key="n"
      class="ui-page-loader__row"
      :height="n === 1 ? '72px' : '56px'"
    />
  </div>
</template>

<style scoped>
.ui-page-loader {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ui-page-loader__title {
  margin-bottom: var(--space-1);
}

.ui-page-loader__row {
  width: 100%;
}
</style>
