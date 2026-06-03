import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { useToast, __resetToastDedupForTests } from "./useToast";

// ── Mock Naive UI useMessage ───────────────────────────────────────────────────
// Each call returns a message handle exposing a `destroy` spy, mirroring the
// real Naive UI `MessageReactive` so the dedup lifecycle can be exercised.
const mockDestroy = vi.fn();
/**
 * Builds a fake Naive UI message handle exposing a `destroy` spy.
 * @returns A minimal `MessageReactive`-like object.
 */
const makeHandle = (): { destroy: typeof mockDestroy } => ({ destroy: mockDestroy });
const mockSuccess = vi.fn(makeHandle);
const mockError = vi.fn(makeHandle);
const mockWarning = vi.fn(makeHandle);
const mockInfo = vi.fn(makeHandle);

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
    __resetToastDedupForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
    __resetToastDedupForTests();
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
        onClose: expect.any(Function),
      });
    });

    it("allows overriding duration and closable", () => {
      const { success } = useToast();
      success("OK", { duration: 2_000, closable: false });

      expect(mockSuccess).toHaveBeenCalledWith("OK", {
        duration: 2_000,
        closable: false,
        onClose: expect.any(Function),
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
        onClose: expect.any(Function),
      });
    });

    it("allows overriding duration", () => {
      const { error } = useToast();
      error("Erro grave", { duration: 8_000 });

      expect(mockError).toHaveBeenCalledWith("Erro grave", {
        duration: 8_000,
        closable: true,
        onClose: expect.any(Function),
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
        onClose: expect.any(Function),
      });
    });

    it("allows overriding closable", () => {
      const { warning } = useToast();
      warning("Aviso persistente", { closable: false });

      expect(mockWarning).toHaveBeenCalledWith("Aviso persistente", {
        duration: 4_000,
        closable: false,
        onClose: expect.any(Function),
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
        onClose: expect.any(Function),
      });
    });

    it("allows overriding all options", () => {
      const { info } = useToast();
      info("Informação breve", { duration: 1_000, closable: false });

      expect(mockInfo).toHaveBeenCalledWith("Informação breve", {
        duration: 1_000,
        closable: false,
        onClose: expect.any(Function),
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

  describe("dedup (#977)", () => {
    it("suppresses an identical toast while one with the same key is active", () => {
      const { error } = useToast();
      error("X");
      error("X");

      // Second identical call is swallowed — Naive UI is hit only once.
      expect(mockError).toHaveBeenCalledOnce();
    });

    it("shows the toast again after the active one expires", () => {
      vi.useFakeTimers();
      const { error } = useToast();

      error("X");
      error("X");
      expect(mockError).toHaveBeenCalledOnce();

      // Advance past duration + buffer so the key is released.
      vi.advanceTimersByTime(4_000 + 500);

      error("X");
      expect(mockError).toHaveBeenCalledTimes(2);
    });

    it("does not suppress two DIFFERENT messages of the same severity", () => {
      const { error } = useToast();
      error("X");
      error("Y");

      expect(mockError).toHaveBeenCalledTimes(2);
    });

    it("does not suppress the same text across different severities", () => {
      const toast = useToast();
      toast.error("Same");
      toast.warning("Same");

      expect(mockError).toHaveBeenCalledOnce();
      expect(mockWarning).toHaveBeenCalledOnce();
    });

    it("create/update/delete each still show exactly one success toast", () => {
      const { success } = useToast();
      success("Criado com sucesso.");
      success("Atualizado com sucesso.");
      success("Removido com sucesso.");

      expect(mockSuccess).toHaveBeenCalledTimes(3);
    });
  });
});
