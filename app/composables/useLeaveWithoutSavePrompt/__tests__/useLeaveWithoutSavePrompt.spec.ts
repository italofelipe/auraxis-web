import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineComponent, h, ref } from "vue";
import { mount } from "@vue/test-utils";

import { useLeaveWithoutSavePrompt } from "../useLeaveWithoutSavePrompt";
import type { LeaveWithoutSavePromptReturn } from "../useLeaveWithoutSavePrompt.types";

const mockWarning = vi.fn();
let routeLeaveGuard: ((to: unknown, from: unknown, next: (proceed?: boolean) => void) => Promise<void> | void) | null = null;

vi.mock("naive-ui", (): Record<string, unknown> => ({
  useDialog: (): { warning: ReturnType<typeof vi.fn> } => ({
    warning: mockWarning,
  }),
}));

vi.mock("vue-i18n", (): Record<string, unknown> => ({
  useI18n: (): { t: (key: string) => string } => ({
    t: (key: string): string => key,
  }),
}));

vi.mock("vue-router", (): Record<string, unknown> => ({
  onBeforeRouteLeave: (
    cb: (to: unknown, from: unknown, next: (proceed?: boolean) => void) => Promise<void> | void,
  ): void => {
    routeLeaveGuard = cb;
  },
}));

describe("useLeaveWithoutSavePrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeLeaveGuard = null;
  });

  it("does not show the prompt when isDirty is false", async () => {
    const isDirty = ref(false);
    useLeaveWithoutSavePrompt({ isDirty, onSave: vi.fn() });

    const next = vi.fn();
    await routeLeaveGuard?.(null, null, next);

    expect(mockWarning).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it("renders the prompt copy from the leaveWithoutSavePrompt namespace", async () => {
    const isDirty = ref(true);
    useLeaveWithoutSavePrompt({ isDirty, onSave: vi.fn() });

    mockWarning.mockImplementation(() => {
      // Don't resolve — assertion happens before user picks an action.
    });
    const next = vi.fn();
    void routeLeaveGuard?.(null, null, next);

    expect(mockWarning).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "leaveWithoutSavePrompt.title",
        content: "leaveWithoutSavePrompt.content",
        positiveText: "leaveWithoutSavePrompt.positiveText",
        negativeText: "leaveWithoutSavePrompt.negativeText",
      }),
    );
  });

  it("invokes onSave and lets the navigation proceed when user picks 'Salvar e sair'", async () => {
    const isDirty = ref(true);
    const onSave = vi.fn().mockResolvedValue(undefined);
    useLeaveWithoutSavePrompt({ isDirty, onSave });

    mockWarning.mockImplementation((opts: { onPositiveClick: () => Promise<void> }) => {
      void opts.onPositiveClick();
    });
    const next = vi.fn();
    await routeLeaveGuard?.(null, null, next);

    expect(onSave).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(true);
  });

  it("invokes onDiscard and proceeds when user picks 'Descartar e sair'", async () => {
    const isDirty = ref(true);
    const onDiscard = vi.fn();
    useLeaveWithoutSavePrompt({ isDirty, onSave: vi.fn(), onDiscard });

    mockWarning.mockImplementation((opts: { onNegativeClick: () => void }) => {
      opts.onNegativeClick();
    });
    const next = vi.fn();
    await routeLeaveGuard?.(null, null, next);

    expect(onDiscard).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(true);
  });

  it("blocks the navigation when user closes the modal (Cancelar)", async () => {
    const isDirty = ref(true);
    useLeaveWithoutSavePrompt({ isDirty, onSave: vi.fn() });

    mockWarning.mockImplementation((opts: { onClose: () => void }) => {
      opts.onClose();
    });
    const next = vi.fn();
    await routeLeaveGuard?.(null, null, next);

    expect(next).toHaveBeenCalledWith(false);
  });

  it("surfaces the save error and refuses to navigate when onSave rejects", async () => {
    const isDirty = ref(true);
    const onSave = vi.fn().mockRejectedValue(new Error("network down"));
    const { saveError } = useLeaveWithoutSavePrompt({ isDirty, onSave });

    mockWarning.mockImplementation((opts: { onPositiveClick: () => Promise<void> }) => {
      void opts.onPositiveClick();
    });
    const next = vi.fn();
    await routeLeaveGuard?.(null, null, next);

    expect(next).toHaveBeenCalledWith(false);
    expect(saveError.value).toBeInstanceOf(Error);
  });

  it("confirmLeave returns true immediately when not dirty", async () => {
    const isDirty = ref(false);
    const { confirmLeave } = useLeaveWithoutSavePrompt({ isDirty, onSave: vi.fn() });

    expect(await confirmLeave()).toBe(true);
    expect(mockWarning).not.toHaveBeenCalled();
  });

  it("confirmLeave shows the prompt when dirty and resolves with the user choice", async () => {
    const isDirty = ref(true);
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { confirmLeave } = useLeaveWithoutSavePrompt({ isDirty, onSave });

    mockWarning.mockImplementation((opts: { onPositiveClick: () => Promise<void> }) => {
      void opts.onPositiveClick();
    });

    await expect(confirmLeave()).resolves.toBe(true);
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("registers a beforeunload listener on mount and removes it on unmount", () => {
    const isDirty = ref(false);
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const wrapper = mount(
      defineComponent({
        setup(): () => ReturnType<typeof h> {
          useLeaveWithoutSavePrompt({ isDirty, onSave: vi.fn() });
          return (): ReturnType<typeof h> => h("div");
        },
      }),
    );

    expect(addSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
    wrapper.unmount();
    expect(removeSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("the beforeunload listener prevents navigation only when isDirty is true", () => {
    const isDirty = ref(false);
    const captured: { handler: ((e: BeforeUnloadEvent) => void) | null } = { handler: null };
    const addSpy = vi
      .spyOn(window, "addEventListener")
      .mockImplementation((event: string, handler: EventListenerOrEventListenerObject) => {
        if (event === "beforeunload") {
          captured.handler = handler as (e: BeforeUnloadEvent) => void;
        }
      });

    mount(
      defineComponent({
        setup(): () => ReturnType<typeof h> {
          useLeaveWithoutSavePrompt({ isDirty, onSave: vi.fn() });
          return (): ReturnType<typeof h> => h("div");
        },
      }),
    );

    const cleanEvent = { preventDefault: vi.fn(), returnValue: "" } as unknown as BeforeUnloadEvent;
    captured.handler?.(cleanEvent);
    expect(cleanEvent.preventDefault).not.toHaveBeenCalled();

    isDirty.value = true;
    const dirtyEvent = { preventDefault: vi.fn(), returnValue: "" } as unknown as BeforeUnloadEvent;
    captured.handler?.(dirtyEvent);
    expect(dirtyEvent.preventDefault).toHaveBeenCalledOnce();
    expect(dirtyEvent.returnValue).not.toBe("");

    addSpy.mockRestore();
  });

  it("isSaving toggles around onSave invocation", async () => {
    const isDirty = ref(true);
    let observedDuringSave: boolean | null = null;
    const onSave = vi.fn().mockImplementation(async () => {
      observedDuringSave = state.isSaving.value;
    });
    const state: LeaveWithoutSavePromptReturn = useLeaveWithoutSavePrompt({ isDirty, onSave });

    mockWarning.mockImplementation((opts: { onPositiveClick: () => Promise<void> }) => {
      void opts.onPositiveClick();
    });

    await routeLeaveGuard?.(null, null, vi.fn());

    expect(observedDuringSave).toBe(true);
    expect(state.isSaving.value).toBe(false);
  });
});
