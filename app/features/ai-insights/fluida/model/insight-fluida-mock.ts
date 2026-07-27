import { formatFluidaCurrency, type FluidaInsightSource } from "./insight-fluida";

/**
 * Mock source for the Fluida reading.
 *
 * Shape mirrors the additive `/ai/insights` response (`paragraphs` / `retro` /
 * `series` / `highlights`) and the mobile `InsightFluidaVM`. It exists only so
 * the screen renders behind the `web.insights.fluida` flag while the backend
 * (auraxis-api PR #1502) is not yet deployed. Once the DTO ships, a mapper in
 * `api/` produces the same {@link FluidaInsightSource} from the real payload and
 * this constant is dropped.
 *
 * The content is a **fictional demo persona** — a single salary of R$ 8.400, a
 * month that closes in the black, and one actionable finding (subscriptions
 * creeping up). It must stay that way: this mock also feeds the product
 * screenshots on the public landing, and a previous version carried real
 * account data — a person's name, a pet's name, an actual salary and an
 * overdue invoice — into a public repository and onto auraxis.com.br (#1188).
 * Never paste a real reading here.
 */
export const FLUIDA_MOCK_SOURCE: FluidaInsightSource = {
  meta: {
    model: "GPT-4o",
    generatedAt: "21 de junho de 2026, 06:00",
    referenceLabel: "movimentação até 20 de junho",
    privacyNote:
      "Seus dados não treinam modelos. A IA lê apenas seus registros no Auraxis para preparar esta leitura.",
  },
  series: {
    daily: {
      values: [180, 96, 312, 240, 84, 0, 128],
      labels: ["14", "15", "16", "17", "18", "19", "20"],
    },
    weekly: {
      values: [1580, 1210, 1740, 1320, 1490, 1040],
      labels: ["S-5", "S-4", "S-3", "S-2", "S-1", "Atual"],
    },
  },
  general: {
    daily: {
      severity: "ok",
      readMin: 4,
      title: "O mês fecha com R$ 2.220 de sobra",
      summary:
        "As entradas somam R$ 8.400 e as saídas R$ 6.180 — uma sobra de R$ 2.220, a maior dos últimos seis meses. O único ponto que merece sua atenção são as assinaturas, que subiram para R$ 312 por mês.",
      retro: [
        {
          when: "Ontem · 20 jun",
          value: -128,
          text: "Mercado e transporte. Dia dentro do ritmo da semana.",
        },
        {
          when: "Anteontem · 19 jun",
          value: 0,
          text: "Nenhum lançamento — o terceiro dia sem gasto no mês.",
        },
        {
          when: "vs. semana passada",
          value: 450,
          text: "Você gastou R$ 450 a menos que na semana anterior.",
        },
      ],
      paragraphs: [
        "Junho está sendo o mês mais equilibrado do semestre. As despesas somam R$ 6.180 contra R$ 8.400 de entradas, e a sobra de R$ 2.220 já supera em 12% a média dos últimos seis meses. Nenhuma categoria estourou o limite definido.",
        "O gasto se distribuiu bem ao longo dos dias, sem picos: o maior lançamento isolado do mês foi o aluguel, de R$ 2.400, e nenhum outro passou de R$ 400. Essa regularidade é o que torna o fluxo previsível — dá para saber quanto sobra antes do fim do mês.",
        "O detalhe que vale corrigir está nas assinaturas. São sete serviços ativos que somam R$ 312 por mês, e três deles renovaram no mesmo dia 19. Dois têm cobrança sobreposta — mesmo tipo de serviço, contratos diferentes.",
      ],
      pullStat: {
        label: "Sobra do mês",
        value: formatFluidaCurrency(2220),
        caption: "12% acima da sua média",
      },
      alerts: [
        { severity: "media", text: "7 assinaturas ativas somam R$ 312/mês — duas se sobrepõem." },
        { severity: "media", text: "Reserva de emergência cobre 2,3 meses; a meta é 6." },
      ],
      nextStep:
        "Revise as duas assinaturas sobrepostas e direcione a diferença para a Reserva de emergência. São R$ 84 por mês que hoje saem sem contrapartida.",
    },
    weekly: {
      severity: "ok",
      readMin: 6,
      title: "A semana mais barata do mês, e não foi por acaso",
      summary:
        "R$ 1.040 em sete dias, contra R$ 1.490 na semana anterior. A queda veio de mercado e delivery — as duas categorias que você passou a registrar no mesmo dia da compra.",
      retro: [
        {
          when: "Esta semana · 15–21 jun",
          value: -1040,
          text: "9 lançamentos, nenhum acima de R$ 320.",
        },
        {
          when: "Semana anterior · 8–14 jun",
          value: -1490,
          text: "Semana do aluguel e das renovações anuais.",
        },
        {
          when: "Tendência (6 semanas)",
          value: -450,
          text: "Terceira semana consecutiva abaixo da média móvel.",
        },
      ],
      paragraphs: [
        "Sete dias, R$ 1.040, nenhum lançamento acima de R$ 320. Essa é a semana mais barata de junho, e a terceira consecutiva abaixo da média móvel de R$ 1.397 — o que caracteriza tendência, não sorte.",
        "A diferença veio de duas categorias. Mercado caiu de R$ 420 para R$ 268 e delivery, de R$ 210 para R$ 96. Ambas são justamente as que você passou a registrar no mesmo dia da compra a partir de 8 de junho: quando o gasto fica visível na hora, ele encolhe sozinho.",
        "Moradia e transporte ficaram estáveis, como esperado de despesa fixa. Não há nada em atraso e nenhuma categoria passou de 80% do limite — o orçamento está sendo cumprido sem esforço aparente.",
        "Se o ritmo desta semana se mantiver, julho fecha com sobra perto de R$ 2.600, o suficiente para levar a Reserva de emergência de 2,3 para 2,7 meses de despesas cobertas.",
      ],
      pullStat: {
        label: "Saídas da semana",
        value: formatFluidaCurrency(1040),
        caption: "R$ 450 abaixo da semana anterior",
      },
      alerts: [
        { severity: "media", text: "Assinaturas renovam dia 19 — R$ 312 concentrados num dia só." },
      ],
      nextStep:
        "Mantenha o registro no mesmo dia da compra: foi o que derrubou mercado e delivery em três semanas. Vale replicar o hábito para lazer, a categoria que ainda oscila.",
    },
  },
  themes: {
    transactions: {
      label: "Transações",
      color: "#2E7CF6",
      daily: {
        severity: "ok",
        readMin: 3,
        title: "Nove lançamentos, nenhuma surpresa",
        summary:
          "Ontem entraram mercado (R$ 84,30) e transporte (R$ 43,70). No mês são 24 despesas e 2 receitas, com 61% do valor concentrado em moradia e mercado.",
        highlights: [
          { label: "Maior gasto do mês", value: formatFluidaCurrency(2400), caption: "Aluguel · dia 5" },
          { label: "Entradas do mês", value: formatFluidaCurrency(8400), caption: "Salário · dia 5" },
          { label: "Gasto de ontem", value: formatFluidaCurrency(128), caption: "Mercado e transporte" },
        ],
        paragraphs: [
          "Os dois lançamentos de ontem são rotineiros e cabem no ritmo da semana. Nenhum deles muda a leitura de categorias nem se aproxima de algum limite.",
          "No mês, 61% do valor está em moradia (R$ 2.400) e mercado (R$ 1.360). As outras 22 despesas se dividem em valores pequenos, o que mantém a previsibilidade alta e facilita projetar o fechamento.",
        ],
        nextStep:
          "Todos os lançamentos do mês estão categorizados — é o que permite a leitura por área funcionar. Vale manter o hábito de classificar no momento do registro.",
      },
      weekly: {
        severity: "ok",
        readMin: 5,
        title: "Onde o dinheiro foi: mercado, transporte e assinaturas",
        summary:
          "R$ 1.040 na semana, distribuídos entre mercado (R$ 268), assinaturas (R$ 312), transporte (R$ 164) e lazer (R$ 296). Nenhum lançamento atrasado.",
        highlights: [
          { label: "Saídas da semana", value: formatFluidaCurrency(1040), caption: "9 lançamentos" },
          { label: "Em despesas fixas", value: "30%", caption: "assinaturas e transporte" },
          { label: "Atrasados", value: "0 itens", caption: "tudo em dia" },
        ],
        paragraphs: [
          "A semana tem uma composição saudável: 70% do valor em gasto variável que você controla (mercado, lazer) e 30% em fixo. Não há nada vencido, e nenhuma categoria passou do limite.",
          "As assinaturas concentram R$ 312 num único dia, o 19. Três serviços renovaram juntos, o que cria um pico artificial na leitura diária e some no acumulado da semana.",
          "Lazer foi a única categoria acima da média (R$ 296 contra R$ 210). Foi um único programa de fim de semana, não um padrão novo — vale acompanhar sem agir por enquanto.",
        ],
        nextStep:
          "Distribua as renovações de assinatura ao longo do mês. Concentrar R$ 312 num dia só atrapalha a leitura de fluxo e cria falsos picos.",
      },
    },
    goals: {
      label: "Metas",
      color: "#11A36B",
      daily: {
        severity: "ok",
        readMin: 3,
        title: "Reserva avança pelo quarto mês seguido",
        summary:
          "O aporte automático de R$ 600 entrou dia 5. A Reserva de emergência chegou a 72% (R$ 14.400 de R$ 20.000) e a Viagem, a 45%.",
        highlights: [
          { label: "Reserva de emergência", value: "72%", caption: "R$ 14.400 / R$ 20.000" },
          { label: "Viagem", value: "45%", caption: "R$ 5.400 / R$ 12.000" },
          { label: "Aporte do mês", value: formatFluidaCurrency(600), caption: "automático · dia 5" },
        ],
        paragraphs: [
          "O aporte automático continua entrando sem depender de decisão mensal — é o quarto mês seguido de avanço na Reserva, que passou de 58% para 72% no período.",
          "No ritmo atual, a Reserva chega aos R$ 20.000 em setembro. A Viagem, com aporte menor, alcança a meta em janeiro — dentro do prazo que você definiu.",
        ],
        nextStep:
          "Com a sobra de R$ 2.220 deste mês, um aporte extra de R$ 400 na Reserva antecipa a conclusão para agosto sem apertar o orçamento.",
      },
      weekly: {
        severity: "ok",
        readMin: 4,
        title: "Metas no prazo, sem esforço adicional",
        summary:
          "As duas metas avançaram no mês via aporte automático. Nenhuma delas depende de decisão semanal, o que explica a consistência.",
        highlights: [
          { label: "Aportes no mês", value: formatFluidaCurrency(600), caption: "2 de 2 metas" },
          { label: "Falta p/ Reserva", value: formatFluidaCurrency(5600), caption: "28% restante" },
          { label: "Falta p/ Viagem", value: formatFluidaCurrency(6600), caption: "55% restante" },
        ],
        paragraphs: [
          "Metas com aporte automático avançam mesmo em meses agitados, e é exatamente o que se vê aqui: nenhuma semana sem progresso desde março.",
          "A Reserva cobre hoje 2,3 meses de despesas. O alvo saudável para o seu padrão de gasto é 6 meses — o que significa R$ 37.000, acima da meta atual de R$ 20.000.",
          "Vale revisar o alvo da Reserva depois que ela fechar. Uma meta batida que ficou pequena dá falsa sensação de segurança.",
        ],
        nextStep:
          "Ao concluir a Reserva em setembro, redefina o alvo para 6 meses de despesa (R$ 37.000) e mantenha o mesmo aporte automático.",
      },
    },
    budgets: {
      label: "Orçamentos",
      color: "#FF8A3D",
      daily: {
        severity: "ok",
        readMin: 3,
        title: "Nenhuma categoria passou de 80% do limite",
        summary:
          "Faltando dez dias para o fim do mês, mercado está em 68% do teto e lazer em 74%. Moradia, fixa, já consumiu 100% como esperado.",
        highlights: [
          { label: "Mercado", value: "68%", caption: "R$ 1.360 de R$ 2.000" },
          { label: "Lazer", value: "74%", caption: "R$ 592 de R$ 800" },
          { label: "Sem categoria", value: formatFluidaCurrency(0), caption: "tudo classificado" },
        ],
        paragraphs: [
          "O orçamento está sendo cumprido com folga em todas as categorias variáveis. Mercado, historicamente a mais difícil, está em 68% com dez dias pela frente — o ritmo atual leva a fechar em torno de R$ 1.800.",
          "Nenhum lançamento ficou sem categoria neste mês, o que é o que permite os limites significarem alguma coisa. Orçamento por área só funciona quando cada real tem destino nomeado.",
        ],
        nextStep:
          "Lazer é a categoria com menos margem (74%). Se houver programa no fim de semana, vale antecipar a decisão de remanejar R$ 100 de mercado, que está sobrando.",
      },
      weekly: {
        severity: "ok",
        readMin: 4,
        title: "Três semanas seguidas dentro do teto",
        summary:
          "Todas as categorias variáveis terminaram a semana abaixo do limite proporcional. Mercado e delivery puxaram a economia.",
        highlights: [
          { label: "Dentro do limite", value: "6 de 6", caption: "categorias variáveis" },
          { label: "Maior folga", value: formatFluidaCurrency(640), caption: "mercado" },
          { label: "Menor folga", value: formatFluidaCurrency(208), caption: "lazer" },
        ],
        paragraphs: [
          "As seis categorias variáveis fecharam a semana dentro do limite proporcional. É a terceira semana consecutiva assim, o que sugere que os tetos definidos estão calibrados para a sua realidade — nem apertados demais, nem frouxos.",
          "Mercado acumula a maior folga (R$ 640). Se o padrão se repetir, o teto pode ser reduzido em R$ 200 e a diferença ir para a Reserva, sem mudança de comportamento.",
          "Lazer é a categoria com menor folga e a mais volátil do mês. Não é problema — é a natureza da categoria —, mas é a que mais se beneficia de acompanhamento semanal.",
        ],
        nextStep:
          "Reduza o teto de mercado de R$ 2.000 para R$ 1.800 e realoque a diferença para a Reserva. O histórico das últimas seis semanas sustenta o corte.",
      },
    },
    credit_cards: {
      label: "Cartões",
      color: "#9B5DE5",
      daily: {
        severity: "ok",
        readMin: 3,
        title: "Fatura fechando 18% abaixo do mês passado",
        summary:
          "A fatura em aberto está em R$ 1.840, contra R$ 2.240 no mesmo ponto do mês anterior. O limite usado é de 12%, e não há parcelamento ativo.",
        highlights: [
          { label: "Fatura em aberto", value: formatFluidaCurrency(1840), caption: "fecha dia 28" },
          { label: "Limite usado", value: "12%", caption: "R$ 1.840 / R$ 15.000" },
          { label: "Compras ontem", value: formatFluidaCurrency(84.3), caption: "mercado" },
        ],
        paragraphs: [
          "A fatura que fecha dia 28 está em R$ 1.840 — 18% abaixo do mesmo ponto do mês passado. O uso de limite, em 12%, mantém folga confortável para qualquer imprevisto.",
          "Não há compras parceladas em aberto, o que significa que a fatura do mês que vem começa do zero. É a situação mais saudável possível para o crédito: ele funciona como meio de pagamento, não como dívida.",
        ],
        nextStep:
          "Nada a corrigir aqui. Vale manter o débito automático da fatura para eliminar o risco de esquecimento no vencimento.",
      },
      weekly: {
        severity: "ok",
        readMin: 4,
        title: "Cartão usado como meio de pagamento, não como crédito",
        summary:
          "R$ 496 em compras na semana, todas à vista no crédito. Nenhum parcelamento, nenhum juro, fatura integralmente coberta pela sobra do mês.",
        highlights: [
          { label: "Compras na semana", value: formatFluidaCurrency(496), caption: "6 lançamentos" },
          { label: "Parcelamentos", value: "0", caption: "nenhum ativo" },
          { label: "Cobertura da fatura", value: "121%", caption: "sobra do mês / fatura" },
        ],
        paragraphs: [
          "As seis compras da semana somam R$ 496 e foram todas à vista no crédito. Sem parcelamento, a fatura reflete exatamente o consumo do período — sem arrastar meses anteriores.",
          "A sobra do mês (R$ 2.220) cobre a fatura em aberto (R$ 1.840) com folga de 21%. Quitá-la integralmente no vencimento não compromete a Reserva nem os aportes das metas.",
          "Com 12% de limite usado, há espaço de sobra para uma emergência — que é a função do limite disponível, e não um convite a gastar.",
        ],
        nextStep:
          "Continue quitando a fatura integral no vencimento. É o que mantém o crédito barato e o limite disponível para o que ele existe: imprevisto.",
      },
    },
  },
};
