# 02 · Componentes — De-Para React → Angular

Mapeamento componente a componente. Para cada arquivo `.jsx` do protótipo,
o(s) componente(s) Angular equivalente(s): **classe**, **seletor** `<...>` e
**caminho** (relativo a `src/app`).

Caminhos abreviados:
- `c1o1/` = `@modules/chat-one-to-one/`
- `chat/` = `@modules/chat/`
- `shared/` = `@shared/components/`
- `core/` = `@core/components/`

> Todos os seletores abaixo foram **verificados** lendo os `@Component({selector})`
> reais do `ngx-ccm`.

---

## App shell — `CCM Atendimentos.html` (script inline)

| React | Angular | Seletor / caminho |
|---|---|---|
| `App` (root) | `AppComponent` + `RouterOutlet`; área Chat = `ChatOneToOneComponent` | `<app-chat-one-to-one>` · `c1o1/chat-one-to-one.component.ts` |
| (layout multi-drawer) | `ChatCentralDrawersComponent` | `<app-chat-central-drawers>` · `c1o1/components/chat-central-drawers/` — layout de 4 drawers gerenciado pelo `DrawerStateManager` (1º=talks 268px, 2º=folders 327px, 3º=chat auto, 4º=journey 268px) |
| `Rail` / `RailIcon` | `ChatSidebarComponent` (**standalone**) | `<app-chat-sidebar>` · `c1o1/components/chat-sidebar/` |
| `PeekOverlay` | overlay/drawer lateral (Angular CDK Overlay ou `mat-drawer`) | tema `@theme/css/material-drawer.scss` |
| `renderContent()` | troca de rota: `/atendimentos`, `/conversas`, automação, dashboard | rotas do `c1o1` + `@modules/automation` |

Rotas relevantes: `/atendimentos` (visão filas/tickets), `/conversas` (visão chats),
`/automacao` (jornadas), dashboard de chat.

---

## Topo — `Header.jsx`

| React | Angular | Seletor / caminho |
|---|---|---|
| `Header` | `HeaderComponent` | `<app-header>` · `core/header/` |
| botão "tray/inbox" | `HeaderInboxComponent` | `<app-header-inbox>` · `core/header-inbox/` |
| botão "+" (criar) | `HeaderMenuQuickCreateComponent` | `<app-header-menu-quick-create>` · `core/header-menu-quick-create/` |
| avatar "CA" | `HeaderUserProfileComponent` | `<app-header-user-profile>` · `core/header-user-profile/` |
| ajuda "?" | `HeaderFaqComponent` | `<app-header-faq>` · `core/header-faq/` |
| engrenagem → menu | família `HeaderMenu*` | `core/header-menu-card/`, `header-menu-group/` |

---

## Configurações do chat — `SettingsMenu.jsx`

| React | Angular | Seletor / caminho |
|---|---|---|
| `ChatSettingsModal` | `ChatSettingsModalComponent` | `<app-chat-settings-modal>` · `c1o1/modals/chat-settings-modal/` |
| `SettingsMenu` (dropdown) | `HeaderMenuGroupComponent` / `HeaderMenuCardComponent` | `core/header-menu-group/`, `header-menu-card/` |
| `Toggle` | `mat-slide-toggle` | tema `@theme/css/material-toggle.scss` |
| `SelectInput` | `CcmSelectListComponent` (ou `CcmMultiSelectComponent`) | `<ccm-select-list>` / `<ccm-multi-select>` · `shared/ccm-select-list/`, `ccm-multi-select/` |
| `NumberInput` | `mat-form-field` + `input[type=number]` | tema `material-form-field.scss` |
| botões Cancelar/Salvar | `ButtonComponent` | `<ccm-button>` (type `secondary` / `primary`) · `shared/button/` |

---

## Sidebar de filas — `QueueSidebar.jsx`

Visão **Atendimentos** (filas/tickets). Módulo `c1o1`.

| React | Angular | Seletor / caminho |
|---|---|---|
| `QueueSidebar` | `TicketsDashSidebarComponent` | `<app-tickets-dash-sidebar>` · `c1o1/components/tickets-dash-sidebar/` |
| `QueuesTree` / `QueueRow` | árvore de filas/operações (dados de `@modules/operation`) | dentro do `tickets-dash-sidebar` |
| `ScopeToggle` (Meus/Todos/Favoritos/SLA) | segmented no header da sidebar | `mat-button-toggle` / chips |
| `SearchPopup` + resultados | busca global; para conversas: `ChatTalksListComponent` + filtros | `<app-chat-talks-list>`, `<app-talks-list-filter-menu>`, `<app-talks-list-sort-filter>` |
| `SearchResultRow` / `ContactResultRow` | linha de resultado: `AvatarComponent` + chips | `<ccm-avatar>` + `.ccm-chips` |
| `ResizeHandle` | splitter (CDK drag / angular-split) | — |

> Visão irmã **Conversas**: `ChatSidebarComponent` `<app-chat-sidebar>` +
> `ChatFoldersListComponent` `<app-chat-folders-list>` (`c1o1/components/...`).

---

## Tabela de atendimentos — `AtendimentosList.jsx`

| React | Angular | Seletor / caminho |
|---|---|---|
| `AtendimentosList` | `TicketsDashTableComponent` | `<app-tickets-dash-table>` · `c1o1/components/tickets-dash-table/` |
| (lista/container) | `TicketsDashListComponent` | `<app-tickets-dash-list>` · `c1o1/components/tickets-dash-list/` |
| (dashboard pai) | `ChatTicketsDashboardComponent` | `<app-chat-tickets-dashboard>` · `c1o1/components/chat-tickets-dashboard/` |
| `AvatarStack` | `AvatarListComponent` | `<ccm-avatar-list [nameList] [size] [limit]>` · `shared/avatar-list/` |
| (avatar único) | `AvatarComponent` | `<ccm-avatar>` · `shared/avatar/` |
| `StatusDropdown` + pill | `ChatTicketStatusComponent` + `TicketStatusChangeComponent` | `<app-chat-ticket-status>`, `<app-ticket-status-change>` |
| `slaColor` / tag SLA | `ChatSlaIndicatorComponent` | `<app-chat-sla-indicator>` |
| `IconLabelButton`, "Novo atendimento" | `ButtonComponent` | `<ccm-button>` |
| chips de marcador | `.ccm-chips` | `@theme/css/chips.scss` |
| badges status/SLA | `.ccm-badget` | `@theme/css/badget.scss` |
| `RowActionsMenu` | `mat-menu` | tema `material-menu.scss` / `popover.scss` |
| `NovaConversaModal` | `TicketCreationModalComponent` + `ChatCreateTalkComponent` | `<app-ticket-creation-modal>`, `<app-chat-create-talk>` |
| `AtendimentoFormModal` (criar/editar) | `TicketCreationModalComponent` | `<app-ticket-creation-modal>` · `c1o1/modals/ticket-creation-modal/` |
| `FiltersPanel` (filtros avançados) | `ChatDashAdvancedFiltersModalComponent` | `<app-chat-dash-advanced-filters-modal>` |
| `MarkerSortModal` | ordenação (`talks-list-sort-filter` / `mat-menu`) | — |
| `LoadingSkeleton` | `CcmLoaderComponent` | `<ccm-loader>` · `shared/ccm-loader/` |
| `IaTransferConfirmModal` | MatDialog de confirmação | — |
| snackbar (`iaSnack`) | `FeedbackSnackbarComponent` | `<app-feedback-snackbar>` · `shared/feedback-snackbar/` |
| `KanbanView` / `GanttView` | views alternativas (sem 1:1 hoje) | CDK / lib de gantt |

> Sobre tabela: o `ngx-ccm` tem `TableComponent` `<ccm-table>` (`shared/table/`,
> baseada em Handsontable) para **grids editáveis**. Esta listagem é uma tabela de
> leitura — use `mat-table`/`<table>` estilizada (`@theme/css/table.scss`) com
> paginação `CcmTablePaginatorComponent` `<ccm-table-paginator>`.

---

## Painel da conversa — `ConversaPanel.jsx`

Módulos `c1o1` (orquestra) + `chat` (motor de mensagens).

| React | Angular | Seletor / caminho |
|---|---|---|
| `ConversaPanel` | `ChatComponent` | `<app-chat>` · `c1o1/components/chat/` |
| (wrapper layout) | `ChatOneToOneContainerComponent` | `<app-chat-one-to-one-container>` · `c1o1/components/chat-one-to-one-container/` |
| sub-header da conversa | `ChatOneToOneHeaderComponent` | `<app-chat-one-to-one-header>` · `chat/components/chat-headers/chat-one-to-one-header/` |
| área da thread | `ChatCoreComponent` | `<app-chat-core>` · `chat/components/chat-core/` |
| `MessageBubble` | `ChatMessageComponent` → `MessageTypeRouterComponent` | `<app-chat-message>`, `<app-message-type-router>` · `chat/components/chat-message/` |
| (tipos de msg) | `TextMessage` / `Image` / `Audio` / `Document` / `Video` / `Html` / `Whatsapp`-message / `Sticker` / `WhatsappInteractive` / `RcsCarousel` / `ChatNote` | `<app-text-message>`, `<app-image-message>`, `<app-audio-message>`, `<app-document-message>`, `<app-video-message>`, `<app-html-message>`, `<app-whatsapp-message>`, `<app-sticker-message>`, `<app-whatsapp-interactive-message>`, `<app-rcs-carousel-message>`, `<app-chat-note>` |
| rodapé da msg (hora/canal) | `MessageFooterComponent` | `<app-message-footer>` |
| `Composer` | `ChatInputRouterComponent` | `<app-chat-input-router>` · `chat/components/chat-input-router/` |
| `MarcadoresChipStrip` / popover | `ChatAttendanceMarkersSelectionComponent` + `ChatMarkersModalComponent` | `<app-chat-attendance-markers-selection>` · `chat/components/...`; `<app-chat-markers-modal>` · `chat/modals/chat-markers-modal/` |
| `TransferModal` / `QueuePopover` | `TicketAssignmentModalComponent` + `UserAssignmentModalComponent` | `<app-ticket-assignment-modal>`, `<app-user-assignment-modal>` · `c1o1/modals/` |
| `FinalizarConversaModal` | MatDialog de confirmação (encerrar) | — |
| `ContactInfoPopover` | popover de metadados | `.chat-metadata-popover` (`popover.scss`) |
| `DayChip` / `ToolbarBtn` | helpers visuais (chip de data / botão-ícone) | — |

### Toolbar da conversa — visibilidade condicional

Os botões de ação da toolbar (vincular, contato, finalizar) são **ocultados** quando
a aba ativa é "Contato" ou "Histórico". Apenas o título da conversa e o botão
expandir/recolher ficam visíveis nessas abas. O botão "Alterar fila / atendente"
**foi removido** desta toolbar — agora vive na barra do atendimento (ver seção
`AtendimentoDetail.jsx` abaixo).

No Angular, essa lógica condicional deve ser implementada no
`ChatOneToOneHeaderComponent` usando `*ngIf` ou `[hidden]` baseado na aba ativa.

### Composer multicanal (abas → componente por canal)

| Aba no protótipo (`Composer.channels`) | Angular | Seletor |
|---|---|---|
| WhatsApp | `ChatInputWhatsappComponent` | `<app-chat-input-whatsapp>` |
| WhatsApp Web | `ChatInputWhatsappWebComponent` | `<app-chat-input-whatsapp-web>` |
| SMS | `ChatInputSmsComponent` | `<app-chat-input-sms>` |
| E-mail | `ChatInputEmailComponent` | `<app-chat-input-email>` |
| RCS | `ChatInputRcsComponent` | `<app-chat-input-rcs>` |
| **Torpedo (voz)** | `ChatInputVoicemailComponent` | `<app-chat-input-voicemail>` |
| Nota interna | `ChatInputNoteComponent` | `<app-chat-input-note>` |

Todas em `chat/components/chat-input-router/chat-input-<canal>/`. O roteamento
de abas é responsabilidade do `ChatInputRouterComponent`.

---

## Detalhe do atendimento — `AtendimentoDetail.jsx`

| React | Angular | Seletor / caminho |
|---|---|---|
| `AtendimentoDetail` | `ChatTicketsDashboardComponent` (+ `ChatComponent` no painel direito) | `<app-chat-tickets-dashboard>` / `<app-chat>` |
| (layout container) | `ChatOneToOneContainerComponent` | `<app-chat-one-to-one-container>` |
| `TabPill` (tabs) | `SimpleTabsHeaderComponent` | `<app-simple-tabs-header>` · `shared/simple-tabs-header/` |
| `ConversasTab` / `ConvCard` | `ChatTalksListComponent` (cards de conversa) | `<app-chat-talks-list>` |
| `HistoricoTab` | `ChatSectionsHistoryComponent` | `<app-chat-sections-history>` · `c1o1/components/chat-sections-history/` |
| `ContatoTab` | painel de contatos do atendimento | — |
| `AvatarStackHeader` | `AvatarListComponent` | `<ccm-avatar-list>` |
| `PessoasPopover` / `PessoaRow` | `mat-menu` / popover | `.chat-metadata-popover` |
| `AlterarFilaModal` (Fila/Atendente) | `TicketAssignmentModalComponent` + `UserAssignmentModalComponent` | `<app-ticket-assignment-modal>`, `<app-user-assignment-modal>` |
| `MarcadoresPopover` | `ChatAttendanceMarkersSelectionComponent` | `<app-chat-attendance-markers-selection>` |
| `StatusDropdown` | `ChatTicketStatusComponent` | `<app-chat-ticket-status>` |
| `ContatoSidePanel` | `mat-drawer` (dados do contato) | `material-drawer.scss` |
| Botão "Alterar fila / atendente" (ícone `ph-clipboard-text`, 32×32) | `TicketAssignmentModalComponent` (trigger) | na barra do atendimento, **não** na barra da conversa |

> **Mudança recente:** o botão "Alterar fila / atendente" foi movido da barra da
> conversa (`ConversaPanel.jsx`) para a barra do atendimento (`AtendimentoDetail.jsx`).
> O badge amarelo da fila com SLA que existia anteriormente foi substituído por um
> botão-ícone simples (32×32, borda `c.border`, ícone `ph-clipboard-text`). No Angular,
> o trigger do `TicketAssignmentModalComponent` deve estar no header do atendimento
> (`ChatTicketsDashboardComponent`), não no `ChatOneToOneHeaderComponent`.

---

## Histórico do contato — `ContatoHistoricoPeek.jsx`

| React | Angular | Seletor / caminho |
|---|---|---|
| `ContatoHistoricoPeek` | `ChatContactJourneyComponent` | `<app-chat-contact-journey>` · `c1o1/components/chat-contact-journey/` |
| thread + `MessageBubble` (reuso) | `ChatCoreComponent` + `ChatMessageComponent` | `<app-chat-core>`, `<app-chat-message>` |
| `AtendimentoMarker` | separador/âncora de atendimento na timeline | — |
| `FilaFilterRow` | filtro por fila (chips + checkbox) | `.ccm-chips` + `mat-checkbox` |
| `TotalsCell` / `PeopleList` | cartões de totais por canal/atendente | — |

---

## Jornadas — `JornadasView.jsx`

Inbox de conversas conduzidas por automação ("jornada").

| React | Angular | Seletor / caminho |
|---|---|---|
| `JornadasView` / `JornadasPanel` | `ChatAutomationAnswersComponent` | `<app-chat-automation-answers>` · `c1o1/components/chat-automation-answers/` |
| (aba "Campanha" análoga) | `ChatCampaignAnswersComponent` | `<app-chat-campaign-answers>` |
| `JornadaItem` (lista) | item de conversa (padrão de `chat-talks-list`) | — |
| `JMsgBubble` / `JDayChip` | `ChatMessageComponent` + chip de data | `<app-chat-message>` |
| `JornadasFilterPanel` | MatDialog de filtros (two-column) | — |
| `FilterCheckboxList` / `FilterRadioList` | `mat-checkbox` / `mat-radio` | `material-checkbox.scss` / `material-radio.scss` |
| `FilterData` (calendário) | datepicker | `@theme/css/material-calendar.scss` |
| `TransferModal` | `UserAssignmentModalComponent` | `<app-user-assignment-modal>` |

> O **construtor** de jornadas (não esta tela de inbox) vive em
> `@modules/automation` → `AutomationComponent` `<app-automation>`.

---

## Dashboard / Relatórios — `DashboardView.jsx`

Módulo `c1o1/components/chat-dashboard/`.

| React | Angular | Seletor |
|---|---|---|
| `DashboardView` | `ChatDashboardComponent` | `<app-chat-dashboard>` |
| (header do dash) | `ChatDashboardHeaderComponent` | `<app-chat-dashboard-header>` |
| `KpiCard` | `ChatDashBasicInfoComponent` | `<app-chat-dash-basic-info>` |
| `ChannelChart` / `ChannelRow` | `ChatDashMessagesPerChannelComponent` / `ChatDashChatsPerChannelComponent` | `<app-chat-dash-messages-per-channel>`, `<app-chat-dash-chats-per-channel>` |
| (barras de progresso) | `CcmProgressChartComponent` | `<ccm-progress-chart>` · `shared/ccm-progress-chart/` |
| (pizza) | `CcmPieChartComponent` | `<ccm-pie-chart>` · `shared/ccm-pie-chart/` |
| `WhatsAppCategoriesCard` | `ChatDashWhatsappCategoriesRankComponent` | `<app-chat-dash-whatsapp-categories-rank>` |
| `AttendantTable` | `ChatDashChatsPerAttendantComponent` (grid `<ccm-table>`) | `<app-chat-dash-chats-per-attendant>` |
| filtros avançados | `ChatDashAdvancedFiltersModalComponent` | `<app-chat-dash-advanced-filters-modal>` |

Outros cards do dashboard Angular disponíveis: `chat-dash-chats-per-subject`,
`chat-dash-chats-per-team`, `chat-dash-messages-per-hour`.

---

## Átomos compartilhados (`@shared/components`) — referência rápida

| Função | Classe | Seletor |
|---|---|---|
| Botão | `ButtonComponent` | `<ccm-button>` |
| Avatar | `AvatarComponent` | `<ccm-avatar>` |
| Avatares empilhados | `AvatarListComponent` | `<ccm-avatar-list>` (inputs `nameList: string[]`, `size=36`, `limit=4`) |
| Tabela (grid editável) | `TableComponent` | `<ccm-table>` |
| Paginação | `CcmTablePaginatorComponent` | `<ccm-table-paginator>` |
| Tabs | `SimpleTabsHeaderComponent` | `<app-simple-tabs-header>` |
| Loader | `CcmLoaderComponent` | `<ccm-loader>` |
| Select / Multi-select | `CcmSelectListComponent` / `CcmMultiSelectComponent` | `<ccm-select-list>` / `<ccm-multi-select>` |
| Chip de status/API | `ApiChipComponent` | `<app-api-chip>` |
| Snackbar/toast | `FeedbackSnackbarComponent` | `<app-feedback-snackbar>` |
| Aviso de campo inválido | `InvalidFieldWarningComponent` | `<ccm-invalid-field-warning>` |
| Menu split com título | `CcmTitledSplitMatMenuComponent` | `<app-ccm-titled-split-mat-menu>` |
| Player de áudio | `CcmAudioPlayerComponent` | `<ccm-audio-player>` |
| Pizza / barras | `CcmPieChartComponent` / `CcmProgressChartComponent` | `<ccm-pie-chart>` / `<ccm-progress-chart>` |
