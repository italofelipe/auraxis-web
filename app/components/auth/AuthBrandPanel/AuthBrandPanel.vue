<script setup lang="ts">
import { ArrowUp, ShieldCheck } from "lucide-vue-next";
import { useRoute } from "#app";
import type { AuthFeature } from "../AuthFeatureList/AuthFeatureList.types";

const route = useRoute();

interface AuthPanelCopy {
  variant: "simple" | "security"
  badge: string
  headline: string
  sub: string
  features: AuthFeature[]
}

const panel = computed<AuthPanelCopy>(() => {
  if (route.path.includes("register")) {
    return {
      variant: "simple",
      badge: "Onboarding",
      headline: "Crie sua conta e ligue seu painel de controle financeiro.",
      sub: "Cadastro curto, linguagem clara e experiência consistente com o analytics principal.",
      features: [
        { icon: "", title: "Configuração rápida", description: "Comece em menos de 2 minutos." },
        { icon: "", title: "Leitura imediata", description: "Entenda receitas e despesas no primeiro acesso." },
        { icon: "", title: "Modo analítico", description: "Aprofunde por categoria e transação." },
        { icon: "", title: "Evolução contínua", description: "Metas, carteira e ferramentas integradas." },
      ],
    };
  }

  if (route.path.includes("forgot-password")) {
    return {
      variant: "security",
      badge: "Security DNA Active",
      headline: "Proteção de Nível Institucional",
      sub: "Nossa infraestrutura de segurança monitora anomalias em tempo real, garantindo que seu patrimônio esteja protegido com criptografia militar e autenticação contextual.",
      features: [],
    };
  }

  return {
    variant: "simple",
    badge: "Acesso seguro",
    headline: "Volte ao seu painel de analytics em segundos.",
    sub: "Resumo executivo para decisões rápidas e profundidade analítica para investigar cada variação.",
    features: [
      { icon: "", title: "Visão rápida", description: "Saldo, variação e ação recomendada." },
      { icon: "", title: "Profundidade", description: "Drill-down por categoria e transação." },
      { icon: "", title: "Consistência", description: "Mesmo padrão visual do dashboard." },
      { icon: "", title: "Controle", description: "Dados claros para decisões precisas." },
    ],
  };
});
</script>

<template>
  <aside
    class="auth-brand"
    :class="{ 'auth-brand--security': panel.variant === 'security' }"
    :aria-label="$t('authBrandPanel.ariaLabel')"
  >
    <!-- Logo -->
    <a class="auth-brand__logo" href="/">
      <span class="auth-brand__logo-mark" aria-hidden="true">
        <ShieldCheck v-if="panel.variant === 'security'" :size="22" />
        <template v-else>
          A
        </template>
      </span>
      <span class="auth-brand__logo-name">Auraxis</span>
    </a>

    <!-- Copy block -->
    <div class="auth-brand__copy">
      <span v-if="panel.variant === 'security'" class="auth-brand__security-badge">
        <span class="auth-brand__security-dot" aria-hidden="true" />
        {{ panel.badge }}
      </span>
      <span v-else class="auth-brand__badge">{{ panel.badge }}</span>
      <h1 class="auth-brand__headline">
        {{ panel.headline }}
      </h1>
      <p class="auth-brand__sub">{{ panel.sub }}</p>

      <article
        v-if="panel.variant === 'security'"
        class="auth-brand__security-card glass"
        aria-label="Indicadores de segurança"
      >
        <div class="auth-brand__security-card-head">
          <div>
            <p class="auth-brand__security-label">Taxa de Mitigação de Ameaças</p>
            <p class="auth-brand__security-value">
              99.98<span>%</span>
            </p>
          </div>
          <span class="auth-brand__security-delta">
            <ArrowUp :size="10" aria-hidden="true" />
            0.02% 24h
          </span>
        </div>

        <svg class="auth-brand__security-chart" viewBox="0 0 520 140" role="img" aria-label="Curva de mitigação de ameaças">
          <defs>
            <linearGradient id="securityStroke" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stop-color="#44d4ff" />
              <stop offset="100%" stop-color="#8b7dff" />
            </linearGradient>
          </defs>
          <polyline
            points="4,104 48,98 92,89 136,94 180,72 224,79 268,58 312,62 356,44 400,48 444,31 516,24"
            fill="none"
            stroke="url(#securityStroke)"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <polyline
            points="4,122 48,112 92,116 136,104 180,98 224,88 268,94 312,80 356,83 400,67 444,72 516,54"
            fill="none"
            stroke="#42e8a9"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.35"
          />
        </svg>

        <div class="auth-brand__security-grid">
          <div>
            <p>Criptografia</p>
            <strong>AES-256-GCM</strong>
          </div>
          <div>
            <p>Nós de Validação</p>
            <strong><span aria-hidden="true" />2,408 Ativos</strong>
          </div>
        </div>
      </article>
    </div>

    <!-- Highlights grid -->
    <div v-if="panel.variant === 'simple'" class="auth-brand__highlights">
      <AuthFeatureList :features="panel.features" />
    </div>

    <footer v-if="panel.variant === 'security'" class="auth-brand__footer">
      <span>© 2026 Auraxis Fintech</span>
      <NuxtLink to="/privacy-policy">Privacidade</NuxtLink>
      <NuxtLink to="/terms-of-service">Termos</NuxtLink>
      <span class="auth-brand__version">SYS.VER.4.2.9</span>
    </footer>
  </aside>
</template>

<style scoped>
.auth-brand {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  min-height: 100dvh;
  padding: var(--space-8);
  border-right: 1px solid var(--color-outline-soft);
  background:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(170deg, rgba(18, 26, 42, 0.9), rgba(5, 7, 13, 0.96));
  background-size: 44px 44px, 44px 44px, auto;
  color: var(--color-text-primary);
  overflow: hidden;
}

.auth-brand--security {
  padding: var(--space-8);
}

.auth-brand:not(.auth-brand--security) {
  justify-content: flex-start;
  gap: clamp(var(--space-7), 8vh, var(--space-10));
}

/* Logo */
.auth-brand__logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: var(--font-weight-extrabold);
  letter-spacing: 0.01em;
  text-decoration: none;
  color: inherit;
}

.auth-brand__logo-mark {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, var(--color-brand-500), var(--color-accent));
  color: #0b1626;
  font-weight: var(--font-weight-extrabold);
}

.auth-brand--security .auth-brand__logo-mark {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  box-shadow: 0 0 28px rgba(68, 212, 255, 0.2);
}

.auth-brand__logo-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
}

/* Badge */
.auth-brand__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  border: 1px solid var(--color-brand-glow-lg);
  border-radius: var(--radius-full);
  padding: 7px 12px;
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-brand-500);
  background: rgba(68, 212, 255, 0.1);
}

.auth-brand__security-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  width: fit-content;
  border: 1px solid rgba(68, 212, 255, 0.2);
  border-radius: var(--radius-full);
  padding: 6px 12px;
  background: rgba(68, 212, 255, 0.1);
  color: var(--color-brand-500);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.auth-brand__security-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--color-brand-500);
  box-shadow: 0 0 14px rgba(68, 212, 255, 0.8);
}

/* Copy */
.auth-brand__copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-brand__headline {
  font-size: clamp(var(--font-size-3xl), 4vw, var(--font-size-4xl));
  line-height: 1.08;
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.01em;
  margin: 0;
}

.auth-brand--security .auth-brand__headline {
  max-width: 18ch;
  font-size: clamp(2.5rem, 4vw, 3rem);
  line-height: 1.08;
  background: linear-gradient(90deg, #ffffff, #aeb8d4);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.auth-brand--security .auth-brand__copy {
  gap: var(--space-3);
}

.auth-brand__sub {
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  max-width: 48ch;
  margin: 0;
}

.auth-brand__metric {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  width: min(100%, 520px);
  margin-top: var(--space-6);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
}

.glass {
  background: linear-gradient(175deg, rgba(18, 26, 42, 0.82), rgba(10, 15, 26, 0.9));
  border: 1px solid var(--color-outline-soft);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(8px);
}

.auth-brand__metric-label {
  margin: 0 0 var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.auth-brand__metric-value {
  margin: 0;
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: var(--font-size-heading-md);
  font-weight: var(--font-weight-bold);
}

.auth-brand__metric-delta {
  align-self: center;
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  background: rgba(139, 125, 255, 0.12);
  color: var(--color-brand-500);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
}

.auth-brand__security-card {
  position: relative;
  width: min(100%, 520px);
  margin-top: var(--space-5);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.auth-brand__security-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.03), transparent 52%);
  pointer-events: none;
}

.auth-brand__security-card-head {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-5);
  margin-bottom: var(--space-3);
}

.auth-brand__security-label,
.auth-brand__security-grid p {
  margin: 0 0 var(--space-1);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
}

.auth-brand__security-value {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
}

.auth-brand__security-value span {
  margin-left: var(--space-1);
  color: var(--color-brand-500);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
}

.auth-brand__security-delta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  background: rgba(139, 125, 255, 0.12);
  color: var(--color-accent);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
}

.auth-brand__security-chart {
  position: relative;
  display: block;
  width: 100%;
  height: 118px;
}

.auth-brand__security-grid {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.auth-brand__security-grid strong {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.auth-brand__security-grid strong span {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-brand-500);
}

/* Highlights */
.auth-brand__highlights {
  margin-top: 0;
}

.auth-brand__footer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--space-4);
  margin-top: var(--space-6);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.auth-brand__footer a {
  color: inherit;
  text-decoration: none;
}

.auth-brand__footer a:hover {
  color: var(--color-text-primary);
}

.auth-brand__version {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  opacity: 0.55;
}
</style>
