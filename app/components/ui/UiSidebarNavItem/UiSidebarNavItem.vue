<script setup lang="ts">
import { NTooltip } from "naive-ui";
import type { UiSidebarNavItemProps } from "./UiSidebarNavItem.types";

const props = withDefaults(defineProps<UiSidebarNavItemProps>(), {
  icon: undefined,
  active: false,
  collapsed: false,
});
</script>

<template>
  <!--
    O tooltip envolve o item sempre e é desligado no modo expandido, em vez de
    duplicar a marcação do link nos dois ramos — assim não há como as duas
    versões divergirem com o tempo.
  -->
  <NTooltip placement="right" :disabled="!props.collapsed" :delay="120">
    <template #trigger>
      <NuxtLink
        :to="props.to"
        :prefetch="false"
        class="ui-sidebar-nav-item"
        :class="{
          'ui-sidebar-nav-item--active': props.active,
          'ui-sidebar-nav-item--collapsed': props.collapsed,
        }"
        :aria-current="props.active ? 'page' : undefined"
        :aria-label="props.collapsed ? props.label : undefined"
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
    {{ props.label }}
  </NTooltip>
</template>

<style scoped>
.ui-sidebar-nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 16px;
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  border-left: 4px solid transparent;
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  /* Os tokens de movimento zeram sozinhos sob prefers-reduced-motion
     (main.css), então usá-los já entrega o respeito à preferência. */
  transition:
    background var(--motion-fast),
    color var(--motion-fast),
    border-color var(--motion-fast),
    transform var(--motion-fast);
}

.ui-sidebar-nav-item:hover:not(.ui-sidebar-nav-item--active) {
  color: var(--color-text-primary);
  background: var(--color-outline-ghost);
}

/* O deslocamento é sutil de propósito: sinaliza que o item responde sem
   deslocar a leitura da lista. */
.ui-sidebar-nav-item:hover .ui-sidebar-nav-item__icon {
  transform: translateX(2px);
}

.ui-sidebar-nav-item--collapsed:hover .ui-sidebar-nav-item__icon {
  transform: scale(var(--motion-scale-hover, 1.012));
}

.ui-sidebar-nav-item:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: -2px;
  color: var(--color-text-primary);
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
  transition: transform var(--motion-fast);
}

.ui-sidebar-nav-item__label {
  white-space: nowrap;
  overflow: hidden;
}
</style>
