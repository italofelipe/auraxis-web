import type { AuthApi } from "./types";

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useForgotPasswordMutation,
  useLoginMutation,
  useRegisterMutation,
} from "./mutations";

const useMutationMock = vi.hoisted(() => vi.fn());
const useHttpMock = vi.hoisted(() => vi.fn());
const createAuthApiMock = vi.hoisted(() => vi.fn());
const signInMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/vue-query", () => ({
  useMutation: useMutationMock,
}));

vi.mock("~/composables/useHttp", () => ({
  useHttp: useHttpMock,
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
      onSuccess: (response: { accessToken: string; refreshToken?: string; user: { email: string; emailConfirmed?: boolean } }) => void;
    };

    expect(mutation.mutationFn).toBe(authApi.login);

    mutation.onSuccess({
      accessToken: "login-token",
      refreshToken: "login-refresh",
      user: { email: "login@auraxis.com", emailConfirmed: true },
    });

    expect(signInMock).toHaveBeenCalledWith({
      accessToken: "login-token",
      refreshToken: "login-refresh",
      userEmail: "login@auraxis.com",
      emailConfirmed: true,
    });
  });

  it("usa API injetada em useRegisterMutation e dispara signIn no sucesso", () => {
    const authApi: AuthApi = {
      login: vi.fn(),
      register: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    };

    const mutation = useRegisterMutation(authApi) as unknown as {
      mutationFn: unknown;
      onSuccess: (response: { accessToken: string; refreshToken?: string; user: { email: string; emailConfirmed?: boolean } }) => void;
    };

    expect(mutation.mutationFn).toBe(authApi.register);

    mutation.onSuccess({
      accessToken: "register-token",
      refreshToken: "register-refresh",
      user: { email: "register@auraxis.com", emailConfirmed: false },
    });

    expect(signInMock).toHaveBeenCalledWith({
      accessToken: "register-token",
      refreshToken: "register-refresh",
      userEmail: "register@auraxis.com",
      emailConfirmed: false,
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

    expect(createAuthApiMock).toHaveBeenCalledTimes(3);
    expect(loginMutation.mutationFn).toBe(resolvedAuthApi.login);
    expect(registerMutation.mutationFn).toBe(resolvedAuthApi.register);
    expect(forgotMutation.mutationFn).toBe(resolvedAuthApi.forgotPassword);
  });
});
