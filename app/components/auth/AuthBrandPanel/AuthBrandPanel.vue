<script setup lang="ts">
import { computed } from "vue";
import {
  ArrowRight,
  CalendarCheck2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-vue-next";
import { useRoute } from "#app";

const { t } = useI18n();
const route = useRoute();

type AuthVariant = "login" | "register" | "recover";

const variant = computed<AuthVariant>(() => {
  if (route.path.startsWith("/register")) {
    return "register";
  }
  if (route.path.startsWith("/forgot-password") || route.path.startsWith("/reset-password")) {
    return "recover";
  }
  return "login";
});

interface HeroCopy {
  readonly badge: string;
  readonly headline: string;
  readonly sub: string;
}

const copy = computed<HeroCopy>(() => {
  if (variant.value === "register") {
    return {
      badge: "Comece em minutos",
      headline: "Crie sua conta e ligue seu painel financeiro.",
      sub: "Cadastro curto, linguagem clara e uma experiência consistente com o painel principal.",
    };
  }
  if (variant.value === "recover") {
    return {
      badge: "Recuperação segura",
      headline: "Recupere o acesso com tranquilidade.",
      sub: "Enviamos um link seguro para você voltar à sua conta em instantes, sem complicação.",
    };
  }
  return {
    badge: t("auth.login.hero.badge"),
    headline: t("auth.login.hero.headline"),
    sub: t("auth.login.hero.subtitle"),
  };
});

const chips = computed(() => [
  { icon: CalendarCheck2, label: t("auth.login.chips.month") },
  { icon: Target, label: t("auth.login.chips.goals") },
  { icon: Sparkles, label: t("auth.login.chips.insights") },
]);
</script>

<template>
  <section class="auth-hero" :class="`auth-hero--${variant}`" :aria-label="$t('authBrandPanel.ariaLabel')">
    <span class="auth-hero__badge">
      <TrendingUp v-if="variant === 'login'" :size="14" aria-hidden="true" />
      <Sparkles v-else-if="variant === 'register'" :size="14" aria-hidden="true" />
      <ShieldCheck v-else :size="14" aria-hidden="true" />
      {{ copy.badge }}
    </span>

    <h1 class="auth-hero__headline">{{ copy.headline }}</h1>
    <p class="auth-hero__sub">{{ copy.sub }}</p>

    <template v-if="variant === 'login'">
      <div class="auth-hero__ctas">
        <NuxtLink to="/register" class="auth-hero__cta auth-hero__cta--primary">
          {{ t("auth.login.hero.ctaCreate") }}
          <ArrowRight :size="18" aria-hidden="true" />
        </NuxtLink>
        <NuxtLink to="/forgot-password" class="auth-hero__cta auth-hero__cta--ghost">
          {{ t("auth.login.hero.ctaRecover") }}
        </NuxtLink>
      </div>

      <ul class="auth-hero__chips">
        <li v-for="chip in chips" :key="chip.label" class="auth-hero__chip">
          <component :is="chip.icon" :size="15" aria-hidden="true" />
          {{ chip.label }}
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.auth-hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.auth-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 13px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-positive) 14%, var(--color-bg-surface));
  color: var(--color-positive-dark);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.auth-hero__headline {
  margin: 18px 0 0;
  max-width: 11ch;
  font-size: clamp(2rem, 4.2vw, 3.25rem);
  line-height: 1.03;
  font-weight: var(--font-weight-extrabold);
  letter-spacing: -0.03em;
  color: var(--color-text-primary);
}

.auth-hero__sub {
  margin: 18px 0 0;
  max-width: 30ch;
  font-size: var(--font-size-md);
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.auth-hero__ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 24px;
}

.auth-hero__cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 50px;
  padding: 0 26px;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
  transition: transform 180ms ease, filter 180ms ease;
}

.auth-hero__cta--primary {
  border: none;
  background: linear-gradient(135deg, var(--color-accent, #1fb6c9), var(--color-brand-500, #11a07c));
  color: var(--color-text-on-brand);
  box-shadow: var(--shadow-brand-glow, none);
}

.auth-hero__cta--ghost {
  padding: 0 24px;
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
}

.auth-hero__cta:hover {
  transform: translateY(-1px);
  filter: brightness(1.03);
}

.auth-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 26px 0 0;
  padding: 0;
  list-style: none;
}

.auth-hero__chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 15px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-outline-soft);
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.auth-hero__chip svg {
  color: var(--color-brand-500);
}

@media (max-width: 1100px) {
  .auth-hero__headline {
    font-size: clamp(1.8rem, 4vw, 2.6rem);
  }
}

@media (max-width: 860px) {
  .auth-hero {
    align-items: center;
    text-align: center;
  }

  .auth-hero__headline,
  .auth-hero__sub {
    max-width: 100%;
  }

  .auth-hero__ctas,
  .auth-hero__chips {
    justify-content: center;
  }
}
</style>
