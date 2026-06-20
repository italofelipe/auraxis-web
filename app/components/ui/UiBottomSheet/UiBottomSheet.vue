<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from "vue";

import type { UiBottomSheetProps } from "./UiBottomSheet.types";

const props = withDefaults(defineProps<UiBottomSheetProps>(), {
  maxWidth: "min(1080px, 100vw)",
  maxHeight: "min(720px, 92vh)",
  closeOnScrim: true,
  ariaLabel: "Painel",
});

const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

const panelRef = ref<HTMLElement | null>(null);
const previouslyFocused = ref<HTMLElement | null>(null);

const FOCUSABLE =
  "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])";

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

/**
 * Mantém o foco preso ao painel ao tabular nas bordas.
 *
 * @param event Evento de teclado.
 */
const trapTab = (event: KeyboardEvent): void => {
  const panel = panelRef.value;
  if (!panel) {
    return;
  }
  const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (focusables.length === 0) {
    return;
  }
  const first = focusables[0]!;
  const last = focusables[focusables.length - 1]!;
  const active = document.activeElement;
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
};

/**
 * Trata Esc (fechar) e Tab (focus trap).
 *
 * @param event Evento de teclado.
 */
const onKeydown = (event: KeyboardEvent): void => {
  if (event.key === "Escape") {
    close();
    return;
  }
  if (event.key === "Tab") {
    trapTab(event);
  }
};

watch(
  () => props.modelValue,
  async (open) => {
    if (typeof document === "undefined") {
      return;
    }
    if (open) {
      previouslyFocused.value = document.activeElement as HTMLElement | null;
      document.body.style.overflow = "hidden";
      await nextTick();
      panelRef.value?.focus();
    } else {
      document.body.style.overflow = "";
      previouslyFocused.value?.focus?.();
    }
  },
);

onBeforeUnmount(() => {
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
  }
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
