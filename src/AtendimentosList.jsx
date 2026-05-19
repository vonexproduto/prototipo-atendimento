// AtendimentosList.jsx — main table of atendimentos for the selected queue

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
    <button
      onClick={onClick}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      title={label}
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
  );
};

const AtendimentosList = ({ queue, queues, onSelectQueue, onOpenAtendimento }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const demo = window.CCM_DEMO_STATE || {};
  const [searchFocused, setSearchFocused] = React.useState(!!demo.searchFocused);
  const [query, setQuery] = React.useState("");
  const [filtersOpen, setFiltersOpen] = React.useState(!!demo.filtersOpen);
  const [markerModalOpen, setMarkerModalOpen] = React.useState(false);
  const [markerSortMode, setMarkerSortMode] = React.useState(null); // null | "page" | "all"
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

  React.useEffect(() => {
    if (!openMenuId) return;
    const h = e => { if (!e.target.closest("[data-row-menu]")) setOpenMenuId(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [openMenuId]);

  // ─────────────────────────────────────────────
  // Sort by marker — group atendimentos by their first marker label
  // "page" → sort only first 10 items (current page)
  // "all"  → sort full list regardless of pagination
  // ─────────────────────────────────────────────
  const PAGE_SIZE = 10;
  const sortByMarker = (arr) => [...arr].sort((a, b) => {
    const am = a.marcadores?.[0]?.label || "zzz_sem_marcador";
    const bm = b.marcadores?.[0]?.label || "zzz_sem_marcador";
    return am.localeCompare(bm, "pt-BR");
  });

  const displayedAtendimentos = React.useMemo(() => {
    const src = D.atendimentos.map(a =>
      statusOverrides[a.id] ? { ...a, status: statusOverrides[a.id] } : a
    );
    if (markerSortMode === "all") return sortByMarker(src);
    if (markerSortMode === "page") {
      const head = src.slice(0, PAGE_SIZE);
      const tail = src.slice(PAGE_SIZE);
      return [...sortByMarker(head), ...tail];
    }
    return src;
  }, [D.atendimentos, markerSortMode, statusOverrides]);

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
          {/* Breadcrumb */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <QueueBreadcrumb queue={queue} queues={queues} onSelectQueue={onSelectQueue} />
          </div>

          {/* Right cluster: Filtros + Chips + Novo atendimento */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <IconLabelButton
              icon="ph-funnel-simple"
              label="Filtros avançados"
              hovered={hoveredBtn === "filtros"}
              onHoverChange={(h) => setHoveredBtn(h ? "filtros" : null)}
              active={filtersOpen}
              onClick={() => setFiltersOpen(o => !o)}
              variant="ghost"
            />

            {/* View mode chips */}
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
                  <button
                    key={v}
                    onClick={() => setViewMode(v)}
                    onMouseEnter={() => setHoveredBtn(`chip-${v}`)}
                    onMouseLeave={() => setHoveredBtn(null)}
                    title={label}
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
                );
              })}
            </div>

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
            {demo.loadingTable ? <LoadingSkeleton /> : demo.emptyQueue ? <EmptyState /> : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
              <thead>
                <tr style={{ background: "#fafbfd", position: "sticky", top: 0, zIndex: 3 }}>
                  {[
                    { label: "ID" },
                    { label: "Nome" },
                    { label: "Data início" },
                    { label: "Marcadores", sort: true, onClick: () => setMarkerModalOpen(true), active: !!markerSortMode },
                    { label: "Contatos" },
                    { label: "Atendentes" },
                    { label: "Conversas" },
                    { label: "Status" },
                    { label: "SLA" },
                    { label: "Ações", sticky: true },
                  ].map(({ label, sort, sticky, onClick, active }) => (
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
                        {sort && <i className={`ph ${active ? "ph-arrow-down" : "ph-arrows-down-up"}`} style={{ fontSize: 11, opacity: active ? 1 : 0.5 }} />}
                        {active && (
                          <span style={{
                            background: c.primary, color: "#fff",
                            fontSize: 8, fontWeight: 700, padding: "1px 6px",
                            borderRadius: 999, marginLeft: 4,
                            textTransform: "uppercase", letterSpacing: "0.05em",
                          }}>{markerSortMode === "all" ? "todos" : "página"}</span>
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
                  return (
                    <tr key={a.id} style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: c.fg1, fontWeight: 500, whiteSpace: "nowrap" }}>{a.id}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: c.fg1, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.titulo.split("—")[0].trim()}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: c.fg2, whiteSpace: "nowrap" }}>{a.dataInicio}</td>
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
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        {sl ? (
                          <span style={{
                            background: sl.bg, color: sl.fg, fontSize: 11, fontWeight: 700,
                            padding: "3px 10px", borderRadius: 999,
                          }}>{a.slaTag}</span>
                        ) : "-"}
                      </td>
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
                          <button onClick={() => onOpenAtendimento(a.id)} title="Visualizar"
                            style={{
                              width: 28, height: 28, borderRadius: 8, border: 0,
                              background: "transparent", color: c.fg2, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = c.primaryLightest; e.currentTarget.style.color = c.primary; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.fg2; }}>
                            <i className="ph ph-eye" style={{ fontSize: 16 }} />
                          </button>
                          <button onClick={() => setEditAtendimentoId(a.id)} title="Editar"
                            style={{
                              width: 28, height: 28, borderRadius: 8, border: 0,
                              background: "transparent", color: c.fg2, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = c.primaryLightest; e.currentTarget.style.color = c.primary; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.fg2; }}>
                            <i className="ph ph-pencil-simple" style={{ fontSize: 16 }} />
                          </button>
                          <button
                            data-row-menu="1"
                            title="Ações"
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

      {/* Modal de ordenação por marcador */}
      {markerModalOpen && (
        <MarkerSortModal
          current={markerSortMode}
          onClose={() => setMarkerModalOpen(false)}
          onConfirm={(mode) => { setMarkerSortMode(mode); setMarkerModalOpen(false); }}
        />
      )}
    </section>
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
        <span key={i} title={p.name} style={{
          width: 26, height: 26, borderRadius: "50%",
          background: p.bg, color: p.fg, fontSize: 9, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid #fff", marginLeft: i === 0 ? 0 : -8,
        }}>{p.initials}</span>
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
    return [];
  };

  const isChecked = v => {
    if (openDd === "data")   return dateOpt === v;
    if (openDd === "status") return statusF.includes(v);
    if (openDd === "sla")    return slaF.includes(v);
    if (openDd === "ia")     return iaF.includes(v);
    return false;
  };

  const handleSelect = v => {
    if (openDd === "data")   { setDateOpt(v); return; }
    if (openDd === "status") { toggle(statusF, setStatusF, v); return; }
    if (openDd === "sla")    { toggle(slaF, setSlaF, v); return; }
    if (openDd === "ia")     { toggle(iaF, setIaF, v); return; }
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
// MarkerSortModal — pick grouping mode for the Marcadores column
// ─────────────────────────────────────────────
const MarkerSortModal = ({ current, onClose, onConfirm }) => {
  const c = window.CCM.c;
  const [mode, setMode] = React.useState(current || "page");

  const options = [
    {
      value: "page",
      title: "Ordenar por paginação",
      desc: "Agrupa por marcador apenas os atendimentos visíveis na página atual. Outras páginas mantêm sua ordem original.",
      icon: "ph-list-numbers",
    },
    {
      value: "all",
      title: "Ordenar por todos os atendimentos",
      desc: "Agrupa por marcador a lista inteira, independente da paginação. Itens podem mudar de página.",
      icon: "ph-stack",
    },
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
            <i className="ph ph-tag" style={{ fontSize: 18, color: c.primary }} />
            Ordenar por marcadores
          </h3>
          <button onClick={onClose} style={{
            border: 0, background: "transparent", color: c.fg2, cursor: "pointer",
            width: 30, height: 30, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><i className="ph ph-x" style={{ fontSize: 16 }} /></button>
        </div>
        <p style={{ margin: "0 0 18px", fontSize: 12, color: c.fg2, lineHeight: 1.5 }}>
          Escolha o escopo do agrupamento. A ordenação será aplicada a partir do primeiro marcador de cada atendimento.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {options.map(o => {
            const selected = mode === o.value;
            return (
              <label key={o.value} onClick={() => setMode(o.value)} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                background: selected ? c.primaryLightest : "#fff",
                border: `1.5px solid ${selected ? c.primary : c.border}`,
                transition: "background 150ms ease, border-color 150ms ease",
              }}>
                {/* Radio */}
                <span style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  border: `2px solid ${selected ? c.primary : c.border}`,
                  background: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {selected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.primary }} />}
                </span>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <i className={`ph ${o.icon}`} style={{ fontSize: 15, color: selected ? c.primary : c.fg2 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: selected ? c.primary : c.fg1 }}>
                      {o.title}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: c.fg2, marginTop: 4, lineHeight: 1.5 }}>
                    {o.desc}
                  </div>
                </div>
                <input type="radio" name="marker-sort-mode" checked={selected} readOnly
                  style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
              </label>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          {current ? (
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
            <button onClick={() => onConfirm(mode)} style={{
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
    <button onClick={(e) => { e.stopPropagation(); handler(); }} title={title}
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
const GanttView = ({ atendimentos, onOpenAtendimento, onEdit }) => {
  const c = window.CCM.c;

  // Parse "DD/MM/YY - HH:MM"
  const parseDate = (s) => {
    const [datePart, timePart] = s.split(" - ");
    const [dd, mm, yy] = datePart.split("/").map(Number);
    const [hh, min] = timePart.split(":").map(Number);
    return new Date(2000 + yy, mm - 1, dd, hh, min);
  };

  // Deterministic duration in hours based on id (range 4–28h)
  const durationHours = (id) => {
    let h = 0;
    for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return 4 + (h % 25);
  };

  const enriched = atendimentos.map(a => {
    const start = parseDate(a.dataInicio);
    const end = new Date(start.getTime() + durationHours(a.id) * 3600000);
    return { ...a, start, end };
  });

  // Compute range — round to day boundaries
  const minStart = new Date(Math.min(...enriched.map(a => a.start.getTime())));
  const maxEnd   = new Date(Math.max(...enriched.map(a => a.end.getTime())));
  minStart.setHours(0, 0, 0, 0);
  const rangeStart = minStart.getTime();
  // Round end to next-day midnight
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

            {/* Row tracks + bars */}
            {enriched.map((a, idx) => {
              const leftPx = ((a.start.getTime() - rangeStart) / 86400000) * DAY_WIDTH;
              const widthPx = Math.max(((a.end.getTime() - a.start.getTime()) / 86400000) * DAY_WIDTH, 36);
              const sv = statusVisuals(a.status);
              return (
                <div key={a.id} style={{
                  position: "relative",
                  height: ROW_HEIGHT,
                  borderBottom: `1px solid ${c.borderSoft}`,
                  background: idx % 2 === 1 ? "#fcfdfe" : "#fff",
                }}>
                  <div
                    title={`${a.titulo.split("—")[0].trim()} • ${fmtHM(a.start)} → ${fmtHM(a.end)}`}
                    onClick={() => onOpenAtendimento(a.id)}
                    style={{
                      position: "absolute",
                      left: leftPx, top: 8, height: ROW_HEIGHT - 16,
                      width: widthPx,
                      background: sv.bar,
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
                    {widthPx > 70 && (
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {fmtHM(a.start)} → {fmtHM(a.end)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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

  return (
    <div data-bc="1" style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0, flexWrap: "nowrap" }}>
      {segments.map((seg, i) => (
        <React.Fragment key={seg.key}>
          {i > 0 && (
            <span style={{ color: c.fg3, fontSize: 12, flexShrink: 0, padding: "0 2px" }}>/</span>
          )}
          {seg.noDropdown ? (
            <span style={{
              padding: "4px 8px",
              color: c.fg3,
              fontFamily: "Montserrat, sans-serif",
              fontSize: 12, fontWeight: 500,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}>{seg.label}</span>
          ) : (
            <button
              onClick={(e) => handleSegClick(seg, e)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 8px", borderRadius: 7,
                border: 0, background: openSeg === seg.key ? c.primaryLightest : "transparent",
                color: seg.isCurrent ? c.fg1 : c.fg2,
                fontFamily: "Montserrat, sans-serif",
                fontSize: 12, fontWeight: seg.isCurrent ? 700 : 500,
                cursor: "pointer",
                maxWidth: 240,
                minWidth: 0,
                transition: "background 120ms ease",
              }}
              onMouseEnter={e => { if (openSeg !== seg.key) e.currentTarget.style.background = c.borderSoft; }}
              onMouseLeave={e => { if (openSeg !== seg.key) e.currentTarget.style.background = "transparent"; }}
            >
              {seg.icon && <span style={{ fontSize: 13, flexShrink: 0 }}>{seg.icon}</span>}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {seg.label}
              </span>
              <i className="ph ph-caret-down" style={{ fontSize: 10, color: c.fg3, flexShrink: 0 }} />
            </button>
          )}
        </React.Fragment>
      ))}

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

Object.assign(window, { AtendimentosList, NovaConversaModal, QueueBreadcrumb });
