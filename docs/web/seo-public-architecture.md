# SEO Publico — Arquitetura, Keywords e Monitoramento MVP2

Issues: #847, #848, #850, #939

## Decisao

`www.auraxis.com.br` e a superficie comercial indexavel. `app.auraxis.com.br` e a superficie operacional do produto e deve evitar competir com as paginas publicas.

Essa separacao reduz ruido de SEO, mantem rotas autenticadas fora do sitemap e permite construir paginas comerciais orientadas por intencao de busca, sem transformar o app privado em landing page.

## Keywords Prioritarias

As palavras-chave foco desta rodada sao:

- controle financeiro
- financas
- insights financeiros
- planejamento financeiro
- analise financeira
- planilha de gastos
- gestao financeira
- inteligencia financeira

O objetivo e cobrir buscas relacionadas a organizacao financeira pessoal, analise do mes, ferramentas para sair de planilhas soltas e uso responsavel de IA para leitura financeira. O conteudo deve ser util e especifico; nao usamos keyword stuffing nem paginas duplicadas com sinonimos superficiais.

## Mapa De URLs

| Intencao                         | Keyword principal       | URL canonica               | H1                                                                 | CTA primario         |
| -------------------------------- | ----------------------- | -------------------------- | ------------------------------------------------------------------ | -------------------- |
| Organizar rotina financeira      | controle financeiro     | `/controle-financeiro`     | Controle financeiro com clareza para decidir melhor                | Criar conta gratuita |
| Apresentar a visao integrada     | financas                | `/financas`                | Financas pessoais em uma visao integrada e facil de revisar        | Criar conta gratuita |
| Explicar IA aplicada a rotina    | insights financeiros    | `/insights-financeiros`    | Insights financeiros para entender o que mudou e onde revisar      | Criar conta gratuita |
| Planejar objetivos               | planejamento financeiro | `/planejamento-financeiro` | Planejamento financeiro para transformar intencao em rotina        | Criar conta gratuita |
| Investigar variacoes             | analise financeira      | `/analise-financeira`      | Analise financeira pessoal para revisar decisoes com contexto      | Criar conta gratuita |
| Substituir planilhas manuais     | planilha de gastos      | `/planilha-de-gastos`      | Planilha de gastos evoluida para uma rotina mais simples           | Criar conta gratuita |
| Centralizar dominios financeiros | gestao financeira       | `/gestao-financeira`       | Gestao financeira pessoal para conectar rotina, metas e patrimonio | Criar conta gratuita |
| Posicionar leitura inteligente   | inteligencia financeira | `/inteligencia-financeira` | Inteligencia financeira para decidir com mais clareza              | Criar conta gratuita |

## Arquitetura De Conteudo

Cada landing deve conter:

- `title`, `description`, H1 e canonical unicos.
- Hero com promessa clara e CTA para cadastro.
- Bloco de beneficios que explique a intencao da keyword sem repetir texto entre paginas.
- Workflow em etapas para mostrar como o usuario aplica o Auraxis.
- FAQ visivel na pagina e espelhado em `FAQPage` JSON-LD.
- Links internos para as demais landings, `/tools` e `/register`.

## Hub Editorial `/blog`

O hub editorial complementa as landings comerciais com guias práticos e conteúdo people-first. Nesta fase, o blog usa seed estatico versionado em `app/data/blogPosts.ts`; isso evita dependência operacional de CMS antes da politica editorial estar madura e ainda permite SSG, sitemap e schema `Article`.

Rotas publicadas:

| Tipo | URL                                              | Objetivo                                                                                              |
| ---- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Hub  | `/blog`                                          | Listar guias publicados, conectar clusters comerciais e levar o usuário para cadastro ou ferramentas. |
| Post | `/blog/controle-financeiro-sem-planilha-confusa` | Explicar controle financeiro e alternativa à planilha de gastos.                                      |
| Post | `/blog/insights-financeiros-com-contexto`        | Explicar insights financeiros, consentimento e análise com contexto.                                  |
| Post | `/blog/planejamento-financeiro-mensal`           | Explicar planejamento financeiro mensal com metas e orçamento.                                        |

Regras editoriais:

- Cada post deve ter `title`, `description`, `excerpt`, `canonical`, data de publicacao, data de atualizacao e tempo de leitura.
- Cada post deve incluir pelo menos três secoes, FAQ visivel, links internos e `Article` JSON-LD.
- O conteúdo deve ser útil e específico, sem keyword stuffing e sem prometer recomendacao financeira personalizada.
- Quando o build roda como `NUXT_PUBLIC_SITE_SURFACE=app`, o blog permanece `noindex,nofollow` e fora do sitemap.

## Regras De Indexacao

- Build `NUXT_PUBLIC_SITE_SURFACE=marketing`: home, paginas legais, ferramentas publicas e landings comerciais sao SSG, indexaveis e entram no sitemap.
- Build `NUXT_PUBLIC_SITE_SURFACE=app`: home operacional, login e app privado devem permanecer `noindex,nofollow`; landings comerciais e blog ficam excluidos do sitemap.
- Rotas autenticadas continuam `ssr: false` e fora do sitemap para evitar HTML estatico de superficie privada.
- `/privacy` e `/terms` sao as rotas canonicas legais. `/privacy-policy` e `/terms-of-service` continuam como compatibilidade, com canonical apontando para as novas rotas.
- Slugs comerciais antigos (`/controle-de-financas`, `/controle-de-gastos`, `/planejador-financeiro`, `/analises-financeiras`) redirecionam para o novo cluster canonico equivalente.

## Search Console E Bing

Tokens de propriedade devem vir por variavel de ambiente, sem hardcode no repositorio:

- `NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `NUXT_PUBLIC_BING_SITE_VERIFICATION`

Checklist operacional pos-deploy:

1. Confirmar que o build comercial usa `NUXT_PUBLIC_SITE_SURFACE=marketing` e `NUXT_PUBLIC_SITE_URL=https://www.auraxis.com.br`.
2. Verificar propriedade no Google Search Console e Bing Webmaster Tools.
3. Enviar `https://www.auraxis.com.br/sitemap.xml`.
4. Validar se canonical, robots e sitemap apontam para `www`, nao para `app`.
5. Inspecionar manualmente `/controle-financeiro`, `/insights-financeiros`, `/privacy` e `/terms`.
6. Revisar erros de indexacao, redirecionamentos inesperados e paginas excluidas.

## Metricas Mensais

Registrar mensalmente:

- Impressoes organicas por keyword cluster.
- CTR por pagina.
- Posicao media por consulta.
- Paginas indexadas versus paginas enviadas no sitemap.
- Erros de canonical, robots, structured data e sitemap.
- Conversao organica para `/register`.
- Principais consultas que ainda nao possuem conteudo dedicado.

## Referencias

- [Google Search Central — SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).
- [Google Search Central — Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).
- [Google Search Central — Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview).
- [Google Search Central — FAQPage structured data](https://developers.google.com/search/docs/appearance/structured-data/faqpage).
- [Bing Webmaster Tools — Add and verify site](https://www.bing.com/webmasters/help/add-and-verify-site-12184f8b).

## Criterios De Aceite Cobertos

- Oito paginas comerciais por keyword principal.
- Hub `/blog` e posts editoriais iniciais por keyword cluster.
- URLs canonicas estaveis e sem conflito com rotas autenticadas.
- Conteudo util e especifico por intencao de busca.
- FAQ visivel e coerente com JSON-LD em landings e posts.
- Sitemap e prerender alimentados por lista tipada em `app/data/seoLandings.ts`.
- Sitemap e prerender do blog alimentados por lista tipada em `app/data/blogPosts.ts`.
- `/privacy` e `/terms` publicados como rotas canonicas legais.
- Verificacao Search Console/Bing preparada por env/config.
- Teste unitario protege slugs, metadados minimos, FAQ e links internos.

## Rollback

1. Remover os slugs comerciais de `SEO_LANDING_SLUGS`.
2. Reverter `app/pages/[seoLanding].vue` se houver mudanca de layout.
3. Remover spreads de landings em `nuxt.config.ts`.
4. Publicar novamente com `NUXT_PUBLIC_SITE_SURFACE=app` ou remover URLs do sitemap no build comercial.
5. Remover env vars de verificacao se houver conflito de propriedade.
