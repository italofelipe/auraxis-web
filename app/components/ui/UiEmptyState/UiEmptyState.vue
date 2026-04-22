<script setup lang="ts">
import { computed } from "vue";
import { ICON_MAP } from "~/shared/utils/icons/iconMap";
import type { AuraxisIconName } from "~/shared/utils/icons/icons.types";
import type { UiEmptyStateProps, UiEmptyStateEmits } from "./UiEmptyState.types";

const props = withDefaults(defineProps<UiEmptyStateProps>(), {
  icon: undefined,
  description: undefined,
  actionLabel: undefined,
  secondaryLabel: undefined,
  secondaryHref: undefined,
  compact: false,
});

const emit = defineEmits<UiEmptyStateEmits>();

/**
 * Resolves the icon prop to a renderable component.
 * Accepts either a string key from ICON_MAP or a Component reference directly.
 *
 * @returns Vue component reference, or undefined when no icon is set.
 */
const resolvedIcon = computed(() => {
  if (!props.icon) { return undefined; }
  if (typeof props.icon === "string") { return ICON_MAP[props.icon as AuraxisIconName]; }
  return props.icon;
});

const iconSize = computed(() => (props.compact ? 24 : 40));

const hasPrimary = computed(() => Boolean(props.actionLabel));
const hasSecondary = computed(() => Boolean(props.secondaryLabel));
const hasActions = computed(() => hasPrimary.value || hasSecondary.value);

/**
 * Handles secondary action click. When `secondaryHref` is set the anchor
 * navigates naturally; the emit still fires so parents can track analytics.
 */
const onSecondary = (): void => {
  emit("secondary-action");
};
</script>

<template>
  <div
    class="ui-empty-state"
    :class="{ 'ui-empty-state--compact': compact }"
    role="status"
  >
    <slot name="icon">
      <div v-if="resolvedIcon" class="ui-empty-state__icon-wrap" aria-hidden="true">
        <component :is="resolvedIcon" :size="iconSize" />
      </div>
    </slot>

    <slot name="title">
      <h3 class="ui-empty-state__title">{{ title }}</h3>
    </slot>

    <slot name="description">
      <p v-if="description" class="ui-empty-state__description">{{ description }}</p>
    </slot>

    <slot name="actions">
      <div v-if="hasActions" class="ui-empty-state__actions">
        <button
          v-if="hasPrimary"
          class="ui-empty-state__action"
          type="button"
          @click="emit('action')"
        >
          {{ actionLabel }}
        </button>
        <a
          v-if="hasSecondary && secondaryHref"
          class="ui-empty-state__secondary"
          :href="secondaryHref"
          @click="onSecondary"
        >
          {{ secondaryLabel }}
        </a>
        <button
          v-else-if="hasSecondary"
          class="ui-empty-state__secondary"
          type="button"
          @click="onSecondary"
        >
          {{ secondaryLabel }}
        </button>
      </div>
    </slot>
  </div>
</template>

<style scoped>
.ui-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-5);
  text-align: center;
}

.ui-empty-state--compact {
  padding: var(--space-3);
  gap: var(--space-1);
}

.ui-empty-state__icon-wrap {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
}

.ui-empty-state--compact .ui-empty-state__icon-wrap {
  width: 40px;
  height: 40px;
}

.ui-empty-state__title {
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.ui-empty-state--compact .ui-empty-state__title {
  font-size: var(--font-size-sm);
}

.ui-empty-state__description {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  max-width: 320px;
  margin: 0;
}

.ui-empty-state--compact .ui-empty-state__description {
  font-size: var(--font-size-xs);
}

.ui-empty-state__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-1);
}

.ui-empty-state__action {
  padding: 10px var(--space-3);
  background: var(--color-brand-600);
  color: var(--color-bg-base);
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background 0.15s ease;
}

.ui-empty-state__action:hover {
  background: var(--color-brand-500);
}

.ui-empty-state__secondary {
  background: transparent;
  border: none;
  color: var(--color-brand-500);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  text-decoration: none;
  padding: 0;
}

.ui-empty-state__secondary:hover {
  text-decoration: underline;
}
</style>
