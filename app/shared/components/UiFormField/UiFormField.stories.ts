import type { Meta, StoryObj } from "@storybook/vue3";
import type { UiFormFieldProps } from "./UiFormField.types";
import UiFormField from "./UiFormField.vue";

const meta: Meta<typeof UiFormField> = {
  title: "Shared/UiFormField",
  component: UiFormField,
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    fieldId: { control: "text" },
    error: { control: "text" },
    hint: { control: "text" },
    required: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof UiFormField>;

export const Default: Story = {
  args: {
    label: "Nome completo",
    fieldId: "nome",
    hint: "Informe seu nome como no documento.",
  },
  render: (args) => ({
    components: { UiFormField },
    setup(): { args: UiFormFieldProps } { return { args }; },
    template: `
      <UiFormField v-bind="args">
        <input id="nome" type="text" placeholder="Ex: João Silva" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:4px;" />
      </UiFormField>
    `,
  }),
};

export const Required: Story = {
  args: {
    label: "E-mail",
    fieldId: "email",
    required: true,
  },
  render: (args) => ({
    components: { UiFormField },
    setup(): { args: UiFormFieldProps } { return { args }; },
    template: `
      <UiFormField v-bind="args">
        <input id="email" type="email" placeholder="seu@email.com" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:4px;" />
      </UiFormField>
    `,
  }),
};

export const WithError: Story = {
  args: {
    label: "E-mail",
    fieldId: "email-err",
    required: true,
    error: "E-mail inválido ou já cadastrado.",
  },
  render: (args) => ({
    components: { UiFormField },
    setup(): { args: UiFormFieldProps } { return { args }; },
    template: `
      <UiFormField v-bind="args">
        <input id="email-err" type="email" value="naoé-um-email" style="width:100%;padding:10px;border:1px solid red;border-radius:4px;" />
      </UiFormField>
    `,
  }),
};
