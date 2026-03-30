<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Settings, LogOut, ChevronRight } from "lucide-vue-next";
import type { UiUserMenuProps, UiUserMenuEmits } from "./UiUserMenu.types";


const props = withDefaults(defineProps<UiUserMenuProps>(), {
  description: undefined,
  avatarUrl: undefined,
});

const emit = defineEmits<UiUserMenuEmits>();

const isOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

const initial = computed(() => props.name.charAt(0).toUpperCase());

/** Toggles the dropdown open/closed state. */
function toggle(): void {
  isOpen.value = !isOpen.value;
}

/** Closes the dropdown. */
function close(): void {
  isOpen.value = false;
}

/**
 * Closes the dropdown if a click occurs outside the menu element.
 * @param event - The mousedown event from document listener.
 */
function handleClickOutside(event: MouseEvent): void {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    close();
  }
}

onMounted(() => document.addEventListener("mousedown", handleClickOutside));
onUnmounted(() => document.removeEventListener("mousedown", handleClickOutside));
</script>

<template>
  <div ref="menuRef" class="ui-user-menu">
    <button
      class="ui-user-menu__trigger"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      @click="toggle"
    >
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        :alt="name"
        class="ui-user-menu__avatar"
      >
      <span
        v-else
        class="ui-user-menu__avatar ui-user-menu__avatar--fallback"
        aria-hidden="true"
      >
        {{ initial }}
      </span>
      <ChevronRight
        :size="14"
        class="ui-user-menu__chevron"
        :class="{ 'ui-user-menu__chevron--open': isOpen }"
        aria-hidden="true"
      />
    </button>

    <div
      v-if="isOpen"
      class="ui-user-menu__dropdown"
      role="menu"
    >
      <div class="ui-user-menu__user-info">
        <p class="ui-user-menu__user-name">{{ name }}</p>
        <p v-if="description" class="ui-user-menu__user-desc">{{ description }}</p>
      </div>
      <hr class="ui-user-menu__divider" >
      <button
        class="ui-user-menu__item"
        role="menuitem"
        @click="emit('settings'); close()"
      >
        <Settings :size="16" aria-hidden="true" />
        {{ $t('ui.userMenu.settings') }}
      </button>
      <button
        class="ui-user-menu__item ui-user-menu__item--danger"
        role="menuitem"
        @click="emit('logout'); close()"
      >
        <LogOut :size="16" aria-hidden="true" />
        {{ $t('ui.userMenu.logout') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.ui-user-menu {
  position: relative;
}
.ui-user-menu__trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-md);
  transition: background 0.15s ease;
}
.ui-user-menu__trigger:hover {
  background: var(--color-outline-ghost);
}
.ui-user-menu__avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 1px solid var(--color-outline-soft);
}
.ui-user-menu__avatar--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-brand-glow-xs);
  color: var(--color-brand-600);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-md);
}
.ui-user-menu__chevron {
  color: var(--color-text-muted);
  transition: transform 0.15s ease;
}
.ui-user-menu__chevron--open {
  transform: rotate(90deg);
}
.ui-user-menu__dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  z-index: 100;
  min-width: 200px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.ui-user-menu__user-info {
  padding: var(--space-2);
}
.ui-user-menu__user-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  margin: 0;
}
.ui-user-menu__user-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 2px 0 0;
}
.ui-user-menu__divider {
  border: none;
  border-top: 1px solid var(--color-outline-subtle);
  margin: 0;
}
.ui-user-menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px var(--space-2);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-family: var(--font-body);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, color 0.15s ease;
}
.ui-user-menu__item:hover {
  background: var(--color-outline-ghost);
  color: var(--color-text-primary);
}
.ui-user-menu__item--danger:hover {
  color: var(--color-negative);
}
</style>
