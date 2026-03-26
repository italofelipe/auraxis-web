import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useForgotPasswordForm,
  useLoginForm,
  useRegisterForm,
} from "./forms";

const useFormMock = vi.hoisted(() => vi.fn());
const toTypedSchemaMock = vi.hoisted(() => vi.fn());

vi.mock("vee-validate", () => ({
  useForm: useFormMock,
}));

vi.mock("@vee-validate/zod", () => ({
  toTypedSchema: toTypedSchemaMock,
}));

describe("useAuth/forms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toTypedSchemaMock.mockImplementation((schema: unknown) => schema);
    useFormMock.mockImplementation((input: unknown) => input);
  });

  it("cria formulario de login com valores iniciais esperados", () => {
    const result = useLoginForm() as unknown as {
      initialValues: {
        email: string;
        password: string;
      };
    };

    expect(useFormMock).toHaveBeenCalledTimes(1);
    expect(result.initialValues).toEqual({
      email: "",
      password: "",
    });
  });

  it("cria formulario de registro com todos os campos esperados", () => {
    const result = useRegisterForm() as unknown as {
      initialValues: {
        name: string;
        email: string;
        password: string;
        confirmPassword: string;
      };
    };

    expect(useFormMock).toHaveBeenCalledTimes(1);
    expect(result.initialValues).toEqual({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  });

  it("cria formulario de forgot password com email vazio", () => {
    const result = useForgotPasswordForm() as unknown as {
      initialValues: {
        email: string;
      };
    };

    expect(useFormMock).toHaveBeenCalledTimes(1);
    expect(result.initialValues).toEqual({
      email: "",
    });
  });
});
