import { ref } from "vue";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useToolPage, type UseToolPageOptions } from "./use-tool-page";

interface TestForm extends Record<string, unknown> {
  amount: number;
}

interface TestResult {
  netAmount: number;
}

const mockT = vi.fn((key: string) => key);
const mockToast = { error: vi.fn(), success: vi.fn() };
const mockGetErrorMessage = vi.fn((err: unknown) => String(err));
const mockMutateAsync = vi.fn();
const mockGoalMutateAsync = vi.fn();

vi.mock("~/core/observability", () => ({
  captureException: vi.fn(),
}));

vi.mock("./use-tool-page-context", () => ({
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  useToolPageContext: () => ({
    t: mockT,
    n: vi.fn(),
    toast: mockToast,
    getErrorMessage: mockGetErrorMessage,
    router: {},
    sessionStore: {},
    isAuthenticated: ref(true),
    hasPremiumAccess: ref(false),
    formatBrl: vi.fn((v: number) => `R$ ${v}`),
  }),
}));

vi.mock("~/features/simulations/queries/use-save-simulation-mutation", () => ({
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  useSaveSimulationMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: ref(false),
  }),
}));

vi.mock("~/features/goals/queries/use-create-goal-mutation", () => ({
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  useCreateGoalMutation: () => ({
    mutateAsync: mockGoalMutateAsync,
    isPending: ref(false),
  }),
}));

/**
 * Returns a default form state for testing.
 *
 * @returns Default TestForm instance.
 */
function createDefaultState(): TestForm {
  return { amount: 0 };
}

/**
 * Builds UseToolPageOptions with vi.fn spies for assertions.
 *
 * @param withGoal - When true, includes a getGoalPayload spy.
 * @returns Options object for useToolPage.
 */
function makeOptions(withGoal = false): UseToolPageOptions<TestForm, TestResult> {
  return {
    createDefaultState,
    buildSimulationPayload: vi.fn(({ form, result, t }) => ({
      name: t("test.simulation.name"),
      toolSlug: "test_tool",
      inputs: { ...form },
      result: { netAmount: result.netAmount },
    })),
    ...(withGoal
      ? {
          getGoalPayload: vi.fn(({ result }) => ({
            name: "Test Goal",
            target_amount: result.netAmount,
          })),
        }
      : {}),
  };
}

describe("useToolPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ id: "sim-123" });
    mockGoalMutateAsync.mockResolvedValue({ id: "goal-abc" });
  });

  it("starts with clean state", () => {
    const { result, savedSimulationId, goalAdded, isSaved, isBridging } = useToolPage(makeOptions());
    expect(result.value).toBeNull();
    expect(savedSimulationId.value).toBeNull();
    expect(goalAdded.value).toBe(false);
    expect(isSaved.value).toBe(false);
    expect(isBridging.value).toBe(false);
  });

  it("form state is initialized from createDefaultState", () => {
    const { form } = useToolPage(makeOptions());
    expect(form.value).toEqual({ amount: 0 });
  });

  it("patch updates form and sets isDirty", () => {
    const { form, patch, isDirty } = useToolPage(makeOptions());
    patch({ amount: 500 });
    expect(form.value.amount).toBe(500);
    expect(isDirty.value).toBe(true);
  });

  describe("ensureSimulationSaved", () => {
    it("returns null when result is null", async () => {
      const { ensureSimulationSaved } = useToolPage(makeOptions());
      const id = await ensureSimulationSaved();
      expect(id).toBeNull();
    });

    it("calls buildSimulationPayload and mutateAsync when result is set", async () => {
      const options = makeOptions();
      const { result, ensureSimulationSaved, savedSimulationId } = useToolPage(options);
      result.value = { netAmount: 1000 };

      const id = await ensureSimulationSaved();

      expect(options.buildSimulationPayload).toHaveBeenCalledWith(
        expect.objectContaining({ result: { netAmount: 1000 }, t: mockT }),
      );
      expect(mockMutateAsync).toHaveBeenCalledOnce();
      expect(id).toBe("sim-123");
      expect(savedSimulationId.value).toBe("sim-123");
    });

    it("is idempotent — does not call mutateAsync a second time", async () => {
      const { result, ensureSimulationSaved } = useToolPage(makeOptions());
      result.value = { netAmount: 1000 };

      await ensureSimulationSaved();
      await ensureSimulationSaved();

      expect(mockMutateAsync).toHaveBeenCalledOnce();
    });

    it("shows toast and returns null on save failure", async () => {
      mockMutateAsync.mockRejectedValueOnce(new Error("network error"));
      const { result, ensureSimulationSaved } = useToolPage(makeOptions());
      result.value = { netAmount: 1000 };

      const id = await ensureSimulationSaved();

      expect(id).toBeNull();
      expect(mockToast.error).toHaveBeenCalledOnce();
    });
  });

  describe("handleSaveSimulation", () => {
    it("delegates to ensureSimulationSaved", async () => {
      const { result, handleSaveSimulation, savedSimulationId } = useToolPage(makeOptions());
      result.value = { netAmount: 200 };

      await handleSaveSimulation();

      expect(savedSimulationId.value).toBe("sim-123");
    });
  });

  describe("handleAddAsGoal", () => {
    it("does nothing when getGoalPayload is not provided", async () => {
      const { result, handleAddAsGoal, goalAdded } = useToolPage(makeOptions(false));
      result.value = { netAmount: 500 };

      await handleAddAsGoal();

      expect(mockGoalMutateAsync).not.toHaveBeenCalled();
      expect(goalAdded.value).toBe(false);
    });

    it("saves simulation then creates goal", async () => {
      const options = makeOptions(true);
      const { result, handleAddAsGoal, goalAdded, savedSimulationId } = useToolPage(options);
      result.value = { netAmount: 750 };

      await handleAddAsGoal();

      expect(mockMutateAsync).toHaveBeenCalledOnce();
      expect(mockGoalMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ target_amount: 750 }),
      );
      expect(goalAdded.value).toBe(true);
      expect(savedSimulationId.value).toBe("sim-123");
    });

    it("does not create a second goal when goalAdded is true", async () => {
      const options = makeOptions(true);
      const { result, handleAddAsGoal } = useToolPage(options);
      result.value = { netAmount: 750 };

      await handleAddAsGoal();
      await handleAddAsGoal();

      expect(mockGoalMutateAsync).toHaveBeenCalledOnce();
    });

    it("shows toast on goal creation failure", async () => {
      mockGoalMutateAsync.mockRejectedValueOnce(new Error("goal error"));
      const options = makeOptions(true);
      const { result, handleAddAsGoal, goalAdded } = useToolPage(options);
      result.value = { netAmount: 100 };

      await handleAddAsGoal();

      expect(goalAdded.value).toBe(false);
      expect(mockToast.error).toHaveBeenCalledOnce();
    });
  });

  it("isSaved becomes true after successful save", async () => {
    const { result, handleSaveSimulation, isSaved } = useToolPage(makeOptions());
    result.value = { netAmount: 300 };

    expect(isSaved.value).toBe(false);
    await handleSaveSimulation();
    expect(isSaved.value).toBe(true);
  });

  it("context fields are forwarded from useToolPageContext", () => {
    const { t, toast, formatBrl, isAuthenticated } = useToolPage(makeOptions());
    expect(t).toBe(mockT);
    expect(toast).toBe(mockToast);
    expect(typeof formatBrl).toBe("function");
    expect(isAuthenticated.value).toBe(true);
  });
});
