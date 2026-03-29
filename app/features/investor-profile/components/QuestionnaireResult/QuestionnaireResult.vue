<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import type { QuestionnaireResultDto } from "~/features/investor-profile/contracts/investor-profile.dto";

const props = defineProps<{
  /** The questionnaire result from the backend. */
  result: QuestionnaireResultDto;
}>();

const router = useRouter();

interface ProfileContent {
  readonly title: string;
  readonly description: string;
}

const PROFILE_CONTENT: Record<QuestionnaireResultDto["suggested_profile"], ProfileContent> = {
  conservador: {
    title: "Conservador",
    description:
      "Você prioriza a segurança do patrimônio. Prefere rentabilidade estável a riscos elevados.",
  },
  explorador: {
    title: "Explorador",
    description:
      "Você busca equilíbrio entre segurança e crescimento, aceitando riscos moderados.",
  },
  entusiasta: {
    title: "Entusiasta",
    description:
      "Você tem alta tolerância ao risco e busca maximizar retornos no longo prazo.",
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
    <div class="questionnaire-result__icon-wrap" aria-hidden="true">
      <span class="questionnaire-result__icon">🎯</span>
    </div>

    <div class="questionnaire-result__profile-badge">
      {{ profileContent.title }}
    </div>

    <p class="questionnaire-result__description">{{ profileContent.description }}</p>

    <div class="questionnaire-result__score">
      Pontuação: <strong>{{ result.score }}</strong>
    </div>

    <button
      class="questionnaire-result__cta"
      type="button"
      @click="goToDashboard"
    >
      Ir para o Dashboard
    </button>
  </div>
</template>

<style scoped>
.questionnaire-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3, 12px);
  text-align: center;
  padding: var(--space-4, 24px) var(--space-3, 12px);
}

.questionnaire-result__icon-wrap {
  font-size: var(--font-size-4xl, 3rem);
  line-height: 1;
}

.questionnaire-result__icon {
  display: block;
}

.questionnaire-result__profile-badge {
  font-size: var(--font-size-xl, 1.5rem);
  font-weight: var(--font-weight-bold, 700);
  color: var(--color-brand-600, #6366f1);
  background: var(--color-brand-50, #eef2ff);
  padding: var(--space-1, 4px) var(--space-3, 12px);
  border-radius: var(--radius-full, 9999px);
}

.questionnaire-result__description {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-text-secondary, #444);
  max-width: 380px;
  margin: 0;
  line-height: 1.6;
}

.questionnaire-result__score {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-text-muted, #888);
}

.questionnaire-result__cta {
  margin-top: var(--space-2, 8px);
  padding: 12px var(--space-4, 24px);
  background: var(--color-brand-600, #6366f1);
  color: #fff;
  border: none;
  border-radius: var(--radius-md, 8px);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-semibold, 600);
  cursor: pointer;
  transition: background 0.15s ease;
}

.questionnaire-result__cta:hover {
  background: var(--color-brand-500, #818cf8);
}
</style>
