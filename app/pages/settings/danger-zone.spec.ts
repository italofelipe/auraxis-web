import { describe, expect, it } from "vitest";

/**
 * Data-layer unit tests for the Danger Zone settings page.
 *
 * Full rendering requires Nuxt runtime context (useHead, definePageMeta,
 * useI18n, useLogout). These tests cover the pure business logic that is
 * independent of the Vue component lifecycle:
 *   - isDisabled guard conditions
 *   - Password validation boundary values
 */

/**
 * Replicates the `isDisabled` guard from the danger-zone component.
 *
 * The confirm button is disabled when the trimmed password is empty
 * OR when a deletion request is already pending.
 *
 * @param password - Current password input value.
 * @param isPending - Whether the delete mutation is in-flight.
 * @returns True when the confirm button should be disabled.
 */
function isConfirmDisabled(password: string, isPending: boolean): boolean {
  return password.trim().length === 0 || isPending;
}

describe("DangerZonePage — isDisabled logic", () => {
  it("is disabled when password is empty", (): void => {
    expect(isConfirmDisabled("", false)).toBe(true);
  });

  it("is disabled when password is whitespace only", (): void => {
    expect(isConfirmDisabled("   ", false)).toBe(true);
  });

  it("is disabled when deletion is pending regardless of password", (): void => {
    expect(isConfirmDisabled("MinhaSenha@123", true)).toBe(true);
  });

  it("is enabled when password has non-whitespace content and not pending", (): void => {
    expect(isConfirmDisabled("MinhaSenha@123", false)).toBe(false);
  });

  it("is enabled with a single non-whitespace character", (): void => {
    expect(isConfirmDisabled("x", false)).toBe(false);
  });

  it("is disabled when both password is empty and pending is true", (): void => {
    expect(isConfirmDisabled("", true)).toBe(true);
  });
});
