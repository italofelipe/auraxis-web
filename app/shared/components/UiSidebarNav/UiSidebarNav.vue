<script setup lang="ts">
import type { UiSidebarNavProps } from "./UiSidebarNav.types";
import UiSidebarNavItem from "../UiSidebarNavItem/UiSidebarNavItem.vue";

const props = withDefaults(defineProps<UiSidebarNavProps>(), {
  collapsed: false,
  currentRoute: undefined,
});

/**
 * Returns true when itemTo matches or is a prefix of the current route.
 * @param itemTo - The route path of the navigation item.
 * @returns Whether the item should be rendered as active.
 */
function isActive(itemTo: string): boolean {
  if (!props.currentRoute) {
    return false;
  }
  return props.currentRoute === itemTo || props.currentRoute.startsWith(itemTo + "/");
}
</script>

<template>
  <nav class="ui-sidebar-nav" :aria-label="collapsed ? 'Navegação' : undefined">
    <UiSidebarNavItem
      v-for="item in items"
      :key="item.key"
      :label="item.label"
      :to="item.to"
      :icon="item.icon"
      :active="isActive(item.to)"
      :collapsed="collapsed"
    />
  </nav>
</template>

<style scoped>
.ui-sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-1) 0;
}
</style>
