<script setup lang="ts">
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  LockKeyhole,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-vue-next";
import { useLoginMutation } from "~/composables/useAuth";
import { useAuthRedirectContext } from "~/composables/useAuthRedirectContext";
import { useCaptcha } from "~/features/auth/composables/useCaptcha";
import { useApiError } from "~/composables/useApiError";
import { useToast } from "~/composables/useToast";
import type { LoginSchema } from "~/schemas/auth";

definePageMeta({ layout: "public", middleware: ["app-home-redirect"] });

const config = useRuntimeConfig();
const isMarketingSurface = computed((): boolean => config.public.siteSurface === "marketing");
const isAppSurface = computed((): boolean => !isMarketingSurface.value);

useSeoMeta({
  title: () => isMarketingSurface.value
    ? "Auraxis | Controle financeiro com clareza"
    : "Entrar no Auraxis",
  description: () => isMarketingSurface.value
    ? "Controle finanças, acompanhe metas, revise gastos e use análises financeiras com uma experiência clara para o dia a dia."
    : "Acesse seu painel financeiro Auraxis para registrar movimentações, acompanhar metas e revisar suas finanças.",
  robots: () => isAppSurface.value ? "noindex, nofollow" : "index, follow",
  ogTitle: () => isMarketingSurface.value ? "Auraxis" : "Entrar no Auraxis",
  ogDescription: () => isMarketingSurface.value
    ? "Controle financeiro com visão clara, planejamento acionável e análises que ajudam você a decidir melhor."
    : "Entrada segura para o app financeiro Auraxis.",
});

const loginMutation = useLoginMutation();
const { consumeRedirect } = useAuthRedirectContext();
const captcha = useCaptcha();
const toast = useToast();
const { getErrorMessage } = useApiError();

const appHighlights = [
  {
    icon: CalendarCheck,
    title: "Seu mês em ordem",
    text: "Veja o que entrou, saiu e ainda precisa de atenção antes do fechamento.",
  },
  {
    icon: PiggyBank,
    title: "Metas que saem do papel",
    text: "Acompanhe objetivos, aportes e progresso com uma leitura simples.",
  },
  {
    icon: Sparkles,
    title: "Insights com consentimento",
    text: "Use IA para encontrar padrões quando você quiser e autorizar.",
  },
] as const;

const appPreviewStats = [
  {
    label: "Saldo previsto",
    value: "R$ 8.420",
    tone: "neutral",
  },
  {
    label: "Meta reserva",
    value: "78%",
    tone: "positive",
  },
  {
    label: "Atenções",
    value: "3",
    tone: "warning",
  },
] as const;

const marketingBenefits = [
  {
    icon: WalletCards,
    title: "Controle do mês",
    text: "Receitas, despesas, categorias e contas em uma leitura que cabe na rotina.",
  },
  {
    icon: Target,
    title: "Metas com direção",
    text: "Transforme objetivos em acompanhamento visível, com progresso e próximos aportes.",
  },
  {
    icon: Sparkles,
    title: "Análises inteligentes",
    text: "Receba sinais sobre gastos, tendência do período e riscos de orçamento apertado.",
  },
  {
    icon: BarChart3,
    title: "Ferramentas úteis",
    text: "Use calculadoras públicas e simuladores para comparar decisões antes de agir.",
  },
] as const;

const comparisonRows = [
  ["Planilhas soltas", "Você monta fórmulas, confere abas e torce para nada quebrar."],
  ["Apps genéricos", "Mostram lançamentos, mas nem sempre explicam o que mudou no período."],
  ["Auraxis", "Organiza a rotina, mostra o mês em contexto e cria caminhos claros para revisar."],
] as const;

const faqItems = [
  {
    question: "O Auraxis substitui uma consultoria financeira?",
    answer: "Não. O Auraxis organiza seus dados e mostra análises para apoiar decisões, mas não promete recomendação financeira personalizada.",
  },
  {
    question: "Preciso cadastrar tudo no primeiro dia?",
    answer: "Não. Você pode começar com poucos lançamentos e evoluir aos poucos. O onboarding guia esse primeiro passo.",
  },
  {
    question: "Meus dados são usados para treinar modelos?",
    answer: "Não. Os dados do usuário não devem ser usados para treinar modelos; recursos de IA dependem de consentimento ativo.",
  },
] as const;

/**
 * Submits credentials from the app home login panel.
 *
 * Mirrors `/login` so the root app surface is a real entry point rather than
 * a marketing detour.
 *
 * @param values - Validated credentials emitted by LoginForm.
 */
async function onLoginSubmit(values: LoginSchema): Promise<void> {
  try {
    const captchaToken = await captcha.execute();
    await loginMutation.mutateAsync({ ...values, captchaToken });
    const redirect = consumeRedirect();
    await navigateTo(redirect || "/dashboard");
  } catch (err) {
    toast.error(getErrorMessage(err), { duration: 5000 });
  }
}
</script>

<template>
  <div v-if="isAppSurface" class="app-home">
    <section class="app-home__shell" aria-labelledby="app-home-title">
      <div class="app-home__product">
        <div class="app-home__copy">
          <h1 id="app-home-title">Organize suas finanças com clareza.</h1>
          <p class="app-home__lead">
            Entre para acompanhar seu mês, revisar movimentações, cumprir metas e transformar dados financeiros em decisões mais tranquilas.
          </p>

          <div class="app-home__actions" aria-label="Ações de acesso">
            <NuxtLink to="/register" class="app-home__link app-home__link--primary">
              Criar conta gratuita
              <ArrowRight :size="16" aria-hidden="true" />
            </NuxtLink>
            <NuxtLink to="/forgot-password" class="app-home__link">
              Recuperar acesso
            </NuxtLink>
          </div>
        </div>

        <div class="app-home__preview" aria-label="Prévia do painel financeiro Auraxis">
          <div class="app-home__preview-topbar">
            <div>
              <strong>Maio de 2026</strong>
              <span>Resumo financeiro</span>
            </div>
            <span class="app-home__preview-chip">
              <ShieldCheck :size="14" aria-hidden="true" />
              Dados protegidos
            </span>
          </div>

          <div class="app-home__preview-stats">
            <article
              v-for="item in appPreviewStats"
              :key="item.label"
              class="app-home__preview-stat"
              :class="`app-home__preview-stat--${item.tone}`"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </article>
          </div>

          <div class="app-home__preview-chart" aria-hidden="true">
            <svg viewBox="0 0 640 210" role="img">
              <defs>
                <linearGradient id="appHomeChartFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="#36c8ea" stop-opacity="0.28" />
                  <stop offset="100%" stop-color="#36c8ea" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M18 167 C90 144 120 126 184 134 C244 142 278 104 336 94 C410 80 444 118 506 92 C556 70 596 54 622 44"
                fill="none"
                stroke="#087fa7"
                stroke-width="7"
                stroke-linecap="round"
              />
              <path
                d="M18 167 C90 144 120 126 184 134 C244 142 278 104 336 94 C410 80 444 118 506 92 C556 70 596 54 622 44 L622 196 L18 196 Z"
                fill="url(#appHomeChartFill)"
              />
              <path
                d="M24 52 H616 M24 100 H616 M24 148 H616 M24 196 H616"
                stroke="currentColor"
                stroke-dasharray="5 10"
                stroke-width="1"
              />
            </svg>
          </div>

          <div class="app-home__preview-insight">
            <Sparkles :size="18" aria-hidden="true" />
            <div>
              <strong>Insight recente</strong>
              <span>Despesas fixas subiram 8% neste mês. Vale revisar assinaturas antes do fechamento.</span>
            </div>
          </div>
        </div>

        <div class="app-home__highlights" aria-label="O que você encontra no app">
          <article v-for="item in appHighlights" :key="item.title" class="app-home__highlight">
            <component :is="item.icon" :size="20" aria-hidden="true" />
            <div>
              <h2>{{ item.title }}</h2>
              <p>{{ item.text }}</p>
            </div>
          </article>
        </div>
      </div>

      <aside class="app-home__login" aria-label="Login no Auraxis">
        <div class="app-home__login-head">
          <TrendingUp :size="20" aria-hidden="true" />
          <div>
            <strong>Bom te ver de volta</strong>
            <span>Continue sua rotina financeira no Auraxis.</span>
          </div>
        </div>
        <LoginForm :loading="loginMutation.isPending.value" @submit="onLoginSubmit" />
      </aside>
    </section>
  </div>

  <div v-else class="marketing-home">
    <section class="marketing-hero" aria-labelledby="marketing-title">
      <div class="marketing-container marketing-hero__grid">
        <div class="marketing-hero__copy">
          <h1 id="marketing-title">Auraxis</h1>
          <p class="marketing-hero__lead">
            Controle financeiro com visão clara, planejamento acionável e análises que ajudam você a decidir melhor.
          </p>
          <div class="marketing-hero__actions">
            <NuxtLink to="/register" class="marketing-button marketing-button--primary">
              Começar gratuitamente
              <ArrowRight :size="16" aria-hidden="true" />
            </NuxtLink>
            <NuxtLink to="/login" class="marketing-button marketing-button--secondary">
              Já tenho conta
            </NuxtLink>
          </div>
        </div>

        <div class="marketing-hero__visual" aria-label="Prévia do dashboard Auraxis">
          <UiImage
            src="/screenshots/pwa-dashboard-wide.png"
            alt="Dashboard do Auraxis com resumo financeiro e gráficos"
            width="1280"
            height="720"
            loading="eager"
            fetchpriority="high"
          />
        </div>
      </div>
    </section>

    <section id="produto" class="marketing-section" aria-labelledby="benefits-title">
      <div class="marketing-container">
        <div class="marketing-section__head">
          <h2 id="benefits-title">Finanças mais fáceis de ler, revisar e melhorar</h2>
          <p>O Auraxis reúne controle diário, metas e análises em uma experiência feita para sair do improviso.</p>
        </div>
        <div class="marketing-benefits">
          <article v-for="item in marketingBenefits" :key="item.title" class="marketing-benefit">
            <component :is="item.icon" :size="22" aria-hidden="true" />
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section id="analytics" class="marketing-section marketing-section--proof" aria-labelledby="proof-title">
      <div class="marketing-container marketing-proof">
        <div>
          <h2 id="proof-title">Do lançamento ao insight, sem perder o fio</h2>
          <p>
            Acompanhe o mês atual, compare períodos, encontre categorias problemáticas e transforme o que aconteceu em uma próxima ação.
          </p>
          <ul class="marketing-checklist">
            <li><CheckCircle2 :size="18" aria-hidden="true" /> Fluxo de caixa, despesas e saldo em contexto.</li>
            <li><CheckCircle2 :size="18" aria-hidden="true" /> Metas e ferramentas no mesmo ambiente.</li>
            <li><CheckCircle2 :size="18" aria-hidden="true" /> IA com consentimento e linguagem explicável.</li>
          </ul>
        </div>
        <div class="marketing-proof__phone" aria-label="Prévia mobile do Auraxis">
          <UiImage
            src="/screenshots/pwa-dashboard-mobile.png"
            alt="Dashboard mobile do Auraxis"
            width="390"
            height="844"
          />
        </div>
      </div>
    </section>

    <section class="marketing-section" aria-labelledby="comparison-title">
      <div class="marketing-container marketing-comparison">
        <div class="marketing-section__head">
          <h2 id="comparison-title">Por que não deixar isso espalhado?</h2>
          <p>Controle financeiro funciona melhor quando rotina, contexto e decisão aparecem no mesmo lugar.</p>
        </div>
        <div class="marketing-comparison__rows">
          <article v-for="[label, text] in comparisonRows" :key="label" class="marketing-comparison__row">
            <h3>{{ label }}</h3>
            <p>{{ text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section id="planos" class="marketing-section marketing-section--cta" aria-labelledby="plans-title">
      <div class="marketing-container marketing-cta">
        <LockKeyhole :size="28" aria-hidden="true" />
        <h2 id="plans-title">Comece com controle. Evolua para análise.</h2>
        <p>
          Crie sua conta gratuita, registre os primeiros lançamentos e use o onboarding para montar seu painel inicial.
        </p>
        <NuxtLink to="/register" class="marketing-button marketing-button--primary">
          Criar conta gratuita
          <ArrowRight :size="16" aria-hidden="true" />
        </NuxtLink>
      </div>
    </section>

    <section id="faq" class="marketing-section" aria-labelledby="faq-title">
      <div class="marketing-container">
        <div class="marketing-section__head">
          <h2 id="faq-title">Perguntas frequentes</h2>
          <p>Transparência antes de você confiar sua rotina financeira a qualquer produto.</p>
        </div>
        <div class="marketing-faq">
          <article v-for="item in faqItems" :key="item.question" class="marketing-faq__item">
            <h3>{{ item.question }}</h3>
            <p>{{ item.answer }}</p>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.app-home,
.marketing-home {
  color: var(--color-text-primary);
}

.app-home__shell,
.marketing-container {
  width: min(1180px, calc(100% - 32px));
  margin-inline: auto;
}

.app-home {
  min-height: calc(100dvh - 74px);
  padding-block: clamp(var(--space-6), 5vw, var(--space-10));
  background:
    linear-gradient(var(--app-home-grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--app-home-grid-line) 1px, transparent 1px),
    linear-gradient(115deg, rgba(8, 127, 167, 0.12), transparent 34%),
    linear-gradient(245deg, rgba(8, 127, 91, 0.1), transparent 36%),
    var(--color-bg-base);
  background-size: 48px 48px, 48px 48px, auto, auto, auto;
  --app-home-grid-line: color-mix(in srgb, var(--color-text-primary) 4%, transparent);
}

.app-home__shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 450px);
  gap: clamp(var(--space-6), 5vw, var(--space-10));
  align-items: center;
}

.app-home__product {
  display: grid;
  gap: clamp(var(--space-5), 4vw, var(--space-7));
  min-width: 0;
}

.app-home__copy {
  display: grid;
  gap: var(--space-4);
  max-width: 740px;
}

.app-home__copy h1,
.marketing-hero__copy h1,
.marketing-section h2,
.marketing-cta h2 {
  margin: 0;
  font-family: var(--font-heading);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading-lg);
}

.app-home__copy h1 {
  max-width: 13ch;
  font-size: clamp(2.5rem, 6vw, 5.4rem);
  letter-spacing: -0.035em;
}

.app-home__lead,
.marketing-hero__lead,
.marketing-section__head p,
.marketing-proof p,
.marketing-cta p {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: var(--line-height-body-md);
}

.app-home__lead,
.marketing-hero__lead {
  max-width: 620px;
  font-size: var(--font-size-lg);
}

.app-home__actions,
.marketing-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.app-home__link,
.marketing-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline-soft);
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}

.app-home__link:hover,
.marketing-button:hover {
  transform: translateY(-1px);
  border-color: rgba(68, 212, 255, 0.45);
}

.app-home__link:focus-visible,
.marketing-button:focus-visible {
  outline: 3px solid var(--color-brand-glow-md);
  outline-offset: 3px;
}

.app-home__link--primary,
.marketing-button--primary {
  border-color: transparent;
  background: linear-gradient(135deg, #44d4ff, #42e8a9);
  color: #051220;
  box-shadow: 0 18px 44px rgba(68, 212, 255, 0.22);
}

.app-home__preview {
  position: relative;
  display: grid;
  gap: var(--space-4);
  width: min(100%, 820px);
  padding: clamp(var(--space-4), 3vw, var(--space-6));
  border: 1px solid color-mix(in srgb, var(--color-brand-500) 20%, var(--color-outline-soft));
  border-radius: var(--radius-xl);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(248, 251, 255, 0.78)),
    var(--color-bg-surface);
  box-shadow:
    0 26px 80px rgba(10, 22, 40, 0.13),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  overflow: hidden;
}

.app-home__preview::after {
  content: "";
  position: absolute;
  inset: auto -18% -42% 34%;
  height: 220px;
  background: linear-gradient(90deg, rgba(54, 200, 234, 0.18), rgba(8, 127, 91, 0.13));
  filter: blur(54px);
  pointer-events: none;
}

.app-home__preview-topbar,
.app-home__preview-stats,
.app-home__preview-insight {
  position: relative;
  z-index: 1;
}

.app-home__preview-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.app-home__preview-topbar div,
.app-home__preview-insight div {
  display: grid;
  gap: 2px;
}

.app-home__preview-topbar strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
}

.app-home__preview-topbar span,
.app-home__preview-stat span,
.app-home__preview-insight span {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-body-sm);
}

.app-home__preview-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  flex: 0 0 auto;
  min-height: 34px;
  padding-inline: var(--space-3);
  border-radius: var(--radius-full);
  background: var(--color-positive-bg);
  color: var(--color-positive);
  font-weight: var(--font-weight-semibold);
}

.app-home__preview-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.app-home__preview-stat {
  display: grid;
  gap: var(--space-2);
  min-height: 116px;
  padding: var(--space-4);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.78);
}

.app-home__preview-stat strong {
  align-self: end;
  color: var(--color-text-primary);
  font-family: var(--font-mono);
  font-size: clamp(var(--font-size-2xl), 3vw, var(--font-size-3xl));
  font-weight: var(--font-weight-bold);
  letter-spacing: -0.02em;
}

.app-home__preview-stat--positive strong {
  color: var(--color-positive);
}

.app-home__preview-stat--warning strong {
  color: var(--color-warning-text);
}

.app-home__preview-chart {
  position: relative;
  z-index: 1;
  min-height: 190px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-xl);
  background:
    linear-gradient(180deg, rgba(8, 127, 167, 0.08), rgba(8, 127, 167, 0.02)),
    rgba(255, 255, 255, 0.64);
  color: color-mix(in srgb, var(--color-text-muted) 22%, transparent);
  overflow: hidden;
}

.app-home__preview-chart svg {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 190px;
}

.app-home__preview-insight {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: var(--space-3);
  align-items: start;
  width: min(100%, 560px);
  margin-top: calc(var(--space-2) * -1);
  margin-left: auto;
  padding: var(--space-4);
  border: 1px solid color-mix(in srgb, var(--color-brand-500) 18%, var(--color-outline-soft));
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-bg-surface) 88%, var(--color-brand-300));
  box-shadow: 0 18px 46px rgba(10, 22, 40, 0.1);
}

.app-home__preview-insight svg {
  display: grid;
  place-self: center;
  width: 42px;
  height: 42px;
  padding: 10px;
  border-radius: var(--radius-md);
  background: var(--color-brand-hover-surface);
  color: var(--color-brand-500);
}

.app-home__preview-insight strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.marketing-button--secondary {
  background: rgba(255, 255, 255, 0.035);
  color: var(--color-text-secondary);
}

.app-home__highlights {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.app-home__highlight {
  display: grid;
  gap: var(--space-4);
  align-content: start;
  padding: var(--space-4);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-bg-surface) 84%, transparent);
  box-shadow: 0 12px 30px rgba(10, 22, 40, 0.07);
}

.app-home__highlight svg {
  display: grid;
  width: 42px;
  height: 42px;
  padding: 10px;
  border-radius: var(--radius-md);
  background: var(--color-brand-hover-surface);
  color: var(--color-brand-500);
}

.app-home__highlight h2,
.marketing-benefit h3,
.marketing-comparison__row h3,
.marketing-faq__item h3 {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
}

.app-home__highlight p,
.marketing-benefit p,
.marketing-comparison__row p,
.marketing-faq__item p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-body-sm);
}

.app-home__login :deep(.auth-card) {
  border-radius: var(--radius-xl);
  box-shadow: 0 28px 80px rgba(10, 22, 40, 0.16);
}

.app-home__login {
  display: grid;
  gap: var(--space-3);
}

.app-home__login-head {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-bg-surface) 84%, transparent);
  box-shadow: 0 14px 36px rgba(10, 22, 40, 0.08);
}

.app-home__login-head svg {
  width: 44px;
  height: 44px;
  padding: 11px;
  border-radius: var(--radius-md);
  background: var(--color-positive-bg);
  color: var(--color-positive);
}

.app-home__login-head div {
  display: grid;
  gap: 2px;
}

.app-home__login-head strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}

.app-home__login-head span {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-body-sm);
}

.marketing-hero {
  padding-block: var(--space-9);
  border-bottom: 1px solid var(--color-outline-soft);
}

.marketing-hero__grid {
  display: grid;
  grid-template-columns: minmax(0, 0.82fr) minmax(420px, 1.18fr);
  gap: var(--space-8);
  align-items: center;
}

.marketing-hero__copy {
  display: grid;
  gap: var(--space-5);
}

.marketing-hero__copy h1 {
  font-size: var(--font-size-4xl);
}

.marketing-hero__visual,
.marketing-proof__phone {
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
  overflow: hidden;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.36);
}

.marketing-hero__visual {
  padding: var(--space-2);
}

.marketing-section {
  padding-block: var(--space-9);
  border-bottom: 1px solid var(--color-outline-soft);
}

.marketing-section__head {
  display: grid;
  gap: var(--space-2);
  max-width: 760px;
  margin-bottom: var(--space-6);
}

.marketing-section h2,
.marketing-cta h2 {
  font-size: var(--font-size-heading-lg);
}

.marketing-benefits {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

.marketing-benefit,
.marketing-comparison__row,
.marketing-faq__item {
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  background: rgba(255, 255, 255, 0.025);
}

.marketing-benefit svg {
  color: var(--color-brand-500);
  margin-bottom: var(--space-3);
}

.marketing-section--proof {
  background: rgba(255, 255, 255, 0.018);
}

.marketing-proof {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: var(--space-7);
  align-items: center;
}

.marketing-checklist {
  display: grid;
  gap: var(--space-2);
  margin: var(--space-5) 0 0;
  padding: 0;
  list-style: none;
}

.marketing-checklist li {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.marketing-checklist svg {
  color: var(--color-positive);
  flex: 0 0 auto;
}

.marketing-proof__phone {
  justify-self: center;
  width: min(100%, 320px);
  padding: var(--space-2);
}

.marketing-comparison__rows,
.marketing-faq {
  display: grid;
  gap: var(--space-3);
}

.marketing-comparison__row {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: var(--space-4);
}

.marketing-section--cta {
  background: linear-gradient(135deg, rgba(68, 212, 255, 0.12), rgba(66, 232, 169, 0.08));
}

.marketing-cta {
  display: grid;
  justify-items: center;
  text-align: center;
  gap: var(--space-4);
}

.marketing-cta svg {
  color: var(--color-brand-500);
}

.marketing-cta p {
  max-width: 680px;
}

.marketing-faq {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 960px) {
  .app-home__shell,
  .marketing-hero__grid,
  .marketing-proof {
    grid-template-columns: 1fr;
  }

  .app-home__shell {
    align-items: start;
  }

  .app-home__product {
    display: contents;
  }

  .app-home__copy h1 {
    max-width: 16ch;
  }

  .app-home__copy {
    order: 1;
  }

  .app-home__login {
    order: 2;
  }

  .app-home__preview {
    order: 3;
  }

  .app-home__highlights {
    order: 4;
    grid-template-columns: 1fr;
  }

  .marketing-benefits,
  .marketing-faq {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .marketing-hero__visual {
    margin-inline: auto;
  }
}

@media (max-width: 640px) {
  .app-home {
    padding-block: var(--space-5);
  }

  .app-home__copy h1 {
    font-size: clamp(2.35rem, 13vw, 3.4rem);
  }

  .marketing-hero__copy h1 {
    font-size: var(--font-size-heading-xl);
  }

  .app-home__lead {
    font-size: var(--font-size-md);
  }

  .app-home__actions,
  .marketing-hero__actions {
    flex-direction: column;
  }

  .app-home__link,
  .marketing-button {
    width: 100%;
  }

  .app-home__preview {
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }

  .app-home__preview-topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .app-home__preview-stats {
    grid-template-columns: 1fr;
  }

  .app-home__preview-stat {
    min-height: 86px;
  }

  .app-home__preview-chart {
    min-height: 160px;
  }

  .app-home__preview-chart svg {
    min-height: 160px;
  }

  .app-home__preview-insight {
    grid-template-columns: 1fr;
    margin-left: 0;
  }

  .marketing-hero,
  .marketing-section {
    padding-block: var(--space-7);
  }

  .marketing-benefits,
  .marketing-faq {
    grid-template-columns: 1fr;
  }

  .marketing-comparison__row {
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }
}
</style>
