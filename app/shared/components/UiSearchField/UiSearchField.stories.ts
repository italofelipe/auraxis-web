import { ref, type Ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";
import type { UiSearchFieldProps } from "./UiSearchField.types";
import UiSearchField from "./UiSearchField.vue";

const meta: Meta<typeof UiSearchField> = {
  title: "Shared/UiSearchField",
  component: UiSearchField,
  tags: ["autodocs"],
  argTypes: {
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof UiSearchField>;

export const Default: Story = {
  args: {
    modelValue: "",
    placeholder: "Buscar...",
  },
  render: (args) => ({
    components: { UiSearchField },
    setup(): { args: UiSearchFieldProps; value: Ref<string> } {
      const value = ref(args.modelValue);
      return { args, value };
    },
    template: "<UiSearchField v-bind=\"args\" v-model=\"value\" />",
  }),
};

export const WithValue: Story = {
  args: {
    modelValue: "bitcoin",
    placeholder: "Buscar ativo...",
  },
  render: (args) => ({
    components: { UiSearchField },
    setup(): { args: UiSearchFieldProps; value: Ref<string> } {
      const value = ref(args.modelValue);
      return { args, value };
    },
    template: "<UiSearchField v-bind=\"args\" v-model=\"value\" />",
  }),
};

export const Disabled: Story = {
  args: {
    modelValue: "",
    placeholder: "Busca desabilitada",
    disabled: true,
  },
  render: (args) => ({
    components: { UiSearchField },
    setup(): { args: UiSearchFieldProps; value: Ref<string> } {
      const value = ref(args.modelValue);
      return { args, value };
    },
    template: "<UiSearchField v-bind=\"args\" v-model=\"value\" />",
  }),
};
