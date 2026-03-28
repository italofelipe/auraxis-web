import { describe, it, expect, vi, beforeEach } from "vitest";
import { useConfirm } from "../useConfirm";

const mockWarning = vi.fn();

vi.mock("naive-ui", (): Record<string, unknown> => ({
  useDialog: () => ({
    warning: mockWarning,
  }),
}));

describe("useConfirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls dialog.warning with the provided title and content", () => {
    const { confirm } = useConfirm();
    const onConfirm = vi.fn();

    confirm({ title: "Excluir?", content: "Não pode desfazer.", onConfirm });

    expect(mockWarning).toHaveBeenCalledOnce();
    expect(mockWarning).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Excluir?", content: "Não pode desfazer." }),
    );
  });

  it("uses default button labels when not provided", () => {
    const { confirm } = useConfirm();
    confirm({ title: "T", content: "C", onConfirm: vi.fn() });

    expect(mockWarning).toHaveBeenCalledWith(
      expect.objectContaining({ positiveText: "Confirmar", negativeText: "Cancelar" }),
    );
  });

  it("uses custom button labels when provided", () => {
    const { confirm } = useConfirm();
    confirm({
      title: "T",
      content: "C",
      positiveText: "Sim, excluir",
      negativeText: "Não, voltar",
      onConfirm: vi.fn(),
    });

    expect(mockWarning).toHaveBeenCalledWith(
      expect.objectContaining({ positiveText: "Sim, excluir", negativeText: "Não, voltar" }),
    );
  });

  it("wires onConfirm to onPositiveClick", () => {
    const { confirm } = useConfirm();
    const onConfirm = vi.fn();
    confirm({ title: "T", content: "C", onConfirm });

    expect(mockWarning).toHaveBeenCalledWith(
      expect.objectContaining({ onPositiveClick: onConfirm }),
    );
  });

  it("wires onCancel to onNegativeClick", () => {
    const { confirm } = useConfirm();
    const onCancel = vi.fn();
    confirm({ title: "T", content: "C", onConfirm: vi.fn(), onCancel });

    expect(mockWarning).toHaveBeenCalledWith(
      expect.objectContaining({ onNegativeClick: onCancel }),
    );
  });

  it("onNegativeClick is undefined when onCancel not provided", () => {
    const { confirm } = useConfirm();
    confirm({ title: "T", content: "C", onConfirm: vi.fn() });

    expect(mockWarning).toHaveBeenCalledWith(
      expect.objectContaining({ onNegativeClick: undefined }),
    );
  });
});
