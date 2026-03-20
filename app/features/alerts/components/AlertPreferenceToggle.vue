<script setup lang="ts">
import { NSwitch } from "naive-ui";

import type { AlertPreference } from "~/features/alerts/model/alerts";

interface Props {
  /** Alert preference data to display. */
  preference: AlertPreference;
  /** Whether the toggle is in a loading state. */
  loading?: boolean;
}

interface Emits {
  /** Emitted when the user toggles the enabled state. */
  (event: "toggle", category: string, enabled: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

/**
 * Resolves a human-readable label for the alert category.
 *
 * @param category Alert category identifier.
 * @returns Human-readable category label in PT-BR.
 */
const categoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    system: "Sistema",
    account: "Conta",
    security: "Segurança",
    marketing: "Marketing",
    transactions: "Transações",
    goals: "Metas",
  };
  return labels[category] ?? category;
};

/**
 * Handles the switch value change.
 *
 * @param value New enabled state.
 */
const onToggle = (value: boolean): void => {
  emit("toggle", props.preference.category, value);
};
</script>

<template>
  <div class="alert-preference-toggle">
    <div class="alert-preference-toggle__label">
      <span class="alert-preference-toggle__category">
        {{ categoryLabel(preference.category) }}
      </span>
      <span v-if="preference.channels.length > 0" class="alert-preference-toggle__channels">
        {{ preference.channels.join(", ") }}
      </span>
    </div>

    <NSwitch
      :value="preference.enabled"
      :loading="loading"
      class="alert-preference-toggle__switch"
      @update:value="onToggle"
    />
  </div>
</template>

<style scoped>
.alert-preference-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3, 12px);
  padding: var(--space-3, 12px) 0;
  border-bottom: 1px solid var(--color-outline-subtle, #eee);
}

.alert-preference-toggle:last-child {
  border-bottom: none;
}

.alert-preference-toggle__label {
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 4px);
  min-width: 0;
}

.alert-preference-toggle__category {
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-primary);
}

.alert-preference-toggle__channels {
  font-size: var(--font-size-body-sm, 0.75rem);
  color: var(--color-text-subtle, #888);
  text-transform: capitalize;
}

.alert-preference-toggle__switch {
  flex-shrink: 0;
}
</style>
