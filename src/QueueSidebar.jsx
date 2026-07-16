// QueueSidebar.jsx — Atendimentos panel (left) + queues tree + search
// =====================================================================
// DE-PARA REACT → ANGULAR  ·  QueueSidebar.jsx
// ---------------------------------------------------------------------
// Sidebar esquerda da visão "Atendimentos" (árvore de filas + busca + escopo).
// Módulo Angular: @modules/chat-one-to-one  (rota /atendimentos).
//
//   QueueSidebar       → TicketsDashSidebarComponent  <app-tickets-dash-sidebar>
//                        @modules/chat-one-to-one/components/tickets-dash-sidebar/
//   QueuesTree/QueueRow→ árvore de filas/operações DENTRO do tickets-dash-sidebar
//                        (no Angular as filas vêm do módulo @modules/operation)
//   ScopeToggle        → segmented "Meus/Todos/Favoritos/SLA": no Angular fica no
//                        header do tickets-dash-sidebar (mat-button-toggle / chips)
//   SearchPopup        → busca global de atendimentos/contatos. Equivalente:
//                        TicketsDashTable usa filtros; busca de conversas =
//                        ChatTalksListComponent <app-chat-talks-list> +
//                        talks-list-filter-menu / talks-list-sort-filter
//   SearchResultRow /
//   ContactResultRow   → linhas de resultado (usar AvatarComponent <ccm-avatar>
//                        + chips .ccm-chips). Badge de contagem verde = .ccm-badget.success
//   ResizeHandle       → splitter (no Angular: angular-split / CDK drag) — sem 1:1
// OBS: a visão "Conversas" (tab irmã) usa ChatSidebarComponent <app-chat-sidebar>
//      + ChatFoldersListComponent <app-chat-folders-list>.
// Doc: de-para/02-componentes.md
// =====================================================================
const QUEUE_SIDEBAR_MIN = 240;
const QUEUE_SIDEBAR_MAX = 480;
const QUEUE_SIDEBAR_DEFAULT = 340;

const QueueSidebar = ({
  activeQueueId, onSelectQueue, chatTab = "atendimentos", onTabChange, onOpenAtendimento,
  onOpenContact,
  viewScope = "all", onScopeChange,
  favoritesCount = 0, favoritedIds,
}) => {
  // Favoritos só são "o filtro ativo" quando viewScope === "favorites"
  const favoritesOnly = viewScope === "favorites";
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const [expanded, setExpanded] = React.useState({ "sem-operacao": true, "operacao-suporte": true });
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
            <ScopeToggle
              scope={viewScope}
              onChange={onScopeChange}
              favoritesCount={favoritesCount}
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
          onOpenContact={(id) => {
            setSearchOpen(false);
            onOpenContact && onOpenContact(id);
          }}
        />
      )}

      {/* Queues tree — escondida no modo SLA (a view por SLA ignora filas).
          No modo Favoritos, esconde filas-folha sem favoritos. */}
      {viewScope === "sla" ? (
        <div style={{
          flex: 1, padding: "32px 18px",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center", color: c.fg3, fontSize: 12, lineHeight: 1.5,
        }}>
          <i className="ph ph-clock-countdown" style={{ fontSize: 32, color: "#c8362b", marginBottom: 10 }} />
          <div style={{ color: c.fg1, fontWeight: 600, marginBottom: 4 }}>
            Visão por SLA ativa
          </div>
          <div>
            Todos os atendimentos, de todas as filas e operações, ordenados pelo atraso.
          </div>
        </div>
      ) : (
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
      )}

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

  // "Sem resposta" por fila-folha: contagem de atendimentos daquela fila com
  // pelo menos uma conversa não finalizada em que a última mensagem é do
  // contato (mesma regra usada na lista e no ConvCard).
  const semRespostaByQueue = React.useMemo(() => {
    const atendimentoHasSemResposta = (a) => {
      const convs = Array.isArray(a.conversas) ? a.conversas : [];
      return convs.some(cv => {
        if (cv.status === "Finalizada") return false;
        const msgs = Array.isArray(cv.messages) ? cv.messages : [];
        for (let i = msgs.length - 1; i >= 0; i--) {
          const m = msgs[i];
          if (!m || m.type || !m.role) continue;
          return m.role === "contact";
        }
        return false;
      });
    };
    const map = {};
    for (const a of atendimentos) {
      if (!atendimentoHasSemResposta(a)) continue;
      const qid = window.CCM.queueOfAtendimento(a.id, queues);
      if (!qid) continue;
      map[qid] = (map[qid] || 0) + 1;
    }
    return map;
  }, [atendimentos, queues]);

  const semRespostaOfQueue = (q) => {
    if (q.children?.length) return q.children.reduce((sum, ch) => sum + (semRespostaByQueue[ch.id] || 0), 0);
    return semRespostaByQueue[q.id] || 0;
  };

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

  // Landing de Favoritos sem nada favoritado — esconde a árvore de filas
  // inteira e mostra um empty state explicativo no lugar.
  const noFavoritesYet = favoritesOnly && favoritedIds && favoritedIds.size === 0;
  if (noFavoritesYet) {
    const c = window.CCM.c;
    const starColor = "#f5a623";
    const starBg = "#fff4e0";
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px 20px", textAlign: "center", gap: 12,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: starBg, color: starColor,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <i className="ph-fill ph-star" style={{ fontSize: 22 }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: c.fg1 }}>
          Suas filas favoritas
          <br />aparecerão aqui
        </div>
        <div style={{ fontSize: 11, color: c.fg2, lineHeight: 1.5, maxWidth: 240 }}>
          Para favoritar atendimentos, troque para
          {" "}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            background: c.borderSoft, color: c.fg1,
            fontWeight: 600, padding: "1px 6px", borderRadius: 4,
            verticalAlign: "middle",
          }}>
            <i className="ph ph-user" style={{ fontSize: 10 }} /> Meus
          </span>
          {" "}ou{" "}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            background: c.borderSoft, color: c.fg1,
            fontWeight: 600, padding: "1px 6px", borderRadius: 4,
            verticalAlign: "middle",
          }}>
            <i className="ph ph-users" style={{ fontSize: 10 }} /> Todos
          </span>
          {" "}no topo.
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 16px" }}>
      {visibleQueues.map(q => (
        <React.Fragment key={q.id}>
          <QueueRow
            q={{ ...q, count: countOfQueue(q) }}
            semResposta={semRespostaOfQueue(q)}
            activeId={activeQueueId}
            expanded={expanded[q.id]}
            onToggle={() => setExpanded(e => ({ ...e, [q.id]: !e[q.id] }))}
            onSelect={() => !q.children && onSelectQueue(q.id)}
          />
          {q.children && expanded[q.id] && q.children.filter(childIsVisible).map(ch => (
            <QueueRow
              key={ch.id}
              q={{ ...ch, count: countMap[ch.id] || 0 }}
              semResposta={semRespostaByQueue[ch.id] || 0}
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
const ScopeToggleButton = ({ active, onClick, icon, tooltip, badge, activeColor, activeBg }) => {
  const c = window.CCM.c;
  const ref = React.useRef(null);
  const [hover, setHover] = React.useState(false);
  const [pos, setPos] = React.useState(null);

  React.useEffect(() => {
    if (!hover || !ref.current) { setPos(null); return; }
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: r.left + r.width / 2 });
  }, [hover]);

  const colorOnActive = activeColor || c.primary;
  const bgOnActive = activeBg || "#fff";
  const iconFilled = active && icon === "ph-star"; // estrela fica preenchida quando ativa

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
          position: "relative",
          width: 26, height: 26, borderRadius: 6, border: 0,
          background: active ? bgOnActive : "transparent",
          color: active ? colorOnActive : c.fg3,
          boxShadow: active ? "0 1px 2px rgba(40,41,61,0.10)" : "none",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 150ms ease, color 150ms ease",
          fontFamily: "Montserrat, sans-serif",
        }}
      >
        <i className={`ph${iconFilled ? "-fill" : ""} ${icon}`} style={{ fontSize: 14 }} />
        {badge != null && badge > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: active ? colorOnActive : c.fg2,
            color: "#fff", fontSize: 9, fontWeight: 700,
            minWidth: 14, height: 14, padding: "0 4px",
            borderRadius: 999,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid " + (active ? bgOnActive : c.borderSoft),
            lineHeight: 1,
          }}>{badge}</span>
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
        }}>
          {tooltip}
        </div>,
        document.body
      )}
    </React.Fragment>
  );
};

// Segmented control com 4 opções mutuamente exclusivas:
//   Meus | Todos | Favoritos | SLA
// "Favoritos" mostra badge de contagem + cor laranja quando ativo.
// "SLA" é uma view dramática: esconde sidebar/breadcrumb e mostra todos
// os atendimentos ordenados pelo atraso (do maior pro menor).
const ScopeToggle = ({ scope = "all", onChange, favoritesCount = 0 }) => {
  const c = window.CCM.c;
  const items = [
    { v: "mine",      icon: "ph-user",  tooltip: "Somente os meus atendimentos" },
    { v: "all",       icon: "ph-users", tooltip: "Todos os atendimentos" },
    { v: "favorites", icon: "ph-star",  tooltip: "Apenas meus favoritos",
      activeColor: "#f5a623", activeBg: "#fff4e0", badge: favoritesCount },
    { v: "sla",       icon: "ph-clock", tooltip: "Atendimentos por SLA",
      activeColor: "#c8362b", activeBg: "#ffdde3" },
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
          badge={it.badge}
          activeColor={it.activeColor}
          activeBg={it.activeBg}
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
      aria-label="Arrastar para redimensionar — duplo-clique para redefinir"
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

const QueueRow = ({ q, child, activeId, expanded, onToggle, onSelect, semResposta = 0 }) => {
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
      {semResposta > 0 && (
        <CCMTooltip label={`Esta fila tem ${semResposta} atendimento${semResposta > 1 ? "s" : ""} com conversa sem resposta`}>
          <span aria-label="Sem resposta nesta fila" style={{
            width: 16, height: 16, borderRadius: "50%",
            background: "#f39023", color: "#fff",
            fontSize: 10, fontWeight: 700,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <i className="ph-fill ph-warning" style={{ fontSize: 9 }} />
          </span>
        </CCMTooltip>
      )}
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

const SearchPopup = ({ buttonRef, onClose, onOpenAtendimento, onOpenContact }) => {
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
            onOpenContact={onOpenContact}
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

const SearchResultsContent = ({ query, activeFilters = [], contatoFields = [], onOpenAtendimento, onOpenContact }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const q = query.trim();
  const qNorm = normalize(q);
  const qDigits = digitsOnly(q);

  // ── Máquina de fases de carregamento ──────────────────────────────────
  // Simula o caso real onde o backend pode demorar pra responder e onde
  // o primeiro round vem com os "últimos 30 dias" (subset pequeno),
  // depois o histórico completo chega e a paginação aparece.
  //
  //   initial-loading  → skeleton rows enquanto não veio nada
  //   recent           → mostra o subset (RECENT_SUBSET_SIZE itens)
  //   loading-more     → recent + spinner "buscando no histórico completo"
  //   full             → página completa + paginação
  //
  // No Angular: substituir os timeouts por chamadas reais a 2 endpoints
  // (ou 1 endpoint com parâmetro `period=last30`, depois `period=all`).
  const [phase, setPhase] = React.useState("initial-loading");
  const [page, setPage] = React.useState(1);
  // Filtro "atendimentos deste contato" — acionado pelo funil no card de contato.
  // Quando setado, restringe a lista de atendimentos ao contact.id selecionado.
  const [contactFilterId, setContactFilterId] = React.useState(null);

  // Recarrega ao mudar query OU filtros (chips de atributo / sub-campos)
  const reloadKey = q + "|" + activeFilters.join(",") + "|" + contatoFields.join(",");
  React.useEffect(() => {
    setPhase("initial-loading");
    setPage(1);
    setContactFilterId(null); // limpa o filtro de contato em qualquer mudança de busca
    const t1 = setTimeout(() => setPhase("recent"),       SEARCH_SKELETON_MS);
    const t2 = setTimeout(() => setPhase("loading-more"), SEARCH_SKELETON_MS + SEARCH_RECENT_MS);
    const t3 = setTimeout(() => setPhase("full"),         SEARCH_FULL_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [reloadKey]);

  // Aplicar/limpar filtro por contato sempre reseta pra página 1.
  const applyContactFilter = React.useCallback((id) => {
    setContactFilterId(prev => prev === id ? null : id); // clica de novo no mesmo → limpa
    setPage(1);
  }, []);

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

  // Contatos únicos que casam com a query — só aparece quando "Dados do contato"
  // está ativo (ou nenhum filtro). Renderizado em seção própria acima dos atendimentos.
  const showContactSection = activeFilters.length === 0 || activeFilters.includes("contato");
  const contactResults = showContactSection
    ? Object.values(D.contacts || {}).filter(matchesContato)
    : [];

  const matchedConvByAt = {};
  const allResults = (D.atendimentos || []).filter(at => {
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

  // Se houver filtro de contato ativo, restringe os atendimentos àquele id.
  // contactResults segue mostrando todos os contatos casados pela query (com
  // o card filtrado em destaque), pra dar contexto e permitir trocar de contato.
  const filteredResults = contactFilterId
    ? allResults.filter(at => at.contatos?.[0]?.id === contactFilterId)
    : allResults;

  const filteredContact = contactFilterId
    ? (contactResults.find(ct => ct.id === contactFilterId)
       || (D.contacts && D.contacts[contactFilterId])
       || null)
    : null;

  const totalResults = filteredResults.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / SEARCH_PAGE_SIZE));

  // Subset "últimos 30 dias" — demo simula que o backend devolveu só os
  // RECENT_SUBSET_SIZE primeiros itens no 1º round.
  const recentResults = filteredResults.slice(0, Math.min(RECENT_SUBSET_SIZE, totalResults));
  const hasMoreToLoad = totalResults > recentResults.length;

  // Derivações de UI a partir da fase atual
  const isSearching   = phase === "initial-loading";
  const isRecentPhase = phase === "recent" || phase === "loading-more";
  const isFinal       = phase === "full";
  const showSkeletons    = isSearching;
  const showLoadingMore  = phase === "loading-more" && hasMoreToLoad;
  const showPagination   = isFinal && totalPages > 1;

  let visibleAtendimentos;
  if (isSearching) {
    visibleAtendimentos = [];
  } else if (isRecentPhase) {
    visibleAtendimentos = recentResults;
  } else {
    const start = (page - 1) * SEARCH_PAGE_SIZE;
    visibleAtendimentos = filteredResults.slice(start, start + SEARCH_PAGE_SIZE);
  }

  const noHits = isFinal && totalResults === 0 && contactResults.length === 0;

  // Resumo (header) — muda conforme a fase
  const renderSummary = () => {
    if (isSearching) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <i className="ph ph-circle-notch ccm-spin" style={{ fontSize: 12, color: c.primary }} />
          Buscando "{q}"…
        </span>
      );
    }
    if (noHits) return "Nenhum resultado encontrado";
    const parts = [];
    if (contactResults.length > 0)
      parts.push(`${contactResults.length} ${contactResults.length === 1 ? "contato" : "contatos"}`);
    if (totalResults > 0) {
      if (isRecentPhase) {
        parts.push(`${recentResults.length} de ${totalResults} atendimentos (últimos 30 dias)`);
      } else {
        parts.push(`${totalResults} ${totalResults === 1 ? "atendimento" : "atendimentos"}`);
      }
    }
    return parts.join(" · ");
  };

  return (
    <React.Fragment>
      {/* keyframes locais para o skeleton e o spinner */}
      <style>{`
        @keyframes ccm-shimmer-anim { 0% { background-position: -300px 0; } 100% { background-position: 300px 0; } }
        .ccm-shimmer {
          background: linear-gradient(90deg, ${c.borderSoft} 0%, ${c.border} 50%, ${c.borderSoft} 100%);
          background-size: 600px 100%;
          animation: ccm-shimmer-anim 1.2s linear infinite;
        }
        @keyframes ccm-spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .ccm-spin { display: inline-block; animation: ccm-spin-anim 0.9s linear infinite; }
      `}</style>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 10, gap: 8,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.fg2 }}>
          {renderSummary()}
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

      {noHits && (
        <div style={{
          padding: "24px 12px", textAlign: "center", color: c.fg3,
          fontSize: 13, lineHeight: 1.5,
        }}>
          Nenhum resultado para <strong style={{ color: c.fg2 }}>"{q}"</strong>.
          <div style={{ fontSize: 11, color: c.fg3, marginTop: 6 }}>
            Tente outra busca ou ajuste os filtros acima.
          </div>
        </div>
      )}

      {/* ── Banner do filtro de contato ── */}
      {contactFilterId && filteredContact && !showSkeletons && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", marginBottom: 12,
          background: c.primaryLightest,
          border: `1px solid ${c.primary}`,
          borderRadius: 10,
          fontSize: 12, color: c.primary, fontWeight: 600,
        }}>
          <i className="ph-fill ph-funnel-simple" style={{ fontSize: 14 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            Filtrando atendimentos de <strong>{filteredContact.name}</strong>
            {totalResults > 0 && (
              <span style={{ color: c.fg3, fontWeight: 500, marginLeft: 6 }}>
                ({totalResults} {totalResults === 1 ? "resultado" : "resultados"})
              </span>
            )}
          </span>
          <CCMTooltip label="Limpar filtro de contato">
            <button
              type="button"
              onClick={() => applyContactFilter(contactFilterId)}
              aria-label="Limpar filtro de contato"
              style={{
                width: 24, height: 24, borderRadius: 6, border: 0,
                background: "transparent", color: c.primary,
                cursor: "pointer", flexShrink: 0,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontFamily: "Montserrat, sans-serif",
              }}
            >
              <i className="ph ph-x" style={{ fontSize: 14 }} />
            </button>
          </CCMTooltip>
        </div>
      )}

      {/* ── Skeleton durante busca inicial ── */}
      {showSkeletons && (
        <React.Fragment>
          <SectionLabel icon="ph-address-book" label="Contatos" count="…" />
          {[0, 1].map(i => <SearchSkeletonRow key={`sk-c-${i}`} tone="contact" />)}
          <SectionLabel icon="ph-tag" label="Atendimentos" count="…" style={{ marginTop: 14 }} />
          {[0, 1, 2].map(i => <SearchSkeletonRow key={`sk-a-${i}`} tone="atendimento" />)}
        </React.Fragment>
      )}

      {/* ── Seção: Contatos ── */}
      {!showSkeletons && contactResults.length > 0 && (
        <React.Fragment>
          <SectionLabel
            icon="ph-address-book"
            label="Contatos"
            count={contactResults.length}
          />
          {contactResults.slice(0, 6).map(ct => (
            <ContactResultRow
              key={ct.id}
              contact={ct}
              query={q}
              onOpen={() => onOpenContact && onOpenContact(ct.id)}
              onFilterByContact={applyContactFilter}
              isFilterActive={contactFilterId === ct.id}
            />
          ))}
        </React.Fragment>
      )}

      {/* ── Seção: Atendimentos ── */}
      {!showSkeletons && totalResults > 0 && (
        <React.Fragment>
          <SectionLabel
            icon="ph-tag"
            label="Atendimentos"
            count={totalResults}
            hint={isRecentPhase ? "últimos 30 dias" : undefined}
            style={{ marginTop: contactResults.length > 0 ? 14 : 0 }}
          />
          {visibleAtendimentos.map(at => {
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
          {showLoadingMore && (
            <LoadingMoreInline
              label={`Buscando no histórico completo (${recentResults.length} de ${totalResults})…`}
            />
          )}
          {showPagination && (
            <SearchPagination
              page={page}
              totalPages={totalPages}
              total={totalResults}
              pageSize={SEARCH_PAGE_SIZE}
              onChange={setPage}
            />
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

const SectionLabel = ({ icon, label, count, hint, style = {} }) => {
  const c = window.CCM.c;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      fontSize: 10, fontWeight: 700, color: c.fg3,
      textTransform: "uppercase", letterSpacing: "0.06em",
      marginBottom: 8, ...style,
    }}>
      <i className={`ph ${icon}`} style={{ fontSize: 12 }} />
      <span>{label}</span>
      <span style={{
        background: c.borderSoft, color: c.fg2,
        padding: "1px 7px", borderRadius: 999,
        fontSize: 10, fontWeight: 700, letterSpacing: 0,
      }}>{count}</span>
      {hint && (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          background: c.primaryLightest, color: c.primary,
          padding: "1px 7px", borderRadius: 999,
          fontSize: 9, fontWeight: 700, letterSpacing: 0,
          textTransform: "none",
        }}>
          <i className="ph ph-calendar-blank" style={{ fontSize: 10 }} />
          {hint}
        </span>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// Loading + paginação da busca
// ─────────────────────────────────────────────────────────────────────────
// SEARCH_PAGE_SIZE — itens por página em "Atendimentos"
// RECENT_SUBSET_SIZE — quantos itens o backend devolve no 1º round
//   (últimos 30 dias). No demo é fixo em 3 pra ilustrar o caso
//   "carregou só 3, falta completar a página". No Angular, isso vem do
//   endpoint paginado com filtro de período padrão.
const SEARCH_PAGE_SIZE = 10;
const RECENT_SUBSET_SIZE = 3;
const SEARCH_SKELETON_MS = 350;   // skeleton inicial
const SEARCH_RECENT_MS   = 250;   // tempo "recent visível" antes do loading-more aparecer
const SEARCH_FULL_MS     = 1500;  // tempo total até full carregar

// Linha skeleton (shimmer) — usada durante a busca inicial enquanto
// o backend ainda não devolveu nada.
const SearchSkeletonRow = ({ tone = "atendimento" }) => {
  const c = window.CCM.c;
  const bg = tone === "atendimento" ? c.secundaryLightest : "#fff";
  const border = tone === "atendimento" ? "transparent" : c.border;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: bg, border: `1px solid ${border}`,
      borderRadius: 10, padding: "12px 14px", marginBottom: 8,
    }}>
      <div className="ccm-shimmer" style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ccm-shimmer" style={{
          height: 12, width: "55%", borderRadius: 4, marginBottom: 8,
        }} />
        <div className="ccm-shimmer" style={{
          height: 10, width: "75%", borderRadius: 4,
        }} />
      </div>
    </div>
  );
};

// Linha "carregando mais" — aparece entre o subset recente e a página completa.
const LoadingMoreInline = ({ label }) => {
  const c = window.CCM.c;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      padding: "12px 14px", marginBottom: 8,
      background: c.primaryLightest, borderRadius: 10,
      fontSize: 12, color: c.primary, fontWeight: 600,
    }}>
      <i className="ph ph-circle-notch ccm-spin" style={{ fontSize: 14 }} />
      {label}
    </div>
  );
};

// Paginação numérica compacta — janela de até 5 botões + ellipsis.
// Esconde-se automaticamente quando só há 1 página.
const SearchPagination = ({ page, totalPages, total, pageSize, onChange }) => {
  const c = window.CCM.c;
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const windowSize = 5;
  let first = Math.max(1, page - 2);
  let last = Math.min(totalPages, first + windowSize - 1);
  first = Math.max(1, last - windowSize + 1);
  const pages = [];
  for (let i = first; i <= last; i++) pages.push(i);

  const btnStyle = (active, disabled) => ({
    minWidth: 28, height: 28, padding: "0 8px",
    border: `1px solid ${active ? c.primary : c.border}`,
    background: active ? c.primary : "#fff",
    color: active ? "#fff" : (disabled ? c.fg3 : c.fg1),
    borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 12, fontWeight: 600,
    opacity: disabled ? 0.4 : 1,
    fontFamily: "Montserrat, sans-serif",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  });

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginTop: 10, paddingTop: 12, borderTop: `1px solid ${c.borderSoft}`,
      flexWrap: "wrap", gap: 8,
    }}>
      <div style={{ fontSize: 11, color: c.fg3 }}>
        Exibindo <strong style={{ color: c.fg2 }}>{start}–{end}</strong> de{" "}
        <strong style={{ color: c.fg2 }}>{total}</strong> · Página {page} de {totalPages}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          style={btnStyle(false, page === 1)}
          aria-label="Página anterior"
        ><i className="ph ph-caret-left" /></button>
        {first > 1 && (
          <React.Fragment>
            <button onClick={() => onChange(1)} style={btnStyle(false, false)}>1</button>
            {first > 2 && (
              <span style={{ alignSelf: "center", color: c.fg3, fontSize: 11, padding: "0 2px" }}>…</span>
            )}
          </React.Fragment>
        )}
        {pages.map(p => (
          <button key={p} onClick={() => onChange(p)} style={btnStyle(p === page, false)}>{p}</button>
        ))}
        {last < totalPages && (
          <React.Fragment>
            {last < totalPages - 1 && (
              <span style={{ alignSelf: "center", color: c.fg3, fontSize: 11, padding: "0 2px" }}>…</span>
            )}
            <button onClick={() => onChange(totalPages)} style={btnStyle(false, false)}>{totalPages}</button>
          </React.Fragment>
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          style={btnStyle(false, page === totalPages)}
          aria-label="Próxima página"
        ><i className="ph ph-caret-right" /></button>
      </div>
    </div>
  );
};

const ContactResultRow = ({ contact, query, onOpen, onFilterByContact, isFilterActive = false }) => {
  const c = window.CCM.c;
  const [hover, setHover] = React.useState(false);
  const [filterHover, setFilterHover] = React.useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={`Abrir histórico de ${contact.name}`}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        // Filtro ativo: fundo branco + borda primary (sem inundar de roxo).
        // O funil filled + o banner do filtro já comunicam o estado.
        background: hover ? c.primaryLightest : "#fff",
        border: `1px solid ${isFilterActive ? c.primary : (hover ? c.primary : c.border)}`,
        borderRadius: 10, padding: "12px 14px",
        marginBottom: 8, cursor: "pointer",
        transition: "background 120ms ease, border-color 120ms ease",
        outline: "none",
      }}
    >
      <span style={{
        width: 36, height: 36, borderRadius: "50%",
        background: contact.bg, color: contact.fg,
        fontSize: 12, fontWeight: 700, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{contact.initials}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 14, fontWeight: 700, color: c.fg1, marginBottom: 4,
        }}>
          <span>{highlightMatch(contact.name, query)}</span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            background: c.primaryLightest, color: c.primary,
            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
          }}>
            <i className="ph ph-address-book" style={{ fontSize: 11 }} />
            Contato
          </span>
        </div>
        <div style={{
          display: "flex", flexWrap: "wrap", alignItems: "center",
          gap: "4px 14px", fontSize: 11, color: c.fg2,
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <i className="ph ph-phone" style={{ fontSize: 12 }} />
            {highlightMatch(contact.phone, query)}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <i className="ph ph-identification-card" style={{ fontSize: 12 }} />
            CPF {highlightMatch(contact.cpf, query)}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <i className="ph ph-envelope" style={{ fontSize: 12 }} />
            {highlightMatch(contact.email, query)}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <i className="ph ph-hash" style={{ fontSize: 12 }} />
            ID {highlightMatch(String(contact.id), query)}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        {onFilterByContact && (
          <CCMTooltip label="Filtre pelos atendimentos deste contato">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFilterByContact(contact.id); }}
              onMouseEnter={(e) => { e.stopPropagation(); setFilterHover(true); }}
              onMouseLeave={() => setFilterHover(false)}
              aria-label="Filtre pelos atendimentos deste contato"
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: `1px solid ${isFilterActive ? c.primary : "transparent"}`,
                padding: 0, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                // Filtro ativo: pill com borda primary + ícone primary (sem fundo sólido)
                background: isFilterActive
                  ? c.primaryLightest
                  : (filterHover ? c.primaryLightest : "transparent"),
                color: isFilterActive || filterHover
                  ? c.primary
                  : (hover ? c.primary : c.fg3),
                transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
                fontFamily: "Montserrat, sans-serif",
              }}
            >
              <i
                className={`${isFilterActive ? "ph-fill" : "ph"} ph-funnel-simple`}
                style={{ fontSize: 18 }}
              />
            </button>
          </CCMTooltip>
        )}
        <CCMTooltip label="Ver histórico do contato">
          <span
            aria-label="Ver histórico do contato"
            style={{
              width: 32, height: 32, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: hover ? c.primary : c.fg3,
              background: hover ? "#fff" : "transparent",
              transition: "background 120ms ease, color 120ms ease",
            }}
          >
            <i className="ph ph-eye" style={{ fontSize: 18 }} />
          </span>
        </CCMTooltip>
      </div>
    </div>
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
      aria-label="Abrir atendimento"
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

      <CCMTooltip label="Visualizar atendimento">
      <span
        aria-label="Visualizar atendimento"
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
      </CCMTooltip>
    </div>
  );
};

Object.assign(window, { QueueSidebar });
