import type { ComputedRef } from "vue";

import { useSessionStore } from "~/stores/session";
import { useFeatureFlag } from "~/shared/feature-flags/use-feature-flag";

/** Feature flag gating the social login entry points (staged rollout). */
export const SOCIAL_LOGIN_FLAG = "web.features.social-login";

export type SocialProvider = "google" | "facebook";

/** Shape of the api-v2 `POST /v2/auth/session/refresh` response. */
interface SessionRefreshResponse {
  readonly access_token: string;
  readonly email: string | null;
}

/** Reactive surface returned by {@link useSocialLogin}. */
export interface UseSocialLoginReturn {
  readonly isEnabled: ComputedRef<boolean>;
  readonly initiate: (provider: SocialProvider) => void;
  readonly completeCallback: () => Promise<void>;
}

/**
 * Social login flow (ADR-0005). `initiate` redirects to the api-v2 authorize
 * endpoint; the backend runs the OAuth handshake, sets the httpOnly session
 * cookie and bounces back to `/auth/callback`, where `completeCallback`
 * exchanges that cookie for an access token and populates the session.
 *
 * The api-v2 session endpoint is a distinct cross-origin surface (its own
 * cookie + host), so it is called directly with `credentials: "include"` rather
 * than through the v1 httpClient.
 *
 * @returns The feature-flag state, the `initiate` and `completeCallback` actions.
 */
export function useSocialLogin(): UseSocialLoginReturn {
  const config = useRuntimeConfig();
  const session = useSessionStore();
  const isEnabled = useFeatureFlag(SOCIAL_LOGIN_FLAG);

  /**
   * The api-v2 base URL without a trailing slash.
   *
   * @returns The normalized base URL.
   */
  const apiV2Base = (): string => String(config.public.apiV2Base).replace(/\/$/, "");

  /**
   * Redirects to the provider's authorize endpoint on api-v2.
   *
   * @param provider The OAuth provider to start the flow with.
   */
  const initiate = (provider: SocialProvider): void => {
    if (typeof window === "undefined") {
      return;
    }
    window.location.href = `${apiV2Base()}/v2/auth/oauth/${provider}/authorize`;
  };

  /**
   * Exchanges the httpOnly session cookie for an access token and signs the
   * user in. Throws if there is no active session cookie or the call fails.
   */
  const completeCallback = async (): Promise<void> => {
    const resp = await $fetch<SessionRefreshResponse>(
      `${apiV2Base()}/v2/auth/session/refresh`,
      { method: "POST", credentials: "include" },
    );
    session.signIn({ accessToken: resp.access_token, userEmail: resp.email ?? "" });
  };

  return { isEnabled, initiate, completeCallback };
}
