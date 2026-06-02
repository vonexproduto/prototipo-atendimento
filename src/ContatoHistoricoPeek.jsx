// =====================================================================
// DE-PARA REACT → ANGULAR  ·  ContatoHistoricoPeek.jsx
// ---------------------------------------------------------------------
//   ContatoHistoricoPeek → ChatContactJourneyComponent <app-chat-contact-journey>
//                          @modules/chat-one-to-one/components/chat-contact-journey/
//                          (drawer/peek com a "jornada"/histórico do contato:
//                           todas as mensagens, conversas e atendimentos).
//   thread + MessageBubble (reusado de ConversaPanel) → ChatCoreComponent
//                          <app-chat-core> + <app-chat-message>
//   AtendimentoMarker    → separador/âncora de atendimento dentro da timeline
//   FilaFilterRow        → filtro por fila (chips .ccm-chips + mat-checkbox)
//   TotalsCell/PeopleList→ cartões de totais por canal/atendente (sem 1:1; layout)
//   overlay/peek         → mat-drawer/CDK overlay (tema material-drawer.scss)
// Doc: de-para/02-componentes.md
// =====================================================================
// ContatoHistoricoPeek.jsx — side peek com histórico completo de UM contato:
// todas as mensagens, conversas e atendimentos em que ele aparece,
// em ordem cronológica. Reaproveita MessageBubble/DayChip de ConversaPanel
// (expostos via window) e o layout da aba Histórico do AtendimentoDetail —
// sem chips de contato/atendente/fila/status/+ no topo.

// Parse "dd/mm/yy HH:MM" → epoch ms (pra ordenação cronológica)
const parseAt = (at) => {
  if (!at || typeof at !== "string") return 0;
  const m = at.match(/^(\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);
  if (!m) return 0;
  return new Date(2000 + +m[3], +m[2] - 1, +m[1], +m[4], +m[5]).getTime();
};

// Parse "dd/mm/yy - HH:MM" (formato do `dataInicio` do atendimento) → epoch ms.
// Aceita também só "dd/mm/yy".
const parseAtendimentoDate = (s) => {
  if (!s || typeof s !== "string") return 0;
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{2})/);
  if (!m) return 0;
  return new Date(2000 + +m[3], +m[2] - 1, +m[1]).getTime();
};

const channelIconOf = (ch) =>
  ch === "email" ? "ph-envelope"
  : ch === "whatsapp" ? "ph-whatsapp-logo"
  : ch === "sms" ? "ph-device-mobile"
  : ch === "torpedo" ? "ph-paper-plane-tilt"
  : ch === "rcs" ? "ph-chat-dots"
  : "ph-chat-circle";

const channelLabelOf = (ch) =>
  ch === "email" ? "E-mail"
  : ch === "whatsapp" ? "WhatsApp"
  : ch === "sms" ? "SMS"
  : ch === "torpedo" ? "Torpedo"
  : ch === "rcs" ? "RCS"
  : (ch || "Outro");

const channelColorOf = (ch) =>
  ch === "whatsapp" ? "#25D366"
  : ch === "email" ? "#9240FF"
  : "#52555f";

const ContatoHistoricoPeek = ({
  contactId, onClose, onToggleExpand, expanded = false,
}) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const contact = D.contacts?.[contactId]
    || Object.values(D.contacts || {}).find(ct => ct.id === contactId)
    || null;

  // Fechar com ESC
  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  // Computa: atendimentos onde o contato aparece, todas as conversas e mensagens
  // em ordem cronológica. Pré-condição: contact ∈ at.contatos.
  const { atendimentos, conversas, allMessages, realMsgs } = React.useMemo(() => {
    if (!contact) return { atendimentos: [], conversas: [], allMessages: [], realMsgs: [] };
    const ats = (D.atendimentos || []).filter(at =>
      (at.contatos || []).some(ct => ct.id === contact.id)
    );
    const convs = ats.flatMap(at =>
      (at.conversas || []).map(cv => ({ ...cv, atendimentoId: at.id }))
    );
    // Cada mensagem carrega seu atendimentoId pra renderizar marcadores e
    // permitir scroll por âncora.
    const msgs = convs.flatMap(cv =>
      (cv.messages || []).map(m => ({ ...m, atendimentoId: cv.atendimentoId, convId: cv.id }))
    );
    const sorted = [...msgs].sort((a, b) => parseAt(a.at) - parseAt(b.at));
    const real = sorted.filter(m => m.text && !m.type);
    return { atendimentos: ats, conversas: convs, allMessages: sorted, realMsgs: real };
  }, [contact?.id]);

  // ── Filtros da lista lateral (busca por ID + período) ──
  const [searchId, setSearchId] = React.useState("");
  const [period, setPeriod] = React.useState("all"); // "all" | "7d" | "30d" | "90d"
  const [highlightedAtId, setHighlightedAtId] = React.useState(null);

  const filteredAtendimentos = React.useMemo(() => {
    const q = searchId.trim().toLowerCase();
    // Âncora "agora": maior data do dataset (assim os filtros funcionam mesmo
    // com mocks de 2025 enquanto a data real do navegador está em 2026+).
    const allTs = atendimentos
      .map(at => parseAtendimentoDate(at.dataInicio))
      .filter(Boolean);
    const refNow = allTs.length ? Math.max(...allTs) : Date.now();
    const windowMs =
      period === "7d"  ? 7  * 86400000 :
      period === "30d" ? 30 * 86400000 :
      period === "90d" ? 90 * 86400000 : Infinity;
    return atendimentos.filter(at => {
      if (q && !String(at.id).toLowerCase().includes(q)) return false;
      if (period !== "all") {
        const ts = parseAtendimentoDate(at.dataInicio);
        if (!ts) return false;
        if (refNow - ts > windowMs) return false;
      }
      return true;
    });
  }, [atendimentos, searchId, period]);

  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [allMessages.length]);

  // Scroll até o marcador "Atendimento #ID" do grupo selecionado.
  // Highlight visual no marcador por ~1.8s pra confirmar a navegação.
  const scrollToAtendimento = React.useCallback((atendimentoId) => {
    const root = scrollRef.current;
    if (!root) return;
    const target = root.querySelector(`[data-at-marker="${atendimentoId}"]`);
    if (!target) return;
    const containerRect = root.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset = targetRect.top - containerRect.top + root.scrollTop - 16;
    root.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
    setHighlightedAtId(atendimentoId);
    setTimeout(() => {
      setHighlightedAtId(prev => prev === atendimentoId ? null : prev);
    }, 1800);
  }, []);

  if (!contact) {
    return (
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
        <div style={{ color: c.fg3, fontSize: 13 }}>Contato não encontrado.</div>
      </main>
    );
  }

  // ── Filtro por fila — multi-select de filas ativas; mensagens fora
  // das filas selecionadas dimam e as de dentro "brilham" (drop-shadow roxo).
  // Vazio = nenhum filtro aplicado, tudo renderiza normal.
  const [activeFilas, setActiveFilas] = React.useState(() => new Set());
  const toggleFila = (fila) => {
    setActiveFilas(prev => {
      const next = new Set(prev);
      if (next.has(fila)) next.delete(fila);
      else next.add(fila);
      return next;
    });
  };

  // Mapa convId → fila (lookup O(1) ao renderizar cada mensagem).
  const filaByConvId = React.useMemo(() => {
    const map = {};
    for (const cv of conversas) {
      if (cv.id && cv.fila) map[cv.id] = cv.fila;
    }
    return map;
  }, [conversas]);

  // Lista de filas únicas com contagens (msgs + conversas) pra montar a seção.
  const filasSummary = React.useMemo(() => {
    const acc = {};
    for (const cv of conversas) {
      if (!cv.fila) continue;
      const e = acc[cv.fila] || (acc[cv.fila] = { fila: cv.fila, msgs: 0, convs: 0 });
      e.convs += 1;
      e.msgs += (cv.messages || []).filter(m => m.text && !m.type).length;
    }
    return Object.values(acc).sort((a, b) => b.msgs - a.msgs);
  }, [conversas]);

  // Helper: atendimento matcha o filtro ativo? (usado pra dimar marcador)
  const atendimentoMatchesFilter = React.useCallback((atId) => {
    if (activeFilas.size === 0) return true;
    return conversas.some(cv => cv.atendimentoId === atId && activeFilas.has(cv.fila));
  }, [conversas, activeFilas]);

  // Totais por canal e participantes (extraídos do agregado pra montar a coluna
  // esquerda igual ao card da aba Histórico do atendimento).
  const byChannel = realMsgs.reduce((acc, m) => {
    const ch = m.channel || "outro";
    acc[ch] = (acc[ch] || 0) + 1;
    return acc;
  }, {});
  const agentMsgs = realMsgs.filter(m => m.role === "agent");
  const reduceByAuthor = (arr) => arr.reduce((acc, m) => {
    const a = m.author || "?";
    acc[a] = (acc[a] || 0) + 1;
    return acc;
  }, {});
  const byAtendente = reduceByAuthor(agentMsgs);

  const personByInitials = (initials) =>
    Object.values(D.contacts || {}).find(ct => ct.initials === initials);

  // Mock attendant (Camila) — usado por MessageBubble pra fallback de avatar
  const attendant = D.attendant;

  // Largura: 78vw padrão (igual ao PeekOverlay original); expandido vira tela cheia.
  const panelStyle = expanded
    ? { width: "100%", height: "100vh" }
    : { width: "min(78vw, 1200px)", minWidth: 720, height: "100vh" };

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 4500,
        background: "rgba(40,41,61,0.28)",
        display: "flex", justifyContent: "flex-end",
        animation: "ccmFadeIn 180ms ease",
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      <main
        onClick={e => e.stopPropagation()}
        style={{
          ...panelStyle,
          background: "#fff",
          boxShadow: "-8px 0 32px rgba(40,41,61,0.18)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          animation: "ccmSlideIn 220ms ease",
          position: "relative",
        }}
      >
      {/* ── Top bar simplificada (sem chips de contato/atendente/fila/status/+) ── */}
      <div style={{
        height: 60, padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${c.border}`, background: "#fff", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <CCMTooltip label="Recolher">
              <button onClick={onClose} aria-label="Recolher" style={{
                width: 32, height: 32, borderRadius: 8, border: 0,
                background: "transparent", color: c.fg2, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = c.borderSoft; e.currentTarget.style.color = c.fg1; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.fg2; }}
              ><i className="ph ph-caret-double-right" style={{ fontSize: 16 }} /></button>
            </CCMTooltip>
            <CCMTooltip label={expanded ? "Recolher conteúdo" : "Expandir conteúdo"}>
              <button onClick={onToggleExpand} aria-label={expanded ? "Recolher conteúdo" : "Expandir conteúdo"} style={{
                width: 32, height: 32, borderRadius: 8, border: 0,
                background: "transparent", color: c.fg2, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = c.borderSoft; e.currentTarget.style.color = c.fg1; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.fg2; }}
              ><i className={`ph ${expanded ? "ph-arrows-in-simple" : "ph-arrows-out-simple"}`} style={{ fontSize: 16 }} /></button>
            </CCMTooltip>
          </div>
          <span style={{
            width: 30, height: 30, borderRadius: "50%",
            background: contact.bg, color: contact.fg,
            fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{contact.initials}</span>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: c.fg1 }}>{contact.name}</span>
            <span style={{ fontSize: 11, color: c.fg3 }}>
              {contact.phone} · {contact.email}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body: sidebar de totais (esquerda) + thread (direita) ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {!expanded && (
          <div style={{
            width: 340, flexShrink: 0, display: "flex", flexDirection: "column",
            borderRight: `1px solid ${c.border}`, background: c.canvas,
          }}>
            {/* Header da aba — mantém o look da aba Histórico do atendimento */}
            <div style={{
              height: 56, padding: "0 16px",
              display: "flex", alignItems: "center", gap: 8,
              borderBottom: `1px solid ${c.border}`, background: "#fff",
            }}>
              <i className="ph ph-clock-counter-clockwise" style={{ fontSize: 16, color: c.primary }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: c.fg1 }}>Histórico do contato</span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{
                border: `1px solid ${c.primaryLight}`, borderRadius: 12,
                padding: "12px 14px", display: "flex", gap: 10, background: c.primaryLightest,
              }}>
                <i className="ph ph-info" style={{ fontSize: 16, color: c.primary, flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 11, color: c.fg1, lineHeight: 1.5 }}>
                  Veja à direita <b>todas as mensagens</b> em que {contact.name} aparece, independente de atendimento, conversa ou canal, em ordem cronológica.
                </p>
              </div>

              <div style={{
                background: "#fff", border: `1px solid ${c.border}`, borderRadius: 12, padding: 12,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: c.fg3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  Totais
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                  <TotalsCell value={realMsgs.length} label="mensagens" />
                  <TotalsCell value={atendimentos.length} label={atendimentos.length === 1 ? "atendimento" : "atendimentos"} />
                  <TotalsCell value={conversas.length} label={conversas.length === 1 ? "conversa" : "conversas"} />
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, color: c.fg3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                  Canais
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                  {Object.keys(byChannel).length === 0 && (
                    <div style={{ fontSize: 11, color: c.fg3, fontStyle: "italic" }}>Nenhum canal registrado.</div>
                  )}
                  {Object.keys(byChannel).map((ch) => (
                    <div key={ch} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: c.fg1 }}>
                      <i className={`ph ${channelIconOf(ch)}`} style={{ fontSize: 12, color: channelColorOf(ch) }} />
                      <span style={{ flex: 1 }}>{channelLabelOf(ch)}</span>
                      <span style={{ fontSize: 10, color: c.fg2 }}>{byChannel[ch]}</span>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, color: c.fg3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                  Atendentes
                </div>
                <div style={{ marginBottom: 12 }}>
                  {Object.keys(byAtendente).length > 0
                    ? <PeopleList map={byAtendente} personByInitials={personByInitials} />
                    : <div style={{ fontSize: 11, color: c.fg3, fontStyle: "italic" }}>Nenhum atendente registrado.</div>}
                </div>

                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 6,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: c.fg3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Filas de atendimento
                  </div>
                  {activeFilas.size > 0 && (
                    <CCMTooltip label="Limpar filtros de fila">
                      <button
                        onClick={() => setActiveFilas(new Set())}
                        aria-label="Limpar filtros de fila"
                        style={{
                          border: 0, background: "transparent",
                          color: c.primary, cursor: "pointer",
                          fontSize: 10, fontWeight: 700,
                          fontFamily: "Montserrat, sans-serif",
                          padding: 0,
                        }}
                      >Limpar</button>
                    </CCMTooltip>
                  )}
                </div>
                <div>
                  {filasSummary.length === 0 && (
                    <div style={{ fontSize: 11, color: c.fg3, fontStyle: "italic" }}>Nenhuma fila registrada.</div>
                  )}
                  {filasSummary.map(({ fila, msgs, convs }) => {
                    const active = activeFilas.has(fila);
                    return (
                      <FilaFilterRow
                        key={fila}
                        fila={fila}
                        msgs={msgs}
                        convs={convs}
                        active={active}
                        onToggle={() => toggleFila(fila)}
                      />
                    );
                  })}
                </div>
              </div>

              <div style={{
                background: "#fff", border: `1px solid ${c.border}`, borderRadius: 12, padding: 12,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 10,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: c.fg3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Atendimentos do contato
                  </div>
                  <span style={{
                    fontSize: 10, color: c.fg2, background: c.borderSoft,
                    padding: "2px 7px", borderRadius: 999, fontWeight: 700,
                  }}>{filteredAtendimentos.length}/{atendimentos.length}</span>
                </div>

                {/* Busca por ID */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  border: `1px solid ${c.border}`, borderRadius: 8,
                  padding: "6px 10px", background: "#fff", marginBottom: 8,
                }}>
                  <i className="ph ph-magnifying-glass" style={{ fontSize: 13, color: c.fg3 }} />
                  <input
                    value={searchId}
                    onChange={e => setSearchId(e.target.value)}
                    placeholder="Buscar por ID do atendimento…"
                    style={{
                      flex: 1, border: 0, outline: "none",
                      fontFamily: "Montserrat, sans-serif", fontSize: 12, color: c.fg1,
                      background: "transparent", minWidth: 0,
                    }}
                  />
                  {searchId && (
                    <i className="ph ph-x"
                      onClick={() => setSearchId("")}
                      style={{ fontSize: 12, color: c.fg3, cursor: "pointer" }} />
                  )}
                </div>

                {/* Chips de período */}
                <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                  {[
                    { v: "all",  label: "Todos" },
                    { v: "7d",   label: "7 dias" },
                    { v: "30d",  label: "30 dias" },
                    { v: "90d",  label: "90 dias" },
                  ].map(p => {
                    const active = period === p.v;
                    return (
                      <button
                        key={p.v}
                        onClick={() => setPeriod(p.v)}
                        style={{
                          border: `1px solid ${active ? c.primary : c.border}`,
                          background: active ? c.primaryLightest : "#fff",
                          color: active ? c.primary : c.fg2,
                          fontSize: 10, fontWeight: 600,
                          padding: "3px 9px", borderRadius: 999,
                          cursor: "pointer", fontFamily: "Montserrat, sans-serif",
                          transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
                        }}
                      >{p.label}</button>
                    );
                  })}
                </div>

                {atendimentos.length === 0 && (
                  <div style={{ fontSize: 11, color: c.fg3, fontStyle: "italic" }}>Nenhum atendimento.</div>
                )}
                {atendimentos.length > 0 && filteredAtendimentos.length === 0 && (
                  <div style={{
                    padding: "10px 6px", textAlign: "center",
                    fontSize: 11, color: c.fg3, fontStyle: "italic",
                  }}>
                    Nenhum atendimento bate com o filtro.
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {filteredAtendimentos.map(at => {
                    const isHighlighted = highlightedAtId === at.id;
                    return (
                      <CCMTooltip key={at.id} label="Ir para mensagens deste atendimento">
                        <div
                          onClick={() => scrollToAtendimento(at.id)}
                          aria-label="Ir para mensagens deste atendimento"
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "8px 10px", borderRadius: 8,
                            background: isHighlighted ? c.primaryLightest : c.borderSoft,
                            border: `1px solid ${isHighlighted ? c.primary : "transparent"}`,
                            fontSize: 11, color: c.fg1, cursor: "pointer",
                            transition: "background 150ms ease, border-color 150ms ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!isHighlighted) {
                              e.currentTarget.style.background = c.primaryLightest;
                              e.currentTarget.style.borderColor = c.primaryLight;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isHighlighted) {
                              e.currentTarget.style.background = c.borderSoft;
                              e.currentTarget.style.borderColor = "transparent";
                            }
                          }}
                        >
                          <i className="ph ph-tag" style={{ fontSize: 12, color: c.fg2 }} />
                          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                            <span style={{
                              display: "flex", alignItems: "center", gap: 6,
                              fontWeight: 700,
                              color: isHighlighted ? c.primary : c.fg1,
                            }}>
                              #{at.id}
                              <span style={{
                                color: c.fg2, fontWeight: 500,
                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              }}>{(at.titulo || "").split("—")[0].trim()}</span>
                            </span>
                            {at.dataInicio && (
                              <span style={{ fontSize: 10, color: c.fg3, marginTop: 1 }}>
                                {at.dataInicio}
                              </span>
                            )}
                          </div>
                          {at.status && (
                            <span style={{
                              background: "#fff", color: c.fg2,
                              fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999,
                              flexShrink: 0,
                            }}>{at.status}</span>
                          )}
                        </div>
                      </CCMTooltip>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Thread cronológico */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
          <div style={{
            height: 56, padding: "0 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: `1px solid ${c.border}`, background: "#fff",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i className="ph ph-clock-counter-clockwise" style={{ fontSize: 16, color: c.primary }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: c.fg1 }}>Histórico completo de {contact.name}</span>
              <span style={{
                background: c.primaryLightest, color: c.primary,
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
              }}>
                {realMsgs.length} mensagens · todos os canais
              </span>
            </div>
          </div>

          <div ref={scrollRef} style={{
            flex: 1, overflowY: "auto",
            padding: "20px 32px",
            backgroundImage: "url('design-system/assets/backgrounds/bg-chat.svg')",
            backgroundColor: "#FAF6EE",
            backgroundRepeat: "repeat",
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            {allMessages.length === 0 && (
              <div style={{
                margin: "auto", padding: "24px 18px", background: "#fff", borderRadius: 12,
                fontSize: 12, color: c.fg2, textAlign: "center", maxWidth: 360,
                boxShadow: "0 1px 3px rgba(40,41,61,0.10)",
              }}>
                Nenhuma mensagem registrada para este contato.
              </div>
            )}
            {allMessages.length > 0 && <window.DayChip text={`${realMsgs.length} mensagens · ordem cronológica`} />}
            {(() => {
              // Insere marcador "Atendimento #ID" antes do primeiro msg
              // de cada grupo de atendimento. Marcadores são âncoras pro scroll.
              // Cada mensagem vai num wrapper que reage ao filtro de filas:
              //   - dentro de fila ativa  → glow roxo + scale leve
              //   - fora de fila ativa    → opacity 0.22 + grayscale
              const hasFilter = activeFilas.size > 0;
              let lastAt = null;
              const nodes = [];
              for (const m of allMessages) {
                if (m.atendimentoId && m.atendimentoId !== lastAt) {
                  const at = atendimentos.find(x => x.id === m.atendimentoId);
                  const atDimmed = hasFilter && !atendimentoMatchesFilter(m.atendimentoId);
                  nodes.push(
                    <AtendimentoMarker
                      key={`mk-${m.atendimentoId}`}
                      atendimento={at}
                      highlighted={highlightedAtId === m.atendimentoId}
                      dimmed={atDimmed}
                    />
                  );
                  lastAt = m.atendimentoId;
                }
                const msgFila = filaByConvId[m.convId];
                const matchesFila = !hasFilter || (msgFila && activeFilas.has(msgFila));
                const wrapStyle = !hasFilter
                  ? { display: "flex", flexDirection: "column" }
                  : matchesFila
                    ? {
                        display: "flex", flexDirection: "column",
                        filter: "drop-shadow(0 0 6px rgba(146,64,255,0.55)) drop-shadow(0 2px 6px rgba(146,64,255,0.25))",
                        transform: "scale(1.015)",
                        transition: "filter 280ms ease, transform 280ms ease, opacity 280ms ease",
                      }
                    : {
                        display: "flex", flexDirection: "column",
                        opacity: 0.22,
                        filter: "grayscale(0.5)",
                        transition: "filter 280ms ease, transform 280ms ease, opacity 280ms ease",
                      };
                nodes.push(
                  <div key={m.id} style={wrapStyle}>
                    <window.MessageBubble msg={m} contact={contact} attendant={attendant} />
                  </div>
                );
              }
              return nodes;
            })()}
          </div>

          <div style={{
            background: "#fff", borderTop: `1px solid ${c.border}`,
            padding: "14px 20px", display: "flex", alignItems: "center", gap: 10,
            color: c.fg2, fontSize: 12, flexShrink: 0,
          }}>
            <i className="ph ph-eye" style={{ fontSize: 16, color: c.primary }} />
            <span>
              Visualização somente leitura. Para responder, abra uma <b style={{ color: c.fg1 }}>conversa</b> do contato.
            </span>
          </div>
        </div>
      </div>
      </main>
    </div>,
    document.body
  );
};

// Marcador inline entre grupos de mensagens — também serve de âncora pro scroll.
// Quando highlighted=true, "pulsa" em destaque por ~1.8s pra confirmar a navegação.
// Quando dimmed=true (filtro de fila ativo + nenhuma conv do atendimento bate),
// reduz opacidade pra sair do foco visual.
const AtendimentoMarker = ({ atendimento, highlighted, dimmed }) => {
  const c = window.CCM.c;
  if (!atendimento) return null;
  return (
    <div
      data-at-marker={atendimento.id}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "6px 0",
        scrollMarginTop: 16,
        opacity: dimmed && !highlighted ? 0.3 : 1,
        transition: "opacity 280ms ease",
      }}
    >
      <div style={{ flex: 1, height: 1, background: c.borderSoft, opacity: 0.7 }} />
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: highlighted ? c.primary : "#fff",
        color: highlighted ? "#fff" : c.fg2,
        border: `1px solid ${highlighted ? c.primary : c.border}`,
        borderRadius: 999, padding: "5px 14px",
        fontSize: 11, fontWeight: 700,
        boxShadow: highlighted
          ? "0 6px 20px rgba(146,64,255,0.32)"
          : "0 1px 3px rgba(40,41,61,0.08)",
        transform: highlighted ? "scale(1.04)" : "scale(1)",
        transition: "background 250ms ease, color 250ms ease, border-color 250ms ease, transform 250ms ease, box-shadow 250ms ease",
      }}>
        <i className="ph ph-tag" style={{ fontSize: 12 }} />
        Atendimento #{atendimento.id}
        {atendimento.dataInicio && (
          <span style={{
            opacity: 0.75, fontWeight: 500, fontSize: 10,
            marginLeft: 4, paddingLeft: 6,
            borderLeft: `1px solid ${highlighted ? "rgba(255,255,255,0.45)" : c.border}`,
          }}>{atendimento.dataInicio}</span>
        )}
      </div>
      <div style={{ flex: 1, height: 1, background: c.borderSoft, opacity: 0.7 }} />
    </div>
  );
};

// Linha de fila com toggle de filtro. Quando active=true, vira pill roxa
// "filtrando"; quando inactive, mostra o ícone de funil sutil que aparece no
// hover (e fica sempre visível em telas touch via opacity baseline).
const FilaFilterRow = ({ fila, msgs, convs, active, onToggle }) => {
  const c = window.CCM.c;
  const [hover, setHover] = React.useState(false);
  // Separa emoji-prefixo do nome ("🔥 Atendimento ao cliente" → 🔥 + nome)
  const m = (fila || "").match(/^(\S+)\s+(.+)$/);
  const icon = m ? m[1] : "";
  const name = m ? m[2] : fila;
  const tooltipLabel = active ? "Remover filtro desta fila" : "Filtrar mensagens desta fila";
  return (
    <CCMTooltip label={tooltipLabel}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onToggle}
        aria-label={tooltipLabel}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 8px", borderRadius: 8,
          cursor: "pointer",
          background: active ? c.primaryLightest : (hover ? c.borderSoft : "transparent"),
          border: `1px solid ${active ? c.primaryLight : "transparent"}`,
          marginBottom: 4,
          transition: "background 150ms ease, border-color 150ms ease",
        }}
      >
        <span style={{
          fontSize: 14, width: 18, textAlign: "center", flexShrink: 0,
        }}>{icon || "—"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11,
            fontWeight: active ? 700 : 500,
            color: active ? c.primary : c.fg1,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{name}</div>
          <div style={{ fontSize: 9, color: c.fg3, marginTop: 1 }}>
            {msgs} {msgs === 1 ? "msg" : "msgs"} · {convs} {convs === 1 ? "conv" : "convs"}
          </div>
        </div>
        <span
          aria-hidden
          style={{
            width: 22, height: 22, borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: active ? c.primary : (hover ? "#fff" : "transparent"),
            color: active ? "#fff" : c.fg2,
            border: active ? "none" : (hover ? `1px solid ${c.border}` : "1px solid transparent"),
            flexShrink: 0,
            transition: "background 150ms ease, color 150ms ease, border-color 150ms ease",
          }}
        >
          <i className={active ? "ph-fill ph-funnel-simple" : "ph ph-funnel-simple"} style={{ fontSize: 12 }} />
        </span>
      </div>
    </CCMTooltip>
  );
};

const TotalsCell = ({ value, label }) => {
  const c = window.CCM.c;
  return (
    <div style={{ background: c.borderSoft, borderRadius: 8, padding: "8px 10px" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: c.fg1 }}>{value}</div>
      <div style={{ fontSize: 10, color: c.fg2 }}>{label}</div>
    </div>
  );
};

const PeopleList = ({ map, personByInitials }) => {
  const c = window.CCM.c;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {Object.keys(map).map((init) => {
        const p = personByInitials(init);
        return (
          <div key={init} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 22, height: 22, borderRadius: "50%",
              background: p?.bg || c.borderSoft, color: p?.fg || c.fg2,
              fontSize: 9, fontWeight: 700, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{init}</span>
            <span style={{ flex: 1, fontSize: 11, color: c.fg1 }}>{p?.name || init}</span>
            <span style={{ fontSize: 10, color: c.fg3 }}>{map[init]}</span>
          </div>
        );
      })}
    </div>
  );
};

Object.assign(window, { ContatoHistoricoPeek });
