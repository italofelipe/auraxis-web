import type { Meta, StoryObj } from "@storybook/vue3";
import AuthFeatureList from "./AuthFeatureList.vue";
import type { AuthFeature } from "./AuthFeatureList.types";

const meta: Meta<typeof AuthFeatureList> = {
  title: "Auth/AuthFeatureList",
  component: AuthFeatureList,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "List of platform benefits shown alongside auth forms. Uses built-in defaults when no features prop is provided.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AuthFeatureList>;

export const DefaultFeatures: Story = {
  name: "Default (built-in features)",
  args: {},
};

const customFeatures: AuthFeature[] = [
  { icon: "🚀", title: "Onboarding rápido", description: "Configure tudo em menos de 2 minutos." },
  { icon: "📈", title: "Relatórios detalhados", description: "Acompanhe sua evolução financeira mês a mês." },
];

export const CustomFeatures: Story = {
  name: "Custom features",
  args: { features: customFeatures },
};
