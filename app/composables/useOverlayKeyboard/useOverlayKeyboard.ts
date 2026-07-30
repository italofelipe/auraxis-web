import { nextTick, onBeforeUnmount, ref, watch, type Ref } from "vue";

/** Selector for elements that can hold focus inside an overlay. */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export interface UseOverlayKeyboardOptions {
  /** Whether the overlay is currently on screen. */
  readonly isOpen: Ref<boolean> | (() => boolean);
  /** Called when the user presses Escape. */
  readonly onClose: () => void;
  /**
   * Panel that should hold the focus while open. Omit for overlays that only
   * need Escape (a drawer that keeps the page behind it usable, for example).
   */
  readonly panel?: Ref<HTMLElement | null>;
  /** Whether to lock body scroll while open. Defaults to false. */
  readonly lockScroll?: boolean;
}

export interface UseOverlayKeyboard {
  /** Attach to the overlay root when the listener should be local. */
  readonly onKeydown: (event: KeyboardEvent) => void;
}

/**
 * Gives an overlay the keyboard behaviour a click-outside backdrop cannot:
 * Escape closes it, Tab cycles inside the panel, and focus returns to whatever
 * opened it.
 *
 * A backdrop is not a control — adding `role="button"` and `tabindex` to it
 * announces a fake button to screen readers. The accessible answer is this:
 * a keyboard route in and out of the panel (#1266).
 *
 * @param options Overlay wiring.
 * @returns Keydown handler for callers that prefer a local listener.
 */
export function useOverlayKeyboard(options: UseOverlayKeyboardOptions): UseOverlayKeyboard {
  const previouslyFocused = ref<HTMLElement | null>(null);

  /**
   * Reads the current open state from either supported shape.
   *
   * @returns Whether the overlay is open.
   */
  function readIsOpen(): boolean {
    return typeof options.isOpen === "function" ? options.isOpen() : options.isOpen.value;
  }

  /**
   * Keeps focus inside the panel when tabbing past its edges.
   *
   * @param event Keyboard event.
   */
  function trapTab(event: KeyboardEvent): void {
    const panel = options.panel?.value;
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
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /**
   * Handles Escape (close) and Tab (focus trap) while the overlay is open.
   *
   * @param event Keyboard event.
   */
  function onKeydown(event: KeyboardEvent): void {
    if (!readIsOpen()) {
      return;
    }

    if (event.key === "Escape") {
      event.stopPropagation();
      options.onClose();
      return;
    }

    if (event.key === "Tab") {
      trapTab(event);
    }
  }

  if (import.meta.client) {
    document.addEventListener("keydown", onKeydown);

    onBeforeUnmount(() => {
      document.removeEventListener("keydown", onKeydown);
      if (options.lockScroll === true) {
        document.body.style.overflow = "";
      }
    });
  }

  // immediate: um overlay pode montar já aberto (v-if no pai), e nesse caso
  // ainda precisa travar o scroll e levar o foco para dentro.
  watch(
    () => readIsOpen(),
    async (open) => {
      if (!import.meta.client) {
        return;
      }

      if (open) {
        previouslyFocused.value = document.activeElement as HTMLElement | null;
        if (options.lockScroll === true) {
          document.body.style.overflow = "hidden";
        }
        await nextTick();
        options.panel?.value?.focus();
        return;
      }

      if (options.lockScroll === true) {
        document.body.style.overflow = "";
      }
      previouslyFocused.value?.focus?.();
    },
    { immediate: true },
  );

  return { onKeydown };
}
