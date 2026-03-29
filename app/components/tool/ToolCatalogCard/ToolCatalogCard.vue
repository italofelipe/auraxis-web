<script setup lang="ts">
import { NCard, NTag, NButton, NText } from "naive-ui";
import { useRouter } from "#app";
import type { Tool, ToolAccessLevel } from "~/features/tools/model/tools";

interface Props {
  tool: Tool;
}

const props = defineProps<Props>();

const router = useRouter();

/**
 * Returns the NaiveUI tag type for the access badge based on access level.
 *
 * @param accessLevel The tool's access level.
 * @returns NaiveUI tag type string.
 */
const accessBadgeType = (
  accessLevel: ToolAccessLevel,
): "success" | "info" | "warning" => {
  if (accessLevel === "premium") {
    return "warning";
  }
  if (accessLevel === "authenticated") {
    return "info";
  }
  return "success";
};

/**
 * Returns the localized label for the access badge.
 *
 * @param accessLevel The tool's access level.
 * @returns Localized badge label string.
 */
const accessBadgeLabel = (accessLevel: ToolAccessLevel): string => {
  const { t } = useI18n();
  return t(`pages.tools.accessLevel.${accessLevel}`);
};

/** Handles the CTA button click — navigates to the tool route. */
const handleOpen = (): void => {
  if (!props.tool.enabled) {
    return;
  }
  void router.push(props.tool.route);
};

/**
 * Returns the localized CTA label based on whether the tool is enabled.
 *
 * @returns Localized CTA button label.
 */
const ctaLabel = computed((): string => {
  const { t } = useI18n();
  return props.tool.enabled
    ? t("pages.tools.card.open")
    : t("pages.tools.card.disabled");
});
</script>

<template>
  <NCard class="tool-catalog-card" :bordered="true" content-style="padding: var(--space-3);">
    <div class="tool-catalog-card__header">
      <NText class="tool-catalog-card__name" strong>{{ tool.name }}</NText>
      <NTag
        :type="accessBadgeType(tool.accessLevel)"
        size="small"
        :bordered="false"
        round
      >
        {{ accessBadgeLabel(tool.accessLevel) }}
      </NTag>
    </div>

    <p class="tool-catalog-card__description">{{ tool.description }}</p>

    <NButton
      :type="tool.enabled ? 'primary' : 'default'"
      block
      :disabled="!tool.enabled"
      class="tool-catalog-card__cta"
      @click="handleOpen"
    >
      {{ ctaLabel }}
    </NButton>
  </NCard>
</template>

<style scoped>
.tool-catalog-card {
  background: var(--color-bg-elevated);
  display: flex;
  flex-direction: column;
  transition: border-color 0.15s ease;
}

.tool-catalog-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.tool-catalog-card__name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.tool-catalog-card__description {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: 1.5;
  margin: 0 0 var(--space-3);
  flex: 1 1 auto;
}

.tool-catalog-card__cta {
  margin-top: auto;
}
</style>
