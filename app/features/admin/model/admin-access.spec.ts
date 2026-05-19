import { describe, expect, it } from "vitest";
import { getAdminAccessFromToken } from "./admin-access";

/**
 * Builds an unsigned JWT-like token for claim parsing tests.
 *
 * @param payload JWT payload claims.
 * @returns Token-shaped string.
 */
const tokenWithPayload = (payload: Record<string, unknown>): string => {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64url");
  return `header.${encodedPayload}.signature`;
};

describe("admin access claims", () => {
  it("allows users with an admin role claim", () => {
    const access = getAdminAccessFromToken(tokenWithPayload({ roles: ["user", "admin"] }));

    expect(access.isAdmin).toBe(true);
    expect(access.roles).toEqual(["user", "admin"]);
  });

  it("allows users with an admin permission claim", () => {
    const access = getAdminAccessFromToken(tokenWithPayload({ permissions: ["admin:access"] }));

    expect(access.isAdmin).toBe(true);
    expect(access.permissions).toEqual(["admin:access"]);
  });

  it("blocks invalid tokens and regular users", () => {
    expect(getAdminAccessFromToken("not-a-jwt").isAdmin).toBe(false);
    expect(getAdminAccessFromToken(tokenWithPayload({ roles: ["user"] })).isAdmin).toBe(false);
    expect(getAdminAccessFromToken(null).isAdmin).toBe(false);
  });
});
