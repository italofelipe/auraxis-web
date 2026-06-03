import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DashboardInsightCarousel, {
  type CarouselDue,
  type CarouselGoal,
  type CarouselExpense,
  type CarouselHealth,
} from "../DashboardInsightCarousel.vue";

const UiSurfaceCardStub = defineComponent({
  name: "UiSurfaceCard",
  template: "<div class=\"ui-surface-card-stub\"><slot /></div>",
});

const NButtonStub = defineComponent({
  name: "NButton",
  emits: ["click"],
  template: "<button @click=\"$emit('click')\"><slot name=\"icon\" /><slot /></button>",
});

const IconStub = { template: "<span />" };

const stubs = {
  UiSurfaceCard: UiSurfaceCardStub,
  NButton: NButtonStub,
  ChevronLeft: IconStub,
  ChevronRight: IconStub,
  CalendarClock: IconStub,
  Target: IconStub,
  TrendingDown: IconStub,
  HeartPulse: IconStub,
};

const DUES: CarouselDue[] = [
  { id: "d1", title: "Financiamento carro", amount: 1200, dueDate: "2026-07-05", daysLeft: 3, overdue: false },
];
const GOALS: CarouselGoal[] = [
  { id: "g1", name: "Reserva", current: 5000, target: 20000, percent: 25 },
];
const EXPENSES: CarouselExpense[] = [
  { category: "Moradia", amount: 2500, percentage: 40 },
];
const HEALTH: CarouselHealth = { score: 72, tier: "good" };

/**
 * Mounts the carousel with sensible defaults that callers can override.
 *
 * @param props Partial props to override the defaults.
 * @returns Mounted wrapper.
 */
function mountCarousel(props: Partial<Record<string, unknown>> = {}): ReturnType<typeof mount> {
  return mount(DashboardInsightCarousel, {
    props: { upcomingDues: DUES, goals: GOALS, topExpenses: EXPENSES, health: HEALTH, ...props },
    global: { stubs },
  });
}

describe("DashboardInsightCarousel", () => {
  it("shows the upcoming dues panel first", () => {
    const w = mountCarousel();
    expect(w.text()).toContain("Próximos vencimentos");
    expect(w.text()).toContain("Financiamento carro");
  });

  it("cycles forward through all four panels and wraps around", async () => {
    const w = mountCarousel();
    const next = w.find("[data-testid='insight-carousel-next']");

    await next.trigger("click");
    expect(w.text()).toContain("Progresso de metas");
    expect(w.text()).toContain("Reserva");

    await next.trigger("click");
    expect(w.text()).toContain("Maiores gastos do mês");
    expect(w.text()).toContain("Moradia");

    await next.trigger("click");
    expect(w.text()).toContain("Saúde financeira");
    expect(w.text()).toContain("72");

    await next.trigger("click");
    expect(w.text()).toContain("Próximos vencimentos");
  });

  it("navigates backward wrapping to the last panel", async () => {
    const w = mountCarousel();
    await w.find("[data-testid='insight-carousel-prev']").trigger("click");
    expect(w.text()).toContain("Saúde financeira");
  });

  it("jumps to a panel via its dot indicator", async () => {
    const w = mountCarousel();
    const dots = w.findAll(".insight-carousel__dot");
    expect(dots.length).toBe(4);
    await dots[2]!.trigger("click");
    expect(w.text()).toContain("Maiores gastos do mês");
  });

  it("renders an empty state per panel when data is missing", async () => {
    const w = mountCarousel({ upcomingDues: [], goals: [], topExpenses: [], health: null });
    expect(w.text()).toContain("Tudo em dia");

    await w.find("[data-testid='insight-carousel-next']").trigger("click");
    expect(w.text()).toContain("ainda não criou metas");

    await w.find("[data-testid='insight-carousel-next']").trigger("click");
    expect(w.text()).toContain("Sem despesas categorizadas");

    await w.find("[data-testid='insight-carousel-next']").trigger("click");
    expect(w.text()).toContain("saúde financeira");
  });

  it("labels overdue bills distinctly", () => {
    const w = mountCarousel({
      upcomingDues: [{ ...DUES[0]!, overdue: true, daysLeft: 0 }],
    });
    expect(w.text()).toContain("vencida");
  });
});
