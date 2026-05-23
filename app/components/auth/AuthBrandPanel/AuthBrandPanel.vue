<script setup lang="ts">
import {
  ArrowUp,
  Coins,
  Flag,
  Leaf,
  ShieldCheck,
  TrendingUp,
} from "lucide-vue-next";
import { useRoute } from "#app";
import type { AuthFeature } from "../AuthFeatureList/AuthFeatureList.types";

const route = useRoute();

interface AuthPanelCopy {
  variant: "simple" | "security" | "growth"
  badge: string
  headline: string
  sub: string
  features: AuthFeature[]
}

const growthMetrics = [
  {
    label: "Patrimônio em evolução",
    value: "R$ 100.290,00",
    note: "+15,81% este mês",
    tone: "positive",
  },
  {
    label: "Próxima meta",
    value: "Viagem dos sonhos",
    note: "R$ 8.450,00 / R$ 15.000",
    tone: "goal",
  },
  {
    label: "Reserva de emergência",
    value: "R$ 13.423,38",
    note: "67% concluído",
    tone: "safe",
  },
  {
    label: "Investimentos",
    value: "+14,50%",
    note: "Rentabilidade em 12 meses",
    tone: "positive",
  },
] as const;

const growthValues = [
  {
    icon: Flag,
    title: "Crescimento com propósito",
    description: "Metas claras para cada sonho que importa.",
  },
  {
    icon: TrendingUp,
    title: "Progresso visível",
    description: "Acompanhe sua evolução passo a passo.",
  },
  {
    icon: Coins,
    title: "Decisões que constroem",
    description: "Planeje, invista e ajuste com inteligência.",
  },
  {
    icon: Leaf,
    title: "Liberdade financeira",
    description: "Mais tempo, tranquilidade e escolhas para você.",
  },
] as const;

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
    variant: "growth",
    badge: "Acesso seguro e protegido",
    headline: "Transforme controle em liberdade para crescer.",
    sub: "Organize hoje, planeje amanhã e acompanhe cada conquista financeira com clareza.",
    features: [],
  };
});
</script>

<template>
  <aside
    class="auth-brand"
    :class="{
      'auth-brand--security': panel.variant === 'security',
      'auth-brand--growth': panel.variant === 'growth',
    }"
    :aria-label="$t('authBrandPanel.ariaLabel')"
  >
    <!-- Logo -->
    <a class="auth-brand__logo" href="/">
      <span class="auth-brand__logo-mark" aria-hidden="true">
        <ShieldCheck v-if="panel.variant === 'security'" :size="22" />
        <template v-else-if="panel.variant === 'growth'">
          A
        </template>
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
              <stop offset="0%" stop-color="var(--color-brand-500)" />
              <stop offset="100%" stop-color="var(--color-accent)" />
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
            stroke="var(--color-positive)"
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

    <section
      v-if="panel.variant === 'growth'"
      class="auth-brand__growth-card"
      aria-label="Prévia de crescimento financeiro"
    >
      <span class="auth-brand__secure-pill">
        <ShieldCheck :size="14" aria-hidden="true" />
        {{ panel.badge }}
      </span>

      <div class="auth-brand__journey" aria-hidden="true">
        <svg class="auth-brand__journey-scene" viewBox="0 0 680 420">
          <defs>
            <linearGradient id="journeySky" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#f7fcff" />
              <stop offset="58%" stop-color="#e5f7ff" />
              <stop offset="100%" stop-color="#d8f6ef" />
            </linearGradient>
            <linearGradient id="journeyMountain" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#7fd6f1" />
              <stop offset="100%" stop-color="#1d7fa3" />
            </linearGradient>
            <linearGradient id="journeyForest" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color="#5ccda9" />
              <stop offset="100%" stop-color="#0b5f4a" />
            </linearGradient>
            <filter id="journeyGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values="0 0 0 0 0.99 0 0 0 0 0.72 0 0 0 0 0.22 0 0 0 0.62 0"
              />
              <feBlend in="SourceGraphic" />
            </filter>
          </defs>
          <rect width="680" height="420" fill="transparent" />
          <circle cx="558" cy="76" r="42" fill="#fff7d8" opacity="0.86" />
          <path
            d="M236 296 L402 86 L616 296 Z"
            fill="url(#journeyMountain)"
            opacity="0.88"
          />
          <path
            d="M402 86 L450 198 L370 158 Z"
            fill="#f7fcff"
            opacity="0.92"
          />
          <path
            d="M30 316 C92 266 144 246 210 256 C280 268 320 320 398 300 C476 280 534 246 650 286 L650 420 L30 420 Z"
            fill="url(#journeyForest)"
            opacity="0.86"
          />
          <path
            d="M346 354 C436 314 506 282 496 238 C486 196 406 206 424 164 C438 130 496 116 538 94"
            fill="none"
            stroke="#f6c24b"
            stroke-linecap="round"
            stroke-width="10"
            filter="url(#journeyGlow)"
          />
          <path
            d="M346 354 C436 314 506 282 496 238 C486 196 406 206 424 164 C438 130 496 116 538 94"
            fill="none"
            stroke="#fff6cb"
            stroke-dasharray="18 18"
            stroke-linecap="round"
            stroke-width="4"
          />
          <path d="M538 94 V52" stroke="#087fa7" stroke-linecap="round" stroke-width="5" />
          <path d="M540 54 L588 70 L540 88 Z" fill="#36c8ea" />
          <circle cx="538" cy="94" r="9" fill="#087fa7" />
          <circle cx="354" cy="356" r="18" fill="#061527" opacity="0.9" />
          <path d="M354 374 L336 420 H378 Z" fill="#123b5d" opacity="0.9" />
        </svg>
      </div>

      <div class="auth-brand__growth-metrics">
        <article
          v-for="metric in growthMetrics"
          :key="metric.label"
          class="auth-brand__growth-metric"
          :class="`auth-brand__growth-metric--${metric.tone}`"
        >
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.note }}</small>
        </article>
      </div>
    </section>

    <!-- Highlights grid -->
    <div v-if="panel.variant === 'simple'" class="auth-brand__highlights">
      <AuthFeatureList :features="panel.features" />
    </div>

    <div v-if="panel.variant === 'growth'" class="auth-brand__growth-values">
      <article v-for="item in growthValues" :key="item.title" class="auth-brand__growth-value">
        <component :is="item.icon" :size="20" aria-hidden="true" />
        <h2>{{ item.title }}</h2>
        <p>{{ item.description }}</p>
      </article>
    </div>

    <footer v-if="panel.variant === 'security'" class="auth-brand__footer">
      <span>© 2026 Auraxis Fintech</span>
      <NuxtLink to="/privacy-policy">Privacidade</NuxtLink>
      <NuxtLink to="/terms-of-service">Termos</NuxtLink>
      <NuxtLink to="/cookies">Cookies</NuxtLink>
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
  --auth-panel-grid-line: color-mix(in srgb, var(--color-text-primary) 4%, transparent);
  padding: var(--space-8);
  border-right: 1px solid var(--color-outline-soft);
  background:
    linear-gradient(var(--auth-panel-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--auth-panel-grid-line) 1px, transparent 1px),
    linear-gradient(170deg, var(--color-bg-surface), var(--color-bg-elevated));
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

.auth-brand--growth {
  --auth-growth-warm-glow: rgba(246, 194, 75, 0.22);
  --auth-growth-mint-glow: rgba(66, 232, 169, 0.18);
  --auth-growth-background: linear-gradient(160deg, rgb(255 255 255), rgb(244 251 255) 46%, rgb(238 250 244));
  display: grid;
  grid-template-columns: minmax(250px, 0.78fr) minmax(420px, 1.22fr);
  grid-template-areas:
    "logo logo"
    "copy canvas"
    "values values";
  align-content: center;
  align-items: start;
  gap: clamp(var(--space-5), 2.7vw, var(--space-8)) clamp(var(--space-7), 4vw, var(--space-10));
  padding: clamp(var(--space-7), 4vw, var(--space-9));
  border-right-color: color-mix(in srgb, var(--color-brand-500) 14%, transparent);
  background:
    radial-gradient(circle at 78% 16%, var(--auth-growth-warm-glow), transparent 24%),
    radial-gradient(circle at 24% 72%, var(--auth-growth-mint-glow), transparent 28%),
    linear-gradient(var(--auth-panel-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--auth-panel-grid-line) 1px, transparent 1px),
    var(--auth-growth-background);
  background-size: auto, auto, 44px 44px, 44px 44px, auto;
}

:global(:root[data-theme="dark"] .auth-brand--growth) {
  --auth-panel-grid-line: color-mix(in srgb, var(--color-text-primary) 8%, transparent);
  --auth-growth-warm-glow: rgba(246, 194, 75, 0.1);
  --auth-growth-mint-glow: rgba(66, 232, 169, 0.12);
  --auth-growth-background:
    linear-gradient(160deg, rgb(5 12 24), rgb(9 23 39) 52%, rgb(4 33 31));
}

.auth-brand--growth .auth-brand__logo {
  grid-area: logo;
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
  color: var(--color-text-on-brand);
  font-weight: var(--font-weight-extrabold);
}

.auth-brand--security .auth-brand__logo-mark {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-brand-glow-sm);
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
  background: var(--color-brand-hover-surface);
}

.auth-brand__security-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  width: fit-content;
  border: 1px solid var(--color-brand-glow-sm);
  border-radius: var(--radius-full);
  padding: 6px 12px;
  background: var(--color-brand-hover-surface);
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
  box-shadow: var(--shadow-brand-glow-sm);
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
  background: linear-gradient(90deg, var(--color-text-primary), var(--color-text-secondary));
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

.auth-brand--growth .auth-brand__copy {
  grid-area: copy;
  align-items: flex-start;
  max-width: 360px;
  padding-top: var(--space-1);
}

.auth-brand--growth .auth-brand__headline {
  max-width: 12ch;
  font-size: clamp(2.25rem, 3vw, var(--font-size-heading-lg));
  letter-spacing: 0;
}

.auth-brand--growth .auth-brand__sub {
  max-width: 36ch;
  color: var(--color-text-secondary);
  line-height: var(--line-height-body-md);
}

.auth-brand__growth-card {
  grid-area: canvas;
  position: relative;
  display: grid;
  min-height: clamp(420px, 33vw, 540px);
  margin-top: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.auth-brand__secure-pill {
  position: absolute;
  top: var(--space-1);
  right: var(--space-2);
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 34px;
  padding: 0 var(--space-3);
  border: 1px solid color-mix(in srgb, var(--color-positive) 24%, var(--color-outline-soft));
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-positive);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  box-shadow: none;
  backdrop-filter: none;
}

.auth-brand__journey {
  position: absolute;
  inset: var(--space-4) 0 0 clamp(120px, 21%, 190px);
  z-index: 1;
}

.auth-brand__journey-scene {
  display: block;
  width: 100%;
  height: 100%;
}

.auth-brand__growth-metrics {
  position: relative;
  z-index: 2;
  display: grid;
  align-content: center;
  gap: var(--space-3);
  width: min(290px, 45%);
  padding: var(--space-7) 0 var(--space-5);
}

.auth-brand__growth-metric {
  display: grid;
  gap: var(--space-1);
  min-height: auto;
  padding: var(--space-2) 0 var(--space-2) var(--space-3);
  border: 0;
  border-left: 2px solid color-mix(in srgb, var(--color-brand-500) 28%, transparent);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.auth-brand__growth-metric span,
.auth-brand__growth-metric small {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-body-sm);
}

.auth-brand__growth-metric strong {
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);
  line-height: 1.1;
}

.auth-brand__growth-metric--positive small,
.auth-brand__growth-metric--positive strong {
  color: var(--color-positive);
}

.auth-brand__growth-metric--goal small {
  color: var(--color-brand-600);
}

.auth-brand__growth-metric--safe strong {
  color: var(--color-brand-700);
}

.auth-brand__growth-values {
  grid-area: values;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(var(--space-4), 2vw, var(--space-7));
  padding: var(--space-5) 0 0;
  border: 0;
  border-top: 1px solid color-mix(in srgb, var(--color-brand-500) 14%, var(--color-outline-soft));
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.auth-brand__growth-value {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  text-align: center;
}

.auth-brand__growth-value svg {
  width: 40px;
  height: 40px;
  padding: 9px;
  border-radius: var(--radius-full);
  border: 1px solid color-mix(in srgb, var(--color-positive) 22%, var(--color-outline-soft));
  background: transparent;
  color: var(--color-positive);
}

.auth-brand__growth-value h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.auth-brand__growth-value p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-body-sm);
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
  background: linear-gradient(175deg, var(--color-bg-glass), var(--color-bg-surface));
  border: 1px solid var(--color-outline-soft);
  box-shadow: var(--shadow-card);
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
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
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
  background: linear-gradient(145deg, var(--color-outline-ghost), transparent 52%);
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
  background: color-mix(in srgb, var(--color-accent) 14%, transparent);
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
  border-top: 1px solid var(--color-outline-subtle);
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

@media (max-width: 1320px) {
  .auth-brand--growth {
    grid-template-columns: 1fr;
    grid-template-areas:
      "logo"
      "copy"
      "canvas"
      "values";
    align-content: start;
    gap: var(--space-5);
  }

  .auth-brand--growth .auth-brand__copy {
    max-width: 560px;
  }

  .auth-brand--growth .auth-brand__headline {
    max-width: 14ch;
  }

  .auth-brand__growth-card {
    min-height: 420px;
  }

  .auth-brand__journey {
    inset: var(--space-4) 0 0 clamp(110px, 24%, 170px);
  }

  .auth-brand__growth-values {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .auth-brand {
    min-height: auto;
    height: auto;
    padding: var(--space-5) var(--space-4) 0;
    border-right: none;
    overflow: visible;
  }

  .auth-brand--growth {
    gap: var(--space-4);
    background:
      radial-gradient(circle at 74% 8%, var(--auth-growth-warm-glow), transparent 24%),
      var(--auth-growth-background);
  }

  .auth-brand:not(.auth-brand--security) {
    gap: var(--space-4);
  }

  .auth-brand__headline,
  .auth-brand--growth .auth-brand__headline {
    max-width: 12ch;
    font-size: var(--font-size-heading-md);
  }

  .auth-brand__sub {
    font-size: var(--font-size-sm);
  }

  .auth-brand__growth-card,
  .auth-brand__growth-values,
  .auth-brand__highlights,
  .auth-brand__security-card,
  .auth-brand__footer {
    display: none;
  }
}
</style>
