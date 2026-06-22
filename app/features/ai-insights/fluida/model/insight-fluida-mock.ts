import { formatFluidaCurrency, type FluidaInsightSource } from "./insight-fluida";

/**
 * Mock source for the Fluida reading, content-anchored to June/2026 data.
 *
 * Shape mirrors the additive `/ai/insights` response (`paragraphs` / `retro` /
 * `series` / `highlights`) and the mobile `InsightFluidaVM`. It exists only so
 * the screen renders behind the `web.insights.fluida` flag while the backend
 * (auraxis-api PR #1502) is not yet deployed. Once the DTO ships, a mapper in
 * `api/` produces the same {@link FluidaInsightSource} from the real payload and
 * this constant is dropped.
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
      values: [1200, 0, 250, 0, 2650, 0, 11950],
      labels: ["14", "15", "16", "17", "18", "19", "20"],
    },
    weekly: {
      values: [4200, 980, 3100, 1400, 9800, 13650],
      labels: ["S-5", "S-4", "S-3", "S-2", "S-1", "Atual"],
    },
  },
  general: {
    daily: {
      severity: "atencao",
      readMin: 15,
      title: "Ontem em foco: muita saída, nenhuma entrada",
      summary:
        "No dia 20/06 você teve uma única transação — Mousepad bullpad, R$ 156,30 — mas ela chega num mês já tensionado: as despesas somam R$ 19.906,30 contra R$ 27.675,37 de receita, e a maior parte do gasto está concentrada em poucos dias.",
      retro: [
        {
          when: "Ontem · 20 jun",
          value: -156.3,
          text: "Apenas 1 lançamento (Mousepad bullpad). Dia leve, mas dentro de uma sequência de saídas altas.",
        },
        {
          when: "Anteontem · 19 jun",
          value: -11950,
          text: "O dia mais pesado do mês: Fatura Maio (R$ 11.000) atrasada + Pagamento Ikaro (R$ 950).",
        },
        {
          when: "vs. semana passada",
          value: 9800,
          text: "A semana atual gastou ~40% a mais que a anterior, puxada pela fatura em atraso.",
        },
      ],
      paragraphs: [
        "A leitura de ontem precisa ser feita no contexto da semana. Isoladamente, o dia 20 foi tranquilo: um único gasto de R$ 156,30 em eletrônicos, sem impacto relevante sobre o saldo. O ponto de atenção não é o que aconteceu ontem, e sim o que ainda está pendente.",
        "A \"Fatura Maio\", de R$ 11.000,00, segue marcada como atrasada e responde sozinha por 55% de todas as despesas do mês. Enquanto ela não for quitada, qualquer leitura de saldo positivo é otimista demais — o resultado de R$ 7.769,07 já considera essa saída como ocorrida.",
        "Do lado das entradas, o mês depende de um único evento: o Salário gringo, de R$ 27.675,37, previsto para 30/06. Até lá, o caixa opera no vermelho corrente em vários dias. Essa dependência de uma entrada única, no fim do mês, é o fator estrutural mais importante a observar.",
      ],
      pullStat: {
        label: "Peso da Fatura Maio",
        value: "55%",
        caption: "de todas as despesas do mês",
      },
      alerts: [
        { severity: "alta", text: "Fatura Maio (R$ 11.000) em atraso — concentra 55% das despesas." },
        { severity: "media", text: "Receita do mês depende de um único crédito (30/06)." },
      ],
      nextStep:
        "Priorize quitar ou renegociar a Fatura Maio antes do crédito do salário; ela distorce todos os indicadores. Como hábito, distribua os vencimentos ao longo do mês para não concentrar saídas em 1–2 dias.",
    },
    weekly: {
      severity: "alerta",
      readMin: 30,
      title: "A semana de 15 a 21: o mês inteiro decidido em dois dias",
      summary:
        "Em sete dias, R$ 13.650,00 saíram do caixa sem nenhuma entrada — e dois lançamentos (Fatura Maio e Parcela de financiamento) explicam quase tudo. A conta entrou em estado de alerta não por volume de transações, mas por concentração.",
      retro: [
        {
          when: "Esta semana · 15–21 jun",
          value: -13650,
          text: "4 saídas, 0 entradas. Saldo da semana fortemente negativo.",
        },
        {
          when: "Semana anterior · 8–14 jun",
          value: -1450,
          text: "Internet + Visita Pedro. Ritmo de gasto saudável.",
        },
        {
          when: "Tendência (6 semanas)",
          value: 13650,
          text: "Clara escalada nas últimas duas semanas, acima da média móvel.",
        },
      ],
      paragraphs: [
        "A retrospectiva semanal mostra um padrão que não aparece no dia a dia: a conta passa semanas em ritmo controlado e, então, concentra obrigações grandes num intervalo curto. De 15 a 21 de junho, quatro lançamentos somaram R$ 13.650,00, contra R$ 1.450,00 da semana anterior — um salto de mais de 9x.",
        "Dois itens dominam a semana. A Parcela de financiamento (R$ 2.650, recorrente) é previsível e saudável — entra todo mês. Já a Fatura Maio (R$ 11.000, atrasada) é o evento anômalo: não é recorrente, está em atraso e desequilibra a comparação com qualquer semana típica.",
        "Sem nenhuma receita na semana, o saldo semanal ficou em -R$ 13.650,00. Isso não significa que o mês fechará negativo — o salário de 30/06 reverte o número — mas evidencia uma fragilidade de fluxo: a conta vive de um único crédito mensal e precisa atravessar três semanas de saídas antes dele.",
        "Olhando as últimas seis semanas, a média móvel de saídas estava perto de R$ 4.000. As duas últimas romperam esse teto com folga. Mesmo descontando a fatura atrasada como evento único, a tendência recente é de aceleração de gastos fixos.",
      ],
      pullStat: {
        label: "Saldo da semana",
        value: formatFluidaCurrency(-13650),
        caption: "sem nenhuma entrada registrada",
      },
      alerts: [
        { severity: "alta", text: "Saldo semanal -R$ 13.650,00, sem nenhuma entrada." },
        { severity: "alta", text: "Fatura Maio em atraso há mais de 20 dias." },
        { severity: "media", text: "Saídas das 2 últimas semanas acima da média móvel." },
      ],
      nextStep:
        "Construa um colchão que cubra ao menos 3 semanas de despesas fixas, para deixar de depender do timing do salário. No curto prazo, trate a Fatura Maio como prioridade absoluta e evite novas parcelas até o crédito de 30/06.",
    },
  },
  themes: {
    transactions: {
      label: "Transações",
      color: "#2E7CF6",
      daily: {
        severity: "ok",
        readMin: 3,
        title: "Dia leve, mas dentro de um mês concentrado",
        summary:
          "Ontem houve só Mousepad bullpad (R$ 156,30, Eletrônicos). No mês, 9 despesas e 1 receita; 70% do valor está em 2 lançamentos.",
        highlights: [
          { label: "Maior gasto do mês", value: formatFluidaCurrency(11000), caption: "Fatura Maio · Cartão" },
          { label: "Único crédito", value: formatFluidaCurrency(27675.37), caption: "Salário gringo · 30/06" },
          { label: "Gasto de ontem", value: formatFluidaCurrency(156.3), caption: "Eletrônicos" },
        ],
        paragraphs: [
          "O lançamento de ontem é pequeno e pontual — um mousepad em Eletrônicos. Não altera categorias nem orçamento de forma material; entra como consumo discricionário isolado.",
          "O retrato do mês, porém, é de concentração: das nove despesas, Fatura Maio (R$ 11.000) e Parcela de financiamento (R$ 2.650) somam 69% do total. As outras sete dividem o restante em valores pequenos a médios.",
        ],
        nextStep:
          "Categorize a Fatura Maio (hoje em \"Cartão\") para que ela não distorça a leitura de despesas correntes. Vale separar o que é dívida pontual do que é gasto do mês.",
      },
      weekly: {
        severity: "atencao",
        readMin: 5,
        title: "Onde o dinheiro foi: 4 saídas, nenhuma entrada",
        summary:
          "Na semana, R$ 13.650,00 distribuídos entre Cartão (R$ 11.000), Financiamento (R$ 2.650) e itens menores. Categorias fixas dominam; nenhuma receita registrada.",
        highlights: [
          { label: "Saídas da semana", value: formatFluidaCurrency(13650), caption: "4 lançamentos" },
          { label: "Em despesas fixas", value: "81%", caption: "Financiamento + recorrentes" },
          { label: "Atrasados", value: "3 itens", caption: "Fatura, Condomínio, Banho" },
        ],
        paragraphs: [
          "A semana é quase inteiramente composta por compromissos fixos e dívidas. A Fatura Maio responde por 81% do valor; a Parcela de financiamento, recorrente, por mais 19%. Não há gasto variável relevante — sinal de que o problema é de calendário e dívida, não de consumo impulsivo.",
          "Três itens aparecem como atrasados no mês (Fatura Maio, Condomínio, Banho do Caramelo), somando R$ 12.700. Mesmo os dois menores, juntos, indicam que vencimentos do início do mês passaram sem baixa — vale checar se foram pagos fora do app.",
          "Pelas descrições, parte das saídas tem natureza combinada e previsível (\"Pagamento Ikaro — 3x na semana\", \"Banho do Caramelo — 2 banhos ao mês\"). Transformar esses combinados em recorrências ajuda a antecipá-los no fluxo.",
        ],
        nextStep:
          "Revise os 3 itens em atraso e dê baixa no que já foi pago. Depois, converta os gastos \"combinados\" recorrentes (Ikaro, Caramelo) em lançamentos automáticos para o mês prever melhor o caixa.",
      },
    },
    goals: {
      label: "Metas",
      color: "#11A36B",
      daily: {
        severity: "ok",
        readMin: 3,
        title: "Metas paradas aguardando o crédito do mês",
        summary:
          "Nenhum aporte ontem. \"Viagem dos sonhos\" segue em 56% (R$ 8.450 / R$ 15.000) e a Reserva de emergência em 67%.",
        highlights: [
          { label: "Viagem dos sonhos", value: "56%", caption: "R$ 8.450 / R$ 15.000" },
          { label: "Reserva de emergência", value: "67%", caption: "R$ 13.423 / R$ 20.000" },
          { label: "Aporte de ontem", value: formatFluidaCurrency(0), caption: "sem movimento" },
        ],
        paragraphs: [
          "As metas não tiveram movimentação ontem — comportamento esperado num mês em que o caixa está comprometido com a fatura em atraso. O progresso permanece o mesmo do dia anterior.",
          "A Reserva de emergência, em 67%, é o ponto positivo: cobre boa parte de um mês de despesas. Avançá-la antes da Viagem reduz a dependência do salário único que aparece na leitura geral.",
        ],
        nextStep:
          "Assim que o salário entrar (30/06), direcione um aporte automático pequeno e fixo para a Reserva antes de qualquer gasto discricionário — ela é a meta que mais reduz seu risco hoje.",
      },
      weekly: {
        severity: "atencao",
        readMin: 5,
        title: "Sem aportes na semana — ritmo abaixo do necessário",
        summary:
          "Semana sem contribuições para metas. No ritmo atual, a Viagem dos sonhos atrasa frente ao prazo; a Reserva avança devagar.",
        highlights: [
          { label: "Aportes na semana", value: formatFluidaCurrency(0), caption: "0 de 2 metas" },
          { label: "Falta p/ Viagem", value: formatFluidaCurrency(6550), caption: "44% restante" },
          { label: "Falta p/ Reserva", value: formatFluidaCurrency(6577), caption: "33% restante" },
        ],
        paragraphs: [
          "A semana não registrou aportes — coerente com o aperto de caixa, mas que cobra um custo: as duas metas ficaram estacionadas enquanto o tempo até os prazos diminui. Metas sem aporte semanal tendem a derrapar silenciosamente.",
          "A Viagem dos sonhos precisa de mais R$ 6.550. Mantido um aporte mensal modesto, o prazo escorrega alguns meses. A Reserva, mais perto do alvo (faltam R$ 6.577 para R$ 20.000), responde melhor a aportes pequenos e constantes.",
          "A recomendação estrutural da leitura geral se aplica aqui: enquanto a conta depender de um único crédito mensal, as metas competem diretamente com as dívidas pelo mesmo dinheiro — e perdem.",
        ],
        nextStep:
          "Defina aportes automáticos por porcentagem do salário (ex.: 5% Reserva, 5% Viagem) que saem no dia do crédito. Automatizar tira a meta da disputa mês a mês e protege o progresso.",
      },
    },
    budgets: {
      label: "Orçamentos",
      color: "#FF8A3D",
      daily: {
        severity: "ok",
        readMin: 3,
        title: "Eletrônicos consumiu um pouco do limite livre",
        summary:
          "O gasto de ontem (R$ 156,30) cai em Eletrônicos, fora dos orçamentos fixos. Categorias fixas seguem dentro do previsto.",
        highlights: [
          { label: "Despesa fixa", value: "50% do total", caption: formatFluidaCurrency(15550) },
          { label: "Sem categoria", value: formatFluidaCurrency(15325.08), caption: "a classificar" },
          { label: "Livre usado ontem", value: formatFluidaCurrency(156.3), caption: "Eletrônicos" },
        ],
        paragraphs: [
          "O lançamento de ontem é discricionário e pequeno, sem estourar nenhum teto. O alerta de orçamento não está no consumo do dia, e sim na qualidade da classificação: quase metade das saídas do mês está como \"Sem categoria\".",
          "Com tanto valor não classificado, qualquer orçamento por categoria fica cego. Antes de apertar limites, o passo mais útil é categorizar — sobretudo a Fatura Maio, que infla \"Cartão/Sem categoria\".",
        ],
        nextStep:
          "Classifique os lançamentos sem categoria do mês (R$ 15.325). Só depois os limites por categoria passam a refletir a realidade e os alertas ficam confiáveis.",
      },
      weekly: {
        severity: "atencao",
        readMin: 5,
        title: "Metade do mês sem categoria — orçamento às cegas",
        summary:
          "Despesa fixa concentra 50% (R$ 15.550). \"Sem categoria\" tem outros R$ 15.325, o que impede orçamentos confiáveis por área.",
        highlights: [
          { label: "Despesa fixa", value: formatFluidaCurrency(15550), caption: "50% do total" },
          { label: "Sem categoria", value: formatFluidaCurrency(15325.08), caption: "49% do total" },
          { label: "Demais", value: formatFluidaCurrency(175), caption: "Cartão" },
        ],
        paragraphs: [
          "A foto da semana confirma o diagnóstico do dia: o orçamento está dominado por dois blocos enormes — Despesa fixa (R$ 15.550) e Sem categoria (R$ 15.325). Juntos, são 99% das saídas, o que esvazia qualquer planejamento por categoria.",
          "O bloco \"Sem categoria\" é grande porque a Fatura Maio entra nele. Classificar essa fatura e distribuí-la entre as áreas que a originaram (moradia, lazer, assinaturas) revelaria o consumo real por trás do número.",
          "Despesa fixa em 50% é alto, mas não anômalo para quem tem financiamento e contas recorrentes. O problema é não enxergar a outra metade. Orçamento só vira ferramenta quando cada real tem um destino nomeado.",
        ],
        nextStep:
          "Crie a regra: nenhuma transação fica sem categoria por mais de 48h. Comece pela Fatura Maio, quebrando-a nas categorias de origem — o orçamento por área passa a fazer sentido na hora.",
      },
    },
    credit_cards: {
      label: "Cartões",
      color: "#9B5DE5",
      daily: {
        severity: "atencao",
        readMin: 3,
        title: "A fatura em atraso domina a leitura de cartão",
        summary:
          "Nenhuma compra no crédito ontem. O destaque é a Fatura Maio (R$ 11.000) ainda em aberto — pressão direta sobre limite e juros.",
        highlights: [
          { label: "Fatura em atraso", value: formatFluidaCurrency(11000), caption: "Maio · Inter" },
          { label: "Limite usado (Inter)", value: "44%", caption: "R$ 11.000 / R$ 25.000" },
          { label: "Compras ontem", value: formatFluidaCurrency(0), caption: "sem uso do crédito" },
        ],
        paragraphs: [
          "Não houve uso de cartão ontem, o que é positivo. A leitura de cartões hoje gira inteiramente em torno de uma fatura vencida: a de maio, R$ 11.000, que mantém 44% do limite do Inter ocupado e tende a gerar encargos a cada dia de atraso.",
          "Enquanto essa fatura não baixa, o cartão opera com folga de limite reduzida e custo crescente. É o item de maior alavancagem negativa da conta inteira neste momento.",
        ],
        nextStep:
          "Quite ou parcele a Fatura Maio com a IA antes do próximo fechamento. Cada dia de atraso converte dívida barata em cara — é o melhor \"retorno\" disponível hoje.",
      },
      weekly: {
        severity: "alerta",
        readMin: 5,
        title: "Cartão: dívida parada custando dinheiro",
        summary:
          "Na semana, o cartão não foi usado para novas compras, mas a Fatura Maio (R$ 11.000) seguiu em atraso — o maior fator de risco da conta.",
        highlights: [
          { label: "Fatura Maio", value: formatFluidaCurrency(11000), caption: "em atraso" },
          { label: "% das despesas do mês", value: "55%", caption: "um único item" },
          { label: "Novas compras", value: formatFluidaCurrency(0), caption: "na semana" },
        ],
        paragraphs: [
          "A boa notícia da semana: você não adicionou novas compras ao crédito. A má: a dívida existente não andou. A Fatura Maio, sozinha, é 55% de todas as despesas do mês e mantém o limite do Inter comprometido.",
          "Sem novas compras, o problema deixa de ser comportamental e passa a ser financeiro puro — é uma questão de liquidez e timing. O salário de 30/06 cobre a fatura com folga; a decisão é se vale esperar (acumulando juros) ou antecipar com a reserva.",
          "Os outros cartões (Mercado Pago, Nubank, Unique) estão zerados no mês, então não há fragmentação de dívida — o foco é único e claro, o que facilita o plano.",
        ],
        nextStep:
          "Compare o custo de atraso da fatura com o rendimento da Reserva. Se o juro do atraso superar o rendimento (quase sempre supera), antecipe a quitação parcial agora e recomponha a reserva com o salário.",
      },
    },
  },
};
