import { ref, type Ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";
import type { UiSegmentedControlOption, UiSegmentedControlProps } from "./UiSegmentedControl.types";
import UiSegmentedControl from "./UiSegmentedControl.vue";

const meta: Meta<typeof UiSegmentedControl> = {
  title: "Shared/UiSegmentedControl",
  component: UiSegmentedControl,
  tags: ["autodocs"],
  argTypes: {
    ariaLabel: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof UiSegmentedControl>;

const periodOptions: UiSegmentedControlOption[] = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
];

export const Default: Story = {
  args: {
    modelValue: "month",
    options: periodOptions,
    ariaLabel: "Selecionar período",
  },
  render: (args) => ({
    components: { UiSegmentedControl },
    setup(): { args: UiSegmentedControlProps; value: Ref<string> } {
      const value = ref(args.modelValue);
      return { args, value };
    },
    template: "<UiSegmentedControl v-bind=\"args\" v-model=\"value\" />",
  }),
};

export const WithDisabledOption: Story = {
  args: {
    modelValue: "day",
    options: [
      { value: "day", label: "Dia" },
      { value: "week", label: "Semana" },
      { value: "month", label: "Mês", disabled: true },
      { value: "year", label: "Ano" },
    ],
    ariaLabel: "Selecionar período",
  },
  render: (args) => ({
    components: { UiSegmentedControl },
    setup(): { args: UiSegmentedControlProps; value: Ref<string> } {
      const value = ref(args.modelValue);
      return { args, value };
    },
    template: "<UiSegmentedControl v-bind=\"args\" v-model=\"value\" />",
  }),
};
