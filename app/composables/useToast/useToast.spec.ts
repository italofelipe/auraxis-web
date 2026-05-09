import { describe, expect, it, vi, beforeEach } from "vitest";
import { useToast } from "./useToast";

// ── Mock Naive UI useMessage ───────────────────────────────────────────────────
const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockWarning = vi.fn();
const mockInfo = vi.fn();

vi.mock("naive-ui", (): Record<string, unknown> => ({
  useMessage: (): Record<string, unknown> => ({
    success: mockSuccess,
    error: mockError,
    warning: mockWarning,
    info: mockInfo,
  }),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useToast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the four toast helpers", () => {
    const toast = useToast();

    expect(toast).toHaveProperty("success");
    expect(toast).toHaveProperty("error");
    expect(toast).toHaveProperty("warning");
    expect(toast).toHaveProperty("info");
  });

  describe("success()", () => {
    it("calls message.success with the provided message and default options", () => {
      const { success } = useToast();
      success("Operação realizada com sucesso.");

      expect(mockSuccess).toHaveBeenCalledOnce();
      expect(mockSuccess).toHaveBeenCalledWith("Operação realizada com sucesso.", {
        duration: 4_000,
        closable: true,
      });
    });

    it("allows overriding duration and closable", () => {
      const { success } = useToast();
      success("OK", { duration: 2_000, closable: false });

      expect(mockSuccess).toHaveBeenCalledWith("OK", {
        duration: 2_000,
        closable: false,
      });
    });
  });

  describe("error()", () => {
    it("calls message.error with default options", () => {
      const { error } = useToast();
      error("Algo deu errado.");

      expect(mockError).toHaveBeenCalledOnce();
      expect(mockError).toHaveBeenCalledWith("Algo deu errado.", {
        duration: 4_000,
        closable: true,
      });
    });

    it("allows overriding duration", () => {
      const { error } = useToast();
      error("Erro grave", { duration: 8_000 });

      expect(mockError).toHaveBeenCalledWith("Erro grave", {
        duration: 8_000,
        closable: true,
      });
    });
  });

  describe("warning()", () => {
    it("calls message.warning with default options", () => {
      const { warning } = useToast();
      warning("Atenção.");

      expect(mockWarning).toHaveBeenCalledOnce();
      expect(mockWarning).toHaveBeenCalledWith("Atenção.", {
        duration: 4_000,
        closable: true,
      });
    });

    it("allows overriding closable", () => {
      const { warning } = useToast();
      warning("Aviso persistente", { closable: false });

      expect(mockWarning).toHaveBeenCalledWith("Aviso persistente", {
        duration: 4_000,
        closable: false,
      });
    });
  });

  describe("info()", () => {
    it("calls message.info with default options", () => {
      const { info } = useToast();
      info("Dica do sistema.");

      expect(mockInfo).toHaveBeenCalledOnce();
      expect(mockInfo).toHaveBeenCalledWith("Dica do sistema.", {
        duration: 4_000,
        closable: true,
      });
    });

    it("allows overriding all options", () => {
      const { info } = useToast();
      info("Informação breve", { duration: 1_000, closable: false });

      expect(mockInfo).toHaveBeenCalledWith("Informação breve", {
        duration: 1_000,
        closable: false,
      });
    });
  });

  it("uses independent message calls — no cross-contamination between severity levels", () => {
    const toast = useToast();
    toast.success("s");
    toast.error("e");
    toast.warning("w");
    toast.info("i");

    expect(mockSuccess).toHaveBeenCalledOnce();
    expect(mockError).toHaveBeenCalledOnce();
    expect(mockWarning).toHaveBeenCalledOnce();
    expect(mockInfo).toHaveBeenCalledOnce();
  });
});
