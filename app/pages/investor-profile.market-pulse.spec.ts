import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "app/pages/investor-profile.vue"), "utf8");
const featureFlags = JSON.parse(
  readFileSync(join(process.cwd(), "config/feature-flags.json"), "utf8"),
) as { flags: Array<{ key: string; status: string }> };

describe("Investor profile page — Market Pulse anatomy", () => {
  it("renders the canonical questionnaire, risk spectrum and guardrail sections", () => {
    expect(source).toContain("investor-profile-market-pulse");
    expect(source).toContain("profile-calibration");
    expect(source).toContain("risk-spectrum");
    expect(source).toContain("fit-guardrails");
  });

  it("keeps the blue/cyan canonical route out of coming-soon once implemented", () => {
    const investorProfileFlag = featureFlags.flags.find(
      (flag) => flag.key === "web.pages.investor-profile",
    );

    expect(source).not.toContain("\"coming-soon\"");
    expect(investorProfileFlag).toMatchObject({ status: "enabled-prod" });
  });

  it("keeps canonical Portuguese labels for the investor profile experience", () => {
    expect(source).toContain("Calibragem do perfil");
    expect(source).toContain("Espectro de risco");
    expect(source).toContain("Guarda-corpos do perfil");
    expect(source).toContain("Não é recomendação de investimento");
  });
});
