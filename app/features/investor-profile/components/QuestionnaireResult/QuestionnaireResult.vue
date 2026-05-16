<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { ArrowRight, Gauge, ShieldCheck, Target } from "lucide-vue-next";
import type { QuestionnaireResultDto } from "~/features/investor-profile/contracts/investor-profile.dto";

const props = defineProps<{
  /** The questionnaire result from the backend. */
  result: QuestionnaireResultDto;
}>();

const router = useRouter();

interface ProfileContent {
  readonly title: string;
  readonly description: string;
  readonly range: string;
  readonly focus: string;
}

const PROFILE_CONTENT: Record<QuestionnaireResultDto["suggested_profile"], ProfileContent> = {
  conservador: {
    title: "Conservador",
    description:
      "Você prioriza a segurança do patrimônio. Prefere rentabilidade estável a riscos elevados.",
    range: "Proteção",
    focus: "Liquidez e previsibilidade",
  },
  explorador: {
    title: "Explorador",
    description:
      "Você busca equilíbrio entre segurança e crescimento, aceitando riscos moderados.",
    range: "Balanceado",
    focus: "Diversificação gradual",
  },
  entusiasta: {
    title: "Entusiasta",
    description:
      "Você tem alta tolerância ao risco e busca maximizar retornos no longo prazo.",
    range: "Crescimento",
    focus: "Horizonte longo",
  },
};

/** Resolved title and description for the user's profile. */
const profileContent = computed<ProfileContent>(
  () => PROFILE_CONTENT[props.result.suggested_profile],
);

/** Navigates the user to the main dashboard. */
const goToDashboard = (): void => {
  void router.push("/dashboard");
};
</script>

<template>
  <div class="questionnaire-result">
    <div class="questionnaire-result__summary">
      <div class="questionnaire-result__icon-wrap" aria-hidden="true">
        <Target :size="28" />
      </div>

      <div>
        <span class="questionnaire-result__label">Resultado calibrado</span>
        <div class="questionnaire-result__profile-badge">
          {{ profileContent.title }}
        </div>
      </div>
    </div>

    <p class="questionnaire-result__description">{{ profileContent.description }}</p>

    <div class="questionnaire-result__grid">
      <div class="questionnaire-result__metric questionnaire-result__score">
        <Gauge :size="18" aria-hidden="true" />
        <span>Pontuação</span>
        <strong>{{ result.score }}</strong>
      </div>
      <div class="questionnaire-result__metric">
        <ShieldCheck :size="18" aria-hidden="true" />
        <span>Espectro</span>
        <strong>{{ profileContent.range }}</strong>
      </div>
      <div class="questionnaire-result__metric">
        <Target :size="18" aria-hidden="true" />
        <span>Foco</span>
        <strong>{{ profileContent.focus }}</strong>
      </div>
    </div>

    <button
      class="questionnaire-result__cta"
      type="button"
      @click="goToDashboard"
    >
      Ir para o Dashboard
      <ArrowRight :size="16" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.questionnaire-result {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px;
}

.questionnaire-result__summary {
  display: flex;
  align-items: center;
  gap: 16px;
}

.questionnaire-result__icon-wrap {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border: 1px solid var(--color-brand-glow-md);
  border-radius: var(--radius-lg);
  color: var(--color-brand-300);
  background: var(--color-brand-glow-xs);
}

.questionnaire-result__profile-badge {
  margin-top: 6px;
  color: var(--color-text-primary);
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  line-height: 1;
}

.questionnaire-result__label {
  color: var(--color-brand-300);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  text-transform: uppercase;
}

.questionnaire-result__description {
  color: var(--color-text-secondary);
  max-width: 680px;
  margin: 0;
  line-height: 1.6;
}

.questionnaire-result__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.questionnaire-result__metric {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 118px;
  padding: 16px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  color: var(--color-brand-300);
  background: rgba(5, 7, 13, 0.36);
}

.questionnaire-result__metric span {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  text-transform: uppercase;
}

.questionnaire-result__metric strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
}

.questionnaire-result__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: fit-content;
  min-height: 44px;
  padding: 0 18px;
  background: linear-gradient(135deg, var(--color-brand-400), var(--color-brand-600));
  color: #031019;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-extrabold);
  cursor: pointer;
  transition: transform var(--motion-fast);
}

.questionnaire-result__cta:hover {
  transform: translateY(-1px);
}

@media (max-width: 720px) {
  .questionnaire-result__grid {
    grid-template-columns: 1fr;
  }

  .questionnaire-result__cta {
    width: 100%;
  }

  .questionnaire-result__profile-badge {
    font-size: var(--font-size-3xl);
  }
}
</style>
