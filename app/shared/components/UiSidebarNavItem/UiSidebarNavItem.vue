<script setup lang="ts">
import type { UiSidebarNavItemProps } from "./UiSidebarNavItem.types";

const props = withDefaults(defineProps<UiSidebarNavItemProps>(), {
  icon: undefined,
  active: false,
  collapsed: false,
});
</script>

<template>
  <NuxtLink
    :to="props.to"
    class="ui-sidebar-nav-item"
    :class="{
      'ui-sidebar-nav-item--active': props.active,
      'ui-sidebar-nav-item--collapsed': props.collapsed,
    }"
    :aria-current="props.active ? 'page' : undefined"
  >
    <component
      :is="props.icon"
      v-if="props.icon"
      :size="20"
      class="ui-sidebar-nav-item__icon"
      aria-hidden="true"
    />
    <span v-if="!props.collapsed" class="ui-sidebar-nav-item__label">{{ props.label }}</span>
  </NuxtLink>
</template>

<style scoped>
.ui-sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  border-left: 4px solid transparent;
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.ui-sidebar-nav-item:hover:not(.ui-sidebar-nav-item--active) {
  color: var(--color-text-primary);
  background: var(--color-outline-ghost);
}

.ui-sidebar-nav-item--active {
  background: var(--color-brand-glow-xs);
  color: var(--color-brand-600);
  border-left-color: var(--color-brand-600);
  font-weight: var(--font-weight-semibold);
}

.ui-sidebar-nav-item--collapsed {
  justify-content: center;
  padding: 10px;
  border-radius: var(--radius-md);
  border-left-color: transparent;
}

.ui-sidebar-nav-item--collapsed.ui-sidebar-nav-item--active {
  border-left-color: transparent;
  background: var(--color-brand-glow-xs);
}

.ui-sidebar-nav-item__icon {
  flex-shrink: 0;
}

.ui-sidebar-nav-item__label {
  white-space: nowrap;
  overflow: hidden;
}
</style>
