<script setup lang="ts">
import { computed } from "vue";
import { ICON_MAP } from "~/shared/utils/icons/iconMap";
import type { UiIconProps } from "./UiIcon.types";

const props = withDefaults(defineProps<UiIconProps>(), {
  size: 20,
  decorative: true,
  label: undefined,
});

const icon = computed(() => ICON_MAP[props.name]);
</script>

<template>
  <component
    :is="icon"
    :size="size"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-label="!decorative ? label : undefined"
    class="ui-icon"
  />
</template>

<style scoped>
.ui-icon { flex-shrink: 0; }
</style>
