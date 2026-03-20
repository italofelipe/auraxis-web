import { ref, type Ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";
import type { UiPasswordFieldProps } from "./UiPasswordField.types";
import UiPasswordField from "./UiPasswordField.vue";

const meta: Meta<typeof UiPasswordField> = {
  title: "Shared/UiPasswordField",
  component: UiPasswordField,
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    fieldId: { control: "text" },
    placeholder: { control: "text" },
    error: { control: "text" },
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    autocomplete: {
      control: "select",
      options: ["current-password", "new-password", "off"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof UiPasswordField>;

export const Default: Story = {
  args: {
    modelValue: "",
    label: "Senha",
    fieldId: "password",
    placeholder: "Digite sua senha",
  },
  render: (args) => ({
    components: { UiPasswordField },
    setup(): { args: UiPasswordFieldProps; value: Ref<string> } {
      const value = ref(args.modelValue);
      return { args, value };
    },
    template: "<UiPasswordField v-bind=\"args\" v-model=\"value\" />",
  }),
};

export const WithError: Story = {
  args: {
    modelValue: "abc",
    label: "Senha",
    fieldId: "password-err",
    error: "A senha deve ter no mínimo 8 caracteres.",
    required: true,
  },
  render: (args) => ({
    components: { UiPasswordField },
    setup(): { args: UiPasswordFieldProps; value: Ref<string> } {
      const value = ref(args.modelValue);
      return { args, value };
    },
    template: "<UiPasswordField v-bind=\"args\" v-model=\"value\" />",
  }),
};

export const Disabled: Story = {
  args: {
    modelValue: "senhadesabilitada",
    label: "Senha",
    fieldId: "password-disabled",
    disabled: true,
  },
  render: (args) => ({
    components: { UiPasswordField },
    setup(): { args: UiPasswordFieldProps; value: Ref<string> } {
      const value = ref(args.modelValue);
      return { args, value };
    },
    template: "<UiPasswordField v-bind=\"args\" v-model=\"value\" />",
  }),
};
