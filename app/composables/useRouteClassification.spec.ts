import { describe, expect, it, vi } from "vitest";

const mockRoutePath = vi.hoisted(() => ({ value: "/" }));

vi.mock("#app", () => ({
  useRoute: (): { path: string } => ({
    get path(): string {
      return mockRoutePath.value;
    },
  }),
}));

describe("useRouteClassification", () => {
  it("classifica rota publica como 'public'", async () => {
    mockRoutePath.value = "/";
    const { useRouteClassification } = await import("./useRouteClassification");
    const { routeClass } = useRouteClassification();
    expect(routeClass.value).toBe("public");
  });

  it("classifica /login como 'public-noindex'", async () => {
    mockRoutePath.value = "/login";
    const { useRouteClassification } = await import("./useRouteClassification");
    const { routeClass } = useRouteClassification();
    expect(routeClass.value).toBe("public-noindex");
  });

  it("classifica /dashboard como 'private'", async () => {
    mockRoutePath.value = "/dashboard";
    const { useRouteClassification } = await import("./useRouteClassification");
    const { routeClass } = useRouteClassification();
    expect(routeClass.value).toBe("private");
  });
});
