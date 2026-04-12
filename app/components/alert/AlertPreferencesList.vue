<script setup lang="ts">
import { NCard, NEmpty, NSpace } from "naive-ui";
import BaseSkeleton from "~/components/ui/BaseSkeleton.vue";

import type { AlertPreference } from "~/features/alerts/model/alerts";


interface Props {
  /** List of alert preferences to display. */
  preferences: AlertPreference[];
  /** Whether the preferences list is loading. */
  isLoading?: boolean;
  /** Set of category identifiers currently being updated. */
  updatingCategories?: Set<string>;
}

interface Emits {
  /** Emitted when the user toggles a preference. */
  (event: "toggle", category: string, enabled: boolean): void;
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  updatingCategories: () => new Set(),
});

const emit = defineEmits<Emits>();

/**
 * Forwards the toggle event from a child AlertPreferenceToggle.
 *
 * @param category Alert category identifier.
 * @param enabled New enabled state.
 */
const onToggle = (category: string, enabled: boolean): void => {
  emit("toggle", category, enabled);
};
</script>

<template>
  <NCard :title="$t('alert.preferences.title')">
    <!-- Loading skeletons -->
    <NSpace v-if="isLoading" vertical :size="12">
      <BaseSkeleton :repeat="4" height="52px" />
    </NSpace>

    <!-- Empty state -->
    <NEmpty
      v-else-if="preferences.length === 0"
      :description="$t('alert.preferences.empty')"
    />

    <!-- Preferences list -->
    <ul v-else class="alert-preferences-list">
      <li
        v-for="preference in preferences"
        :key="preference.id"
        class="alert-preferences-list__item"
      >
        <AlertPreferenceToggle
          :preference="preference"
          :loading="updatingCategories.has(preference.category)"
          @toggle="onToggle"
        />
      </li>
    </ul>
  </NCard>
</template>

<style scoped>
.alert-preferences-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.alert-preferences-list__item {
  display: contents;
}
</style>
