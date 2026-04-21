# Tools structured data (schema.org)

Guia operacional para expor dados estruturados (JSON-LD) nas páginas de ferramentas.
O objetivo é gerar **rich results** no Google (FAQ accordion, breadcrumb e
ficha de aplicação financeira) para melhorar CTR vs concorrência.

## Pattern

Cada tool page é uma combinação de três schemas:

1. **`WebApplication`** — ficha da calculadora (`FinanceApplication`, grátis, web).
2. **`FAQPage`** — 3–5 perguntas frequentes (gera accordion rich result).
3. **`BreadcrumbList`** — trilha `Início → Ferramentas → <Tool>`.

## Arquivos-chave

| Camada                             | Caminho                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| Tipos schema.org                   | `app/features/tools/model/structured-data.types.ts`                                   |
| Builder puro                       | `app/features/tools/composables/useToolStructuredData.ts` (`buildToolStructuredData`) |
| Composable Nuxt (injeta `useHead`) | `app/features/tools/composables/useToolStructuredData.ts` (`useToolStructuredData`)   |
| Façade por página                  | `app/features/tools/composables/useToolPageStructuredData.ts`                         |
| Componente wrapper (opcional)      | `app/components/tool/ToolStructuredData.vue`                                          |
| FAQs por tool                      | `app/features/tools/content/<slug>-faqs.ts`                                           |

## Integração em uma tool page

Dentro de `<script setup>` da página `app/pages/tools/<slug>.vue`:

```ts
import { useToolPageStructuredData } from "~/features/tools/composables/useToolPageStructuredData";
import { SLUG_FAQS } from "~/features/tools/content/<slug>-faqs";

const { t } = useI18n();

useSeoMeta({
  /* título, descrição e OG habituais */
});

useToolPageStructuredData({
  slug: "<slug>",
  name: t("<tool>.seo.title"),
  description: t("<tool>.seo.description"),
  faqs: SLUG_FAQS,
});
```

A façade resolve canonical URL (com locale), monta `BreadcrumbList`
(`Início → Ferramentas → <tool>`) e injeta os três payloads via `useHead`.

## Adicionando FAQs para uma nova tool

1. Criar `app/features/tools/content/<slug>-faqs.ts` exportando um array `ToolFaqEntry[]`.
2. Manter **3–5 perguntas** naturais, com respostas de 2–3 frases em linguagem clara.
3. Evitar jargão técnico e HTML complexo (texto simples funciona melhor como rich result).
4. Importar no tool page e passar para `useToolPageStructuredData({ faqs })`.

## Validação

Antes de mergear, rodar o [Google Rich Results Test](https://search.google.com/test/rich-results)
para pelo menos uma tool e anexar o print no PR:

1. `pnpm build && pnpm preview`
2. Expor via tunnel (ngrok) ou deploy preview
3. Colar a URL no Rich Results Test e conferir `WebApplication`, `FAQPage`, `BreadcrumbList`.

## Tools-piloto (cobertas hoje)

- `juros-compostos`, `fgts`, `hora-extra`, `ferias`, `rescisao`, `clt-vs-pj`

As demais tools da catálogo já herdam `WebApplication` + `BreadcrumbList`
quando chamarem `useToolPageStructuredData`; só precisam criar o arquivo
de FAQs para ganhar `FAQPage`.
