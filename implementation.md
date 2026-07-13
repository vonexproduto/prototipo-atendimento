# Implementação — CCM Atendimentos (Angular 16)

> Guia de implementação no sistema `ngx-ccm-master` (Angular 16), gerado a partir do protótipo React em alta fidelidade. Acompanha o `wireflow.html`.

---

## 1. Contexto

**Feature**: melhoria da tela de **Atendimentos** do módulo CCM (Customer Communication Management). Reorganiza a listagem de atendimentos, adiciona um detalhe em overlay com 3 abas (Conversas / Contato / Histórico), refatora o painel de conversa com composer multi-canal e introduz busca global no header com preview.

**Artefatos relacionados**:
- 📐 **Wireflow visual**: [wireflow.html](./wireflow.html)
- 🎬 **Protótipo interativo**: [CCM Atendimentos.html](./CCM%20Atendimentos.html)
- 📝 **PRD (Notion)**: _link a preencher_
- 🎞️ **Loom narrado**: _link a preencher_

**Time alvo**: 1 dev front (Angular 16). Estimativa preliminar: **3–4 sprints** se backend já tiver os endpoints; **5–6 sprints** se precisar criar endpoints novos.

---

## 2. Arquitetura no Angular

### 2.1 Localização

O código vive em:

```
src/app/@modules/chat-one-to-one/
```

A rota relevante (em `chat-one-to-one-routing.module.ts`) é:

```ts
{
  path: 'atendimentos',
  component: ChatTicketsDashboardComponent,
  children: [{
    path: ':subjectId/fila',
    component: TicketsDashListComponent,
  }, /* ... */]
}
```

A feature **substitui o conteúdo de `TicketsDashListComponent`** (tela de lista) e **adiciona um detalhe em overlay** dentro do mesmo container.

### 2.2 Padrões existentes a seguir

| Padrão | Onde está | Como reaproveitar |
|---|---|---|
| **State manager por módulo** | `state-managers/chat-one-to-one.state-manager.ts`, `drawer.state-manager.ts` | Criar `AtendimentosListStateManager` e `AtendimentoDetailStateManager` seguindo o mesmo formato (RxJS `BehaviorSubject`, sem NgRx) |
| **Modal service** | `modals/chat-one-to-one-modals.service.ts` | Usar para abrir o `TransferToQueueModal` e o `EndAtendimentoModal` |
| **Tokens SCSS** | `@theme/style-guide/css-files/colors.scss` | Importar via `@import "tokens-and-grids"` no SCSS do componente |
| **Botões padrão** | `<ccm-button>` (custom component, ver DESIGN.md) | Substituir todos os `<button>` HTML por `<ccm-button>` com `variant="primary"`, `variant="secondary"`, etc. |
| **Componentes Material** | `MatDialog`, `MatMenu`, `MatTab` | Manter — feature usa MatDialog para modais |
| **i18n** | `ngx-translate` | Toda string visível precisa de chave em `pt-br.json` |

### 2.3 DESIGN.md como fonte da verdade

Os tokens (cores, tipografia, sombras, radius) usados no protótipo **já existem** no sistema. Não recriar:
- Cores: `--brand-color-primary-pure` (#9240FF), `--secundary-color-pure` (#37B8FB), feedback (`--success-*`, `--warning-*`, `--danger-*`)
- Tipografia: Montserrat (todas variantes h1–h6, body-small, caption já definidas)
- Spacing: base 4px, utilitários `.m-{n}`, `.p-{n}`
- Radius: 8/12/16/20px
- Sombras: `--shadow-ccm-card`, `--shadow-ccm-popover`

---

## 3. Mapeamento Componente React → Angular

| Tela / Componente React | Localização no protótipo | Equivalente Angular | Ação |
|---|---|---|---|
| `Header` | `src/Header.jsx` | (header global, fora do módulo) | **Estender** com novo campo de busca global |
| `Rail` (sidebar de nav) | inline em `CCM Atendimentos.html` | sidebar global (fora do módulo) | Sem mudança |
| `QueueSidebar` | `src/QueueSidebar.jsx` | `TicketsDashSidebarComponent` em `components/tickets-dash-sidebar/` | **Refatorar** layout (filas hierárquicas, badges de contagem) |
| `AtendimentosList` (tabela) | `src/AtendimentosList.jsx` | `TicketsDashTableComponent` + `TicketsDashListComponent` | **Refatorar** colunas, ações sticky, paginação |
| `SearchPreview` | inline em `AtendimentosList.jsx` | _criar_ `GlobalSearchPreviewComponent` em `@shared/components/global-search-preview/` | **Criar** |
| `FiltersPanel` | inline em `AtendimentosList.jsx` | `TalksListFilterMenuComponent` (existe, em `components/chat-talks-list/talks-list-filter-menu/`) | **Adaptar** a versão para ticket list (drawer lateral, 5 grupos) |
| `AtendimentoDetail` (overlay) | `src/AtendimentoDetail.jsx` | _criar_ `AtendimentoDetailDrawerComponent` em `components/atendimento-detail-drawer/` | **Criar** — usar `DrawerStateManager` para overlay |
| `ConversasTab` | inline em `AtendimentoDetail.jsx` | _criar_ `AtendimentoConversasTabComponent` | **Criar** |
| `ContatoTab` | inline em `AtendimentoDetail.jsx` | _criar_ `AtendimentoContatoTabComponent` | **Criar** |
| `HistoricoTab` | inline em `AtendimentoDetail.jsx` | _criar_ `AtendimentoHistoricoTabComponent` | **Criar** — busca histórico do contato, não só do atendimento atual |
| `ConversaPanel` (painel direito) | `src/ConversaPanel.jsx` | `ChatOneToOneContainerComponent` + `ChatComponent` (já existem) | **Refatorar** layout, adicionar barra de ferramentas superior |
| `Composer` (multi-canal) | inline em `ConversaPanel.jsx` | (parte de `ChatComponent`) | **Refatorar** — adicionar tabs de canal, indicador de custo |
| `TransferModal` | inline em `ConversaPanel.jsx` | `UserAssignmentModalComponent` (existe, similar) ou _criar_ `TransferToQueueModalComponent` | **Decidir** — provavelmente novo, com radio + checkbox de notificar |
| `Popover` / `ContactInfoPopover` / `QueuePopover` / `BookmarkPopover` | inline em `ConversaPanel.jsx` | `MatMenu` ou popover do `ngx-popperjs` | **Implementar** com Material |

---

## 4. Mudanças por arquivo

### 4.1 Criar — Estrutura nova

```
src/app/@modules/chat-one-to-one/components/
  atendimento-detail-drawer/
    atendimento-detail-drawer.component.ts
    atendimento-detail-drawer.component.html
    atendimento-detail-drawer.component.scss
    tabs/
      conversas-tab/conversas-tab.component.{ts,html,scss}
      contato-tab/contato-tab.component.{ts,html,scss}
      historico-tab/historico-tab.component.{ts,html,scss}

src/app/@modules/chat-one-to-one/modals/
  transfer-to-queue-modal/
    transfer-to-queue-modal.component.{ts,html,scss}
  end-atendimento-modal/
    end-atendimento-modal.component.{ts,html,scss}

src/app/@modules/chat-one-to-one/state-managers/
  atendimento-detail.state-manager.ts

src/app/@shared/components/global-search-preview/
  global-search-preview.component.{ts,html,scss}
  global-search-preview.service.ts   ← gerencia buscas recentes (localStorage)
```

### 4.2 Modificar — Arquivos existentes

| Arquivo | Ação |
|---|---|
| `components/tickets-dash-list/tickets-dash-list.component.{ts,html,scss}` | Refatorar layout da listagem para o novo design. Trocar tabela existente pela nova com 10 colunas e ações sticky. Adicionar empty/loading states. |
| `components/tickets-dash-table/tickets-dash-table.component.{ts,html,scss}` | Atualizar colunas, badges de SLA, AvatarStack para contatos/atendentes. |
| `components/tickets-dash-sidebar/tickets-dash-sidebar.component.{ts,html,scss}` | Atualizar visual da sidebar de filas (hierarquia, badges, ícones). |
| `components/chat-one-to-one-container/chat-one-to-one-container.component.{ts,html,scss}` | Refatorar toolbar superior. **Atenção:** botões vincular/contato/finalizar devem ser ocultados (`*ngIf`) quando a aba ativa é "Contato" ou "Histórico" — apenas o título e o botão expandir ficam visíveis (CEN-144/145). O botão "Alterar fila / atendente" **foi removido** desta toolbar — agora vive na barra do atendimento (ver `ChatTicketsDashboardComponent`, CEN-133). |
| `chat-one-to-one-routing.module.ts` | _Não muda rotas_ — drawer abre por estado, não navegação. Confirmar com PM. |
| `chat-one-to-one.module.ts` | Registrar novos componentes nos `declarations`. |
| _(header global, fora do módulo)_ | Adicionar campo de busca global no header. Componente em `@shared/components/header/` ou similar. |

### 4.3 Não modificar

- `chat-one-to-one.state-manager.ts` — estado geral do módulo permanece. Adicionar campo só se necessário.
- `chat-folders-list.component.*` — esse é o de **conversas/folders**, não confundir com `tickets-dash-sidebar` (que é o de **atendimentos/filas**).
- Outros módulos (`campaign`, `automation`, `reports`) — sem impacto.

---

## 5. Novos serviços e state managers

### 5.1 `AtendimentoDetailStateManager`

Localização: `state-managers/atendimento-detail.state-manager.ts`

Responsabilidade: gerenciar o overlay do detalhe (aberto/fechado, aba ativa, atendimento atual, conversa selecionada).

```ts
// Esqueleto sugerido — seguir padrão de chat-one-to-one.state-manager.ts
@Injectable({ providedIn: 'root' })
export class AtendimentoDetailStateManager {
  private readonly _open$ = new BehaviorSubject<boolean>(false);
  private readonly _atendimentoId$ = new BehaviorSubject<string | null>(null);
  private readonly _activeTab$ = new BehaviorSubject<'conversas' | 'contato' | 'historico'>('conversas');
  private readonly _selectedConvIdx$ = new BehaviorSubject<number>(0);

  readonly open$ = this._open$.asObservable();
  readonly atendimentoId$ = this._atendimentoId$.asObservable();
  readonly activeTab$ = this._activeTab$.asObservable();
  readonly selectedConvIdx$ = this._selectedConvIdx$.asObservable();

  openDetail(atendimentoId: string) { /* set open + id */ }
  closeDetail() { /* set open=false */ }
  setTab(tab: 'conversas' | 'contato' | 'historico') { /* ... */ }
  selectConversa(idx: number) { /* ... */ }
}
```

### 5.2 `GlobalSearchPreviewService`

Localização: `@shared/components/global-search-preview/global-search-preview.service.ts`

Responsabilidade: buscas recentes no localStorage + busca live no backend.

```ts
@Injectable({ providedIn: 'root' })
export class GlobalSearchPreviewService {
  private readonly STORAGE_KEY = 'ccm.recent-searches';
  private readonly MAX_RECENT = 5;

  getRecent(): string[] { /* localStorage.getItem */ }
  saveRecent(term: string) { /* push + dedup + truncar a 5 */ }
  search(term: string): Observable<SearchResult[]> { /* HTTP com debounce, ver Composable Search abaixo */ }
}
```

A busca deve identificar tipo de match:
- Numérico ≥ 6 dígitos → tentar **CPF** e **telefone**
- Numérico < 6 dígitos → **ID do atendimento**
- Texto → **nome do contato**

### 5.3 `TransferToQueueModalService`

Localização: `modals/transfer-to-queue-modal/transfer-to-queue-modal.service.ts`

Wrapper sobre `MatDialog` para abrir o modal e devolver a fila escolhida.

---

## 6. Tokens, estilos e componentes compartilhados

### 6.1 Tokens a usar (já no DESIGN.md)

```scss
// Cores brand
--brand-color-primary-pure: #9240FF;
--brand-color-primary-light: #E1D2FF;
--brand-color-primary-lightest: #F3EBFF;
--secundary-color-pure: #37B8FB;
--secundary-color-lightest: #E8F7FF;

// Feedback
--success-pure / --success-light / --success-dark
--warning-pure / --warning-light / --warning-dark
--danger-pure / --danger-light / --danger-dark

// Neutros
--neutral-fg-1: #28293D;   // texto primário
--neutral-fg-2: #555770;   // texto secundário
--neutral-fg-3: #8F90A6;   // texto auxiliar
--neutral-border: #E4E4EB;
--neutral-border-soft: #F0F0F3;
```

### 6.2 `<ccm-button>` — variantes a usar

| Onde | Variante | Conteúdo |
|---|---|---|
| "Novo atendimento" (header da lista) | `variant="primary"` `icon-leading="plus"` | "Novo atendimento" |
| "Filtros avançados" (sem contorno) | `variant="tertiary"` `icon-leading="funnel-simple"` | "Filtros avançados" |
| Aplicar filtros (drawer) | `variant="primary"` | "Aplicar" |
| Cancelar (modais) | `variant="secondary"` | "Cancelar" |
| Encerrar (toolbar conversa, verde) | `variant="success"` + ícone `check` | _só ícone_ |
| Transferir (modal) | `variant="primary"` | "Transferir" |
| Criar manualmente (empty state) | `variant="primary"` `icon-leading="plus"` | "Criar atendimento manualmente" |

### 6.3 Componentes compartilhados a reutilizar

- `<ccm-avatar>` (se existir — senão, criar em `@shared/components/avatar/`) — para os AvatarStack
- `<ccm-badge>` (se existir) — para os badges de status/SLA/marcadores
- `<ccm-empty-state>` (se existir — verificar) — para o estado vazio
- `<ccm-skeleton-loader>` (se existir — verificar) — para o loading shimmer

> **Confirmar com o time** se essas primitivas já existem no `@shared/components/`. Se sim, reutilizar. Se não, criar genéricas para o sistema todo, não locais ao módulo.

---

## 7. Estados a implementar

Todos os estados estão **visualizados no wireflow.html** (telas 9 e 10) e descritos abaixo:

| Estado | Quando acontece | Comportamento esperado | Tela no wireflow |
|---|---|---|---|
| **Loading** | Fetch da lista da fila > 200ms | Skeleton shimmer (8 linhas). Após 1s, progress bar no header da tabela. | Tela 10 (`?demo=loading`) |
| **Empty (fila)** | Fila não tem atendimentos | Ícone + mensagem + CTA "Criar atendimento manualmente" | Tela 9 (`?demo=empty`) |
| **Empty (filtros)** | Filtros aplicados sem resultado | _Variante_: "Nenhum atendimento corresponde aos filtros" + CTA "Limpar filtros" | _(não no protótipo — implementar)_ |
| **Erro de rede** | Fetch falha (5xx, timeout) | Banner vermelho no topo da tabela + botão "Tentar novamente" | _(não no protótipo — implementar)_ |
| **Permissão negada** | Usuário sem perm. para encerrar atendimento | Botão de encerrar desabilitado com tooltip "Você não tem permissão" | _(não no protótipo — implementar)_ |
| **Conversa offline (sem WhatsApp)** | Canal indisponível no momento de envio | Toast + composer mostra "Canal indisponível, tentar novamente" | _(não no protótipo — implementar)_ |

---

## 8. Backend / API (a alinhar com o time backend)

Endpoints **prováveis** (sujeito a confirmação):

| Método | Endpoint | Uso |
|---|---|---|
| `GET` | `/atendimentos?fila={id}&status={status}&page={n}` | Lista paginada (tela 1) |
| `GET` | `/atendimentos/{id}` | Detalhe completo (tela 4) |
| `GET` | `/atendimentos/{id}/conversas` | Lista de conversas (tela 4) |
| `GET` | `/atendimentos/{id}/contato/{contatoId}/historico` | Timeline completa do contato (tela 6) |
| `GET` | `/busca/atendimentos?q={term}` | Busca global (tela 2) — preview |
| `POST` | `/atendimentos/{id}/transferir-fila` | Transferência (tela 8) |
| `POST` | `/atendimentos/{id}/transferir-atendente` | Transferência (popover) |
| `POST` | `/atendimentos/{id}/encerrar` | Encerramento (com motivo) |
| `POST` | `/atendimentos/{id}/conversas/{convId}/mensagens` | Envio de mensagem |
| `WS` | `/atendimentos/stream` (STOMP existente) | Updates em tempo real (já existe? confirmar) |

> ⚠️ **Tarefa de pré-implementação**: reunião de 1h com o backend para alinhar contratos. Levar essa tabela.

---

## 9. Sequência de tarefas sugerida

Ordenada por dependência. Estime cada uma com seu PM/Tech Lead.

1. **Setup**: criar branch `feature/atendimentos-melhoria` a partir de `develop`
2. **Tokens & componentes shared**: validar com o time se `<ccm-empty-state>`, `<ccm-skeleton-loader>`, `<ccm-avatar>` existem. Criar os que faltam em `@shared/`
3. **Sidebar de filas**: refatorar `TicketsDashSidebarComponent` para novo visual
4. **Tabela de atendimentos**: refatorar `TicketsDashTableComponent` (10 colunas, ações sticky, badges SLA/status)
5. **Estados loading + empty**: implementar nas duas variantes (fila vazia / sem resultado de filtro)
6. **Filtros avançados**: adaptar `TalksListFilterMenuComponent` ou criar drawer próprio com 5 grupos de filtro
7. **Busca global**: criar `GlobalSearchPreviewComponent` + service, plugar no header
8. **Detalhe overlay**: criar `AtendimentoDetailDrawerComponent` com 3 abas
9. **Aba Conversas**: lista de cards de conversa, status por conversa
10. **Aba Contato**: lista de pessoas no atendimento
11. **Aba Histórico**: timeline completa do contato (depende de endpoint backend)
12. **Painel de conversa**: refatorar `ChatOneToOneContainerComponent` + toolbar superior. **Toolbar condicional:** ocultar botões vincular/contato/finalizar nas abas Contato e Histórico (CEN-144/145). **Botão "Alterar fila"** foi movido para a barra do atendimento (CEN-133).
13. **Composer multi-canal**: tabs de canal, indicador de custo, contador de chars
14. **Popovers** (marcadores, contato, transferir, salvar): implementar com `MatMenu` / popover
15. **Modal de transferência de fila**: criar `TransferToQueueModalComponent`
16. **Modal de encerramento**: criar `EndAtendimentoModalComponent` com motivo
17. **Estados de erro & permissão**: cobrir os cenários não-felizes
18. **Integração tempo real**: confirmar se WS já cobre, ajustar STOMP topics
19. **i18n**: extrair todas as strings para `pt-br.json`
20. **Testes unitários**: cobrir state managers + componentes-chave
21. **Testes visuais**: comparar telas com o `wireflow.html` (lado a lado)
22. **Code review interno** com 1 dev sênior do time
23. **QA**: validar fluxos felizes + estados nos diferentes navegadores
24. **Merge em `develop`**

---

## 10. Premissas e perguntas em aberto

### Premissas do designer (precisam confirmação técnica)

- [ ] **Detalhe é overlay, não rota nova**. Confirmar se isso é OK ou se PM quer URL específica para deep-link.
- [ ] **Buscas recentes ficam em localStorage**, não persistem no backend.
- [ ] **Histórico do contato** retorna todas as conversas anteriores deste contato em qualquer atendimento, não só o atual.
- [ ] **Composer multi-canal**: ao trocar de tab, o texto digitado é mantido (não limpa).
- [ ] **Encerrar atendimento** sempre exige motivo (modal obrigatório).
- [ ] **Avatar stack** mostra até 4 visíveis + contador `+N`.
- [ ] **Tabela responsiva**: scroll horizontal abaixo de 1366px, sem reflow para mobile (esta tela não tem versão mobile na v1).

### Perguntas para o dev levantar antes de começar

1. Os endpoints listados na seção 8 existem? Se não, qual o lead time do backend?
2. O sistema STOMP atual emite eventos por atendimento (`/topic/atendimento/{id}`) ou só por fila?
3. `<ccm-button>` tem variante `tertiary` (sem contorno, só texto + ícone)?
4. `<ccm-empty-state>` e `<ccm-skeleton-loader>` existem? Se não, criar em `@shared/` ou local?
5. Como o sistema lida com perda de permissão durante sessão (token revogado)? Reload ou apenas desabilitar botões?
6. O envio de mensagem retorna o ID antes ou depois de bater no canal externo (otimista vs pessimista)?

---

## 11. Como validar visualmente

Para garantir fidelidade ao design durante e após implementação:

1. Abrir o protótipo em uma aba: [CCM Atendimentos.html](./CCM%20Atendimentos.html)
2. Abrir o sistema Angular local em outra aba (`ng serve` → `localhost:4200/chat/atendimentos`)
3. Comparar lado a lado tela por tela usando o [wireflow.html](./wireflow.html) como índice
4. Cada tela do wireflow tem um link `demo=<estado>` que abre exatamente aquele estado isolado — útil para reproduzir cenários sem clicar até chegar lá
5. **Aceite visual** = pixel-fidelidade dentro de ±2px no layout principal; cor, sombra, radius batem com tokens do DESIGN.md

---

## 12. Riscos & gotchas

- **Performance da tabela** com > 100 atendimentos: avaliar virtualização (`@angular/cdk/scrolling` — `cdk-virtual-scroll-viewport`). DevExtreme grid já é usado em outras telas — considerar se justifica aqui.
- **STOMP reconnect**: garantir que ao reconectar, o estado da lista é re-sincronizado (não apenas mantém último snapshot).
- **Composer e canais**: cada canal tem limites diferentes (WhatsApp template approval, SMS 160 chars, etc.). Validações inline obrigatórias.
- **Permissões granulares**: encerrar atendimento, transferir, visualizar histórico — cada uma pode ter regra de permissão diferente. Centralizar checks no `userPermissionGuard` ou via `*ccmHasPermission`.
- **i18n com plurais**: contagens (ex: "2 conversas") usam ICU MessageFormat — confirmar com time se ngx-translate-messageformat-compiler está configurado.

---

## 13. Pós-merge

- [ ] Documentar no Notion: link da feature implementada + lições aprendidas
- [ ] Atualizar `DESIGN.md` se algum token novo foi introduzido
- [ ] Compartilhar Loom curto (3 min) com o time mostrando o que ficou pronto
- [ ] Coletar feedback do dev sobre o formato do delivery (este `implementation.md` + `wireflow.html`) — usar pro próximo ciclo
