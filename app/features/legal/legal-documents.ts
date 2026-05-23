export interface LegalTable {
  columns: string[];
  rows: string[][];
}

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  items?: string[];
  table?: LegalTable;
}

export interface LegalNavLink {
  label: string;
  to: string;
}

export interface LegalDocument {
  title: string;
  versionLabel: string;
  updatedAtLabel: string;
  contactEmail: string;
  navLinks: LegalNavLink[];
  sections: LegalSection[];
  footerLinks: LegalNavLink[];
}

const supportEmail = "suporte@auraxis.com.br";

export const privacyPolicyDocument: LegalDocument = {
  title: "Política de Privacidade",
  versionLabel: "Versão 2.1.0",
  updatedAtLabel: "Atualizado em 2026-05-20",
  contactEmail: supportEmail,
  navLinks: [
    { label: "Termos de Uso", to: "/terms" },
    { label: "Política de Cookies", to: "/cookies" },
  ],
  sections: [
    {
      title: "1. Objetivo",
      paragraphs: [
        "Esta Política explica como o Auraxis trata dados pessoais para operar uma plataforma de organização financeira pessoal, incluindo dashboards, transações, metas, carteira, simulações, notificações, suporte, segurança, cookies e insights com IA.",
      ],
    },
    {
      title: "2. Dados tratados",
      paragraphs: [
        "O Auraxis pode tratar:",
        "O Auraxis pode tratar dados cadastrais, sessão e segurança, dados financeiros inseridos pelo usuário, assinatura, suporte, observabilidade, cookies/analytics consentidos e dados processados para insights com IA.",
        "O Auraxis não tem como objetivo coletar categorias especiais de dados pessoais, credenciais bancárias de internet banking ou documentos sensíveis fora do escopo do produto.",
      ],
      items: [
        "dados cadastrais, como nome, email, senha em formato protegido, preferências e estado de verificação;",
        "dados de sessão e segurança, como tokens, identificadores de sessão, IP, user-agent, eventos de autenticação, rate limit e sinais anti-abuso;",
        "dados financeiros inseridos pelo usuário, como receitas, despesas, categorias, contas, cartões, orçamentos, metas, contribuições, carteira, ativos, operações, simulações e alertas;",
        "dados de assinatura e cobrança, como plano, status, ciclo, provider, período vigente e entitlements;",
        "dados de suporte, incluindo mensagens enviadas pelo usuário e contexto técnico mínimo para atendimento;",
        "dados de observabilidade, como erros, métricas técnicas, rotas e eventos de performance, com minimização e scrubber de PII;",
        "dados de cookies e analytics não essenciais somente quando houver consentimento aplicável;",
        "dados processados para insights com IA, limitados ao necessário para gerar análises financeiras e explicações no produto.",
      ],
    },
    {
      title: "3. Finalidades",
      paragraphs: ["Os dados são tratados para:"],
      items: [
        "criar, autenticar e manter a conta do usuário;",
        "operar recursos financeiros do produto;",
        "gerar relatórios, simulações, alertas e insights;",
        "processar assinatura, plano e acesso a funcionalidades premium;",
        "prevenir fraude, abuso, acesso indevido e incidentes de segurança;",
        "prestar suporte e atender solicitações de privacidade;",
        "monitorar estabilidade, performance e erros;",
        "cumprir obrigações legais, regulatórias ou exercício regular de direitos;",
        "medir uso e melhorar experiência, quando houver base legal ou consentimento aplicável.",
      ],
    },
    {
      title: "4. Bases legais",
      paragraphs: ["As bases legais podem incluir, conforme o caso:"],
      items: [
        "execução de contrato ou procedimentos preliminares;",
        "cumprimento de obrigação legal ou regulatória;",
        "exercício regular de direitos;",
        "legítimo interesse para segurança, prevenção a fraude e melhoria operacional;",
        "consentimento para cookies/analytics não essenciais, marketing e fluxos específicos.",
      ],
    },
    {
      title: "5. Uso de IA e não treinamento",
      items: [
        "o Auraxis não usa dados do usuário para treinar modelos próprios;",
        "o Auraxis não autoriza uso de dados do usuário para treinar modelos de terceiros;",
        "prompts devem enviar apenas o mínimo necessário para a finalidade do insight;",
        "resultados de IA são informativos e não constituem recomendação financeira, jurídica, contábil, tributária ou de investimento;",
        "quando houver provedor externo de IA, o tratamento pode envolver transferência internacional e controles contratuais aplicáveis.",
      ],
      paragraphs: [
        "O Auraxis pode usar provedores de IA para gerar insights financeiros a partir dos dados do usuário, quando o recurso for solicitado ou fizer parte do funcionamento contratado.",
      ],
    },
    {
      title: "6. Cookies e analytics",
      paragraphs: [
        "Cookies essenciais de sessão, segurança e funcionamento podem ser usados para prestar o serviço. Cookies e tecnologias não essenciais, como analytics e marketing, devem respeitar a Política de Cookies vigente e o consentimento granular do usuário.",
        "O usuário deve poder aceitar, rejeitar ou configurar categorias não essenciais, além de revogar consentimento posteriormente.",
      ],
    },
    {
      title: "7. Compartilhamento e subprocessadores",
      paragraphs: [
        "O Auraxis pode compartilhar dados com fornecedores necessários à operação, como hospedagem, observabilidade, analytics, IA, cobrança, email, suporte, CI/CD e dados de mercado.",
        "O compartilhamento deve seguir minimização, finalidade específica, controles de acesso e registro na matriz de subprocessadores.",
        "Subprocessadores ativos:",
      ],
      items: [
        "AWS — hospedagem, storage, CDN, DNS;",
        "Sentry — observabilidade de erros frontend/backend, com scrubber de PII;",
        "GitHub — CI/CD, gerenciamento de código e issues;",
        "SonarCloud — análise estática de qualidade;",
        "BRAPI — cotações e dados de mercado;",
        "PostHog Cloud — analytics de produto, eventos minimizados, sob consentimento;",
        "OpenAI — geração de insights financeiros com IA (apenas para usuários que utilizam o recurso, com dados minimizados);",
        "Asaas — processamento de cobrança recorrente do plano Premium (compartilhados: nome, email, CPF ou CNPJ, valor, plano contratado);",
        "Resend — envio de emails transacionais (cadastro, recibos, lembretes).",
      ],
    },
    {
      title: "7.1 Dados financeiros não armazenados pelo Auraxis",
      paragraphs: [
        "O Auraxis NÃO armazena número de cartão de crédito, CVV, senha de cartão ou qualquer credencial bancária. O processamento desses dados ocorre exclusivamente no provedor de pagamento (Asaas) durante o checkout hospedado.",
        "O Auraxis armazena apenas: identificador de assinatura, identificador de transação, status (active/canceled/past_due), histórico de cobranças com valor e data, plano vigente e período de validade.",
        "Detalhes específicos do tratamento por Asaas: https://www.asaas.com/politica-de-privacidade.",
      ],
    },
    {
      title: "8. Transferência internacional",
      paragraphs: [
        "Alguns fornecedores podem processar dados fora do Brasil. Nesses casos, o Auraxis deve buscar mecanismos contratuais e operacionais compatíveis com a LGPD e orientações da ANPD.",
      ],
    },
    {
      title: "9. Retenção e descarte",
      paragraphs: [
        "Dados são mantidos pelo tempo necessário às finalidades descritas, enquanto a conta estiver ativa ou conforme prazos documentados na Política de Retenção.",
        "Ao solicitar exclusão, dados de produto devem ser removidos ou anonimizados, salvo retenções mínimas necessárias por obrigação legal, segurança, prevenção a fraude, auditoria ou exercício regular de direitos.",
      ],
    },
    {
      title: "10. Direitos do titular",
      paragraphs: [
        "O titular pode solicitar confirmação de tratamento, acesso, correção, portabilidade, anonimização, bloqueio ou eliminação, informações sobre compartilhamento, revisão de decisões automatizadas quando aplicável, revogação de consentimento e eliminação de dados tratados com base em consentimento, observadas exceções legais.",
        "Pedidos devem ser encaminhados para suporte@auraxis.com.br ou pela central de privacidade quando disponível.",
      ],
    },
    {
      title: "11. Segurança",
      paragraphs: [
        "O Auraxis adota medidas técnicas e organizacionais proporcionais ao porte e risco, incluindo controle de acesso, criptografia em trânsito, proteção de sessão, logs de segurança, rate limit, minimização, segregação de ambientes e observabilidade com scrubber de dados sensíveis.",
      ],
    },
    {
      title: "12. Incidentes",
      paragraphs: [
        "Em caso de incidente relevante de segurança envolvendo dados pessoais, o Auraxis seguirá runbook interno de triagem, contenção, investigação, documentação e comunicação quando exigido pela legislação aplicável.",
      ],
    },
    {
      title: "13. Alterações",
      paragraphs: [
        "Esta Política pode ser atualizada para refletir mudanças no produto, fornecedores, bases legais ou requisitos regulatórios. A versão vigente deve estar identificada por número e data.",
      ],
    },
  ],
  footerLinks: [
    { label: "Ver Termos de Uso", to: "/terms" },
    { label: "Ver Política de Cookies", to: "/cookies" },
  ],
};

export const termsOfUseDocument: LegalDocument = {
  title: "Termos de Uso",
  versionLabel: "Versão 2.1.0",
  updatedAtLabel: "Atualizado em 2026-05-20",
  contactEmail: supportEmail,
  navLinks: [
    { label: "Política de Privacidade", to: "/privacy" },
    { label: "Política de Cookies", to: "/cookies" },
  ],
  sections: [
    {
      title: "1. Quem pode usar",
      paragraphs: [
        "O Auraxis é destinado a pessoas maiores de 18 anos, com capacidade civil para contratar e operar seus próprios dados financeiros.",
      ],
    },
    {
      title: "2. O que o Auraxis oferece",
      paragraphs: [
        "O Auraxis oferece ferramentas de organização financeira pessoal, acompanhamento de receitas, despesas, metas, orçamento, carteira patrimonial, simulações, alertas e insights.",
        "O Auraxis não é instituição financeira, consultoria de investimento, escritório contábil, escritório jurídico ou substituto de orientação profissional individualizada.",
      ],
    },
    {
      title: "3. Conta e credenciais",
      paragraphs: [
        "O usuário deve manter dados de cadastro corretos, proteger credenciais e comunicar uso indevido. O Auraxis pode suspender contas com indício de fraude, abuso, automação maliciosa ou violação destes Termos.",
      ],
    },
    {
      title: "4. Aceite e vigência",
      paragraphs: [
        "Ao criar conta, acessar o produto ou continuar usando o Auraxis após aviso de atualização, o usuário declara ciência e aceite destes Termos, da Política de Privacidade e da Política de Cookies aplicáveis.",
      ],
    },
    {
      title: "5. Dados inseridos pelo usuário",
      paragraphs: ["O usuário é responsável por:"],
      items: [
        "licitude, qualidade e pertinência dos dados inseridos;",
        "não inserir dados de terceiros sem base legal adequada;",
        "não inserir credenciais bancárias ou categorias especiais de dados fora do escopo natural da aplicação;",
        "revisar informações antes de tomar decisões financeiras.",
      ],
    },
    {
      title: "6. Insights com IA",
      paragraphs: [
        "Recursos de IA podem interpretar dados financeiros informados pelo usuário para gerar análises, alertas, padrões e sugestões de organização.",
        "Esses resultados são informativos, podem conter imprecisões, não constituem recomendação de investimento, garantia de resultado, consultoria financeira, jurídica, contábil ou tributária, e devem ser avaliados pelo usuário antes de qualquer decisão.",
        "O Auraxis não usa dados do usuário para treinar modelos e não autoriza provedores de IA a treinarem modelos com esses dados fora das permissões contratadas.",
      ],
    },
    {
      title: "7. Uso permitido",
      paragraphs: [
        "O usuário pode usar o serviço para organizar suas finanças, criar registros, simular cenários, acompanhar metas, consultar relatórios, exportar dados e solicitar exclusão dentro das funcionalidades disponíveis.",
      ],
    },
    {
      title: "8. Uso proibido",
      items: [
        "fraudar, burlar segurança, rate limit ou autenticação;",
        "realizar scraping abusivo ou automação não autorizada;",
        "tentar engenharia reversa indevida;",
        "degradar deliberadamente a infraestrutura;",
        "usar o produto para armazenar conteúdo ilícito, credenciais bancárias ou dados de terceiros sem base legal.",
      ],
    },
    {
      title: "9. Planos, preços e cobrança",
      paragraphs: [
        "O Auraxis oferece um plano gratuito (Free) e planos pagos (Premium) com funcionalidades adicionais. Os preços vigentes do Premium são:",
      ],
      items: [
        "Premium Mensal — R$ 29,90 por mês, renovação automática até cancelamento;",
        "Premium Anual — R$ 287,04 por ano (equivalente a R$ 23,92/mês, 20% de desconto), renovação automática até cancelamento;",
        "Trial — 7 dias de acesso Premium gratuito após o primeiro cadastro elegível, conforme disponibilidade do produto.",
      ],
    },
    {
      title: "9.1 Processamento de pagamento",
      paragraphs: [
        "O processamento de cobrança é realizado pela Asaas, provedor de pagamento brasileiro regulado. O Auraxis não armazena dados de cartão de crédito. Tributos eventualmente aplicáveis seguem a legislação vigente.",
        "Preços podem ser alterados mediante aviso prévio razoável e atualização desta seção. Renovações em andamento permanecem com o preço vigente no momento da contratação até o término do ciclo.",
      ],
    },
    {
      title: "9.2 Cancelamento e direito de arrependimento (CDC art. 49)",
      items: [
        "O usuário pode cancelar a assinatura Premium a qualquer momento pela área de configurações ou pelo canal oficial de suporte.",
        "Após cancelamento, o acesso Premium permanece ativo até o final do período já pago. Não há cobrança no próximo ciclo.",
        "Direito de arrependimento: o usuário tem 7 dias corridos contados da primeira contratação para desistir do plano pago e receber reembolso integral, conforme art. 49 do Código de Defesa do Consumidor. O pedido deve ser enviado para suporte@auraxis.com.br dentro desse prazo.",
        "Após 7 dias da primeira contratação, não há reembolso parcial proporcional ao período não utilizado, salvo nas hipóteses previstas em lei.",
      ],
    },
    {
      title: "9.3 Falha de pagamento, reembolso e disputas",
      items: [
        "Em caso de falha na cobrança automática (cartão expirado, saldo insuficiente, etc.), o provedor de pagamento pode tentar a cobrança novamente conforme regras próprias.",
        "Após confirmação de falha definitiva, o usuário será notificado por email e poderá atualizar o método de pagamento ou cancelar o plano. Durante o período de carência (3 dias), o acesso Premium continua ativo.",
        "Após a carência sem regularização, o plano é rebaixado para Free e funcionalidades Premium ficam indisponíveis. Os dados do usuário permanecem preservados.",
        "Para disputas envolvendo cobranças, o usuário deve entrar em contato pelo canal oficial de suporte. O Auraxis colabora com a Asaas para investigação e resolução conforme normas do setor.",
      ],
    },
    {
      title: "10. Privacidade, cookies e LGPD",
      paragraphs: [
        "O tratamento de dados pessoais segue a Política de Privacidade, a Política de Cookies e os consentimentos registrados quando aplicáveis. O usuário pode solicitar acesso, correção, exportação, exclusão e revogação de consentimentos pelos canais oficiais.",
      ],
    },
    {
      title: "11. Disponibilidade",
      paragraphs: [
        "O serviço pode passar por manutenção, indisponibilidade temporária, ajustes técnicos e evolução funcional. O Auraxis emprega esforços razoáveis para estabilidade, mas não garante operação ininterrupta.",
      ],
    },
    {
      title: "12. Limitação de responsabilidade",
      paragraphs: [
        "Na máxima extensão permitida em lei, o Auraxis não responde por decisões tomadas exclusivamente com base em simulações, cálculos, relatórios ou insights gerados pelo produto. Nada nestes Termos exclui responsabilidade que não possa ser legalmente afastada.",
      ],
    },
    {
      title: "13. Alterações",
      paragraphs: [
        "Estes Termos podem ser atualizados para refletir mudanças no produto, requisitos legais, fornecedores ou modelo de negócio. A versão vigente deve indicar número e data.",
      ],
    },
    {
      title: "14. Foro e lei aplicável",
      paragraphs: [
        "Estes Termos são regidos pelas leis da República Federativa do Brasil, observadas normas de defesa do consumidor quando aplicáveis.",
      ],
    },
  ],
  footerLinks: [
    { label: "Ver Política de Privacidade", to: "/privacy" },
    { label: "Ver Política de Cookies", to: "/cookies" },
  ],
};

export const cookiesPolicyDocument: LegalDocument = {
  title: "Política de Cookies",
  versionLabel: "Versão 1.0.0-draft",
  updatedAtLabel: "Atualizado em 2026-05-16",
  contactEmail: supportEmail,
  navLinks: [
    { label: "Política de Privacidade", to: "/privacy" },
    { label: "Termos de Uso", to: "/terms" },
  ],
  sections: [
    {
      title: "1. Objetivo",
      paragraphs: [
        "Explicar como o Auraxis usa cookies e tecnologias semelhantes, incluindo armazenamento local, identificadores de sessão, analytics, observabilidade e preferências.",
      ],
    },
    {
      title: "2. Categorias",
      table: {
        columns: ["Categoria", "Obrigatório", "Exemplos", "Finalidade"],
        rows: [
          [
            "Essenciais",
            "Sim",
            "sessão, refresh token httpOnly, segurança, CSRF quando aplicável",
            "autenticação, segurança e funcionamento",
          ],
          [
            "Preferências",
            "Não",
            "idioma, tema, preferências de UI",
            "lembrar escolhas do usuário",
          ],
          [
            "Analytics",
            "Não",
            "PostHog, eventos de produto, métricas agregadas",
            "entender uso e melhorar experiência",
          ],
          [
            "Observabilidade",
            "Parcial",
            "Sentry, web vitals, erros técnicos",
            "estabilidade, segurança e diagnóstico",
          ],
          ["Marketing", "Não", "campanhas, atribuição, pixels", "medir campanhas e aquisição"],
        ],
      },
    },
    {
      title: "3. Consentimento",
      paragraphs: [
        "Cookies essenciais podem operar por serem necessários à prestação do serviço. Categorias não essenciais devem depender de escolha livre, informada e granular quando exigido.",
        "O usuário deve poder aceitar todos os cookies não essenciais, rejeitar todos os cookies não essenciais, configurar categorias individualmente e revogar consentimento posteriormente.",
      ],
    },
    {
      title: "4. Bloqueio antes do consentimento",
      paragraphs: [
        "Scripts de analytics e marketing não devem ser carregados antes do consentimento correspondente. Eventos enfileirados antes do consentimento devem ser descartados ou enviados apenas após autorização explícita, conforme decisão técnica documentada.",
      ],
    },
    {
      title: "5. Revogação",
      paragraphs: [
        "A central de preferências deve permitir alterar escolhas a qualquer momento. A revogação deve impedir novos eventos não essenciais e, quando tecnicamente viável, limpar identificadores locais não essenciais.",
      ],
    },
    {
      title: "6. Cookies de terceiros",
      paragraphs: [
        "Fornecedores podem operar infraestrutura fora do Brasil. O Auraxis deve registrar subprocessadores e links de políticas dos fornecedores na matriz de dados.",
      ],
    },
    {
      title: "7. Mudanças",
      paragraphs: [
        "Novas ferramentas de tracking, marketing, analytics ou experimentação exigem revisão desta política antes de produção.",
      ],
    },
  ],
  footerLinks: [
    { label: "Ver Política de Privacidade", to: "/privacy" },
    { label: "Ver Termos de Uso", to: "/terms" },
  ],
};
