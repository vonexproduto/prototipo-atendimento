// AtendimentosList.jsx — main table of atendimentos for the selected queue
// =====================================================================
// DE-PARA REACT → ANGULAR  ·  AtendimentosList.jsx
// ---------------------------------------------------------------------
// Tabela central de atendimentos (tickets) da fila selecionada + ações.
// Módulo Angular: @modules/chat-one-to-one  (rota /atendimentos).
//
//   AtendimentosList     → TicketsDashTableComponent  <app-tickets-dash-table>
//                          @modules/chat-one-to-one/components/tickets-dash-table/
//                          (container/lista = TicketsDashListComponent
//                           <app-tickets-dash-list>; dashboard pai =
//                           ChatTicketsDashboardComponent <app-chat-tickets-dashboard>)
//   AvatarStack          → AvatarListComponent  <ccm-avatar-list
//                            [nameList]="..." [size]="36" [limit]="3">
//                          @shared/components/avatar-list/  (avatar único = <ccm-avatar>)
//   StatusDropdown /      → ChatTicketStatusComponent <app-chat-ticket-status> +
//   status pill            TicketStatusChangeComponent <app-ticket-status-change>
//   SLA tag (slaColor)   → ChatSlaIndicatorComponent <app-chat-sla-indicator>
//   IconLabelButton /    → ButtonComponent <ccm-button> (variantes mini/icon)
//   "Novo atendimento"
//   RowActionsMenu       → mat-menu (tema @theme/css/material-menu.scss / popover.scss)
//   marcadores (chips)   → .ccm-chips (@theme/css/chips.scss) — cor por marcador
//   Status/SLA badges    → .ccm-badget (@theme/css/badget.scss)
//   NovaConversaModal    → TicketCreationModalComponent <app-ticket-creation-modal>
//                          + ChatCreateTalkComponent <app-chat-create-talk>
//   AtendimentoFormModal → TicketCreationModalComponent (modo criar/editar)
//   ColumnSortModal      → ordenação por coluna (marcador/dataInicio/dataAtualizacao)
//                          (talks-list-sort-filter / mat-menu — parametrizado por column)
//   FiltersPanel         → ChatDashAdvancedFiltersModalComponent
//                          <app-chat-dash-advanced-filters-modal>
//   IaTransferConfirmModal → modal de confirmação (MatDialog genérico)
//   LoadingSkeleton      → CcmLoaderComponent <ccm-loader>
//   KanbanView/GanttView → views alternativas (sem 1:1 hoje; libs CDK/gantt)
// Tabela: o Angular tem ccm-table (Handsontable) p/ grids editáveis, mas esta
//   listagem usa <table>/mat-table estilizada (ver @theme/css/table.scss).
// Doc: de-para/02-componentes.md
// =====================================================================

// HoverLabel — text that animates in/out next to an icon
const HoverLabel = ({ show, children, gap = 7 }) => (
  <span style={{
    maxWidth: show ? 240 : 0,
    opacity: show ? 1 : 0,
    marginLeft: show ? gap : 0,
    overflow: "hidden",
    whiteSpace: "nowrap",
    transition: "max-width 220ms cubic-bezier(.2,.7,.2,1), opacity 220ms ease, margin-left 220ms ease",
    display: "inline-block",
  }}>{children}</span>
);

// IconLabelButton — icon-only by default, label fades in on hover
const IconLabelButton = ({ icon, label, hovered, onHoverChange, active, onClick, variant = "ghost" }) => {
  const c = window.CCM.c;
  const isPrimary = variant === "primary";
  const baseColor = isPrimary ? "#fff" : (active ? c.primary : c.fg2);
  const baseBg = isPrimary
    ? c.primary
    : (active ? c.primaryLightest : (hovered ? c.borderSoft : "transparent"));
  return (
    <CCMTooltip label={label}>
      <button
        onClick={onClick}
        onMouseEnter={() => onHoverChange?.(true)}
        onMouseLeave={() => onHoverChange?.(false)}
        aria-label={label}
        style={{
          height: 40, padding: "0 12px", border: 0, borderRadius: isPrimary ? 12 : 10,
          background: baseBg, color: baseColor,
          cursor: "pointer", display: "flex", alignItems: "center",
          fontFamily: "Montserrat, sans-serif",
          fontSize: 13, fontWeight: isPrimary ? 600 : 600,
          boxShadow: isPrimary ? "0 2px 6px rgba(146,64,255,0.30)" : "none",
          transition: "background 180ms ease, color 180ms ease",
        }}
      >
        <i className={`ph ${icon}`} style={{ fontSize: 16 }} />
        <HoverLabel show={hovered || active}>{label}</HoverLabel>
      </button>
    </CCMTooltip>
  );
};

const AtendimentosList = ({
  queue, queues, onSelectQueue, onOpenAtendimento,
  viewScope = "all",
  favoritedIds, toggleFavorite,
}) => {
  // Favoritos e SLA são opções mutuamente exclusivas do segmented control.
  const favoritesOnly = viewScope === "favorites";
  const isSlaMode = viewScope === "sla";
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const demo = window.CCM_DEMO_STATE || {};
  const [searchFocused, setSearchFocused] = React.useState(!!demo.searchFocused);
  const [query, setQuery] = React.useState("");
  const [filtersOpen, setFiltersOpen] = React.useState(!!demo.filtersOpen);
  // Modal de ordenação aberto para qual coluna (null = fechado).
  // Aceita: "marcador" | "dataInicio" | "dataAtualizacao" | "sla"
  const [sortModalOpen, setSortModalOpen] = React.useState(null);
  // Sort ativo: null OU { column, mode: "page"|"all", direction: "asc"|"desc" }.
  // Apenas uma coluna por vez. Em modo SLA, se não houver sortConfig setado,
  // assume default {column:"sla", mode:"all", direction:"asc"} (mais atrasados primeiro).
  const [sortConfig, setSortConfig] = React.useState(null);
  // Direção default por coluna (quando o usuário acabou de abrir o modal pela 1ª vez)
  const DEFAULT_SORT_DIRECTION = {
    marcador: "asc", dataInicio: "desc", dataAtualizacao: "desc", sla: "asc",
  };
  // SLA mode sem sortConfig explícito → assume sort por SLA
  const effectiveSortConfig = sortConfig
    || (isSlaMode ? { column: "sla", mode: "all", direction: "asc" } : null);
  const [openMenuId, setOpenMenuId] = React.useState(null);
  const [menuPos, setMenuPos] = React.useState({ top: 0, left: 0 });
  const [novaConversaOpen, setNovaConversaOpen] = React.useState(false);
  const [novoAtendimentoOpen, setNovoAtendimentoOpen] = React.useState(false);
  const [editAtendimentoId, setEditAtendimentoId] = React.useState(null);
  const [viewMode, setViewMode] = React.useState("list"); // "list" | "kanban" | "gantt"
  const [statusDd, setStatusDd] = React.useState(null); // { id, pos: {top, right?, left?} }
  const [statusOverrides, setStatusOverrides] = React.useState({}); // { [id]: newStatus }
  const [hoveredBtn, setHoveredBtn] = React.useState(null);
  const searchRef = React.useRef(null);

  // Recurso "Transferir por I.A." — só na fila "Sem fila específica".
  // Modal de confirmação + set de IDs marcados como transferidos +
  // snackbar de sucesso. Os atendimentos marcados ganham um ícone-cérebro
  // ao lado do ID na tabela.
  const [iaModalOpen, setIaModalOpen] = React.useState(false);
  const [iaTransferredIds, setIaTransferredIds] = React.useState(() => new Set());
  const [iaSnack, setIaSnack] = React.useState(null);
  const isSemFila = queue?.id === "sem-fila";

  // ── Favoritos ──
  // O estado vive no App e é passado como props (favoritedIds Set,
  // toggleFavorite callback, favoritesOnly boolean). Persiste em
  // localStorage e funciona em qualquer escopo.

  const handleConfirmIA = () => {
    // Demo: marca os 6 atendimentos novos (100501..506) + os 3 primeiros da lista
    const targetIds = new Set([
      "100501", "100502", "100503", "100504", "100505", "100506",
      ...D.atendimentos.slice(0, 3).map(a => a.id),
    ]);
    setIaTransferredIds(targetIds);
    setIaModalOpen(false);
    setIaSnack(`${targetIds.size} atendimentos transferidos por I.A.`);
    setTimeout(() => setIaSnack(null), 3800);
  };

  React.useEffect(() => {
    if (!openMenuId) return;
    const h = e => { if (!e.target.closest("[data-row-menu]")) setOpenMenuId(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [openMenuId]);

  // ─────────────────────────────────────────────
  // Sort por coluna — marcador (agrupa por label do 1º marcador) ou
  // datas (parse de "DD/MM/AA - HH:mm", mais recente primeiro).
  // "page" → ordena apenas os primeiros PAGE_SIZE itens
  // "all"  → ordena a lista inteira
  // ─────────────────────────────────────────────
  const PAGE_SIZE = 10;

  // Parse de string "31/12/25 - 14:32" → ms epoch (0 se inválido)
  const parseAtendimentoDate = (s) => {
    if (!s) return 0;
    const m = s.match(/(\d{2})\/(\d{2})\/(\d{2}) - (\d{2}):(\d{2})/);
    if (!m) return 0;
    return new Date(2000 + Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5])).getTime();
  };

  // dataAtualizacao = dataInicio + offset determinístico (1-72h) pelo hash do id.
  // No Angular vem direto do backend (last_activity_at do atendimento).
  const formatAtendimentoDate = (d) => {
    const p = n => String(n).padStart(2, "0");
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)} - ${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const getDataAtualizacao = (a) => {
    if (a.dataAtualizacao) return a.dataAtualizacao;
    const ms = parseAtendimentoDate(a.dataInicio);
    if (!ms) return a.dataInicio || "—";
    const hash = String(a.id).split("").reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) | 0, 0);
    const offsetHours = (Math.abs(hash) % 72) + 1;
    return formatAtendimentoDate(new Date(ms + offsetHours * 3600 * 1000));
  };

  const sortByColumn = (arr, column, direction = "asc") => {
    const mult = direction === "desc" ? -1 : 1;
    if (column === "marcador") {
      return [...arr].sort((a, b) => {
        const am = a.marcadores?.[0]?.label || "zzz_sem_marcador";
        const bm = b.marcadores?.[0]?.label || "zzz_sem_marcador";
        return mult * am.localeCompare(bm, "pt-BR");
      });
    }
    if (column === "dataInicio") {
      return [...arr].sort((a, b) => mult * (parseAtendimentoDate(a.dataInicio) - parseAtendimentoDate(b.dataInicio)));
    }
    if (column === "dataAtualizacao") {
      return [...arr].sort((a, b) => mult * (parseAtendimentoDate(getDataAtualizacao(a)) - parseAtendimentoDate(getDataAtualizacao(b))));
    }
    if (column === "sla") {
      return [...arr].sort((a, b) => mult * (window.CCM.slaTagToMinutes(a.slaTag) - window.CCM.slaTagToMinutes(b.slaTag)));
    }
    return arr;
  };

  const displayedAtendimentos = React.useMemo(() => {
    const meId = D.attendant?.id;
    let src = D.atendimentos.map(a =>
      statusOverrides[a.id] ? { ...a, status: statusOverrides[a.id] } : a
    );
    // Filtro de fila — aplicado em todos os modos EXCETO SLA. No modo SLA,
    // a ideia é uma visão global cross-fila ordenada pelo atraso, sem recortes.
    if (!isSlaMode) {
      const acceptableLeaves = window.CCM.expandQueueLeaves(queue);
      if (acceptableLeaves.size > 0) {
        src = src.filter(a => acceptableLeaves.has(window.CCM.queueOfAtendimento(a.id, D.queues)));
      }
    }
    // Filtro de escopo: "mine" = só atendimentos onde o atendente logado participa
    if (viewScope === "mine" && meId) {
      src = src.filter(a => (a.atendentes || []).some(at => at.id === meId));
    }
    // Filtro de favoritos
    if (favoritesOnly && favoritedIds) {
      src = src.filter(a => favoritedIds.has(a.id));
    }
    // Ordenação unificada — modo SLA tem default implícito (column:"sla", asc, all)
    // mas o usuário pode sobrescrever pela própria modal da coluna SLA.
    const cfg = effectiveSortConfig;
    if (cfg?.mode === "all") return sortByColumn(src, cfg.column, cfg.direction);
    if (cfg?.mode === "page") {
      const head = src.slice(0, PAGE_SIZE);
      const tail = src.slice(PAGE_SIZE);
      return [...sortByColumn(head, cfg.column, cfg.direction), ...tail];
    }
    return src;
  }, [D.atendimentos, effectiveSortConfig, statusOverrides, viewScope, D.attendant?.id, favoritesOnly, favoritedIds, queue, D.queues]);

  React.useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const statusColor = (s) => {
    if (s === "Aberto" || s === "Aberta")          return { bg: c.successLight, fg: c.successDark };
    if (s === "Em andamento")                       return { bg: "#fff4d1", fg: "#a8660a" };
    if (s === "Pendente")                           return { bg: c.warningLight, fg: c.warningDark };
    if (s === "Pausado")                            return { bg: "#ffe4c4", fg: "#c45a0c" };
    if (s === "Cancelado")                          return { bg: "#ffdde3", fg: "#c8362b" };
    if (s === "Finalizado")                         return { bg: "#d4f0e2", fg: "#2f7a32" };
    return { bg: c.borderSoft, fg: c.fg2 };
  };

  const slaColor = (tag) => {
    if (!tag) return null;
    if (tag.startsWith("-")) return { bg: "#ffdde3", fg: "#f54336" };
    return { bg: "#e6f3e5", fg: "#4eaf51" };
  };

  return (
    <section style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden", position: "relative" }}>

      {/* ── Local Header ── white, sticky, never scrolls ── */}
      <div style={{
        background: "#fff",
        padding: "14px 24px 12px",
        borderBottom: `1px solid ${c.border}`,
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Title row: breadcrumb (left) + [filtros, chips, novo atendimento] (right) */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16,
        }}>
          {/* Breadcrumb — esconde no modo SLA (view global cross-fila) e mostra
              um título dedicado no lugar. */}
          <div style={{ minWidth: 0, flex: 1 }}>
            {isSlaMode ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <i className="ph ph-clock-countdown" style={{ fontSize: 20, color: "#c8362b" }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: c.fg1 }}>
                  Atendimentos por SLA
                </span>
                <span style={{
                  background: "#ffdde3", color: "#c8362b",
                  fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                  textTransform: "uppercase", letterSpacing: "0.04em",
                }}>visão global</span>
              </div>
            ) : (
              <QueueBreadcrumb queue={queue} queues={queues} onSelectQueue={onSelectQueue} />
            )}
          </div>

          {/* Right cluster: Filtros + Chips + Novo atendimento */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {!isSlaMode && (
              <IconLabelButton
                icon="ph-funnel-simple"
                label="Filtros avançados"
                hovered={hoveredBtn === "filtros"}
                onHoverChange={(h) => setHoveredBtn(h ? "filtros" : null)}
                active={filtersOpen}
                onClick={() => setFiltersOpen(o => !o)}
                variant="ghost"
              />
            )}

            {/* Modo SLA: o card amarelo foi removido. A ordenação agora é
                acionada clicando no header da coluna SLA (mesma modal das
                outras colunas) — escopo (página/todos) + direção (asc/desc). */}

            {/* View mode chips — disponível em todos os modos, inclusive SLA */}
            <div style={{
              display: "flex", background: "#f2f4f7", borderRadius: 10,
              padding: 3, gap: 2, border: `1px solid ${c.border}`,
            }}>
              {[
                { v: "list",   icon: "ph-rows",                 label: "Lista" },
                { v: "kanban", icon: "ph-kanban",               label: "Kanban" },
                { v: "gantt",  icon: "ph-chart-bar-horizontal", label: "Gantt" },
              ].map(({ v, icon, label }) => {
                const active = viewMode === v;
                const hovered = hoveredBtn === `chip-${v}`;
                const showLabel = active || hovered;
                return (
                  <CCMTooltip key={v} label={label}>
                    <button
                      onClick={() => setViewMode(v)}
                      onMouseEnter={() => setHoveredBtn(`chip-${v}`)}
                      onMouseLeave={() => setHoveredBtn(null)}
                      aria-label={label}
                      style={{
                        height: 30, padding: "0 10px", border: 0, borderRadius: 7,
                        background: active ? "#fff" : "transparent",
                        color: active ? c.primary : c.fg2,
                        cursor: "pointer", display: "flex", alignItems: "center",
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: 12, fontWeight: active ? 700 : 500,
                        boxShadow: active ? "0 1px 3px rgba(40,41,61,0.10)" : "none",
                        transition: "background 180ms ease, color 180ms ease, box-shadow 180ms ease",
                      }}
                    >
                      <i className={`ph ${icon}`} style={{ fontSize: 15 }} />
                      <HoverLabel show={showLabel}>{label}</HoverLabel>
                    </button>
                  </CCMTooltip>
                );
              })}
            </div>

            {isSemFila && (
              <CCMTooltip label="Transferir atendimentos por I.A.">
                <button
                  type="button"
                  onClick={() => setIaModalOpen(true)}
                  onMouseEnter={() => setHoveredBtn("ia")}
                  onMouseLeave={() => setHoveredBtn(null)}
                  aria-label="Transferir atendimentos por I.A."
                  style={{
                    width: 38, height: 38, borderRadius: 10, border: 0,
                    background: c.primary, color: "#fff", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: hoveredBtn === "ia"
                      ? "0 4px 12px rgba(146,64,255,0.42)"
                      : "0 2px 6px rgba(146,64,255,0.30)",
                    transition: "box-shadow 150ms ease, transform 150ms ease",
                    transform: hoveredBtn === "ia" ? "translateY(-1px)" : "none",
                    position: "relative",
                  }}
                >
                  <i className="ph-fill ph-brain" style={{ fontSize: 18 }} />
                </button>
              </CCMTooltip>
            )}

            <IconLabelButton
              icon="ph-plus"
              label="Novo atendimento"
              hovered={hoveredBtn === "novo"}
              onHoverChange={(h) => setHoveredBtn(h ? "novo" : null)}
              onClick={() => setNovoAtendimentoOpen(true)}
              variant="primary"
            />
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "16px 24px 16px", position: "relative" }}>
        {viewMode === "kanban" && (
          <KanbanView
            atendimentos={displayedAtendimentos}
            onOpenAtendimento={onOpenAtendimento}
            onEdit={setEditAtendimentoId}
          />
        )}
        {viewMode === "gantt" && (
          <GanttView
            atendimentos={displayedAtendimentos}
            onOpenAtendimento={onOpenAtendimento}
            onEdit={setEditAtendimentoId}
          />
        )}
        {viewMode === "list" && (
        /* Table Card — flex column, fills space, clips overflow */
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
          background: "#fff", border: `1px solid ${c.border}`, borderRadius: 16,
          boxShadow: "0 0 10px 0 rgba(40,41,61,0.06)", overflow: "hidden",
        }}>

          {/* ── Scrollable table (both axes) ── */}
          <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {demo.loadingTable ? <LoadingSkeleton /> : (demo.emptyQueue || displayedAtendimentos.length === 0) ? <EmptyState /> : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
              <thead>
                <tr style={{ background: "#fafbfd", position: "sticky", top: 0, zIndex: 3 }}>
                  {(() => {
                    const slaCol = { label: "SLA", column: "sla", sort: true, onClick: () => setSortModalOpen("sla"), active: effectiveSortConfig?.column === "sla" };
                    return [
                      { label: "ID" },
                      // No modo SLA, SLA vai pra 2ª coluna (logo após ID) e some do final
                      ...(isSlaMode ? [slaCol] : []),
                      { label: "Nome" },
                      ...(isSlaMode ? [
                        { label: "Operação" },
                        { label: "Fila" },
                      ] : []),
                      { label: "Data início",       column: "dataInicio",      sort: true, onClick: () => setSortModalOpen("dataInicio"),      active: effectiveSortConfig?.column === "dataInicio" },
                      { label: "Data atualização",  column: "dataAtualizacao", sort: true, onClick: () => setSortModalOpen("dataAtualizacao"), active: effectiveSortConfig?.column === "dataAtualizacao" },
                      { label: "Marcadores",        column: "marcador",        sort: true, onClick: () => setSortModalOpen("marcador"),        active: effectiveSortConfig?.column === "marcador" },
                      { label: "Contatos" },
                      { label: "Atendentes" },
                      { label: "Conversas" },
                      { label: "Status" },
                      ...(isSlaMode ? [] : [slaCol]),
                      { label: "Ações", sticky: true },
                    ];
                  })().map(({ label, sort, sticky, onClick, active }) => (
                    <th key={label}
                      onClick={onClick}
                      style={{
                        textAlign: "left", padding: "14px 16px", fontSize: 11,
                        fontWeight: 700,
                        color: active ? c.primary : c.fg2,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                        borderBottom: `1px solid ${c.border}`,
                        background: active ? c.primaryLightest : "#fafbfd",
                        whiteSpace: "nowrap",
                        cursor: onClick ? "pointer" : "default",
                        userSelect: "none",
                        transition: "background 150ms ease, color 150ms ease",
                        ...(sticky ? { position: "sticky", right: 0, zIndex: 4 } : {}),
                      }}>
                      {sticky && (
                        <div style={{
                          position: "absolute", top: 0, bottom: 0, right: "100%", width: 20,
                          background: "linear-gradient(to right, transparent, rgba(40,41,61,0.12))",
                          pointerEvents: "none",
                        }} />
                      )}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {label}
                        {sort && (
                          <i
                            className={`ph ${active
                              ? (effectiveSortConfig?.direction === "asc" ? "ph-arrow-up" : "ph-arrow-down")
                              : "ph-arrows-down-up"}`}
                            style={{ fontSize: 11, opacity: active ? 1 : 0.5 }}
                          />
                        )}
                        {active && (
                          <span style={{
                            background: c.primary, color: "#fff",
                            fontSize: 8, fontWeight: 700, padding: "1px 6px",
                            borderRadius: 999, marginLeft: 4,
                            textTransform: "uppercase", letterSpacing: "0.05em",
                          }}>{effectiveSortConfig?.mode === "all" ? "todos" : "página"}</span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedAtendimentos.map(a => {
                  const sc = statusColor(a.status);
                  const sl = a.slaTag ? slaColor(a.slaTag) : null;
                  const slaTd = (
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      {sl ? (
                        <span style={{
                          background: sl.bg, color: sl.fg, fontSize: 11, fontWeight: 700,
                          padding: "3px 10px", borderRadius: 999,
                        }}>{a.slaTag}</span>
                      ) : "-"}
                    </td>
                  );
                  return (
                    <tr key={a.id} style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: c.fg1, fontWeight: 500, whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          {iaTransferredIds.has(a.id) && (
                            <IaTransferredBadge />
                          )}
                          {a.id}
                        </span>
                      </td>
                      {isSlaMode && slaTd}
                      <td style={{ padding: "12px 16px", fontSize: 13, color: c.fg1, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.titulo.split("—")[0].trim()}</td>
                      {isSlaMode && (() => {
                        const chain = window.CCM.queueChainForAtendimento(a.id, D.queues);
                        const op = chain?.operacao;
                        const fl = chain?.fila;
                        return (
                          <React.Fragment>
                            <td style={{ padding: "12px 16px", fontSize: 12, color: c.fg1, whiteSpace: "nowrap" }}>
                              {op ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 14 }}>{op.icon}</span>
                                  <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{op.name}</span>
                                </span>
                              ) : "—"}
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: 12, color: c.fg1, whiteSpace: "nowrap" }}>
                              {fl ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 14 }}>{fl.icon}</span>
                                  <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{fl.name}</span>
                                </span>
                              ) : "—"}
                            </td>
                          </React.Fragment>
                        );
                      })()}
                      <td style={{ padding: "12px 16px", fontSize: 12, color: c.fg2, whiteSpace: "nowrap" }}>{a.dataInicio}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: c.fg2, whiteSpace: "nowrap" }}>{getDataAtualizacao(a)}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: c.fg2, whiteSpace: "nowrap" }}>
                        {a.marcadores.length > 0 ? (
                          <span style={{
                            background: a.marcadores[0].color + "14", color: a.marcadores[0].color,
                            fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
                          }}>{a.marcadores[0].label.length > 10 ? a.marcadores[0].label.slice(0, 10) + "…" : a.marcadores[0].label}</span>
                        ) : "-"}
                      </td>
                      <td style={{ padding: "12px 16px" }}><AvatarStack list={a.contatos} extra={a.contatosExtra} /></td>
                      <td style={{ padding: "12px 16px" }}><AvatarStack list={a.atendentes} extra={a.atendentesExtra} /></td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: c.fg1, fontWeight: 600, whiteSpace: "nowrap" }}>
                        {Array.isArray(a.conversas) ? a.conversas.length || 13 : a.conversas}
                      </td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        <span
                          data-status-dd="1"
                          onClick={e => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setStatusDd({
                              id: a.id,
                              pos: { top: rect.bottom + 6, left: rect.left },
                            });
                          }}
                          style={{
                            background: sc.bg, color: sc.fg, fontSize: 11, fontWeight: 600,
                            padding: "3px 10px", borderRadius: 999, cursor: "pointer",
                            display: "inline-flex", alignItems: "center", gap: 4,
                          }}
                        >
                          {a.status}
                          <i className="ph ph-caret-down" style={{ fontSize: 10, opacity: 0.7 }} />
                        </span>
                      </td>
                      {!isSlaMode && slaTd}
                      <td style={{
                        padding: "12px 16px",
                        position: "sticky", right: 0, zIndex: 1,
                        background: "#fff",
                      }}>
                        <div style={{
                          position: "absolute", top: 0, bottom: 0, right: "100%", width: 20,
                          background: "linear-gradient(to right, transparent, rgba(40,41,61,0.12))",
                          pointerEvents: "none",
                        }} />
                        <div style={{ display: "flex", gap: 6 }}>
                          <CCMTooltip label="Visualizar">
                            <button onClick={() => onOpenAtendimento(a.id)} aria-label="Visualizar"
                              style={{
                                width: 28, height: 28, borderRadius: 8, border: 0,
                                background: "transparent", color: c.fg2, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = c.primaryLightest; e.currentTarget.style.color = c.primary; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.fg2; }}>
                              <i className="ph ph-eye" style={{ fontSize: 16 }} />
                            </button>
                          </CCMTooltip>
                          {/* Estrela de favorito — laranja quando marcado, cinza no resto */}
                          <CCMTooltip label={favoritedIds.has(a.id) ? "Remover dos favoritos" : "Marcar como favorito"}>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(a.id); }}
                              aria-label={favoritedIds.has(a.id) ? "Remover dos favoritos" : "Marcar como favorito"}
                              style={{
                                width: 28, height: 28, borderRadius: 8, border: 0,
                                background: "transparent",
                                color: favoritedIds.has(a.id) ? "#f5a623" : c.fg2,
                                cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background 120ms ease, color 120ms ease",
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = favoritedIds.has(a.id) ? "#fff4e0" : c.primaryLightest;
                                if (!favoritedIds.has(a.id)) e.currentTarget.style.color = "#f5a623";
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = favoritedIds.has(a.id) ? "#f5a623" : c.fg2;
                              }}
                            >
                              <i className={`ph${favoritedIds.has(a.id) ? "-fill" : ""} ph-star`} style={{ fontSize: 16 }} />
                            </button>
                          </CCMTooltip>
                          <CCMTooltip label="Editar">
                            <button onClick={() => setEditAtendimentoId(a.id)} aria-label="Editar"
                              style={{
                                width: 28, height: 28, borderRadius: 8, border: 0,
                                background: "transparent", color: c.fg2, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = c.primaryLightest; e.currentTarget.style.color = c.primary; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.fg2; }}>
                              <i className="ph ph-pencil-simple" style={{ fontSize: 16 }} />
                            </button>
                          </CCMTooltip>
                          <CCMTooltip label="Ações">
                            <button
                              data-row-menu="1"
                              aria-label="Ações"
                              onClick={e => {
                                e.stopPropagation();
                                if (openMenuId === a.id) { setOpenMenuId(null); return; }
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                setOpenMenuId(a.id);
                              }}
                              style={{
                                width: 28, height: 28, borderRadius: 8, border: 0,
                                background: openMenuId === a.id ? c.primaryLightest : "transparent",
                                color: openMenuId === a.id ? c.primary : c.fg2,
                                cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}
                              onMouseEnter={e => { if (openMenuId !== a.id) { e.currentTarget.style.background = c.primaryLightest; e.currentTarget.style.color = c.primary; } }}
                              onMouseLeave={e => { if (openMenuId !== a.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.fg2; } }}
                            >
                              <i className="ph ph-tag" style={{ fontSize: 14 }} />
                            </button>
                          </CCMTooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>

          {/* ── Pagination — always visible, never inside scroll ── */}
          <div style={{
            padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: 12, color: c.fg2, borderTop: `1px solid ${c.borderSoft}`, flexShrink: 0,
            background: "#fff",
          }}>
            <span>{D.atendimentos.length}/{D.atendimentos.length} itens</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <i className="ph ph-caret-left" style={{ fontSize: 14, cursor: "pointer" }} />
              <span style={{ color: c.fg1, fontWeight: 600 }}>1</span>
              <i className="ph ph-caret-right" style={{ fontSize: 14, cursor: "pointer" }} />
              <span style={{
                border: `1px solid ${c.border}`, borderRadius: 8, padding: "2px 8px",
                display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer",
              }}>10 <i className="ph ph-caret-down" style={{ fontSize: 10 }} /></span>
              <span>página 01 de 01</span>
            </div>
          </div>

        </div>
        )}
      </div>

      {/* Row actions menu — fixed position to escape table overflow */}
      {openMenuId && (
        <RowActionsMenu
          pos={menuPos}
          onClose={() => setOpenMenuId(null)}
          onNovaConversa={() => { setOpenMenuId(null); setNovaConversaOpen(true); }}
          onTrocarStatus={(rect) => {
            // Position dropdown to the LEFT of the menu item, vertically aligned
            setStatusDd({
              id: openMenuId,
              pos: { top: rect.top, right: window.innerWidth - rect.left + 8 },
            });
          }}
        />
      )}

      {/* Status dropdown — opened from status cell or RowActionsMenu */}
      {statusDd && (
        <StatusDropdown
          pos={statusDd.pos}
          current={statusOverrides[statusDd.id] || D.atendimentos.find(a => a.id === statusDd.id)?.status}
          onClose={() => setStatusDd(null)}
          onSelect={(newStatus) => {
            setStatusOverrides(prev => ({ ...prev, [statusDd.id]: newStatus }));
            setStatusDd(null);
            setOpenMenuId(null);
          }}
        />
      )}

      {/* Nova conversa modal */}
      {novaConversaOpen && (
        <NovaConversaModal onClose={() => setNovaConversaOpen(false)} />
      )}

      {/* Novo atendimento modal */}
      {novoAtendimentoOpen && (
        <AtendimentoFormModal mode="novo" onClose={() => setNovoAtendimentoOpen(false)} />
      )}

      {/* Editar atendimento modal */}
      {editAtendimentoId && (
        <AtendimentoFormModal mode="editar" atendimentoId={editAtendimentoId} onClose={() => setEditAtendimentoId(null)} />
      )}

      {/* Filtros avançados — drawer at section level, covers local header too */}
      {filtersOpen && <FiltersPanel onClose={() => setFiltersOpen(false)} />}

      {/* Modal de ordenação — serve às 4 colunas: marcador, dataInicio, dataAtualizacao, sla */}
      {sortModalOpen && (
        <ColumnSortModal
          column={sortModalOpen}
          currentMode={effectiveSortConfig?.column === sortModalOpen ? effectiveSortConfig.mode : null}
          currentDirection={effectiveSortConfig?.column === sortModalOpen ? effectiveSortConfig.direction : DEFAULT_SORT_DIRECTION[sortModalOpen]}
          onClose={() => setSortModalOpen(null)}
          onConfirm={(result) => {
            if (!result) {
              setSortConfig(null);
            } else {
              setSortConfig({ column: sortModalOpen, mode: result.mode, direction: result.direction });
            }
            setSortModalOpen(null);
          }}
        />
      )}

      {/* Confirmação: transferir atendimentos por I.A. */}
      {iaModalOpen && (
        <IaTransferConfirmModal
          onClose={() => setIaModalOpen(false)}
          onConfirm={handleConfirmIA}
        />
      )}

      {/* Snackbar de sucesso após transferência por I.A. */}
      {iaSnack && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: "#28293d", color: "#fff",
          padding: "12px 22px", borderRadius: 10,
          fontFamily: "Montserrat, sans-serif", fontSize: 13, fontWeight: 500,
          boxShadow: "0 8px 24px rgba(40,41,61,0.32)",
          zIndex: 10000,
          display: "flex", alignItems: "center", gap: 10,
          animation: "ccmFadeIn 220ms ease",
        }}>
          <i className="ph-fill ph-brain" style={{ fontSize: 16, color: "#b699ff" }} />
          {iaSnack}
        </div>
      )}
    </section>
  );
};

// ─────────────────────────────────────────────
// IaTransferredBadge — chip-ícone "transferido por I.A." na linha
// (tooltip via CCMTooltip)
// ─────────────────────────────────────────────
const IaTransferredBadge = () => {
  const c = window.CCM.c;
  return (
    <CCMTooltip label="Esse atendimento foi transferido por I.A.">
      <span
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 20, height: 20, borderRadius: 6,
          background: c.primaryLightest, color: c.primary,
          flexShrink: 0, cursor: "help",
        }}
        aria-label="Transferido por I.A."
      >
        <i className="ph-fill ph-brain" style={{ fontSize: 12 }} />
      </span>
    </CCMTooltip>
  );
};

// ─────────────────────────────────────────────
// IaTransferConfirmModal — confirmação de atribuição automática por I.A.
// ─────────────────────────────────────────────
const IaTransferConfirmModal = ({ onClose, onConfirm }) => {
  const c = window.CCM.c;

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(40,41,61,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", width: "100%", maxWidth: 420,
          borderRadius: 16, boxShadow: "0 20px 50px rgba(40,41,61,0.30)",
          padding: "28px 28px 22px",
          textAlign: "center",
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: c.primaryLightest, color: c.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 14px",
        }}>
          <i className="ph-fill ph-brain" style={{ fontSize: 22 }} />
        </div>

        <div style={{ fontSize: 17, fontWeight: 700, color: c.fg1, marginBottom: 12, lineHeight: 1.35 }}>
          Atribuição automática de fila por I.A.
        </div>

        <div style={{ fontSize: 13, color: c.fg2, lineHeight: 1.55, marginBottom: 22 }}>
          Deseja realmente ativar a atribuição automática de filas por Inteligência Artificial?
          Ao clicar em <strong>"Sim, atribuir"</strong>, o sistema analisará o conteúdo das conversas e
          direcionará automaticamente cada atendimento para a fila com o contexto mais adequado.
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: `1px solid ${c.border}`, background: "#fff",
              color: c.fg1, fontWeight: 600, fontSize: 13,
              cursor: "pointer", padding: "10px 22px", borderRadius: 8,
              fontFamily: "Montserrat, sans-serif", flex: 1,
            }}
          >Cancelar</button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              border: 0, background: c.primary, color: "#fff",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              padding: "10px 22px", borderRadius: 8,
              fontFamily: "Montserrat, sans-serif", flex: 1,
              boxShadow: "0 2px 6px rgba(146,64,255,0.30)",
            }}
          >Sim, atribuir</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─────────────────────────────────────────────
// NovaConversaModal
// ─────────────────────────────────────────────
const COMPOSE_CHANNELS = [
  { id: "nota",    label: "Nota interna",  icon: "ph-note-pencil",      bg: "#fffbf2" },
  { id: "whatsapp",label: "WhatsApp",      icon: "ph-whatsapp-logo",    bg: "#fff" },
  { id: "waweb",   label: "WhatsApp Web",  icon: "ph-monitor",          bg: "#fff" },
  { id: "sms",     label: "SMS",           icon: "ph-device-mobile",    bg: "#fff" },
  { id: "torpedo", label: "Torpedo",       icon: "ph-paper-plane-tilt", bg: "#fff" },
  { id: "email",   label: "E-mail",        icon: "ph-envelope",         bg: "#fff" },
  { id: "rcs",     label: "RCS",           icon: "ph-chat-dots",        bg: "#fff" },
];

const NovaConversaModal = ({ onClose }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const [query, setQuery] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const [selected, setSelected] = React.useState(null);
  const [composeMode, setComposeMode] = React.useState(false);
  const [activeChannel, setActiveChannel] = React.useState("nota");
  const [message, setMessage] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => { inputRef.current?.focus(); }, []);
  React.useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const allContacts = Object.values(D.contacts);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allContacts.filter(ct =>
      ct.name.toLowerCase().includes(q) ||
      ct.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
      ct.email.toLowerCase().includes(q) ||
      ct.cpf.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
    );
  }, [query]);

  const dropdownVisible = (focused || query.trim().length > 0) && query.trim().length > 0 && !selected;

  // Contacts with mock history (c1=Ricardo, c2=Camila)
  const hasHistory = selected && (selected.id === "c1" || selected.id === "c2");
  const mockRows = hasHistory ? [
    { data: "05/03/2024 às 7:16",  nome: selected.name, cpf: selected.cpf, telefone: selected.phone, email: selected.email },
    { data: "18/01/2024 às 14:30", nome: selected.name, cpf: selected.cpf, telefone: selected.phone, email: selected.email },
  ] : [];

  const showCompose = selected && (!hasHistory || composeMode);
  const channel = COMPOSE_CHANNELS.find(ch => ch.id === activeChannel) || COMPOSE_CHANNELS[0];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "#fff", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60,
        borderBottom: `1px solid ${c.border}`, flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          display: "flex", alignItems: "center", gap: 10,
          border: 0, background: "transparent", cursor: "pointer",
          fontFamily: "Montserrat, sans-serif", fontSize: 16, fontWeight: 700, color: c.fg1, padding: 0,
        }}>
          <i className="ph ph-arrow-left" style={{ fontSize: 20 }} />
          Nova mensagem
        </button>
        <button onClick={onClose} style={{
          width: 32, height: 32, borderRadius: 8, border: 0,
          background: "transparent", color: c.fg2, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <i className="ph ph-x" style={{ fontSize: 20 }} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          {/* Contato label */}
          <label style={{ fontSize: 13, fontWeight: 700, color: c.fg1, display: "block", marginBottom: 8 }}>
            Contato: <span style={{ color: "#f54336" }}>*</span>
          </label>

          {/* Search input — always visible */}
          {!selected && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              border: `1.5px solid ${focused ? c.secundaryPure : c.border}`,
              borderRadius: 10, padding: "10px 16px", background: "#fff",
              transition: "border-color 200ms ease",
            }}>
              <i className="ph ph-magnifying-glass" style={{ fontSize: 16, color: c.fg3, flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                placeholder="Busque por CPF, telefone ou e-mail"
                style={{
                  flex: 1, border: 0, outline: "none",
                  fontFamily: "Montserrat, sans-serif", fontSize: 14, color: c.fg1,
                  background: "transparent",
                }}
              />
              {query && (
                <i className="ph ph-x" onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  style={{ fontSize: 16, color: c.fg3, cursor: "pointer", flexShrink: 0 }} />
              )}
            </div>
          )}

          {/* Results dropdown */}
          {dropdownVisible && (
            <div style={{
              marginTop: 4, background: "#fff",
              border: `1px solid ${c.border}`, borderRadius: 12,
              boxShadow: "0 8px 24px rgba(40,41,61,0.12)", overflow: "hidden",
            }}>
              <div style={{ padding: "12px 18px", fontSize: 12, color: c.fg2, borderBottom: `1px solid ${c.borderSoft}` }}>
                Resultados encontrados: {results.length}
              </div>
              {results.length === 0 ? (
                <div style={{ padding: "20px 18px", fontSize: 13, color: c.fg3, textAlign: "center" }}>
                  Nenhum contato encontrado
                </div>
              ) : results.map((ct, i) => (
                <div key={ct.id} onMouseDown={() => { setSelected(ct); setQuery(""); setFocused(false); }} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 18px", cursor: "pointer",
                  borderTop: i > 0 ? `1px solid ${c.borderSoft}` : "none",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = c.canvas}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{
                    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                    background: ct.bg, color: ct.fg, fontSize: 12, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{ct.initials}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: c.fg1, marginBottom: 4 }}>{ct.name}</div>
                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: c.fg2 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <i className="ph ph-phone" style={{ fontSize: 13 }} /> {ct.phone}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <i className="ph ph-envelope" style={{ fontSize: 13 }} /> {ct.email}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: c.fg3, flexShrink: 0 }}>CPF: {ct.cpf}</span>
                </div>
              ))}
              <div style={{ padding: "12px 18px", borderTop: `1px solid ${c.borderSoft}` }}>
                <button style={{
                  display: "flex", alignItems: "center", gap: 8,
                  height: 38, padding: "0 18px", borderRadius: 999, border: 0,
                  background: c.primary, color: "#fff", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "Montserrat, sans-serif",
                  boxShadow: "0 2px 8px rgba(146,64,255,0.25)",
                }}>
                  <i className="ph ph-plus" style={{ fontSize: 14 }} /> Novo contato
                </button>
              </div>
            </div>
          )}

          {/* Selected contact — full card */}
          {selected && (
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "16px 20px", borderRadius: 12,
              border: `1px solid ${c.border}`, background: "#fff",
              marginBottom: hasHistory && !composeMode ? 24 : 0,
            }}>
              <span style={{
                width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                background: selected.bg, color: selected.fg,
                fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{selected.initials}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: c.fg1, marginBottom: 5 }}>{selected.name}</div>
                <div style={{ display: "flex", gap: 20, fontSize: 13, color: c.fg2 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <i className="ph ph-phone" style={{ fontSize: 14 }} /> {selected.phone}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <i className="ph ph-envelope" style={{ fontSize: 14 }} /> {selected.email}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 13, color: c.fg2, flexShrink: 0 }}>CPF: {selected.cpf}</span>
              <i className="ph ph-x"
                onClick={() => { setSelected(null); setComposeMode(false); setMessage(""); setTimeout(() => inputRef.current?.focus(), 50); }}
                style={{ fontSize: 16, color: c.fg3, cursor: "pointer", marginLeft: 8, flexShrink: 0 }} />
            </div>
          )}

          {/* Conversation history table */}
          {selected && hasHistory && !composeMode && (
            <div style={{ background: "#fff", border: `1px solid ${c.border}`, borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#fafbfd", borderBottom: `1px solid ${c.border}` }}>
                    {["Data de criação", "Nome", "CPF", "Telefone", "E-mail", ""].map(col => (
                      <th key={col} style={{
                        padding: "12px 16px", textAlign: "left",
                        fontSize: 11, fontWeight: 700, color: c.fg2,
                        textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap",
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockRows.map((row, i) => (
                    <tr key={i} style={{
                      borderBottom: i < mockRows.length - 1 ? `1px solid ${c.borderSoft}` : "none",
                      background: i === 0 ? "#f0f7fd" : "#fff",
                    }}>
                      <td style={{ padding: "14px 16px", fontWeight: i === 0 ? 700 : 400, color: c.fg1, whiteSpace: "nowrap" }}>{row.data}</td>
                      <td style={{ padding: "14px 16px", color: c.fg1 }}>{row.nome}</td>
                      <td style={{ padding: "14px 16px", color: c.fg2 }}>{row.cpf.replace(/\D/g, "")}</td>
                      <td style={{ padding: "14px 16px", color: c.fg1, fontWeight: 700 }}>{row.telefone.replace(/\D/g, "")}</td>
                      <td style={{ padding: "14px 16px", color: c.fg2 }}>{row.email}</td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <i className="ph ph-chats-circle" style={{ fontSize: 18, color: c.fg3, cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.color = c.primary}
                          onMouseLeave={e => e.currentTarget.style.color = c.fg3} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty hint */}
          {!selected && !dropdownVisible && (
            <div style={{ marginTop: 60, textAlign: "center", color: c.fg3, fontSize: 13 }}>
              Preencha os dados do contato para selecionar o canal de envio
            </div>
          )}
        </div>
      </div>

      {/* ── Compose area (channel tabs + textarea) ── */}
      {showCompose && (
        <div style={{ borderTop: `1px solid ${c.border}`, flexShrink: 0, background: "#fff" }}>
          {/* Channel tabs */}
          <div style={{
            display: "flex", alignItems: "center", gap: 20,
            padding: "0 24px", height: 40, borderBottom: `1px solid ${c.border}`,
            overflowX: "auto",
          }}>
            {COMPOSE_CHANNELS.map(ch => {
              const active = activeChannel === ch.id;
              return (
                <div key={ch.id} onClick={() => setActiveChannel(ch.id)} style={{
                  position: "relative", height: 40, display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                  color: active ? c.primary : c.fg1,
                  flexShrink: 0,
                  transition: "color 150ms ease",
                }}>
                  <i className={`ph ${ch.icon}`} style={{ fontSize: 14 }} />
                  {ch.label}
                  {active && (
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2, background: c.primary }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Textarea */}
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            style={{
              width: "100%", minHeight: 180, maxHeight: 260,
              border: 0, outline: "none", resize: "none",
              background: channel.bg,
              fontFamily: "Montserrat, sans-serif", fontSize: 14, color: c.fg1,
              padding: "16px 24px", boxSizing: "border-box",
              lineHeight: 1.6,
            }}
          />

          {/* Bottom bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 24px 12px",
            borderTop: `1px solid ${c.borderSoft}`,
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{
                width: 32, height: 32, borderRadius: 8, border: 0,
                background: "transparent", color: c.fg3, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <i className="ph ph-paperclip" style={{ fontSize: 18 }} />
              </button>
              <button style={{
                width: 32, height: 32, borderRadius: 8, border: 0,
                background: "transparent", color: c.fg3, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <i className="ph ph-smiley" style={{ fontSize: 18 }} />
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {activeChannel !== "nota" && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  border: `1px solid ${c.border}`, borderRadius: 999, padding: "5px 12px",
                  fontSize: 12, color: c.fg1,
                }}>
                  <i className={`ph ${channel.icon}`} style={{ fontSize: 13 }} />
                  {channel.label} <i className="ph ph-caret-down" style={{ fontSize: 11 }} />
                </span>
              )}
              <span style={{ fontSize: 11, color: c.fg3 }}>{1024 - message.length}</span>
              <button style={{
                width: 34, height: 34, borderRadius: "50%", border: 0,
                background: c.primary, color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 6px rgba(146,64,255,0.30)",
              }}>
                <i className="ph ph-paper-plane-tilt" style={{ fontSize: 16 }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer — no contact selected */}
      {!selected && (
        <div style={{
          padding: "14px 32px", borderTop: `1px solid ${c.border}`,
          fontSize: 13, color: c.fg3, textAlign: "center", flexShrink: 0,
        }}>
          Preencha os dados do contato para selecionar o canal de envio
        </div>
      )}

      {/* Footer — has history, not in compose mode */}
      {selected && hasHistory && !composeMode && (
        <div style={{
          padding: "14px 32px", borderTop: `1px solid ${c.border}`,
          display: "flex", justifyContent: "flex-end", flexShrink: 0, background: "#fff",
        }}>
          <button onClick={() => setComposeMode(true)} style={{
            height: 40, padding: "0 24px", borderRadius: 12, border: 0,
            background: c.primary, color: "#fff", fontWeight: 600, fontSize: 13,
            cursor: "pointer", fontFamily: "Montserrat, sans-serif",
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 2px 8px rgba(146,64,255,0.30)",
          }}>
            <i className="ph ph-paper-plane-tilt" style={{ fontSize: 15 }} />
            Iniciar nova conversa
          </button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// RowActionsMenu — dropdown for the tag icon
// ─────────────────────────────────────────────
const RowActionsMenu = ({ pos, onClose, onNovaConversa, onTrocarStatus }) => {
  const c = window.CCM.c;
  const items = [
    {
      icon: "ph-check-square", label: "Trocar o status", arrow: true,
      action: (e) => { onTrocarStatus(e.currentTarget.getBoundingClientRect()); },
    },
    { icon: "ph-notepad",      label: "Transferir para outra fila",          arrow: false, action: onClose },
    { icon: "ph-plus",         label: "Nova conversa para esse atendimento", arrow: false, action: onNovaConversa },
  ];

  return (
    <div data-row-menu="1" style={{
      position: "fixed",
      top: pos.top,
      right: pos.right,
      zIndex: 9999,
      background: "#fff",
      borderRadius: 14,
      boxShadow: "0 8px 32px rgba(40,41,61,0.18)",
      minWidth: 260,
      padding: "6px 0",
      border: `1px solid ${c.border}`,
    }}>
      {items.map((item, i) => (
        <div
          key={i}
          onClick={item.action}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "13px 18px", cursor: "pointer",
            transition: "background 120ms ease",
          }}
          onMouseEnter={e => e.currentTarget.style.background = c.primaryLightest}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <i className={`ph ${item.icon}`} style={{ fontSize: 18, color: c.fg2 }} />
            <span style={{ fontSize: 14, color: c.fg1 }}>{item.label}</span>
          </div>
          {item.arrow && (
            <i className="ph ph-caret-right" style={{ fontSize: 14, color: c.fg3 }} />
          )}
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// StatusDropdown — pill list to change atendimento status
// ─────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "Em andamento", bg: "#fff4d1", fg: "#a8660a" },
  { value: "Cancelado",    bg: "#ffdde3", fg: "#c8362b" },
  { value: "Pausado",      bg: "#ffe4c4", fg: "#c45a0c" },
  { value: "Finalizado",   bg: "#d4f0e2", fg: "#2f7a32" },
];

const StatusDropdown = ({ pos, current, onSelect, onClose }) => {
  const c = window.CCM.c;

  React.useEffect(() => {
    const h = (e) => {
      if (e.target.closest("[data-status-dd]")) return;
      if (e.target.closest("[data-row-menu]")) return;
      onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div
      data-status-dd="1"
      style={{
        position: "fixed",
        top: pos.top,
        ...(pos.right != null ? { right: pos.right } : { left: pos.left }),
        zIndex: 10000,
        background: "#fff",
        borderRadius: 14,
        padding: "8px 0",
        boxShadow: "0 8px 32px rgba(40,41,61,0.18)",
        border: `1px solid ${c.border}`,
        minWidth: 180,
      }}
    >
      {STATUS_OPTIONS.map((opt) => {
        const isCurrent = current === opt.value;
        return (
          <div
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            style={{
              padding: "6px 14px", cursor: "pointer",
              background: isCurrent ? "#e8f3ff" : "transparent",
              transition: "background 120ms ease",
            }}
            onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = "#f5f7fb"; }}
            onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{
              display: "inline-block",
              background: opt.bg, color: opt.fg,
              fontSize: 12, fontWeight: 600,
              padding: "4px 14px", borderRadius: 999,
            }}>{opt.value}</span>
          </div>
        );
      })}
    </div>
  );
};

const AvatarStack = ({ list, extra }) => {
  if (!list?.length) return <span style={{ fontSize: 12, color: "#8F90A6" }}>-</span>;
  const visible = list.slice(0, 4);
  return (
    <div style={{ display: "flex" }}>
      {visible.map((p, i) => (
        <CCMTooltip key={i} label={p.name}>
          <span aria-label={p.name} style={{
            width: 26, height: 26, borderRadius: "50%",
            background: p.bg, color: p.fg, fontSize: 9, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #fff", marginLeft: i === 0 ? 0 : -8,
          }}>{p.initials}</span>
        </CCMTooltip>
      ))}
      {extra && (
        <span style={{
          width: 26, height: 26, borderRadius: "50%",
          background: "#9240FF", color: "#fff", fontSize: 9, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid #fff", marginLeft: -8,
        }}>+{extra}</span>
      )}
    </div>
  );
};

const SearchPreview = ({ query, onPick }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const q = query.trim();
  const isNumeric = /^\d/.test(q);
  const isText = q.length > 0 && !isNumeric;

  const highlight = (text, term) => {
    if (!term) return text;
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx < 0) return text;
    return (
      <React.Fragment>
        {text.slice(0, idx)}
        <span style={{ background: "#fff3a0", borderRadius: 3, padding: "0 2px" }}>{text.slice(idx, idx + term.length)}</span>
        {text.slice(idx + term.length)}
      </React.Fragment>
    );
  };

  // Empty: recents
  if (!q) {
    return (
      <div style={{
        position: "absolute", top: 50, left: 0, width: 560, zIndex: 20,
        background: "#fff", border: `1px solid ${c.border}`, borderRadius: 12,
        padding: 14, boxShadow: "0 4px 20px 0 rgba(0,0,0,0.12)",
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.fg2, marginBottom: 10 }}>Pesquisas recentes</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {D.recentSearches.map(r => (
            <span key={r} style={{
              fontSize: 12, color: c.fg1, padding: "6px 14px", borderRadius: 999,
              border: `1px solid ${c.border}`, cursor: "pointer",
            }}>{r}</span>
          ))}
        </div>
      </div>
    );
  }

  // Build contact matches
  let contacts;
  if (isNumeric) {
    contacts = [
      { ...D.contacts.ana, highlightField: "cpf" },
      { ...D.contacts.marcos, highlightField: "cpf" },
    ];
  } else {
    const lower = q.toLowerCase();
    contacts = Object.values(D.contacts).filter(ct => ct.name.toLowerCase().includes(lower));
    if (contacts.length === 0) contacts = [D.contacts.ana, D.contacts.marcos];
    contacts = contacts.map(ct => ({ ...ct, highlightField: "name" })).slice(0, 3);
  }

  return (
    <div style={{
      position: "absolute", top: 50, left: 0, width: 560, zIndex: 20,
      background: "#fff", border: `1px solid ${c.border}`, borderRadius: 12,
      padding: 14, boxShadow: "0 4px 20px 0 rgba(0,0,0,0.12)",
      maxHeight: 440, overflowY: "auto",
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: c.fg2, marginBottom: 10 }}>Resultados</div>

      <div onClick={() => onPick("123456")} style={{
        background: c.secundaryLightest, borderRadius: 10,
        padding: "12px 14px", marginBottom: 12, cursor: "pointer",
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: c.fg1, marginBottom: 4 }}>
          Atendimento {highlight("012345678", isNumeric ? q : "")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, color: c.fg2 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <i className="ph ph-user" /> {highlight("Flavia Silva", isText ? q : "")}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <i className="ph ph-envelope" /> flavia@email.com
          </span>
          <span style={{
            background: c.successLight, color: c.successDark,
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
          }}>Aberto</span>
        </div>
      </div>

      {contacts.map(ct => (
        <div key={ct.id} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 4px", borderTop: `1px solid ${c.borderSoft}`,
        }}>
          <span style={{
            width: 32, height: 32, borderRadius: "50%",
            background: ct.bg, color: ct.fg, fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>{ct.initials}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.fg1 }}>
              {isText ? highlight(ct.name, q) : ct.name}
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 11, color: c.fg2, marginTop: 3 }}>
              <span><i className="ph ph-phone" /> {isNumeric ? highlight(ct.phone, q) : ct.phone}</span>
              <span><i className="ph ph-envelope" /> {ct.email}</span>
              <span>CPF: {isNumeric ? highlight(ct.cpf, q) : ct.cpf}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// FiltersPanel — slides in from the RIGHT side
// ─────────────────────────────────────────────
const FiltersPanel = ({ onClose }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const [openDd, setOpenDd] = React.useState(null);
  const [ddRect, setDdRect] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [dateOpt, setDateOpt] = React.useState(null);
  const [statusF, setStatusF] = React.useState([]);
  const [slaF, setSlaF] = React.useState([]);
  const [iaF, setIaF] = React.useState([]);
  const [marcF, setMarcF] = React.useState([]);

  // Lista única de marcadores presentes nos dados (pra montar as opções do dropdown).
  // No Angular: virá do endpoint /markers (cache local). label + color.
  const MARC_LIST = React.useMemo(() => {
    const seen = new Map();
    for (const a of D.atendimentos || []) {
      for (const m of a.marcadores || []) {
        if (!seen.has(m.label)) seen.set(m.label, m);
      }
    }
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [D.atendimentos]);

  const toggle = (arr, setArr, v) =>
    setArr(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const handleTrigger = (id, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (openDd === id) { setOpenDd(null); return; }
    setSearch("");
    setDdRect({ top: rect.bottom + 2, left: rect.left, width: rect.width });
    setOpenDd(id);
  };

  const getOptions = () => {
    const s = search.toLowerCase();
    const f = arr => s ? arr.filter(o => o.l.toLowerCase().includes(s)) : arr;
    if (openDd === "data") return f([
      { v: "hoje",   l: "Hoje" },
      { v: "7d",     l: "Últimos 7 dias" },
      { v: "30d",    l: "30 dias" },
      { v: "60d",    l: "60 dias" },
      { v: "90d",    l: "90 dias" },
      { v: "custom", l: "Personalizado" },
    ]);
    if (openDd === "status") return f([
      { v: "todos",      l: "Todos" },
      { v: "andamento",  l: "Em andamento" },
      { v: "finalizado", l: "Finalizado" },
    ]);
    if (openDd === "atend") {
      const names = [...new Set(Object.values(D.contacts).concat([D.attendant]).map(p => p.name))];
      return f(names.map(n => ({ v: n, l: n })));
    }
    if (openDd === "sla") return f([
      { v: "todos",   l: "Todos" },
      { v: "ok",      l: "Em andamento",     color: "#4eaf51", bg: "#e6f3e5" },
      { v: "proximo", l: "Próximo ao prazo", color: "#f99f18", bg: "#fff3e0" },
      { v: "atras",   l: "Atrasado",         color: "#f54336", bg: "#ffdde3" },
    ]);
    if (openDd === "ia") return f([
      { v: "todos", l: "Todos" },
      { v: "sim",   l: "Redirecionado por I.A.",     color: "#3a8fb9", bg: "#e8f7ff" },
      { v: "nao",   l: "Não redirecionado por I.A.", color: "#f54336", bg: "#ffdde3" },
    ]);
    if (openDd === "marc") return f(MARC_LIST.map(m => ({
      v: m.label, l: m.label, color: m.color, bg: m.color + "1A",
    })));
    return [];
  };

  const isChecked = v => {
    if (openDd === "data")   return dateOpt === v;
    if (openDd === "status") return statusF.includes(v);
    if (openDd === "sla")    return slaF.includes(v);
    if (openDd === "ia")     return iaF.includes(v);
    if (openDd === "marc")   return marcF.includes(v);
    return false;
  };

  const handleSelect = v => {
    if (openDd === "data")   { setDateOpt(v); return; }
    if (openDd === "status") { toggle(statusF, setStatusF, v); return; }
    if (openDd === "sla")    { toggle(slaF, setSlaF, v); return; }
    if (openDd === "ia")     { toggle(iaF, setIaF, v); return; }
    if (openDd === "marc")   { toggle(marcF, setMarcF, v); return; }
  };

  React.useEffect(() => {
    if (!openDd) return;
    const h = e => { if (!e.target.closest("[data-fp]")) setOpenDd(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [openDd]);

  const TRIGGERS = [
    { id: "data",   label: "Data de início" },
    { id: "status", label: "Status do atendimento" },
    { id: "atend",  label: "Atendentes" },
    { id: "sla",    label: "SLA" },
    { id: "marc",   label: "Marcadores" },
    { id: "ia",     label: "Redirecionamento por I.A." },
  ];

  const options = getOptions();
  const isRadio = openDd === "data";

  return (
    <div data-fp="1" style={{
      position: "absolute", right: 0, top: 0, bottom: 0, width: 396,
      background: "#fff", zIndex: 20,
      boxShadow: "-4px 0 20px rgba(40,41,61,0.14)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      borderRadius: "0 0 0 16px",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 20px", borderBottom: `1px solid ${c.border}`, flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          width: 30, height: 30, border: 0, background: "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8, color: c.fg2,
        }}>
          <i className="ph ph-arrow-left" style={{ fontSize: 16 }} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, color: c.fg1 }}>Filtros avançados</span>
        <button onClick={onClose} style={{
          marginLeft: "auto", width: 28, height: 28, border: 0, background: "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8, color: c.fg3,
        }}>
          <i className="ph ph-x" style={{ fontSize: 14 }} />
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 16px" }}>
        {/* Search inputs */}
        {["Pesquisar ID do atendimento", "Pesquisar nome do atendimento", "Pesquisar contato"].map(ph => (
          <div key={ph} style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
            border: `1px solid ${c.border}`, borderRadius: 8, padding: "8px 12px", background: "#fff",
          }}>
            <i className="ph ph-magnifying-glass" style={{ fontSize: 14, color: c.fg3, flexShrink: 0 }} />
            <input placeholder={ph} style={{
              flex: 1, border: 0, outline: "none", fontFamily: "Montserrat, sans-serif",
              fontSize: 13, color: c.fg1, background: "transparent",
            }} />
          </div>
        ))}

        {/* Select triggers */}
        {TRIGGERS.map(({ id, label }) => {
          const isOpen = openDd === id;
          return (
            <div key={id} style={{ marginTop: 8 }}>
              <div
                onClick={e => handleTrigger(id, e)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "9px 12px", cursor: "pointer", userSelect: "none",
                  border: `1px solid ${isOpen ? c.primary : c.border}`, borderRadius: 8,
                  background: isOpen ? "#f7f5ff" : "#fff",
                  boxShadow: isOpen ? `0 0 0 3px ${c.primaryLight}` : "none",
                }}
              >
                <span style={{ fontSize: 13, color: isOpen ? c.primary : c.fg2 }}>{label}</span>
                <i className={`ph ${isOpen ? "ph-caret-up" : "ph-caret-down"}`}
                  style={{ fontSize: 13, color: isOpen ? c.primary : c.fg3 }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating popover — position:fixed escapes overflow:hidden */}
      {openDd && ddRect && (
        <div data-fp="1" style={{
          position: "fixed",
          top: ddRect.top, left: ddRect.left, width: ddRect.width,
          zIndex: 9999,
          background: "#fff",
          border: `1px solid ${c.border}`,
          borderRadius: 10,
          boxShadow: "0 8px 24px rgba(40,41,61,0.16)",
          overflow: "hidden",
          maxHeight: 280, overflowY: "auto",
        }}>
          {/* Sticky search bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
            borderBottom: `1px solid ${c.borderSoft}`,
            position: "sticky", top: 0, background: "#fff", zIndex: 1,
          }}>
            <i className="ph ph-magnifying-glass" style={{ fontSize: 13, color: c.fg3 }} />
            <input
              autoFocus
              placeholder="Pesquisar"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, border: 0, outline: "none",
                fontFamily: "Montserrat, sans-serif", fontSize: 13,
                background: "transparent", color: c.fg1,
              }}
            />
          </div>
          {/* Options */}
          {options.map(o => {
            const checked = isChecked(o.v);
            return (
              <div key={o.v} onClick={() => handleSelect(o.v)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 14px",
                cursor: "pointer", userSelect: "none",
                background: checked ? (o.bg || (isRadio ? "#e8f7ff" : "#f7f5ff")) : "transparent",
              }}>
                {isRadio ? (
                  <span style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${checked ? c.secundaryPure : c.border}`,
                    background: checked ? c.secundaryPure : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {checked && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                  </span>
                ) : (
                  <span style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${checked ? c.primary : c.border}`,
                    background: checked ? c.primary : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {checked && <i className="ph ph-check" style={{ fontSize: 11, color: "#fff" }} />}
                  </span>
                )}
                {o.color ? (
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 999,
                    background: o.bg || "#eee", color: o.color,
                  }}>{o.l}</span>
                ) : (
                  <span style={{ fontSize: 13, color: c.fg1 }}>{o.l}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// LoadingSkeleton — placeholder rows for ?demo=loading
// ─────────────────────────────────────────────
const LoadingSkeleton = () => {
  const c = window.CCM.c;
  const Row = () => (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      padding: "16px 20px", borderBottom: `1px solid ${c.borderSoft}`,
    }}>
      {[60, 140, 90, 80, 110, 110, 50, 60, 50, 70].map((w, i) => (
        <div key={i} style={{
          width: w, height: 14, borderRadius: 6,
          background: "linear-gradient(90deg, #eef0f4 0%, #f6f7fa 50%, #eef0f4 100%)",
          backgroundSize: "200% 100%",
          animation: "ccmShimmer 1.4s ease-in-out infinite",
        }} />
      ))}
    </div>
  );
  return (
    <div>
      <style>{`@keyframes ccmShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      {[...Array(8)].map((_, i) => <Row key={i} />)}
    </div>
  );
};

// ─────────────────────────────────────────────
// EmptyState — shown when ?demo=empty (no atendimentos in selected queue)
// ─────────────────────────────────────────────
const EmptyState = () => {
  const c = window.CCM.c;
  return (
    <div style={{
      flex: 1, height: "100%",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 48, textAlign: "center",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: c.primaryLightest, color: c.primary,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 18,
      }}>
        <i className="ph ph-tray" style={{ fontSize: 32 }} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: c.fg1, marginBottom: 6 }}>
        Nenhum atendimento nesta fila
      </div>
      <div style={{ fontSize: 13, color: c.fg2, maxWidth: 320, lineHeight: 1.5 }}>
        Quando chegarem novos atendimentos para esta fila, eles aparecerão aqui.
      </div>
      <button style={{
        marginTop: 18, height: 38, padding: "0 18px", borderRadius: 999, border: 0,
        background: c.primary, color: "#fff", fontWeight: 600, fontSize: 13,
        cursor: "pointer", fontFamily: "Montserrat, sans-serif",
        display: "inline-flex", alignItems: "center", gap: 8,
        boxShadow: "0 2px 6px rgba(146,64,255,0.30)",
      }}>
        <i className="ph ph-plus" style={{ fontSize: 14 }} />
        Criar atendimento manualmente
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// ColumnSortModal — escolhe o escopo (página/todos) ao ordenar uma coluna.
// Reusado pelas 3 colunas ordenáveis: "marcador", "dataInicio", "dataAtualizacao".
// O conteúdo (título, ícone, ações) é parametrizado por COLUMN_SORT_CONFIG.
// ─────────────────────────────────────────────
const COLUMN_SORT_CONFIG = {
  marcador: {
    icon: "ph-tag",
    modalTitle: "Ordenar por marcadores",
    description: "Escolha o escopo do agrupamento. A ordenação será aplicada a partir do primeiro marcador de cada atendimento.",
    actionPage: "Agrupa por marcador apenas os atendimentos visíveis na página atual. Outras páginas mantêm sua ordem original.",
    actionAll:  "Agrupa por marcador a lista inteira, independente da paginação. Itens podem mudar de página.",
    directions: [
      { value: "asc",  title: "A → Z (alfabético)", desc: "Marcadores em ordem alfabética crescente." },
      { value: "desc", title: "Z → A (alfabético)", desc: "Marcadores em ordem alfabética decrescente." },
    ],
  },
  dataInicio: {
    icon: "ph-calendar-plus",
    modalTitle: "Ordenar por data de início",
    description: "Escolha o escopo da ordenação por data de criação do atendimento.",
    actionPage: "Ordena por data de início apenas os atendimentos visíveis na página atual. Outras páginas mantêm sua ordem original.",
    actionAll:  "Ordena por data de início a lista inteira, independente da paginação. Itens podem mudar de página.",
    directions: [
      { value: "desc", title: "Mais recentes primeiro", desc: "Atendimentos iniciados há menos tempo aparecem antes." },
      { value: "asc",  title: "Mais antigos primeiro",  desc: "Atendimentos iniciados há mais tempo aparecem antes." },
    ],
  },
  dataAtualizacao: {
    icon: "ph-clock-counter-clockwise",
    modalTitle: "Ordenar por data de atualização",
    description: "Escolha o escopo da ordenação por última atividade (mensagem, alteração de status, etc.).",
    actionPage: "Ordena por data de atualização apenas os atendimentos visíveis na página atual. Outras páginas mantêm sua ordem original.",
    actionAll:  "Ordena por data de atualização a lista inteira, independente da paginação. Itens podem mudar de página.",
    directions: [
      { value: "desc", title: "Atualizações mais recentes", desc: "Atendimentos com atividade mais recente aparecem antes." },
      { value: "asc",  title: "Atualizações mais antigas",  desc: "Atendimentos sem atividade há mais tempo aparecem antes." },
    ],
  },
  sla: {
    icon: "ph-clock-countdown",
    modalTitle: "Ordenar por SLA",
    description: "Escolha o escopo e a direção da ordenação pelo prazo de SLA dos atendimentos.",
    actionPage: "Ordena por SLA apenas os atendimentos visíveis na página atual. Outras páginas mantêm sua ordem original.",
    actionAll:  "Ordena por SLA a lista inteira, independente da paginação. Itens podem mudar de página.",
    directions: [
      { value: "asc",  title: "Mais atrasados primeiro", desc: "Atendimentos com maior atraso no SLA aparecem antes (mais urgentes)." },
      { value: "desc", title: "Mais atrasados último",   desc: "Atendimentos com SLA mais folgado aparecem antes." },
    ],
  },
};

const ColumnSortModal = ({ column, currentMode, currentDirection, onClose, onConfirm }) => {
  const c = window.CCM.c;
  const cfg = COLUMN_SORT_CONFIG[column] || COLUMN_SORT_CONFIG.marcador;
  const [mode, setMode] = React.useState(currentMode || "page");
  const [direction, setDirection] = React.useState(currentDirection || cfg.directions[0].value);

  const scopeOptions = [
    { value: "page", title: "Ordenar por paginação",            desc: cfg.actionPage, icon: "ph-list-numbers" },
    { value: "all",  title: "Ordenar por todos os atendimentos", desc: cfg.actionAll,  icon: "ph-stack" },
  ];

  // ESC to close
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0, background: "rgba(40,41,61,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 16, padding: 24,
        minWidth: 440, maxWidth: 520,
        boxShadow: "0 4px 24px 0 rgba(0,0,0,0.22)",
        fontFamily: "Montserrat, sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: c.fg1, display: "flex", alignItems: "center", gap: 8 }}>
            <i className={`ph ${cfg.icon}`} style={{ fontSize: 18, color: c.primary }} />
            {cfg.modalTitle}
          </h3>
          <button onClick={onClose} style={{
            border: 0, background: "transparent", color: c.fg2, cursor: "pointer",
            width: 30, height: 30, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><i className="ph ph-x" style={{ fontSize: 16 }} /></button>
        </div>
        <p style={{ margin: "0 0 18px", fontSize: 12, color: c.fg2, lineHeight: 1.5 }}>
          {cfg.description}
        </p>

        {/* ── Direção ── */}
        <div style={{ fontSize: 10, fontWeight: 700, color: c.fg3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Direção
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          {cfg.directions.map(d => {
            const selected = direction === d.value;
            return (
              <label key={d.value} onClick={() => setDirection(d.value)} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                background: selected ? c.primaryLightest : "#fff",
                border: `1.5px solid ${selected ? c.primary : c.border}`,
                transition: "background 150ms ease, border-color 150ms ease",
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  border: `2px solid ${selected ? c.primary : c.border}`,
                  background: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {selected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.primary }} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <i className={`ph ${d.value === "asc" ? "ph-arrow-up" : "ph-arrow-down"}`} style={{ fontSize: 14, color: selected ? c.primary : c.fg2 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: selected ? c.primary : c.fg1 }}>{d.title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: c.fg2, marginTop: 3, lineHeight: 1.5 }}>{d.desc}</div>
                </div>
              </label>
            );
          })}
        </div>

        {/* ── Escopo ── */}
        <div style={{ fontSize: 10, fontWeight: 700, color: c.fg3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          Escopo
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {scopeOptions.map(o => {
            const selected = mode === o.value;
            return (
              <label key={o.value} onClick={() => setMode(o.value)} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                background: selected ? c.primaryLightest : "#fff",
                border: `1.5px solid ${selected ? c.primary : c.border}`,
                transition: "background 150ms ease, border-color 150ms ease",
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  border: `2px solid ${selected ? c.primary : c.border}`,
                  background: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {selected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.primary }} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <i className={`ph ${o.icon}`} style={{ fontSize: 14, color: selected ? c.primary : c.fg2 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: selected ? c.primary : c.fg1 }}>{o.title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: c.fg2, marginTop: 3, lineHeight: 1.5 }}>{o.desc}</div>
                </div>
              </label>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          {currentMode ? (
            <button onClick={() => onConfirm(null)} style={{
              border: 0, background: "transparent", cursor: "pointer",
              fontFamily: "Montserrat, sans-serif", fontSize: 12, fontWeight: 600,
              color: c.fg2, padding: "0 4px", display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <i className="ph ph-arrow-counter-clockwise" style={{ fontSize: 13 }} /> Limpar ordenação
            </button>
          ) : <span />}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{
              padding: "0 18px", height: 40, borderRadius: 12, border: `1px solid ${c.border}`,
              background: "#fff", color: c.fg1, fontWeight: 600, cursor: "pointer",
              fontFamily: "Montserrat, sans-serif", fontSize: 13,
            }}>Cancelar</button>
            <button onClick={() => onConfirm({ mode, direction })} style={{
              padding: "0 18px", height: 40, borderRadius: 12, border: 0,
              background: c.primary, color: "#fff", fontWeight: 600, cursor: "pointer",
              fontFamily: "Montserrat, sans-serif", fontSize: 13,
              boxShadow: "0 2px 6px rgba(146,64,255,0.30)",
            }}>Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// AtendimentoFormModal — Novo atendimento / Editando atendimento
// ─────────────────────────────────────────────
const QUEUES_OPTIONS = [
  { icon: "🔥", label: "Atendimento ao cliente" },
  { icon: "📊", label: "Departamento de Marketing" },
  { icon: "🔧", label: "Departamento de Desenvolvimento" },
  { icon: "📦", label: "Logística" },
  { icon: "💼", label: "Vendas" },
];

const ATTENDANTS_OPTIONS = [
  "Arnaldo Silva", "Camila Alves", "Fernando Santos",
  "Ricardo Martins", "Ana Souza", "Marcos Ribeiro",
];

const SLA_UNITS = ["Minutos", "Horas", "Dias", "Semanas"];

// Dropdown that renders its list via portal to escape overflow:hidden parents
const FormDropdown = ({ open, onOpen, onClose, value, options, onSelect, renderOption, renderValue, searchable }) => {
  const c = window.CCM.c;
  const btnRef = React.useRef(null);
  const [pos, setPos] = React.useState(null);
  const [search, setSearch] = React.useState("");

  const handleToggle = () => {
    if (open) { onClose(); return; }
    const rect = btnRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    setSearch("");
    onOpen();
  };

  const filtered = searchable && search
    ? options.filter(o => {
        const label = renderOption ? renderOption(o) : String(o);
        return label.toLowerCase().includes(search.toLowerCase());
      })
    : options;

  const portal = open && pos && ReactDOM.createPortal(
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: "fixed", top: pos.top, left: pos.left, width: pos.width,
        zIndex: 9999, background: "#fff",
        border: `1px solid ${c.border}`, borderRadius: 12,
        boxShadow: "0 8px 24px rgba(40,41,61,0.16)",
        overflow: "hidden", maxHeight: 260, overflowY: "auto",
      }}
    >
      {searchable && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
          borderBottom: `1px solid ${c.borderSoft}`,
          position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
          <i className="ph ph-magnifying-glass" style={{ fontSize: 13, color: c.fg3 }} />
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar"
            style={{
              flex: 1, border: 0, outline: "none",
              fontFamily: "Montserrat, sans-serif", fontSize: 13,
              color: c.fg1, background: "transparent",
            }}
          />
        </div>
      )}
      {filtered.map((opt, i) => (
        <div
          key={i}
          onMouseDown={() => { onSelect(opt); onClose(); }}
          style={{
            padding: "12px 16px", cursor: "pointer", fontSize: 14, color: c.fg1,
            borderTop: i > 0 ? `1px solid ${c.borderSoft}` : "none",
          }}
          onMouseEnter={e => e.currentTarget.style.background = c.primaryLightest}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          {renderOption ? renderOption(opt) : String(opt)}
        </div>
      ))}
      {filtered.length === 0 && (
        <div style={{ padding: "14px 16px", fontSize: 13, color: c.fg3, textAlign: "center" }}>
          Nenhum resultado
        </div>
      )}
    </div>,
    document.body
  );

  return (
    <div onMouseDown={e => e.stopPropagation()}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          width: "100%", height: 48, padding: "0 16px", borderRadius: 12,
          border: `1.5px solid ${open ? c.primary : c.border}`,
          background: "#fff", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "space-between",
          fontFamily: "Montserrat, sans-serif", fontSize: 14, color: c.fg1,
          boxShadow: open ? `0 0 0 3px ${c.primaryLightest}` : "none",
          transition: "border-color 150ms, box-shadow 150ms",
        }}
      >
        <span>{renderValue ? renderValue(value) : String(value)}</span>
        <i className={`ph ${open ? "ph-caret-up" : "ph-caret-down"}`} style={{ fontSize: 14, color: c.fg3 }} />
      </button>
      {portal}
    </div>
  );
};

const AtendimentoFormModal = ({ mode, atendimentoId, onClose }) => {
  const c = window.CCM.c;
  const isNew = mode === "novo";
  const idLabel = atendimentoId || "123456";

  const [queue, setQueue] = React.useState(QUEUES_OPTIONS[0]);
  const [attendant, setAttendant] = React.useState(ATTENDANTS_OPTIONS[0]);
  const [slaValue, setSlaValue] = React.useState("1");
  const [slaUnit, setSlaUnit] = React.useState("Dias");
  const [configOpen, setConfigOpen] = React.useState(true);
  const [openDd, setOpenDd] = React.useState(null); // "queue" | "attendant" | "slaUnit" | null

  React.useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  // Close any open dropdown on outside click
  React.useEffect(() => {
    const h = () => setOpenDd(null);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 3000,
        background: "rgba(40,41,61,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 960, maxWidth: "calc(100vw - 48px)",
          background: "#f2f6fa", borderRadius: 20,
          boxShadow: "0 16px 48px rgba(40,41,61,0.22)",
          fontFamily: "Montserrat, sans-serif",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px", height: 64, background: "#fff",
          borderBottom: `1px solid ${c.border}`,
          borderRadius: "20px 20px 0 0",
        }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: c.fg1 }}>
            {isNew ? "Novo atendimento " : "Editando atendimento "}
            <strong>#{idLabel}</strong>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={{
              height: 40, padding: "0 20px", borderRadius: 12, border: 0,
              background: c.primary, color: "#fff", fontWeight: 600, fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              fontFamily: "Montserrat, sans-serif",
              boxShadow: "0 2px 6px rgba(146,64,255,0.30)",
            }}>
              <i className={`ph ${isNew ? "ph-tag" : "ph-floppy-disk"}`} style={{ fontSize: 16 }} />
              {isNew ? "Criar atendimento" : "Salvar"}
            </button>
            <button
              onClick={onClose}
              style={{
                width: 36, height: 36, borderRadius: 10, border: 0,
                background: "transparent", color: c.fg2, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = c.borderSoft; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <i className="ph ph-x" style={{ fontSize: 20 }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 24, borderRadius: "0 0 20px 20px" }}>
          {/* Configurações card */}
          <div style={{
            background: "#fff", borderRadius: 16,
            border: `1px solid ${c.border}`,
            boxShadow: "0 1px 4px rgba(40,41,61,0.06)",
          }}>
            {/* Card header */}
            <div
              onClick={() => setConfigOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 24px", cursor: "pointer",
                borderBottom: configOpen ? `1px solid ${c.border}` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "#e6f7e6", color: "#4caf50",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>
                  <i className="ph ph-check-circle" />
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, color: c.fg1 }}>
                  Configurações do atendimento{" "}
                  <span style={{ color: "#f99f18" }}>*</span>
                </span>
              </div>
              <i className={`ph ${configOpen ? "ph-caret-up" : "ph-caret-down"}`} style={{ fontSize: 16, color: c.fg2 }} />
            </div>

            {/* Card body */}
            {configOpen && (
              <div style={{ padding: "24px 24px 28px" }}>
                {/* Fila de atendimento */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: c.fg1, marginBottom: 8 }}>
                    Fila de atendimento:<span style={{ color: "#f54336" }}>*</span>
                  </label>
                  <FormDropdown
                    open={openDd === "queue"}
                    onOpen={() => setOpenDd("queue")}
                    onClose={() => setOpenDd(null)}
                    value={queue}
                    options={QUEUES_OPTIONS}
                    onSelect={setQueue}
                    renderValue={v => `${v.icon} ${v.label}`}
                    renderOption={o => `${o.icon} ${o.label}`}
                    searchable
                  />
                </div>

                {/* Atendente */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: c.fg1, marginBottom: 8 }}>
                    Atendente:<span style={{ color: "#f54336" }}>*</span>
                  </label>
                  <FormDropdown
                    open={openDd === "attendant"}
                    onOpen={() => setOpenDd("attendant")}
                    onClose={() => setOpenDd(null)}
                    value={attendant}
                    options={ATTENDANTS_OPTIONS}
                    onSelect={setAttendant}
                  />
                </div>

                {/* SLA personalizado */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: c.fg1, marginBottom: 8 }}>
                    SLA personalizado:{" "}
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                      background: "#fff8e1", color: "#f99f18",
                    }}>Opcional</span>
                  </label>
                  <div style={{ display: "flex", gap: 12 }}>
                    {/* Number input */}
                    <div style={{
                      flex: 1, height: 48, border: `1.5px solid ${c.border}`, borderRadius: 12,
                      display: "flex", alignItems: "center", background: "#fff",
                    }}>
                      <input
                        type="number"
                        value={slaValue}
                        onChange={e => setSlaValue(e.target.value)}
                        min="1"
                        style={{
                          flex: 1, border: 0, outline: "none", padding: "0 14px",
                          fontFamily: "Montserrat, sans-serif", fontSize: 14, color: c.fg1,
                          background: "transparent",
                        }}
                      />
                      <div style={{
                        display: "flex", flexDirection: "column", padding: "4px 10px",
                        borderLeft: `1px solid ${c.border}`, gap: 2,
                      }}>
                        <button
                          onClick={() => setSlaValue(v => String(Math.max(1, Number(v) + 1)))}
                          style={{
                            width: 16, height: 14, border: 0, background: "transparent",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            color: c.fg3, padding: 0,
                          }}
                        >
                          <i className="ph ph-caret-up" style={{ fontSize: 10 }} />
                        </button>
                        <button
                          onClick={() => setSlaValue(v => String(Math.max(1, Number(v) - 1)))}
                          style={{
                            width: 16, height: 14, border: 0, background: "transparent",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            color: c.fg3, padding: 0,
                          }}
                        >
                          <i className="ph ph-caret-down" style={{ fontSize: 10 }} />
                        </button>
                      </div>
                    </div>

                    {/* Unit dropdown */}
                    <div style={{ width: 200 }}>
                      <FormDropdown
                        open={openDd === "slaUnit"}
                        onOpen={() => setOpenDd("slaUnit")}
                        onClose={() => setOpenDd(null)}
                        value={slaUnit}
                        options={SLA_UNITS}
                        onSelect={setSlaUnit}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Shared helpers for Kanban / Gantt
// ─────────────────────────────────────────────
const statusVisuals = (s) => {
  if (s === "Aberto" || s === "Aberta") return { bar: "#4eaf51", bg: "#e6f3e5", fg: "#2f7a32", label: "Aberto" };
  if (s === "Pendente")                  return { bar: "#f99f18", bg: "#fff3e0", fg: "#a8660a", label: "Pendente" };
  return                                        { bar: "#8F90A6", bg: "#eef0f4", fg: "#555770", label: "Encerrado" };
};

const slaPillColor = (tag) => {
  if (!tag) return null;
  if (tag.startsWith("-")) return { bg: "#ffdde3", fg: "#f54336" };
  return { bg: "#e6f3e5", fg: "#4eaf51" };
};

// ─────────────────────────────────────────────
// KanbanView — columns by status
// ─────────────────────────────────────────────
const KanbanView = ({ atendimentos, onOpenAtendimento, onEdit }) => {
  const c = window.CCM.c;

  const columns = [
    { key: "aberto",    label: "Em aberto",  statuses: ["Aberto", "Aberta"] },
    { key: "pendente",  label: "Pendente",   statuses: ["Pendente"] },
    { key: "encerrado", label: "Encerrado",  statuses: ["Encerrado"] },
  ];

  const grouped = columns.map(col => {
    const visuals = statusVisuals(col.statuses[0]);
    return { ...col, ...visuals, items: atendimentos.filter(a => col.statuses.includes(a.status)) };
  });

  return (
    <div style={{
      flex: 1, display: "flex", gap: 14, minHeight: 0,
      overflowX: "auto", overflowY: "hidden", paddingBottom: 4,
    }}>
      {grouped.map(col => (
        <div key={col.key} style={{
          width: 320, minWidth: 320, flexShrink: 0,
          display: "flex", flexDirection: "column", minHeight: 0,
          background: "#f7f8fb", borderRadius: 14,
          border: `1px solid ${c.border}`,
          padding: 12,
        }}>
          {/* Column header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: col.bar }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: c.fg1 }}>{col.label}</span>
              <span style={{
                background: col.bg, color: col.fg,
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
              }}>{col.items.length}</span>
            </div>
            <i className="ph ph-dots-three" style={{ fontSize: 16, color: c.fg3, cursor: "pointer" }} />
          </div>
          {/* Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", flex: 1, minHeight: 0, paddingRight: 4 }}>
            {col.items.length === 0 && (
              <div style={{ padding: "32px 12px", textAlign: "center", fontSize: 12, color: c.fg3 }}>
                Nenhum atendimento
              </div>
            )}
            {col.items.map(a => (
              <KanbanCard key={a.id} a={a}
                onOpen={() => onOpenAtendimento(a.id)}
                onEdit={() => onEdit(a.id)}
                barColor={col.bar}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const KanbanCard = ({ a, onOpen, onEdit, barColor }) => {
  const c = window.CCM.c;
  const sla = slaPillColor(a.slaTag);
  const titulo = a.titulo.split("—")[0].trim();

  const iconBtn = (icon, title, handler) => (
    <CCMTooltip label={title}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handler(); }}
        aria-label={title}
        style={{
          width: 26, height: 26, borderRadius: 7, border: 0,
          background: "transparent", color: c.fg2, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = c.primaryLightest; e.currentTarget.style.color = c.primary; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.fg2; }}
      >
        <i className={`ph ${icon}`} style={{ fontSize: 14 }} />
      </button>
    </CCMTooltip>
  );

  return (
    <div
      onClick={onOpen}
      style={{
        background: "#fff", border: `1px solid ${c.border}`, borderRadius: 10,
        padding: 12, cursor: "pointer",
        borderLeft: `3px solid ${barColor}`,
        boxShadow: "0 1px 2px rgba(40,41,61,0.05)",
        transition: "box-shadow 150ms ease, transform 150ms ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(40,41,61,0.10)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(40,41,61,0.05)"; }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: c.fg3 }}>#{a.id}</span>
        <div style={{ display: "flex", gap: 2 }}>
          {iconBtn("ph-eye", "Visualizar", onOpen)}
          {iconBtn("ph-pencil-simple", "Editar", onEdit)}
        </div>
      </div>

      {/* Title */}
      <div style={{
        fontSize: 13, fontWeight: 600, color: c.fg1, marginBottom: 8,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>{titulo}</div>

      {/* Markers */}
      {a.marcadores && a.marcadores.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
          {a.marcadores.slice(0, 2).map((m, i) => (
            <span key={i} style={{
              background: m.color + "14", color: m.color,
              fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
            }}>{m.label}</span>
          ))}
        </div>
      )}

      {/* Date */}
      <div style={{
        fontSize: 11, color: c.fg2, marginBottom: 10,
        display: "flex", alignItems: "center", gap: 5,
      }}>
        <i className="ph ph-calendar-blank" style={{ fontSize: 12 }} />
        {a.dataInicio}
      </div>

      {/* Footer: avatars + conversas + SLA */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <AvatarStack list={a.contatos} extra={a.contatosExtra} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: c.fg2, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <i className="ph ph-chat-circle" style={{ fontSize: 12 }} />
            {Array.isArray(a.conversas) ? a.conversas.length || 13 : a.conversas}
          </span>
          {sla && (
            <span style={{
              background: sla.bg, color: sla.fg,
              fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
            }}>{a.slaTag}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// GanttView — timeline by data início → fim
// ─────────────────────────────────────────────
//
// Convenções:
// - "Hoje" no mock = 01/01/2026 14:00 (logo após a última dataInicio dos atendimentos).
//   Linha vermelha vertical marca essa posição.
// - Atendimentos abertos (Aberto/Aberta/Pendente/Em andamento) têm a barra
//   estendida até HOJE. Atendimentos encerrados usam duração determinística
//   baseada no id.
// - Toda barra mostra algum texto. Em barras finas mostra só o ID; em barras
//   mais largas mostra a janela de tempo; em barras muito largas mostra
//   o título também.
// ─────────────────────────────────────────────
const MOCK_NOW = new Date(2026, 0, 1, 14, 0); // 01/01/2026 às 14:00

const isOngoingStatus = (status) => /^(Aberto|Aberta|Pendente|Em andamento)$/i.test(status || "");

const GanttView = ({ atendimentos, onOpenAtendimento, onEdit }) => {
  const c = window.CCM.c;

  // Parse "DD/MM/YY - HH:MM"
  const parseDate = (s) => {
    const [datePart, timePart] = s.split(" - ");
    const [dd, mm, yy] = datePart.split("/").map(Number);
    const [hh, min] = timePart.split(":").map(Number);
    return new Date(2000 + yy, mm - 1, dd, hh, min);
  };

  // Deterministic duration in hours based on id (range 4–28h) — usado só pra encerrados
  const durationHours = (id) => {
    let h = 0;
    for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return 4 + (h % 25);
  };

  const enriched = atendimentos.map(a => {
    const start = parseDate(a.dataInicio);
    const ongoing = isOngoingStatus(a.status);
    let end;
    if (ongoing) {
      end = MOCK_NOW;
    } else {
      end = new Date(start.getTime() + durationHours(a.id) * 3600000);
    }
    // Garante pelo menos 1h de duração visual
    if (end.getTime() - start.getTime() < 3600000) {
      end = new Date(start.getTime() + 3600000);
    }
    return { ...a, start, end, ongoing };
  });

  // Compute range — inclui MOCK_NOW + 1 dia de buffer
  const minStart = new Date(Math.min(...enriched.map(a => a.start.getTime())));
  const maxEnd   = new Date(Math.max(MOCK_NOW.getTime(), ...enriched.map(a => a.end.getTime())));
  minStart.setHours(0, 0, 0, 0);
  const rangeStart = minStart.getTime();
  const endDay = new Date(maxEnd);
  endDay.setHours(0, 0, 0, 0);
  endDay.setDate(endDay.getDate() + 1);
  const rangeEnd = endDay.getTime();

  const totalDays = Math.ceil((rangeEnd - rangeStart) / 86400000);
  const DAY_WIDTH = 160;
  const totalWidth = totalDays * DAY_WIDTH;
  const ROW_HEIGHT = 44;
  const HEADER_HEIGHT = 40;
  const LABEL_WIDTH = 280;

  // Posição em px da linha "HOJE"
  const nowPx = ((MOCK_NOW.getTime() - rangeStart) / 86400000) * DAY_WIDTH;

  const days = [];
  for (let i = 0; i < totalDays; i++) {
    days.push(new Date(rangeStart + i * 86400000));
  }

  const fmtDay = (d) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return { dm: `${dd}/${mm}`, wd: weekdays[d.getDay()] };
  };

  const fmtHM = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
      background: "#fff", border: `1px solid ${c.border}`, borderRadius: 16,
      boxShadow: "0 0 10px 0 rgba(40,41,61,0.06)", overflow: "hidden",
    }}>
      <div style={{ flex: 1, overflow: "auto", minHeight: 0, position: "relative" }}>
        <div style={{
          display: "flex", minWidth: LABEL_WIDTH + totalWidth,
          position: "relative",
        }}>
          {/* ── Labels column (sticky left) ── */}
          <div style={{
            width: LABEL_WIDTH, flexShrink: 0,
            position: "sticky", left: 0, zIndex: 3,
            background: "#fff",
            borderRight: `1px solid ${c.border}`,
            boxShadow: "1px 0 0 rgba(40,41,61,0.04)",
          }}>
            {/* Header cell */}
            <div style={{
              height: HEADER_HEIGHT, padding: "0 16px",
              display: "flex", alignItems: "center",
              fontSize: 11, fontWeight: 700, color: c.fg2,
              textTransform: "uppercase", letterSpacing: "0.04em",
              background: "#fafbfd", borderBottom: `1px solid ${c.border}`,
              position: "sticky", top: 0, zIndex: 2,
            }}>
              Atendimento
            </div>
            {/* Row labels */}
            {enriched.map(a => {
              const sv = statusVisuals(a.status);
              return (
                <div key={a.id} style={{
                  height: ROW_HEIGHT, padding: "0 16px",
                  display: "flex", alignItems: "center", gap: 8,
                  borderBottom: `1px solid ${c.borderSoft}`,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%", background: sv.bar, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: c.fg2, flexShrink: 0 }}>#{a.id}</span>
                  <span style={{
                    fontSize: 12, color: c.fg1,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{a.titulo.split("—")[0].trim()}</span>
                </div>
              );
            })}
          </div>

          {/* ── Timeline ── */}
          <div style={{ position: "relative", width: totalWidth }}>
            {/* Day headers */}
            <div style={{
              height: HEADER_HEIGHT, display: "flex",
              borderBottom: `1px solid ${c.border}`,
              background: "#fafbfd",
              position: "sticky", top: 0, zIndex: 2,
            }}>
              {days.map((d, i) => {
                const f = fmtDay(d);
                return (
                  <div key={i} style={{
                    width: DAY_WIDTH, padding: "0 12px",
                    display: "flex", alignItems: "center", gap: 6,
                    borderRight: `1px solid ${c.border}`,
                    fontFamily: "Montserrat, sans-serif",
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: c.fg1 }}>{f.dm}</span>
                    <span style={{ fontSize: 10, color: c.fg3, textTransform: "uppercase" }}>{f.wd}</span>
                  </div>
                );
              })}
            </div>

            {/* Vertical day grid lines */}
            <div style={{ position: "absolute", top: HEADER_HEIGHT, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
              {days.map((_, i) => (
                <div key={i} style={{
                  position: "absolute", left: i * DAY_WIDTH, top: 0, height: enriched.length * ROW_HEIGHT,
                  borderLeft: i === 0 ? "none" : `1px solid ${c.borderSoft}`,
                }} />
              ))}
            </div>

            {/* Linha "HOJE" — vermelha, atravessa do header até o fim das linhas */}
            {nowPx >= 0 && nowPx <= totalWidth && (
              <div style={{
                position: "absolute",
                left: nowPx, top: 0,
                height: HEADER_HEIGHT + enriched.length * ROW_HEIGHT,
                width: 2, background: "#ef4444",
                pointerEvents: "none", zIndex: 4,
              }}>
                <div style={{
                  position: "absolute", top: 8, left: -22,
                  background: "#ef4444", color: "#fff",
                  padding: "2px 8px", borderRadius: 4,
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
                  whiteSpace: "nowrap", boxShadow: "0 2px 4px rgba(239,68,68,0.32)",
                  fontFamily: "Montserrat, sans-serif",
                }}>HOJE</div>
              </div>
            )}

            {/* Row tracks + bars */}
            {enriched.map((a, idx) => {
              const leftPx = ((a.start.getTime() - rangeStart) / 86400000) * DAY_WIDTH;
              const widthPx = Math.max(((a.end.getTime() - a.start.getTime()) / 86400000) * DAY_WIDTH, 56);
              const sv = statusVisuals(a.status);
              const tituloCurto = a.titulo.split("—")[1]?.trim() || a.titulo.split("—")[0].trim();
              const timeLabel = a.ongoing
                ? `${fmtHM(a.start)} → em andamento`
                : `${fmtHM(a.start)} → ${fmtHM(a.end)}`;
              const titleAttr = `#${a.id} • ${tituloCurto} • ${timeLabel}`;

              // Texto da barra adaptado à largura
              let barText;
              if (widthPx > 220) {
                barText = `${timeLabel}  ·  ${tituloCurto}`;
              } else if (widthPx > 140) {
                barText = timeLabel;
              } else if (widthPx > 86) {
                barText = a.ongoing
                  ? `${fmtHM(a.start)} → agora`
                  : `${fmtHM(a.start)} → ${fmtHM(a.end)}`;
              } else {
                barText = `#${a.id}`;
              }

              return (
                <div key={a.id} style={{
                  position: "relative",
                  height: ROW_HEIGHT,
                  borderBottom: `1px solid ${c.borderSoft}`,
                  background: idx % 2 === 1 ? "#fcfdfe" : "#fff",
                }}>
                  <CCMTooltip label={titleAttr}>
                    <div
                      aria-label={titleAttr}
                      onClick={() => onOpenAtendimento(a.id)}
                      style={{
                        position: "absolute",
                        left: leftPx, top: 8, height: ROW_HEIGHT - 16,
                        width: widthPx,
                        background: sv.bar,
                        // Barras em andamento ganham padrão listrado sutil pra indicar visualmente
                        backgroundImage: a.ongoing
                          ? `repeating-linear-gradient(135deg, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px), linear-gradient(${sv.bar}, ${sv.bar})`
                          : undefined,
                        borderRadius: 8,
                        display: "flex", alignItems: "center", padding: "0 10px", gap: 6,
                        color: "#fff", fontSize: 11, fontWeight: 700,
                        cursor: "pointer", overflow: "hidden",
                        boxShadow: "0 1px 4px rgba(40,41,61,0.18)",
                        transition: "transform 150ms ease, box-shadow 150ms ease",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(40,41,61,0.22)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(40,41,61,0.18)"; }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {barText}
                      </span>
                    </div>
                  </CCMTooltip>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Paginação — mesmo footer da visão Lista ── */}
      <div style={{
        padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
        fontSize: 12, color: c.fg2, borderTop: `1px solid ${c.borderSoft}`, flexShrink: 0,
        background: "#fff",
      }}>
        <span>{atendimentos.length}/{atendimentos.length} itens</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <i className="ph ph-caret-left" style={{ fontSize: 14, cursor: "pointer" }} />
          <span style={{ color: c.fg1, fontWeight: 600 }}>1</span>
          <i className="ph ph-caret-right" style={{ fontSize: 14, cursor: "pointer" }} />
          <span style={{
            border: `1px solid ${c.border}`, borderRadius: 8, padding: "2px 8px",
            display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer",
          }}>10 <i className="ph ph-caret-down" style={{ fontSize: 10 }} /></span>
          <span>página 01 de 01</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// NestedMenu — recursive menu with hover-triggered submenus (Notion-style)
// ─────────────────────────────────────────────
const NestedMenu = ({ items, top, left, onSelect, isActive }) => {
  const c = window.CCM.c;
  const [hoveredId, setHoveredId] = React.useState(null);
  const itemRefs = React.useRef({});

  const hoveredItem = items.find(it => it.id === hoveredId);
  const hoveredRect = hoveredItem && itemRefs.current[hoveredItem.id]?.getBoundingClientRect();

  return ReactDOM.createPortal(
    <React.Fragment>
      <div data-bc="1" style={{
        position: "fixed", top, left, zIndex: 10000,
        background: "#fff",
        border: `1px solid ${c.border}`, borderRadius: 12,
        boxShadow: "0 8px 24px rgba(40,41,61,0.16)",
        minWidth: 260, maxWidth: 340,
        maxHeight: 380, overflowY: "auto",
        padding: "6px 0",
        fontFamily: "Montserrat, sans-serif",
      }}>
        {items.length === 0 && (
          <div style={{ padding: "12px 14px", fontSize: 13, color: c.fg3 }}>Nenhum item</div>
        )}
        {items.map(item => {
          const hasChildren = item.children?.length > 0;
          const active = isActive?.(item.id);
          const isHovered = hoveredId === item.id;
          return (
            <div
              key={item.id}
              ref={el => { if (el) itemRefs.current[item.id] = el; }}
              onMouseEnter={() => setHoveredId(hasChildren ? item.id : null)}
              onClick={() => onSelect(item)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 14px", cursor: "pointer",
                background: isHovered ? "#f0f2f7" : active ? c.primaryLightest : "transparent",
                color: active ? c.primary : c.fg1,
                fontSize: 13, fontWeight: active ? 600 : 500,
                transition: "background 80ms ease",
              }}
            >
              {item.icon && <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>}
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.label}
              </span>
              {hasChildren && <i className="ph ph-caret-right" style={{ fontSize: 11, color: c.fg3 }} />}
            </div>
          );
        })}
      </div>
      {hoveredItem?.children?.length > 0 && hoveredRect && (
        <NestedMenu
          items={hoveredItem.children}
          top={hoveredRect.top - 7}
          left={hoveredRect.right + 4}
          onSelect={onSelect}
          isActive={isActive}
        />
      )}
    </React.Fragment>,
    document.body
  );
};

// ─────────────────────────────────────────────
// QueueBreadcrumb — Notion-style breadcrumb with per-segment dropdowns
// ─────────────────────────────────────────────
const QueueBreadcrumb = ({
  queue, queues, onSelectQueue,
  atendimentoId, atendimentos, onSelectAtendimento,
}) => {
  const c = window.CCM.c;
  const [openSeg, setOpenSeg] = React.useState(null);
  const [ddRect, setDdRect] = React.useState(null);

  React.useEffect(() => {
    if (!openSeg) return;
    const h = e => { if (!e.target.closest("[data-bc]")) setOpenSeg(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [openSeg]);

  if (!queue || !queues) return null;

  // Find parent group (operação) of current queue
  const parentGroup = queues.find(g => g.children?.some(ch => ch.id === queue.id));
  const isChild = !!parentGroup;
  const currentOperation = isChild ? parentGroup : queue;

  // Operations = top-level queues that are groups (have children)
  const operations = queues.filter(q => q.children?.length > 0);
  const operationsItems = operations.map(g => ({
    id: g.id, label: g.name, icon: g.icon,
    children: g.children?.map(ch => ({ id: ch.id, label: ch.name, icon: ch.icon })),
  }));

  // Filas (sibling queues) — only if current queue is a child of an operation
  const filasItems = isChild
    ? parentGroup.children.map(ch => ({ id: ch.id, label: ch.name, icon: ch.icon }))
    : [];

  const atendItems = (atendimentos || []).slice(0, 30).map(a => ({
    id: a.id,
    label: `#${a.id} — ${a.titulo.split("—")[0].trim()}`,
  }));

  // Segments
  const segments = [
    { key: "root", label: "Atendimentos", noDropdown: true },
    {
      key: "operation",
      label: currentOperation.name,
      icon: currentOperation.icon,
      items: operationsItems,
      isCurrent: !isChild && !atendimentoId,
    },
  ];
  if (isChild) {
    segments.push({
      key: "queue", label: queue.name, icon: queue.icon,
      items: filasItems,
      isCurrent: !atendimentoId,
    });
  }
  if (atendimentoId && atendimentos) {
    segments.push({
      key: "atend", label: `#${atendimentoId}`,
      items: atendItems, isAtendimento: true, isCurrent: true,
    });
  }

  const handleSegClick = (seg, e) => {
    if (seg.noDropdown) return;
    if (openSeg === seg.key) { setOpenSeg(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setDdRect({ top: rect.bottom + 4, left: rect.left });
    setOpenSeg(seg.key);
  };

  const handlePick = (seg, item) => {
    // Groups with children: clicking shouldn't navigate (drill via hover submenu)
    if (item.children?.length > 0) return;
    setOpenSeg(null);
    if (seg.isAtendimento) {
      onSelectAtendimento?.(item.id);
    } else {
      onSelectQueue?.(item.id);
    }
  };

  const isActiveFor = (segKey) => (id) => {
    if (segKey === "queue") return id === queue.id;
    if (segKey === "operation") return id === currentOperation.id;
    if (segKey === "atend") return id === atendimentoId;
    return false;
  };

  const openSegment = segments.find(s => s.key === openSeg);

  // ─── Responsive collapse ───
  // Mede a largura do container e do conteúdo "ideal" (todos os labels expandidos).
  // Quando o container fica menor que o conteúdo, colapsa segmentos com ícone para
  // mostrar só ícone + "…". O nome completo continua acessível via tooltip e via
  // o dropdown ao clicar.
  const containerRef = React.useRef(null);
  const measureRef = React.useRef(null);
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const checkFit = () => {
      const container = containerRef.current;
      const measure = measureRef.current;
      if (!container || !measure) return;
      // Width disponível menos um pequeno colchão pra evitar oscilação
      const available = container.clientWidth - 8;
      const ideal = measure.scrollWidth;
      // Se o ideal é maior que o disponível => colapsa.
      // Histerese: mantém colapsado até sobrar bom espaço (12px).
      setCollapsed(prev => {
        if (prev) return ideal > available + 12 || available < ideal - 12 ? true : false;
        return ideal > available;
      });
    };
    checkFit();
    const ro = new ResizeObserver(checkFit);
    ro.observe(containerRef.current);
    if (measureRef.current) ro.observe(measureRef.current);
    return () => ro.disconnect();
  }, [queue?.id, atendimentoId, isChild]);

  const renderSegment = (seg, i, opts = {}) => {
    const isCompact = !!opts.compact && seg.icon && !seg.noDropdown;
    const btn = (
      <button
        onClick={(e) => handleSegClick(seg, e)}
        aria-label={isCompact ? seg.label : undefined}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 8px", borderRadius: 7,
          border: 0, background: openSeg === seg.key ? c.primaryLightest : "transparent",
          color: seg.isCurrent ? c.fg1 : c.fg2,
          fontFamily: "Montserrat, sans-serif",
          fontSize: 12, fontWeight: seg.isCurrent ? 700 : 500,
          cursor: "pointer",
          maxWidth: isCompact ? 60 : 240,
          minWidth: 0, flexShrink: 0,
          transition: "background 120ms ease",
        }}
        onMouseEnter={e => { if (openSeg !== seg.key) e.currentTarget.style.background = c.borderSoft; }}
        onMouseLeave={e => { if (openSeg !== seg.key) e.currentTarget.style.background = "transparent"; }}
      >
        {seg.icon && <span style={{ fontSize: 13, flexShrink: 0 }}>{seg.icon}</span>}
        {isCompact ? (
          <span style={{ color: c.fg3, fontSize: 12, lineHeight: 1, flexShrink: 0 }}>…</span>
        ) : (
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {seg.label}
          </span>
        )}
        <i className="ph ph-caret-down" style={{ fontSize: 10, color: c.fg3, flexShrink: 0 }} />
      </button>
    );
    return (
      <React.Fragment key={seg.key}>
        {i > 0 && (
          <span style={{ color: c.fg3, fontSize: 12, flexShrink: 0, padding: "0 2px" }}>/</span>
        )}
        {seg.noDropdown ? (
          <span style={{
            padding: "4px 8px", color: c.fg3,
            fontFamily: "Montserrat, sans-serif", fontSize: 12, fontWeight: 500,
            whiteSpace: "nowrap", flexShrink: 0,
          }}>{seg.label}</span>
        ) : (
          isCompact ? <CCMTooltip label={seg.label}>{btn}</CCMTooltip> : btn
        )}
      </React.Fragment>
    );
  };

  return (
    <div ref={containerRef} data-bc="1" style={{
      display: "flex", alignItems: "center", gap: 4,
      minWidth: 0, flexWrap: "nowrap", overflow: "hidden",
      position: "relative",
    }}>
      {/* Conteúdo visível — colapsa quando não cabe */}
      {segments.map((seg, i) => renderSegment(seg, i, { compact: collapsed }))}

      {/* Sombra invisível que mede a largura "ideal" (sempre full).
         Posicionada absolutamente fora do fluxo de layout, mas dentro do contêiner
         pra herdar fontes/spacing exatos. Aria-hidden + pointer-events none.
         Reflowa quando segments mudam → recalcula collapsed. */}
      <div
        ref={measureRef}
        aria-hidden="true"
        style={{
          position: "absolute", visibility: "hidden", pointerEvents: "none",
          top: 0, left: 0, height: 0, overflow: "hidden",
          display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
        }}
      >
        {segments.map((seg, i) => renderSegment(seg, i, { compact: false }))}
      </div>

      {openSegment && ddRect && (
        <NestedMenu
          items={openSegment.items}
          top={ddRect.top}
          left={ddRect.left}
          onSelect={(item) => handlePick(openSegment, item)}
          isActive={isActiveFor(openSegment.key)}
        />
      )}
    </div>
  );
};

Object.assign(window, { AtendimentosList, NovaConversaModal, QueueBreadcrumb, StatusDropdown, STATUS_OPTIONS });
