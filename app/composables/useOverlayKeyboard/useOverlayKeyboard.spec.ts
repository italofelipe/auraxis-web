import { defineComponent, h, nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import { useOverlayKeyboard } from "./useOverlayKeyboard";

/**
 * Mounts a host component wired to the composable.
 *
 * @param options Test wiring.
 * @param options.withPanel Whether to pass a panel ref (enables the focus trap).
 * @param options.lockScroll Whether the overlay should lock body scroll.
 * @returns The mounted wrapper plus the reactive handles used by the test.
 */
function mountOverlay(options: { withPanel?: boolean; lockScroll?: boolean } = {}): {
  wrapper: ReturnType<typeof mount>;
  isOpen: ReturnType<typeof ref<boolean>>;
  onClose: ReturnType<typeof vi.fn>;
} {
  const isOpen = ref<boolean>(true);
  const onClose = vi.fn(() => { isOpen.value = false; });

  const Host = defineComponent({
    setup() {
      const panel = ref<HTMLElement | null>(null);
      useOverlayKeyboard({
        isOpen,
        onClose,
        ...(options.withPanel === true ? { panel } : {}),
        ...(options.lockScroll === true ? { lockScroll: true } : {}),
      });
      return { panel };
    },
    render() {
      return h("div", { ref: "panel", tabindex: -1 }, [
        h("button", { id: "first" }, "primeiro"),
        h("button", { id: "last" }, "último"),
      ]);
    },
  });

  return { wrapper: mount(Host, { attachTo: document.body }), isOpen, onClose };
}

describe("useOverlayKeyboard", () => {
  it("closes on Escape while open", () => {
    const { onClose } = mountOverlay();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores Escape once the overlay is closed", async () => {
    const { isOpen, onClose } = mountOverlay();

    isOpen.value = false;
    await nextTick();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("cycles focus back to the first element when tabbing past the last", async () => {
    const { wrapper } = mountOverlay({ withPanel: true });
    // O overlay leva o foco para o painel ao abrir; espera isso acontecer
    // antes de posicionar o foco onde o teste precisa.
    await nextTick();
    const first = wrapper.find("#first").element as HTMLElement;
    const last = wrapper.find("#last").element as HTMLElement;

    last.focus();
    const event = new KeyboardEvent("keydown", { key: "Tab", cancelable: true });
    document.dispatchEvent(event);
    await nextTick();

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it("cycles focus to the last element on shift+Tab from the first", async () => {
    const { wrapper } = mountOverlay({ withPanel: true });
    await nextTick();
    const first = wrapper.find("#first").element as HTMLElement;
    const last = wrapper.find("#last").element as HTMLElement;

    first.focus();
    const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, cancelable: true });
    document.dispatchEvent(event);
    await nextTick();

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
  });

  it("restores focus to the opener when it closes", async () => {
    const opener = document.createElement("button");
    document.body.appendChild(opener);
    opener.focus();

    const { isOpen } = mountOverlay({ withPanel: true });
    await nextTick();

    isOpen.value = false;
    await nextTick();

    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it("locks body scroll only when asked", async () => {
    const { isOpen } = mountOverlay({ withPanel: true, lockScroll: true });
    await nextTick();
    expect(document.body.style.overflow).toBe("hidden");

    isOpen.value = false;
    await nextTick();
    expect(document.body.style.overflow).toBe("");
  });

  it("stops listening after unmount", () => {
    const { wrapper, onClose } = mountOverlay();

    wrapper.unmount();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onClose).not.toHaveBeenCalled();
  });
});
