<script setup lang="ts">
definePageMeta({ layout: false });
</script>

<template>
  <div class="legal-shell">
    <header class="legal-header">
      <span class="legal-brand">Auraxis</span>
      <nav class="legal-nav" aria-label="Navegação">
        <NuxtLink to="/login" class="back-link">← Voltar</NuxtLink>
        <NuxtLink to="/privacidade" class="nav-link">Política de Privacidade</NuxtLink>
      </nav>
    </header>

    <main class="legal-main">
      <article class="legal-article">
        <header class="article-header">
          <h1 class="article-title">Termos de Uso</h1>
          <p class="article-meta">Versão 1.0.0 · Vigência: 07/03/2026</p>
          <p class="article-meta">
            Contato:
            <a href="mailto:suporte@auraxis.com.br" class="contact-link">suporte@auraxis.com.br</a>
          </p>
        </header>

        <section class="legal-section">
          <h2>1. Quem pode usar</h2>
          <ol>
            <li>O Auraxis é destinado a pessoas maiores de 18 anos com capacidade civil para contratar.</li>
            <li>O uso do serviço depende de cadastro válido e aceite destes Termos.</li>
          </ol>
        </section>

        <section class="legal-section">
          <h2>2. O que o Auraxis oferece</h2>
          <ol>
            <li>O Auraxis oferece ferramentas de organização financeira pessoal, acompanhamento de receitas, despesas, metas e carteira patrimonial.</li>
            <li>O Auraxis não presta consultoria financeira individualizada, recomendação de investimento nem garantia de rentabilidade.</li>
            <li>O Auraxis não intermedeia instituições financeiras, não executa ordens de investimento e não substitui orientação profissional jurídica, contábil, tributária ou financeira.</li>
          </ol>
        </section>

        <section class="legal-section">
          <h2>3. Conta e credenciais</h2>
          <ol>
            <li>O usuário é responsável por manter a confidencialidade de suas credenciais.</li>
            <li>O usuário deve informar dados verdadeiros e atualizados.</li>
            <li>O Auraxis pode suspender ou encerrar contas com indício de fraude, abuso, automação maliciosa ou uso em desacordo com estes Termos.</li>
            <li>O usuário é responsável por toda atividade realizada a partir de sua conta até comunicação de uso indevido pelos canais oficiais.</li>
          </ol>
        </section>

        <section class="legal-section">
          <h2>4. Uso permitido</h2>
          <p>O usuário pode:</p>
          <ol>
            <li>registrar seus dados financeiros pessoais;</li>
            <li>usar as ferramentas e relatórios disponibilizados pelo produto;</li>
            <li>solicitar suporte pelos canais oficiais;</li>
            <li>exportar ou excluir seus dados dentro das capacidades técnicas disponibilizadas pelo produto ou por solicitação formal.</li>
          </ol>
        </section>

        <section class="legal-section">
          <h2>5. Uso proibido</h2>
          <p>É proibido:</p>
          <ol>
            <li>usar o serviço para fraude, spam, scraping abusivo ou distribuição de conteúdo malicioso;</li>
            <li>tentar contornar mecanismos de segurança, rate limit, anti-bot ou autenticação;</li>
            <li>enviar dados sabidamente falsos, ilícitos ou de terceiros sem base legal adequada;</li>
            <li>explorar falhas, engenharia reversa indevida ou degradar deliberadamente a infraestrutura;</li>
            <li>utilizar o produto para armazenar categorias especiais de dados pessoais ou dados sigilosos de terceiros fora do escopo natural da aplicação.</li>
          </ol>
        </section>

        <section class="legal-section">
          <h2>6. Disponibilidade e alterações</h2>
          <ol>
            <li>O serviço pode passar por manutenção, indisponibilidade temporária, ajustes técnicos e evolução de funcionalidades.</li>
            <li>O Auraxis pode alterar, suspender ou descontinuar partes do serviço, com atualização deste documento quando aplicável.</li>
            <li>O usuário é responsável por manter cópia própria de informações que considere críticas, especialmente antes de exclusões ou alterações relevantes no serviço.</li>
          </ol>
        </section>

        <section class="legal-section">
          <h2>7. Limitação de responsabilidade</h2>
          <ol>
            <li>O Auraxis é fornecido no estado em que se encontra, com esforço razoável de disponibilidade e segurança.</li>
            <li>O Auraxis não se responsabiliza por decisões financeiras tomadas com base exclusiva nas informações da plataforma.</li>
            <li>Na máxima extensão permitida em lei, o Auraxis não responde por danos indiretos, lucros cessantes ou perdas decorrentes de indisponibilidade temporária, falha de terceiros ou uso inadequado da conta.</li>
            <li>Nada nestes Termos exclui responsabilidade que não possa ser legalmente afastada pela legislação brasileira.</li>
          </ol>
        </section>

        <section class="legal-section">
          <h2>8. Privacidade e dados pessoais</h2>
          <ol>
            <li>O tratamento de dados pessoais segue a <NuxtLink to="/privacidade" class="inline-link">Política de Privacidade v1</NuxtLink>.</li>
            <li>Ao usar o serviço, o usuário declara ciência de que seus dados serão tratados para operar a plataforma, autenticar acessos, gerar relatórios e manter segurança operacional.</li>
            <li>Caso o usuário registre dados de terceiros no produto, declara ser responsável por possuir base legal adequada para isso e por não utilizar o serviço em desconformidade com a legislação aplicável.</li>
          </ol>
        </section>

        <section class="legal-section">
          <h2>9. Suporte e solicitações</h2>
          <ol>
            <li>O canal oficial de suporte e privacidade é <a href="mailto:suporte@auraxis.com.br" class="contact-link">suporte@auraxis.com.br</a>.</li>
            <li>Solicitações relacionadas a dados pessoais, acesso, correção ou exclusão devem ser encaminhadas por esse canal.</li>
            <li>O atendimento de solicitações pode depender de verificação razoável de identidade e da preservação de registros necessários para cumprimento legal, segurança e exercício regular de direitos.</li>
          </ol>
        </section>

        <section class="legal-section">
          <h2>10. Alterações destes Termos</h2>
          <ol>
            <li>Estes Termos podem ser atualizados para refletir mudanças no serviço, requisitos legais ou ajustes operacionais.</li>
            <li>A versão vigente será identificada por número e data de vigência.</li>
          </ol>
        </section>

        <section class="legal-section">
          <h2>11. Lei aplicável</h2>
          <ol>
            <li>Estes Termos são regidos pelas leis da República Federativa do Brasil.</li>
          </ol>
        </section>

        <section class="legal-section">
          <h2>12. Foro</h2>
          <ol>
            <li>Fica eleito o foro da comarca do domicílio do usuário ou outro foro competente nos termos da legislação aplicável, observadas as normas de defesa do consumidor quando incidirem.</li>
          </ol>
        </section>

        <section class="legal-section">
          <h2>13. Aceite</h2>
          <ol>
            <li>O uso do Auraxis após a disponibilização destes Termos constitui aceite da versão vigente.</li>
          </ol>
        </section>

        <footer class="article-footer">
          <p>
            Dúvidas? Entre em contato:
            <a href="mailto:suporte@auraxis.com.br" class="contact-link">suporte@auraxis.com.br</a>
          </p>
          <p>
            <NuxtLink to="/privacidade" class="inline-link">Ver Política de Privacidade</NuxtLink>
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
  color: var(--color-neutral-700);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-height-body-sm);
  transition: color 0.15s;
}

.back-link:hover,
.back-link:focus {
  color: var(--color-brand-600);
  outline: none;
}

.nav-link {
  text-decoration: none;
  color: var(--color-neutral-700);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-height-body-sm);
}

.nav-link:hover,
.nav-link:focus {
  color: var(--color-brand-600);
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
  color: var(--color-neutral-600);
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
  color: var(--color-neutral-900);
  margin: 0 0 var(--space-2);
}

.legal-section ol,
.legal-section p {
  font-size: var(--font-size-body-md);
  line-height: var(--line-height-body-md);
  color: var(--color-neutral-800);
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
  color: var(--color-brand-600);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.contact-link:hover,
.contact-link:focus,
.inline-link:hover,
.inline-link:focus {
  color: var(--color-brand-700);
  outline: none;
}

.article-footer {
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: 1px solid rgba(38, 33, 33, 0.08);
  font-size: var(--font-size-body-sm);
  line-height: var(--line-height-body-sm);
  color: var(--color-neutral-600);
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
