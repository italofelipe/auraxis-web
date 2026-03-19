import type { Meta, StoryObj } from "@storybook/vue3";
import UiIcon from "./UiIcon.vue";
import type { AuraxisIconName } from "../../utils/icons/icons.types";

const meta: Meta<typeof UiIcon> = {
  title: "Shared/UiIcon",
  component: UiIcon,
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "select",
      options: [
        "dashboard", "wallet", "goals", "tools", "transactions", "analytics",
        "settings", "logout", "user", "notifications", "plus", "minus",
        "search", "close", "chevronRight", "chevronDown", "trendingUp", "trendingDown",
        "eye", "eyeOff", "check", "warning", "info", "upload", "download",
        "filter", "calendar", "menu",
      ] satisfies AuraxisIconName[],
    },
    size: { control: "number" },
    decorative: { control: "boolean" },
    label: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof UiIcon>

export const Default: Story = {
  args: { name: "dashboard", size: 20, decorative: true },
};

export const WithLabel: Story = {
  args: { name: "settings", size: 24, decorative: false, label: "Configurações" },
};

export const AllIcons: Story = {
  render: () => ({
    components: { UiIcon },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; padding: 16px;">
        <div v-for="name in names" :key="name" style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
          <UiIcon :name="name" :size="24" />
          <span style="font-size: 11px; color: var(--color-text-muted)">{{ name }}</span>
        </div>
      </div>
    `,
    data: () => ({
      names: [
        "dashboard", "wallet", "goals", "tools", "transactions", "analytics",
        "settings", "logout", "user", "notifications", "plus", "minus",
        "search", "close", "chevronRight", "chevronDown", "trendingUp", "trendingDown",
        "eye", "eyeOff", "check", "warning", "info", "upload", "download",
        "filter", "calendar", "menu",
      ],
    }),
  }),
};
