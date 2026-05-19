// QueueSidebar.jsx — Atendimentos panel (left) + queues tree + search
const QUEUE_SIDEBAR_MIN = 240;
const QUEUE_SIDEBAR_MAX = 480;
const QUEUE_SIDEBAR_DEFAULT = 340;

const QueueSidebar = ({ activeQueueId, onSelectQueue, chatTab = "atendimentos", onTabChange }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const [expanded, setExpanded] = React.useState({ "operacao-suporte": true });
  const [searchOpen, setSearchOpen] = React.useState(false);
  const searchBtnRef = React.useRef(null);
  const asideRef = React.useRef(null);
  const [width, setWidth] = React.useState(QUEUE_SIDEBAR_DEFAULT);
  const [resizing, setResizing] = React.useState(false);
  const [hoverHandle, setHoverHandle] = React.useState(false);

  React.useEffect(() => {
    if (!resizing) return;
    const left = asideRef.current?.getBoundingClientRect().left ?? 0;
    const onMove = (e) => {
      const w = Math.min(QUEUE_SIDEBAR_MAX, Math.max(QUEUE_SIDEBAR_MIN, e.clientX - left));
      setWidth(w);
    };
    const onUp = () => setResizing(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [resizing]);

  return (
    <aside ref={asideRef} style={{
      width, background: "#fff",
      borderRight: `1px solid ${c.border}`,
      display: "flex", flexDirection: "column", flexShrink: 0,
      position: "relative",
    }}>
      {/* Header row — same height as local header on the right (67px total) */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: `1px solid ${c.border}`,
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 40,
        }}>
          {/* Section title */}
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: c.fg1,
            whiteSpace: "nowrap",
          }}>
            Atendimentos
          </div>
          {/* Actions */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              ref={searchBtnRef}
              onClick={() => setSearchOpen(o => !o)}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 0,
                background: searchOpen ? c.primaryLightest : "transparent",
                color: searchOpen ? c.primary : c.fg2, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            ><i className="ph ph-magnifying-glass" style={{ fontSize: 16 }} /></button>
          </div>
        </div>
      </div>

      {/* Search popup (Notion-style modal) */}
      {searchOpen && (
        <SearchPopup
          buttonRef={searchBtnRef}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {/* Queues tree */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px" }}>
        {D.queues.map(q => (
          <React.Fragment key={q.id}>
            <QueueRow q={q} activeId={activeQueueId}
              expanded={expanded[q.id]}
              onToggle={() => setExpanded(e => ({ ...e, [q.id]: !e[q.id] }))}
              onSelect={() => !q.children && onSelectQueue(q.id)} />
            {q.children && expanded[q.id] && q.children.map(ch => (
              <QueueRow key={ch.id} q={ch} child activeId={activeQueueId}
                onSelect={() => onSelectQueue(ch.id)} />
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Resize handle */}
      <ResizeHandle
        onStart={() => setResizing(true)}
        onDoubleClick={() => setWidth(QUEUE_SIDEBAR_DEFAULT)}
        hover={hoverHandle}
        resizing={resizing}
        setHover={setHoverHandle}
        color={c.primary}
      />
    </aside>
  );
};

const ResizeHandle = ({ onStart, onDoubleClick, hover, resizing, setHover, color }) => {
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState(null);

  React.useEffect(() => {
    if (!hover || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ top: rect.top + 80, left: rect.right + 8 });
  }, [hover]);

  return (
    <div
      ref={ref}
      onMouseDown={(e) => { e.preventDefault(); onStart(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDoubleClick={onDoubleClick}
      title="Arrastar para redimensionar"
      style={{
        position: "absolute",
        top: 0, right: -3, bottom: 0,
        width: 6, cursor: "col-resize",
        zIndex: 5,
      }}
    >
      <div style={{
        position: "absolute", top: 0, bottom: 0, left: 2, width: 2,
        background: (hover || resizing) ? color : "transparent",
        transition: "background 150ms ease",
      }} />
      {hover && !resizing && pos && ReactDOM.createPortal(
        <div style={{
          position: "fixed", top: pos.top, left: pos.left,
          background: "#28293d", color: "#fff",
          padding: "8px 12px", borderRadius: 8,
          fontSize: 11, lineHeight: 1.5, whiteSpace: "nowrap",
          pointerEvents: "none", zIndex: 10000,
          boxShadow: "0 4px 14px rgba(0,0,0,0.28)",
          fontFamily: "Montserrat, sans-serif",
        }}>
          <div><strong>Arrastar</strong> para redimensionar</div>
          <div style={{ opacity: 0.7, fontSize: 10, marginTop: 2 }}>Duplo-clique para redefinir</div>
        </div>,
        document.body
      )}
    </div>
  );
};

const QueueRow = ({ q, child, activeId, expanded, onToggle, onSelect }) => {
  const c = window.CCM.c;
  const active = q.id === activeId;
  return (
    <div onClick={q.children ? onToggle : onSelect} style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: child ? "9px 12px 9px 36px" : "9px 12px",
      borderRadius: 10, cursor: "pointer",
      background: active ? c.primaryLightest : "transparent",
      color: active ? c.primaryDark : c.fg1,
      fontWeight: active ? 600 : 500, fontSize: 13,
      marginBottom: 2,
    }}>
      {q.children && (
        <i className={`ph ${expanded ? "ph-caret-down" : "ph-caret-right"}`} style={{ fontSize: 12, color: c.fg2 }} />
      )}
      <span style={{ fontSize: 14 }}>{q.icon}</span>
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.name}</span>
      <span style={{
        background: c.successLight, color: c.successDark,
        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, minWidth: 26, textAlign: "center",
      }}>{q.count}</span>
    </div>
  );
};

// ─────────────────────────────────────────────
// SearchPopup — Notion-style search modal
// ─────────────────────────────────────────────
const SEARCH_FILTERS = [
  { id: "atendimento", label: "Atendimento",     icon: "ph-tag",          placeholder: "Pesquisar por número do atendimento…" },
  { id: "operacao",    label: "Operação",        icon: "ph-buildings",    placeholder: "Pesquisar por operação…" },
  { id: "atendente",   label: "Atendente",       icon: "ph-user",         placeholder: "Pesquisar por atendente…" },
  { id: "contato",     label: "Dados do contato",icon: "ph-address-book", placeholder: "Pesquisar por dados do contato…",
    subFields: [
      { id: "cpf",      label: "CPF" },
      { id: "telefone", label: "Telefone" },
      { id: "email",    label: "E-mail" },
      { id: "nome",     label: "Nome" },
    ],
  },
];

const SearchPopup = ({ buttonRef, onClose }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const [query, setQuery] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState([]); // multi-select array of filter ids
  const [contatoFields, setContatoFields] = React.useState([]);
  const [pos, setPos] = React.useState(null);

  React.useLayoutEffect(() => {
    if (!buttonRef?.current) return;
    const r = buttonRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.left });
  }, [buttonRef]);

  // ESC closes
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Outside-click closes (but NOT clicks inside popup or on the trigger button)
  React.useEffect(() => {
    const h = (e) => {
      if (e.target.closest("[data-search-popup]")) return;
      if (buttonRef?.current && buttonRef.current.contains(e.target)) return;
      onClose();
    };
    // Defer attaching to next tick so the opening click doesn't immediately close
    const t = setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", h);
    };
  }, [onClose, buttonRef]);

  if (!pos) return null;

  const placeholder =
    activeFilters.length === 1
      ? SEARCH_FILTERS.find(f => f.id === activeFilters[0])?.placeholder
      : activeFilters.length > 1
        ? `Pesquisar em ${activeFilters.length} atributos…`
        : "Pesquisar atendimentos, contatos, filas…";

  const toggleContatoField = (fid) => {
    setContatoFields(prev => prev.includes(fid) ? prev.filter(x => x !== fid) : [...prev, fid]);
  };

  const toggleFilter = (fid) => {
    setActiveFilters(prev => {
      const exists = prev.includes(fid);
      const next = exists ? prev.filter(x => x !== fid) : [...prev, fid];
      // If removing "contato", also clear its sub-fields
      if (fid === "contato" && exists) setContatoFields([]);
      return next;
    });
  };

  return ReactDOM.createPortal(
    <div
      data-search-popup="1"
      style={{
        position: "fixed", top: pos.top, left: pos.left,
        width: 620, zIndex: 9999,
        background: "#fff",
        border: `1px solid ${c.border}`, borderRadius: 14,
        boxShadow: "0 12px 32px rgba(40,41,61,0.20)",
        padding: 18,
        fontFamily: "Montserrat, sans-serif",
        maxHeight: "82vh", overflowY: "auto",
      }}
    >
      {/* Search input */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        border: `1.5px solid ${activeFilters.length > 0 ? c.primary : c.border}`,
        borderRadius: 12, padding: "11px 14px",
        background: "#fff",
        transition: "border-color 150ms ease",
      }}>
        <i className="ph ph-magnifying-glass" style={{ fontSize: 16, color: c.fg3 }} />
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 0, outline: "none",
            fontFamily: "Montserrat, sans-serif",
            fontSize: 14, color: c.fg1, background: "transparent",
          }}
        />
        {query && (
          <i className="ph ph-x"
            onClick={() => setQuery("")}
            style={{ fontSize: 14, color: c.fg3, cursor: "pointer" }} />
        )}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 12, color: c.fg2,
        marginTop: 14, marginBottom: 8,
      }}>
        Selecione o atributo que deseja consultar
      </div>

      {/* Filter chips (multi-select) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {SEARCH_FILTERS.map(f => {
          const active = activeFilters.includes(f.id);
          return (
            <button
              key={f.id}
              onClick={() => toggleFilter(f.id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                height: 28, padding: "0 12px", borderRadius: 999,
                border: `1px solid ${active ? c.primary : c.border}`,
                background: active ? c.primaryLightest : "#fff",
                color: active ? c.primary : c.fg2,
                fontSize: 12, fontWeight: 600,
                cursor: "pointer", whiteSpace: "nowrap",
                fontFamily: "Montserrat, sans-serif",
                transition: "background 120ms ease, border-color 120ms ease",
              }}
            >
              <i className={`ph ${f.icon}`} style={{ fontSize: 13 }} />
              {f.label}
              {active && <i className="ph ph-check" style={{ fontSize: 11, marginLeft: 2 }} />}
            </button>
          );
        })}
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          height: 28, padding: "0 12px", borderRadius: 999,
          border: `1px dashed ${c.border}`, background: "transparent",
          color: c.fg3, fontSize: 12, fontWeight: 600, cursor: "pointer",
          fontFamily: "Montserrat, sans-serif",
        }}>
          <i className="ph ph-plus" style={{ fontSize: 12 }} />
          Filtro
        </button>
      </div>

      {/* Contato sub-fields (only when "contato" is active) */}
      {activeFilters.includes("contato") && (
        <div style={{
          marginTop: 10, padding: "10px 12px",
          background: c.primaryLightest, borderRadius: 10,
        }}>
          <div style={{ fontSize: 11, color: c.primary, fontWeight: 700, marginBottom: 8 }}>
            Selecione os campos a pesquisar:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {SEARCH_FILTERS.find(f => f.id === "contato").subFields.map(sf => {
              const checked = contatoFields.includes(sf.id);
              return (
                <button
                  key={sf.id}
                  onClick={() => toggleContatoField(sf.id)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    height: 26, padding: "0 11px", borderRadius: 999,
                    border: `1px solid ${checked ? c.primary : c.border}`,
                    background: checked ? c.primary : "#fff",
                    color: checked ? "#fff" : c.fg2,
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                    fontFamily: "Montserrat, sans-serif",
                    transition: "background 120ms ease",
                  }}
                >
                  {checked && <i className="ph ph-check" style={{ fontSize: 11 }} />}
                  {sf.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{
        height: 1, background: c.borderSoft,
        margin: "16px -18px",
      }} />

      {/* Recent or Results */}
      {query.trim()
        ? <SearchResultsContent query={query} activeFilters={activeFilters} />
        : <RecentSearchesContent />
      }
    </div>,
    document.body
  );
};

const RecentSearchesContent = () => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  return (
    <React.Fragment>
      <div style={{ fontSize: 12, fontWeight: 600, color: c.fg2, marginBottom: 10 }}>
        Pesquisas recentes
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {D.recentSearches.map(r => (
          <span key={r} style={{
            fontSize: 12, color: c.fg1, padding: "6px 14px", borderRadius: 999,
            border: `1px solid ${c.border}`, cursor: "pointer",
            background: "#fff",
          }}>{r}</span>
        ))}
      </div>
    </React.Fragment>
  );
};

const SearchResultsContent = ({ query, activeFilters = [] }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const q = query.trim();
  const isNumeric = /^\d/.test(q);
  const isText = q.length > 0 && !isNumeric;

  let contacts;
  if (isNumeric) {
    const digits = q.replace(/[^0-9]/g, "");
    contacts = [D.contacts.ana, D.contacts.marcos].filter(ct =>
      ct.phone.replace(/[^0-9]/g, "").includes(digits) ||
      ct.cpf.replace(/[^0-9]/g, "").includes(digits)
    );
    if (contacts.length === 0) contacts = [D.contacts.ana, D.contacts.marcos];
  } else {
    const lower = q.toLowerCase();
    contacts = Object.values(D.contacts).filter(ct =>
      ct.name.toLowerCase().includes(lower)
    );
    if (contacts.length === 0) contacts = [D.contacts.ana, D.contacts.marcos];
  }

  const highlight = (text, term) => {
    if (!term) return text;
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx < 0) return text;
    return (
      <React.Fragment>
        {text.slice(0, idx)}
        <span style={{ background: "#fff3a0", borderRadius: 3, padding: "0 2px" }}>
          {text.slice(idx, idx + term.length)}
        </span>
        {text.slice(idx + term.length)}
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.fg2 }}>Resultados</div>
        {activeFilters.length > 0 && (
          <div style={{ fontSize: 11, color: c.fg3 }}>
            Filtrando por: <span style={{ color: c.primary, fontWeight: 600 }}>
              {activeFilters.map(id => SEARCH_FILTERS.find(f => f.id === id)?.label).join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* Atendimento card */}
      <div style={{
        background: c.secundaryLightest, borderRadius: 10,
        padding: "12px 14px", marginBottom: 12,
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: c.fg1, marginBottom: 5 }}>
          Atendimento {highlight("012345678", isNumeric ? q : "")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: c.fg2 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <i className="ph ph-user" style={{ fontSize: 12 }} /> {highlight("Flavia Silva", isText ? q : "")}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <i className="ph ph-envelope" style={{ fontSize: 12 }} /> flavia@email.com
          </span>
          <span style={{
            background: c.successLight, color: c.successDark,
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
          }}>Aberto</span>
        </div>
      </div>

      {/* Contacts */}
      {contacts.slice(0, 3).map(ct => (
        <div key={ct.id} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 4px", borderTop: `1px solid ${c.borderSoft}`,
        }}>
          <span style={{
            width: 32, height: 32, borderRadius: "50%",
            background: ct.bg, color: ct.fg, fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>{ct.initials}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.fg1 }}>
              {highlight(ct.name, isText ? q : "")}
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 11, color: c.fg2, marginTop: 3 }}>
              <span><i className="ph ph-phone" /> {isNumeric ? highlight(ct.phone, q) : ct.phone}</span>
              <span><i className="ph ph-envelope" /> {ct.email}</span>
              <span>CPF: {isNumeric ? highlight(ct.cpf, q) : ct.cpf}</span>
            </div>
          </div>
        </div>
      ))}
    </React.Fragment>
  );
};

Object.assign(window, { QueueSidebar });
