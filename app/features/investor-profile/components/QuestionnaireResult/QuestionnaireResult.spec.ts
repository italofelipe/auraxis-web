import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { createRouter, createWebHistory } from "vue-router";
import type { QuestionnaireResultDto } from "~/features/investor-profile/contracts/investor-profile.dto";
import QuestionnaireResult from "./QuestionnaireResult.vue";

const mockPush = vi.fn();

vi.mock("vue-router", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useRouter: (): { push: typeof mockPush } => ({ push: mockPush }),
  };
});

/**
 * Mounts QuestionnaireResult with a router plugin for tests that trigger navigation.
 *
 * @param result - The questionnaire result to pass as a prop.
 * @returns Mounted wrapper.
 */
const mountResult = (result: QuestionnaireResultDto): VueWrapper => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: "/", component: { template: "<div />" } }],
  });

  return mount(QuestionnaireResult, {
    props: { result },
    global: { plugins: [router] },
  });
};

describe("QuestionnaireResult", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe("conservador profile", () => {
    it("renders 'Conservador' as the profile badge", () => {
      const wrapper = mountResult({ suggested_profile: "conservador", score: 5 });
      expect(wrapper.find(".questionnaire-result__profile-badge").text()).toBe("Conservador");
    });

    it("renders the conservador description", () => {
      const wrapper = mountResult({ suggested_profile: "conservador", score: 5 });
      expect(wrapper.text()).toContain("segurança do patrimônio");
    });
  });

  describe("explorador profile", () => {
    it("renders 'Explorador' as the profile badge", () => {
      const wrapper = mountResult({ suggested_profile: "explorador", score: 9 });
      expect(wrapper.find(".questionnaire-result__profile-badge").text()).toBe("Explorador");
    });

    it("renders the explorador description", () => {
      const wrapper = mountResult({ suggested_profile: "explorador", score: 9 });
      expect(wrapper.text()).toContain("equilíbrio entre segurança e crescimento");
    });
  });

  describe("entusiasta profile", () => {
    it("renders 'Entusiasta' as the profile badge", () => {
      const wrapper = mountResult({ suggested_profile: "entusiasta", score: 13 });
      expect(wrapper.find(".questionnaire-result__profile-badge").text()).toBe("Entusiasta");
    });

    it("renders the entusiasta description", () => {
      const wrapper = mountResult({ suggested_profile: "entusiasta", score: 13 });
      expect(wrapper.text()).toContain("alta tolerância ao risco");
    });
  });

  describe("score display", () => {
    it("displays the numeric score", () => {
      const wrapper = mountResult({ suggested_profile: "explorador", score: 9 });
      expect(wrapper.find(".questionnaire-result__score").text()).toContain("9");
    });
  });

  describe("CTA button", () => {
    it("renders the CTA button", () => {
      const wrapper = mountResult({ suggested_profile: "conservador", score: 5 });
      const button = wrapper.find(".questionnaire-result__cta");
      expect(button.exists()).toBe(true);
      expect(button.text()).toBe("Ir para o Dashboard");
    });

    it("navigates to /dashboard when CTA is clicked", async () => {
      const wrapper = mountResult({ suggested_profile: "conservador", score: 5 });

      await wrapper.find(".questionnaire-result__cta").trigger("click");

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });
});
