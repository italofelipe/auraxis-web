import { computed, ref, type ComputedRef, type Ref } from "vue";
import { useRuntimeConfig } from "#app";

import {
  usePushNotificationsClient,
  type PushNotificationsClient,
} from "~/features/notifications/services/push-notifications.client";
import type { PushSubscriptionPayloadDto } from "~/features/notifications/contracts/push-subscription.dto";

export type PushPermissionState = "default" | "granted" | "denied";

export type PushSupportState =
  | "unsupported"
  | "unconfigured"
  | "ready"
  | "subscribed";

export interface UsePushSubscriptionReturn {
  readonly isSupported: ComputedRef<boolean>;
  readonly permission: Ref<PushPermissionState>;
  readonly state: ComputedRef<PushSupportState>;
  readonly isSubscribed: ComputedRef<boolean>;
  readonly isBusy: Ref<boolean>;
  readonly error: Ref<string | null>;
  readonly subscribe: () => Promise<boolean>;
  readonly unsubscribe: () => Promise<boolean>;
}

/**
 * Decodes a VAPID base64-URL public key into the Uint8Array expected by
 * the Web Push `subscribe()` call.
 *
 * @param base64 - VAPID public key, base64-URL-safe encoded.
 * @returns Byte array representation of the key.
 */
export const urlBase64ToUint8Array = (base64: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalised);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
};

/**
 * Serialises a browser PushSubscription into the backend contract shape.
 *
 * @param subscription - PushSubscription returned by the browser PushManager.
 * @returns Payload ready to POST to `/notifications/subscribe`.
 */
export const serialisePushSubscription = (
  subscription: PushSubscription,
): PushSubscriptionPayloadDto => {
  const json = subscription.toJSON();
  const keys = json.keys ?? {};
  return {
    endpoint: json.endpoint ?? subscription.endpoint,
    expiration_time: json.expirationTime ?? null,
    keys: {
      p256dh: keys.p256dh ?? "",
      auth: keys.auth ?? "",
    },
  };
};

interface PushFlowDeps {
  readonly client: PushNotificationsClient;
  readonly vapidPublicKey: string;
  readonly permission: Ref<PushPermissionState>;
  readonly currentSubscription: Ref<PushSubscription | null>;
  readonly isBusy: Ref<boolean>;
  readonly error: Ref<string | null>;
  readonly isSupported: Ref<boolean> | { value: boolean };
}

/**
 * Executes the subscribe flow end-to-end: permission prompt, browser
 * subscribe and backend registration.
 *
 * @param deps - Mutable refs and static deps shared across the composable.
 * @returns True when the browser and backend both acknowledged.
 */
const runSubscribe = async (deps: PushFlowDeps): Promise<boolean> => {
  if (!deps.isSupported.value || !deps.vapidPublicKey) { return false; }
  deps.isBusy.value = true;
  deps.error.value = null;
  try {
    const permissionResult = (await Notification.requestPermission()) as PushPermissionState;
    deps.permission.value = permissionResult;
    if (permissionResult !== "granted") { return false; }
    const registration = await navigator.serviceWorker.ready;
    const applicationServerKey = urlBase64ToUint8Array(deps.vapidPublicKey).buffer as ArrayBuffer;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
    await deps.client.subscribe(serialisePushSubscription(subscription));
    deps.currentSubscription.value = subscription;
    return true;
  } catch (err) {
    deps.error.value = err instanceof Error ? err.message : "push_subscribe_failed";
    return false;
  } finally {
    deps.isBusy.value = false;
  }
};

/**
 * Executes the unsubscribe flow end-to-end: browser unsubscribe followed
 * by backend cleanup.
 *
 * @param deps - Mutable refs and static deps shared across the composable.
 * @returns True when the browser and backend both acknowledged.
 */
const runUnsubscribe = async (deps: PushFlowDeps): Promise<boolean> => {
  if (!deps.isSupported.value || !deps.currentSubscription.value) { return false; }
  deps.isBusy.value = true;
  deps.error.value = null;
  try {
    const endpoint = deps.currentSubscription.value.endpoint;
    await deps.currentSubscription.value.unsubscribe();
    await deps.client.unsubscribe(endpoint);
    deps.currentSubscription.value = null;
    return true;
  } catch (err) {
    deps.error.value = err instanceof Error ? err.message : "push_unsubscribe_failed";
    return false;
  } finally {
    deps.isBusy.value = false;
  }
};

/**
 * Composable that encapsulates the Web Push opt-in flow.
 *
 * Responsibilities: feature-detect Web Push support and VAPID key availability;
 * expose reactive permission + subscription state; subscribe/unsubscribe via
 * the service worker registration; forward the resulting PushSubscription to
 * the backend for dispatch. The composable stays UI-agnostic — callers decide
 * how to surface errors.
 *
 * @returns Reactive state and actions driving the notifications settings UI.
 */
export const usePushSubscription = (): UsePushSubscriptionReturn => {
  const runtimeConfig = useRuntimeConfig();
  const vapidPublicKey = runtimeConfig.public.vapidPublicKey as string;

  const client = usePushNotificationsClient();

  const permission = ref<PushPermissionState>("default");
  const currentSubscription = ref<PushSubscription | null>(null);
  const isBusy = ref<boolean>(false);
  const error = ref<string | null>(null);

  const isSupported = computed<boolean>(() => {
    if (typeof window === "undefined") { return false; }
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  });

  const isSubscribed = computed<boolean>(() => currentSubscription.value !== null);

  const state = computed<PushSupportState>(() => {
    if (!isSupported.value) { return "unsupported"; }
    if (!vapidPublicKey) { return "unconfigured"; }
    if (isSubscribed.value) { return "subscribed"; }
    return "ready";
  });

  const deps: PushFlowDeps = {
    client,
    vapidPublicKey,
    permission,
    currentSubscription,
    isBusy,
    error,
    isSupported,
  };

  if (typeof window !== "undefined" && isSupported.value) {
    void (async (): Promise<void> => {
      permission.value = Notification.permission as PushPermissionState;
      const registration = await navigator.serviceWorker.getRegistration();
      currentSubscription.value = (await registration?.pushManager.getSubscription()) ?? null;
    })();
  }

  return {
    isSupported,
    permission,
    state,
    isSubscribed,
    isBusy,
    error,
    subscribe: (): Promise<boolean> => runSubscribe(deps),
    unsubscribe: (): Promise<boolean> => runUnsubscribe(deps),
  };
};
