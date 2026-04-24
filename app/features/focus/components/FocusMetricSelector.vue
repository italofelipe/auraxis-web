<script setup lang="ts">
import { NModal } from "naive-ui";
import { Check } from "lucide-vue-next";
import { FOCUS_METRIC_IDS, type FocusMetricId } from "../model/focus-metric";

interface Props {
  readonly open: boolean;
  readonly selectedId: FocusMetricId;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [id: FocusMetricId];
  close: [];
}>();

const { t } = useI18n();

const show = computed<boolean>({
  get: () => props.open,
  set: (v) => {
    if (!v) { emit("close"); }
  },
});

/**
 * Emits the chosen metric id and closes the selector modal.
 *
 * @param id Focus metric id the user clicked.
 */
const onSelect = (id: FocusMetricId): void => {
  emit("select", id);
  emit("close");
};
</script>

<template>
  <NModal
    v-model:show="show"
    preset="card"
    :title="t('focus.selector.title')"
    :bordered="false"
    size="small"
    style="max-width: 480px;"
    data-testid="focus-metric-selector"
  >
    <p class="focus-selector__description">{{ t("focus.selector.description") }}</p>
    <ul class="focus-selector__list">
      <li v-for="id in FOCUS_METRIC_IDS" :key="id">
        <button
          type="button"
          class="focus-selector__option"
          :class="{ 'focus-selector__option--active': id === selectedId }"
          :data-testid="`focus-metric-option-${id}`"
          @click="onSelect(id)"
        >
          <span class="focus-selector__option-text">
            <span class="focus-selector__option-label">{{ t(`focus.metrics.${id}.label`) }}</span>
            <span class="focus-selector__option-caption">{{ t(`focus.metrics.${id}.caption`) }}</span>
          </span>
          <Check v-if="id === selectedId" :size="18" class="focus-selector__check" />
        </button>
      </li>
    </ul>
  </NModal>
</template>

<style scoped>
.focus-selector__description {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.focus-selector__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.focus-selector__option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  cursor: pointer;
  text-align: left;
  transition: border-color 120ms ease, background 120ms ease;
}

.focus-selector__option:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-highlight, var(--color-bg-elevated));
}

.focus-selector__option--active {
  border-color: var(--color-primary);
  background: var(--color-bg-highlight, var(--color-bg-elevated));
}

.focus-selector__option-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.focus-selector__option-label {
  font-weight: var(--font-weight-medium);
}

.focus-selector__option-caption {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.focus-selector__check {
  color: var(--color-primary);
  flex-shrink: 0;
}
</style>
