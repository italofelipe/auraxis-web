import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import AlertItem from "./AlertItem.vue";
import type { Alert } from "~/features/alerts/model/alerts";

vi.mock("lucide-vue-next", () => ({
  Info: { template: "<svg data-testid='icon-info' />" },
  AlertTriangle: { template: "<svg data-testid='icon-warning' />" },
  XCircle: { template: "<svg data-testid='icon-critical' />" },
}));

const stubs = {
  NButton: {
    props: ["type", "size"],
    template: "<button class='n-button' @click='$emit(\"click\")'><slot /></button>",
    emits: ["click"],
  },
};

/**
 * Builds a minimal Alert fixture for testing.
 *
 * @param overrides Optional field overrides.
 * @returns Alert fixture.
 */
const makeAlert = (overrides: Partial<Alert> = {}): Alert => ({
  id: "a-1",
  type: "system",
  title: "Test Alert",
  body: "This is a test alert body.",
  severity: "info",
  readAt: null,
  createdAt: "2026-03-17T00:00:00.000Z",
  ...overrides,
});

describe("AlertItem", () => {
  it("renders the alert title and body", () => {
    const wrapper = mount(AlertItem, {
      props: { alert: makeAlert() },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Test Alert");
    expect(wrapper.text()).toContain("This is a test alert body.");
  });

  it("renders Info icon for info severity", () => {
    const wrapper = mount(AlertItem, {
      props: { alert: makeAlert({ severity: "info" }) },
      global: { stubs },
    });

    expect(wrapper.find("[data-testid='icon-info']").exists()).toBe(true);
  });

  it("renders AlertTriangle icon for warning severity", () => {
    const wrapper = mount(AlertItem, {
      props: { alert: makeAlert({ severity: "warning" }) },
      global: { stubs },
    });

    expect(wrapper.find("[data-testid='icon-warning']").exists()).toBe(true);
  });

  it("renders XCircle icon for critical severity", () => {
    const wrapper = mount(AlertItem, {
      props: { alert: makeAlert({ severity: "critical" }) },
      global: { stubs },
    });

    expect(wrapper.find("[data-testid='icon-critical']").exists()).toBe(true);
  });

  it("renders severity badge with label 'Info' for info severity", () => {
    const wrapper = mount(AlertItem, {
      props: { alert: makeAlert({ severity: "info" }) },
      global: { stubs },
    });

    const tag = wrapper.find(".n-tag");
    expect(tag.exists()).toBe(true);
    expect(tag.text()).toContain("Info");
  });

  it("renders severity badge with label 'Atenção' for warning severity", () => {
    const wrapper = mount(AlertItem, {
      props: { alert: makeAlert({ severity: "warning" }) },
      global: { stubs },
    });

    const tag = wrapper.find(".n-tag");
    expect(tag.exists()).toBe(true);
    expect(tag.text()).toContain("Atenção");
  });

  it("renders severity badge with label 'Crítico' for critical severity", () => {
    const wrapper = mount(AlertItem, {
      props: { alert: makeAlert({ severity: "critical" }) },
      global: { stubs },
    });

    const tag = wrapper.find(".n-tag");
    expect(tag.exists()).toBe(true);
    expect(tag.text()).toContain("Crítico");
  });

  it("shows mark-as-read button when alert is unread", () => {
    const wrapper = mount(AlertItem, {
      props: { alert: makeAlert({ readAt: null }) },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Marcar como lido");
  });

  it("hides mark-as-read button when alert is already read", () => {
    const wrapper = mount(AlertItem, {
      props: { alert: makeAlert({ readAt: "2026-03-17T01:00:00.000Z" }) },
      global: { stubs },
    });

    expect(wrapper.text()).not.toContain("Marcar como lido");
  });

  it("emits mark-read with alert id when mark-as-read button is clicked", async () => {
    const wrapper = mount(AlertItem, {
      props: { alert: makeAlert({ id: "alert-42" }) },
      global: { stubs },
    });

    const buttons = wrapper.findAll(".n-button");
    const markReadBtn = buttons.find((b) => b.text().includes("Marcar como lido"));
    await markReadBtn?.trigger("click");

    expect(wrapper.emitted("mark-read")).toBeTruthy();
    expect(wrapper.emitted("mark-read")?.[0]).toEqual(["alert-42"]);
  });

  it("emits delete with alert id when delete button is clicked", async () => {
    const wrapper = mount(AlertItem, {
      props: { alert: makeAlert({ id: "alert-99" }) },
      global: { stubs },
    });

    const buttons = wrapper.findAll(".n-button");
    const deleteBtn = buttons.find((b) => b.text().includes("Excluir"));
    await deleteBtn?.trigger("click");

    expect(wrapper.emitted("delete")).toBeTruthy();
    expect(wrapper.emitted("delete")?.[0]).toEqual(["alert-99"]);
  });

  it("applies read modifier class when alert is already read", () => {
    const wrapper = mount(AlertItem, {
      props: { alert: makeAlert({ readAt: "2026-03-17T01:00:00.000Z" }) },
      global: { stubs },
    });

    expect(wrapper.find(".alert-item").classes()).toContain("alert-item--read");
  });

  it("does not apply read modifier class when alert is unread", () => {
    const wrapper = mount(AlertItem, {
      props: { alert: makeAlert({ readAt: null }) },
      global: { stubs },
    });

    expect(wrapper.find(".alert-item").classes()).not.toContain("alert-item--read");
  });
});
