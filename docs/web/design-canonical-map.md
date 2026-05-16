# Web Design Canonical Map

Atualizado: 2026-05-16

## Regra canônica

Os protótipos em `/Users/italochagas/Desktop/projetos/auraxis-platform/designs/web/*.html`
com linguagem visual azul/ciano "Market Pulse" são a fonte de verdade para a paridade
visual Web. Protótipos em tons dourado, amarelo, marrom ou espresso são legado e não
devem ser usados como alvo de implementação, exceto se uma issue pedir explicitamente
a criação de uma versão azul/ciano substituta.

Este mapa existe para evitar que próximas issues usem arquivos com nome correto mas
conteúdo trocado. Quando houver conflito, o conteúdo real do HTML vence o nome do
arquivo.

## Evidências visuais catalogadas

As evidências iniciais da auditoria estão anexadas na issue canônica:

- Core surfaces: https://gist.githubusercontent.com/italofelipe/f5be01f413a0836e98d8502dea3dd7f4/raw/sheet_01_core.png
- Tools surfaces: https://gist.githubusercontent.com/italofelipe/f5be01f413a0836e98d8502dea3dd7f4/raw/sheet_02_tools.png
- Missing or misnamed: https://gist.githubusercontent.com/italofelipe/f5be01f413a0836e98d8502dea3dd7f4/raw/sheet_03_missing.png

## Superfícies principais

| Rota/app surface    | Protótipo canônico                 | Status                  | Observação                                                                                      |
| ------------------- | ---------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| `/`                 | `landing_page.html`                | Canônico                | Landing pública revamp com foundation compartilhada.                                            |
| `/login`            | `login_page.html`                  | Canônico                | Usa `_revamp_foundation.css`; manter copy e painel simples.                                     |
| `/register`         | `signup_page.html`                 | Canônico                | Usa `_revamp_foundation.css`; manter auth shell.                                                |
| `/forgot-password`  | `financial_goals_page.html`        | Misnamed canonical      | O arquivo se chama metas, mas o conteúdo é recuperação de senha.                                |
| `/dashboard`        | `dashboard_page.html`              | Canônico                | Dashboard Market Pulse. `forgot_password_page.html` é duplicado/misnamed do dashboard.          |
| `/goals`            | `investments_wallet_page.html`     | Misnamed canonical      | O conteúdo real é Metas Financeiras. `tools_home_page.html` duplica esta superfície.            |
| `/portfolio`        | `tools_net_salary_calculator.html` | Misnamed canonical      | O conteúdo real é Carteira de Investimentos; inclui acentos de alerta sem abandonar azul/ciano. |
| `/investor-profile` | Nenhum                             | Sem canônico azul/ciano | `investor_questionnaire_page.html` é legado dourado/marrom e não deve guiar implementação.      |
| `/about`            | `about_us_page.html`               | Canônico                | `platform_changelog.html` duplica o conteúdo de Sobre Nós.                                      |
| `/changelog`        | Nenhum                             | Ausente                 | `platform_changelog.html` não é changelog real; tratar em issue própria.                        |

## Ferramentas públicas

| Rota/app surface               | Protótipo canônico                        | Status                  | Observação                                                               |
| ------------------------------ | ----------------------------------------- | ----------------------- | ------------------------------------------------------------------------ |
| `/tools`                       | Nenhum                                    | Ausente                 | `tools_home_page.html` é Metas Financeiras, não catálogo de ferramentas. |
| `/tools/ferias`                | `tools_fgts_calculator_page.html`         | Misnamed canonical      | O conteúdo real é Cálculo de Férias.                                     |
| `/tools/fgts`                  | `tools_detailed_quarter_result_page.html` | Misnamed canonical      | O conteúdo real é Calculadora de Evolução FGTS.                          |
| `/tools/rescisao`              | `tools_13th_salary_calculator_page.html`  | Misnamed canonical      | O conteúdo real é Simulador de Rescisão.                                 |
| `/tools/hora-extra`            | `tools_recission_calculator_page.html`    | Misnamed canonical      | O conteúdo real é Calculadora de Hora Extra.                             |
| `/tools/salario-liquido`       | `tools_overtime_calculator_page.html`     | Misnamed canonical      | O conteúdo real é Calculadora de Salário.                                |
| `/tools/thirteenth-salary`     | `tools_vacation_calculator_page.html`     | Misnamed canonical      | O conteúdo real é 13th Salary Calculator.                                |
| `/tools/dividir-conta`         | Nenhum                                    | Sem canônico            | Nenhum HTML azul/ciano dedicado encontrado.                              |
| `/tools/installment-vs-cash`   | Nenhum                                    | Sem canônico            | `tools_installment_vs_cash_page.html` é Resultado Trimestral Detalhado.  |
| Resultado trimestral detalhado | `tools_installment_vs_cash_page.html`     | Canônico sem rota clara | Mapear antes de implementar; não usar para parcelado vs à vista.         |

## Arquivos legados, duplicados ou fora de escopo

| Arquivo                                      | Classificação      | Motivo                                                                                           |
| -------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| `investor_questionnaire_page.html`           | Legado             | Paleta dourado/marrom, tipografia serifada e comentário pedindo substituição por tokens visuais. |
| `forgot_password_page.html`                  | Duplicado/misnamed | Conteúdo real é dashboard Market Pulse.                                                          |
| `tools_home_page.html`                       | Duplicado/misnamed | Conteúdo real é Metas Financeiras.                                                               |
| `platform_changelog.html`                    | Duplicado/misnamed | Conteúdo real é Sobre Nós.                                                                       |
| `tools_restaurant_bill_calculator_page.html` | Duplicado/misnamed | Conteúdo real é Calculadora de Salário.                                                          |

## Ordem de execução das issues de paridade

1. `auraxis-web#821` — manter este mapa como fonte operacional antes de iniciar novas telas.
2. `auraxis-web#824` — Perfil do investidor: criar/implementar versão azul/ciano; não usar o protótipo dourado.
3. `auraxis-web#825` — Calculadoras trabalhistas: alinhar Férias, FGTS, Rescisão, Hora Extra, Salário Líquido e 13º usando os arquivos misnamed acima.
4. `auraxis-web#826` — Lacunas de rotas/designs: catálogo de ferramentas, changelog, installment-vs-cash, dividir conta e demais rotas sem HTML canônico.

## Checklist obrigatório para novas issues de paridade

- Confirmar que o HTML usado consta como `Canônico` ou `Misnamed canonical` neste mapa.
- Se o HTML estiver `Ausente`, abrir primeiro uma tarefa de design/canonização.
- Anexar screenshots `app as-is` e `design target` na issue ou no PR.
- Citar o arquivo HTML canônico no corpo da issue e do PR.
- Não implementar visual com base em arquivos classificados como `Legado`, `Duplicado/misnamed` ou `Sem canônico`.
