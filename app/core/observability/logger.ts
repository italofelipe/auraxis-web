/* eslint-disable no-console -- this is THE observability module; routing
 * log levels to console is its entire purpose. Business code must not use
 * console.* directly — use this logger. */

/**
 * Structured JSON logger with request_id correlation.
 *
 * Pairs with the future `x-request-id` header propagated by `auraxis-api`'s
 * RequestIDMiddleware — once the api side echoes the header in every
 * response, the http interceptor will feed it into `logger.withRequestId(id)`
 * so every client-side log can be correlated with the corresponding
 * backend request.
 *
 * Until the api side lands, `withRequestId` accepts any string and the
 * logger output gracefully includes `request_id: undefined` when no id is
 * set. Logging is JSON in production (consumed by CloudFront / log
 * forwarder) and pretty-printed in dev.
 *
 * Usage:
 *   import { logger } from "~/core/observability/logger";
 *   logger.info("auth.login.attempt", { email_hash: "..." });
 *   const reqLogger = logger.withRequestId(response.headers["x-request-id"]);
 *   reqLogger.error("payment.failed", { code: "CARD_DECLINED" });
 *
 * Tests cover all branches in __tests__/core/observability/logger.spec.ts.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry extends LogContext {
  ts: string;
  level: LogLevel;
  msg: string;
  request_id?: string;
}

export interface Logger {
  debug(msg: string, ctx?: LogContext): void;
  info(msg: string, ctx?: LogContext): void;
  warn(msg: string, ctx?: LogContext): void;
  error(msg: string, ctx?: LogContext): void;
  /**
   * Returns a child logger that includes `request_id` in every emitted entry.
   * Empty / whitespace-only ids are ignored (returns a plain child clone).
   *
   * @param requestId Candidate correlation id.
   * @returns Child logger.
   */
  withRequestId(requestId: string | undefined): Logger;
}

/**
 * Returns true in non-production environments. Affects output formatting:
 * dev prints pretty (level + msg + JSON ctx), prod prints single-line JSON.
 *
 * @returns Whether the active env is non-production.
 */
const isDevEnv = (): boolean => {
  return (
    typeof process !== "undefined" &&
    process.env.NODE_ENV !== "production"
  );
};

/**
 * Formats a log entry for human consumption (used in dev only).
 *
 * @param entry Structured log entry.
 * @returns Pretty-printed line.
 */
const formatPretty = (entry: LogEntry): string => {
  const reqIdSuffix = entry.request_id ? ` [${entry.request_id.slice(0, 8)}]` : "";
  const ctxEntries = Object.entries(entry).filter(
    ([key]) => !["ts", "level", "msg", "request_id"].includes(key),
  );
  const ctxSerialized = ctxEntries.length > 0
    ? " " + JSON.stringify(Object.fromEntries(ctxEntries))
    : "";
  return `[${entry.level}]${reqIdSuffix} ${entry.msg}${ctxSerialized}`;
};

/**
 * Writes a log entry. JSON in prod, pretty in dev. Never throws — logging
 * failures must not break business code.
 *
 * @param entry Structured log entry.
 */
const writeEntry = (entry: LogEntry): void => {
  try {
    const output = isDevEnv() ? formatPretty(entry) : JSON.stringify(entry);
    const fn = entry.level === "error" || entry.level === "warn"
      ? console.error.bind(console)
      : console.log.bind(console);
    fn(output);
  } catch {
    /* observability must never throw */
  }
};

/**
 * Internal logger factory — bakes a baseline context (e.g., request_id) into
 * every emitted entry. Exposed via {@link createLogger}.
 *
 * @param baseCtx Context merged into every log entry.
 * @returns Logger instance.
 */
const buildLogger = (baseCtx: LogContext): Logger => {
  /**
   * Emit a structured log entry merging the baseline context with the
   * per-call context.
   *
   * @param level Log level.
   * @param msg Message.
   * @param ctx Optional per-call context.
   */
  const emit = (level: LogLevel, msg: string, ctx?: LogContext): void => {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      msg,
      ...baseCtx,
      ...(ctx ?? {}),
    };
    writeEntry(entry);
  };

  /**
   * Type guard for non-empty request_id strings.
   *
   * @param id Candidate id.
   * @returns Whether the id is usable.
   */
  const isUsableRequestId = (id: string | undefined): id is string => {
    return typeof id === "string" && id.trim().length > 0;
  };

  return {
    debug(msg: string, ctx?: LogContext): void {
      emit("debug", msg, ctx);
    },
    info(msg: string, ctx?: LogContext): void {
      emit("info", msg, ctx);
    },
    warn(msg: string, ctx?: LogContext): void {
      emit("warn", msg, ctx);
    },
    error(msg: string, ctx?: LogContext): void {
      emit("error", msg, ctx);
    },
    withRequestId(requestId: string | undefined): Logger {
      if (!isUsableRequestId(requestId)) {
        return buildLogger({ ...baseCtx });
      }
      return buildLogger({ ...baseCtx, request_id: requestId });
    },
  };
};

/**
 * Creates a new logger with an optional baseline context.
 * Each call returns an independent instance — useful for scoping by feature.
 *
 * @param baseCtx Optional context merged into every log entry.
 * @returns Logger instance.
 */
export const createLogger = (baseCtx: LogContext = {}): Logger => {
  return buildLogger(baseCtx);
};

/**
 * Default singleton logger. Most call sites should use this.
 * Use {@link createLogger} only when scoping by feature is meaningful.
 */
export const logger: Logger = createLogger();

/**
 * Test helpers — exposed for unit tests, not for production use.
 */
export const __internals = {
  formatPretty,
  isDevEnv,
};
