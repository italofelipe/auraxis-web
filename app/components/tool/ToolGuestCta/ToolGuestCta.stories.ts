/**
 * ToolGuestCta stories.
 *
 * The component internally calls useToolCta() which reads the session store.
 * To isolate the visual states, the stories use inline wrapper components
 * that simulate each auth scenario.
 */
import type { Meta, StoryObj } from "@storybook/vue3";
import { type VNode, defineComponent, h } from "vue";
import { NButton } from "naive-ui";
import { Sparkles, ArrowRight } from "lucide-vue-next";
import ToolGuestCta from "./ToolGuestCta.vue";

/**
 * Visual simulation of the CTA in its visible state (guest user).
 * Mirrors ToolGuestCta layout without depending on the session store.
 */
const GuestCtaDemo = defineComponent({
  name: "GuestCtaDemo",
  components: { NButton, Sparkles, ArrowRight },
  template: `
    <div style="background:linear-gradient(135deg,var(--color-bg-surface),var(--color-bg-elevated));border-top:1px solid var(--color-outline-soft);padding:40px 24px">
      <div style="max-width:720px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:24px;text-align:center">
        <div style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:9999px;background:var(--color-brand-600);color:#fff;font-size:11px;font-weight:600;text-transform:uppercase">
          <Sparkles :size="14" aria-hidden="true" /> Trial grátis
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px">
          <h2 style="margin:0;font-size:28px;font-weight:700;color:var(--color-text-primary);line-height:1.25;max-width:600px">
            Salve este cálculo e organize suas finanças
          </h2>
          <p style="margin:0;font-size:16px;color:var(--color-text-secondary);max-width:520px;line-height:1.6">
            Controle seus gastos, simule cenários e tome decisões financeiras mais inteligentes com o Auraxis.
          </p>
        </div>
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px">
          <NButton type="primary" size="large">Experimentar grátis <ArrowRight :size="16" /></NButton>
          <NButton quaternary size="large">Já tenho conta</NButton>
        </div>
        <p style="margin:0;font-size:12px;color:var(--color-text-muted)">
          Grátis para sempre. Sem cartão de crédito.
        </p>
      </div>
    </div>
  `,
});

const meta: Meta<typeof ToolGuestCta> = {
  title: "Features/Tools/ToolGuestCta",
  component: ToolGuestCta,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
**ToolGuestCta** is the shared guest conversion banner shown at the bottom of every tool page for unauthenticated visitors.

- Rendered only when the user has **no active session** (via \`useToolCta()\`)
- Invisible to authenticated users of any plan
- Replaces the inline CTAs previously hardcoded in each tool page
- Routes to \`/auth/register\` and \`/auth/login\`

**Usage:**
\`\`\`vue
<!-- Drop at the end of any tool page template -->
<ToolGuestCta />
\`\`\`
        `.trim(),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ToolGuestCta>;

/**
 * Visitor (not authenticated) — full CTA with features, CTAs and trust line.
 */
export const VisitorState: Story = {
  render: (): ReturnType<typeof defineComponent> => ({
    components: { GuestCtaDemo },
    setup(): () => VNode {
      return () => h(GuestCtaDemo);
    },
  }),
};

/**
 * Authenticated user — component renders nothing.
 */
export const AuthenticatedState: Story = {
  render: (): ReturnType<typeof defineComponent> => ({
    setup(): () => VNode {
      return () =>
        h(
          "div",
          {
            style:
              "padding:40px;text-align:center;color:var(--color-text-secondary);font-size:14px",
          },
          "Componente não renderiza para usuários autenticados."
        );
    },
  }),
};
