import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDirtyGuard } from "../useDirtyGuard";

const mockWarning = vi.fn();

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

describe("useDirtyGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isDirty starts as false", () => {
    const { isDirty } = useDirtyGuard();
    expect(isDirty.value).toBe(false);
  });

  it("markDirty sets isDirty to true", () => {
    const { isDirty, markDirty } = useDirtyGuard();
    markDirty();
    expect(isDirty.value).toBe(true);
  });

  it("reset sets isDirty back to false", () => {
    const { isDirty, markDirty, reset } = useDirtyGuard();
    markDirty();
    reset();
    expect(isDirty.value).toBe(false);
  });

  it("guard calls onConfirm immediately when form is clean", () => {
    const { guard } = useDirtyGuard();
    const onConfirm = vi.fn();

    guard(onConfirm);

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(mockWarning).not.toHaveBeenCalled();
  });

  it("guard shows dialog and does NOT call onConfirm immediately when form is dirty", () => {
    const { markDirty, guard } = useDirtyGuard();
    const onConfirm = vi.fn();

    markDirty();
    guard(onConfirm);

    expect(mockWarning).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("guard calls onConfirm when user confirms the dialog", () => {
    const { markDirty, guard } = useDirtyGuard();
    const onConfirm = vi.fn();

    mockWarning.mockImplementation((opts: { onPositiveClick: () => void }): void => {
      opts.onPositiveClick();
    });

    markDirty();
    guard(onConfirm);

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("guard resets isDirty after user confirms discard", () => {
    const { isDirty, markDirty, guard } = useDirtyGuard();
    const onConfirm = vi.fn();

    mockWarning.mockImplementation((opts: { onPositiveClick: () => void }): void => {
      opts.onPositiveClick();
    });

    markDirty();
    guard(onConfirm);

    expect(isDirty.value).toBe(false);
  });

  it("guard shows dialog with translated keys for title and content", () => {
    const { markDirty, guard } = useDirtyGuard();

    markDirty();
    guard(vi.fn());

    expect(mockWarning).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "dirtyGuard.title",
        content: "dirtyGuard.content",
        positiveText: "dirtyGuard.positiveText",
        negativeText: "dirtyGuard.negativeText",
      }),
    );
  });
});
