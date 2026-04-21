# Storybook — carta de ativação

Este documento fixa o papel do Storybook no `auraxis-web` para que a
sistematização do design system avance sem criar acoplamento prematuro.
Serve como fonte de verdade para decidir _o que entra no catálogo_ e
_em que momento_.

## Papel no repositório

- **Vitrine revisável por PR** — cada story publicada via Chromatic gera
  diff visual no pull request. Isso substitui o "me mostra em tela" informal
  por um artefato rastreável.
- **Documentação viva** dos primitivos visuais. Um componente com story é
  um contrato: props, slots, estados e tokens ficam explícitos.
- **Sandbox isolado** — autoriza iteração num primitivo sem subir o app
  inteiro ou tocar em rotas reais.
- **NÃO é** um design system completo. O Storybook hoje cataloga primitivos
  e alguns compostos curados; fluxos de produto continuam sendo revisados
  pela aplicação, não por stories.

## Critérios de entrada

Um componente só entra no catálogo quando _todos_ os itens abaixo são
verdadeiros:

1. **Reutilizado ≥ 2 lugares** (ou previsão realista nas próximas duas
   features). Componentes one-off não devem ser catalogados.
2. **Sem dependência de estado global** (Pinia, Vue Query, rota, layout)
   que não possa ser injetada via prop ou slot. Se precisar, o story
   envolve um wrapper mínimo documentando o setup.
3. **Props/slots estáveis.** Um componente em rearranjo semanal não está
   pronto para virar contrato — catalogar depois que o shape assenta.
4. **Cobertura mínima de estados:** default, loading (quando aplicável),
   empty, error, disabled/readonly (quando aplicável).
5. **Usa tokens do DS v3** (cores, tipografia, espaçamento, radii) — sem
   valores mágicos ou override inline de Naive UI theme.

## Critérios de manutenção

- **Uma story quebrando o Chromatic é bloqueador de merge** — não é warning.
  Se o diff é intencional, o revisor aprova no painel; caso contrário, ajusta.
- **Toda mudança de props/slots** de um componente catalogado atualiza a
  story correspondente no mesmo PR.
- **Remoção de componente** remove a story no mesmo commit (não deixar
  stories órfãs que não compilam).
- **`test-storybook`** (play functions + a11y) roda junto com o quality-check
  quando a story ativa `parameters.a11y.disable = false`.

## Lista de candidatos iniciais (MVP 1)

Priorizados por frequência de uso real no app e estabilidade do shape.
Componentes já com story são marcados ✅.

### UI primitives — obrigatórios

- ✅ `BaseCard`, `BaseSkeleton`
- ✅ `UiPageHeader`, `UiPageLoader`, `UiEmptyState`
- ✅ `UiMetricCard`, `UiTrendBadge`
- ✅ `UiSegmentedControl`, `UiSearchField`, `UiPasswordField`
- ✅ `UiInfoTooltip`, `UiInlineError`
- ✅ `UiIcon`, `UiImage`
- ✅ `UiSurfaceCard`, `UiGlassPanel`, `UiStickySummaryCard`

### UI primitives — gap a fechar

- `UiFormField` — primitivo de campo com label/helper/erro, ausente do
  catálogo apesar de ser o wrapper mais reutilizado nos formulários.
- `UiListPanel` — lista com header, empty state e paginador leve.
- `FeatureErrorBoundary` — bordão de erro por feature; crítico para
  documentar fallback esperado.

### Shell/layout

- ✅ `UiTopbar`, `UiSidebarNav`, `UiSidebarNavItem`, `UiAppShell`
- ✅ `UiPublicHeader`, `UiPublicFooter`
- ✅ `UiToolsShell` (shell das calculadoras públicas)

### Compostos curados (entram caso a caso)

- ✅ `FinancialCalendar`
- ✅ `QuestionnaireStepCard`, `QuestionnaireResult`
- ✅ `UiChart`, `UiChartPanel` (wrappers sobre ECharts com tokens aplicados)
- ✅ `UiWizardProgress`

## Fora de escopo

- **Páginas inteiras** (dashboard, portfolio, goals) — ficam só no app.
  Testar fluxo é Playwright, não Storybook.
- **Componentes de ferramenta específicos** (ex.: `InssIrFolhaForm`) — a
  own-ness pertence à feature. Entram no catálogo apenas se forem
  reaproveitados em ≥ 2 ferramentas.
- **Componentes Naive UI nativos** (NInput, NButton) — documentação oficial
  do Naive cobre; nós só catalogamos nossos wrappers.

## Próximos passos

1. Fechar os três gaps listados acima (UiFormField, UiListPanel,
   FeatureErrorBoundary) antes de iniciar novas features visuais de
   MVP 2.
2. Validar a publicação do domínio customizado `v1.design-system.auraxis.com.br`
   (ver `docs/chromatic.md` — checklist de rollout).
3. Adotar a tag de autodocs (`tags: ["autodocs"]`) nas stories novas para
   gerar automaticamente página de API por componente.

## Referências

- Configuração do Storybook: `.storybook/main.ts`, `.storybook/preview.ts`
- Publicação Chromatic: `.github/workflows/chromatic.yml`
- Operação de visual review: `docs/chromatic.md`
- Tokens DS v3: `app/assets/styles/tokens/**`
- Issue tracker: WEB-DS-01 / #166
