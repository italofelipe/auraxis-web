<script setup lang="ts">
definePageMeta({ layout: false });
</script>

<template>
  <div class="legal-shell">
    <header class="legal-header">
      <span class="legal-brand">Auraxis</span>
      <nav class="legal-nav" aria-label="Navigation">
        <NuxtLink to="/login" class="back-link">← Voltar</NuxtLink>
        <NuxtLink to="/terms-of-service" class="nav-link">Termos de Uso</NuxtLink>
      </nav>
    </header>

    <main class="legal-main">
      <article class="legal-article">
        <header class="article-header">
          <h1 class="article-title">Política de Privacidade</h1>
          <p class="article-meta">Versão 1.0.0 · Vigência: 07/03/2026</p>
          <p class="article-meta">
            Contato:
            <a href="mailto:suporte@auraxis.com.br" class="contact-link">suporte@auraxis.com.br</a>
          </p>
        </header>

        <section class="legal-section">
          <h2>1. Objetivo</h2>
          <p>
            Esta Política explica, em nível operacional mínimo, quais dados o Auraxis trata, para quais finalidades,
            com quais terceiros e por quanto tempo.
          </p>
        </section>

        <section class="legal-section">
          <h2>2. Dados tratados</h2>
          <p>O Auraxis pode tratar:</p>
          <ol>
            <li>dados cadastrais básicos, como nome, email e credenciais de acesso;</li>
            <li>dados de uso e segurança, como IP, logs técnicos, identificadores de sessão e eventos de erro;</li>
            <li>dados financeiros informados pelo próprio usuário, como receitas, despesas, metas e carteira patrimonial;</li>
            <li>dados técnicos de dispositivo e navegador necessários para funcionamento, segurança e observabilidade;</li>
            <li>dados fornecidos em suporte, inclusive contexto técnico mínimo para investigação de erro ou incidente.</li>
          </ol>
          <p>
            O Auraxis não tem como objetivo tratar categorias especiais de dados pessoais nem credenciais bancárias de
            internet banking. Se o usuário inserir esse tipo de conteúdo de forma indevida, o tratamento ocorrerá apenas
            na medida técnica necessária para armazenamento, segurança, atendimento e eventual exclusão.
          </p>
        </section>

        <section class="legal-section">
          <h2>3. Finalidades</h2>
          <p>Os dados são tratados para:</p>
          <ol>
            <li>criar e manter a conta do usuário;</li>
            <li>autenticar sessões e prevenir uso indevido;</li>
            <li>operar dashboards, relatórios e recursos financeiros do produto;</li>
            <li>monitorar disponibilidade, erros e segurança;</li>
            <li>atender solicitações de suporte e privacidade;</li>
            <li>cumprir obrigações legais ou regulatórias, quando aplicável.</li>
          </ol>
        </section>

        <section class="legal-section">
          <h2>4. Bases legais</h2>
          <p>As bases legais operacionais incluem, conforme o caso:</p>
          <ol>
            <li>execução de contrato ou de procedimentos preliminares;</li>
            <li>cumprimento de obrigação legal ou regulatória;</li>
            <li>exercício regular de direitos;</li>
            <li>legítimo interesse para segurança, prevenção a fraude e melhoria operacional;</li>
            <li>consentimento, quando vier a ser exigido para fluxos específicos.</li>
          </ol>
        </section>

        <section class="legal-section">
          <h2>5. Compartilhamento com terceiros</h2>
          <p>
            O Auraxis pode compartilhar dados com fornecedores estritamente necessários para a operação da plataforma, como:
          </p>
          <ol>
            <li>AWS, para hospedagem, storage, CDN e DNS;</li>
            <li>GitHub, para CI/CD e operação do ciclo de desenvolvimento;</li>
            <li>SonarCloud, para análise estática de código;</li>
            <li>Sentry, para observabilidade e monitoramento de erros no frontend;</li>
            <li>BRAPI, para consulta de cotações e dados de mercado.</li>
          </ol>
          <p>O compartilhamento é limitado ao necessário para cada finalidade.</p>
          <p>
            Alguns fornecedores podem operar infraestrutura ou processamento fora do Brasil. Nesses casos, o Auraxis
            busca adotar salvaguardas contratuais e operacionais compatíveis com a legislação aplicável.
          </p>
        </section>

        <section class="legal-section">
          <h2>6. Retenção</h2>
          <p>
            Os dados são mantidos pelo tempo necessário para cumprir as finalidades operacionais, legais e de segurança.
            Quando a exclusão imediata não for possível ou recomendável por obrigação legal, segurança, prevenção a fraude
            ou exercício regular de direitos, determinados registros poderão ser mantidos pelo prazo mínimo necessário.
          </p>
        </section>

        <section class="legal-section">
          <h2>7. Direitos do titular</h2>
          <p>O titular pode solicitar, nos limites da legislação aplicável:</p>
          <ol>
            <li>confirmação de tratamento;</li>
            <li>acesso;</li>
            <li>correção;</li>
            <li>exclusão, anonimização ou bloqueio quando cabível;</li>
            <li>informações sobre compartilhamento;</li>
            <li>revogação de consentimento, quando essa for a base legal aplicável.</li>
          </ol>
          <p>
            O atendimento desses pedidos pode depender de verificação razoável de identidade e da análise de viabilidade
            técnica e jurídica em cada caso.
          </p>
        </section>

        <section class="legal-section">
          <h2>8. Segurança</h2>
          <p>
            O Auraxis adota medidas técnicas e organizacionais razoáveis para proteger dados pessoais, incluindo controle
            de acesso, criptografia em trânsito quando aplicável, segregação de ambientes e observabilidade técnica.
            Nenhum ambiente é absolutamente imune a incidentes, e por isso as medidas são continuamente revisadas conforme
            risco, porte e estágio da operação.
          </p>
        </section>

        <section class="legal-section">
          <h2>9. Cookies, analytics e proteção anti-abuso</h2>
          <ol>
            <li>O produto pode usar mecanismos técnicos para sessão, segurança, observabilidade e mitigação de abuso automatizado.</li>
            <li>Caso recursos de analytics/cookies não estritamente necessários sejam ativados, a política deve ser revisada para refletir base legal e fluxo de consentimento correspondente.</li>
          </ol>
        </section>

        <section class="legal-section">
          <h2>10. Papel do usuário sobre dados inseridos</h2>
          <ol>
            <li>O usuário é responsável pela licitude, adequação e pertinência dos dados que registrar no produto.</li>
            <li>Se houver inserção de dados de terceiros, o usuário é responsável por garantir que possui base legal adequada para isso.</li>
          </ol>
        </section>

        <section class="legal-section">
          <h2>11. Contato</h2>
          <p>
            Solicitações relacionadas a privacidade e LGPD devem ser encaminhadas para
            <a href="mailto:suporte@auraxis.com.br" class="contact-link">suporte@auraxis.com.br</a>.
          </p>
        </section>

        <section class="legal-section">
          <h2>12. Alterações desta Política</h2>
          <ol>
            <li>Esta Política pode ser atualizada periodicamente.</li>
            <li>A versão vigente será identificada por número e data.</li>
          </ol>
        </section>

        <footer class="article-footer">
          <p>
            Dúvidas? Entre em contato:
            <a href="mailto:suporte@auraxis.com.br" class="contact-link">suporte@auraxis.com.br</a>
          </p>
          <p>
            <NuxtLink to="/terms-of-service" class="inline-link">Ver Termos de Uso</NuxtLink>
          </p>
        </footer>
      </article>
    </main>
  </div>
</template>

<style scoped>
.legal-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--color-neutral-50, #fafafa);
}

.legal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  border-bottom: 1px solid rgba(38, 33, 33, 0.08);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.legal-brand {
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-md);
  line-height: var(--line-height-heading-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-neutral-950);
}

.legal-nav {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.back-link {
  text-decoration: none;
  color: var(--color-neutral-700, #404040);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-height-body-sm);
  transition: color 0.15s;
}

.back-link:hover,
.back-link:focus {
  color: var(--color-brand-700, #7c5200);
  outline: none;
}

.nav-link {
  text-decoration: none;
  color: var(--color-neutral-700, #404040);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-height-body-sm);
}

.nav-link:hover,
.nav-link:focus {
  color: var(--color-brand-700, #7c5200);
  outline: none;
}

.legal-main {
  flex: 1;
  padding: var(--space-5) var(--space-3);
}

.legal-article {
  max-width: 720px;
  margin: 0 auto;
  background: #fff;
  border-radius: var(--radius-md);
  padding: var(--space-5);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.article-header {
  margin-bottom: var(--space-5);
  border-bottom: 1px solid rgba(38, 33, 33, 0.08);
  padding-bottom: var(--space-4);
}

.article-title {
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-xl);
  line-height: var(--line-height-heading-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-neutral-950);
  margin: 0 0 var(--space-2);
}

.article-meta {
  font-size: var(--font-size-body-sm);
  line-height: var(--line-height-body-sm);
  color: var(--color-neutral-600, #525252);
  margin: 0 0 var(--space-1);
}

.legal-section {
  margin-bottom: var(--space-5);
}

.legal-section h2 {
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-sm);
  line-height: var(--line-height-heading-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-900, #171717);
  margin: 0 0 var(--space-2);
}

.legal-section ol,
.legal-section p {
  font-size: var(--font-size-body-md);
  line-height: var(--line-height-body-md);
  color: var(--color-neutral-800, #262626);
  margin: 0 0 var(--space-2);
}

.legal-section ol {
  padding-left: var(--space-4);
}

.legal-section li {
  margin-bottom: var(--space-1);
}

.contact-link,
.inline-link {
  /* Dark amber #7c5200 on white → 7.4:1 contrast, WCAG 2.1 AA ✓ */
  /* Do NOT use --color-brand-600 (resolves to #ffab1a = 1.89:1 on white) */
  color: #7c5200;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.contact-link:hover,
.contact-link:focus,
.inline-link:hover,
.inline-link:focus {
  color: #5a3b00;
  outline: none;
}

.article-footer {
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid rgba(38, 33, 33, 0.08);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-height-body-sm);
  color: var(--color-neutral-600, #525252);
}

.article-footer p {
  margin: 0 0 var(--space-1);
}

@media (max-width: 768px) {
  .legal-nav {
    gap: var(--space-2);
  }

  .nav-link {
    display: none;
  }

  .legal-article {
    padding: var(--space-4) var(--space-3);
    border-radius: 0;
    box-shadow: none;
  }
}
</style>
