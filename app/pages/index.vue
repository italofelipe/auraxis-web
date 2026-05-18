<script setup lang="ts">
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  LockKeyhole,
  Sparkles,
  Target,
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
    icon: BarChart3,
    title: "Dashboard claro",
    text: "Veja saldo, entradas, saídas e sinais importantes sem garimpar planilhas.",
  },
  {
    icon: CalendarCheck,
    title: "Rotina organizada",
    text: "Registre pagamentos, recebimentos e períodos para manter seu mês sob controle.",
  },
  {
    icon: Sparkles,
    title: "Insights com contexto",
    text: "Quando autorizado, a IA ajuda a apontar padrões e próximos pontos de atenção.",
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
      <div class="app-home__copy">
        <h1 id="app-home-title">Entre no Auraxis</h1>
        <p class="app-home__lead">
          Acesse seu painel financeiro, registre movimentações e acompanhe metas com clareza.
        </p>

        <div class="app-home__actions" aria-label="Ações de acesso">
          <NuxtLink to="/register" class="app-home__link app-home__link--primary">
            Criar conta gratuita
            <ArrowRight :size="16" aria-hidden="true" />
          </NuxtLink>
          <NuxtLink to="/forgot-password" class="app-home__link">
            Esqueci minha senha
          </NuxtLink>
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
  padding-block: var(--space-8);
}

.app-home__shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 500px);
  gap: var(--space-7);
  align-items: center;
}

.app-home__copy {
  display: grid;
  gap: var(--space-5);
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
  font-size: var(--font-size-4xl);
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

.app-home__link--primary,
.marketing-button--primary {
  border-color: transparent;
  background: linear-gradient(135deg, #44d4ff, #42e8a9);
  color: #051220;
  box-shadow: 0 18px 44px rgba(68, 212, 255, 0.22);
}

.marketing-button--secondary {
  background: rgba(255, 255, 255, 0.035);
  color: var(--color-text-secondary);
}

.app-home__highlights {
  display: grid;
  gap: var(--space-3);
}

.app-home__highlight {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: var(--space-3);
  align-items: start;
  padding: var(--space-4);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.025);
}

.app-home__highlight svg {
  margin-top: 2px;
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
  border-radius: var(--radius-lg);
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

  .app-home__login {
    order: -1;
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

  .app-home__copy h1,
  .marketing-hero__copy h1 {
    font-size: var(--font-size-heading-xl);
  }

  .app-home__actions,
  .marketing-hero__actions {
    flex-direction: column;
  }

  .app-home__link,
  .marketing-button {
    width: 100%;
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
