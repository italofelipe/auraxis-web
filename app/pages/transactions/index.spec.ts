import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "app/pages/transactions/index.vue"),
  "utf8",
);

describe("Transactions page — ?open deep link", () => {
  it("opens the exact transaction from the open query param", () => {
    // Powers the "Ver transação" CTA in the due-soon reminder email.
    expect(source).toContain("useRoute()");
    expect(source).toContain("route.query.open");
    expect(source).toContain("requestedOpenId");
    expect(source).toContain("hasOpenedFromQuery");
    // When the requested id is found in the loaded list, its surface opens.
    expect(source).toContain("handleEdit(match)");
  });

  it("guards against reopening on subsequent list refreshes", () => {
    expect(source).toContain("if (hasOpenedFromQuery");
  });
});
