// QueueSidebar.jsx — Atendimentos panel (left) + queues tree + search
const QUEUE_SIDEBAR_MIN = 240;
const QUEUE_SIDEBAR_MAX = 480;
const QUEUE_SIDEBAR_DEFAULT = 340;

const QueueSidebar = ({
  activeQueueId, onSelectQueue, chatTab = "atendimentos", onTabChange, onOpenAtendimento,
  viewScope = "all", onScopeChange,
  favoritesOnly = false, onFavoritesOnlyChange, favoritesCount = 0, favoritedIds,
}) => {
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ScopeToggle scope={viewScope} onChange={onScopeChange} />
            <FavoritesToggle
              active={favoritesOnly}
              count={favoritesCount}
              onClick={() => onFavoritesOnlyChange?.(!favoritesOnly)}
            />
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
          onOpenAtendimento={(id) => {
            setSearchOpen(false);
            onOpenAtendimento && onOpenAtendimento(id);
          }}
        />
      )}

      {/* Queues tree — quando favoritos ativos, esconde filas-folha sem nenhum
          atendimento favoritado mapeado pra elas (e pais sem filhos visíveis). */}
      <QueuesTree
        queues={D.queues}
        atendimentos={D.atendimentos}
        activeQueueId={activeQueueId}
        expanded={expanded}
        setExpanded={setExpanded}
        onSelectQueue={onSelectQueue}
        favoritesOnly={favoritesOnly}
        favoritedIds={favoritedIds}
      />

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

// ─────────────────────────────────────────────
// QueuesTree — renderiza a árvore de filas. Quando favoritos estão ativos,
// computa quantos favoritos cada fila-folha tem (via hash determinístico),
// esconde as que não têm e força a expansão dos pais com filhos visíveis.
// ─────────────────────────────────────────────
const QueuesTree = ({
  queues, atendimentos, activeQueueId,
  expanded, setExpanded, onSelectQueue,
  favoritesOnly, favoritedIds,
}) => {
  // Contagem real por fila-folha (sempre). Reflete o mapping determinístico
  // de atendimento→fila usado pela lista — assim o número verde do sidebar
  // bate com a quantidade de itens que realmente aparece na tabela.
  const realCountByQueue = React.useMemo(() => {
    const map = {};
    for (const a of atendimentos) {
      const qid = window.CCM.queueOfAtendimento(a.id, queues);
      if (!qid) continue;
      map[qid] = (map[qid] || 0) + 1;
    }
    return map;
  }, [atendimentos, queues]);

  // Contagem específica de favoritos por fila-folha (quando filtro ligado).
  const favCountByQueue = React.useMemo(() => {
    if (!favoritesOnly || !favoritedIds || favoritedIds.size === 0) return null;
    const map = {};
    for (const a of atendimentos) {
      if (!favoritedIds.has(a.id)) continue;
      const qid = window.CCM.queueOfAtendimento(a.id, queues);
      if (!qid) continue;
      map[qid] = (map[qid] || 0) + 1;
    }
    return map;
  }, [favoritesOnly, favoritedIds, atendimentos, queues]);

  // O countMap efetivo: favoritos quando filtro ligado, total real caso contrário.
  const countMap = favCountByQueue || realCountByQueue;

  // Soma dos filhos pra pais (count agregado)
  const countOfQueue = (q) => {
    if (q.children?.length) return q.children.reduce((sum, ch) => sum + (countMap[ch.id] || 0), 0);
    return countMap[q.id] || 0;
  };

  const queueIsVisible = (q) => {
    if (!favCountByQueue) return true;
    return countOfQueue(q) > 0;
  };

  const childIsVisible = (ch) => !favCountByQueue || (favCountByQueue[ch.id] || 0) > 0;

  // Quando favoritos ativos, expande automaticamente pais que têm filhos visíveis
  // pra evitar UX confusa (pai apareceria sem mostrar nada).
  React.useEffect(() => {
    if (!favCountByQueue) return;
    setExpanded(prev => {
      const next = { ...prev };
      for (const q of queues) {
        if (q.children?.length && queueIsVisible(q)) next[q.id] = true;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favCountByQueue]);

  const visibleQueues = queues.filter(queueIsVisible);

  if (favCountByQueue && visibleQueues.length === 0) {
    const c = window.CCM.c;
    return (
      <div style={{
        flex: 1, padding: "24px 16px",
        textAlign: "center", color: c.fg3, fontSize: 12,
      }}>
        <i className="ph ph-star" style={{ fontSize: 28, opacity: 0.4, display: "block", margin: "0 auto 8px" }} />
        Nenhuma fila tem atendimentos favoritados ainda.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px" }}>
      {visibleQueues.map(q => (
        <React.Fragment key={q.id}>
          <QueueRow
            q={{ ...q, count: countOfQueue(q) }}
            activeId={activeQueueId}
            expanded={expanded[q.id]}
            onToggle={() => setExpanded(e => ({ ...e, [q.id]: !e[q.id] }))}
            onSelect={() => !q.children && onSelectQueue(q.id)}
          />
          {q.children && expanded[q.id] && q.children.filter(childIsVisible).map(ch => (
            <QueueRow
              key={ch.id}
              q={{ ...ch, count: countMap[ch.id] || 0 }}
              child
              activeId={activeQueueId}
              onSelect={() => onSelectQueue(ch.id)}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// ScopeToggle — Segmented control sutil (👤 Meus / 👥 Todos)
// Vive no header da QueueSidebar entre o título e o ícone de search.
// Decisão de design: muito discreto — bg cinza claro, item ativo vira card
// branco com sombra mínima. Ícones-only, tooltip nativo via title=.
// ─────────────────────────────────────────────
const ScopeToggleButton = ({ active, onClick, icon, tooltip, color }) => {
  const c = window.CCM.c;
  const ref = React.useRef(null);
  const [hover, setHover] = React.useState(false);
  const [pos, setPos] = React.useState(null);

  React.useEffect(() => {
    if (!hover || !ref.current) { setPos(null); return; }
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.left + r.width / 2 });
  }, [hover]);

  return (
    <React.Fragment>
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={tooltip}
        onMouseEnter={(e) => {
          setHover(true);
          if (!active) e.currentTarget.style.color = c.fg2;
        }}
        onMouseLeave={(e) => {
          setHover(false);
          if (!active) e.currentTarget.style.color = c.fg3;
        }}
        style={{
          width: 26, height: 26, borderRadius: 6, border: 0,
          background: active ? "#fff" : "transparent",
          color: active ? c.primary : c.fg3,
          boxShadow: active ? "0 1px 2px rgba(40,41,61,0.10)" : "none",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 150ms ease, color 150ms ease",
          fontFamily: "Montserrat, sans-serif",
        }}
      >
        <i className={`ph ${icon}`} style={{ fontSize: 14 }} />
      </button>
      {hover && pos && ReactDOM.createPortal(
        <div style={{
          position: "fixed",
          top: pos.top, left: pos.left,
          transform: "translateX(-50%)",
          background: "#28293d", color: "#fff",
          padding: "6px 10px", borderRadius: 6,
          fontSize: 12, fontWeight: 500,
          whiteSpace: "nowrap",
          boxShadow: "0 4px 12px rgba(40,41,61,0.18)",
          pointerEvents: "none",
          zIndex: 10002,
          fontFamily: "Montserrat, sans-serif",
        }}>
          {tooltip}
        </div>,
        document.body
      )}
    </React.Fragment>
  );
};

// ─────────────────────────────────────────────
// FavoritesToggle — estrela única que filtra para "só favoritos"
// Mora ao lado do ScopeToggle. Tooltip dark portalado pro body.
// Quando ativo, fica preenchida em laranja com badge da contagem.
// ─────────────────────────────────────────────
const FavoritesToggle = ({ active, count, onClick }) => {
  const c = window.CCM.c;
  const ref = React.useRef(null);
  const [hover, setHover] = React.useState(false);
  const [pos, setPos] = React.useState(null);

  React.useEffect(() => {
    if (!hover || !ref.current) { setPos(null); return; }
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.left + r.width / 2 });
  }, [hover]);

  const tooltip = active ? "Mostrar todos os atendimentos" : "Ver só meus favoritos";

  return (
    <React.Fragment>
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-pressed={active}
        aria-label={tooltip}
        style={{
          position: "relative",
          width: 30, height: 30, borderRadius: 8, border: 0,
          background: active ? "#fff4e0" : "transparent",
          color: active ? "#f5a623" : c.fg2,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 150ms ease, color 150ms ease",
          flexShrink: 0,
        }}
      >
        <i className={`ph${active ? "-fill" : ""} ph-star`} style={{ fontSize: 16 }} />
        {count > 0 && (
          <span style={{
            position: "absolute", top: -2, right: -2,
            background: active ? "#f5a623" : c.fg2,
            color: "#fff", fontSize: 9, fontWeight: 700,
            minWidth: 14, height: 14, padding: "0 4px",
            borderRadius: 999,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #fff",
            lineHeight: 1,
          }}>{count}</span>
        )}
      </button>
      {hover && pos && ReactDOM.createPortal(
        <div style={{
          position: "fixed",
          top: pos.top, left: pos.left,
          transform: "translateX(-50%)",
          background: "#28293d", color: "#fff",
          padding: "6px 10px", borderRadius: 6,
          fontSize: 12, fontWeight: 500,
          whiteSpace: "nowrap",
          boxShadow: "0 4px 12px rgba(40,41,61,0.18)",
          pointerEvents: "none",
          zIndex: 10002,
          fontFamily: "Montserrat, sans-serif",
        }}>{tooltip}</div>,
        document.body
      )}
    </React.Fragment>
  );
};

const ScopeToggle = ({ scope = "all", onChange }) => {
  const c = window.CCM.c;
  const items = [
    { v: "mine", icon: "ph-user",  tooltip: "Somente os meus atendimentos" },
    { v: "all",  icon: "ph-users", tooltip: "Todos os atendimentos" },
  ];
  return (
    <div style={{
      display: "inline-flex",
      background: c.borderSoft,
      borderRadius: 8,
      padding: 2, gap: 2,
      flexShrink: 0,
    }}>
      {items.map(it => (
        <ScopeToggleButton
          key={it.v}
          active={scope === it.v}
          onClick={() => onChange?.(it.v)}
          icon={it.icon}
          tooltip={it.tooltip}
        />
      ))}
    </div>
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
// SearchPopup — Pesquisa de atendimentos
// Resultado sempre = atendimentos (com olhinho pra abrir peek).
// Os chips são filtros rápidos que restringem em QUAIS campos a query casa.
// Multi-select: zero chips = busca em todos; um ou mais = busca só nesses.
// "Dados do contato" tem sub-fields (CPF, Telefone, E-mail, Nome).
// ─────────────────────────────────────────────
const SEARCH_FILTERS = [
  { id: "atendimento", label: "Atendimento",      icon: "ph-tag" },
  { id: "operacao",    label: "Operação",         icon: "ph-buildings" },
  { id: "atendente",   label: "Atendente",        icon: "ph-user" },
  { id: "contato",     label: "Dados do contato", icon: "ph-address-book",
    subFields: [
      { id: "id_contato", label: "ID do contato" },
      { id: "nome",       label: "Nome" },
      { id: "email",      label: "E-mail" },
      { id: "telefone",   label: "Telefone" },
      { id: "cpf",        label: "CPF" },
    ] },
  { id: "conversa",    label: "Conversa",         icon: "ph-chats-circle" },
];

const SearchPopup = ({ buttonRef, onClose, onOpenAtendimento }) => {
  const c = window.CCM.c;
  const [query, setQuery] = React.useState("");
  const [activeFilters, setActiveFilters] = React.useState([]);   // multi-select de filter ids
  const [contatoFields, setContatoFields] = React.useState([]);   // sub-fields de "contato"
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
    const t = setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", h);
    };
  }, [onClose, buttonRef]);

  if (!pos) return null;

  const toggleFilter = (fid) => {
    setActiveFilters(prev => {
      const exists = prev.includes(fid);
      const next = exists ? prev.filter(x => x !== fid) : [...prev, fid];
      if (fid === "contato" && exists) setContatoFields([]);
      return next;
    });
  };
  const toggleContatoField = (sf) => {
    setContatoFields(prev => prev.includes(sf) ? prev.filter(x => x !== sf) : [...prev, sf]);
  };

  // Placeholder muda conforme os filtros ativos
  let placeholder;
  if (activeFilters.length === 0) {
    placeholder = "Pesquisar atendimentos, contatos, filas…";
  } else if (activeFilters.length === 1) {
    const labelById = {
      atendimento: "Pesquisar por número do atendimento…",
      operacao:    "Pesquisar por operação ou fila…",
      atendente:   "Pesquisar por nome do atendente…",
      contato:     "Pesquisar por dados do contato…",
      conversa:    "Pesquisar pelo ID da conversa…",
    };
    placeholder = labelById[activeFilters[0]];
  } else {
    placeholder = `Pesquisar em ${activeFilters.length} atributos…`;
  }

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
      <div style={{ fontSize: 12, color: c.fg2, marginTop: 14, marginBottom: 8 }}>
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
      </div>

      {/* Sub-fields de "Dados do contato" */}
      {activeFilters.includes("contato") && (
        <div style={{
          marginTop: 10, padding: "10px 12px",
          background: c.primaryLightest, borderRadius: 10,
        }}>
          <div style={{ fontSize: 11, color: c.primary, fontWeight: 700, marginBottom: 8 }}>
            Campos do contato (deixe vazio pra buscar em todos):
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
      <div style={{ height: 1, background: c.borderSoft, margin: "16px -18px" }} />

      {/* Recent or Results */}
      {query.trim()
        ? <SearchResultsContent
            query={query}
            activeFilters={activeFilters}
            contatoFields={contatoFields}
            onOpenAtendimento={onOpenAtendimento}
          />
        : <RecentSearchesContent onPick={(q) => setQuery(q)} />
      }
    </div>,
    document.body
  );
};

const RecentSearchesContent = ({ onPick }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  return (
    <React.Fragment>
      <div style={{ fontSize: 12, fontWeight: 600, color: c.fg2, marginBottom: 10 }}>
        Pesquisas recentes
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {D.recentSearches.map(r => (
          <span
            key={r}
            onClick={() => onPick && onPick(r)}
            style={{
              fontSize: 12, color: c.fg1, padding: "6px 14px", borderRadius: 999,
              border: `1px solid ${c.border}`, cursor: "pointer",
              background: "#fff",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = c.primaryLightest; e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.color = c.primary; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.fg1; }}
          >{r}</span>
        ))}
      </div>
    </React.Fragment>
  );
};

// Normaliza string: minúsculas + sem acento + sem espaços/pontuação pra match relaxado
const normalize = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const digitsOnly = (s) => (s || "").replace(/\D+/g, "");

const STATUS_COLORS = {
  "Aberto":     { bg: "#E0F8E6", fg: "#1f7a3a" },
  "Aberta":     { bg: "#E0F8E6", fg: "#1f7a3a" },
  "Pendente":   { bg: "#FFE9CC", fg: "#9b4500" },
  "Encerrado":  { bg: "#EEEFF3", fg: "#52555f" },
  "Encerrada":  { bg: "#EEEFF3", fg: "#52555f" },
  "Finalizada": { bg: "#EEEFF3", fg: "#52555f" },
};

const highlightMatch = (text, term) => {
  if (!term || !text) return text;
  const idx = normalize(text).indexOf(normalize(term));
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

const SearchResultsContent = ({ query, activeFilters = [], contatoFields = [], onOpenAtendimento }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const q = query.trim();
  const qNorm = normalize(q);
  const qDigits = digitsOnly(q);

  // Sem filtros ativos: busca em TUDO. Com filtros: só nos campos selecionados.
  const has = (f) => activeFilters.length === 0 || activeFilters.includes(f);

  // Sub-filtro de Dados do contato: se nenhum sub-field marcado, busca em todos.
  const contatoAllowsAll = contatoFields.length === 0;
  const matchesContato = (contact) => {
    if (!contact) return false;
    const checks = [];
    if (contatoAllowsAll || contatoFields.includes("id_contato"))
      checks.push(qNorm && normalize(String(contact.id || "")).includes(qNorm));
    if (contatoAllowsAll || contatoFields.includes("nome"))
      checks.push(qNorm && normalize(contact.name).includes(qNorm));
    if (contatoAllowsAll || contatoFields.includes("email"))
      checks.push(qNorm && normalize(contact.email).includes(qNorm));
    if (contatoAllowsAll || contatoFields.includes("telefone"))
      checks.push(qDigits && digitsOnly(contact.phone).includes(qDigits));
    if (contatoAllowsAll || contatoFields.includes("cpf"))
      checks.push(qDigits && digitsOnly(contact.cpf).includes(qDigits));
    return checks.some(Boolean);
  };

  const matchedConvByAt = {};
  const results = (D.atendimentos || []).filter(at => {
    const contact = at.contatos?.[0];
    if (!contact) return false;

    // Atendimento (ID)
    if (has("atendimento") && qDigits && at.id.includes(qDigits)) return true;
    // Operação / fila (nome da fila vinculada à conversa principal)
    if (has("operacao")) {
      const filaName = at.conversas?.[0]?.fila || at.tipo || "";
      if (qNorm && normalize(filaName).includes(qNorm)) return true;
    }
    // Atendente
    if (has("atendente")) {
      const atendentes = at.atendentes || [];
      const hit = atendentes.some(a => qNorm && normalize(a.name).includes(qNorm));
      if (hit) return true;
    }
    // Dados do contato
    if (has("contato") && matchesContato(contact)) return true;
    // Conversa (id)
    if (has("conversa")) {
      const conversas = at.conversas || [];
      const hit = conversas.find(cv => {
        const cvId = String(cv.id || "");
        if (qDigits) return digitsOnly(cvId).includes(qDigits);
        return normalize(cvId).includes(qNorm);
      });
      if (hit) {
        matchedConvByAt[at.id] = hit.id;
        return true;
      }
    }
    return false;
  });

  return (
    <React.Fragment>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.fg2 }}>
          {results.length === 0
            ? "Nenhum atendimento encontrado"
            : `${results.length} ${results.length === 1 ? "atendimento" : "atendimentos"}`}
        </div>
        {activeFilters.length > 0 && (
          <div style={{ fontSize: 11, color: c.fg3 }}>
            Filtrando por:{" "}
            <span style={{ color: c.primary, fontWeight: 600 }}>
              {activeFilters.map(id => SEARCH_FILTERS.find(f => f.id === id)?.label).join(", ")}
            </span>
          </div>
        )}
      </div>

      {results.length === 0 && (
        <div style={{
          padding: "24px 12px", textAlign: "center", color: c.fg3,
          fontSize: 13, lineHeight: 1.5,
        }}>
          Nenhum atendimento para <strong style={{ color: c.fg2 }}>"{q}"</strong>.
          <div style={{ fontSize: 11, color: c.fg3, marginTop: 6 }}>
            Tente outra busca ou ajuste os filtros acima.
          </div>
        </div>
      )}

      {results.slice(0, 12).map(at => {
        const contact = at.contatos[0];
        const status = at.status || "Aberto";
        const statusColor = STATUS_COLORS[status] || { bg: "#EEEFF3", fg: "#52555f" };
        return (
          <SearchResultRow
            key={at.id}
            atendimento={at}
            contact={contact}
            status={status}
            statusColor={statusColor}
            query={q}
            matchedConvId={matchedConvByAt[at.id]}
            onOpen={() => onOpenAtendimento && onOpenAtendimento(at.id)}
          />
        );
      })}
    </React.Fragment>
  );
};

const SearchResultRow = ({ atendimento, contact, status, statusColor, query, matchedConvId, onOpen }) => {
  const c = window.CCM.c;
  const [hover, setHover] = React.useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        background: hover ? c.primaryLightest : c.secundaryLightest,
        border: `1px solid ${hover ? c.primary : "transparent"}`,
        borderRadius: 10, padding: "12px 14px",
        marginBottom: 8, cursor: "pointer",
        transition: "background 120ms ease, border-color 120ms ease",
        outline: "none",
      }}
      title="Abrir atendimento"
    >
      <span style={{
        width: 32, height: 32, borderRadius: "50%",
        background: contact.bg, color: contact.fg,
        fontSize: 11, fontWeight: 700, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{contact.initials}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 14, fontWeight: 600, color: c.fg1, marginBottom: 4,
        }}>
          <span>Atendimento {highlightMatch(atendimento.id, query)}</span>
          <span style={{
            background: statusColor.bg, color: statusColor.fg,
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
          }}>{status}</span>
          {matchedConvId && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: c.primaryLightest, color: c.primary,
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
            }}>
              <i className="ph ph-chats-circle" style={{ fontSize: 11 }} />
              Conversa {highlightMatch(String(matchedConvId), query)}
            </span>
          )}
        </div>
        <div style={{
          display: "flex", flexWrap: "wrap", alignItems: "center",
          gap: "4px 12px", fontSize: 12, color: c.fg2,
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <i className="ph ph-user" style={{ fontSize: 12 }} />
            {highlightMatch(contact.name, query)}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <i className="ph ph-envelope" style={{ fontSize: 12 }} />
            {highlightMatch(contact.email, query)}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <i className="ph ph-phone" style={{ fontSize: 12 }} />
            {highlightMatch(contact.phone, query)}
          </span>
        </div>
      </div>

      <span
        aria-label="Visualizar atendimento"
        title="Visualizar atendimento"
        style={{
          width: 32, height: 32, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: hover ? c.primary : c.fg3,
          background: hover ? "#fff" : "transparent",
          flexShrink: 0,
          transition: "background 120ms ease, color 120ms ease",
        }}
      >
        <i className="ph ph-eye" style={{ fontSize: 18 }} />
      </span>
    </div>
  );
};

Object.assign(window, { QueueSidebar });
