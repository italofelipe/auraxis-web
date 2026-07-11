<script setup lang="ts">
import { ref } from "vue";
import { NButton, NModal } from "naive-ui";
import { Sparkles } from "lucide-vue-next";

import AiInsightLoadingModal from "./AiInsightLoadingModal.vue";
import UiUpgradePrompt from "~/components/paywall/UiUpgradePrompt.vue";
import { useAIInsights } from "~/features/ai-insights/composables/useAIInsights";
import type { InsightSourceSurface } from "~/features/ai-insights/contracts/ai-insight";

const props = withDefaults(defineProps<{
  sourceSurface?: InsightSourceSurface;
  anchorDate?: string;
}>(), {
  sourceSurface: "dashboard",
  anchorDate: undefined,
});

const {
  generate,
  checkChangeStatus,
  grantAIConsent,
  hasAIConsent,
  hasPremium,
  isLoading,
  isGrantingAIConsent,
  callsRemaining,
  callsRemainingMonth,
} = useAIInsights();

const showLoadingModal = ref(false);
const showPaywallModal = ref(false);
const showConsentModal = ref(false);
const showNoChangeModal = ref(false);

/**
 * Detects the API error emitted when AI consent has not been granted yet.
 *
 * @param error Unknown thrown value.
 * @returns True when the error is the backend AI consent gate.
 */
const isAIConsentRequiredError = (error: unknown): boolean =>
  error !== null &&
  typeof error === "object" &&
  "code" in error &&
  (error as { code?: string }).code === "AI_CONSENT_REQUIRED";

/**
 * Runs insight generation while keeping the loading modal lifecycle isolated.
 */
const generateWithLoading = async (): Promise<void> => {
  showLoadingModal.value = true;
  try {
    await generate({
      periodType: "daily",
      sourceSurface: props.sourceSurface,
      // Explicit user click (#1546): regenerate past the server-side dedupe.
      // Quota (1/day) still applies server-side for non-admin users.
      forceRegenerate: true,
      ...(props.anchorDate ? { anchorDate: props.anchorDate } : {}),
    });
  } finally {
    showLoadingModal.value = false;
  }
};

/**
 * Runs generation, recovering from the backend AI-consent gate.
 */
const runGenerate = async (): Promise<void> => {
  try {
    await generateWithLoading();
  } catch (error) {
    if (isAIConsentRequiredError(error)) {
      showConsentModal.value = true;
      return;
    }
    throw error;
  }
};

/**
 * Returns true when nothing changed since the last insight for the period.
 *
 * Degrades gracefully: any failure (e.g. endpoint unavailable) is treated as
 * "changed" so generation is never blocked by the pre-check.
 *
 * @returns Whether the snapshot is unchanged since the last insight.
 */
const isUnchangedSinceLastInsight = async (): Promise<boolean> => {
  try {
    const status = await checkChangeStatus({
      periodType: "daily",
      ...(props.anchorDate ? { anchorDate: props.anchorDate } : {}),
    });
    return status.changed === false;
  } catch {
    return false;
  }
};

/**
 * Handles the AI insight trigger, gating free users behind the upgrade modal
 * and confirming generation when nothing has changed since the last insight.
 */
const handleClick = async (): Promise<void> => {
  if (!hasPremium.value) {
    showPaywallModal.value = true;
    return;
  }

  if (!(await hasAIConsent())) {
    showConsentModal.value = true;
    return;
  }

  if (await isUnchangedSinceLastInsight()) {
    showNoChangeModal.value = true;
    return;
  }

  await runGenerate();
};

/**
 * Confirms generation from the "nothing changed" modal and proceeds anyway.
 */
const handleGenerateAnyway = async (): Promise<void> => {
  showNoChangeModal.value = false;
  await runGenerate();
};

/**
 * Records AI consent explicitly and retries the generation request.
 */
const handleConsentAccept = async (): Promise<void> => {
  await grantAIConsent();
  showConsentModal.value = false;

  try {
    await generateWithLoading();
  } catch (error) {
    if (isAIConsentRequiredError(error)) {
      showConsentModal.value = true;
      return;
    }
    throw error;
  }
};
</script>

<template>
  <div class="ai-insight-button">
    <NButton
      type="primary"
      size="medium"
      class="ai-insight-button__trigger"
      :loading="isLoading"
      @click="handleClick"
    >
      <template #icon>
        <Sparkles :size="17" />
      </template>
      Gerar insight com IA
      <span v-if="!hasPremium" class="ai-insight-button__premium-badge">
        Premium
      </span>
    </NButton>

    <p v-if="callsRemaining !== null" class="ai-insight-button__remaining">
      <span v-if="callsRemaining > 0">
        {{ callsRemaining }} {{ callsRemaining === 1 ? "insight restante" : "insights restantes" }} hoje
      </span>
      <span v-else>Limite diário atingido</span>
      <span v-if="callsRemainingMonth !== null">
        · {{ callsRemainingMonth }} no mês
      </span>
    </p>

    <AiInsightLoadingModal v-model="showLoadingModal" />

    <NModal
      v-model:show="showPaywallModal"
      preset="card"
      class="ai-insight-button__paywall"
      style="width: min(440px, calc(100vw - 32px))"
      title="Insights com IA"
    >
      <UiUpgradePrompt
        feature-name="Premium"
        description="Usuários free recebem 1 insight automático por mês. Para gerar novas análises quando quiser, assine o plano Premium."
        cta-label="Assinar Premium"
      />
    </NModal>

    <NModal
      v-model:show="showNoChangeModal"
      preset="card"
      class="ai-insight-button__no-change"
      style="width: min(480px, calc(100vw - 32px))"
      title="Gerar novo insight?"
      data-testid="ai-no-change-modal"
    >
      <section class="ai-insight-no-change">
        <p>
          Notamos que não houve movimentação desde o último insight gerado.
          Deseja gerar mesmo assim? Isso consome 1 geração do seu dia.
        </p>
        <footer class="ai-insight-no-change__actions">
          <NButton @click="showNoChangeModal = false">Cancelar</NButton>
          <NButton
            type="primary"
            :loading="isLoading"
            data-testid="ai-generate-anyway"
            @click="handleGenerateAnyway"
          >
            Gerar mesmo assim
          </NButton>
        </footer>
      </section>
    </NModal>

    <NModal
      v-model:show="showConsentModal"
      preset="card"
      class="ai-insight-button__consent"
      style="width: min(520px, calc(100vw - 32px))"
      title="Consentimento para IA"
    >
      <section class="ai-insight-consent">
        <p>
          Para gerar insights, a Auraxis analisará suas transações, categorias e
          valores financeiros do período selecionado. Esses dados serão usados
          apenas para criar sua análise e não serão usados para treinar modelos.
        </p>

        <footer class="ai-insight-consent__actions">
          <NButton :disabled="isGrantingAIConsent" @click="showConsentModal = false">
            Cancelar
          </NButton>
          <NButton
            type="primary"
            :loading="isGrantingAIConsent"
            data-testid="ai-consent-accept"
            @click="handleConsentAccept"
          >
            Concordar e gerar
          </NButton>
        </footer>
      </section>
    </NModal>
  </div>
</template>

<style scoped>
.ai-insight-button {
  display: inline-grid;
  justify-self: start;
  gap: var(--space-1);
  align-items: start;
}

.ai-insight-button__trigger {
  --n-color: linear-gradient(135deg, var(--color-brand-500), #67e8f9);
  --n-color-hover: linear-gradient(135deg, var(--color-brand-600), #22d3ee);
  --n-color-pressed: var(--color-brand-700);
  --n-border: 0;
  --n-border-hover: 0;
  --n-border-pressed: 0;
  min-height: 40px;
  font-weight: var(--font-weight-semibold);
  box-shadow: 0 16px 34px rgba(14, 165, 233, 0.24);
}

.ai-insight-button__premium-badge {
  display: inline-flex;
  align-items: center;
  margin-left: var(--space-1);
  padding: 1px 8px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.22);
  color: inherit;
  font-size: var(--font-size-body-xs);
  line-height: 1.5;
}

.ai-insight-button__remaining {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.ai-insight-button__paywall {
  max-width: 440px;
}

.ai-insight-button__consent {
  max-width: 520px;
}

.ai-insight-consent {
  display: grid;
  gap: var(--space-4);
}

.ai-insight-consent p {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.ai-insight-consent__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.ai-insight-no-change {
  display: grid;
  gap: var(--space-4);
}

.ai-insight-no-change p {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.ai-insight-no-change__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
</style>
