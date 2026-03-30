import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PasswordStrengthMeter from "../PasswordStrengthMeter.vue";

vi.mock("vue-i18n", () => ({
  useI18n: (): { t: (key: string) => string } => ({ t: (key: string) => key }),
}));

/**
 * Mounts the meter with a given password string.
 *
 * @param password - The password value to evaluate.
 * @returns Mounted component wrapper for assertions.
 */
function mountMeter(password: string): ReturnType<typeof mount> {
  return mount(PasswordStrengthMeter, { props: { password } });
}

describe("PasswordStrengthMeter", () => {
  it("does not render when password is empty", () => {
    const wrapper = mountMeter("");
    expect(wrapper.find(".strength-meter").exists()).toBe(false);
  });

  it("renders when password has at least one character", () => {
    const wrapper = mountMeter("a");
    expect(wrapper.find(".strength-meter").exists()).toBe(true);
  });

  it("shows all 4 criteria items", () => {
    const wrapper = mountMeter("a");
    const items = wrapper.findAll(".strength-meter__criterion");
    expect(items).toHaveLength(4);
  });

  it("marks length criterion as met when password has ≥ 10 chars", () => {
    const wrapper = mountMeter("abcdefghij");
    const items = wrapper.findAll(".strength-meter__criterion");
    const lengthItem = items.find((li) =>
      li.text().includes("auth.password.strength.length"),
    );
    expect(lengthItem?.classes()).toContain("strength-meter__criterion--met");
  });

  it("marks length criterion as unmet when password has < 10 chars", () => {
    const wrapper = mountMeter("abc");
    const items = wrapper.findAll(".strength-meter__criterion");
    const lengthItem = items.find((li) =>
      li.text().includes("auth.password.strength.length"),
    );
    expect(lengthItem?.classes()).not.toContain("strength-meter__criterion--met");
  });

  it("applies strong segment class when all 4 criteria are met", () => {
    const wrapper = mountMeter("Abcdef123!");
    const segments = wrapper.findAll(".strength-meter__segment");
    expect(segments).toHaveLength(4);
    segments.forEach((seg) => {
      expect(seg.classes()).toContain("strength-meter__segment--strong");
    });
  });

  it("applies weak segment class when only 1 criterion is met", () => {
    const wrapper = mountMeter("abcdefghij"); // length only
    const metSegments = wrapper
      .findAll(".strength-meter__segment")
      .filter((s) => s.classes().includes("strength-meter__segment--weak"));
    expect(metSegments).toHaveLength(1);
  });

  it("shows strength label when password is non-empty", () => {
    const wrapper = mountMeter("Abcdef123!");
    expect(wrapper.find(".strength-meter__label").exists()).toBe(true);
    expect(wrapper.text()).toContain("auth.password.strength.level.strong");
  });
});
