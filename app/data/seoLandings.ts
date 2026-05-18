export const SEO_LANDING_SLUGS = [
  "controle-de-financas",
  "gestao-financeira",
  "planejador-financeiro",
  "analises-financeiras",
  "controle-de-gastos",
] as const;

export type SeoLandingSlug = (typeof SEO_LANDING_SLUGS)[number];

export interface SeoLandingCard {
  readonly title: string;
  readonly text: string;
}

export interface SeoLandingStep {
  readonly label: string;
  readonly title: string;
  readonly text: string;
}

export interface SeoLandingFaq {
  readonly question: string;
  readonly answer: string;
}

export interface SeoLandingLink {
  readonly label: string;
  readonly to: string;
}

export interface SeoLanding {
  readonly slug: SeoLandingSlug;
  readonly keyword: string;
  readonly title: string;
  readonly description: string;
  readonly h1: string;
  readonly kicker: string;
  readonly lead: string;
  readonly visualCaption: string;
  readonly proofPoints: readonly string[];
  readonly highlights: readonly SeoLandingCard[];
  readonly workflow: readonly SeoLandingStep[];
  readonly faq: readonly SeoLandingFaq[];
  readonly relatedLinks: readonly SeoLandingLink[];
}

const relatedLinks: readonly SeoLandingLink[] = [
  { label: "Controle de finanças", to: "/controle-de-financas" },
  { label: "Gestão financeira", to: "/gestao-financeira" },
  { label: "Planejador financeiro", to: "/planejador-financeiro" },
  { label: "Análises financeiras", to: "/analises-financeiras" },
  { label: "Controle de gastos", to: "/controle-de-gastos" },
];

const sharedFaq: readonly SeoLandingFaq[] = [
  {
    question: "O Auraxis substitui orientação financeira profissional?",
    answer:
      "Não. O Auraxis organiza seus dados e apresenta análises para apoiar sua rotina, mas não promete recomendação financeira personalizada.",
  },
  {
    question: "Preciso cadastrar tudo antes de enxergar valor?",
    answer:
      "Não. Você pode começar com poucos lançamentos, uma meta ou uma ferramenta pública e evoluir o painel aos poucos.",
  },
  {
    question: "Os recursos de IA usam meus dados para treinar modelos?",
    answer:
      "Não. Os dados do usuário não devem ser usados para treinar modelos, e recursos de IA dependem de consentimento ativo.",
  },
];

export const SEO_LANDINGS: readonly SeoLanding[] = [
  {
    slug: "controle-de-financas",
    keyword: "controle de finanças",
    title: "Controle de finanças claro para o dia a dia",
    description:
      "Organize receitas, despesas, metas e análises em uma rotina simples com o Auraxis.",
    h1: "Controle de finanças com clareza para decidir melhor",
    kicker: "Rotina financeira",
    lead: "O Auraxis ajuda você a registrar movimentações, entender o mês atual e enxergar prioridades sem depender de planilhas soltas.",
    visualCaption: "Dashboard, fluxo de caixa e alertas no mesmo painel.",
    proofPoints: [
      "Resumo mensal com entradas, saídas e saldo",
      "Categorias e contas para entender onde o dinheiro circula",
      "Insights com linguagem simples e consentimento explícito",
    ],
    highlights: [
      {
        title: "O mês fica visível",
        text: "Receitas, despesas e período selecionado aparecem em contexto para reduzir surpresa no fim do mês.",
      },
      {
        title: "Menos abas, mais leitura",
        text: "Transações, metas, ferramentas e análises conversam entre si para dar continuidade à rotina.",
      },
      {
        title: "Ação depois do diagnóstico",
        text: "Cada sinal aponta uma próxima revisão: despesa, categoria, meta ou orçamento.",
      },
    ],
    workflow: [
      {
        label: "1",
        title: "Registre o essencial",
        text: "Comece por receitas e despesas do mês, com data, categoria e status de pagamento.",
      },
      {
        label: "2",
        title: "Revise o período",
        text: "Compare entradas e saídas, filtre por tipo e acompanhe o saldo com menos fricção.",
      },
      {
        label: "3",
        title: "Planeje a próxima decisão",
        text: "Use metas, ferramentas e insights para transformar leitura financeira em prioridade prática.",
      },
    ],
    faq: sharedFaq,
    relatedLinks,
  },
  {
    slug: "gestao-financeira",
    keyword: "gestão financeira",
    title: "Gestão financeira pessoal com contexto",
    description:
      "Centralize controle financeiro, metas, carteira e análises para acompanhar sua evolução.",
    h1: "Gestão financeira pessoal sem perder o contexto",
    kicker: "Visão integrada",
    lead: "Acompanhe sua vida financeira em uma visão conectada: movimentações, metas, patrimônio, ferramentas e sinais de atenção.",
    visualCaption: "Uma experiência para rotina, planejamento e acompanhamento.",
    proofPoints: [
      "Fluxo de caixa e patrimônio lado a lado",
      "Metas financeiras com progresso e projeção",
      "Ferramentas para comparar decisões antes de agir",
    ],
    highlights: [
      {
        title: "Tudo parte dos seus dados",
        text: "A gestão melhora quando cada lançamento alimenta resumos, alertas e comparações úteis.",
      },
      {
        title: "Metas deixam de ser abstratas",
        text: "Você acompanha objetivo, prazo, aporte e avanço com uma linguagem fácil de revisar.",
      },
      {
        title: "Ferramentas no momento certo",
        text: "Calculadoras e simuladores ajudam a responder dúvidas recorrentes sem sair do ambiente.",
      },
    ],
    workflow: [
      {
        label: "1",
        title: "Organize os domínios",
        text: "Separe rotina mensal, metas, carteira e ferramentas para entender cada camada da gestão.",
      },
      {
        label: "2",
        title: "Compare o que mudou",
        text: "Use períodos, categorias e saldos para identificar evolução ou pontos de pressão.",
      },
      {
        label: "3",
        title: "Acompanhe com cadência",
        text: "Volte ao painel com frequência para corrigir rota antes que o orçamento aperte.",
      },
    ],
    faq: sharedFaq,
    relatedLinks,
  },
  {
    slug: "planejador-financeiro",
    keyword: "planejador financeiro",
    title: "Planejador financeiro para metas reais",
    description:
      "Planeje metas, simule cenários e acompanhe sua rotina financeira em um painel simples.",
    h1: "Planejador financeiro para transformar intenção em rotina",
    kicker: "Planejamento prático",
    lead: "Saia do desejo genérico e acompanhe metas com prazo, aporte, progresso e ajustes possíveis ao longo do caminho.",
    visualCaption: "Metas, simulações e próximos passos conectados ao seu mês.",
    proofPoints: [
      "Metas com progresso e distância até o objetivo",
      "Simulações para testar cenários antes de decidir",
      "Rotina mensal ligada ao planejamento de longo prazo",
    ],
    highlights: [
      {
        title: "Planejamento que cabe no mês",
        text: "A meta conversa com o caixa atual para mostrar se o plano continua sustentável.",
      },
      {
        title: "Projeções mais fáceis de entender",
        text: "Use cenários para visualizar prazo, aporte e impacto sem montar fórmulas do zero.",
      },
      {
        title: "Próximo passo explícito",
        text: "O painel ajuda a revisar onde ajustar: gasto, reserva, aporte ou prioridade.",
      },
    ],
    workflow: [
      {
        label: "1",
        title: "Escolha uma meta",
        text: "Defina objetivo, valor alvo e prazo para criar um ponto de acompanhamento concreto.",
      },
      {
        label: "2",
        title: "Teste o caminho",
        text: "Compare aportes e prazos para entender o esforço antes de assumir o compromisso.",
      },
      {
        label: "3",
        title: "Ajuste com dados reais",
        text: "Revise a meta conforme receitas, despesas e prioridades mudam ao longo dos meses.",
      },
    ],
    faq: sharedFaq,
    relatedLinks,
  },
  {
    slug: "analises-financeiras",
    keyword: "análises financeiras",
    title: "Análises financeiras com clareza e IA",
    description:
      "Veja sinais sobre gastos, saldo, categorias e tendências com explicações simples no Auraxis.",
    h1: "Análises financeiras explicáveis para revisar melhor",
    kicker: "Leitura inteligente",
    lead: "O Auraxis transforma movimentações em sinais claros: onde revisar, o que mudou e quais padrões merecem atenção.",
    visualCaption: "Insights, comparações e alertas com linguagem direta.",
    proofPoints: [
      "Comparação de receitas, despesas e saldo",
      "Sinais de categorias que merecem revisão",
      "IA com consentimento ativo e limites transparentes",
    ],
    highlights: [
      {
        title: "Menos ruído na leitura",
        text: "A análise destaca mudanças importantes para você não precisar procurar manualmente.",
      },
      {
        title: "Explicação antes da ação",
        text: "Cada insight mostra o motivo do alerta e evita linguagem de recomendação financeira absoluta.",
      },
      {
        title: "Privacidade como premissa",
        text: "Recursos de IA só avançam com consentimento e com minimização dos dados enviados.",
      },
    ],
    workflow: [
      {
        label: "1",
        title: "Consolide movimentações",
        text: "Quanto melhor o histórico registrado, mais contexto o painel tem para comparar períodos.",
      },
      {
        label: "2",
        title: "Gere ou revise insights",
        text: "Use análises automáticas para encontrar sinais de gasto, saldo ou categoria.",
      },
      {
        label: "3",
        title: "Transforme em revisão",
        text: "Abra a área indicada pelo insight e decida o ajuste que faz sentido para sua rotina.",
      },
    ],
    faq: sharedFaq,
    relatedLinks,
  },
  {
    slug: "controle-de-gastos",
    keyword: "controle de gastos",
    title: "Controle de gastos sem planilhas confusas",
    description:
      "Acompanhe despesas, categorias, status e período para revisar gastos com mais clareza.",
    h1: "Controle de gastos para enxergar excessos antes do susto",
    kicker: "Despesas em foco",
    lead: "Veja o que saiu, quando saiu e em qual categoria, com filtros que ajudam a entender o gasto por período.",
    visualCaption: "Tabela de transações, categorias e ações rápidas no contexto certo.",
    proofPoints: [
      "Despesas pagas e pendentes em uma leitura única",
      "Período atual claro e filtros compactos",
      "Categorias para separar rotina, dívida e consumo",
    ],
    highlights: [
      {
        title: "Gastos deixam rastro",
        text: "Cada despesa registrada cria histórico para comparar meses e identificar padrões recorrentes.",
      },
      {
        title: "Status evita confusão",
        text: "Saiba o que está pago, pendente ou planejado sem depender de memória.",
      },
      {
        title: "Categorias viram conversa",
        text: "Separar despesas por assunto facilita revisar orçamento e priorizar cortes possíveis.",
      },
    ],
    workflow: [
      {
        label: "1",
        title: "Registre a saída",
        text: "Informe valor, data, categoria e status para manter o histórico confiável.",
      },
      {
        label: "2",
        title: "Filtre por período",
        text: "Navegue entre meses ou ranges customizados para comparar gastos com precisão.",
      },
      {
        label: "3",
        title: "Revise o padrão",
        text: "Use categorias e insights para escolher onde investigar antes de tomar uma decisão.",
      },
    ],
    faq: sharedFaq,
    relatedLinks,
  },
];

const landingsBySlug = new Map<SeoLandingSlug, SeoLanding>(
  SEO_LANDINGS.map((landing) => [landing.slug, landing]),
);

/**
 * Resolves commercial SEO landing metadata by slug.
 *
 * @param slug - Single path segment from the public landing route.
 * @returns Landing metadata when the slug is part of the canonical keyword map.
 */
export function getSeoLanding(slug: string): SeoLanding | undefined {
  return SEO_LANDING_SLUGS.includes(slug as SeoLandingSlug)
    ? landingsBySlug.get(slug as SeoLandingSlug)
    : undefined;
}
