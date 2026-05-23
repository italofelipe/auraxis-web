export const BLOG_POST_SLUGS = [
  "controle-financeiro-sem-planilha-confusa",
  "insights-financeiros-com-contexto",
  "planejamento-financeiro-mensal",
] as const;

export type BlogPostSlug = (typeof BLOG_POST_SLUGS)[number];

export interface BlogPostLink {
  readonly label: string;
  readonly to: string;
}

export interface BlogPostSection {
  readonly title: string;
  readonly paragraphs: readonly string[];
}

export interface BlogPostFaq {
  readonly question: string;
  readonly answer: string;
}

export interface BlogPost {
  readonly slug: BlogPostSlug;
  readonly title: string;
  readonly description: string;
  readonly excerpt: string;
  readonly category: string;
  readonly keywords: readonly string[];
  readonly publishedAt: string;
  readonly updatedAt: string;
  readonly readingTime: string;
  readonly heroKicker: string;
  readonly sections: readonly BlogPostSection[];
  readonly faq: readonly BlogPostFaq[];
  readonly relatedLinks: readonly BlogPostLink[];
}

export type BlogRobots = "index, follow" | "noindex, nofollow";

const sharedLinks: readonly BlogPostLink[] = [
  { label: "Controle financeiro", to: "/controle-financeiro" },
  { label: "Insights financeiros", to: "/insights-financeiros" },
  { label: "Ferramentas financeiras", to: "/tools" },
  { label: "Criar conta gratuita", to: "/register" },
];

export const BLOG_POSTS: readonly BlogPost[] = [
  {
    slug: "controle-financeiro-sem-planilha-confusa",
    title: "Controle financeiro sem planilha confusa",
    description:
      "Veja como organizar receitas, despesas, metas e revisões do mês sem depender de uma planilha de gastos difícil de manter.",
    excerpt:
      "Uma rotina de controle financeiro funciona melhor quando o mês fica visível, os lançamentos têm contexto e cada revisão aponta uma próxima ação.",
    category: "Rotina financeira",
    keywords: ["controle financeiro", "planilha de gastos", "gestão financeira"],
    publishedAt: "2026-05-23",
    updatedAt: "2026-05-23",
    readingTime: "5 min",
    heroKicker: "Guia prático",
    sections: [
      {
        title: "O mês precisa ter uma leitura simples",
        paragraphs: [
          "Controle financeiro não começa em gráficos complexos. Ele começa em saber o que entrou, o que saiu, o que ainda está pendente e qual período está sendo analisado.",
          "Quando a informação fica espalhada em abas, fórmulas e anotações, a rotina vira manutenção. A experiência ideal reduz esse atrito e mostra o próximo ponto de revisão.",
        ],
      },
      {
        title: "Troque esforço manual por cadência",
        paragraphs: [
          "O objetivo não é abandonar todo histórico existente de uma vez. Comece pelo mês atual, registre as movimentações importantes e use categorias para entender padrões.",
          "Com a cadência certa, relatórios e insights deixam de ser uma tarefa extra e passam a ser uma consequência natural dos lançamentos.",
        ],
      },
      {
        title: "Transforme diagnóstico em ação",
        paragraphs: [
          "Depois de enxergar o saldo e as categorias, defina uma ação pequena: revisar uma despesa fixa, ajustar uma meta ou simular um cenário antes de assumir um compromisso.",
          "Essa ponte entre leitura e ação é o que diferencia um controle financeiro vivo de uma planilha que só registra o passado.",
        ],
      },
    ],
    faq: [
      {
        question: "Preciso migrar minha planilha inteira para começar?",
        answer:
          "Não. Comece com o mês atual e evolua o histórico quando fizer sentido. O mais importante é criar uma rotina de revisão consistente.",
      },
      {
        question: "Controle financeiro serve apenas para cortar gastos?",
        answer:
          "Não. Ele também ajuda a planejar metas, entender renda, acompanhar patrimônio e tomar decisões com mais contexto.",
      },
    ],
    relatedLinks: sharedLinks,
  },
  {
    slug: "insights-financeiros-com-contexto",
    title: "Insights financeiros com contexto, não palpites soltos",
    description:
      "Entenda como usar insights financeiros para comparar períodos, revisar mudanças e investigar transações, metas e orçamento com mais clareza.",
    excerpt:
      "Insights úteis explicam o que mudou, de onde vem o sinal e qual área merece revisão, sem substituir a decisão do usuário.",
    category: "Inteligência financeira",
    keywords: ["insights financeiros", "inteligência financeira", "análise financeira"],
    publishedAt: "2026-05-23",
    updatedAt: "2026-05-23",
    readingTime: "6 min",
    heroKicker: "IA responsável",
    sections: [
      {
        title: "Um bom insight começa nos dados certos",
        paragraphs: [
          "A análise precisa considerar transações, metas, orçamentos, cartões e carteira quando esses dados existirem. Olhar apenas uma tela gera um retrato incompleto.",
          "Por isso, o insight deve nascer do banco de dados e depois ser apresentado com recortes por página, mantendo a leitura global preservada.",
        ],
      },
      {
        title: "Comparação é mais útil do que alerta genérico",
        paragraphs: [
          "Dizer que uma despesa subiu pouco ajuda se o usuário entende contra qual período ela foi comparada: ontem, semana passada, mês anterior ou orçamento previsto.",
          "A comparação transforma uma mensagem solta em investigação. O usuário sabe onde clicar e o que revisar.",
        ],
      },
      {
        title: "IA precisa de transparência e consentimento",
        paragraphs: [
          "A análise com IA deve explicar limites, respeitar consentimento ativo e evitar promessas de recomendação financeira personalizada.",
          "No Auraxis, a proposta é apoiar leitura e organização. A decisão continua com o usuário, dentro do seu próprio contexto.",
        ],
      },
    ],
    faq: [
      {
        question: "Insights financeiros são recomendações de investimento?",
        answer:
          "Não. Eles são análises de organização e revisão financeira, sem substituir aconselhamento profissional.",
      },
      {
        question: "A IA precisa de consentimento?",
        answer:
          "Sim. Recursos de IA devem depender de consentimento ativo e usar somente o necessário para gerar a análise.",
      },
    ],
    relatedLinks: sharedLinks,
  },
  {
    slug: "planejamento-financeiro-mensal",
    title: "Planejamento financeiro mensal com metas e orçamento",
    description:
      "Aprenda a conectar planejamento financeiro, metas, orçamento e simulações para revisar o mês com mais previsibilidade.",
    excerpt:
      "Planejar o mês fica mais simples quando objetivos, orçamento e movimentações conversam entre si e mostram a distância até cada decisão.",
    category: "Planejamento",
    keywords: ["planejamento financeiro", "gestão financeira", "finanças"],
    publishedAt: "2026-05-23",
    updatedAt: "2026-05-23",
    readingTime: "5 min",
    heroKicker: "Metas e orçamento",
    sections: [
      {
        title: "Planejamento financeiro precisa caber na rotina",
        paragraphs: [
          "Um plano que só existe no começo do mês envelhece rápido. Receitas, despesas e prioridades mudam, e o acompanhamento precisa absorver essas mudanças.",
          "A revisão ideal mostra o orçamento, a meta e a movimentação real lado a lado para evitar decisões desconectadas.",
        ],
      },
      {
        title: "Metas dão direção ao esforço",
        paragraphs: [
          "Sem meta, todo ajuste parece sacrifício. Com meta, o usuário entende por que reduzir um gasto, antecipar um aporte ou simular um cenário.",
          "A meta transforma intenção em número: valor alvo, prazo, progresso e aporte necessário.",
        ],
      },
      {
        title: "Simulações reduzem decisões no impulso",
        paragraphs: [
          "Antes de parcelar, antecipar ou assumir um novo compromisso, uma simulação ajuda a visualizar impacto e comparar alternativas.",
          "O resultado não precisa ser uma sentença. Ele deve ser um apoio para pensar melhor e revisar riscos antes de agir.",
        ],
      },
    ],
    faq: [
      {
        question: "Planejamento financeiro precisa ser complexo?",
        answer:
          "Não. Uma boa rotina começa com período, orçamento, metas e um momento recorrente de revisão.",
      },
      {
        question: "Simulações substituem planejamento profissional?",
        answer:
          "Não. Elas ajudam a comparar cenários, mas decisões complexas podem exigir orientação especializada.",
      },
    ],
    relatedLinks: sharedLinks,
  },
];

const postsBySlug = new Map<BlogPostSlug, BlogPost>(BLOG_POSTS.map((post) => [post.slug, post]));

/**
 * Resolves a public editorial post by canonical slug.
 *
 * @param slug - Route segment from `/blog/[slug]`.
 * @returns Matching blog post when the slug is part of the editorial seed.
 */
export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POST_SLUGS.includes(slug as BlogPostSlug)
    ? postsBySlug.get(slug as BlogPostSlug)
    : undefined;
}

/**
 * Picks related posts for the end of an article.
 *
 * @param currentSlug - Slug currently being read.
 * @returns Other published posts in deterministic order.
 */
export function getRelatedBlogPosts(currentSlug: BlogPostSlug): readonly BlogPost[] {
  return BLOG_POSTS.filter((post) => post.slug !== currentSlug).slice(0, 2);
}

/**
 * Resolves indexability for the editorial hub.
 *
 * Marketing deploys index the canonical PT-BR routes. Localized duplicates and app deploys stay
 * out of search because the article content is intentionally authored only in Portuguese.
 *
 * @param input - Current surface and route path.
 * @param input.isMarketingSurface - Whether the deployment is the public marketing surface.
 * @param input.routePath - Current route path being rendered by Nuxt/i18n.
 * @returns Robots directive for the current rendered route.
 */
export function resolveBlogRobots(input: {
  readonly isMarketingSurface: boolean;
  readonly routePath: string;
}): BlogRobots {
  return input.isMarketingSurface && !input.routePath.startsWith("/en/")
    ? "index, follow"
    : "noindex, nofollow";
}
