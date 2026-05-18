<script setup lang="ts">
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  LineChart,
  Sparkles,
  Target,
  WalletCards,
} from "lucide-vue-next";
import { getSeoLanding } from "~/data/seoLandings";

definePageMeta({ layout: "public" });

const route = useRoute();
const config = useRuntimeConfig();

const slugParam = Array.isArray(route.params.seoLanding)
  ? route.params.seoLanding[0]
  : route.params.seoLanding;
const slug = typeof slugParam === "string" ? slugParam : "";
const landing = getSeoLanding(slug);

if (!landing) {
  throw createError({
    statusCode: 404,
    statusMessage: "Pagina nao encontrada",
  });
}

const siteUrl = String(config.public.siteUrl).replace(/\/$/, "");
const canonicalUrl = `${siteUrl}/${landing.slug}`;
const isMarketingSurface = config.public.siteSurface === "marketing";
const robots = isMarketingSurface ? "index, follow" : "noindex, nofollow";

const highlightIcons = [WalletCards, BarChart3, Target] as const;
const workflowIcons = [Sparkles, LineChart, CheckCircle2] as const;

/**
 * Picks a decorative icon for repeated page sections.
 *
 * @param icons - Ordered icon list for the section.
 * @param index - Current item index.
 * @param fallback - Icon used when there are more items than configured icons.
 * @returns Vue component used by the template's dynamic component.
 */
function iconByIndex<T>(icons: readonly T[], index: number, fallback: T): T {
  return icons[index] ?? fallback;
}

useSeoMeta({
  title: landing.title,
  description: landing.description,
  robots,
  ogTitle: landing.h1,
  ogDescription: landing.description,
  ogUrl: canonicalUrl,
  twitterTitle: landing.title,
  twitterDescription: landing.description,
});

useHead({
  link: [{ rel: "canonical", href: canonicalUrl }],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: landing.h1,
        description: landing.description,
        url: canonicalUrl,
        about: landing.keyword,
        isPartOf: {
          "@type": "WebSite",
          name: "Auraxis",
          url: siteUrl,
        },
      }),
    },
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: landing.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }),
    },
  ],
});
</script>

<template>
  <main class="seo-landing">
    <section class="seo-hero" aria-labelledby="seo-landing-title">
      <div class="seo-container seo-hero__grid">
        <div class="seo-hero__copy">
          <p class="seo-eyebrow">{{ landing.kicker }}</p>
          <h1 id="seo-landing-title">{{ landing.h1 }}</h1>
          <p class="seo-hero__lead">{{ landing.lead }}</p>

          <div class="seo-hero__actions">
            <NuxtLink to="/register" class="seo-button seo-button--primary">
              Começar gratuitamente
              <ArrowRight :size="16" aria-hidden="true" />
            </NuxtLink>
            <NuxtLink to="/tools" class="seo-button seo-button--secondary">
              Ver ferramentas públicas
            </NuxtLink>
          </div>

          <ul class="seo-proof-list" aria-label="Benefícios principais">
            <li v-for="point in landing.proofPoints" :key="point">
              <CheckCircle2 :size="18" aria-hidden="true" />
              <span>{{ point }}</span>
            </li>
          </ul>
        </div>

        <div class="seo-hero__visual" aria-label="Prévia do Auraxis">
          <UiImage
            src="/screenshots/pwa-dashboard-wide.png"
            alt="Dashboard do Auraxis com resumo financeiro, gráficos e insights"
            width="1280"
            height="720"
            loading="eager"
            fetchpriority="high"
          />
          <p>{{ landing.visualCaption }}</p>
        </div>
      </div>
    </section>

    <section class="seo-section" aria-labelledby="seo-benefits-title">
      <div class="seo-container">
        <div class="seo-section__head">
          <p class="seo-eyebrow">Por que usar</p>
          <h2 id="seo-benefits-title">Uma experiência pensada para sair do improviso</h2>
          <p>
            O Auraxis combina registro, leitura e planejamento para que a rotina financeira fique
            mais fácil de revisar.
          </p>
        </div>

        <div class="seo-card-grid">
          <article v-for="(item, index) in landing.highlights" :key="item.title" class="seo-card">
            <component
              :is="iconByIndex(highlightIcons, index, Sparkles)"
              :size="24"
              aria-hidden="true"
            />
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="seo-section seo-section--muted" aria-labelledby="seo-workflow-title">
      <div class="seo-container seo-workflow">
        <div class="seo-section__head seo-section__head--left">
          <p class="seo-eyebrow">Como funciona</p>
          <h2 id="seo-workflow-title">Do dado registrado ao próximo ajuste</h2>
          <p>
            A proposta é simples: registrar o essencial, ler o período e agir com mais contexto.
          </p>
        </div>

        <div class="seo-workflow__steps">
          <article v-for="(step, index) in landing.workflow" :key="step.title" class="seo-step">
            <span class="seo-step__badge">{{ step.label }}</span>
            <component
              :is="iconByIndex(workflowIcons, index, CheckCircle2)"
              :size="22"
              aria-hidden="true"
            />
            <h3>{{ step.title }}</h3>
            <p>{{ step.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="seo-section" aria-labelledby="seo-links-title">
      <div class="seo-container seo-links">
        <div>
          <p class="seo-eyebrow">Explore por tema</p>
          <h2 id="seo-links-title">Outras formas de organizar suas finanças</h2>
        </div>
        <nav class="seo-links__nav" aria-label="Páginas relacionadas">
          <NuxtLink v-for="link in landing.relatedLinks" :key="link.to" :to="link.to">
            {{ link.label }}
            <ArrowRight :size="14" aria-hidden="true" />
          </NuxtLink>
        </nav>
      </div>
    </section>

    <section class="seo-section seo-section--muted" aria-labelledby="seo-faq-title">
      <div class="seo-container">
        <div class="seo-section__head">
          <p class="seo-eyebrow">Dúvidas comuns</p>
          <h2 id="seo-faq-title">Perguntas frequentes</h2>
        </div>

        <div class="seo-faq">
          <article v-for="item in landing.faq" :key="item.question" class="seo-faq__item">
            <h3>{{ item.question }}</h3>
            <p>{{ item.answer }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="seo-final" aria-labelledby="seo-final-title">
      <div class="seo-container seo-final__inner">
        <Sparkles :size="28" aria-hidden="true" />
        <h2 id="seo-final-title">Comece pequeno, enxergue melhor, ajuste com calma.</h2>
        <p>
          Crie sua conta gratuita e use o Auraxis para transformar movimentações em uma rotina
          financeira mais clara.
        </p>
        <NuxtLink to="/register" class="seo-button seo-button--primary">
          Criar conta gratuita
          <ArrowRight :size="16" aria-hidden="true" />
        </NuxtLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.seo-landing {
  color: var(--color-text-primary);
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--color-brand-500) 18%, transparent),
      transparent 32rem
    ),
    var(--color-bg-base);
}

.seo-container {
  width: min(1180px, calc(100% - 40px));
  margin-inline: auto;
}

.seo-hero {
  padding-block: clamp(56px, 8vw, 112px) 56px;
}

.seo-hero__grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(420px, 1.1fr);
  align-items: center;
  gap: clamp(32px, 6vw, 72px);
}

.seo-hero__copy {
  display: grid;
  gap: 22px;
}

.seo-eyebrow {
  margin: 0;
  color: var(--color-brand-400);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0;
}

.seo-hero h1,
.seo-section h2,
.seo-final h2 {
  margin: 0;
  font-family: var(--font-heading);
  color: var(--color-text-primary);
}

.seo-hero h1 {
  max-width: 720px;
  font-size: clamp(2.6rem, 6vw, 5.1rem);
  line-height: 0.98;
}

.seo-hero__lead {
  max-width: 640px;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: clamp(1.1rem, 2vw, 1.45rem);
  line-height: 1.55;
}

.seo-hero__actions,
.seo-final__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}

.seo-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding-inline: 20px;
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.seo-button:hover {
  transform: translateY(-1px);
}

.seo-button--primary {
  background: linear-gradient(135deg, #44d4ff, #42e8a9);
  color: #05070d;
}

.seo-button--secondary {
  border: 1px solid var(--color-outline-strong);
  background: color-mix(in srgb, var(--color-surface-elevated) 70%, transparent);
}

.seo-proof-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.seo-proof-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--color-text-secondary);
}

.seo-proof-list svg {
  flex: 0 0 auto;
  margin-top: 2px;
  color: var(--color-success-400);
}

.seo-hero__visual {
  overflow: hidden;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-surface-elevated) 84%, transparent);
  box-shadow: 0 28px 90px color-mix(in srgb, #000 52%, transparent);
}

.seo-hero__visual img {
  display: block;
  width: 100%;
  height: auto;
}

.seo-hero__visual p {
  margin: 0;
  padding: 16px 18px 18px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.seo-section {
  padding-block: clamp(56px, 8vw, 88px);
}

.seo-section--muted {
  background: color-mix(in srgb, var(--color-surface-elevated) 42%, transparent);
  border-block: 1px solid var(--color-outline-soft);
}

.seo-section__head {
  display: grid;
  justify-items: center;
  gap: 12px;
  max-width: 780px;
  margin-inline: auto;
  margin-bottom: 32px;
  text-align: center;
}

.seo-section__head--left {
  justify-items: start;
  margin: 0;
  text-align: left;
}

.seo-section h2,
.seo-final h2 {
  font-size: clamp(2rem, 4vw, 3.35rem);
  line-height: 1.05;
}

.seo-section__head p:last-child,
.seo-final p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
  line-height: 1.55;
}

.seo-card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.seo-card,
.seo-step,
.seo-faq__item {
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-surface-elevated) 76%, transparent);
}

.seo-card {
  display: grid;
  gap: 12px;
  min-height: 250px;
  padding: 24px;
}

.seo-card svg,
.seo-step svg,
.seo-final svg {
  color: var(--color-brand-400);
}

.seo-card h3,
.seo-step h3,
.seo-faq h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
}

.seo-card p,
.seo-step p,
.seo-faq p {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.55;
}

.seo-workflow {
  display: grid;
  grid-template-columns: 0.82fr 1.18fr;
  gap: clamp(28px, 5vw, 64px);
}

.seo-workflow__steps {
  display: grid;
  gap: 16px;
}

.seo-step {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px 16px;
  padding: 22px 24px 22px 76px;
}

.seo-step__badge {
  position: absolute;
  top: 22px;
  left: 22px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-brand-500) 18%, transparent);
  color: var(--color-brand-300);
  font-weight: var(--font-weight-bold);
}

.seo-step svg {
  margin-top: 2px;
}

.seo-step p {
  grid-column: 2;
}

.seo-links {
  display: grid;
  grid-template-columns: minmax(0, 0.72fr) minmax(360px, 1fr);
  align-items: start;
  gap: 28px;
}

.seo-links h2 {
  margin-top: 10px;
}

.seo-links__nav {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.seo-links__nav a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 58px;
  padding-inline: 18px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-surface-elevated) 70%, transparent);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.seo-links__nav a:hover {
  border-color: var(--color-brand-500);
}

.seo-faq {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.seo-faq__item {
  padding: 22px;
}

.seo-faq__item h3 {
  margin-bottom: 10px;
  font-size: var(--font-size-lg);
}

.seo-final {
  padding-block: clamp(64px, 9vw, 108px);
}

.seo-final__inner {
  flex-direction: column;
  max-width: 820px;
  text-align: center;
}

.seo-final__inner p {
  max-width: 680px;
}

@media (max-width: 980px) {
  .seo-hero__grid,
  .seo-workflow,
  .seo-links {
    grid-template-columns: 1fr;
  }

  .seo-hero__visual {
    max-width: 720px;
  }

  .seo-card-grid,
  .seo-faq {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .seo-container {
    width: min(100% - 28px, 1180px);
  }

  .seo-hero {
    padding-top: 42px;
  }

  .seo-hero h1 {
    font-size: var(--font-size-4xl);
  }

  .seo-button,
  .seo-hero__actions {
    width: 100%;
  }

  .seo-step {
    padding: 22px;
  }

  .seo-step__badge {
    position: static;
  }

  .seo-step,
  .seo-step p {
    grid-template-columns: 1fr;
    grid-column: auto;
  }

  .seo-links__nav {
    grid-template-columns: 1fr;
  }
}
</style>
