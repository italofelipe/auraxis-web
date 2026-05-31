import { ref } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AiInsightFeedback from "./AiInsightFeedback.vue";

const useSubmitInsightFeedbackMock = vi.hoisted(() => vi.fn());
const toastSuccess = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock("~/features/ai-insights/queries/use-submit-insight-feedback", () => ({
  useSubmitInsightFeedback: useSubmitInsightFeedbackMock,
}));

interface ToastMock {
  success: typeof toastSuccess;
  error: typeof toastError;
  warning: () => void;
  info: () => void;
}

vi.mock("~/composables/useToast", () => ({
  useToast: (): ToastMock => ({
    success: toastSuccess,
    error: toastError,
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

/**
 * Sets every rating to 5 by clicking the last item of each NRate group.
 *
 * @param wrapper Mounted component wrapper.
 */
const rateAllFive = async (wrapper: ReturnType<typeof mount>): Promise<void> => {
  const groups = wrapper.findAll(".n-rate");
  for (const group of groups) {
    const items = group.findAll(".n-rate__item");
    await items[items.length - 1]?.trigger("click");
  }
  await flushPromises();
};

describe("AiInsightFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps submit disabled until all four dimensions are rated", async () => {
    useSubmitInsightFeedbackMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: ref(false),
    });

    const wrapper = mount(AiInsightFeedback, { props: { insightId: "ins-1" } });

    const submit = wrapper.get("[data-testid='feedback-submit']");
    expect((submit.element as HTMLButtonElement).disabled).toBe(true);

    await rateAllFive(wrapper);

    expect((submit.element as HTMLButtonElement).disabled).toBe(false);
  });

  it("submits ratings and trimmed comment, then shows the thank-you state", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: "fb-1", insight_id: "ins-1" });
    useSubmitInsightFeedbackMock.mockReturnValue({ mutateAsync, isPending: ref(false) });

    const wrapper = mount(AiInsightFeedback, { props: { insightId: "ins-1" } });

    await rateAllFive(wrapper);
    await wrapper.find("textarea").setValue("  ótimo  ");
    await wrapper.get("[data-testid='feedback-submit']").trigger("click");
    await flushPromises();

    expect(mutateAsync).toHaveBeenCalledWith({
      insightId: "ins-1",
      feedback: { relevance: 5, truthfulness: 5, depth: 5, usefulness: 5, comment: "ótimo" },
    });
    expect(toastSuccess).toHaveBeenCalled();
    expect(wrapper.emitted("submitted")).toBeTruthy();
    expect(wrapper.find("[data-testid='feedback-done']").exists()).toBe(true);
  });

  it("omits an empty comment from the payload", async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: "fb-1", insight_id: "ins-1" });
    useSubmitInsightFeedbackMock.mockReturnValue({ mutateAsync, isPending: ref(false) });

    const wrapper = mount(AiInsightFeedback, { props: { insightId: "ins-1" } });

    await rateAllFive(wrapper);
    await wrapper.get("[data-testid='feedback-submit']").trigger("click");
    await flushPromises();

    expect(mutateAsync).toHaveBeenCalledWith({
      insightId: "ins-1",
      feedback: { relevance: 5, truthfulness: 5, depth: 5, usefulness: 5 },
    });
  });

  it("shows an error toast and stays in the form when submission fails", async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error("boom"));
    useSubmitInsightFeedbackMock.mockReturnValue({ mutateAsync, isPending: ref(false) });

    const wrapper = mount(AiInsightFeedback, { props: { insightId: "ins-1" } });

    await rateAllFive(wrapper);
    await wrapper.get("[data-testid='feedback-submit']").trigger("click");
    await flushPromises();

    expect(toastError).toHaveBeenCalled();
    expect(wrapper.find("[data-testid='feedback-done']").exists()).toBe(false);
  });
});
