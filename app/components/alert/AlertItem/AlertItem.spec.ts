import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import { NTag, NButton } from "naive-ui";

import AlertItem from "./AlertItem.vue";
import type { Alert } from "~/features/alerts/model/alerts";

// ── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * Creates a minimal valid Alert view model for testing.
 *
 * @param overrides - Partial properties to override defaults.
 * @returns A complete Alert fixture.
 */
const makeAlert = (overrides: Partial<Alert> = {}): Alert => ({
  id: "alert-test-001",
  type: "system",
  title: "Título de teste",
  body: "Descrição de teste do alerta.",
  severity: "info",
  readAt: null,
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  ...overrides,
});

/**
 * Mounts AlertItem with real Naive UI rendering.
 *
 * @param alert - Alert data to render.
 * @returns VueWrapper around the mounted component.
 */
function mountAlertItem(alert: Alert): ReturnType<typeof mount> {
  return mount(AlertItem, {
    props: { alert },
    global: {
      stubs: {
        CheckIcon: { template: "<span data-testid='check-icon' />" },
        Trash2Icon: { template: "<span data-testid='trash-icon' />" },
      },
    },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AlertItem", () => {
  it("renders the alert title", () => {
    const wrapper = mountAlertItem(makeAlert({ title: "Meta atingida!" }));
    expect(wrapper.text()).toContain("Meta atingida!");
  });

  it("renders the alert body", () => {
    const wrapper = mountAlertItem(makeAlert({ body: "Você alcançou sua meta." }));
    expect(wrapper.text()).toContain("Você alcançou sua meta.");
  });

  it("applies unread border class when readAt is null", () => {
    const wrapper = mountAlertItem(makeAlert({ readAt: null }));
    expect(wrapper.find(".alert-item--unread").exists()).toBe(true);
  });

  it("does not apply unread border class when readAt is set", () => {
    const wrapper = mountAlertItem(makeAlert({ readAt: new Date().toISOString() }));
    expect(wrapper.find(".alert-item--unread").exists()).toBe(false);
  });

  it("emits 'mark-read' with the alert id when check button is clicked", async () => {
    const alert = makeAlert({ readAt: null, id: "alert-xyz" });
    const wrapper = mountAlertItem(alert);
    const buttons = wrapper.findAllComponents(NButton);
    const markReadBtn = buttons.at(0);
    expect(markReadBtn).toBeDefined();
    await markReadBtn!.trigger("click");
    const emitted = wrapper.emitted("mark-read");
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual(["alert-xyz"]);
  });

  it("emits 'delete' with the alert id when trash button is clicked", async () => {
    const alert = makeAlert({ readAt: null, id: "alert-delete-01" });
    const wrapper = mountAlertItem(alert);
    const buttons = wrapper.findAllComponents(NButton);
    const deleteBtn = buttons.at(buttons.length - 1);
    expect(deleteBtn).toBeDefined();
    await deleteBtn!.trigger("click");
    const emitted = wrapper.emitted("delete");
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual(["alert-delete-01"]);
  });

  it("shows the mark-read button only when alert is unread", () => {
    const unread = mountAlertItem(makeAlert({ readAt: null }));
    const read = mountAlertItem(makeAlert({ readAt: new Date().toISOString() }));
    expect(unread.findAllComponents(NButton).length).toBe(2);
    expect(read.findAllComponents(NButton).length).toBe(1);
  });

  it("renders NTag with type='success' for goal_achieved alerts", () => {
    const wrapper = mountAlertItem(makeAlert({ type: "goal_achieved" }));
    const tag = wrapper.findComponent(NTag);
    expect(tag.props("type")).toBe("success");
  });

  it("renders NTag with type='error' for overdue_payment alerts", () => {
    const wrapper = mountAlertItem(makeAlert({ type: "overdue_payment" }));
    const tag = wrapper.findComponent(NTag);
    expect(tag.props("type")).toBe("error");
  });

  it("renders NTag with type='warning' for budget_exceeded alerts", () => {
    const wrapper = mountAlertItem(makeAlert({ type: "budget_exceeded" }));
    const tag = wrapper.findComponent(NTag);
    expect(tag.props("type")).toBe("warning");
  });

  it("renders NTag with type='info' for investment_opportunity alerts", () => {
    const wrapper = mountAlertItem(makeAlert({ type: "investment_opportunity" }));
    const tag = wrapper.findComponent(NTag);
    expect(tag.props("type")).toBe("info");
  });

  it("renders NTag with type='default' for system alerts", () => {
    const wrapper = mountAlertItem(makeAlert({ type: "system" }));
    const tag = wrapper.findComponent(NTag);
    expect(tag.props("type")).toBe("default");
  });

  it("renders NTag with type='default' for unknown alert types", () => {
    const wrapper = mountAlertItem(makeAlert({ type: "unknown_type" }));
    const tag = wrapper.findComponent(NTag);
    expect(tag.props("type")).toBe("default");
  });
});
