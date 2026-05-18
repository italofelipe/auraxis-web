<script setup lang="ts">
import { computed } from "vue";
import { NCollapseItem, NTag } from "naive-ui";

import {
  formatInsightCreatedAt,
  getInsightTypeLabel,
  type AIInsight,
} from "~/features/ai-insights/model/ai-insight";
import { groupInsightItemsByDimension } from "~/features/ai-insights/composables/use-insights-by-dimension";

const props = defineProps<{
  item: AIInsight;
}>();

const title = computed(() => `Insight – ${formatInsightCreatedAt(props.item.createdAt)}`);
const dimensionGroups = computed(() => groupInsightItemsByDimension(props.item.items));

const tagType = computed(() => {
  const typeMap = {
    daily: "info",
    weekly: "success",
    monthly: "default",
    recap: "warning",
  } as const;

  return typeMap[props.item.insightType];
});
</script>

<template>
  <NCollapseItem :name="item.id" class="ai-insight-accordion-item">
    <template #header>
      <div class="ai-insight-accordion-item__header">
        <span>{{ title }}</span>
        <NTag size="small" round :type="tagType">
          {{ getInsightTypeLabel(item.insightType) }}
        </NTag>
      </div>
    </template>

    <div class="ai-insight-accordion-item__content">
      <section
        v-for="group in dimensionGroups"
        :key="`${item.id}-${group.dimension}`"
        class="ai-insight-accordion-item__group"
      >
        <h3 class="ai-insight-accordion-item__group-title">{{ group.label }}</h3>
        <article
          v-for="insight in group.items"
          :key="`${item.id}-${insight.type}-${insight.title}`"
          class="ai-insight-accordion-item__card"
        >
          <h4>{{ insight.title }}</h4>
          <p>{{ insight.message }}</p>
        </article>
      </section>
    </div>
  </NCollapseItem>
</template>

<style scoped>
.ai-insight-accordion-item__header {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-primary);
}

.ai-insight-accordion-item__content {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-2) 0;
}

.ai-insight-accordion-item__group {
  display: grid;
  gap: var(--space-2);
}

.ai-insight-accordion-item__group-title {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.ai-insight-accordion-item__card {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}

.ai-insight-accordion-item__card h4,
.ai-insight-accordion-item__card p {
  margin: 0;
}

.ai-insight-accordion-item__card h4 {
  color: var(--color-text-primary);
  font-size: var(--font-size-body-md);
}

.ai-insight-accordion-item__card p {
  color: var(--color-text-secondary);
  line-height: 1.5;
}
</style>
