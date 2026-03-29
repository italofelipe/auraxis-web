<script setup lang="ts">
import { ref, type Component } from "vue";
import { NCollapse, NCollapseItem } from "naive-ui";

export interface BreakdownSection {
  /** Unique identifier used as the collapse item name and slot name suffix */
  key: string
  /** Human-readable title shown in the accordion header */
  title: string
  /** Optional Vue component to render as the section body instead of the named slot */
  component?: Component
}

interface Props {
  /** Ordered list of sections to render as accordion items */
  sections: ReadonlyArray<BreakdownSection>
  /** Keys of sections that should be expanded on first render */
  defaultExpanded?: ReadonlyArray<string>
}

const props = withDefaults(defineProps<Props>(), {
  defaultExpanded: () => [],
});

/**
 * Tracks the currently expanded section keys.
 * NCollapse uses an array of names when accordion mode is off (multiple open allowed).
 */
const expandedKeys = ref<string[]>([...props.defaultExpanded]);
</script>

<template>
  <NCollapse
    v-model:expanded-names="expandedKeys"
    arrow-placement="right"
    class="detailed-breakdown-panel"
  >
    <NCollapseItem
      v-for="section in props.sections"
      :key="section.key"
      :title="section.title"
      :name="section.key"
    >
      <component
        :is="section.component"
        v-if="section.component"
      />
      <slot
        v-else
        :name="`section-${section.key}`"
      />
    </NCollapseItem>
  </NCollapse>
</template>

<style scoped>
.detailed-breakdown-panel {
  display: flex;
  flex-direction: column;
}
</style>
