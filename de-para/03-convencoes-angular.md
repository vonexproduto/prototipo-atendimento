# 03 · Convenções do `ngx-ccm` — como recriar o protótipo no Angular

Contexto para escrever código que "parece" do `ngx-ccm`, não React traduzido.

---

## Estrutura de pastas

```
src/app/
  @core/        # layout global, header, guards, interceptors, services de sessão
  @shared/      # átomos reutilizáveis (components/), pipes, directives, models
  @theme/       # design system: style-guide/css-files (tokens), css/ (overrides), animations
  @modules/     # uma pasta por domínio (feature module)
    chat-one-to-one/   # TELAS de atendimentos/conversas  ← foco do protótipo
    chat/              # MOTOR de mensagens (thread, composer, tipos de msg)
    automation/        # construtor de jornadas/automação
    operation/         # filas/operações
    attendance-markers/# CRUD de marcadores
    ...
```

Dentro de um módulo de domínio:
```
<modulo>/
  <modulo>.component.{ts,html,scss,spec.ts}
  <modulo>.module.ts
  <modulo>.routing-module.ts
  components/   # componentes de apresentação do módulo
  modals/       # diálogos (MatDialog)
  models/       # interfaces/DTOs
  services/     # regras + chamadas a repositories
  repositories/ # acesso HTTP
  state-managers/ # estado do módulo
  helpers/
```

---

## Nomenclatura (regra mecânica)

- **Pasta e arquivos** em `kebab-case`: `tickets-dash-sidebar/tickets-dash-sidebar.component.ts`.
- **Classe** em `PascalCase` + sufixo do tipo: `TicketsDashSidebarComponent`,
  `InboxService`, `ApiRepository`, `HeaderMenuResolver`.
- **Seletor** em `kebab-case`. Dois prefixos convivem no codebase:
  - `app-` → componentes de tela/feature e a maioria do `@core`/`@modules`
    (ex.: `app-tickets-dash-table`, `app-chat-input-router`).
  - `ccm-` → átomos do `@shared` (ex.: `ccm-button`, `ccm-avatar`, `ccm-table`).
  - (existe 1 typo histórico: `cmm-coming-soon-chip` — preservar como está.)
- Ao criar um componente novo equivalente a um React, **derive o seletor do nome
  da pasta**: pasta `foo-bar/` → `app-foo-bar` (feature) ou `ccm-foo-bar` (shared).

---

## Componentes: padrão de escrita

- Muitos componentes novos são **standalone** (vi `standalone: true` em
  `tickets-dash-table`, `tickets-dash-sidebar`, `chat-ticket-status`, etc.).
  Para componentes novos, prefira **standalone** com `imports: [...]`.
- Componentes antigos são declarados no `*.module.ts` do feature module.
- `templateUrl`/`styleUrls` separados (HTML e SCSS em arquivos próprios) — **não**
  use template/estilo inline como o protótipo faz.
- `@Input()` para dados de entrada, `@Output() EventEmitter` para eventos.
  Ex.: `<ccm-avatar-list [nameList]="nomes" [size]="36" [limit]="3">`.
- Estilos: **não** repita hex. Use as CSS vars/classes do `@theme` (ver
  `01-design-tokens.md`). Ex.: `color: var(--brand-color-primary-pure)` ou
  `class="color-primary-pure"`.

---

## Inline styles → SCSS/tema

O protótipo usa `style={{ ... }}` com `window.CCM.c.<chave>`. Na conversão:

1. Mova o estilo para o `.scss` do componente.
2. Troque o hex pela CSS var do Angular (tabela em `01-design-tokens.md`),
   ou aplique a classe utilitária equivalente (`.color-*`, `.bg-*`, `.ccm-chips`,
   `.ccm-card`, `.white-box-background`, etc.).
3. Tipografia → classes `.body-*` / `.caption-*` / `h1..h6` em vez de `fontSize` solto.

Exemplo:
```jsx
// React
<div style={{ background: c.primaryLightest, color: c.primary, borderRadius: 999 }}>
```
```html
<!-- Angular -->
<div class="ccm-chips primary br-22"> … </div>
<!-- ou: [style.background]="'var(--brand-color-primary-lightest)'" -->
```

---

## Modais

- O protótipo usa `ReactDOM.createPortal` + overlay manual. No Angular use
  **Angular Material `MatDialog`** (`dialog.open(MeuModalComponent, { data })`).
- Temas de diálogo prontos: classes `.dialog-br-16` / `.dialog-br-20` /
  `.dialog-transparent` e backdrops `.cdk-overlay-backdrop-dark` /
  `-high-light` (em `@theme/css/material-dialog.scss`).
- Modais já existentes no `c1o1/modals/`: `chat-settings-modal`,
  `ticket-creation-modal`, `ticket-assignment-modal`, `user-assignment-modal`,
  `chat-ticket-bind-modal`, `sla-config-by-ticket-modal`,
  `chat-dash-advanced-filters-modal`, `whatsapp-template-message-modal`,
  `contact-selection-for-duplicated-chat`, `resolve-options-automation-chat-modal`.
  **Reutilize** estes antes de criar um modal novo.

---

## Popovers / menus / tooltips

- Dropdowns e menus → **`mat-menu`** (tema `material-menu.scss`).
- Popovers nomeados já estilizados (em `@theme/css/popover.scss`):
  `.chat-note-menu`, `.chat-marker-popover`, `.chat-metadata-popover`,
  `.chat-ticket-warning`, `.notification-popover`, `.chat-sort-filter-popover`,
  `.emoji_selection_popover`. Use a classe correspondente ao reproduzir os
  popovers do protótipo (`MarcadoresPopover` → `.chat-marker-popover`, etc.).
- Tooltips → `matTooltip` (o protótipo simula com portais; descartar isso).

---

## Canais de mensagem (composer)

| Protótipo (`label`) | Componente Angular | Seletor |
|---|---|---|
| WhatsApp | `ChatInputWhatsappComponent` | `app-chat-input-whatsapp` |
| WhatsApp Web | `ChatInputWhatsappWebComponent` | `app-chat-input-whatsapp-web` |
| SMS | `ChatInputSmsComponent` | `app-chat-input-sms` |
| E-mail | `ChatInputEmailComponent` | `app-chat-input-email` |
| RCS | `ChatInputRcsComponent` | `app-chat-input-rcs` |
| Torpedo (voz) | `ChatInputVoicemailComponent` | `app-chat-input-voicemail` |
| Nota interna | `ChatInputNoteComponent` | `app-chat-input-note` |

Roteador de abas: `ChatInputRouterComponent` (`app-chat-input-router`). Tipos de
**mensagem** (na thread) têm router próprio: `MessageTypeRouterComponent`
(`app-message-type-router`) → text/image/audio/document/video/html/whatsapp.

---

## Ícones

- Protótipo: **Phosphor Icons** (`<i class="ph ph-…">`). **Não traduza os nomes
  `ph-*` direto.** O `ngx-ccm` tem seu próprio conjunto de ícones — ao converter,
  troque pelo ícone equivalente do design system do Angular (confirmar com o time).

---

## Estado e dados

- O protótipo usa mocks em `src/data.js` (`window.CCM_DATA`) e estado local
  (`React.useState`). No Angular:
  - Dados via **services** (`inbox.service.ts`, etc.) → **repositories** (HTTP) →
    **state-managers** do módulo.
  - Realtime (mensagens novas, contadores) via **WebSocket**
    (`@core/services/websocket.connector.ts`).
  - Permissões/escopo ("Meus/Todos") via `permissions.service.ts` e guards.
- O `viewScope`, favoritos e `chatSettings` que o protótipo guarda em
  `localStorage` devem virar estado de service/preferências do usuário.

---

## Glossário de domínio (PT ⇄ termos do código)

| Protótipo (PT) | Código Angular |
|---|---|
| Atendimento | **ticket** (ex.: `tickets-dash-*`, `ticket-creation-modal`) |
| Conversa | **talk** / **chat** (ex.: `chat-talks-list`, `chat`) |
| Fila | **queue** / subject / operation (módulo `operation`) |
| Marcador | **marker** (`chat-attendance-markers-selection`, módulo `attendance-markers`) |
| Jornada | **automation** (`chat-automation-answers`, módulo `automation`) |
| Campanha | **campaign** (`chat-campaign-answers`) |
| Torpedo (de voz) | **voicemail** (`chat-input-voicemail`) |
| Atendente | attendant / user |
| Histórico do contato | contact **journey** (`chat-contact-journey`) |

---

## Checklist de conversão de uma tela

1. Achar o componente Angular alvo em `02-componentes.md` (classe + seletor + caminho).
2. Ver se ele **já existe** no `ngx-ccm` — se sim, **estender/usar**, não recriar.
3. Recriar o layout no `.html`; mover estilos para o `.scss` usando tokens/classes
   do `@theme` (`01-design-tokens.md`) — sem hex solto.
4. Trocar átomos por `@shared` (`<ccm-button>`, `<ccm-avatar-list>`, `<ccm-loader>`…).
5. Modais → `MatDialog` reutilizando os de `c1o1/modals/`.
6. Ícones → set do `ngx-ccm` (não `ph-*`).
7. Dados → service/state-manager (não mock inline).
8. Conferir as 3 armadilhas do `README.md` (cores off-by-one, `secundary`, ícones).
