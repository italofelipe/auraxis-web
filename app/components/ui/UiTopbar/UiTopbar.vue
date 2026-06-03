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
        @onboarding="emit('user-onboarding')"
        @logout="emit('user-logout')"
      />
    </div>

    <div
      class="ui-topbar__extras-row"
      data-testid="topbar-extras-row"
    >
      <slot name="extras" />
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
  order: 1;
}
.ui-topbar__right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  order: 3;
}
/*
 * Desktop (>=768px): single-row layout. The extras-row sits inline between the
 * left block and the right controls (badge → theme → avatar), matching the
 * previous single-row visual. order + margin-left:auto group it on the right.
 */
.ui-topbar__extras-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  order: 2;
  margin-left: auto;
  margin-right: var(--space-2);
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
  border-color: var(--color-positive-border);
}
.ui-topbar__action--positive:hover {
  background: var(--color-positive-hover);
}
.ui-topbar__action--negative {
  background: var(--color-negative-bg);
  color: var(--color-negative);
  border-color: var(--color-negative-border);
}
.ui-topbar__action--negative:hover {
  background: var(--color-negative-hover);
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

/*
 * Mobile (<=767.98px): two-tier header.
 * Row 1: left (hamburger + title/subtitle) + theme toggle + avatar.
 * Row 2: extras-row (Premium badge) full-width, left-aligned.
 * flex-wrap lets the extras-row drop to its own line; flex-basis:100% makes it
 * span the full width below row 1.
 */
@media (max-width: 767.98px) {
  .ui-topbar {
    flex-wrap: wrap;
    align-items: center;
    height: auto;
    min-height: 64px;
    padding-top: var(--space-2);
    padding-bottom: var(--space-2);
    /*
     * NO `row-gap` here: a wrapped flex line is created for the extras-row even
     * when its only child is a comment node (free user → badge renders nothing),
     * and `row-gap` would add visible space above that empty line. Vertical
     * spacing for the second row lives on the rendered badge content instead
     * (`.ui-topbar__extras-row > *`), so an empty wrapper has ZERO footprint.
     */
  }
  .ui-topbar__left {
    order: 1;
    min-width: 0;
    flex: 1 1 auto;
  }
  .ui-topbar__right {
    order: 2;
    margin-left: auto;
  }
  .ui-topbar__extras-row {
    order: 3;
    flex-basis: 100%;
    margin-left: 0;
    margin-right: 0;
    justify-content: flex-start;
  }
  /*
   * Spacing between row 1 and row 2 is carried by the rendered badge itself.
   * When the slot renders nothing (only a `<!--v-if-->` comment node), there is
   * no element child, `> *` matches nothing, and the wrapper collapses to 0
   * height — no empty second row, no extra vertical space for free users.
   */
  .ui-topbar__extras-row > * {
    margin-top: var(--space-2);
  }
}
</style>
