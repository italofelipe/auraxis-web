import { describe, expect, it } from "vitest";

import * as useAuthModule from "./index";

describe("useAuth/index", () => {
  it("expoe API publica do modulo", () => {
    expect(useAuthModule.createAuthApi).toBeTypeOf("function");
    expect(useAuthModule.useLoginForm).toBeTypeOf("function");
    expect(useAuthModule.useRegisterForm).toBeTypeOf("function");
    expect(useAuthModule.useForgotPasswordForm).toBeTypeOf("function");
    expect(useAuthModule.useLoginMutation).toBeTypeOf("function");
    expect(useAuthModule.useRegisterMutation).toBeTypeOf("function");
    expect(useAuthModule.useForgotPasswordMutation).toBeTypeOf("function");
    expect(useAuthModule.useResetPasswordMutation).toBeTypeOf("function");
  });
});
