<script setup lang="ts">
import { NButton, NCard, NTag } from "naive-ui";
import { useRouter } from "#app";
import type { Tool, ToolAccessLevel } from "~/features/tools/model/tools";

interface Props {
  tool: Tool;
  isAuthenticated: boolean;
  isPremium?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isPremium: false,
});

const router = useRouter();

/**
 * Returns the label for the access badge based on access level.
 * @param accessLevel The tool's access level.
 * @returns Localized badge label.
 */
const accessBadgeLabel = (accessLevel: ToolAccessLevel): string => {
  if (accessLevel === "premium") {
    return "Premium";
  }
  if (accessLevel === "authenticated") {
    return "Login necessário";
  }
  return "Público";
};

/**
 * Returns the NaiveUI tag type for the access badge.
 * @param accessLevel The tool's access level.
 * @returns NaiveUI tag type string.
 */
const accessBadgeType = (
  accessLevel: ToolAccessLevel,
): "success" | "warning" | "info" => {
  if (accessLevel === "premium") {
    return "warning";
  }
  if (accessLevel === "authenticated") {
    return "info";
  }
  return "success";
};

/**
 * Handles the primary CTA click based on tool state and user auth/premium status.
 */
const handleCtaClick = (): void => {
  if (!props.tool.enabled) {
    return;
  }

  if (props.tool.accessLevel === "premium" && !props.isPremium) {
    return;
  }

  if (props.tool.accessLevel === "authenticated" && !props.isAuthenticated) {
    void router.push(`/login?redirect=/tools&tool=${props.tool.id}`);
  }

  // Tool is public or user meets auth requirements — nothing to navigate for now
  // Real tool interaction would be handled by parent
};

/**
 * Returns the CTA button label based on tool state and user context.
 * @returns Localized CTA label.
 */
const ctaLabel = (): string => {
  if (!props.tool.enabled) {
    return "Em breve";
  }
  if (props.tool.accessLevel === "premium" && !props.isPremium) {
    return "Ver planos";
  }
  if (props.tool.accessLevel === "authenticated" && !props.isAuthenticated) {
    return "Fazer login para usar";
  }
  return "Usar ferramenta";
};
</script>

<template>
  <NCard class="tool-card">
    <div class="tool-card__header">
      <h3 class="tool-card__name">{{ tool.name }}</h3>
      <NTag
        :type="accessBadgeType(tool.accessLevel)"
        size="small"
        round
      >
        {{ accessBadgeLabel(tool.accessLevel) }}
      </NTag>
    </div>

    <p class="tool-card__description">{{ tool.description }}</p>

    <div class="tool-card__footer">
      <NButton
        v-if="tool.enabled && tool.accessLevel === 'premium' && !isPremium"
        type="warning"
        size="small"
        @click="handleCtaClick"
      >
        {{ ctaLabel() }}
      </NButton>
      <NButton
        v-else-if="!tool.enabled"
        type="default"
        size="small"
        disabled
      >
        {{ ctaLabel() }}
      </NButton>
      <NButton
        v-else
        type="primary"
        size="small"
        @click="handleCtaClick"
      >
        {{ ctaLabel() }}
      </NButton>
    </div>
  </NCard>
</template>

<style scoped>
.tool-card {
  height: 100%;
}

.tool-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.tool-card__name {
  margin: 0;
  font-size: var(--font-size-body-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-900);
}

.tool-card__description {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-body-sm);
  color: var(--color-neutral-600);
  line-height: var(--line-height-body-sm);
}

.tool-card__footer {
  display: flex;
  justify-content: flex-end;
}
</style>
