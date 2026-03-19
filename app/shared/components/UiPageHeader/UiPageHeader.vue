<script setup lang="ts">
import type { UiPageHeaderProps } from "./UiPageHeader.types";

const props = withDefaults(defineProps<UiPageHeaderProps>(), { subtitle: undefined });
</script>

<template>
  <div class="ui-page-header">
    <h1 class="ui-page-header__title">{{ props.title }}</h1>
    <p v-if="props.subtitle" class="ui-page-header__subtitle">{{ props.subtitle }}</p>
  </div>
</template>

<style scoped>
.ui-page-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ui-page-header__title {
  font-family: var(--font-heading);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}
.ui-page-header__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}
</style>
