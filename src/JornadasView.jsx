// JornadasView.jsx — automated journey conversations section
const JornadasView = ({ chatTab = "jornadas", onTabChange }) => {
  const D = window.CCM_DATA;
  const [activeId, setActiveId] = React.useState(D.jornadas[0]?.id || null);
  const [query, setQuery] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [filters, setFilters] = React.useState({ canais: [], jornadas: [], pendencias: null });

  const active = D.jornadas.find(j => j.id === activeId);

  const applyFilters = (list) => {
    let result = list;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(j =>
        j.id.includes(query) ||
        j.contato.name.toLowerCase().includes(q) ||
        j.contato.email.toLowerCase().includes(q) ||
        (j.jornadaNome || "").toLowerCase().includes(q) ||
        (j.jornadaAtendente?.name || "").toLowerCase().includes(q)
      );
    }
    if (filters.canais.length > 0) {
      result = result.filter(j => filters.canais.includes(j.channel));
    }
    if (filters.jornadas.length > 0) {
      result = result.filter(j => {
        const nome = j.jornadaNome || j.jornadaAtendente?.name || "";
        return filters.jornadas.includes(nome);
      });
    }
    if (filters.pendencias === "com") {
      result = result.filter(j => j.unread > 0);
    } else if (filters.pendencias === "sem") {
      result = result.filter(j => !j.unread || j.unread === 0);
    }
    return result;
  };

  const filtered = applyFilters(D.jornadas);
  const hasActiveFilters = filters.canais.length > 0 || filters.jornadas.length > 0 || filters.pendencias !== null;
  const filterCount = filters.canais.length + filters.jornadas.length + (filters.pendencias !== null ? 1 : 0);

  return (
    <React.Fragment>
      <JornadasSidebar
        jornadas={filtered}
        activeId={activeId}
        onSelect={setActiveId}
        query={query}
        setQuery={setQuery}
        searchFocused={searchFocused}
        setSearchFocused={setSearchFocused}
        filters={filters}
        setFilters={setFilters}
        hasActiveFilters={hasActiveFilters}
        filterCount={filterCount}
        chatTab={chatTab}
        onTabChange={onTabChange}
      />
      {active
        ? <JornadasPanel jornada={active} />
        : <JornadasEmpty />
      }
    </React.Fragment>
  );
};

// ─────────────────────────────────────────────
// Sidebar — list of jornada conversations
// ─────────────────────────────────────────────
const JornadasSidebar = ({ jornadas, activeId, onSelect, query, setQuery, searchFocused, setSearchFocused, filters, setFilters, hasActiveFilters, filterCount, chatTab = "jornadas", onTabChange }) => {
  const c = window.CCM.c;
  const searchRef = React.useRef(null);
  const [filterOpen, setFilterOpen] = React.useState(false);

  React.useEffect(() => {
    const onClick = e => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <aside style={{
      width: 340, background: "#fff",
      borderRight: `1px solid ${c.border}`,
      display: "flex", flexDirection: "column", flexShrink: 0,
      position: "relative", overflow: "hidden",
    }}>
      {/* Header — title only */}
      <div style={{ padding: "0 16px", flexShrink: 0 }}>
        <div style={{ paddingTop: 12, paddingBottom: 10, fontSize: 13, fontWeight: 700, color: c.fg1 }}>
          Jornadas
        </div>
        <div style={{ height: 1, background: c.border, marginLeft: -16, marginRight: -16 }} />
      </div>

      {/* Filter panel overlay */}
      {filterOpen && (
        <JornadasFilterPanel
          filters={filters}
          setFilters={setFilters}
          onClose={() => setFilterOpen(false)}
        />
      )}

      {/* Search + filter row */}
      <div ref={searchRef} style={{ padding: "12px 16px 4px", flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
        {/* Search input */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 8,
          border: `1px solid ${searchFocused ? c.secundaryPure : c.border}`,
          borderRadius: 999, padding: "7px 14px", background: "#fff",
          transition: "border-color 200ms ease",
        }}>
          <i className="ph ph-magnifying-glass" style={{ fontSize: 14, color: c.fg3 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Pesquisar..."
            style={{
              flex: 1, border: 0, outline: "none", fontFamily: "Montserrat, sans-serif",
              fontSize: 13, color: c.fg1, background: "transparent",
            }}
          />
          {query && (
            <i className="ph ph-x" onClick={() => setQuery("")}
              style={{ fontSize: 13, color: c.fg3, cursor: "pointer" }} />
          )}
        </div>

        {/* Filter button — pill when active, icon when inactive */}
        {hasActiveFilters ? (
          <div
            onClick={() => setFilterOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 0,
              flexShrink: 0, cursor: "pointer",
              background: c.primaryLightest, color: c.primary,
              border: `1px solid ${c.primary}`,
              borderRadius: 999, overflow: "hidden",
              fontSize: 12, fontWeight: 600,
              fontFamily: "Montserrat, sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", whiteSpace: "nowrap" }}>
              <i className="ph ph-funnel-simple" style={{ fontSize: 13 }} />
              {filterCount} {filterCount === 1 ? "filtro" : "filtros"}
            </div>
            <div
              onClick={e => { e.stopPropagation(); setFilters({ canais: [], jornadas: [], pendencias: null }); }}
              title="Limpar filtros"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "6px 9px",
                borderLeft: `1px solid ${c.primary}`,
              }}
            >
              <i className="ph ph-broom" style={{ fontSize: 13 }} />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setFilterOpen(true)}
            style={{
              width: 34, height: 34, borderRadius: 999, border: `1px solid ${c.border}`,
              background: "#fff", color: c.fg2,
              cursor: "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <i className="ph ph-funnel-simple" style={{ fontSize: 16 }} />
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {jornadas.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: c.fg3, fontSize: 13 }}>
            Nenhuma jornada encontrada
          </div>
        ) : (
          jornadas.map(j => (
            <JornadaItem key={j.id} jornada={j} active={j.id === activeId} onSelect={() => onSelect(j.id)} />
          ))
        )}
      </div>
    </aside>
  );
};

// ─────────────────────────────────────────────
// Filter Modal — fixed overlay, two-column
// ─────────────────────────────────────────────
const FILTER_CATEGORIES = [
  { id: "data",              label: "Data" },
  { id: "telefone",          label: "Telefone" },
  { id: "email",             label: "E-mail" },
  { id: "jornada",           label: "Jornada" },
  { id: "identificadorAci",  label: "Identificador do acionamento" },
  { id: "identificadorConv", label: "Identificador da conversa" },
  { id: "status",            label: "Status da conversa" },
  { id: "identificadorAte",  label: "Identificador do atendimento" },
];

const JornadasFilterPanel = ({ filters, setFilters, onClose }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const [selected, setSelected] = React.useState("data");
  const [draft, setDraft] = React.useState({ canais: [], jornadas: [], pendencias: null, dataPadrao: null, dataInicio: "", dataFim: "", telefone: "", email: "", idAci: "", idConv: "", idAte: "", ...filters });

  const jornadaNames = [...new Set(D.jornadas.map(j => j.jornadaNome || j.jornadaAtendente?.name || "").filter(Boolean))];
  const toggleArr = (arr, val) => arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  const hasDraftFor = (catId) => {
    if (catId === "data") return !!(draft.dataPadrao || draft.dataInicio || draft.dataFim);
    if (catId === "jornada") return draft.jornadas?.length > 0;
    if (catId === "status") return draft.pendencias != null;
    if (catId === "telefone") return !!draft.telefone;
    if (catId === "email") return !!draft.email;
    if (catId === "identificadorAci") return !!draft.idAci;
    if (catId === "identificadorConv") return !!draft.idConv;
    if (catId === "identificadorAte") return !!draft.idAte;
    return false;
  };

  const hasAny = FILTER_CATEGORIES.some(cat => hasDraftFor(cat.id));

  const handleApply = () => { setFilters(draft); onClose(); };
  const handleClear = () => {
    const empty = { canais: [], jornadas: [], pendencias: null, dataPadrao: null, dataInicio: "", dataFim: "", telefone: "", email: "", idAci: "", idConv: "", idAte: "" };
    setDraft(empty); setFilters(empty); onClose();
  };

  const renderRight = () => {
    switch (selected) {
      case "data": return (
        <FilterData
          padrao={draft.dataPadrao}
          inicio={draft.dataInicio}
          fim={draft.dataFim}
          onPadrao={v => setDraft(d => ({ ...d, dataPadrao: v, dataInicio: "", dataFim: "" }))}
          onInicio={v => setDraft(d => ({ ...d, dataInicio: v, dataPadrao: "custom" }))}
          onFim={v => setDraft(d => ({ ...d, dataFim: v, dataPadrao: "custom" }))}
        />
      );
      case "jornada": return (
        <FilterCheckboxList label="Jornada" items={jornadaNames}
          checked={draft.jornadas || []}
          onChange={val => setDraft(d => ({ ...d, jornadas: toggleArr(d.jornadas || [], val) }))} />
      );
      case "status": return (
        <FilterRadioList label="Status da conversa"
          items={[{ value: "aberto", label: "Aberto" }, { value: "encerrado", label: "Encerrado" }, { value: "pendente", label: "Pendente" }]}
          value={draft.pendencias}
          onChange={val => setDraft(d => ({ ...d, pendencias: val }))} />
      );
      case "telefone": return <FilterTextInput label="Telefone" value={draft.telefone} onChange={v => setDraft(d => ({ ...d, telefone: v }))} />;
      case "email": return <FilterTextInput label="E-mail" value={draft.email} onChange={v => setDraft(d => ({ ...d, email: v }))} />;
      case "identificadorAci": return <FilterTextInput label="Identificador do acionamento" value={draft.idAci} onChange={v => setDraft(d => ({ ...d, idAci: v }))} />;
      case "identificadorConv": return <FilterTextInput label="Identificador da conversa" value={draft.idConv} onChange={v => setDraft(d => ({ ...d, idConv: v }))} />;
      case "identificadorAte": return <FilterTextInput label="Identificador do atendimento" value={draft.idAte} onChange={v => setDraft(d => ({ ...d, idAte: v }))} />;
      default: return null;
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(40,41,61,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: 820, maxHeight: "88vh", borderRadius: 16,
        background: c.canvas, display: "flex", flexDirection: "column",
        boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
        overflow: "hidden",
      }}>
        {/* Header card */}
        <div style={{
          background: "#fff", margin: "16px 16px 0",
          borderRadius: 12, padding: "18px 22px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: c.primaryLightest,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <i className="ph ph-funnel" style={{ fontSize: 20, color: c.primary }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: c.fg1 }}>Filtros do chat</div>
              <div style={{ fontSize: 12, color: c.fg3, marginTop: 2 }}>Use filtros para aplicar na listagem de conversas</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={handleApply} style={{
              height: 36, padding: "0 20px", borderRadius: 8,
              border: `1px solid ${hasAny ? c.primary : c.border}`,
              background: hasAny ? c.primary : "#fff",
              color: hasAny ? "#fff" : c.fg3,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "Montserrat, sans-serif",
              transition: "all 150ms ease",
            }}>
              Aplicar filtros
            </button>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8, border: 0,
              background: "transparent", color: c.fg2, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <i className="ph ph-x" style={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        {/* Two-column body */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
          padding: 16, flex: 1, overflow: "hidden", minHeight: 0,
        }}>
          {/* Left card — categories */}
          <div style={{
            background: "#fff", borderRadius: 12,
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            <div style={{ padding: "16px 20px 8px", fontSize: 16, fontWeight: 700, color: c.fg1, flexShrink: 0 }}>
              Filtros
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {FILTER_CATEGORIES.map(cat => {
                const isActive = selected === cat.id;
                const hasDot = hasDraftFor(cat.id);
                return (
                  <div key={cat.id} onClick={() => setSelected(cat.id)} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "13px 20px", cursor: "pointer",
                    background: isActive ? c.primaryLightest : "transparent",
                    borderRadius: isActive ? 10 : 0,
                    margin: isActive ? "2px 8px" : "0",
                    transition: "background 120ms ease",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 14, fontWeight: 700,
                        color: isActive ? c.primary : c.fg1,
                      }}>{cat.label}</span>
                      {hasDot && (
                        <span style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: c.primary, flexShrink: 0,
                        }} />
                      )}
                    </div>
                    <i className="ph ph-caret-right" style={{
                      fontSize: 14, color: isActive ? c.primary : c.fg3,
                    }} />
                  </div>
                );
              })}
            </div>
            {hasAny && (
              <div style={{ padding: "10px 20px", borderTop: `1px solid ${c.borderSoft}`, flexShrink: 0 }}>
                <button onClick={handleClear} style={{
                  border: 0, background: "transparent", color: c.primary,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "Montserrat, sans-serif", padding: 0,
                }}>Limpar filtros</button>
              </div>
            )}
          </div>

          {/* Right card — options */}
          <div style={{
            background: "#fff", borderRadius: 12,
            overflowY: "auto", padding: "16px 20px",
          }}>
            {renderRight()}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Filter right-panel sub-components ────────

const FilterData = ({ padrao, inicio, fim, onPadrao, onInicio, onFim }) => {
  const c = window.CCM.c;
  const presets = [
    { value: "hoje", label: "Hoje" },
    { value: "7d", label: "Últimos 7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "60d", label: "60 dias" },
    { value: "90d", label: "90 dias" },
    { value: "custom", label: "Período personalizado" },
  ];

  const today = new Date();
  const [calYear, setCalYear] = React.useState(today.getFullYear());
  const [calMonth, setCalMonth] = React.useState(today.getMonth());
  const [selectedDay, setSelectedDay] = React.useState(today.getDate());

  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const dayNames = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"];

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: daysInPrev - firstDay + 1 + i, cur: false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, cur: true });
  const remaining = 7 - (cells.length % 7 === 0 ? 7 : cells.length % 7);
  for (let i = 1; i <= remaining; i++) cells.push({ day: i, cur: false });

  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.fg1, marginBottom: 16 }}>Data</div>
      <div style={{ fontSize: 12, color: c.fg2, fontWeight: 600, marginBottom: 10 }}>Padrões</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {presets.map(p => {
          const on = padrao === p.value;
          return (
            <button key={p.value} onClick={() => onPadrao(p.value)} style={{
              display: "flex", alignItems: "center", gap: 7,
              border: `1.5px solid ${on ? c.primary : c.border}`,
              borderRadius: 999, padding: "6px 14px",
              background: on ? c.primaryLightest : "#fff",
              color: on ? c.primary : c.fg1,
              fontSize: 13, fontWeight: on ? 700 : 500,
              cursor: "pointer", fontFamily: "Montserrat, sans-serif",
            }}>
              <span style={{
                width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                border: `1.5px solid ${on ? c.primary : c.fg3}`,
                background: "#fff",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                {on && <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.primary }} />}
              </span>
              {p.label}
            </button>
          );
        })}
      </div>
      <div style={{ height: 1, background: c.borderSoft, marginBottom: 16 }} />
      <div style={{ fontSize: 14, fontWeight: 700, color: c.fg1, marginBottom: 14 }}>Período personalizado</div>
      {/* Mini calendar */}
      <div style={{ userSelect: "none" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: c.fg1 }}>{monthNames[calMonth]} de {calYear}</span>
          <div style={{ display: "flex", gap: 4 }}>
            {["ph-caret-left","ph-caret-right"].map((icon, i) => (
              <button key={i} onClick={i === 0 ? prevMonth : nextMonth} style={{
                width: 26, height: 26, borderRadius: 6, border: `1px solid ${c.border}`,
                background: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <i className={`ph ${icon}`} style={{ fontSize: 12, color: c.fg2 }} />
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
          {dayNames.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: c.fg3, padding: "4px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {cells.map((cell, i) => {
            const isToday = cell.cur && cell.day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
            const isSel = cell.cur && cell.day === selectedDay;
            return (
              <div key={i} onClick={() => cell.cur && setSelectedDay(cell.day)} style={{
                textAlign: "center", padding: "6px 0", borderRadius: 8,
                fontSize: 13,
                color: !cell.cur ? c.fg3 : isSel ? "#fff" : c.fg1,
                background: isSel ? c.primary : isToday ? c.primaryLightest : "transparent",
                fontWeight: isSel || isToday ? 700 : 400,
                cursor: cell.cur ? "pointer" : "default",
              }}>
                {cell.day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const FilterCheckboxList = ({ label, items, checked, onChange, itemLabel }) => {
  const c = window.CCM.c;
  const [search, setSearch] = React.useState("");
  const visible = items.filter(it => (itemLabel ? itemLabel(it) : it).toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.fg1, marginBottom: 16 }}>{label}</div>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        border: `1px solid ${c.border}`, borderRadius: 8,
        padding: "8px 12px", marginBottom: 12,
      }}>
        <i className="ph ph-magnifying-glass" style={{ fontSize: 14, color: c.fg3 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquise"
          style={{ border: 0, outline: "none", fontFamily: "Montserrat, sans-serif", fontSize: 13, flex: 1, color: c.fg1 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {visible.map(it => {
          const display = itemLabel ? itemLabel(it) : it;
          const on = checked.includes(it);
          return (
            <label key={it} onClick={() => onChange(it)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 10px", borderRadius: 8, cursor: "pointer",
              background: on ? c.primaryLightest : "transparent",
              fontSize: 13, color: c.fg1, fontFamily: "Montserrat, sans-serif",
            }}>
              <span style={{
                width: 16, height: 16, borderRadius: 5, flexShrink: 0,
                border: `1.5px solid ${on ? c.primary : c.fg3}`,
                background: on ? c.primary : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {on && <i className="ph ph-check" style={{ fontSize: 11, color: "#fff" }} />}
              </span>
              {display}
            </label>
          );
        })}
        {visible.length === 0 && (
          <div style={{ fontSize: 12, color: c.fg3, padding: "10px 0" }}>Nenhum resultado</div>
        )}
      </div>
    </div>
  );
};

const FilterRadioList = ({ label, items, value, onChange }) => {
  const c = window.CCM.c;
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.fg1, marginBottom: 16 }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map(it => {
          const on = value === it.value;
          return (
            <label key={String(it.value)} onClick={() => onChange(it.value)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 10px", borderRadius: 8, cursor: "pointer",
              background: on ? c.primaryLightest : "transparent",
              fontSize: 13, color: c.fg1, fontFamily: "Montserrat, sans-serif",
            }}>
              <span style={{
                width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                border: `1.5px solid ${on ? c.primary : c.fg3}`,
                background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {on && <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.primary }} />}
              </span>
              {it.label}
            </label>
          );
        })}
      </div>
    </div>
  );
};

const FilterTextInput = ({ label, value, onChange }) => {
  const c = window.CCM.c;
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c.fg1, marginBottom: 16 }}>{label}</div>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        border: `1px solid ${c.border}`, borderRadius: 8,
        padding: "8px 12px",
      }}>
        <i className="ph ph-magnifying-glass" style={{ fontSize: 14, color: c.fg3 }} />
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="Pesquise"
          style={{ border: 0, outline: "none", fontFamily: "Montserrat, sans-serif", fontSize: 13, flex: 1, color: c.fg1 }} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Single conversation item in the sidebar list
// ─────────────────────────────────────────────
const JornadaItem = ({ jornada, active, onSelect }) => {
  const c = window.CCM.c;
  const [hover, setHover] = React.useState(false);

  const bg = active ? c.primaryLightest : hover ? "#fafbfd" : "transparent";
  const idColor = active ? c.primary : c.fg1;
  const jornadaLabel = jornada.jornadaAtendente
    ? jornada.jornadaAtendente.name
    : jornada.jornadaNome;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "12px 16px",
        background: bg,
        borderLeft: `3px solid ${active ? c.primary : "transparent"}`,
        borderBottom: `1px solid ${c.borderSoft}`,
        cursor: "pointer",
        transition: "background 120ms ease",
      }}
    >
      {/* Row 1: ID + channel icon + time */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <i className="ph ph-hash" style={{ fontSize: 12, color: active ? c.primary : c.fg2 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: idColor }}>{jornada.id}</span>
          <i
            className={`ph ${jornada.channel === "email" ? "ph-envelope" : "ph-whatsapp-logo"}`}
            style={{ fontSize: 13, color: c.fg3, marginLeft: 2 }}
          />
        </div>
        <span style={{ fontSize: 11, color: c.fg3 }}>{jornada.time}</span>
      </div>

      {/* Row 2: Jornada label */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: c.fg2, flexShrink: 0 }}>Jornada:</span>
        {jornada.jornadaAtendente && (
          <span style={{
            width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
            background: jornada.jornadaAtendente.bg, color: jornada.jornadaAtendente.fg,
            fontSize: 8, fontWeight: 700,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            {jornada.jornadaAtendente.initials}
          </span>
        )}
        <span style={{
          fontSize: 12, color: c.fg1,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180,
        }}>
          {jornadaLabel}
        </span>
      </div>

      {/* Row 3: Contato */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: c.fg2, flexShrink: 0 }}>Contato:</span>
        <span style={{
          width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
          background: jornada.contato.bg, color: jornada.contato.fg,
          fontSize: 8, fontWeight: 700,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          {jornada.contato.initials}
        </span>
        <span style={{
          fontSize: 12, color: c.fg1,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 170,
        }}>
          {jornada.contato.email}
        </span>
      </div>

      {/* Row 4: Preview + unread badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{
          fontSize: 12,
          color: jornada.unread ? c.fg1 : c.fg2,
          fontWeight: jornada.unread ? 600 : 400,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          flex: 1,
        }}>
          {jornada.preview}
        </span>
        {jornada.unread > 0 && (
          <span style={{
            background: "#25d366", color: "#fff",
            fontSize: 10, fontWeight: 700, padding: "2px 7px",
            borderRadius: 999, flexShrink: 0, minWidth: 20, textAlign: "center",
          }}>
            {jornada.unread}
          </span>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Right panel — conversation thread + jornada footer
// ─────────────────────────────────────────────
const JornadasPanel = ({ jornada }) => {
  const c = window.CCM.c;
  const [showTransferModal, setShowTransferModal] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [jornada.id]);

  const jornadaLabel = jornada.jornadaAtendente
    ? jornada.jornadaAtendente.name
    : jornada.jornadaNome;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      {/* Sub-header */}
      <div style={{
        height: 48, padding: "0 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${c.border}`, background: "#fff", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ph ph-hash" style={{ fontSize: 14, color: c.fg2 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: c.fg1 }}>{jornada.id}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <JToolbarBtn icon="ph-chats-circle" title="Ver conversas" />
          <JToolbarBtn icon="ph-tag" title="Marcadores" />
          <JToolbarBtn icon="ph-arrows-out" title="Expandir" />
        </div>
      </div>

      {/* Thread */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto",
        padding: "20px 32px",
        backgroundImage: "url('design-system/assets/backgrounds/bg-chat.svg')",
        backgroundColor: "#FAF6EE",
        backgroundRepeat: "repeat",
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        <JDayChip text="Hoje" />
        {jornada.messages.filter(m => m.type !== "system").map(m => (
          <JMsgBubble key={m.id} msg={m} contact={jornada.contato} />
        ))}
      </div>

      {/* Jornada footer */}
      <div style={{
        background: "#fff", borderTop: `1px solid ${c.border}`,
        padding: "14px 20px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 12, color: c.fg2, textAlign: "center", lineHeight: 1.5 }}>
          Esta conversa está sendo conduzida automaticamente pela jornada{" "}
          <span style={{ color: c.primary, fontWeight: 600, cursor: "pointer" }}>
            [{jornadaLabel}]
          </span>
        </div>
        <button
          onClick={() => setShowTransferModal(true)}
          style={{
            height: 40, padding: "0 28px", borderRadius: 999, border: 0,
            background: c.primary, color: "#fff", fontWeight: 600, fontSize: 13,
            cursor: "pointer", fontFamily: "Montserrat, sans-serif",
            boxShadow: "0 2px 6px rgba(146,64,255,0.30)",
          }}
        >
          Transferir essa conversa
        </button>
      </div>

      {showTransferModal && <TransferModal onClose={() => setShowTransferModal(false)} />}
    </div>
  );
};

// ─────────────────────────────────────────────
// Empty state — no jornada selected
// ─────────────────────────────────────────────
const JornadasEmpty = () => {
  const c = window.CCM.c;
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#FAF6EE",
      backgroundImage: "url('design-system/assets/backgrounds/bg-chat.svg')",
      backgroundRepeat: "repeat",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: c.primaryLightest, color: c.primary,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
      }}>
        <i className="ph ph-lightning" style={{ fontSize: 28 }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: c.fg2 }}>
        Selecione uma jornada para visualizar a conversa
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Local shared UI helpers (scoped to Jornadas)
// ─────────────────────────────────────────────
const JDayChip = ({ text }) => (
  <div style={{ display: "flex", justifyContent: "center" }}>
    <div style={{
      background: "#fff", borderRadius: 999, padding: "4px 14px",
      fontSize: 11, color: "#555770",
      boxShadow: "0 1px 3px rgba(40,41,61,0.10)",
    }}>{text}</div>
  </div>
);

const JMsgBubble = ({ msg, contact }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;

  if (msg.type === "system") return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{
        background: "#fff", borderRadius: 999, padding: "6px 16px",
        fontSize: 12, color: c.fg1,
        boxShadow: "0 1px 3px rgba(40,41,61,0.10)",
      }}>{msg.text}</div>
    </div>
  );

  const isAgent = msg.role === "agent";
  const person = D?.contacts
    ? Object.values(D.contacts).find(ct => ct.initials === msg.author)
    : null;
  const roleLabel = isAgent ? "mensagem automatica" : "[Contato]";
  const authorText = isAgent ? "mensagem automatica" : (person ? `[Contato] ${person.name}` : "[Contato]");
  const initials = person?.initials || msg.author || "?";
  const initialBg = person?.bg || (isAgent ? "#D7CCFF" : "#BFE6FA");
  const initialFg = person?.fg || (isAgent ? "#410293" : "#114865");
  const bg = isAgent ? "#E8F7FF" : "#fff";
  const titleColor = isAgent ? c.secundaryMedium : c.fg1;

  return (
    <div style={{
      display: "flex",
      alignSelf: isAgent ? "flex-end" : "flex-start",
      maxWidth: "70%",
    }}>
      {!isAgent && (
        <span style={{
          width: 24, height: 24, borderRadius: "50%",
          background: initialBg, color: initialFg, fontWeight: 700, fontSize: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          alignSelf: "flex-end", marginRight: 8, flexShrink: 0,
        }}>{initials}</span>
      )}
      <div style={{
        background: bg, borderRadius: 12,
        padding: "12px 16px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        minWidth: 240,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 12, fontWeight: 700, color: titleColor, marginBottom: 6,
        }}>
          <span>{authorText}</span>
          <i className="ph ph-caret-down" style={{ fontSize: 12, color: c.fg2 }} />
        </div>
        <div style={{ fontSize: 14, color: c.fg1, lineHeight: 1.45, whiteSpace: "pre-line" }}>{msg.text}</div>
        {msg.reactions && (
          <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
            {msg.reactions.map((r, i) => (
              <span key={i} style={{
                background: "#fff", border: `1px solid ${c.border}`,
                borderRadius: 999, padding: "2px 8px", fontSize: 12,
              }}>{r}</span>
            ))}
          </div>
        )}
        <div style={{
          marginTop: 10, fontSize: 11, color: c.fg2,
          display: "flex", alignItems: "center",
          justifyContent: isAgent ? "flex-end" : "flex-start", gap: 10,
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <i className="ph ph-clock" style={{ fontSize: 12 }} /> {msg.at}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <i className={`ph ${msg.channel === "email" ? "ph-envelope" : "ph-whatsapp-logo"}`} style={{ fontSize: 12 }} />
            {msg.channel === "email" ? "E-mail" : "WhatsApp"}
          </span>
        </div>
      </div>
      {isAgent && (
        <span style={{
          width: 24, height: 24, borderRadius: "50%",
          background: initialBg, color: initialFg, fontWeight: 700, fontSize: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          alignSelf: "flex-end", marginLeft: 8, flexShrink: 0,
        }}>{initials}</span>
      )}
    </div>
  );
};

const JToolbarBtn = ({ icon, onClick, title }) => {
  const c = window.CCM.c;
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: 32, height: 32, borderRadius: 8, border: 0,
        background: hover ? c.borderSoft : "transparent",
        color: c.fg2, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
      <i className={`ph ${icon}`} style={{ fontSize: 16 }} />
    </button>
  );
};

Object.assign(window, { JornadasView });
