import type { AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  captureRequestIdInterceptor,
  currentRequestId,
  resetRequestIdForTests,
  setRequestId,
} from "~/core/observability/request-id-context";

/**
 * Build a minimal AxiosResponse for tests.
 *
 * @param headers Headers object to use in the response.
 * @returns Constructed AxiosResponse.
 */
const makeResponse = (headers: Record<string, unknown>): AxiosResponse => ({
  data: {},
  status: 200,
  statusText: "OK",
  headers,
  config: {} as AxiosResponse["config"],
});

describe("request-id context", () => {
  beforeEach(() => {
    resetRequestIdForTests();
  });

  afterEach(() => {
    resetRequestIdForTests();
  });

  it("starts with no captured id", () => {
    expect(currentRequestId()).toBeUndefined();
  });

  it("setRequestId stores a valid id", () => {
    setRequestId("req-abc-123");
    expect(currentRequestId()).toBe("req-abc-123");
  });

  it("setRequestId ignores empty / whitespace / undefined", () => {
    setRequestId("");
    expect(currentRequestId()).toBeUndefined();
    setRequestId("   ");
    expect(currentRequestId()).toBeUndefined();
    setRequestId(undefined);
    expect(currentRequestId()).toBeUndefined();
  });
});

describe("captureRequestIdInterceptor", () => {
  beforeEach(() => resetRequestIdForTests());
  afterEach(() => resetRequestIdForTests());

  it("captures x-request-id from response headers", () => {
    const response = makeResponse({ "x-request-id": "req-xyz-789" });
    const returned = captureRequestIdInterceptor(response);
    expect(returned).toBe(response);
    expect(currentRequestId()).toBe("req-xyz-789");
  });

  it("does not capture when x-request-id is missing", () => {
    const response = makeResponse({ "content-type": "application/json" });
    captureRequestIdInterceptor(response);
    expect(currentRequestId()).toBeUndefined();
  });

  it("ignores non-string x-request-id values defensively", () => {
    const response = makeResponse({ "x-request-id": 42 });
    captureRequestIdInterceptor(response);
    expect(currentRequestId()).toBeUndefined();
  });

  it("does not throw when headers is missing", () => {
    const response = {
      data: {},
      status: 200,
      statusText: "OK",
      headers: undefined,
      config: {} as AxiosResponse["config"],
    } as unknown as AxiosResponse;
    expect(() => captureRequestIdInterceptor(response)).not.toThrow();
    expect(currentRequestId()).toBeUndefined();
  });
});
