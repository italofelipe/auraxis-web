# SEO Público — Arquitetura, Keywords e Landings MVP2

Issues: #847, #848

## Decisão

`www.auraxis.com.br` é a superfície comercial indexável. `app.auraxis.com.br` é a superfície operacional do produto e deve evitar competir com as páginas públicas.

Essa separação reduz ruído de SEO, mantém páginas autenticadas fora do sitemap e permite criar conteúdo comercial com intenção clara de busca sem transformar o app em landing page.

## Mapa de URLs

| Intenção                         | Keyword principal     | URL canônica             | H1                                                        | CTA primário         |
| -------------------------------- | --------------------- | ------------------------ | --------------------------------------------------------- | -------------------- |
| Organizar rotina financeira      | controle de finanças  | `/controle-de-financas`  | Controle de finanças com clareza para decidir melhor      | Criar conta gratuita |
| Centralizar domínios financeiros | gestão financeira     | `/gestao-financeira`     | Gestão financeira pessoal sem perder o contexto           | Criar conta gratuita |
| Planejar objetivos e cenários    | planejador financeiro | `/planejador-financeiro` | Planejador financeiro para transformar intenção em rotina | Criar conta gratuita |
| Entender padrões e sinais        | análises financeiras  | `/analises-financeiras`  | Análises financeiras explicáveis para revisar melhor      | Criar conta gratuita |
| Revisar despesas                 | controle de gastos    | `/controle-de-gastos`    | Controle de gastos para enxergar excessos antes do susto  | Criar conta gratuita |

## Regras de Indexação

- Build `NUXT_PUBLIC_SITE_SURFACE=marketing`: home e landings comerciais são indexáveis, SSG e entram no sitemap.
- Build `NUXT_PUBLIC_SITE_SURFACE=app`: home operacional recebe `noindex,nofollow`; landings comerciais ficam excluídas do sitemap.
- Rotas autenticadas continuam `ssr: false` e fora do sitemap para evitar HTML estático com superfície privada.
- Cada landing define `title`, `description`, canonical, `WebPage` JSON-LD e `FAQPage` com perguntas visíveis na página.

## Links Internos

Cada landing aponta para:

- `/register` como CTA principal;
- `/tools` como apoio de descoberta pública;
- as demais páginas comerciais relacionadas;
- a home pública via header.

O header público inclui entrada para `Soluções`, apontando para `/controle-de-financas`, que por sua vez distribui links para todas as outras landings.

## Critérios De Aceite Cobertos

- Cinco páginas comerciais por keyword principal.
- URLs canônicas estáveis e sem conflito com rotas autenticadas.
- Conteúdo útil e específico por intenção de busca.
- FAQ visível e coerente com JSON-LD.
- Sitemap e prerender alimentados por uma lista tipada em `app/data/seoLandings.ts`.
- Teste unitário protege slugs, metadados mínimos, FAQ e links internos.

## Rollback

1. Remover os slugs comerciais de `SEO_LANDING_SLUGS`.
2. Reverter `app/pages/[seoLanding].vue`.
3. Remover spreads de landings em `nuxt.config.ts`.
4. Publicar novamente com `NUXT_PUBLIC_SITE_SURFACE=app` ou remover as URLs do sitemap no build comercial.
