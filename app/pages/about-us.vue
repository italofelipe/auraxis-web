<script setup lang="ts">
import {
  ArrowRight,
  BarChart3,
  Bolt,
  Check,
  Crosshair,
  Eye,
  FileCheck2,
  Layers3,
  LockKeyhole,
  ServerCog,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-vue-next";

definePageMeta({ layout: "public" });

useSeoMeta({
  title: "Sobre Nós | Auraxis",
  description:
    "Conheça a Auraxis, a plataforma de inteligência financeira que combina dados, IA e governança para transformar planejamento patrimonial.",
  ogTitle: "Sobre Nós | Auraxis",
  ogDescription:
    "Arquitetura financeira, análises preditivas e governança para decisões patrimoniais mais precisas.",
  ogType: "website",
  twitterCard: "summary_large_image",
});

const heroMetrics = [
  {
    label: "AUM monitorado",
    value: "R$ 12.4B+",
    variant: "cyan",
    points: "M2 44 C 20 24, 34 32, 48 20 S 78 34, 94 10",
  },
  {
    label: "Precisão preditiva",
    value: "99.8%",
    variant: "violet",
    bars: [42, 58, 50, 76, 88, 100],
  },
  {
    label: "Tempo de execução",
    value: "< 2ms",
    variant: "blue",
    progress: 95,
  },
] as const;

const foundations = [
  {
    title: "Missão",
    description:
      "Democratizar infraestrutura financeira institucional com precisão, transparência e uma camada de dados que o usuário realmente controla.",
    icon: Crosshair,
    variant: "cyan",
  },
  {
    title: "Visão",
    description:
      "Ser o sistema nervoso financeiro de pessoas e empresas que querem decisões patrimoniais melhores sem perder clareza operacional.",
    icon: Eye,
    variant: "violet",
  },
  {
    title: "Valores",
    description:
      "Precisão analítica, segurança por desenho, inovação contínua e transparência radical em cada fluxo de produto.",
    icon: Sparkles,
    variant: "neutral",
  },
] as const;

const timeline = [
  {
    year: "2020",
    title: "Gênese do algoritmo",
    description: "Primeiros modelos de consolidação financeira e categorização automática.",
  },
  {
    year: "2022",
    title: "Market Pulse v1",
    description: "Interface inicial para dashboards patrimoniais, metas e visão mensal.",
  },
  {
    year: "2024",
    title: "Market Pulse v3",
    description: "Design system azul/ciano, IA assistiva e simulações financeiras integradas.",
  },
  {
    year: "2026",
    title: "MVP2 readiness",
    description: "Privacidade, rastreabilidade de dados e SEO público como fundação de escala.",
  },
] as const;

const capabilities = [
  {
    title: "Consolidação multi-ativos",
    description:
      "Transações, metas, carteira e simulações conectadas em uma visão financeira de alta leitura.",
    icon: Layers3,
  },
  {
    title: "Execução otimizada",
    description:
      "Fluxos orientados a decisão para reduzir ruído, priorizar riscos e acelerar próximos passos.",
    icon: Bolt,
  },
  {
    title: "Análise de cenários",
    description:
      "Comparativos, projeções e alertas que transformam eventos financeiros em ação mensurável.",
    icon: BarChart3,
  },
] as const;

const governance = [
  {
    title: "Conformidade LGPD",
    description:
      "Matriz de dados, consentimentos versionados e runbooks para direitos do titular.",
    icon: FileCheck2,
  },
  {
    title: "Infraestrutura isolada",
    description:
      "Camadas de serviço separadas por domínio, com contratos explícitos entre Web, API e App.",
    icon: ServerCog,
  },
  {
    title: "Controle de acesso",
    description:
      "Autenticação, sessões e assinaturas governam recursos sensíveis sem atalhos invisíveis.",
    icon: UserRoundCheck,
  },
  {
    title: "Auditoria contínua",
    description:
      "Logs e rastreabilidade para explicar decisões, alterações e processamento de dados.",
    icon: ShieldCheck,
  },
] as const;
</script>

<template>
  <div class="about-us-page">
    <section class="about-us-page__hero">
      <div class="about-us-page__container about-us-page__hero-grid">
        <div class="about-us-page__hero-copy">
          <p class="about-us-page__eyebrow">
            <span class="about-us-page__status-dot" aria-hidden="true" />
            Market Pulse v3
          </p>
          <h1 class="about-us-page__title">
            Auraxis:
            <span>Inteligência que Transforma Patrimônio</span>
          </h1>
          <p class="about-us-page__lead">
            Redefinimos planejamento financeiro com arquitetura de dados,
            análises preditivas e governança de privacidade. Uma infraestrutura
            feita para controle absoluto, clareza operacional e crescimento
            patrimonial sustentável.
          </p>
          <div class="about-us-page__actions">
            <NuxtLink to="/register" class="about-us-page__button about-us-page__button--primary">
              Conheça a Plataforma
              <ArrowRight :size="18" aria-hidden="true" />
            </NuxtLink>
            <NuxtLink to="/plans" class="about-us-page__button about-us-page__button--ghost">
              Falar com Especialista
            </NuxtLink>
          </div>
        </div>

        <div class="about-us-page__terminal" aria-label="Painel visual de dados da Auraxis">
          <div class="about-us-page__terminal-bar">
            <span>System.Monitor()</span>
            <div aria-hidden="true">
              <span />
              <span />
            </div>
          </div>
          <div class="about-us-page__terminal-grid">
            <div
              v-for="metric in heroMetrics"
              :key="metric.label"
              class="about-us-page__metric"
              :class="`about-us-page__metric--${metric.variant}`"
            >
              <p>{{ metric.label }}</p>
              <strong>{{ metric.value }}</strong>
              <svg
                v-if="'points' in metric"
                class="about-us-page__sparkline"
                viewBox="0 0 96 52"
                role="img"
                aria-label="Curva de crescimento"
              >
                <path :d="metric.points" />
              </svg>
              <div v-else-if="'bars' in metric" class="about-us-page__bars" aria-hidden="true">
                <span
                  v-for="(height, index) in metric.bars"
                  :key="index"
                  :style="{ height: `${height}%` }"
                />
              </div>
              <div v-else class="about-us-page__latency" aria-hidden="true">
                <span :style="{ width: `${metric.progress}%` }" />
              </div>
            </div>
          </div>
          <div class="about-us-page__chart" aria-hidden="true">
            <svg viewBox="0 0 520 170" preserveAspectRatio="none">
              <path
                d="M0 145 C70 92 95 126 155 78 C212 32 256 76 316 52 C382 26 420 74 520 22 L520 170 L0 170 Z"
              />
              <path d="M0 145 C70 92 95 126 155 78 C212 32 256 76 316 52 C382 26 420 74 520 22" />
            </svg>
          </div>
        </div>
      </div>
    </section>

    <section class="about-us-page__section">
      <div class="about-us-page__container">
        <div class="about-us-page__section-heading">
          <h2>Fundamentos da Auraxis</h2>
          <p>
            Os pilares que sustentam nossa arquitetura financeira e guiam cada
            decisão de produto.
          </p>
        </div>
        <div class="about-us-page__cards about-us-page__cards--three">
          <article
            v-for="item in foundations"
            :key="item.title"
            class="about-us-page__card"
            :class="`about-us-page__card--${item.variant}`"
          >
            <div class="about-us-page__icon">
              <component :is="item.icon" :size="24" aria-hidden="true" />
            </div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="about-us-page__section about-us-page__section--band">
      <div class="about-us-page__container">
        <div class="about-us-page__section-heading about-us-page__section-heading--left">
          <h2>Evolução do Sistema</h2>
          <p>A trajetória técnica da Auraxis até o Market Pulse v3.</p>
        </div>
        <div class="about-us-page__timeline">
          <article v-for="item in timeline" :key="item.year" class="about-us-page__timeline-item">
            <span>{{ item.year }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="about-us-page__section">
      <div class="about-us-page__container about-us-page__split">
        <div>
          <div class="about-us-page__section-heading about-us-page__section-heading--left">
            <h2>Controle e Planejamento em Escala</h2>
            <p>
              Transformamos dados fragmentados em inteligência acionável para
              que decisões financeiras saiam do improviso e virem rotina.
            </p>
          </div>
          <div class="about-us-page__capabilities">
            <article v-for="item in capabilities" :key="item.title" class="about-us-page__capability">
              <div class="about-us-page__icon about-us-page__icon--compact">
                <component :is="item.icon" :size="20" aria-hidden="true" />
              </div>
              <div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.description }}</p>
              </div>
            </article>
          </div>
        </div>

        <div class="about-us-page__monitor" aria-label="Visual de monitoramento financeiro">
          <div class="about-us-page__monitor-head">
            <span>Alpha Console</span>
            <strong>ONLINE</strong>
          </div>
          <div class="about-us-page__monitor-grid">
            <div>
              <span>Alpha gerado</span>
              <strong>+4.2%</strong>
            </div>
            <div>
              <span>Risco sistemático</span>
              <strong>0.84 beta</strong>
            </div>
          </div>
          <svg class="about-us-page__monitor-chart" viewBox="0 0 320 140" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 132 L0 72 C42 50 62 106 105 78 C150 46 172 58 214 34 C255 12 278 30 320 16 L320 140 L0 140 Z" />
            <path d="M0 72 C42 50 62 106 105 78 C150 46 172 58 214 34 C255 12 278 30 320 16" />
          </svg>
        </div>
      </div>
    </section>

    <section class="about-us-page__section about-us-page__section--band">
      <div class="about-us-page__container">
        <div class="about-us-page__security-heading">
          <p>
            <LockKeyhole :size="14" aria-hidden="true" />
            Status: Secure
          </p>
          <h2>Governança e Segurança Institucional</h2>
          <span>
            Proteção de dados não é uma feature: é a fundação da nossa
            arquitetura e do plano LGPD para MVP2.
          </span>
        </div>
        <div class="about-us-page__security-grid">
          <article class="about-us-page__vault">
            <div class="about-us-page__vault-ring">
              <LockKeyhole :size="42" aria-hidden="true" />
            </div>
            <h3>Cofre Digital</h3>
            <p>
              Segurança, consentimento e rastreabilidade pensados como camada
              central do produto, não como adendo tardio.
            </p>
          </article>
          <div class="about-us-page__cards about-us-page__cards--two">
            <article v-for="item in governance" :key="item.title" class="about-us-page__card about-us-page__card--small">
              <div class="about-us-page__icon about-us-page__icon--compact">
                <component :is="item.icon" :size="20" aria-hidden="true" />
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="about-us-page__cta">
      <div class="about-us-page__container about-us-page__cta-inner">
        <h2>Pronto para elevar sua gestão patrimonial?</h2>
        <p>
          Experimente uma plataforma feita para unir planejamento financeiro,
          IA assistiva, privacidade e execução em um só lugar.
        </p>
        <div class="about-us-page__actions about-us-page__actions--center">
          <NuxtLink to="/register" class="about-us-page__button about-us-page__button--primary">
            Abrir Conta
            <ArrowRight :size="18" aria-hidden="true" />
          </NuxtLink>
          <NuxtLink to="/tools" class="about-us-page__button about-us-page__button--ghost">
            Explorar Ferramentas
          </NuxtLink>
        </div>
        <ul class="about-us-page__checks">
          <li><Check :size="16" aria-hidden="true" /> Setup em minutos</li>
          <li><Check :size="16" aria-hidden="true" /> Sem cartão no plano free</li>
          <li><Check :size="16" aria-hidden="true" /> Dados sob seu controle</li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about-us-page {
  min-height: 100dvh;
  background:
    linear-gradient(180deg, rgba(68, 212, 255, 0.05), transparent 34rem),
    var(--color-bg-base);
  color: var(--color-text-primary);
}

.about-us-page__container {
  width: min(100%, 1440px);
  margin-inline: auto;
  padding-inline: clamp(1.25rem, 4vw, 3rem);
}

.about-us-page__hero {
  padding-block: clamp(5.5rem, 10vw, 9rem) clamp(4rem, 8vw, 6.5rem);
  overflow: hidden;
}

.about-us-page__hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(360px, 0.9fr);
  gap: clamp(2rem, 6vw, 5rem);
  align-items: center;
}

.about-us-page__hero-copy {
  max-width: 760px;
}

.about-us-page__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0 0 1.5rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid rgba(68, 212, 255, 0.24);
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.035);
  color: #44d4ff;
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.about-us-page__status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: var(--radius-full);
  background: #44d4ff;
}

.about-us-page__title {
  margin: 0;
  font-size: clamp(3rem, 7vw, 6rem);
  line-height: 1.04;
  font-weight: var(--font-weight-extrabold);
}

.about-us-page__title span {
  display: block;
  background: linear-gradient(90deg, #44d4ff, #8b7dff);
  background-clip: text;
  color: transparent;
}

.about-us-page__lead {
  max-width: 690px;
  margin: 1.5rem 0 0;
  color: var(--color-text-secondary);
  font-size: clamp(1.05rem, 1.6vw, 1.2rem);
  line-height: 1.75;
}

.about-us-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2.25rem;
}

.about-us-page__actions--center {
  justify-content: center;
}

.about-us-page__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 3.25rem;
  padding: 0.9rem 1.45rem;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: var(--font-weight-bold);
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.about-us-page__button:hover,
.about-us-page__button:focus-visible {
  transform: translateY(-1px);
  outline: none;
}

.about-us-page__button--primary {
  background: #44d4ff;
  color: #05070d;
  box-shadow: 0 18px 46px rgba(68, 212, 255, 0.2);
}

.about-us-page__button--ghost {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.035);
  color: var(--color-text-primary);
}

.about-us-page__terminal,
.about-us-page__monitor,
.about-us-page__card,
.about-us-page__vault {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.018));
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.24);
}

.about-us-page__terminal {
  position: relative;
  border-radius: var(--radius-xl);
  padding: 1rem;
  overflow: hidden;
}

.about-us-page__terminal::before,
.about-us-page__monitor::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: linear-gradient(180deg, black, transparent 85%);
}

.about-us-page__terminal-bar,
.about-us-page__monitor-head {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
}

.about-us-page__terminal-bar div {
  display: flex;
  gap: 0.35rem;
}

.about-us-page__terminal-bar div span {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.22);
}

.about-us-page__terminal-bar div span:first-child {
  background: #44d4ff;
}

.about-us-page__terminal-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
  padding: 1rem 0 1.15rem;
}

.about-us-page__metric {
  min-height: 9.2rem;
  padding: 1rem;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(5, 7, 13, 0.78);
}

.about-us-page__metric p,
.about-us-page__metric strong {
  display: block;
}

.about-us-page__metric p {
  margin: 0 0 0.45rem;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.about-us-page__metric strong {
  font-family: var(--font-mono);
  font-size: clamp(1.35rem, 2vw, 1.85rem);
}

.about-us-page__metric--cyan strong {
  color: #44d4ff;
}

.about-us-page__metric--violet strong {
  color: #8b7dff;
}

.about-us-page__sparkline {
  width: 100%;
  height: 3.25rem;
  margin-top: 0.75rem;
}

.about-us-page__sparkline path,
.about-us-page__chart path:last-child,
.about-us-page__monitor-chart path:last-child {
  fill: none;
  stroke: #44d4ff;
  stroke-width: 3;
  stroke-linecap: round;
}

.about-us-page__bars {
  display: flex;
  align-items: end;
  gap: 0.35rem;
  height: 3.25rem;
  margin-top: 0.75rem;
}

.about-us-page__bars span {
  flex: 1;
  min-width: 0.35rem;
  border-radius: var(--radius-full) var(--radius-full) 0 0;
  background: linear-gradient(180deg, #8b7dff, rgba(139, 125, 255, 0.22));
}

.about-us-page__latency {
  height: 0.5rem;
  margin-top: 1.5rem;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.about-us-page__latency span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #44d4ff, #8b7dff);
}

.about-us-page__chart {
  position: relative;
  z-index: 1;
  min-height: 12rem;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(5, 7, 13, 0.62);
  overflow: hidden;
}

.about-us-page__chart svg {
  width: 100%;
  height: 100%;
}

.about-us-page__chart path:first-child,
.about-us-page__monitor-chart path:first-child {
  fill: rgba(68, 212, 255, 0.12);
  stroke: none;
}

.about-us-page__section {
  padding-block: clamp(4rem, 8vw, 6rem);
}

.about-us-page__section--band {
  background: rgba(10, 14, 23, 0.55);
  border-block: 1px solid rgba(255, 255, 255, 0.06);
}

.about-us-page__section-heading {
  max-width: 720px;
  margin: 0 auto 2.5rem;
  text-align: center;
}

.about-us-page__section-heading--left {
  margin-inline: 0;
  text-align: left;
}

.about-us-page__section-heading h2,
.about-us-page__security-heading h2,
.about-us-page__cta h2 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.12;
}

.about-us-page__section-heading p,
.about-us-page__security-heading span,
.about-us-page__cta p {
  display: block;
  margin: 1rem 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  line-height: 1.65;
}

.about-us-page__cards {
  display: grid;
  gap: 1.25rem;
}

.about-us-page__cards--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.about-us-page__cards--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.about-us-page__card {
  border-radius: var(--radius-xl);
  padding: 1.5rem;
}

.about-us-page__card h3,
.about-us-page__capability h3,
.about-us-page__timeline-item h3,
.about-us-page__vault h3 {
  margin: 1rem 0 0;
  font-size: var(--font-size-xl);
}

.about-us-page__card p,
.about-us-page__capability p,
.about-us-page__timeline-item p,
.about-us-page__vault p {
  margin: 0.75rem 0 0;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.about-us-page__card--small h3 {
  font-size: var(--font-size-lg);
}

.about-us-page__icon {
  width: 3.25rem;
  height: 3.25rem;
  display: grid;
  place-items: center;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(68, 212, 255, 0.18);
  background: rgba(68, 212, 255, 0.08);
  color: #44d4ff;
}

.about-us-page__icon--compact {
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 auto;
}

.about-us-page__card--violet .about-us-page__icon {
  border-color: rgba(139, 125, 255, 0.22);
  background: rgba(139, 125, 255, 0.09);
  color: #8b7dff;
}

.about-us-page__card--neutral .about-us-page__icon {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-primary);
}

.about-us-page__timeline {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1.25rem;
}

.about-us-page__timeline::before {
  content: "";
  position: absolute;
  top: 1rem;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.about-us-page__timeline-item {
  position: relative;
  padding-top: 2.5rem;
}

.about-us-page__timeline-item::before {
  content: "";
  position: absolute;
  top: 0.65rem;
  left: 0;
  width: 0.75rem;
  height: 0.75rem;
  border: 2px solid var(--color-brand-500);
  border-radius: var(--radius-full);
  background: var(--color-bg-base);
}

.about-us-page__timeline-item span {
  font-family: var(--font-mono);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: #44d4ff;
}

.about-us-page__split {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(360px, 0.8fr);
  gap: clamp(2rem, 6vw, 5rem);
  align-items: center;
}

.about-us-page__capabilities {
  display: grid;
  gap: 1.25rem;
  margin-top: 2rem;
}

.about-us-page__capability {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.about-us-page__monitor {
  position: relative;
  border-radius: var(--radius-lg);
  padding: 1rem;
  overflow: hidden;
}

.about-us-page__monitor-head strong {
  color: #84cc16;
  font-size: var(--font-size-xs);
}

.about-us-page__monitor-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  padding: 1rem 0;
}

.about-us-page__monitor-grid div {
  padding: 1rem;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.045);
}

.about-us-page__monitor-grid span {
  display: block;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.about-us-page__monitor-grid strong {
  display: block;
  margin-top: 0.4rem;
  font-family: var(--font-mono);
  font-size: var(--font-size-xl);
}

.about-us-page__monitor-chart {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 12rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  background: rgba(5, 7, 13, 0.72);
}

.about-us-page__security-heading {
  max-width: 760px;
  margin: 0 auto 2.5rem;
  text-align: center;
}

.about-us-page__security-heading p {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0 0 1rem;
  padding: 0.35rem 0.65rem;
  border: 1px solid rgba(132, 204, 22, 0.2);
  border-radius: var(--radius-full);
  color: #84cc16;
  background: rgba(132, 204, 22, 0.08);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
}

.about-us-page__security-grid {
  display: grid;
  grid-template-columns: minmax(300px, 0.72fr) minmax(0, 1fr);
  gap: 1.25rem;
  align-items: stretch;
}

.about-us-page__vault {
  display: grid;
  place-items: center;
  align-content: center;
  min-height: 24rem;
  padding: 2rem;
  border-radius: var(--radius-xl);
  text-align: center;
}

.about-us-page__vault-ring {
  width: 8rem;
  height: 8rem;
  display: grid;
  place-items: center;
  border: 1px solid rgba(68, 212, 255, 0.28);
  border-radius: var(--radius-full);
  color: var(--color-text-primary);
  background:
    radial-gradient(circle at center, rgba(68, 212, 255, 0.16), transparent 68%),
    rgba(255, 255, 255, 0.03);
}

.about-us-page__cta {
  padding-block: clamp(4rem, 8vw, 7rem);
  text-align: center;
}

.about-us-page__cta-inner {
  max-width: 980px;
}

.about-us-page__checks {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem 1.5rem;
  margin: 2rem 0 0;
  padding: 0;
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  list-style: none;
}

.about-us-page__checks li {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.about-us-page__checks svg {
  color: #44d4ff;
}

@media (max-width: 1180px) {
  .about-us-page__hero-grid,
  .about-us-page__split {
    grid-template-columns: 1fr;
  }

  .about-us-page__terminal,
  .about-us-page__monitor {
    max-width: 860px;
  }
}

@media (max-width: 900px) {
  .about-us-page__cards--three,
  .about-us-page__cards--two,
  .about-us-page__timeline,
  .about-us-page__security-grid {
    grid-template-columns: 1fr;
  }

  .about-us-page__timeline::before {
    top: 0;
    bottom: 0;
    left: 0.35rem;
    width: 1px;
    height: auto;
  }

  .about-us-page__timeline-item {
    padding-top: 0;
    padding-left: 2rem;
  }

  .about-us-page__timeline-item::before {
    top: 0.4rem;
  }
}

@media (max-width: 640px) {
  .about-us-page__terminal-grid,
  .about-us-page__monitor-grid {
    grid-template-columns: 1fr;
  }

  .about-us-page__title {
    font-size: clamp(var(--font-size-4xl), 12vw, 3rem);
  }

  .about-us-page__button,
  .about-us-page__actions {
    width: 100%;
  }
}
</style>
