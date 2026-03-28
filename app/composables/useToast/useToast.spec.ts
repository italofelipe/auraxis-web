import { describe, it, expect, vi, beforeEach } from "vitest";
import { useToast } from "./useToast";

const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockWarning = vi.fn();
const mockInfo = vi.fn();

vi.mock("naive-ui", (): Record<string, unknown> => ({
  useMessage: () => ({
    success: mockSuccess,
    error: mockError,
    warning: mockWarning,
    info: mockInfo,
  }),
}));

describe("useToast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls message.success with content and default duration", () => {
    const toast = useToast();
    toast.success("Salvo com sucesso!");
    expect(mockSuccess).toHaveBeenCalledWith("Salvo com sucesso!", { duration: 3000 });
  });

  it("calls message.error with content and default duration", () => {
    const toast = useToast();
    toast.error("Algo deu errado.");
    expect(mockError).toHaveBeenCalledWith("Algo deu errado.", { duration: 3000 });
  });

  it("calls message.warning with content and default duration", () => {
    const toast = useToast();
    toast.warning("Atenção ao limite.");
    expect(mockWarning).toHaveBeenCalledWith("Atenção ao limite.", { duration: 3000 });
  });

  it("calls message.info with content and default duration", () => {
    const toast = useToast();
    toast.info("Sincronizado.");
    expect(mockInfo).toHaveBeenCalledWith("Sincronizado.", { duration: 3000 });
  });

  it("respects a custom duration option", () => {
    const toast = useToast();
    toast.success("Feito!", { duration: 5000 });
    expect(mockSuccess).toHaveBeenCalledWith("Feito!", { duration: 5000 });
  });

  it("respects duration 0 (no auto-dismiss)", () => {
    const toast = useToast();
    toast.error("Erro crítico", { duration: 0 });
    expect(mockError).toHaveBeenCalledWith("Erro crítico", { duration: 0 });
  });
});
