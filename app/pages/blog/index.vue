<script setup lang="ts">
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-vue-next";
import { BLOG_POSTS, resolveBlogRobots } from "~/data/blogPosts";

definePageMeta({ layout: "public" });

const config = useRuntimeConfig();
const route = useRoute();
const siteUrl = String(config.public.siteUrl ?? "https://www.auraxis.com.br").replace(/\/$/, "");
const isMarketingSurface = config.public.siteSurface === "marketing";
const canonicalUrl = `${siteUrl}/blog`;
const robots = resolveBlogRobots({ isMarketingSurface, routePath: route.path });

useSeoMeta({
  title: "Blog de finanças pessoais",
  description:
    "Guias de controle financeiro, planejamento, análise financeira e insights para organizar melhor sua rotina.",
  robots,
  ogTitle: "Blog Auraxis — guias financeiros para decidir melhor",
  ogDescription:
    "Conteúdo útil sobre controle financeiro, planejamento, insights e gestão financeira pessoal.",
  ogUrl: canonicalUrl,
  twitterTitle: "Blog Auraxis — guias financeiros",
  twitterDescription:
    "Guias práticos para organizar finanças, revisar metas e usar insights financeiros com contexto.",
});

useHead({
  link: [{ rel: "canonical", href: canonicalUrl }],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "Blog Auraxis",
        description:
          "Guias de controle financeiro, planejamento financeiro, análise financeira e inteligência financeira.",
        url: canonicalUrl,
        inLanguage: "pt-BR",
        publisher: {
          "@type": "Organization",
          name: "Auraxis",
          url: siteUrl,
        },
        blogPost: BLOG_POSTS.map((post) => ({
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          url: `${siteUrl}/blog/${post.slug}`,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
        })),
      }),
    },
  ],
});
</script>

<template>
  <main class="blog-index">
    <section class="blog-hero" aria-labelledby="blog-title">
      <div class="blog-container blog-hero__grid">
        <div class="blog-hero__copy motion-fade-up">
          <p class="blog-eyebrow">Educação financeira aplicada</p>
          <h1 id="blog-title">Guias financeiros para decidir com mais clareza</h1>
          <p>
            Conteúdo direto para quem quer sair do improviso: controle financeiro, análise
            financeira, planejamento, metas e insights com contexto.
          </p>
          <div class="blog-actions">
            <NuxtLink to="/register" class="blog-button blog-button--primary">
              Criar conta gratuita
              <ArrowRight :size="16" aria-hidden="true" />
            </NuxtLink>
            <NuxtLink to="/controle-financeiro" class="blog-button blog-button--ghost">
              Ver controle financeiro
            </NuxtLink>
          </div>
        </div>

        <aside class="blog-hero__panel motion-pop" aria-label="Temas do blog">
          <Sparkles :size="26" aria-hidden="true" />
          <h2>Leia por intenção</h2>
          <ul>
            <li>
              <CheckCircle2 :size="17" aria-hidden="true" />
              Controle financeiro sem planilha confusa
            </li>
            <li>
              <CheckCircle2 :size="17" aria-hidden="true" />
              Insights financeiros com consentimento e contexto
            </li>
            <li>
              <CheckCircle2 :size="17" aria-hidden="true" />
              Planejamento financeiro mensal com metas reais
            </li>
          </ul>
        </aside>
      </div>
    </section>

    <section class="blog-section" aria-labelledby="posts-title">
      <div class="blog-container">
        <div class="blog-section__head">
          <p class="blog-eyebrow">Artigos publicados</p>
          <h2 id="posts-title">Comece pelo problema que você quer resolver</h2>
        </div>

        <div class="blog-grid motion-stagger">
          <article v-for="post in BLOG_POSTS" :key="post.slug" class="blog-card motion-interactive">
            <div class="blog-card__meta">
              <span>{{ post.category }}</span>
              <span>{{ post.readingTime }}</span>
            </div>
            <h3>{{ post.title }}</h3>
            <p>{{ post.excerpt }}</p>
            <ul aria-label="Palavras-chave do artigo">
              <li v-for="keyword in post.keywords" :key="keyword">{{ keyword }}</li>
            </ul>
            <NuxtLink :to="`/blog/${post.slug}`" class="blog-card__link">
              Ler guia
              <ArrowRight :size="15" aria-hidden="true" />
            </NuxtLink>
          </article>
        </div>
      </div>
    </section>

    <section class="blog-topics" aria-labelledby="topics-title">
      <div class="blog-container blog-topics__inner">
        <div>
          <p class="blog-eyebrow">Explore também</p>
          <h2 id="topics-title">Páginas úteis para aprofundar a pesquisa</h2>
        </div>
        <nav class="blog-topics__nav" aria-label="Páginas comerciais relacionadas">
          <NuxtLink to="/controle-financeiro">Controle financeiro</NuxtLink>
          <NuxtLink to="/insights-financeiros">Insights financeiros</NuxtLink>
          <NuxtLink to="/planejamento-financeiro">Planejamento financeiro</NuxtLink>
          <NuxtLink to="/analise-financeira">Análise financeira</NuxtLink>
        </nav>
      </div>
    </section>
  </main>
</template>

<style scoped>
.blog-index {
  color: var(--color-text-primary);
  background:
    radial-gradient(
      circle at 8% 0%,
      color-mix(in srgb, var(--color-brand-500) 16%, transparent),
      transparent 34rem
    ),
    var(--color-bg-base);
}

.blog-container {
  width: min(1120px, calc(100% - 40px));
  margin-inline: auto;
}

.blog-hero {
  padding-block: clamp(56px, 8vw, 110px) 52px;
}

.blog-hero__grid,
.blog-topics__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.62fr);
  align-items: center;
  gap: clamp(28px, 6vw, 72px);
}

.blog-hero__copy {
  display: grid;
  gap: 22px;
}

.blog-eyebrow {
  margin: 0;
  color: var(--color-brand-400);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.blog-hero h1,
.blog-section h2,
.blog-topics h2 {
  margin: 0;
  font-family: var(--font-heading);
}

.blog-hero h1 {
  max-width: 760px;
  font-size: clamp(2.65rem, 6vw, 5.2rem);
  line-height: 0.98;
}

.blog-hero p,
.blog-section__head p {
  max-width: 680px;
  margin: 0;
  color: var(--color-text-secondary);
  font-size: clamp(1.05rem, 1.8vw, 1.3rem);
  line-height: 1.65;
}

.blog-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.blog-button,
.blog-card__link,
.blog-topics__nav a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 46px;
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.blog-button:hover,
.blog-card__link:hover,
.blog-topics__nav a:hover {
  transform: translateY(-1px);
}

.blog-button {
  padding-inline: 20px;
}

.blog-button--primary {
  background: linear-gradient(135deg, #44d4ff, #42e8a9);
  color: #05070d;
}

.blog-button--ghost {
  border: 1px solid var(--color-outline-hard);
  color: var(--color-text-primary);
}

.blog-hero__panel,
.blog-card,
.blog-topics {
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--color-bg-elevated) 82%, transparent);
  box-shadow: var(--shadow-soft);
}

.blog-hero__panel {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 4vw, 34px);
}

.blog-hero__panel h2,
.blog-card h3 {
  margin: 0;
  font-family: var(--font-heading);
}

.blog-hero__panel ul,
.blog-card ul {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.blog-hero__panel li {
  display: flex;
  gap: 10px;
  color: var(--color-text-secondary);
  line-height: 1.45;
}

.blog-section {
  padding-block: 52px;
}

.blog-section__head {
  display: grid;
  gap: 12px;
  margin-bottom: 28px;
}

.blog-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.blog-card {
  display: grid;
  gap: 16px;
  padding: 24px;
}

.blog-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.blog-card p {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.blog-card ul {
  display: flex;
  flex-wrap: wrap;
}

.blog-card li {
  padding: 6px 10px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-brand-500) 12%, transparent);
  color: var(--color-brand-300);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.blog-card__link {
  justify-self: start;
  min-height: 40px;
  color: var(--color-brand-300);
}

.blog-topics {
  margin-block: 36px 80px;
  padding: clamp(24px, 4vw, 34px);
}

.blog-topics__nav {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.blog-topics__nav a {
  min-height: 42px;
  border: 1px solid var(--color-outline-soft);
  color: var(--color-text-primary);
}

@media (max-width: 900px) {
  .blog-hero__grid,
  .blog-topics__inner,
  .blog-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .blog-container {
    width: min(100% - 28px, 1120px);
  }

  .blog-topics__nav {
    grid-template-columns: 1fr;
  }
}
</style>
