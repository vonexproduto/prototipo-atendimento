# De-Para React → Angular · CCM Atendimentos

Guia de conversão do **protótipo React** (`melhoria atendimento 2/`) para o
**codebase Angular** `ngx-ccm`. O objetivo é que um dev de front-end — ou uma
IA assistindo a conversão — consiga recriar cada tela do protótipo no Angular
**reaproveitando os componentes, cores, fontes e tokens que já existem** no
`ngx-ccm`, em vez de inventar nomes novos.

> **Regra de ouro:** o protótipo é a fonte de *layout/comportamento*; o
> `ngx-ccm` é a fonte de *nomenclatura* (componentes, seletores, variáveis de
> cor, classes utilitárias). Quando os dois divergirem, **o nome vem do Angular**.

---

## Como usar este guia

1. Comece por **[`02-componentes.md`](02-componentes.md)**: para cada arquivo
   `.jsx` do protótipo, ele lista o(s) componente(s) Angular equivalente(s)
   (classe, seletor `<...>`, caminho do arquivo e módulo).
2. Para cores/tipografia/espaçamento, use **[`01-design-tokens.md`](01-design-tokens.md)**:
   tabela hex → variável CSS do Angular + classe utilitária + arquivo SCSS de origem.
3. Para convenções (estrutura de módulo, nomes de arquivo, canais, ícones, etc.),
   use **[`03-convencoes-angular.md`](03-convencoes-angular.md)**.
4. Dentro do código React, cada arquivo tem um **banner de cabeçalho
   "DE-PARA REACT → ANGULAR"** com o mapeamento específico daquele arquivo, e o
   `src/tokens.js` anota **cada cor** com a variável Angular correspondente.

---

## Os dois codebases

| | Protótipo (origem) | Angular (destino) |
|---|---|---|
| Caminho | `…/CCM/melhoria atendimento 2/` | `…/Claude-Figma/ngx-ccm-master/ngx-ccm-master/` |
| Stack | HTML + React 18 (UMD) + Babel standalone, sem build | Angular + Angular Material + DevExtreme |
| Estilo | inline styles (`window.CCM.c`) + `design-system/colors_and_type.css` | SCSS por componente + tema global em `src/app/@theme` |
| Estado | mocks em `src/data.js` | services/state-managers + WebSocket + repositórios |

O protótipo cobre o domínio **"Atendimentos e Conversas"**, que no Angular vive
em **`src/app/@modules/chat-one-to-one`** (orquestração das telas) e
**`src/app/@modules/chat`** (motor de mensagens/composer). Rotas: `/conversas`
e `/atendimentos`.

---

## Mapa rápido (tela → Angular)

| Tela do protótipo (arquivo React) | Componente Angular principal | Seletor |
|---|---|---|
| App shell (`CCM Atendimentos.html`) | `AppComponent` + `ChatOneToOneComponent` | `<app-chat-one-to-one>` |
| Topo (`Header.jsx`) | `HeaderComponent` (@core) | `<app-header>` |
| Config. do chat (`SettingsMenu.jsx`) | `ChatSettingsModalComponent` | `<app-chat-settings-modal>` |
| Sidebar de filas (`QueueSidebar.jsx`) | `TicketsDashSidebarComponent` | `<app-tickets-dash-sidebar>` |
| Tabela de atendimentos (`AtendimentosList.jsx`) | `TicketsDashTableComponent` | `<app-tickets-dash-table>` |
| Detalhe/olhinho (`AtendimentoDetail.jsx`) | `ChatTicketsDashboardComponent` | `<app-chat-tickets-dashboard>` |
| Painel da conversa (`ConversaPanel.jsx`) | `ChatComponent` + `ChatCoreComponent` | `<app-chat>` / `<app-chat-core>` |
| Composer multicanal (em `ConversaPanel.jsx`) | `ChatInputRouterComponent` | `<app-chat-input-router>` |
| Histórico do contato (`ContatoHistoricoPeek.jsx`) | `ChatContactJourneyComponent` | `<app-chat-contact-journey>` |
| Jornadas (`JornadasView.jsx`) | `ChatAutomationAnswersComponent` | `<app-chat-automation-answers>` |
| Dashboard/relatórios (`DashboardView.jsx`) | `ChatDashboardComponent` | `<app-chat-dashboard>` |

Detalhes (sub-componentes, modais, popovers, props) em
[`02-componentes.md`](02-componentes.md).

---

## ⚠️ Três armadilhas que mais atrapalham a geração por IA

1. **Nomes de cor "off-by-one".** Os nomes curtos do protótipo NÃO batem com a
   semântica do Angular. Mapeie **por valor (hex)**, não por nome:
   - `c.dangerPure` (#f54336) → `--feedback-color-warning-pure`
   - `c.warningPure` (#f99f18) → `--feedback-color-helper-pure`
   - `c.helperPure` (#dd2e77) → `--highlight-color-pure`
   - `c.successPure` (#4eaf51) → `--feedback-color-success-medium`
   Tabela completa em [`01-design-tokens.md`](01-design-tokens.md).
2. **Grafia `secundary`** (sem o segundo "a"). É assim no Angular
   (`--brand-color-secundary-*`, `.color-secondary-*` nas classes). Preserve.
3. **Ícones.** O protótipo usa Phosphor (`ph-*`). O `ngx-ccm` tem o próprio set;
   não copie os nomes `ph-*` — peça o equivalente ao time de front.

---

## Arquivos deste guia

- [`01-design-tokens.md`](01-design-tokens.md) — cores, tipografia, espaçamento, radius, sombras, layout.
- [`02-componentes.md`](02-componentes.md) — mapeamento componente a componente.
- [`03-convencoes-angular.md`](03-convencoes-angular.md) — estrutura de módulo, nomes, canais, como montar.
