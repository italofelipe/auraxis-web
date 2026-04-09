import type { ComputedRef } from "vue";

/**
 * Return type of the useToolCta composable.
 */
export interface UseToolCtaReturn {
  /**
   * True when the user is NOT authenticated.
   * Components should render the guest CTA only when this is true.
   */
  showCta: ComputedRef<boolean>;
}
