# WEB-DESIGN-05 — Decisoes de rotas canonicas

Issue: https://github.com/italofelipe/auraxis-web/issues/826

O canone visual para MVP1 continua sendo o conjunto azul/ciano Market Pulse. Arquivos HTML com paleta amarela/marrom ou conteudo que nao corresponde ao nome da rota nao devem ser usados como fonte de implementacao ate serem renomeados, refeitos ou formalmente aprovados.

## Decisoes

| Rota                             | Arquivo de design avaliado                   | Decisao                                          | Motivo                                                                                                                  |
| -------------------------------- | -------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `/about-us`                      | `about_us_page.html`                         | Implementada                                     | O HTML possui canone azul/ciano coerente para a pagina Sobre Nos.                                                       |
| `/tools/detailed-quarter-result` | `tools_installment_vs_cash_page.html`        | Implementada como Resultado Trimestral Detalhado | O arquivo esta nomeado como parcelado vs a vista, mas seu conteudo real e o dashboard "Resultado Trimestral Detalhado". |
| `/changelog`                     | `platform_changelog.html`                    | Fora de escopo por enquanto                      | O arquivo duplica a pagina Sobre Nos e esta sem design canonico proprio.                                                |
| `/tools`                         | `tools_home_page.html`                       | Mantida pagina atual de catalogo                 | O arquivo contem "Metas Financeiras"; nao usar para `/tools` ate existir catalogo canonico azul/ciano.                  |
| `/tools/dividir-conta`           | `tools_restaurant_bill_calculator_page.html` | Mantida pagina atual                             | O arquivo contem calculadora de salario; nao usar para `/tools/dividir-conta`.                                          |
| `/tools/installment-vs-cash`     | `tools_installment_vs_cash_page.html`        | Mantida pagina atual                             | O arquivo contem "Resultado Trimestral Detalhado"; nao usar para `/tools/installment-vs-cash`.                          |
| `/tools/fgts`                    | `tools_detailed_quarter_result_page.html`    | Mantida pagina atual                             | O arquivo contem "Calculadora de Evolucao FGTS"; nao usar para `/tools/detailed-quarter-result`.                        |

## Proximas tarefas derivadas

- Criar design canonico azul/ciano para `/tools` quando o catalogo de ferramentas entrar em nova rodada de paridade.
- Criar design canonico azul/ciano para `/tools/dividir-conta` antes de nova implementacao visual dessa rota.
- Criar design canonico azul/ciano proprio para `/changelog` ou remover a rota do escopo MVP1.
- Renomear os arquivos HTML misnomeados no repositorio de design para reduzir risco de regressao operacional.

## Evidencia esperada

Screenshots da aplicacao ficam nesta pasta ao lado deste documento:

- `about-us-desktop.png`
- `about-us-mobile.png`
- `detailed-quarter-result-desktop.png`
- `detailed-quarter-result-mobile.png`
