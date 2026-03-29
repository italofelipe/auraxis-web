<script setup lang="ts">
import { ref } from "vue";
import { NCollapse, NCollapseItem } from "naive-ui";

interface Props {
  /** Optional section title displayed above the slot content */
  title?: string
  /** Optional descriptive text shown below the title */
  description?: string
  /** Enables collapsible accordion behaviour. Default: false */
  collapsible?: boolean
  /** Initial expanded state when collapsible=true. Default: true */
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  description: undefined,
  collapsible: false,
  defaultExpanded: true,
});

/**
 * Tracks the expanded section key for Naive UI NCollapse (string array).
 * Initialised from defaultExpanded when collapsible is active.
 */
const expandedKeys = ref<string[]>(
  props.collapsible && props.defaultExpanded ? ["section"] : [],
);
</script>

<template>
  <section class="calculator-form-section">
    <template v-if="props.collapsible">
      <NCollapse
        v-model:expanded-names="expandedKeys"
        arrow-placement="right"
      >
        <NCollapseItem
          :title="props.title ?? ''"
          name="section"
        >
          <p
            v-if="props.description"
            class="calculator-form-section__description"
          >
            {{ props.description }}
          </p>
          <slot />
        </NCollapseItem>
      </NCollapse>
    </template>

    <template v-else>
      <div
        v-if="props.title || props.description"
        class="calculator-form-section__header"
      >
        <h3
          v-if="props.title"
          class="calculator-form-section__title"
        >
          {{ props.title }}
        </h3>
        <p
          v-if="props.description"
          class="calculator-form-section__description"
        >
          {{ props.description }}
        </p>
      </div>

      <div class="calculator-form-section__content">
        <slot />
      </div>
    </template>
  </section>
</template>

<style scoped>
.calculator-form-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.calculator-form-section__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.calculator-form-section__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.calculator-form-section__description {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.calculator-form-section__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
</style>
