import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createLogger, logger } from "~/core/observability/logger";

describe("logger — structured output", () => {
  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

  beforeEach(() => {
    consoleLogSpy.mockClear();
    consoleErrorSpy.mockClear();
    process.env.NODE_ENV = "production"; // JSON output for assertions
  });

  afterEach(() => {
    process.env.NODE_ENV = "test"; // Restore between specs
  });

  it("emits a single-line JSON entry in production mode", () => {
    logger.info("auth.login.attempt", { user_id: "abc" });

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const raw = consoleLogSpy.mock.calls[0]![0] as string;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(parsed.level).toBe("info");
    expect(parsed.msg).toBe("auth.login.attempt");
    expect(parsed.user_id).toBe("abc");
    expect(typeof parsed.ts).toBe("string");
  });

  it("routes warn/error to console.error, debug/info to console.log", () => {
    logger.debug("debug");
    logger.info("info");
    logger.warn("warn");
    logger.error("error");

    expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
  });

  it("does not include request_id when none is set", () => {
    logger.info("no-correlation");
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0]![0] as string) as Record<string, unknown>;
    expect(parsed.request_id).toBeUndefined();
  });

  it("withRequestId returns a child logger that emits the correlation id", () => {
    const correlated = logger.withRequestId("req-abc-123");
    correlated.info("with-id");
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0]![0] as string) as Record<string, unknown>;
    expect(parsed.request_id).toBe("req-abc-123");
  });

  it("withRequestId ignores empty / whitespace ids", () => {
    const a = logger.withRequestId("");
    const b = logger.withRequestId("   ");
    const c = logger.withRequestId(undefined);

    a.info("empty");
    b.info("ws");
    c.info("undef");

    const allParsed = consoleLogSpy.mock.calls.map(
      (c) => JSON.parse(c[0] as string) as Record<string, unknown>,
    );
    expect(allParsed.every((p) => p.request_id === undefined)).toBe(true);
  });

  it("createLogger bakes baseline context into every entry", () => {
    const scoped = createLogger({ feature: "wallet" });
    scoped.info("opened");
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0]![0] as string) as Record<string, unknown>;
    expect(parsed.feature).toBe("wallet");
    expect(parsed.msg).toBe("opened");
  });

  it("does not throw when console itself throws", () => {
    consoleLogSpy.mockImplementationOnce(() => {
      throw new Error("console exploded");
    });
    expect(() => logger.info("safe")).not.toThrow();
  });
});

describe("logger — pretty mode (dev)", () => {
  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

  beforeEach(() => {
    consoleLogSpy.mockClear();
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    process.env.NODE_ENV = "test";
  });

  it("uses pretty output when NODE_ENV !== production", () => {
    logger.info("hello", { ctx: 1 });
    const raw = consoleLogSpy.mock.calls[0]![0] as string;
    // Pretty form: "[level] msg {ctx}" — not parseable as JSON object
    expect(raw.startsWith("[info]")).toBe(true);
    expect(raw).toContain("hello");
    expect(raw).toContain("\"ctx\":1");
  });

  it("pretty mode includes request_id prefix when present", () => {
    const correlated = logger.withRequestId("abcdef1234567890");
    correlated.info("with-id");
    const raw = consoleLogSpy.mock.calls[0]![0] as string;
    // Short prefix (first 8 chars) shown in brackets
    expect(raw).toContain("[abcdef12]");
  });
});
