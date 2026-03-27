import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import { NTag, NButton } from "naive-ui";

import AlertItem from "./AlertItem.vue";
import type { AlertDto } from "../../contracts/alert.dto";

// ── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * Creates a minimal valid AlertDto for testing.
 *
 * @param overrides - Partial properties to override defaults.
 * @returns A complete AlertDto fixture.
 */
const makeAlert = (overrides: Partial<AlertDto> = {}): AlertDto => ({
  id: "alert-test-001",
  type: "system",
  title: "Título de teste",
  description: "Descrição de teste do alerta.",
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  is_read: false,
  ...overrides,
});

/**
 * Mounts AlertItem with real Naive UI rendering.
 *
 * @param alert - Alert data to render.
 * @returns VueWrapper around the mounted component.
 */
function mountAlertItem(alert: AlertDto): ReturnType<typeof mount> {
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

  it("renders the alert description", () => {
    const wrapper = mountAlertItem(makeAlert({ description: "Você alcançou sua meta." }));
    expect(wrapper.text()).toContain("Você alcançou sua meta.");
  });

  it("applies unread border class when alert is unread", () => {
    const wrapper = mountAlertItem(makeAlert({ is_read: false }));
    expect(wrapper.find(".alert-item--unread").exists()).toBe(true);
  });

  it("does not apply unread border class when alert is read", () => {
    const wrapper = mountAlertItem(makeAlert({ is_read: true }));
    expect(wrapper.find(".alert-item--unread").exists()).toBe(false);
  });

  it("emits 'mark-read' with the alert id when check button is clicked", async () => {
    const alert = makeAlert({ is_read: false, id: "alert-xyz" });
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
    const alert = makeAlert({ is_read: false, id: "alert-delete-01" });
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
    const unread = mountAlertItem(makeAlert({ is_read: false }));
    const read = mountAlertItem(makeAlert({ is_read: true }));
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
});
