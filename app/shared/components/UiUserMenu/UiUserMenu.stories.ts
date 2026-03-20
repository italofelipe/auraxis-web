import type { Meta, StoryObj } from "@storybook/vue3";
import UiUserMenu from "./UiUserMenu.vue";

const meta: Meta<typeof UiUserMenu> = {
  title: "Shared/UiUserMenu",
  component: UiUserMenu,
  tags: ["autodocs"],
  argTypes: {
    name: { control: "text" },
    description: { control: "text" },
    avatarUrl: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof UiUserMenu>

export const WithFallbackAvatar: Story = {
  args: {
    name: "João Silva",
    description: "Investidor Arrojado",
  },
};

export const WithAvatarUrl: Story = {
  args: {
    name: "João Silva",
    description: "Investidor Arrojado",
    avatarUrl: "https://i.pravatar.cc/40?img=3",
  },
};

export const NoDescription: Story = {
  args: {
    name: "Maria Santos",
  },
};
