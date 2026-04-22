import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";

import {
  serialisePushSubscription,
  urlBase64ToUint8Array,
  usePushSubscription,
} from "./usePushSubscription";

const subscribeMock = vi.fn();
const unsubscribeMock = vi.fn();

vi.mock("~/features/notifications/services/push-notifications.client", () => ({
  /**
   * Returns a client stub whose methods are captured by vi spies.
   *
   * @returns Stub client with `subscribe` and `unsubscribe` mocks.
   */
  usePushNotificationsClient: (): { subscribe: typeof subscribeMock; unsubscribe: typeof unsubscribeMock } => ({
    subscribe: subscribeMock,
    unsubscribe: unsubscribeMock,
  }),
}));

const runtimeConfigState = vi.hoisted(() => ({ vapidPublicKey: "BLmVAAAA" }));

vi.mock("#app", (): Record<string, unknown> => ({
  /**
   * Stubbed runtime config aligned with how Nuxt exposes `public` keys.
   *
   * @returns Runtime config with the shared push key state.
   */
  useRuntimeConfig: (): { public: { vapidPublicKey: string } } => ({
    public: { vapidPublicKey: runtimeConfigState.vapidPublicKey },
  }),
}));

type MockSub = {
  endpoint: string;
  unsubscribe: () => Promise<boolean>;
  toJSON: () => PushSubscriptionJSON;
};

let registrationSubscription: MockSub | null = null;
let pushSubscribeImpl = vi.fn(async (): Promise<MockSub> => ({
  endpoint: "https://push.example/new",
  unsubscribe: async () => true,
  toJSON: () => ({
    endpoint: "https://push.example/new",
    expirationTime: null,
    keys: { p256dh: "pub", auth: "auth" },
  }),
}));

type MockRegistration = {
  pushManager: {
    getSubscription: () => Promise<MockSub | null>;
    subscribe: typeof pushSubscribeImpl;
  };
};

/**
 * Produces a fake ServiceWorkerRegistration wrapping the shared push mocks.
 *
 * @returns Object with a PushManager that delegates to the shared state.
 */
const makeRegistration = (): MockRegistration => ({
  pushManager: {
    /**
     * @returns The currently registered subscription or null.
     */
    getSubscription: async (): Promise<MockSub | null> => registrationSubscription,
    subscribe: pushSubscribeImpl,
  },
});

beforeEach(() => {
  runtimeConfigState.vapidPublicKey = "BLmVAAAA";
  subscribeMock.mockReset();
  unsubscribeMock.mockReset();
  registrationSubscription = null;
  pushSubscribeImpl = vi.fn(async (): Promise<MockSub> => ({
    endpoint: "https://push.example/new",
    /**
     * @returns Always true to signal successful unsubscribe.
     */
    unsubscribe: async (): Promise<boolean> => true,
    /**
     * @returns Minimal JSON payload matching PushSubscriptionJSON.
     */
    toJSON: (): PushSubscriptionJSON => ({
      endpoint: "https://push.example/new",
      expirationTime: null,
      keys: { p256dh: "pub", auth: "auth" },
    }),
  }));

  vi.stubGlobal("Notification", {
    permission: "default",
    requestPermission: vi.fn(async () => "granted"),
  });

  class PushManagerStub {
    readonly name = "PushManagerStub";
  }
  vi.stubGlobal("PushManager", PushManagerStub);

  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      getRegistration: vi.fn(async () => makeRegistration()),
      ready: Promise.resolve(makeRegistration()),
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("urlBase64ToUint8Array", () => {
  it("decodes a URL-safe base64 string", () => {
    expect(new TextDecoder().decode(urlBase64ToUint8Array("aGVsbG8"))).toBe("hello");
  });

  it("normalises '+' and '/' to URL-safe equivalents", () => {
    expect(urlBase64ToUint8Array("Pz4_")).toEqual(urlBase64ToUint8Array("Pz4/"));
  });
});

describe("serialisePushSubscription", () => {
  it("flattens the browser JSON payload into the backend contract", () => {
    const fake = {
      endpoint: "https://push.example/abc",
      toJSON: (): PushSubscriptionJSON => ({
        endpoint: "https://push.example/abc",
        expirationTime: 99,
        keys: { p256dh: "pp", auth: "aa" },
      }),
    } as unknown as PushSubscription;
    expect(serialisePushSubscription(fake)).toEqual({
      endpoint: "https://push.example/abc",
      expiration_time: 99,
      keys: { p256dh: "pp", auth: "aa" },
    });
  });

  it("falls back to blank keys when the payload omits them", () => {
    const fake = {
      endpoint: "https://push.example/keyless",
      toJSON: (): PushSubscriptionJSON => ({ endpoint: "https://push.example/keyless" }),
    } as unknown as PushSubscription;
    const dto = serialisePushSubscription(fake);
    expect(dto.keys).toEqual({ p256dh: "", auth: "" });
    expect(dto.expiration_time).toBeNull();
  });
});

describe("usePushSubscription", () => {
  it("reports unconfigured state when VAPID key is missing", async () => {
    runtimeConfigState.vapidPublicKey = "";
    const hook = usePushSubscription();
    await nextTick();
    expect(hook.state.value).toBe("unconfigured");
    const ok = await hook.subscribe();
    expect(ok).toBe(false);
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it("subscribes successfully when permission is granted", async () => {
    subscribeMock.mockResolvedValueOnce(undefined);
    const hook = usePushSubscription();
    await nextTick();

    const ok = await hook.subscribe();
    expect(ok).toBe(true);
    expect(subscribeMock).toHaveBeenCalledWith({
      endpoint: "https://push.example/new",
      expiration_time: null,
      keys: { p256dh: "pub", auth: "auth" },
    });
    expect(hook.state.value).toBe("subscribed");
    expect(hook.isSubscribed.value).toBe(true);
    expect(hook.error.value).toBeNull();
  });

  it("returns false and records no backend call when permission is denied", async () => {
    vi.stubGlobal("Notification", {
      permission: "default",
      requestPermission: vi.fn(async () => "denied"),
    });
    const hook = usePushSubscription();
    await nextTick();

    const ok = await hook.subscribe();
    expect(ok).toBe(false);
    expect(subscribeMock).not.toHaveBeenCalled();
    expect(hook.permission.value).toBe("denied");
  });

  it("captures backend errors without throwing", async () => {
    subscribeMock.mockRejectedValueOnce(new Error("boom"));
    const hook = usePushSubscription();
    await nextTick();

    const ok = await hook.subscribe();
    expect(ok).toBe(false);
    expect(hook.error.value).toBe("boom");
  });

  it("unsubscribes and notifies the backend when already subscribed", async () => {
    const existing: MockSub = {
      endpoint: "https://push.example/existing",
      unsubscribe: vi.fn(async () => true),
      toJSON: () => ({
        endpoint: "https://push.example/existing",
        expirationTime: null,
        keys: { p256dh: "p", auth: "a" },
      }),
    };
    registrationSubscription = existing;
    unsubscribeMock.mockResolvedValueOnce(undefined);

    const hook = usePushSubscription();
    await nextTick();
    await nextTick();
    expect(hook.isSubscribed.value).toBe(true);

    const ok = await hook.unsubscribe();
    expect(ok).toBe(true);
    expect(existing.unsubscribe).toHaveBeenCalled();
    expect(unsubscribeMock).toHaveBeenCalledWith("https://push.example/existing");
    expect(hook.isSubscribed.value).toBe(false);
  });

  it("refuses to unsubscribe when there is no active subscription", async () => {
    const hook = usePushSubscription();
    await nextTick();
    const ok = await hook.unsubscribe();
    expect(ok).toBe(false);
    expect(unsubscribeMock).not.toHaveBeenCalled();
  });
});
