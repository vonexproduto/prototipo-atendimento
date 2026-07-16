// JornadasView.jsx — automated journey conversations section
// =====================================================================
// DE-PARA REACT → ANGULAR  ·  JornadasView.jsx
// ---------------------------------------------------------------------
// Inbox de conversas conduzidas automaticamente por uma "Jornada" (automação):
// sidebar de conversas + thread + rodapé "Transferir essa conversa".
//
//   JornadasView/Panel  → ChatAutomationAnswersComponent <app-chat-automation-answers>
//                         @modules/chat-one-to-one/components/chat-automation-answers/
//                         (irmão: ChatCampaignAnswersComponent <app-chat-campaign-answers>
//                          para a aba "Campanha")
//   JornadaItem (lista) → item de conversa na lista (reusa padrão de chat-talks-list)
//   JMsgBubble/JDayChip → ChatMessageComponent <app-chat-message> + chip de data
//                         (mesmos átomos da thread principal — ver ConversaPanel.jsx)
//   JornadasFilterPanel → modal de filtros (MatDialog two-column) +
//                         FilterCheckboxList/RadioList → mat-checkbox/mat-radio
//                         (tema material-checkbox.scss / material-radio.scss)
//   FilterData (calendar)→ datepicker (tema @theme/css/material-calendar.scss)
//   TransferModal       → UserAssignmentModalComponent <app-user-assignment-modal>
//   O CONSTRUTOR de jornadas (não esta tela) vive em @modules/automation
//   (AutomationComponent <app-automation>).
// Doc: de-para/02-componentes.md
// =====================================================================
// Estado vazio de TODAS as categorias do modal de filtros — mantém
// `filters` e `EMPTY_FILTERS` em sincronia com as categorias do
// JornadasFilterPanel pra que reset/aplicar nunca deixem chaves órfãs.
//
// Telefone / e-mail / identificadores agora são MULTI-VALOR (arrays) pra
// permitir aplicar mais de um valor por categoria via chip-input.
const EMPTY_JORNADA_FILTERS = {
  canais: [], jornadas: [], pendencias: [],
  dataPadrao: null, dataInicio: "", dataFim: "",
  telefone: [], email: [],
  idAci: [], idConv: [], idAte: [],
};

// Conta quantas CATEGORIAS do modal estão com algum valor aplicado.
// Cada categoria vale 1, independente de quantos sub-itens tenha
// (ex.: 3 jornadas selecionadas = 1 filtro de "Jornada").
// Mesma lógica do hasDraftFor() do JornadasFilterPanel.
const countJornadaFilterCategories = (f) => {
  let n = 0;
  if (f.dataPadrao || f.dataInicio || f.dataFim) n++;
  if (f.telefone?.length > 0) n++;
  if (f.email?.length > 0) n++;
  if (f.jornadas?.length > 0) n++;
  if (f.idAci?.length > 0) n++;
  if (f.idConv?.length > 0) n++;
  if (f.pendencias?.length > 0) n++;
  if (f.idAte?.length > 0) n++;
  if (f.canais?.length > 0) n++;
  return n;
};

const JornadasView = ({ chatTab = "jornadas", onTabChange }) => {
  const D = window.CCM_DATA;
  const [activeId, setActiveId] = React.useState(D.jornadas[0]?.id || null);
  // Removido o input de pesquisa da sidebar — a busca por telefone, e-mail
  // e identificadores agora vive apenas dentro do modal de filtros.
  const [filters, setFilters] = React.useState(EMPTY_JORNADA_FILTERS);

  const active = D.jornadas.find(j => j.id === activeId);

  const applyFilters = (list) => {
    let result = list;
    if (filters.canais.length > 0) {
      result = result.filter(j => filters.canais.includes(j.channel));
    }
    if (filters.jornadas.length > 0) {
      result = result.filter(j => {
        const nome = j.jornadaNome || j.jornadaAtendente?.name || "";
        return filters.jornadas.includes(nome);
      });
    }
    // Status agora é multi-select (array de strings).
    // Mock: "Pendente" interpreta como unread > 0; outros não restringem.
    if (Array.isArray(filters.pendencias) && filters.pendencias.length > 0) {
      if (filters.pendencias.includes("Pendente")) {
        result = result.filter(j => j.unread > 0);
      }
    }
    return result;
  };

  const filtered = applyFilters(D.jornadas);
  const filterCount = countJornadaFilterCategories(filters);
  const hasActiveFilters = filterCount > 0;
  // Sidebar colapsada via botão "Expandir" do JornadasPanel.
  // Quando colapsada, a lista some e o thread ocupa a largura total.
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <React.Fragment>
      {!sidebarCollapsed && (
        <JornadasSidebar
          jornadas={filtered}
          activeId={activeId}
          onSelect={setActiveId}
          filters={filters}
          setFilters={setFilters}
          hasActiveFilters={hasActiveFilters}
          filterCount={filterCount}
          chatTab={chatTab}
          onTabChange={onTabChange}
        />
      )}
      {active
        ? <JornadasPanel
            jornada={active}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(v => !v)}
          />
        : <JornadasEmpty />
      }
    </React.Fragment>
  );
};

// ─────────────────────────────────────────────
// Sidebar — list of jornada conversations
// ─────────────────────────────────────────────
const JornadasSidebar = ({ jornadas, activeId, onSelect, filters, setFilters, hasActiveFilters, filterCount, chatTab = "jornadas", onTabChange }) => {
  const c = window.CCM.c;
  const [filterOpen, setFilterOpen] = React.useState(false);

  return (
    <aside style={{
      width: 340, background: "#fff",
      borderRight: `1px solid ${c.border}`,
      display: "flex", flexDirection: "column", flexShrink: 0,
      position: "relative", overflow: "hidden",
    }}>
      {/* Header — título + botão de filtro na MESMA barra.
          Altura fixa de 48px pra bater com o sub-header do JornadasPanel
          (mesma régua visual nos dois lados). */}
      <div style={{ padding: "0 16px", flexShrink: 0 }}>
        <div style={{
          height: 48,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: c.fg1 }}>
            Jornadas
          </div>
          {/* Botão de filtro: pílula quando há filtros ativos, ícone funil
              quando não. Clicar na contagem reabre o modal preservando o
              estado dos filtros aplicados (indicadores nas categorias). */}
          {hasActiveFilters ? (
            <div
              onClick={() => setFilterOpen(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 0,
                flexShrink: 0, cursor: "pointer",
                background: c.primaryLightest, color: c.primary,
                // Sem border + sem separador interno — visual "soft pill"
                // limpa, conforme padrão pedido.
                border: 0,
                borderRadius: 10,
                fontSize: 12, fontWeight: 600,
                fontFamily: "Montserrat, sans-serif",
                height: 30,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 12px", whiteSpace: "nowrap", height: "100%" }}>
                <i className="ph ph-funnel" style={{ fontSize: 13 }} />
                {filterCount} {filterCount === 1 ? "filtro aplicado" : "filtros aplicados"}
              </div>
              <CCMTooltip label="Retirar filtros">
                <div
                  onClick={e => { e.stopPropagation(); setFilters(EMPTY_JORNADA_FILTERS); }}
                  aria-label="Retirar filtros"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 10px 0 4px", height: "100%",
                  }}
                >
                  <i className="ph ph-broom" style={{ fontSize: 13 }} />
                </div>
              </CCMTooltip>
            </div>
          ) : (
            <CCMTooltip label="Filtrar jornadas">
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                aria-label="Filtrar jornadas"
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 0,
                  background: "transparent", color: c.fg2,
                  cursor: "pointer", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 120ms ease, color 120ms ease",
                  fontFamily: "Montserrat, sans-serif",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = c.primaryLightest; e.currentTarget.style.color = c.primary; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.fg2; }}
              >
                <i className="ph ph-funnel" style={{ fontSize: 16 }} />
              </button>
            </CCMTooltip>
          )}
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

      {/* List — mesmo padrão visual da aba "Conversas" do detalhe do atendimento.
          O fundo `c.canvas` (#f2f6fa) é a mesma cor usada lá; cards ficam brancos
          por cima desse fundo, ganhando contraste igual ao padrão do design system. */}
      <div style={{ flex: 1, overflowY: "auto", background: c.canvas }}>
        {jornadas.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: c.fg3, fontSize: 13 }}>
            Nenhuma jornada encontrada
          </div>
        ) : (
          <div style={{ padding: "12px 12px 24px" }}>
            {jornadas.map(j => (
              <JornadaItem key={j.id} jornada={j} active={j.id === activeId} onSelect={() => onSelect(j.id)} />
            ))}
          </div>
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
  const [draft, setDraft] = React.useState({ ...EMPTY_JORNADA_FILTERS, ...filters });

  const jornadaNames = [...new Set(D.jornadas.map(j => j.jornadaNome || j.jornadaAtendente?.name || "").filter(Boolean))];
  const toggleArr = (arr, val) => arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  const hasDraftFor = (catId) => {
    if (catId === "data") return !!(draft.dataPadrao || draft.dataInicio || draft.dataFim);
    if (catId === "jornada") return draft.jornadas?.length > 0;
    if (catId === "status") return draft.pendencias?.length > 0;
    if (catId === "telefone") return draft.telefone?.length > 0;
    if (catId === "email") return draft.email?.length > 0;
    if (catId === "identificadorAci") return draft.idAci?.length > 0;
    if (catId === "identificadorConv") return draft.idConv?.length > 0;
    if (catId === "identificadorAte") return draft.idAte?.length > 0;
    return false;
  };

  const hasAny = FILTER_CATEGORIES.some(cat => hasDraftFor(cat.id));

  const handleApply = () => { setFilters(draft); onClose(); };
  // Limpa só o draft (mantém o modal aberto pra o usuário continuar
  // ajustando). O modal só "fecha + persiste" via "Aplicar filtros".
  const handleClearDraft = () => {
    setDraft(EMPTY_JORNADA_FILTERS);
  };

  // Remove o filtro inteiro de UMA categoria (todos os campos relacionados).
  const removeCategoryFilter = (catId) => {
    setDraft(d => {
      const next = { ...d };
      if (catId === "data") { next.dataPadrao = null; next.dataInicio = ""; next.dataFim = ""; }
      else if (catId === "jornada") next.jornadas = [];
      else if (catId === "status") next.pendencias = [];
      else if (catId === "telefone") next.telefone = [];
      else if (catId === "email") next.email = [];
      else if (catId === "identificadorAci") next.idAci = [];
      else if (catId === "identificadorConv") next.idConv = [];
      else if (catId === "identificadorAte") next.idAte = [];
      return next;
    });
  };
  // Remove UM valor específico de uma categoria multi-valor.
  const removeFromArray = (key, value) => {
    setDraft(d => ({ ...d, [key]: (d[key] || []).filter(v => v !== value) }));
  };
  // Mantido por retrocompatibilidade (atalho do removeFromArray pra jornadas).
  const removeJornadaValue = (nome) => removeFromArray("jornadas", nome);

  // Formata "YYYY-MM-DD" → "DD/MM/AA" pra exibir no chip de data.
  const formatBRDate = (iso) => {
    if (!iso) return "";
    const m = String(iso).match(/(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1].slice(2)}` : iso;
  };

  // Lista de chips por categoria — cada chip carrega seu próprio handler
  // de remoção, permitindo retirar 1 item por vez (ex.: 1 jornada de
  // várias selecionadas) ou a categoria inteira.
  const getChipsFor = (catId) => {
    if (catId === "data") {
      if (draft.dataPadrao && draft.dataPadrao !== "custom") {
        const presetLabels = { hoje: "Hoje", "7d": "Últimos 7 dias", "30d": "30 dias", "60d": "60 dias", "90d": "90 dias" };
        return [{ key: "data", label: presetLabels[draft.dataPadrao] || draft.dataPadrao, onRemove: () => removeCategoryFilter("data") }];
      }
      if (draft.dataInicio || draft.dataFim) {
        const s = formatBRDate(draft.dataInicio);
        const e = formatBRDate(draft.dataFim);
        const label = s && e ? `${s} → ${e}` : s ? `A partir de ${s}` : `Até ${e}`;
        return [{ key: "data", label, onRemove: () => removeCategoryFilter("data") }];
      }
      return [];
    }
    if (catId === "jornada") {
      return (draft.jornadas || []).map(j => ({ key: `jornada:${j}`, label: j, onRemove: () => removeJornadaValue(j) }));
    }
    if (catId === "status") {
      return (draft.pendencias || []).map(v => ({
        key: `status:${v}`, label: v,
        onRemove: () => removeFromArray("pendencias", v),
      }));
    }
    // Categorias multi-valor (chip-input) — um chip por valor digitado.
    const MULTI = [
      { catId: "telefone",         key: "telefone" },
      { catId: "email",            key: "email" },
      { catId: "identificadorAci", key: "idAci" },
      { catId: "identificadorConv", key: "idConv" },
      { catId: "identificadorAte", key: "idAte" },
    ];
    const multi = MULTI.find(m => m.catId === catId);
    if (multi) {
      return (draft[multi.key] || []).map(v => ({
        key: `${multi.key}:${v}`, label: v,
        onRemove: () => removeFromArray(multi.key, v),
      }));
    }
    return [];
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
        <FilterCheckboxList label="Status da conversa"
          items={["Aberto", "Encerrado", "Pendente"]}
          checked={draft.pendencias || []}
          onChange={val => setDraft(d => ({ ...d, pendencias: toggleArr(d.pendencias || [], val) }))} />
      );
      case "telefone": return (
        <FilterChipsInput
          label="Telefone"
          values={draft.telefone}
          onChange={vals => setDraft(d => ({ ...d, telefone: vals }))}
          onClear={() => setDraft(d => ({ ...d, telefone: [] }))}
          placeholder="Digite um telefone e pressione Enter"
        />
      );
      case "email": return (
        <FilterChipsInput
          label="E-mail"
          values={draft.email}
          onChange={vals => setDraft(d => ({ ...d, email: vals }))}
          onClear={() => setDraft(d => ({ ...d, email: [] }))}
          placeholder="Digite um e-mail e pressione Enter"
        />
      );
      case "identificadorAci": return (
        <FilterChipsInput
          label="Identificador do acionamento"
          values={draft.idAci}
          onChange={vals => setDraft(d => ({ ...d, idAci: vals }))}
          onClear={() => setDraft(d => ({ ...d, idAci: [] }))}
          placeholder="Digite um identificador e pressione Enter"
        />
      );
      case "identificadorConv": return (
        <FilterChipsInput
          label="Identificador da conversa"
          values={draft.idConv}
          onChange={vals => setDraft(d => ({ ...d, idConv: vals }))}
          onClear={() => setDraft(d => ({ ...d, idConv: [] }))}
          placeholder="Digite um identificador e pressione Enter"
        />
      );
      case "identificadorAte": return (
        <FilterChipsInput
          label="Identificador do atendimento"
          values={draft.idAte}
          onChange={vals => setDraft(d => ({ ...d, idAte: vals }))}
          onClear={() => setDraft(d => ({ ...d, idAte: [] }))}
          placeholder="Digite um identificador e pressione Enter"
        />
      );
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
        {/* Header — encosta nas bordas do topo do modal (full-bleed),
            separado do body por uma sombra suave (em vez de border). */}
        <div style={{
          background: "#fff",
          padding: "16px 22px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
          boxShadow: "0 2px 6px rgba(40,41,61,0.06)",
          zIndex: 1,
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
            {/* Botão "Aplicar filtros" — disabled segue o estilo do design system
                (pill outlined neutro com ícone de salvar). Ativo vira primary. */}
            <button
              type="button"
              onClick={handleApply}
              disabled={!hasAny}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                height: 40, padding: "0 18px", borderRadius: 10,
                border: hasAny ? 0 : `1px solid ${c.border}`,
                background: hasAny ? c.primary : c.borderSoft,
                color: hasAny ? "#fff" : c.fg3,
                fontSize: 13, fontWeight: 600,
                cursor: hasAny ? "pointer" : "not-allowed",
                fontFamily: "Montserrat, sans-serif",
                boxShadow: hasAny ? "0 2px 6px rgba(146,64,255,0.30)" : "none",
                transition: "background 150ms ease, color 150ms ease, border-color 150ms ease, box-shadow 150ms ease",
              }}
            >
              <i className="ph ph-floppy-disk" style={{ fontSize: 16 }} />
              Aplicar filtros
            </button>
            <button onClick={onClose} aria-label="Fechar" style={{
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
          {/* Left card — categories. Sombra leve pra elevar do canvas. */}
          <div style={{
            background: "#fff", borderRadius: 12,
            display: "flex", flexDirection: "column", overflow: "hidden",
            boxShadow: "0 1px 3px rgba(40,41,61,0.06)",
          }}>
            {/* Header do painel — título "Filtros" + ícone de vassoura
                no canto superior direito (visível só quando há draft). */}
            <div style={{
              padding: "16px 20px 8px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: c.fg1 }}>Filtros</span>
              {hasAny && (
                <CCMTooltip label="Retirar todos os filtros">
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    aria-label="Retirar todos os filtros"
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: 0,
                      background: c.primaryLightest, color: c.primary,
                      cursor: "pointer",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "Montserrat, sans-serif",
                      transition: "background 120ms ease",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = c.primaryLight}
                    onMouseLeave={e => e.currentTarget.style.background = c.primaryLightest}
                  >
                    <i className="ph ph-broom" style={{ fontSize: 16 }} />
                  </button>
                </CCMTooltip>
              )}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 0 16px" }}>
              {FILTER_CATEGORIES.map(cat => {
                const isActive = selected === cat.id;
                const chips = getChipsFor(cat.id);
                return (
                  <div key={cat.id} onClick={() => setSelected(cat.id)} style={{
                    display: "flex", flexDirection: "column", gap: chips.length > 0 ? 8 : 0,
                    padding: "12px 16px", cursor: "pointer",
                    background: isActive ? c.primaryLightest : "transparent",
                    borderRadius: isActive ? 10 : 0,
                    margin: isActive ? "2px 8px" : "0",
                    transition: "background 120ms ease",
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                    }}>
                      <span style={{
                        fontSize: 14, fontWeight: 700,
                        color: isActive ? c.primary : c.fg1,
                      }}>{cat.label}</span>
                      <i className="ph ph-caret-right" style={{
                        fontSize: 14, color: isActive ? c.primary : c.fg3,
                      }} />
                    </div>
                    {chips.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {chips.map(chip => (
                          <span
                            key={chip.key}
                            onClick={e => e.stopPropagation()}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              background: "#fff", color: c.primary,
                              border: `1px solid ${c.primaryLight}`,
                              fontSize: 11, fontWeight: 600,
                              padding: "3px 4px 3px 10px", borderRadius: 999,
                              fontFamily: "Montserrat, sans-serif",
                              maxWidth: "100%",
                            }}
                          >
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {chip.label}
                            </span>
                            <CCMTooltip label="Retirar este filtro">
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); chip.onRemove(); }}
                                aria-label="Retirar este filtro"
                                style={{
                                  width: 16, height: 16, border: 0,
                                  background: "transparent", color: c.primary,
                                  cursor: "pointer", borderRadius: 4,
                                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                                  fontFamily: "Montserrat, sans-serif",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = c.primaryLightest}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                              >
                                <i className="ph ph-x" style={{ fontSize: 11 }} />
                              </button>
                            </CCMTooltip>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right card — options.
              `alignSelf: start` + `maxHeight: 100%` faz o card crescer com o
              conteúdo mas nunca passar do height do card esquerdo (que
              estica pela altura total da row do grid). */}
          <div style={{
            background: "#fff", borderRadius: 12,
            overflowY: "auto", padding: "16px 20px",
            boxShadow: "0 1px 3px rgba(40,41,61,0.06)",
            alignSelf: "start",
            maxHeight: "100%",
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
  // Para preview de range no hover enquanto o usuário ainda não confirmou o fim.
  const [hoverDay, setHoverDay] = React.useState(null);

  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const dayNames = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"];

  // ── Helpers de data ─────────────────────────────────────────────────
  // Persistimos no formato "YYYY-MM-DD" (estável p/ comparação string).
  const fmtIso = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const fmtBR  = (y, m, d) => `${String(d).padStart(2, "0")}/${String(m + 1).padStart(2, "0")}/${y}`;
  const parseIso = (s) => {
    if (!s) return null;
    const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})/);
    return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null;
  };
  const cmp = (a, b) => (a.y * 10000 + a.m * 100 + a.d) - (b.y * 10000 + b.m * 100 + b.d);
  const eq  = (a, b) => a && b && a.y === b.y && a.m === b.m && a.d === b.d;
  const todayDate = { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() };

  const start = parseIso(inicio);
  const end   = parseIso(fim);
  // Quando há início mas não há fim, mostra preview até onde o mouse está
  const previewEnd = (start && !end && hoverDay && cmp(hoverDay, start) >= 0) ? hoverDay : null;
  const effectiveEnd = end || previewEnd;

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();
  const prevM = calMonth === 0 ? 11 : calMonth - 1;
  const prevY = calMonth === 0 ? calYear - 1 : calYear;
  const nextM = calMonth === 11 ? 0 : calMonth + 1;
  const nextY = calMonth === 11 ? calYear + 1 : calYear;

  // Cada célula carrega y/m/d reais — assim conseguimos pintar o range
  // mesmo quando ele atravessa os dias "fora do mês" no fim/início do grid.
  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: daysInPrev - firstDay + 1 + i, y: prevY, m: prevM, cur: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, y: calYear, m: calMonth, cur: true });
  }
  const remaining = 7 - (cells.length % 7 === 0 ? 7 : cells.length % 7);
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, y: nextY, m: nextM, cur: false });
  }

  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };

  // ── Comportamento de seleção de range ───────────────────────────────
  // 1º clique → define o início, limpa fim
  // 2º clique antes do início → reseta o início para essa data
  // 2º clique no início ou depois → define o fim
  // 3º clique (range completo) → começa um novo range
  const handleDayClick = (cell) => {
    const clicked = { y: cell.y, m: cell.m, d: cell.day };
    if (!start || (start && end)) {
      onInicio(fmtIso(clicked.y, clicked.m, clicked.d));
      onFim("");
    } else {
      if (cmp(clicked, start) < 0) {
        onInicio(fmtIso(clicked.y, clicked.m, clicked.d));
        onFim("");
      } else {
        onFim(fmtIso(clicked.y, clicked.m, clicked.d));
      }
    }
  };

  const clearRange = () => { onInicio(""); onFim(""); };

  // Estado visual da célula
  const cellState = (cellDate) => {
    if (!start) return { isStart: false, isEnd: false, inRange: false };
    const isStart = eq(cellDate, start);
    const isEnd   = effectiveEnd && eq(cellDate, effectiveEnd);
    const inRange = effectiveEnd && !isStart && !isEnd
      && cmp(cellDate, start) > 0 && cmp(cellDate, effectiveEnd) < 0;
    return { isStart, isEnd, inRange };
  };

  // Resumo do range escolhido (exibido acima do calendário)
  const rangeLabel = (() => {
    if (!start) return null;
    const sBR = fmtBR(start.y, start.m, start.d);
    if (end) return `${sBR} → ${fmtBR(end.y, end.m, end.d)}`;
    return `${sBR} → selecione a data final`;
  })();

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

      {/* Título + resumo do range + botão limpar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, marginBottom: 14, flexWrap: "wrap",
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: c.fg1 }}>
          Período personalizado
        </div>
        {start && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: end ? c.fg1 : c.fg2, fontWeight: end ? 600 : 500 }}>
              {rangeLabel}
            </span>
            <button
              type="button"
              onClick={clearRange}
              style={{
                border: 0, background: "transparent", color: c.primary,
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                padding: "2px 6px", borderRadius: 6,
                fontFamily: "Montserrat, sans-serif",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}
              onMouseEnter={e => e.currentTarget.style.background = c.primaryLightest}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <i className="ph ph-x" style={{ fontSize: 11 }} /> Limpar
            </button>
          </div>
        )}
      </div>

      {/* Mini calendar — range picker */}
      <div style={{ userSelect: "none" }} onMouseLeave={() => setHoverDay(null)}>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 }}>
          {dayNames.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: c.fg3, padding: "4px 0" }}>{d}</div>
          ))}
        </div>
        {/* gap: 0 deixa as células coladas pra o background do range fluir
            sem "buracos" entre os dias (visual estilo Airbnb/Google Flights) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
          {cells.map((cell, i) => {
            const cellDate = { y: cell.y, m: cell.m, d: cell.day };
            const isToday = eq(cellDate, todayDate);
            const { isStart, isEnd, inRange } = cellState(cellDate);
            const isEndpoint = isStart || isEnd;
            const isSingleDayRange = isStart && isEnd;

            // Background: endpoint vira primary sólido; in-range vira lightest.
            let bg = "transparent";
            let color = cell.cur ? c.fg1 : c.fg3;
            let fontWeight = 400;
            let borderRadius = 8;

            if (isEndpoint) {
              bg = c.primary;
              color = "#fff";
              fontWeight = 700;
              if (isSingleDayRange) borderRadius = 8;
              else if (isStart) borderRadius = "8px 0 0 8px";
              else if (isEnd)   borderRadius = "0 8px 8px 0";
            } else if (inRange) {
              bg = c.primaryLightest;
              color = c.primary;
              fontWeight = 600;
              borderRadius = 0;
            } else if (isToday) {
              bg = c.primaryLightest;
              color = c.primary;
              fontWeight = 700;
            }

            return (
              <div
                key={i}
                onClick={() => handleDayClick(cell)}
                onMouseEnter={() => setHoverDay(cellDate)}
                style={{
                  height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13,
                  background: bg, color, fontWeight,
                  borderRadius,
                  cursor: "pointer",
                  transition: "background 100ms ease, color 100ms ease",
                  opacity: cell.cur ? 1 : 0.55,
                }}
              >
                {cell.day}
              </div>
            );
          })}
        </div>
        {!start && (
          <div style={{ marginTop: 10, fontSize: 11, color: c.fg3, textAlign: "center" }}>
            <i className="ph ph-info" style={{ fontSize: 11, marginRight: 4 }} />
            Clique em uma data para o início, depois em outra para o fim do período.
          </div>
        )}
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

// ─────────────────────────────────────────────────────────────────────────
// FilterChipsInput — input multi-valor para categorias de filtro como
// Telefone / E-mail / Identificadores. Comportamento:
//
//   • Usuário digita e pressiona Enter → o valor vira chip aplicado
//   • Enquanto digita, aparece um "chip rascunho" tracejado abaixo do input
//     com texto "Adicionar '<valor>'" — clicar nele equivale a dar Enter
//   • Chips aplicados ficam logo abaixo, cada um com X individual
//   • Backspace com o input vazio remove o último chip aplicado
//   • Ícone de vassoura ao lado do título da categoria limpa TODOS os
//     valores desta categoria de uma vez
//   • Duplicatas são ignoradas silenciosamente (apenas limpa o input)
// ─────────────────────────────────────────────────────────────────────────
const FilterChipsInput = ({ label, values, onChange, onClear, placeholder }) => {
  const c = window.CCM.c;
  const [text, setText] = React.useState("");
  const safeValues = Array.isArray(values) ? values : [];
  const draft = text.trim();
  const isDuplicate = !!draft && safeValues.includes(draft);
  const canAddDraft = !!draft && !isDuplicate;

  const addCurrent = () => {
    if (!canAddDraft) return;
    onChange([...safeValues, draft]);
    setText("");
  };
  const removeValue = (v) => {
    onChange(safeValues.filter(x => x !== v));
  };
  const handleKey = (e) => {
    // Enter, vírgula e ponto-e-vírgula viram "inserir" — preventDefault
    // garante que o caractere de separação não vaze pro input.
    if (e.key === "Enter" || e.key === "," || e.key === ";") {
      e.preventDefault();
      addCurrent();
      return;
    }
    if (e.key === "Backspace" && !text && safeValues.length > 0) {
      removeValue(safeValues[safeValues.length - 1]);
    }
  };

  return (
    <div>
      {/* Título + ícone de vassoura por categoria */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, marginBottom: 16,
      }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: c.fg1 }}>{label}</span>
        {safeValues.length > 0 && (
          <CCMTooltip label={`Limpar todos os filtros de ${label}`}>
            <button
              type="button"
              onClick={onClear}
              aria-label={`Limpar todos os filtros de ${label}`}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 0,
                background: c.primaryLightest, color: c.primary,
                cursor: "pointer",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontFamily: "Montserrat, sans-serif",
                transition: "background 120ms ease",
              }}
              onMouseEnter={e => e.currentTarget.style.background = c.primaryLight}
              onMouseLeave={e => e.currentTarget.style.background = c.primaryLightest}
            >
              <i className="ph ph-broom" style={{ fontSize: 16 }} />
            </button>
          </CCMTooltip>
        )}
      </div>

      {/* Input */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        border: `1px solid ${c.border}`, borderRadius: 8,
        padding: "8px 12px", background: "#fff",
      }}>
        <i className="ph ph-magnifying-glass" style={{ fontSize: 14, color: c.fg3 }} />
        <input
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder || "Digite e pressione Enter"}
          style={{
            flex: 1, border: 0, outline: "none",
            fontFamily: "Montserrat, sans-serif", fontSize: 13, color: c.fg1, background: "transparent",
          }}
        />
      </div>

      {/* Hint */}
      <div style={{ fontSize: 11, color: c.fg3, marginTop: 8 }}>
        <i className="ph ph-info" style={{ fontSize: 11, marginRight: 4 }} />
        Pressione <strong style={{ color: c.fg2 }}>Enter</strong>, <strong style={{ color: c.fg2 }}>,</strong> ou <strong style={{ color: c.fg2 }}>;</strong> para adicionar.
      </div>

      {/* Chip rascunho — aparece enquanto digita, click aplica */}
      {canAddDraft && (
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={addCurrent}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              border: `1.5px dashed ${c.primary}`, background: "#fff",
              color: c.primary, fontSize: 12, fontWeight: 600,
              padding: "5px 12px", borderRadius: 999,
              cursor: "pointer", fontFamily: "Montserrat, sans-serif",
              transition: "background 120ms ease",
            }}
            onMouseEnter={e => e.currentTarget.style.background = c.primaryLightest}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
          >
            <i className="ph ph-plus-circle" style={{ fontSize: 13 }} />
            Adicionar "{draft}"
          </button>
        </div>
      )}
      {isDuplicate && (
        <div style={{ marginTop: 10, fontSize: 11, color: c.fg3 }}>
          <i className="ph ph-warning" style={{ fontSize: 11, marginRight: 4 }} />
          "{draft}" já está aplicado.
        </div>
      )}

      {/* Chips aplicados — logo abaixo do input */}
      {safeValues.length > 0 && (
        <div style={{
          marginTop: 14,
          display: "flex", flexWrap: "wrap", gap: 6,
        }}>
          {safeValues.map(v => (
            <span key={v} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: c.primaryLightest, color: c.primary,
              border: `1px solid ${c.primaryLight}`,
              fontSize: 12, fontWeight: 600,
              padding: "4px 6px 4px 12px", borderRadius: 999,
              fontFamily: "Montserrat, sans-serif",
              maxWidth: "100%",
            }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{v}</span>
              <CCMTooltip label="Retirar este filtro">
                <button
                  type="button"
                  onClick={() => removeValue(v)}
                  aria-label="Retirar este filtro"
                  style={{
                    width: 18, height: 18, border: 0,
                    background: "transparent", color: c.primary,
                    cursor: "pointer", borderRadius: 4,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "Montserrat, sans-serif",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = c.primaryLight}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <i className="ph ph-x" style={{ fontSize: 12 }} />
                </button>
              </CCMTooltip>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Single conversation item in the sidebar list
// ─────────────────────────────────────────────
// JornadaItem — usa o mesmo padrão visual do ConvCard (aba Conversas do
// detalhe do atendimento) por requisito de padronização. As INFORMAÇÕES
// exibidas são as próprias da jornada (id acionamento, canal, hora, nome
// da jornada, contato, preview, não lidas), mas o "skin" do card é o
// mesmo do ConvCard pra consistência cross-tela.
const JornadaItem = ({ jornada, active, onSelect }) => {
  const c = window.CCM.c;
  const jornadaLabel = jornada.jornadaAtendente
    ? jornada.jornadaAtendente.name
    : jornada.jornadaNome;
  const isEmail = jornada.channel === "email";

  return (
    <div onClick={onSelect} style={{
      background: active ? c.primaryLightest : "#fff",
      border: `1px solid ${active ? c.primaryLight : c.border}`,
      borderRadius: 12, padding: 14, marginBottom: 10, cursor: "pointer",
      transition: "background 200ms ease, border-color 200ms ease",
    }}>
      {/* Row 1: ID do acionamento (com tooltip) + canal + hora */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <CCMTooltip label="ID do acionamento da jornada">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "help" }}>
              <i className="ph ph-hash" style={{ fontSize: 13, color: c.fg2 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: c.fg1 }}>{jornada.id}</span>
            </span>
          </CCMTooltip>
          <i
            className={`ph ${isEmail ? "ph-envelope" : "ph-whatsapp-logo"}`}
            style={{ fontSize: 12, color: isEmail ? c.secundaryMedium : "#25D366" }}
          />
        </div>
        <span style={{ fontSize: 10, color: c.fg3 }}>{jornada.time}</span>
      </div>

      {/* Row 2/3: Jornada + Contato — tipografia idêntica ao ConvCard */}
      <div style={{ fontSize: 11, color: c.fg2, lineHeight: 1.6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <b style={{ color: c.fg1, fontWeight: 600 }}>Jornada:</b>
          {jornada.jornadaAtendente && (
            <span style={{
              background: jornada.jornadaAtendente.bg, color: jornada.jornadaAtendente.fg,
              padding: "1px 5px", borderRadius: 4, fontSize: 9, fontWeight: 700,
            }}>
              {jornada.jornadaAtendente.initials}
            </span>
          )}
          <span style={{
            color: c.fg1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0,
          }}>
            {jornadaLabel}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <b style={{ color: c.fg1, fontWeight: 600 }}>Contato:</b>
          <span style={{
            background: jornada.contato.bg, color: jornada.contato.fg,
            padding: "1px 5px", borderRadius: 4, fontSize: 9, fontWeight: 700,
          }}>
            {jornada.contato.initials}
          </span>
          <span style={{
            color: c.fg1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0,
          }}>
            {jornada.contato.email}
          </span>
        </div>
      </div>

      {/* Row 4: Preview + unread badge (badge circular igual ao ConvCard) */}
      <div style={{
        marginTop: 8, fontSize: 11, color: c.fg1, lineHeight: 1.4,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
      }}>
        <span style={{
          flex: 1,
          color: jornada.unread ? c.fg1 : c.fg2,
          fontWeight: jornada.unread ? 600 : 400,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {jornada.preview}
        </span>
        {jornada.unread > 0 && (
          <span style={{
            background: "#4eaf51", color: "#fff", fontSize: 9, fontWeight: 700,
            minWidth: 18, height: 18, borderRadius: "50%",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>{jornada.unread}</span>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Right panel — conversation thread + jornada footer
// ─────────────────────────────────────────────
const JornadasPanel = ({ jornada, sidebarCollapsed = false, onToggleSidebar }) => {
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
        <CCMTooltip label="ID do acionamento da jornada">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "help" }}>
            <i className="ph ph-hash" style={{ fontSize: 14, color: c.fg2 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: c.fg1 }}>{jornada.id}</span>
          </div>
        </CCMTooltip>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Botão único: alterna entre "expandir" (colapsa a sidebar)
              e "voltar" (X que restaura a sidebar). */}
          <JToolbarBtn
            icon={sidebarCollapsed ? "ph-x" : "ph-arrows-out"}
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? "Recolher" : "Expandir"}
          />
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
            // borderRadius 10 → bate com o botão "+" do header global
            height: 40, padding: "0 28px", borderRadius: 10, border: 0,
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
    <CCMTooltip label={title}>
      <button
        type="button"
        onClick={onClick}
        aria-label={title}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          width: 32, height: 32, borderRadius: 8, border: 0,
          background: hover ? c.borderSoft : "transparent",
          color: c.fg2, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
        <i className={`ph ${icon}`} style={{ fontSize: 16 }} />
      </button>
    </CCMTooltip>
  );
};

Object.assign(window, { JornadasView });
