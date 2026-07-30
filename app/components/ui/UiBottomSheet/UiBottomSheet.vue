<script setup lang="ts">
import { computed, ref } from "vue";

import { useOverlayKeyboard } from "~/composables/useOverlayKeyboard/useOverlayKeyboard";
import type { UiBottomSheetProps } from "./UiBottomSheet.types";

const props = withDefaults(defineProps<UiBottomSheetProps>(), {
  maxWidth: "min(1080px, 100vw)",
  maxHeight: "min(720px, 92vh)",
  closeOnScrim: true,
  ariaLabel: "Painel",
});

const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

const panelRef = ref<HTMLElement | null>(null);

/** Solicita o fechamento do sheet. */
const close = (): void => {
  emit("update:modelValue", false);
};

/** Fecha ao clicar no scrim, quando permitido. */
const onScrimClick = (): void => {
  if (props.closeOnScrim) {
    close();
  }
};

// Esc, focus trap e travamento de scroll saíram daqui para um composable
// compartilhado — os drawers e o wizard precisavam do mesmo comportamento (#1266).
const { onKeydown } = useOverlayKeyboard({
  isOpen: computed((): boolean => props.modelValue),
  onClose: close,
  panel: panelRef,
  lockScroll: true,
});

</script>

<template>
  <Teleport to="body">
    <Transition name="ui-sheet">
      <div v-if="modelValue" class="ui-bottom-sheet" @keydown="onKeydown">
        <div class="ui-bottom-sheet__scrim" data-testid="ui-bottom-sheet-scrim" @click="onScrimClick" />
        <div
          ref="panelRef"
          class="ui-bottom-sheet__panel"
          role="dialog"
          aria-modal="true"
          :aria-label="ariaLabel"
          tabindex="-1"
          :style="{ maxWidth: props.maxWidth, maxHeight: props.maxHeight }"
        >
          <div class="ui-bottom-sheet__grabber" aria-hidden="true" />
          <header v-if="$slots.header" class="ui-bottom-sheet__header">
            <slot name="header" />
          </header>
          <div class="ui-bottom-sheet__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="ui-bottom-sheet__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ui-bottom-sheet {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.ui-bottom-sheet__scrim {
  position: absolute;
  inset: 0;
  background: rgba(16, 28, 33, 0.45);
  backdrop-filter: blur(2px);
}
.ui-bottom-sheet__panel {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg-surface);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  box-shadow: 0 -30px 90px rgba(16, 28, 33, 0.3);
}
.ui-bottom-sheet__grabber {
  flex-shrink: 0;
  width: 44px;
  height: 5px;
  margin: 12px auto 4px;
  border-radius: var(--radius-full);
  background: var(--color-outline-soft);
}
.ui-bottom-sheet__header {
  flex-shrink: 0;
  padding: var(--space-2) var(--space-4) var(--space-3);
}
.ui-bottom-sheet__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-1) var(--space-4) var(--space-3);
}
.ui-bottom-sheet__footer {
  flex-shrink: 0;
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-outline-soft);
  background: var(--color-bg-surface);
}

/* Transição: container faz fade; painel desliza de baixo. */
.ui-sheet-enter-active,
.ui-sheet-leave-active {
  transition: opacity var(--motion-duration-xl) var(--motion-ease-standard);
}
.ui-sheet-enter-from,
.ui-sheet-leave-to {
  opacity: 0;
}
.ui-sheet-enter-active .ui-bottom-sheet__panel,
.ui-sheet-leave-active .ui-bottom-sheet__panel {
  transition: transform var(--motion-duration-xl) var(--motion-ease-emphasized);
}
.ui-sheet-enter-from .ui-bottom-sheet__panel,
.ui-sheet-leave-to .ui-bottom-sheet__panel {
  transform: translateY(100%);
}
@media (prefers-reduced-motion: reduce) {
  .ui-sheet-enter-active .ui-bottom-sheet__panel,
  .ui-sheet-leave-active .ui-bottom-sheet__panel {
    transition: none;
  }
  .ui-sheet-enter-from .ui-bottom-sheet__panel,
  .ui-sheet-leave-to .ui-bottom-sheet__panel {
    transform: none;
  }
}
</style>
