import { describe, expect, it } from "vitest";

import { buildCsp, resolveCspEnvironment } from "../csp";

describe("resolveCspEnvironment", () => {
  it("resolve 'production' e 'prod' para production", () => {
    expect(resolveCspEnvironment("production")).toBe("production");
    expect(resolveCspEnvironment("prod")).toBe("production");
  });

  it("resolve 'staging' e 'stage' para staging", () => {
    expect(resolveCspEnvironment("staging")).toBe("staging");
    expect(resolveCspEnvironment("stage")).toBe("staging");
  });

  it("cai em development quando valor é undefined", () => {
    expect(resolveCspEnvironment(undefined)).toBe("development");
  });

  it("cai em development quando valor é desconhecido", () => {
    expect(resolveCspEnvironment("qa")).toBe("development");
    expect(resolveCspEnvironment("")).toBe("development");
  });

  it("é case-sensitive — 'Production' não mapeia para production", () => {
    expect(resolveCspEnvironment("Production")).toBe("development");
  });
});

describe("buildCsp — production", () => {
  it("retorna null em production (header vem do CloudFront)", () => {
    expect(buildCsp("production")).toBeNull();
  });
});

describe("buildCsp — development", () => {
  const csp = buildCsp("development") ?? "";

  it("retorna uma string não-nula", () => {
    expect(csp).not.toBe("");
    expect(typeof csp).toBe("string");
  });

  it("inclui default-src 'self'", () => {
    expect(csp).toContain("default-src 'self'");
  });

  it("permite unsafe-inline e unsafe-eval em script-src (HMR/vite)", () => {
    expect(csp).toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).toMatch(/script-src[^;]*'unsafe-eval'/);
  });

  it("permite ws: e wss: em connect-src para HMR", () => {
    expect(csp).toMatch(/connect-src[^;]*\bws:/);
    expect(csp).toMatch(/connect-src[^;]*\bwss:/);
  });

  it("permite http://localhost:* em connect-src", () => {
    expect(csp).toContain("http://localhost:*");
  });

  it("inclui a API do Auraxis e o ingest do Sentry", () => {
    expect(csp).toContain("https://api.auraxis.com.br");
    expect(csp).toContain("https://*.sentry.io");
  });

  it("bloqueia iframes via frame-ancestors 'none'", () => {
    expect(csp).toContain("frame-ancestors 'none'");
  });
});

describe("buildCsp — staging", () => {
  const csp = buildCsp("staging") ?? "";

  it("retorna uma string não-nula", () => {
    expect(csp).not.toBe("");
  });

  it("NÃO permite 'unsafe-inline' em script-src", () => {
    const scriptDirective = csp
      .split(";")
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith("script-src"));
    expect(scriptDirective).toBeDefined();
    expect(scriptDirective).not.toContain("'unsafe-inline'");
    expect(scriptDirective).not.toContain("'unsafe-eval'");
  });

  it("NÃO permite ws:/wss: em connect-src", () => {
    const connectDirective = csp
      .split(";")
      .map((directive) => directive.trim())
      .find((directive) => directive.startsWith("connect-src"));
    expect(connectDirective).toBeDefined();
    expect(connectDirective).not.toMatch(/\bws:/);
    expect(connectDirective).not.toMatch(/\bwss:/);
  });

  it("NÃO permite localhost em connect-src", () => {
    expect(csp).not.toContain("localhost");
  });

  it("inclui object-src 'none' e base-uri 'self'", () => {
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it("inclui form-action 'self'", () => {
    expect(csp).toContain("form-action 'self'");
  });

  it("bloqueia iframes via frame-ancestors 'none'", () => {
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("inclui a API do Auraxis e o ingest do Sentry", () => {
    expect(csp).toContain("https://api.auraxis.com.br");
    expect(csp).toContain("https://*.sentry.io");
  });
});
