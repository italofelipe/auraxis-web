<script setup lang="ts">
import { Menu, Moon, Sun } from "lucide-vue-next";
import type { UiTopbarProps, UiTopbarEmits } from "./UiTopbar.types";
import UiPageHeader from "../UiPageHeader/UiPageHeader.vue";
import UiUserMenu from "../UiUserMenu/UiUserMenu.vue";
import { useTheme } from "~/composables/useTheme";

const props = withDefaults(defineProps<UiTopbarProps>(), {
  subtitle: undefined,
  actions: () => [],
  userDescription: undefined,
  userAvatarUrl: undefined,
  showMenuButton: false,
});

const emit = defineEmits<UiTopbarEmits>();

const { isDark, toggle: toggleTheme } = useTheme();

</script>

<template>
  <header class="ui-topbar">
    <div class="ui-topbar__left">
      <button
        v-if="props.showMenuButton"
        class="ui-topbar__menu-btn"
        :aria-label="$t('ui.topbar.openMenu')"
        @click="emit('menu-toggle')"
      >
        <Menu :size="22" aria-hidden="true" />
      </button>
      <UiPageHeader :title="props.title" :subtitle="props.subtitle" />
    </div>

    <div class="ui-topbar__right">
      <button
        v-for="action in props.actions"
        :key="action.key"
        class="ui-topbar__action"
        :class="`ui-topbar__action--${action.variant}`"
        @click="emit('action', action.key)"
      >
        <component
          :is="action.icon"
          v-if="action.icon"
          :size="16"
          aria-hidden="true"
        />
        {{ action.label }}
      </button>

      <button
        class="ui-topbar__theme-toggle"
        :aria-label="$t('theme.toggle')"
        :title="isDark ? $t('theme.light') : $t('theme.dark')"
        @click="toggleTheme"
      >
        <Sun v-if="isDark" :size="18" aria-hidden="true" />
        <Moon v-else :size="18" aria-hidden="true" />
      </button>

      <UiUserMenu
        :name="props.userName"
        :description="props.userDescription"
        :avatar-url="props.userAvatarUrl"
        @settings="emit('user-settings')"
        @logout="emit('user-logout')"
      />
    </div>
  </header>
</template>

<style scoped>
.ui-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
  padding: 0 var(--space-4);
  background: var(--color-bg-base);
  border-bottom: 1px solid var(--color-outline-soft);
  flex-shrink: 0;
}
.ui-topbar__left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.ui-topbar__right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.ui-topbar__menu-btn {
  background: none;
  border: none;
  padding: 8px;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.ui-topbar__menu-btn:hover {
  background: var(--color-outline-ghost);
  color: var(--color-text-primary);
}
.ui-topbar__action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-body);
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s ease;
}
.ui-topbar__action--positive {
  background: var(--color-positive-bg);
  color: var(--color-positive);
  border-color: rgba(66, 232, 169, 0.2);
}
.ui-topbar__action--positive:hover {
  background: rgba(66, 232, 169, 0.15);
}
.ui-topbar__action--negative {
  background: var(--color-negative-bg);
  color: var(--color-negative);
  border-color: rgba(255, 111, 121, 0.2);
}
.ui-topbar__action--negative:hover {
  background: rgba(255, 111, 121, 0.15);
}
.ui-topbar__action--default {
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  border-color: var(--color-outline-soft);
}
.ui-topbar__action--default:hover {
  background: var(--color-outline-ghost);
  color: var(--color-text-primary);
}
.ui-topbar__theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  flex-shrink: 0;
}
.ui-topbar__theme-toggle:hover {
  background: var(--color-outline-ghost);
  color: var(--color-text-primary);
}
</style>
