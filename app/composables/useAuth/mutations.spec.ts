import type { AuthApi } from "./types";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useForgotPasswordMutation,
  useLoginMutation,
  useRegisterMutation,
  useResetPasswordMutation,
} from "./mutations";

const useMutationMock = vi.hoisted(() => vi.fn());
const useHttpMock = vi.hoisted(() => vi.fn());
const createAuthApiMock = vi.hoisted(() => vi.fn());
const signInMock = vi.hoisted(() => vi.fn());
const captureMock = vi.hoisted(() => vi.fn());
const identifyMock = vi.hoisted(() => vi.fn());
const resetMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useMutation: useMutationMock,
}));

vi.mock("~/composables/useHttp", () => ({
  useHttp: useHttpMock,
}));

vi.mock("~/composables/useAnalytics", () => ({
  useAnalytics: (): { capture: typeof captureMock; identify: typeof identifyMock; reset: typeof resetMock } => ({
    capture: captureMock,
    identify: identifyMock,
    reset: resetMock,
  }),
}));

vi.mock("~/stores/session", () => ({
  useSessionStore: (): { signIn: typeof signInMock } => ({
    signIn: signInMock,
  }),
}));

vi.mock("./api", () => ({
  createAuthApi: createAuthApiMock,
}));

describe("useAuth/mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMutationMock.mockImplementation((options: unknown) => options);
  });

  it("usa API injetada em useLoginMutation e dispara signIn no sucesso", () => {
    const authApi: AuthApi = {
      login: vi.fn(),
      register: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    };

    const mutation = useLoginMutation(authApi) as unknown as {
      mutationFn: unknown;
      onSuccess: (response: {
        accessToken: string;
        refreshToken?: string;
        user: {
          email: string;
          emailConfirmed?: boolean;
          emailConfirmationDeadlineAt?: string | null;
          emailConfirmationBlocked?: boolean;
        };
      }) => void;
    };

    expect(mutation.mutationFn).toBe(authApi.login);

    mutation.onSuccess({
      accessToken: "login-token",
      refreshToken: "login-refresh",
      user: {
        email: "login@auraxis.com",
        emailConfirmed: true,
        emailConfirmationDeadlineAt: "2026-06-03T10:00:00Z",
        emailConfirmationBlocked: false,
      },
    });

    expect(signInMock).toHaveBeenCalledWith({
      accessToken: "login-token",
      refreshToken: "login-refresh",
      userEmail: "login@auraxis.com",
      emailConfirmed: true,
      emailConfirmationDeadlineAt: "2026-06-03T10:00:00Z",
      emailConfirmationBlocked: false,
    });
    expect(identifyMock).toHaveBeenCalledWith("login@auraxis.com");
    expect(captureMock).toHaveBeenCalledWith("user_signed_in", {
      email_confirmed: true,
    });
  });

  it("usa API injetada em useRegisterMutation sem autenticar antes do login", () => {
    const authApi: AuthApi = {
      login: vi.fn(),
      register: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    };

    const mutation = useRegisterMutation(authApi) as unknown as {
      mutationFn: unknown;
      onSuccess: (response: { message: string; user: { email: string; emailConfirmed?: boolean } }) => void;
    };

    expect(mutation.mutationFn).toBe(authApi.register);

    mutation.onSuccess({
      message: "User created successfully",
      user: { email: "register@auraxis.com", emailConfirmed: false },
    });

    expect(signInMock).not.toHaveBeenCalled();
    expect(identifyMock).not.toHaveBeenCalled();
    expect(captureMock).toHaveBeenCalledWith("user_registered", {
      email_confirmed: false,
    });
  });

  it("usa API injetada em useForgotPasswordMutation", () => {
    const authApi: AuthApi = {
      login: vi.fn(),
      register: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    };

    const mutation = useForgotPasswordMutation(authApi) as unknown as {
      mutationFn: unknown;
    };

    expect(mutation.mutationFn).toBe(authApi.forgotPassword);
  });

  it("usa null como refreshToken quando nao e fornecido em useLoginMutation", () => {
    const authApi: AuthApi = {
      login: vi.fn(),
      register: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    };

    const mutation = useLoginMutation(authApi) as unknown as {
      onSuccess: (response: {
        accessToken: string;
        refreshToken?: string;
        user: {
          email: string;
          emailConfirmed?: boolean;
          emailConfirmationDeadlineAt?: string | null;
          emailConfirmationBlocked?: boolean;
        };
      }) => void;
    };

    mutation.onSuccess({
      accessToken: "token-no-refresh",
      user: { email: "test@auraxis.com", emailConfirmed: false },
    });

    expect(signInMock).toHaveBeenCalledWith({
      accessToken: "token-no-refresh",
      refreshToken: null,
      userEmail: "test@auraxis.com",
      emailConfirmed: false,
      emailConfirmationDeadlineAt: null,
      emailConfirmationBlocked: false,
    });
  });

  it("captura registro mesmo quando a resposta nao expoe dados do usuario", () => {
    const authApi: AuthApi = {
      login: vi.fn(),
      register: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    };

    const mutation = useRegisterMutation(authApi) as unknown as {
      onSuccess: (response: { message: string; user?: { email: string; emailConfirmed?: boolean } }) => void;
    };

    mutation.onSuccess({
      message: "Registration request accepted.",
    });

    expect(signInMock).not.toHaveBeenCalled();
    expect(captureMock).toHaveBeenCalledWith("user_registered", {
      email_confirmed: false,
    });
  });

  it("usa API injetada em useResetPasswordMutation", () => {
    const authApi: AuthApi = {
      login: vi.fn(),
      register: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    };

    const mutation = useResetPasswordMutation(authApi) as unknown as {
      mutationFn: unknown;
    };

    expect(mutation.mutationFn).toBe(authApi.resetPassword);
  });

  it("resolve API por createAuthApi quando dependencia nao e injetada", () => {
    const resolvedAuthApi: AuthApi = {
      login: vi.fn(),
      register: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    };

    useHttpMock.mockReturnValue({ post: vi.fn() });
    createAuthApiMock.mockReturnValue(resolvedAuthApi);

    const loginMutation = useLoginMutation() as unknown as { mutationFn: unknown };
    const registerMutation = useRegisterMutation() as unknown as { mutationFn: unknown };
    const forgotMutation = useForgotPasswordMutation() as unknown as { mutationFn: unknown };
    const resetMutation = useResetPasswordMutation() as unknown as { mutationFn: unknown };

    expect(createAuthApiMock).toHaveBeenCalledTimes(4);
    expect(loginMutation.mutationFn).toBe(resolvedAuthApi.login);
    expect(registerMutation.mutationFn).toBe(resolvedAuthApi.register);
    expect(forgotMutation.mutationFn).toBe(resolvedAuthApi.forgotPassword);
    expect(resetMutation.mutationFn).toBe(resolvedAuthApi.resetPassword);
  });
});
