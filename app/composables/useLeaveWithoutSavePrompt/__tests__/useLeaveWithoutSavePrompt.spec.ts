import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";

import { useLeaveWithoutSavePrompt } from "../useLeaveWithoutSavePrompt";

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
});
