/**
 * UiPaywallGate stories.
 *
 * Each story uses an inline wrapper to simulate a specific entitlement state
 * (loading / access granted / access denied / unresolved) without requiring
 * a real authentication context.
 */

import type { Meta, StoryObj } from "@storybook/vue3";
import { NSkeleton } from "naive-ui";
import { type VNode, defineComponent, h } from "vue";
import UiPaywallGate from "./UiPaywallGate.vue";

/**
 * Inline simulation components that replicate the three gate states
 * without hitting the real entitlements API.
 */

const LoadingDemo = defineComponent({
  name: "LoadingDemo",
  components: { NSkeleton },
  template: `
    <div class="ui-paywall-gate" style="width:320px">
      <NSkeleton height="120px" :sharp="false" />
    </div>
  `,
});

const UnlockedDemo = defineComponent({
  name: "UnlockedDemo",
  template: `
    <div class="ui-paywall-gate" style="width:320px;padding:16px;border:1px solid var(--color-outline-soft,#333);border-radius:8px">
      <p style="margin:0;color:var(--color-text-primary,#fff)">
        ✅ Conteúdo Premium — acesso liberado
      </p>
    </div>
  `,
});

const LockedDemo = defineComponent({
  name: "LockedDemo",
  template: `
    <div class="ui-paywall-gate" style="width:320px">
      <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:24px;text-align:center;border:1px dashed var(--color-outline-soft,#555);border-radius:8px">
        <span style="font-size:14px;color:var(--color-text-secondary,#aaa)">🔒 Conteúdo bloqueado — slot <code>locked</code></span>
      </div>
    </div>
  `,
});

const meta: Meta<typeof UiPaywallGate> = {
  title: "Design System/UiPaywallGate",
  component: UiPaywallGate,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
**UiPaywallGate** envolve conteúdo premium com verificação de entitlement.

Prioridade de renderização:
1. **Skeleton** enquanto \`isLoading\` for verdadeiro
2. **\`<slot />\`** quando \`hasAccess === true\`
3. **\`<slot name="locked" />\`** nos demais casos

A verificação real é feita pelo composable \`useEntitlementQuery\`.
As stories abaixo mostram cada estado de forma isolada (sem chamada real à API).
        `.trim(),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UiPaywallGate>;

/**
 * Estado de carregamento — exibe skeleton enquanto o entitlement é verificado.
 */
export const Loading: Story = {
  render: () => ({
    components: { LoadingDemo },
    template: "<LoadingDemo />",
  }),
};

/**
 * Acesso liberado — o conteúdo premium é exibido via slot padrão.
 */
export const Unlocked: Story = {
  render: () => ({
    components: { UnlockedDemo },
    template: "<UnlockedDemo />",
  }),
};

/**
 * Acesso negado — exibe o slot `locked` (tipicamente UiUpgradePrompt).
 */
export const Locked: Story = {
  render: () => ({
    components: { LockedDemo },
    template: "<LockedDemo />",
  }),
};

/**
 * Composição completa — mostra UiPaywallGate com ambos os slots definidos.
 * Em produção, o estado real virá de useEntitlementQuery.
 */
export const ComposedWithSlots: Story = {
  render: () => ({
    components: { UiPaywallGate },
    setup(): () => VNode {
      return () =>
        h(
          "div",
          { style: "display:flex;flex-direction:column;gap:24px;padding:16px;" },
          [
            h("p", { style: "color:var(--color-text-secondary,#aaa);font-size:12px;margin:0" },
              "Exemplo de composição — o estado final depende da resposta da API de entitlement."),
            h(
              UiPaywallGate,
              { feature: "advanced_simulations" },
              {
                default: () =>
                  h("div", {
                    style: "padding:16px;background:var(--color-bg-elevated,#1a1a2e);border-radius:8px;color:var(--color-text-primary,#fff)",
                  }, "Conteúdo premium"),
                locked: () =>
                  h("div", {
                    style: "padding:16px;border:1px dashed var(--color-outline-soft,#555);border-radius:8px;text-align:center;color:var(--color-text-secondary,#aaa)",
                  }, "🔒 Slot de upgrade"),
              }
            ),
          ]
        );
    },
  }),
};
