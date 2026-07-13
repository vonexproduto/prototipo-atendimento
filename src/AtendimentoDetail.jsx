// AtendimentoDetail.jsx — drill-down with Conversas / Contato / Histórico tabs
// =====================================================================
// DE-PARA REACT → ANGULAR  ·  AtendimentoDetail.jsx
// ---------------------------------------------------------------------
// Tela de detalhe do atendimento (o "olhinho 👁"): barra de topo +
// tabs (Conversas/Contato/Histórico) à esquerda + ConversaPanel à direita.
// Módulo Angular: @modules/chat-one-to-one.
//
//   AtendimentoDetail   → ChatTicketsDashboardComponent <app-chat-tickets-dashboard>
//                         orquestrando ChatComponent <app-chat> (painel direito).
//                         O container de layout é ChatOneToOneContainerComponent
//                         <app-chat-one-to-one-container>.
//   TabPill (tabs)      → SimpleTabsHeaderComponent <app-simple-tabs-header>
//                         @shared/components/simple-tabs-header/
//   ConversasTab/ConvCard → ChatTalksListComponent <app-chat-talks-list> (cards de conversa)
//   HistoricoTab        → ChatSectionsHistoryComponent <app-chat-sections-history>
//   ContatoTab          → painel de contatos do atendimento (lista de pessoas)
//   AvatarStackHeader   → AvatarListComponent <ccm-avatar-list>
//   PessoasPopover      → mat-menu/popover (chat-metadata-popover em popover.scss)
//   AlterarFilaModal    → TicketAssignmentModalComponent <app-ticket-assignment-modal>
//                         (aba Fila) + UserAssignmentModalComponent
//                         <app-user-assignment-modal> (aba Atendente)
//   Botão "Alterar fila" → botão-ícone 32×32 (ph-clipboard-text) na barra do
//                         atendimento. Antes era badge amarelo com SLA + nome da fila.
//                         Agora é ícone simples com hover primary. TRIGGER movido
//                         de ConversaPanel → AtendimentoDetail (CEN-133).
//   MarcadoresPopover   → ChatAttendanceMarkersSelectionComponent
//                         <app-chat-attendance-markers-selection>
//   StatusDropdown      → ChatTicketStatusComponent <app-chat-ticket-status>
//   ContatoSidePanel    → drawer de dados do contato (mat-drawer; tema material-drawer.scss)
//   reusa ConversaPanel, TransferModal, NovaConversaModal, StatusDropdown (window.*)
// Doc: de-para/02-componentes.md
// =====================================================================
const AtendimentoDetail = ({
  atendimentoId, onBack, mode = "fullscreen", onClose, onExpand,
  queue, queues, atendimentos, onSelectQueue, onSelectAtendimento,
}) => {
  const isPeek = mode === "peek";
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const demo = window.CCM_DEMO_STATE || {};
  const a = D.atendimentos.find(x => x.id === atendimentoId) || D.atendimentos[0];
  const [tab, setTab] = React.useState(demo.detailTab || "Conversas");
  const [openConvIdx, setOpenConvIdx] = React.useState(0);
  const [selectedContactId, setSelectedContactId] = React.useState("camila");
  const [showTransfer, setShowTransfer] = React.useState(!!demo.showTransfer);
  const [expanded, setExpanded] = React.useState(false);
  const [novaConversaOpen, setNovaConversaOpen] = React.useState(false);
  // Modal "Trazer conversa de outro atendimento" — operação inversa do
  // "Vincular conversa a outro atendimento" disparado do ConversaPanel.
  const [trazerConversaOpen, setTrazerConversaOpen] = React.useState(false);
  // Snackbar global do detalhe — usado pelo Link/Trazer modal e por outras
  // ações futuras de transferência/edição. Estrutura: { message, type }.
  const [snack, setSnack] = React.useState(null);
  const snackTimerRef = React.useRef(null);
  const showSnack = React.useCallback((message, type = "success", durationMs = 4200) => {
    if (snackTimerRef.current) clearTimeout(snackTimerRef.current);
    setSnack({ message, type });
    snackTimerRef.current = setTimeout(() => setSnack(null), durationMs);
  }, []);
  React.useEffect(() => () => {
    if (snackTimerRef.current) clearTimeout(snackTimerRef.current);
  }, []);
  const [alterarFilaOpen, setAlterarFilaOpen] = React.useState(false);
  const [marcadoresPop, setMarcadoresPop] = React.useState(null); // { top, left }
  const [contatoPanel, setContatoPanel] = React.useState(null);    // contact object
  const [contatoExpanded, setContatoExpanded] = React.useState(false);
  // Peek de Histórico do contato (overlay fixo). Acionado pelas hover-actions
  // do PessoasPopover de contatos. Independe do ContatoSidePanel acima.
  const [contatoHistorico, setContatoHistorico] = React.useState(null); // contact
  const [contatoHistoricoExpanded, setContatoHistoricoExpanded] = React.useState(false);
  const [contatosPop, setContatosPop] = React.useState(null);     // { top, left }
  const [atendentesPop, setAtendentesPop] = React.useState(null); // { top, left }
  const [currentFila, setCurrentFila] = React.useState(a.tipo || "Atendimento ao cliente");
  const [appliedMarkers, setAppliedMarkers] = React.useState(a.marcadores || []);
  const [currentStatus, setCurrentStatus] = React.useState(a.status || "Aberta");
  const [statusDd, setStatusDd] = React.useState(null); // { top, left }
  // Overrides locais do status de conversas (id → status). Permite "Finalizar"
  // marcar a conversa atual sem alterar o dataset.
  const [convStatusOverrides, setConvStatusOverrides] = React.useState({});
  const finalizeConversa = React.useCallback((convId) => {
    setConvStatusOverrides(prev => ({ ...prev, [convId]: "Finalizada" }));
  }, []);

  // Cor do badge de status (mesma paleta da lista pra consistência visual)
  const statusColor = (s) => {
    if (s === "Aberto" || s === "Aberta") return { bg: c.successLight, fg: c.successDark };
    if (s === "Em andamento")             return { bg: "#fff4d1", fg: "#a8660a" };
    if (s === "Pendente")                 return { bg: c.warningLight, fg: c.warningDark };
    if (s === "Pausado")                  return { bg: "#ffe4c4", fg: "#c45a0c" };
    if (s === "Cancelado")                return { bg: "#ffdde3", fg: "#c8362b" };
    if (s === "Finalizado")               return { bg: "#d4f0e2", fg: "#2f7a32" };
    return { bg: c.borderSoft, fg: c.fg2 };
  };

  // Ensure we always have conv objects array
  const conversasRaw = Array.isArray(a.conversas) ? a.conversas : [];
  // Aplica overrides de status locais (após "Finalizar" via modal)
  const conversas = conversasRaw.map(cv =>
    convStatusOverrides[cv.id] ? { ...cv, status: convStatusOverrides[cv.id] } : cv
  );
  const conv = conversas[openConvIdx];
  const contact = conv?.contact || a.contatos[0];

  // ─────────────────────────────────────────────
  // Display conv + contact change based on active tab
  // ─────────────────────────────────────────────
  let displayConv, displayContact;
  if (tab === "Contato") {
    const ct = D.contacts[selectedContactId] || D.contacts.camila;
    displayConv = {
      id: `contato-${selectedContactId}`,
      channel: "mixed",
      messages: D.messagesByContact[selectedContactId] || [],
    };
    displayContact = ct;
  } else if (tab === "Histórico") {
    displayConv = {
      id: "historico-completo",
      channel: "mixed",
      messages: D.historicoCompleto,
    };
    displayContact = { initials: "TD", bg: "#F3EBFF", fg: "#9240FF", name: "Histórico completo do atendimento" };
  } else {
    displayConv = conv;
    displayContact = contact;
  }

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, position: "relative", background: "#fff" }}>
      {/* Atendimento top bar */}
      <div style={{
        height: 60, padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${c.border}`, background: "#fff", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {isPeek ? (
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
              <CCMTooltip label="Expandir">
                <button onClick={onExpand} aria-label="Expandir" style={{
                  width: 32, height: 32, borderRadius: 8, border: 0,
                  background: "transparent", color: c.fg2, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = c.borderSoft; e.currentTarget.style.color = c.fg1; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.fg2; }}
                ><i className="ph ph-arrows-out-simple" style={{ fontSize: 16 }} /></button>
              </CCMTooltip>
            </div>
          ) : (
            <button onClick={onBack} style={{
              width: 34, height: 34, borderRadius: 8, border: 0,
              background: "transparent", color: c.fg1, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><i className="ph ph-arrow-left" style={{ fontSize: 18 }} /></button>
          )}
          {!isPeek && queue && queues ? (
            <window.QueueBreadcrumb
              queue={queue}
              queues={queues}
              onSelectQueue={onSelectQueue}
              atendimentoId={a.id}
              atendimentos={atendimentos}
              onSelectAtendimento={onSelectAtendimento}
            />
          ) : (
            <React.Fragment>
              <i className="ph ph-tag" style={{ fontSize: 18, color: c.fg2 }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: c.fg1 }}>#{a.id}</span>
            </React.Fragment>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Cluster CONTATOS — badge de quantidade + stack de avatares
              clicáveis juntos abrem o popover "Contatos do atendimento".
              Distinção importante: este é o panorama do atendimento (todos
              os contatos envolvidos em qualquer conversa). O contato
              específico da conversa aberta tem outro ponto de entrada
              (ícone 👤 na ConversaPanel). */}
          <CCMTooltip label="Contatos do atendimento">
            <div
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setContatosPop({ top: r.bottom + 8, left: r.left });
                setAtendentesPop(null);
              }}
              aria-label="Contatos do atendimento"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                cursor: "pointer", padding: "2px 4px", borderRadius: 8,
                transition: "background 120ms ease",
              }}
              onMouseEnter={e => e.currentTarget.style.background = c.borderSoft}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{
                width: 28, height: 28, borderRadius: "50%",
                background: c.secundaryLightest, color: c.secundaryMedium,
                fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{a.contatos.length}</span>
              <AvatarStackHeader list={a.contatos} />
            </div>
          </CCMTooltip>
          {/* Cluster ATENDENTES — popover com nomes dos atendentes envolvidos */}
          <CCMTooltip label="Atendentes do atendimento">
            <div
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setAtendentesPop({ top: r.bottom + 8, left: r.left });
                setContatosPop(null);
              }}
              aria-label="Atendentes do atendimento"
              style={{
                cursor: "pointer", padding: "2px 4px", borderRadius: 8,
                transition: "background 120ms ease",
              }}
              onMouseEnter={e => e.currentTarget.style.background = c.borderSoft}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <AvatarStackHeader list={a.atendentes} />
            </div>
          </CCMTooltip>
          <CCMTooltip label="Alterar fila / atendente">
            <button onClick={() => setAlterarFilaOpen(true)} aria-label="Alterar fila / atendente" style={{
              width: 32, height: 32, borderRadius: 8, border: `1px solid ${c.border}`,
              background: "#fff", color: c.fg2, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = c.primaryLightest; e.currentTarget.style.color = c.primary; e.currentTarget.style.borderColor = c.primary; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = c.fg2; e.currentTarget.style.borderColor = c.border; }}
            ><i className="ph ph-clipboard-text" style={{ fontSize: 16 }} /></button>
          </CCMTooltip>
          {/* Status pill clicável — abre o mesmo StatusDropdown da lista */}
          {(() => {
            const sc = statusColor(currentStatus);
            return (
              <CCMTooltip label="Alterar status do atendimento">
                <button
                  data-status-dd="1"
                  onClick={(e) => {
                    e.stopPropagation();
                    const r = e.currentTarget.getBoundingClientRect();
                    // Ancora abaixo, alinhado à direita pra não estourar viewport
                    setStatusDd({ top: r.bottom + 6, right: Math.max(12, window.innerWidth - r.right) });
                  }}
                  aria-label="Alterar status do atendimento"
                  style={{
                    background: sc.bg, color: sc.fg, border: 0,
                    fontSize: 11, fontWeight: 600,
                    padding: "5px 12px", borderRadius: 999,
                    cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontFamily: "Montserrat, sans-serif",
                    transition: "filter 120ms ease",
                  }}
                  onMouseEnter={e => e.currentTarget.style.filter = "brightness(0.96)"}
                  onMouseLeave={e => e.currentTarget.style.filter = "none"}
                >
                  {currentStatus}
                  <i className="ph ph-caret-down" style={{ fontSize: 10, opacity: 0.75 }} />
                </button>
              </CCMTooltip>
            );
          })()}
          <CCMTooltip label="Trazer conversa de outro atendimento">
            <button onClick={() => setTrazerConversaOpen(true)} aria-label="Trazer conversa de outro atendimento" style={{
              width: 32, height: 32, borderRadius: 8, border: `1px solid ${c.border}`,
              background: "#fff", color: c.fg2, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = c.primaryLightest; e.currentTarget.style.color = c.primary; e.currentTarget.style.borderColor = c.primary; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = c.fg2; e.currentTarget.style.borderColor = c.border; }}
            ><i className="ph ph-tray-arrow-down" style={{ fontSize: 16 }} /></button>
          </CCMTooltip>
          <CCMTooltip label="Nova conversa">
            <button onClick={() => setNovaConversaOpen(true)} aria-label="Nova conversa" style={{
              width: 32, height: 32, borderRadius: "50%", border: 0,
              background: c.primary, color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 6px rgba(146,64,255,0.30)",
            }}><i className="ph ph-plus" style={{ fontSize: 14 }} /></button>
          </CCMTooltip>
        </div>
      </div>

      {/* Body: tabs panel + right side */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {!expanded && (
          <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: `1px solid ${c.border}` }}>
            {/* Tabs */}
            <div style={{
              height: 56, padding: "0 12px",
              display: "flex", alignItems: "center", gap: 6,
              borderBottom: `1px solid ${c.border}`,
            }}>
              <TabPill icon="ph-chats-circle" label="Conversas" active={tab === "Conversas"} onClick={() => setTab("Conversas")} />
              <TabPill icon="ph-user" label="Contato" active={tab === "Contato"} onClick={() => setTab("Contato")} />
              <TabPill icon="ph-clock-counter-clockwise" label="Histórico" active={tab === "Histórico"} onClick={() => setTab("Histórico")} />
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: "auto", background: c.canvas }}>
              {tab === "Conversas" && (
                <ConversasTab conversas={conversas} openIdx={openConvIdx} onOpen={setOpenConvIdx} />
              )}
              {tab === "Contato" && (
                <ContatoTab
                  contacts={a.contatos}
                  attendant={D.attendant}
                  selectedId={selectedContactId}
                  onSelect={setSelectedContactId} />
              )}
              {tab === "Histórico" && (
                <HistoricoTab conversasCount={conversas.length} />
              )}
            </div>
          </div>
        )}

        {/* Right: open conversation (changes content based on active tab) */}
        {displayConv && (
          <ConversaPanel
            key={`${tab}-${displayConv.id}`}
            conv={displayConv}
            contact={displayContact}
            attendant={D.attendant}
            atendimentoId={a.id}
            tab={tab}
            onTransfer={() => setShowTransfer(true)}
            onOpenContact={(ct) => setContatoPanel(ct)}
            onChangeQueue={() => setAlterarFilaOpen(true)}
            appliedMarkers={appliedMarkers}
            onOpenMarcadores={(rect) => setMarcadoresPop({ top: rect.bottom + 6, left: rect.left })}
            convStatus={displayConv?.id ? (convStatusOverrides[displayConv.id] || displayConv.status) : undefined}
            onFinalizeConversa={finalizeConversa}
            expanded={expanded}
            onToggleExpand={() => setExpanded(e => !e)}
            onShowSnack={showSnack}
          />
        )}
      </div>

      {showTransfer && <TransferModal onClose={() => setShowTransfer(false)} />}
      {novaConversaOpen && <window.NovaConversaModal onClose={() => setNovaConversaOpen(false)} />}

      {trazerConversaOpen && (
        <TrazerConversaModal
          currentAtendimentoId={a.id}
          onClose={() => setTrazerConversaOpen(false)}
          onBrought={(convId, fromAtendimentoId) => {
            setTrazerConversaOpen(false);
            showSnack(`Conversa ${convId} trazida do atendimento #${fromAtendimentoId} para #${a.id}`, "success");
          }}
          onError={(message) => {
            setTrazerConversaOpen(false);
            showSnack(message || "Não foi possível trazer a conversa. Tente novamente.", "error");
          }}
        />
      )}

      {/* Snackbar global do detalhe — sucesso/erro de vincular/trazer/etc */}
      {snack && (
        <div style={{
          position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: snack.type === "error" ? "#7a1f1f" : "#1f5a3a",
          color: "#fff",
          padding: "12px 18px 12px 14px", borderRadius: 10,
          fontFamily: "Montserrat, sans-serif", fontSize: 13, fontWeight: 500,
          boxShadow: "0 8px 24px rgba(40,41,61,0.32)",
          zIndex: 10001,
          display: "flex", alignItems: "center", gap: 10,
          minWidth: 280, maxWidth: 480,
          animation: "ccmFadeIn 220ms ease",
        }}>
          <i className={`ph-fill ${snack.type === "error" ? "ph-warning-circle" : "ph-check-circle"}`}
            style={{ fontSize: 18, color: snack.type === "error" ? "#ffb4b4" : "#b4ffce", flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{snack.message}</span>
          <button
            type="button"
            onClick={() => setSnack(null)}
            aria-label="Fechar notificação"
            style={{
              border: 0, background: "transparent", color: "rgba(255,255,255,0.7)",
              cursor: "pointer", padding: 2, fontFamily: "Montserrat, sans-serif",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <i className="ph ph-x" style={{ fontSize: 14 }} />
          </button>
        </div>
      )}

      {alterarFilaOpen && (
        <AlterarFilaModal
          currentFila={currentFila}
          queues={queues || (window.CCM_DATA && window.CCM_DATA.queues)}
          onClose={() => setAlterarFilaOpen(false)}
          onConfirm={(newFila) => { setCurrentFila(newFila); setAlterarFilaOpen(false); }}
        />
      )}

      {marcadoresPop && (
        <MarcadoresPopover
          pos={marcadoresPop}
          applied={appliedMarkers}
          onClose={() => setMarcadoresPop(null)}
          onToggle={(marker) => {
            setAppliedMarkers(prev => {
              const exists = prev.some(m => m.label === marker.label);
              return exists ? prev.filter(m => m.label !== marker.label) : [...prev, marker];
            });
          }}
        />
      )}

      {contatosPop && (
        <PessoasPopover
          pos={contatosPop}
          title="Contatos do atendimento"
          people={a.contatos}
          onSelectHistorico={(ct) => { setContatoHistorico(ct); setContatoHistoricoExpanded(false); setContatosPop(null); }}
          onSelectDados={(ct) => { setContatoPanel(ct); setContatosPop(null); }}
          onClose={() => setContatosPop(null)}
        />
      )}

      {atendentesPop && (
        <PessoasPopover
          pos={atendentesPop}
          title="Atendentes do atendimento"
          people={a.atendentes}
          selectable={false}
          onClose={() => setAtendentesPop(null)}
        />
      )}

      {statusDd && window.StatusDropdown && (
        <window.StatusDropdown
          pos={statusDd}
          current={currentStatus}
          onClose={() => setStatusDd(null)}
          onSelect={(s) => { setCurrentStatus(s); setStatusDd(null); }}
        />
      )}

      {contatoPanel && (
        <ContatoSidePanel
          contact={contatoPanel}
          atendimento={a}
          expanded={contatoExpanded}
          onToggleExpand={() => setContatoExpanded(e => !e)}
          onClose={() => { setContatoPanel(null); setContatoExpanded(false); }}
        />
      )}

      {contatoHistorico && window.ContatoHistoricoPeek && (
        <window.ContatoHistoricoPeek
          contactId={contatoHistorico.id}
          expanded={contatoHistoricoExpanded}
          onClose={() => { setContatoHistorico(null); setContatoHistoricoExpanded(false); }}
          onToggleExpand={() => setContatoHistoricoExpanded(e => !e)}
        />
      )}
    </main>
  );
};

const TabPill = ({ icon, label, active, onClick }) => {
  const c = window.CCM.c;
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: active ? "7px 14px" : "7px 9px", borderRadius: 999,
      border: 0, cursor: "pointer", fontSize: 12, fontWeight: 600,
      background: active ? c.primaryLightest : "transparent",
      color: active ? c.primaryDark : c.fg2,
      fontFamily: "Montserrat, sans-serif",
    }}>
      <i className={`ph ${icon}`} style={{ fontSize: 14 }} />
      {active && label}
    </button>
  );
};

// Stack de avatares sobrepostos. Calcula o "+N" a partir do tamanho real da
// lista (ignora prop `extra` legado pra evitar contagens fictícias).
const AvatarStackHeader = ({ list, maxVisible = 3 }) => {
  if (!list?.length) return null;
  const visible = list.slice(0, maxVisible);
  const overflow = list.length - visible.length;
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
      {overflow > 0 && (
        <span style={{
          width: 26, height: 26, borderRadius: "50%",
          background: "#9240FF", color: "#fff", fontSize: 9, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid #fff", marginLeft: -8,
        }}>+{overflow}</span>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// PessoasPopover — lista contatos OU atendentes do atendimento
//
// Modos:
//   • selectable=false (atendentes): só nome, sem ações.
//   • onSelectHistorico+onSelectDados (contatos): hover na linha revela 2
//     botões (Histórico de mensagens / Dados do contato).
//   • onSelect (legado): click na linha dispara handler único.
// ─────────────────────────────────────────────
const PessoasPopover = ({ pos, title, people, onSelect, onSelectHistorico, onSelectDados, onClose, selectable = true }) => {
  const c = window.CCM.c;
  React.useEffect(() => {
    const h = (e) => { if (!e.target.closest("[data-pessoas-pop]")) onClose(); };
    setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const hasDualActions = !!(onSelectHistorico && onSelectDados);
  // Wider quando temos 2 botões pra caber sem espremer o nome.
  const popWidth = hasDualActions ? 360 : 280;
  const left = Math.min(pos.left, window.innerWidth - popWidth - 12);

  return ReactDOM.createPortal(
    <div data-pessoas-pop="1" style={{
      position: "fixed",
      top: pos.top, left,
      width: popWidth,
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 8px 24px rgba(40,41,61,0.18)",
      border: `1px solid ${c.border}`,
      zIndex: 5000,
      fontFamily: "Montserrat, sans-serif",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 14px 8px",
        fontSize: 12, fontWeight: 700, color: c.fg1,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span>{title} <span style={{ color: c.fg3, fontWeight: 600 }}>({people.length})</span></span>
      </div>
      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        {people.map((p, i) => (
          <PessoaRow
            key={i}
            person={p}
            isFirst={i === 0}
            selectable={selectable}
            hasDualActions={hasDualActions}
            onSelect={onSelect}
            onSelectHistorico={onSelectHistorico}
            onSelectDados={onSelectDados}
          />
        ))}
      </div>
    </div>,
    document.body
  );
};

const PessoaRow = ({ person, isFirst, selectable, hasDualActions, onSelect, onSelectHistorico, onSelectDados }) => {
  const c = window.CCM.c;
  const [hover, setHover] = React.useState(false);

  const handleRowClick = () => {
    if (hasDualActions) return; // hover-actions exclusivas
    if (selectable) onSelect?.(person);
  };

  return (
    <div
      onClick={handleRowClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 14px",
        cursor: hasDualActions ? "default" : (selectable ? "pointer" : "default"),
        background: hover && selectable ? c.borderSoft : "transparent",
        transition: "background 120ms ease",
      }}
    >
      <span style={{
        width: 28, height: 28, borderRadius: "50%",
        background: person.bg, color: person.fg, fontSize: 10, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>{person.initials}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: c.fg1,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{person.name}</div>
        {isFirst && selectable && (
          <div style={{ fontSize: 10, color: c.fg3 }}>Contato principal</div>
        )}
      </div>

      {hasDualActions ? (
        <div style={{
          display: "flex", gap: 4,
          opacity: hover ? 1 : 0,
          transform: hover ? "translateX(0)" : "translateX(8px)",
          transition: "opacity 160ms ease, transform 160ms ease",
          pointerEvents: hover ? "auto" : "none",
          flexShrink: 0,
        }}>
          <RowActionPill
            icon="ph-clock-counter-clockwise"
            label="Histórico"
            tooltip="Histórico de mensagens"
            onClick={(e) => { e.stopPropagation(); onSelectHistorico?.(person); }}
          />
          <RowActionPill
            icon="ph-identification-card"
            label="Dados"
            tooltip="Dados do contato"
            onClick={(e) => { e.stopPropagation(); onSelectDados?.(person); }}
          />
        </div>
      ) : (
        selectable && <i className="ph ph-caret-right" style={{ fontSize: 12, color: c.fg3 }} />
      )}
    </div>
  );
};

const RowActionPill = ({ icon, label, tooltip, onClick }) => {
  const c = window.CCM.c;
  const [hover, setHover] = React.useState(false);
  return (
    <CCMTooltip label={tooltip}>
      <button
        onClick={onClick}
        aria-label={tooltip}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          height: 26, padding: "0 10px", borderRadius: 999, border: 0,
          background: hover ? c.primary : "#fff",
          color: hover ? "#fff" : c.primary,
          border: `1px solid ${c.primaryLight}`,
          fontSize: 11, fontWeight: 600, cursor: "pointer",
          fontFamily: "Montserrat, sans-serif",
          whiteSpace: "nowrap",
          transition: "background 120ms ease, color 120ms ease",
        }}
      >
        <i className={`ph ${icon}`} style={{ fontSize: 13 }} />
        {label}
      </button>
    </CCMTooltip>
  );
};

// ------- Tab: Conversas (list of conv cards) -------
const ConversasTab = ({ conversas, openIdx, onOpen }) => {
  const c = window.CCM.c;
  return (
    <div style={{ padding: "12px 12px 24px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: c.fg2, padding: "8px 4px 12px" }}>Conversas</div>
      {conversas.map((cv, i) => (
        <ConvCard key={i} conv={cv} active={i === openIdx} onClick={() => onOpen(i)} />
      ))}
    </div>
  );
};

const ConvCard = ({ conv, active, onClick }) => {
  const c = window.CCM.c;
  const statusBg = conv.status === "Aberta" ? c.successLight : c.borderSoft;
  const statusFg = conv.status === "Aberta" ? c.successDark : c.fg2;
  return (
    <div onClick={onClick} style={{
      background: active ? c.primaryLightest : "#fff",
      border: `1px solid ${active ? c.primaryLight : c.border}`,
      borderRadius: 12, padding: 14, marginBottom: 10, cursor: "pointer",
      transition: "background 200ms ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ph ph-chats-circle" style={{ fontSize: 13, color: c.fg2 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: c.fg1 }}>{conv.id}</span>
          <i className={`ph ${conv.channel === "email" ? "ph-envelope" : "ph-whatsapp-logo"}`}
             style={{ fontSize: 12, color: conv.channel === "email" ? c.secundaryMedium : "#25D366" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            background: statusBg, color: statusFg,
            fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
          }}>{conv.status}</span>
          <span style={{ fontSize: 10, color: c.fg3 }}>{conv.time}</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: c.fg2, lineHeight: 1.6 }}>
        <div><b style={{ color: c.fg1, fontWeight: 600 }}>Atendente:</b> <span style={{
          background: "#D7CCFF", color: "#410293", padding: "1px 5px", borderRadius: 4, fontSize: 9, fontWeight: 700,
        }}>CA</span> Camila Alves</div>
        <div><b style={{ color: c.fg1, fontWeight: 600 }}>Contato:</b> <span style={{
          background: "#FFE0CB", color: "#9b4500", padding: "1px 5px", borderRadius: 4, fontSize: 9, fontWeight: 700,
        }}>RM</span> ricardomendes@gmail.com</div>
        <div><b style={{ color: c.fg1, fontWeight: 600 }}>Fila:</b> {conv.fila}</div>
      </div>
      <div style={{
        marginTop: 8, fontSize: 11, color: c.fg1, lineHeight: 1.4,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
      }}>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.preview}</span>
        {conv.unread && (
          <span style={{
            background: "#4eaf51", color: "#fff", fontSize: 9, fontWeight: 700,
            minWidth: 18, height: 18, borderRadius: "50%",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>{conv.unread}</span>
        )}
      </div>
    </div>
  );
};

// ------- Tab: Contato (people involved — click to filter right panel by author) -------
const ContatoTab = ({ contacts, attendant, selectedId, onSelect }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;

  const lastMsg = (key) => {
    const arr = D.messagesByContact[key] || [];
    for (let i = arr.length - 1; i >= 0; i--) if (arr[i].text) return arr[i];
    return null;
  };

  const people = [
    { key: "camila",    role: "Atendente principal", time: "16:52" },
    { key: "jandilson", role: "Atendente de apoio",  time: "14:18" },
    { key: "paulo",     role: "Gerente da conta",    time: "Ontem" },
  ];
  return (
    <div style={{ padding: "12px 12px 24px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: c.fg2, padding: "8px 4px 12px" }}>Contatos</div>
      {people.map((p) => {
        const ct = D.contacts[p.key];
        const last = lastMsg(p.key);
        const selected = selectedId === p.key;
        const preview = last ? (last.text.length > 56 ? last.text.slice(0, 56) + "…" : last.text) : "—";
        const count = (D.messagesByContact[p.key] || []).filter(m => m.text).length;
        return (
        <div key={p.key} onClick={() => onSelect && onSelect(p.key)} style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: 10, marginBottom: 8, cursor: "pointer",
          background: selected ? c.primaryLightest : "#fff",
          border: `1px solid ${selected ? c.primaryLight : c.border}`,
          borderRadius: 12,
          transition: "background 150ms ease, border-color 150ms ease",
        }}>
          <span style={{
            width: 30, height: 30, borderRadius: "50%",
            background: ct.bg, color: ct.fg, fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>{ct.initials}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: c.fg1 }}>{ct.name}</span>
              <span style={{ fontSize: 10, color: c.fg3 }}>{p.time}</span>
            </div>
            <div style={{ fontSize: 10, color: selected ? c.primary : c.fg3, marginTop: 2, fontWeight: 500 }}>
              {p.role}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: c.fg2, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</span>
              <span style={{
                background: selected ? c.primary : "#9aa2b1",
                color: "#fff", fontSize: 9, fontWeight: 700,
                minWidth: 18, height: 18, borderRadius: "50%",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>{count}</span>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
};

// ------- Tab: Histórico -------
const HistoricoTab = ({ conversasCount }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const all = D.historicoCompleto || [];
  const realMsgs = all.filter(m => m.text && !m.type);
  const agentMsgs = realMsgs.filter(m => m.role === "agent");
  const contactMsgs = realMsgs.filter(m => m.role === "contact");

  // Count by channel
  const byChannel = realMsgs.reduce((acc, m) => {
    const ch = m.channel || "outro";
    acc[ch] = (acc[ch] || 0) + 1;
    return acc;
  }, {});
  // Count by author (initials) — split per role
  const reduceByAuthor = (arr) => arr.reduce((acc, m) => {
    const a = m.author || "?";
    acc[a] = (acc[a] || 0) + 1;
    return acc;
  }, {});
  const byAtendente = reduceByAuthor(agentMsgs);
  const byContato = reduceByAuthor(contactMsgs);

  const channelIcon = (ch) => ch === "email" ? "ph-envelope" : ch === "whatsapp" ? "ph-whatsapp-logo" : "ph-chat-circle";
  const channelLabel = (ch) => ch === "email" ? "E-mail" : ch === "whatsapp" ? "WhatsApp" : ch;

  const personByInitials = (initials) => Object.values(D.contacts).find(ct => ct.initials === initials);

  const renderPeopleList = (map) => (
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
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ padding: "12px 12px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: c.fg2, padding: "8px 4px 0" }}>Histórico</div>

      <div style={{
        border: `1px solid ${c.primaryLight}`, borderRadius: 12,
        padding: "12px 14px", display: "flex", gap: 10, background: c.primaryLightest,
      }}>
        <i className="ph ph-info" style={{ fontSize: 16, color: c.primary, flexShrink: 0, marginTop: 2 }} />
        <p style={{ margin: 0, fontSize: 11, color: c.fg1, lineHeight: 1.5 }}>
          Veja à direita <b>todas as mensagens</b> deste atendimento, independente de conversa, atendente ou contato, em ordem cronológica.
        </p>
      </div>

      <div style={{
        background: "#fff", border: `1px solid ${c.border}`, borderRadius: 12, padding: 12,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: c.fg3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
          Totais
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, background: c.borderSoft, borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.fg1 }}>{realMsgs.length}</div>
            <div style={{ fontSize: 10, color: c.fg2 }}>mensagens</div>
          </div>
          <div style={{ flex: 1, background: c.borderSoft, borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.fg1 }}>{conversasCount || 0}</div>
            <div style={{ fontSize: 10, color: c.fg2 }}>conversas</div>
          </div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, color: c.fg3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
          Canais
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
          {Object.keys(byChannel).map((ch) => (
            <div key={ch} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: c.fg1 }}>
              <i className={`ph ${channelIcon(ch)}`} style={{ fontSize: 12, color: ch === "whatsapp" ? "#25D366" : c.secundaryMedium }} />
              <span style={{ flex: 1 }}>{channelLabel(ch)}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, color: c.fg3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
          Atendentes
        </div>
        <div style={{ marginBottom: 12 }}>
          {Object.keys(byAtendente).length > 0
            ? renderPeopleList(byAtendente)
            : <div style={{ fontSize: 11, color: c.fg3, fontStyle: "italic" }}>Nenhum atendente registrado.</div>}
        </div>

        <div style={{ fontSize: 10, fontWeight: 700, color: c.fg3, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
          Contatos
        </div>
        <div>
          {Object.keys(byContato).length > 0
            ? renderPeopleList(byContato)
            : <div style={{ fontSize: 11, color: c.fg3, fontStyle: "italic" }}>Nenhum contato registrado.</div>}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// AlterarFilaModal — Notion-style "change queue" modal
// ─────────────────────────────────────────────
const AlterarFilaModal = ({ currentFila, queues, onClose, onConfirm }) => {
  const c = window.CCM.c;
  const [tab, setTab] = React.useState("fila");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState(currentFila);

  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  // Flatten queues (groups + children) to a list of filas
  // "Sem fila específica" e "Sem operação específica" não devem aparecer
  // como opções de transferência — são buckets de itens órfãos.
  const filas = [];
  (queues || []).forEach(q => {
    if (q.children?.length) {
      q.children.forEach(ch => {
        if (ch.id !== "sem-fila") filas.push({ icon: ch.icon, name: ch.name });
      });
    } else if (q.id !== "sem-fila") {
      filas.push({ icon: q.icon, name: q.name });
    }
  });

  const ATTENDANTS = [
    { id: "a1", initials: "CA", name: "Camila Alves" },
    { id: "a2", initials: "BL", name: "Bruno Lima" },
    { id: "a3", initials: "DC", name: "Diego Costa" },
    { id: "a4", initials: "EA", name: "Eduardo Almeida" },
  ];

  const items = tab === "fila"
    ? filas.filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()))
    : ATTENDANTS.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 4000,
      background: "rgba(40,41,61,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Montserrat, sans-serif",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 640, maxWidth: "calc(100vw - 48px)",
        maxHeight: "82vh",
        background: "#fff", borderRadius: 16,
        boxShadow: "0 16px 48px rgba(40,41,61,0.22)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${c.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: c.fg1 }}>Alterar fila de atendimento</h3>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8, border: 0,
              background: "transparent", color: c.fg2, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><i className="ph ph-x" style={{ fontSize: 18 }} /></button>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: c.fg2 }}>Altere fila de atendimento da conversa</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 24, padding: "0 24px", borderBottom: `1px solid ${c.border}` }}>
          {[
            { id: "atend", icon: "ph-user",        label: "Atendente" },
            { id: "fila",  icon: "ph-list-numbers", label: "Fila de Atendimento" },
          ].map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setSearch(""); }} style={{
                position: "relative", height: 44, border: 0, background: "transparent",
                display: "flex", alignItems: "center", gap: 7,
                fontFamily: "Montserrat, sans-serif",
                fontSize: 13, fontWeight: 600,
                color: active ? c.primary : c.fg2, cursor: "pointer",
              }}>
                <i className={`ph ${t.icon}`} style={{ fontSize: 14 }} />
                {t.label}
                {active && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2, background: c.primary }} />}
              </button>
            );
          })}
        </div>

        {/* Description */}
        <div style={{ padding: "14px 24px 0", fontSize: 12, color: c.fg2, lineHeight: 1.5 }}>
          Ao transferir a conversa para uma fila de atendimento, somente as pessoas responsáveis por esta fila de atendimento poderão realizar o atendimento.
        </div>

        {/* Search */}
        <div style={{ padding: "12px 24px 8px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            border: `1px solid ${c.border}`, borderRadius: 10,
            padding: "10px 14px", background: "#fff",
          }}>
            <i className="ph ph-magnifying-glass" style={{ fontSize: 15, color: c.fg3 }} />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar"
              style={{
                flex: 1, border: 0, outline: "none", fontFamily: "Montserrat, sans-serif",
                fontSize: 14, color: c.fg1, background: "transparent",
              }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 12px 16px" }}>
          {items.map((item, i) => {
            const label = item.name;
            const isSelected = label === selected;
            return (
              <div key={i} onClick={() => setSelected(label)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 12px", borderRadius: 10, cursor: "pointer",
                background: isSelected ? c.primaryLightest : "transparent",
              }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f5f7fb"; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {tab === "fila" ? (
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                  ) : (
                    <span style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: c.primaryLightest, color: c.primary,
                      fontSize: 10, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{item.initials}</span>
                  )}
                  <span style={{ fontSize: 14, fontWeight: isSelected ? 600 : 500, color: c.fg1 }}>{label}</span>
                </div>
                <span style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: `2px solid ${isSelected ? c.primary : c.border}`,
                  background: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isSelected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.primary }} />}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 24px", borderTop: `1px solid ${c.border}`,
          display: "flex", justifyContent: "space-between", gap: 8,
        }}>
          <button onClick={onClose} style={{
            padding: "0 18px", height: 40, borderRadius: 10,
            border: `1px solid ${c.border}`, background: "#fff",
            color: c.fg1, fontWeight: 600, cursor: "pointer",
            fontFamily: "Montserrat, sans-serif", fontSize: 13,
          }}>Cancelar</button>
          <button onClick={() => onConfirm(selected)} style={{
            padding: "0 22px", height: 40, borderRadius: 10, border: 0,
            background: c.primary, color: "#fff", fontWeight: 600, cursor: "pointer",
            fontFamily: "Montserrat, sans-serif", fontSize: 13,
            display: "inline-flex", alignItems: "center", gap: 8,
            boxShadow: "0 2px 6px rgba(146,64,255,0.30)",
          }}>
            <i className="ph ph-list-numbers" style={{ fontSize: 14 }} />
            Alterar fila de atendimento
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MarcadoresPopover — popover to apply/remove conversation markers
// ─────────────────────────────────────────────
const AVAILABLE_MARKERS = [
  { label: "Qa teste Marcador", color: "#dd2e77" },
  { label: "QA 2", color: "#dd2e77" },
  { label: "Cliente irá pagar", color: "#dd2e77" },
  { label: "Teste", color: "#dd2e77" },
  { label: "Clientes novos", color: "#dd2e77" },
  { label: "Pagamento", color: "#dd2e77" },
  { label: "Cliente VIP", color: "#9240FF" },
  { label: "Urgente", color: "#f54336" },
  { label: "Comercial", color: "#37B8FB" },
  { label: "Pendência", color: "#f99f18" },
];

const MarcadoresPopover = ({ pos, applied, onClose, onToggle }) => {
  const c = window.CCM.c;
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    const h = (e) => { if (!e.target.closest("[data-marcadores-pop]")) onClose(); };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h); };
  }, [onClose]);

  const isApplied = (m) => applied.some(x => x.label === m.label);
  const available = AVAILABLE_MARKERS.filter(m => !isApplied(m) && (!search || m.label.toLowerCase().includes(search.toLowerCase())));

  // Clamp dentro da viewport: nunca passa de 12px da borda direita/esquerda;
  // se não couber abaixo, sobe (top → bottom anchor).
  const POP_W = 360;
  const POP_H_MAX = 480;
  const MARGIN = 12;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const left = Math.max(MARGIN, Math.min(pos.left, vw - POP_W - MARGIN));
  const fitsBelow = pos.top + POP_H_MAX <= vh - MARGIN;
  const topStyle = fitsBelow ? { top: pos.top } : { top: Math.max(MARGIN, vh - POP_H_MAX - MARGIN) };

  return ReactDOM.createPortal(
    <div data-marcadores-pop="1" style={{
      position: "fixed", ...topStyle, left,
      width: POP_W, zIndex: 10000,
      background: "#fff",
      border: `1px solid ${c.border}`, borderRadius: 12,
      boxShadow: "0 12px 32px rgba(40,41,61,0.20)",
      padding: 16,
      fontFamily: "Montserrat, sans-serif",
      maxHeight: POP_H_MAX, overflowY: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: c.fg1 }}>Marcador de conversa</span>
        <button onClick={onClose} style={{
          width: 26, height: 26, borderRadius: 6, border: 0,
          background: "transparent", color: c.fg2, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><i className="ph ph-x" style={{ fontSize: 14 }} /></button>
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        border: `1px solid ${c.border}`, borderRadius: 10,
        padding: "8px 12px", background: "#fff", marginBottom: 12,
      }}>
        <i className="ph ph-magnifying-glass" style={{ fontSize: 13, color: c.fg3 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar marcador"
          style={{ flex: 1, border: 0, outline: "none", fontFamily: "Montserrat, sans-serif", fontSize: 13, color: c.fg1, background: "transparent" }}
        />
      </div>

      {applied.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: c.fg2, marginBottom: 8 }}>Aplicados</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {applied.map(m => (
              <span key={m.label} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: m.color + "14", color: m.color,
                fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999,
              }}>
                {m.label}
                <i className="ph ph-x" onClick={() => onToggle(m)}
                  style={{ fontSize: 10, cursor: "pointer", opacity: 0.7 }} />
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: c.fg2, marginBottom: 8 }}>Disponíveis</div>
        {available.map(m => (
          <div key={m.label} onClick={() => onToggle(m)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 4px", cursor: "pointer", borderRadius: 6,
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#f5f7fb"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <span style={{
              width: 16, height: 16, borderRadius: 4,
              border: `1.5px solid ${c.border}`, background: "#fff",
            }} />
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color }} />
            <span style={{ fontSize: 13, color: c.fg1 }}>{m.label}</span>
          </div>
        ))}
        {available.length === 0 && (
          <div style={{ padding: "12px 4px", fontSize: 12, color: c.fg3, textAlign: "center" }}>
            Nenhum marcador disponível
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// ─────────────────────────────────────────────
// ContatoSidePanel — contact info side panel (half / full screen)
// ─────────────────────────────────────────────
const ContatoSidePanel = ({ contact, atendimento, expanded, onToggleExpand, onClose }) => {
  const c = window.CCM.c;

  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  // Mock data for the panel
  const horarios = [0,0,0,0,0,0,0,0,0,0,3,0,19,23,0,0,2,5,0,0,0,0,0,0]; // 24h chart
  const maxH = Math.max(...horarios, 1);

  const canais = [
    { name: "WhatsApp",     icon: "ph-whatsapp-logo",  pct: 93.33 },
    { name: "RCS",          icon: "ph-chat-dots",      pct: 6.67 },
    { name: "SMS",          icon: "ph-device-mobile",  pct: 0 },
    { name: "WhatsApp Web", icon: "ph-monitor",        pct: 0 },
    { name: "E-mail",       icon: "ph-envelope",       pct: 0 },
    { name: "Torpedo",      icon: "ph-paper-plane-tilt", pct: 0 },
  ];

  const lastCampanhas = [
    { date: "14/04/2026 às 11:56" },
    { date: "14/04/2026 às 11:54" },
    { date: "14/04/2026 às 11:52" },
  ];

  const lastResumos = [
    { date: "23/01/2026", text: 'Resumo: Um usuário tentou contato fora do horário de atendimento, cumprimentando e se despedindo. Outro usuário respondeu com "opa". {{EOS}}' },
    { date: "23/01/2026", text: "Resumo: Uma conversa breve com cumprimentos e confirmações entre Sebastien, um número telefônico e Produto teste 1. {{EOS}}" },
    { date: "23/01/2026", text: "Resumo: Sebastien cumprimentou várias vezes, desejando um ótimo dia a quem recebia a mensagem. {{EOS}}" },
  ];

  const panelStyle = expanded
    ? { position: "fixed", inset: 0, width: "100%", height: "100vh" }
    : { position: "fixed", top: 0, right: 0, bottom: 0, width: "min(680px, 50vw)" };

  return (
    <div style={{
      ...panelStyle,
      zIndex: 4500,
      background: "#fff",
      boxShadow: "-8px 0 32px rgba(40,41,61,0.18)",
      display: "flex", flexDirection: "column",
      fontFamily: "Montserrat, sans-serif",
      animation: "ccmSlideIn 220ms ease",
    }}>
      {/* Header */}
      <div style={{
        height: 60, padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${c.border}`, flexShrink: 0, background: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <CCMTooltip label={expanded ? "Recolher" : "Expandir"}>
            <button onClick={onToggleExpand} aria-label={expanded ? "Recolher" : "Expandir"} style={{
              width: 32, height: 32, borderRadius: 8, border: 0,
              background: "transparent", color: c.fg2, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = c.borderSoft; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            ><i className={`ph ${expanded ? "ph-arrows-in-simple" : "ph-arrows-out-simple"}`} style={{ fontSize: 16 }} /></button>
          </CCMTooltip>
          <span style={{
            width: 32, height: 32, borderRadius: "50%",
            background: contact.bg, color: contact.fg,
            fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{contact.initials}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: c.fg1 }}>{contact.name}</span>
        </div>
        <button onClick={onClose} style={{
          width: 32, height: 32, borderRadius: 8, border: 0,
          background: "transparent", color: c.fg2, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><i className="ph ph-x" style={{ fontSize: 18 }} /></button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", background: "#fafbfd" }}>
        {/* Informações sobre o contato */}
        <Section title="Informações sobre o contato" icon="ph-list-bullets">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
            <Field icon="ph-calendar-blank" label="Criado em"        value="14 de julho de 2025 às 12:30" />
            <Field icon="ph-user"           label="Criado por"        value="Sistema" />
            <Field icon="ph-user"           label="Criado através de" value="Campanha" />
            <Field icon="ph-paper-plane-tilt" label="Campanhas"       value="5 campanhas" />
            <Field icon="ph-identification-card" label="Nome Completo" value={contact.name} valueWithDot />
            <Field icon="ph-phone"          label="Telefone"          value={contact.phone || "(11) 97652-0553"} valueWithDot />
          </div>
        </Section>

        {/* Resumo + Horarios em grid 2 col */}
        <div style={{ display: "grid", gridTemplateColumns: expanded ? "1fr 1fr" : "1fr", gap: 16, marginTop: 16 }}>
          <Section title="Resumo de todas as conversas" icon="ph-note">
            <p style={{ margin: 0, fontSize: 12, color: c.fg2, lineHeight: 1.6 }}>
              Resumo: A conversa envolveu saudações e confirmações entre {contact.name}, números telefônicos e produtos de teste, com respostas positivas e interações breves. {"{{EOS}}"}
            </p>
          </Section>
          <Section title="Horários favoritos" icon="ph-clock">
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 110, marginTop: 6 }}>
              {horarios.map((v, i) => (
                <CCMTooltip key={i} label={`${i}h: ${v}`}>
                  <div aria-label={`${i}h: ${v}`} style={{
                    flex: 1, height: `${(v / maxH) * 100}%`, minHeight: 2,
                    background: v > 0 ? "#3a8fb9" : "#e5e9f0",
                    borderRadius: "3px 3px 0 0",
                  }} />
                </CCMTooltip>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: c.fg3 }}>
              {[0,2,4,6,8,10,12,14,16,18,20,22].map(h => <span key={h}>{h}h</span>)}
            </div>
          </Section>
        </div>

        {/* Respostas + Cliques */}
        <div style={{ display: "grid", gridTemplateColumns: expanded ? "1fr 1fr" : "1fr", gap: 16, marginTop: 16 }}>
          <Section title="Respostas" icon="ph-arrow-bend-up-left">
            <DonutLegend value={2} total={6} label="Respostas" itens={[
              { label: "Responderam", value: 2, pct: 33.33, color: "#9c8cf2" },
              { label: "Não Responderam", value: 4, pct: 66.67, color: "#e0d6ff" },
            ]} />
            <div style={{ marginTop: 12, fontSize: 11, color: c.fg2 }}>
              <i className="ph ph-clock" style={{ marginRight: 4 }} /> Tempo médio de resposta: <b style={{ color: c.fg1 }}>aproximadamente 1 min</b>
            </div>
          </Section>
          <Section title="Cliques no link" icon="ph-cursor-click">
            <DonutLegend value={0} total={0} label="Links" itens={[
              { label: "Clicou", value: 0, pct: 0, color: "#cfe9d6" },
              { label: "Não clicou", value: 0, pct: 0, color: "#e0d6ff" },
            ]} />
            <div style={{ marginTop: 12, fontSize: 11, color: c.fg2 }}>
              <i className="ph ph-clock" style={{ marginRight: 4 }} /> Tempo médio para acessar o link: <b style={{ color: c.fg1 }}>imediato</b>
            </div>
          </Section>
        </div>

        {/* Canal favorito + Torpedo + Campanhas */}
        <div style={{ display: "grid", gridTemplateColumns: expanded ? "1fr 1fr 1fr" : "1fr", gap: 16, marginTop: 16 }}>
          <Section title="Canal favorito" icon="ph-broadcast">
            {canais.map((ch, i) => (
              <div key={ch.name} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "7px 10px", borderRadius: 8,
                background: "#e8f3ff", marginBottom: 6,
              }}>
                <span style={{ fontSize: 11, color: c.fg2, fontWeight: 700, width: 14 }}>{i + 1}°</span>
                <i className={`ph ${ch.icon}`} style={{ fontSize: 14, color: c.fg2 }} />
                <span style={{ flex: 1, fontSize: 12, color: c.fg1 }}>{ch.name}</span>
                <span style={{ fontSize: 11, color: c.fg2 }}>{ch.pct}%</span>
              </div>
            ))}
          </Section>
          <Section title="Torpedo" icon="ph-paper-plane-tilt">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 42, fontWeight: 700, color: c.fg1 }}>0</div>
              <div style={{ fontSize: 11, color: c.fg2 }}>segundos</div>
              <div style={{ fontSize: 10, color: c.fg3, marginTop: 4, textAlign: "center" }}>Média do tempo de escuta das chamadas</div>
            </div>
          </Section>
          <Section title="Últimas campanhas" icon="ph-note">
            {lastCampanhas.map((row, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 0", borderBottom: i < lastCampanhas.length - 1 ? `1px solid ${c.borderSoft}` : "none",
                fontSize: 11, color: c.fg1,
              }}>
                <span>{row.date}</span>
                <i className="ph ph-eye" style={{ fontSize: 14, color: c.fg3, cursor: "pointer" }} />
              </div>
            ))}
          </Section>
        </div>

        {/* Resumo das ultimas 3 conversas */}
        <Section title="Resumo das últimas 3 conversas" icon="ph-note" style={{ marginTop: 16 }}>
          {lastResumos.map((r, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "120px 1fr 28px",
              gap: 14, padding: "12px 0",
              borderBottom: i < lastResumos.length - 1 ? `1px solid ${c.borderSoft}` : "none",
              fontSize: 11, color: c.fg2,
            }}>
              <span style={{ color: c.fg1, fontWeight: 600 }}>{r.date}</span>
              <span style={{ lineHeight: 1.5 }}>{r.text}</span>
              <i className="ph ph-eye" style={{ fontSize: 14, color: c.fg3, cursor: "pointer" }} />
            </div>
          ))}
        </Section>
      </div>
    </div>
  );
};

const Section = ({ title, icon, style = {}, children }) => {
  const c = window.CCM.c;
  return (
    <div style={{
      background: "#fff", borderRadius: 12, padding: 16,
      border: `1px solid ${c.borderSoft}`,
      boxShadow: "0 1px 3px rgba(40,41,61,0.04)",
      ...style,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <i className={`ph ${icon}`} style={{ fontSize: 15, color: c.fg2 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: c.fg1 }}>{title}</span>
      </div>
      {children}
    </div>
  );
};

const Field = ({ icon, label, value, valueWithDot }) => {
  const c = window.CCM.c;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: c.fg2, marginBottom: 4 }}>
        <i className={`ph ${icon}`} style={{ fontSize: 12 }} />
        <span style={{ fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 13, color: valueWithDot ? "#f99f18" : c.fg1, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}>
        {value}
        {valueWithDot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f99f18" }} />}
      </div>
    </div>
  );
};

const DonutLegend = ({ value, total, label, itens }) => {
  const c = window.CCM.c;
  // Build SVG donut
  const cx = 50, cy = 50, r = 38, stroke = 14;
  let acc = 0;
  const arcs = itens.map(it => {
    const start = acc;
    const sweep = (it.pct / 100) * Math.PI * 2;
    acc += sweep;
    const x1 = cx + r * Math.sin(start);
    const y1 = cy - r * Math.cos(start);
    const x2 = cx + r * Math.sin(start + sweep);
    const y2 = cy - r * Math.cos(start + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    if (sweep === 0) return null;
    return <path key={it.label} d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`} stroke={it.color} strokeWidth={stroke} fill="none" />;
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} stroke="#eef0f4" strokeWidth={stroke} fill="none" />
        {arcs}
        <text x="50" y="48" textAnchor="middle" fontFamily="Montserrat" fontSize="18" fontWeight="700" fill={c.fg1}>{value}</text>
        <text x="50" y="62" textAnchor="middle" fontFamily="Montserrat" fontSize="9" fill={c.fg2}>{label}</text>
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        {itens.map(it => (
          <div key={it.label} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 8px", borderRadius: 6, background: it.color + "33",
            fontSize: 11, color: c.fg1,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: it.color }} />
            <span style={{ flex: 1 }}>{it.label}</span>
            <span style={{ fontWeight: 600 }}>{it.value} ({it.pct.toFixed(2)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// TrazerConversaModal — operação inversa do LinkConversaModal.
// ---------------------------------------------------------------------
// Em um atendimento, permite buscar UMA conversa que está em outro
// atendimento e movê-la pra cá. Busca multi-atributo: ID da conversa,
// ID do atendimento de origem, contato, atendente.
//
// DE-PARA Angular: TicketImportConversationModalComponent
//   PATCH /conversas/:convId { atendimento_id: currentAtendimentoId }
// ─────────────────────────────────────────────────────────────────────────
const TRAZER_FILTERS = [
  { id: "conversa",    label: "Conversa",         icon: "ph-chats-circle" },
  { id: "atendimento", label: "Atendimento",      icon: "ph-tag" },
  { id: "contato",     label: "Dados do contato", icon: "ph-address-book" },
  { id: "atendente",   label: "Atendente",        icon: "ph-user" },
];

const TrazerConversaModal = ({ currentAtendimentoId, onClose, onBrought, onError }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] = React.useState([]);
  // Preview read-only — abre o atendimento de origem já na conversa procurada,
  // sem botões de ação pra evitar loop infinito.
  const [preview, setPreview] = React.useState(null); // { atendimentoId, convId }

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const norm = (s) => (s || "").toLowerCase();
  const digits = (s) => (s || "").replace(/\D+/g, "");
  const q = query.trim();
  const qn = norm(q);
  const qd = digits(q);
  const has = (f) => filters.length === 0 || filters.includes(f);

  // Acha conversas em OUTROS atendimentos que casem com a busca.
  const results = React.useMemo(() => {
    if (!q) return [];
    const out = [];
    for (const at of D.atendimentos || []) {
      if (at.id === currentAtendimentoId) continue;
      const contact = at.contatos?.[0];
      if (!contact) continue;
      for (const cv of at.conversas || []) {
        let match = false;
        if (has("conversa") && qn && norm(String(cv.id)).includes(qn)) match = true;
        if (has("atendimento") && qd && at.id.includes(qd)) match = true;
        if (has("contato")) {
          if (qn && norm(contact.name).includes(qn)) match = true;
          if (qn && norm(contact.email).includes(qn)) match = true;
          if (qd && digits(contact.phone).includes(qd)) match = true;
          if (qd && digits(contact.cpf).includes(qd)) match = true;
        }
        if (has("atendente")) {
          if ((at.atendentes || []).some(a => qn && norm(a.name).includes(qn))) match = true;
        }
        if (match) out.push({ conv: cv, atendimento: at, contact });
        if (out.length >= 30) break;
      }
      if (out.length >= 30) break;
    }
    return out;
  }, [q, qn, qd, filters, D.atendimentos, currentAtendimentoId]);

  const toggleFilter = (fid) => {
    setFilters(prev => prev.includes(fid) ? prev.filter(x => x !== fid) : [...prev, fid]);
  };

  return ReactDOM.createPortal(
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(40,41,61,0.5)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "60px 16px", overflowY: "auto", zIndex: 9999,
      fontFamily: "Montserrat, sans-serif",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
        boxShadow: "0 20px 50px rgba(40,41,61,0.30)",
        display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 120px)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "16px 20px", borderBottom: `1px solid ${c.border}`,
        }}>
          <i className="ph ph-tray-arrow-down" style={{ fontSize: 18, color: c.primary }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: c.fg1, flex: 1 }}>
            Trazer conversa para <span style={{ color: c.primary }}>#{currentAtendimentoId}</span>
          </span>
          <CCMTooltip label="Fechar">
            <button onClick={onClose} aria-label="Fechar" style={{
              width: 28, height: 28, border: 0, background: "transparent",
              cursor: "pointer", color: c.fg2, borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><i className="ph ph-x" style={{ fontSize: 14 }} /></button>
          </CCMTooltip>
        </div>

        {/* Body */}
        <div style={{ padding: 20, flex: 1, overflowY: "auto", minHeight: 0 }}>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: c.fg2, lineHeight: 1.5 }}>
            Busque a conversa que deseja trazer pra este atendimento. A conversa
            será <strong>desvinculada</strong> do atendimento de origem.
          </p>

          {/* Search input */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            border: `1.5px solid ${filters.length > 0 ? c.primary : c.border}`,
            borderRadius: 12, padding: "11px 14px", marginBottom: 14,
            transition: "border-color 150ms ease",
          }}>
            <i className="ph ph-magnifying-glass" style={{ fontSize: 16, color: c.fg3 }} />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar conversa por ID, contato, atendente…"
              style={{
                flex: 1, border: 0, outline: "none",
                fontFamily: "Montserrat, sans-serif",
                fontSize: 13, color: c.fg1, background: "transparent",
              }}
            />
            {query && (
              <i className="ph ph-x"
                onClick={() => setQuery("")}
                style={{ fontSize: 14, color: c.fg3, cursor: "pointer" }} />
            )}
          </div>

          {/* Filter chips */}
          <div style={{ fontSize: 11, color: c.fg2, marginBottom: 6 }}>
            Buscar em (deixe vazio pra buscar em todos os campos):
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {TRAZER_FILTERS.map(f => {
              const active = filters.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFilter(f.id)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    height: 28, padding: "0 12px", borderRadius: 999,
                    border: `1px solid ${active ? c.primary : c.border}`,
                    background: active ? c.primaryLightest : "#fff",
                    color: active ? c.primary : c.fg2,
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    fontFamily: "Montserrat, sans-serif",
                  }}
                >
                  <i className={`ph ${f.icon}`} style={{ fontSize: 13 }} />
                  {f.label}
                  {active && <i className="ph ph-check" style={{ fontSize: 11, marginLeft: 2 }} />}
                </button>
              );
            })}
          </div>

          {/* Results */}
          {!q && (
            <div style={{ padding: "20px 12px", textAlign: "center", color: c.fg3, fontSize: 12, lineHeight: 1.5 }}>
              Digite acima pra começar a buscar conversas.
            </div>
          )}
          {q && results.length === 0 && (
            <div style={{ padding: "20px 12px", textAlign: "center", color: c.fg3, fontSize: 12, lineHeight: 1.5 }}>
              Nenhuma conversa encontrada para <strong style={{ color: c.fg2 }}>"{q}"</strong>.
            </div>
          )}
          {q && results.length > 0 && (
            <React.Fragment>
              <div style={{ fontSize: 11, color: c.fg2, marginBottom: 8, fontWeight: 600 }}>
                {results.length} {results.length === 1 ? "conversa encontrada" : "conversas encontradas"}
              </div>
              {results.map(({ conv, atendimento, contact }) => (
                <div key={`${atendimento.id}-${conv.id}`} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 10,
                  background: "#fff", border: `1px solid ${c.border}`,
                  marginBottom: 6,
                }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                    background: contact.bg, color: contact.fg,
                    fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{contact.initials}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: c.fg1, display: "flex", gap: 8, alignItems: "center" }}>
                      Conversa {conv.id}
                      <span style={{
                        background: c.primaryLightest, color: c.primary,
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                      }}>em #{atendimento.id}</span>
                    </div>
                    <div style={{ fontSize: 11, color: c.fg2, marginTop: 2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {contact.name} · {conv.fila || atendimento.tipo || "—"}
                    </div>
                  </div>
                  <CCMTooltip label="Visualizar conversa (somente leitura)">
                    <button
                      type="button"
                      onClick={() => setPreview({ atendimentoId: atendimento.id, convId: conv.id })}
                      aria-label="Visualizar conversa"
                      style={{
                        width: 30, height: 30, border: `1px solid ${c.border}`,
                        background: "#fff", color: c.fg2, borderRadius: 8,
                        cursor: "pointer", flexShrink: 0,
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "Montserrat, sans-serif",
                        transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = c.primaryLightest; e.currentTarget.style.color = c.primary; e.currentTarget.style.borderColor = c.primary; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = c.fg2; e.currentTarget.style.borderColor = c.border; }}
                    >
                      <i className="ph ph-eye" style={{ fontSize: 14 }} />
                    </button>
                  </CCMTooltip>
                  <button
                    type="button"
                    onClick={() => onBrought?.(conv.id, atendimento.id)}
                    style={{
                      border: 0, background: c.primary, color: "#fff",
                      padding: "0 12px", height: 30, borderRadius: 8,
                      fontFamily: "Montserrat, sans-serif",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: 4,
                    }}
                  >
                    Trazer <i className="ph ph-arrow-down" style={{ fontSize: 12 }} />
                  </button>
                </div>
              ))}
            </React.Fragment>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 20px", borderTop: `1px solid ${c.border}`,
          display: "flex", justifyContent: "flex-end", gap: 8,
        }}>
          <button onClick={onClose} style={{
            padding: "0 18px", height: 36, borderRadius: 10, border: `1px solid ${c.border}`,
            background: "#fff", color: c.fg1, fontWeight: 600, cursor: "pointer",
            fontFamily: "Montserrat, sans-serif", fontSize: 13,
          }}>Cancelar</button>
        </div>
      </div>

      {preview && (
        <AtendimentoPreview
          atendimentoId={preview.atendimentoId}
          initialConvId={preview.convId}
          onClose={() => setPreview(null)}
        />
      )}
    </div>,
    document.body
  );
};

// ─────────────────────────────────────────────────────────────────────────
// AtendimentoPreview — leitor read-only de um atendimento
// ---------------------------------------------------------------------
// Usado pelos modais Link/Trazer pra dar uma olhada num atendimento ANTES
// de vincular/trazer a conversa, sem permitir nenhuma ação que cause
// looping infinito (sem vincular, sem transferir, sem nova conversa,
// sem marcadores, sem composer). Só mostra:
//   • Lista de conversas do atendimento (sidebar)
//   • Thread da conversa selecionada (read-only)
//   • Header com #ID e badge "Somente leitura"
//
// DE-PARA Angular: ChatPreviewReadonlyComponent <app-chat-preview-readonly>
//   GET /atendimentos/:id (mesmo endpoint do detalhe normal, mas todos
//   os botões de ação são suprimidos via [readonly]="true" inputs).
// ─────────────────────────────────────────────────────────────────────────
const AtendimentoPreview = ({ atendimentoId, initialConvId, onClose }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const a = D.atendimentos.find(x => x.id === atendimentoId);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const conversas = (a && a.conversas) || [];
  const initialIdx = React.useMemo(() => {
    if (initialConvId) {
      const idx = conversas.findIndex(cv => String(cv.id) === String(initialConvId));
      if (idx >= 0) return idx;
    }
    return 0;
  }, [initialConvId, conversas]);
  const [openIdx, setOpenIdx] = React.useState(initialIdx);
  React.useEffect(() => { setOpenIdx(initialIdx); }, [initialIdx]);

  if (!a) return null;
  const openConv = conversas[openIdx];
  const contact = a.contatos?.[0];
  const attendant = a.atendentes?.[0] || D.attendant;

  return ReactDOM.createPortal(
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 10003,
      background: "rgba(40,41,61,0.55)",
      display: "flex", alignItems: "stretch", justifyContent: "center",
      padding: "32px 16px",
      fontFamily: "Montserrat, sans-serif",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 16, width: "100%",
        maxWidth: 1100,
        boxShadow: "0 20px 50px rgba(40,41,61,0.40)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          height: 56, padding: "0 20px",
          display: "flex", alignItems: "center", gap: 10,
          borderBottom: `1px solid ${c.border}`,
          background: "#fff", flexShrink: 0,
        }}>
          <i className="ph ph-eye" style={{ fontSize: 18, color: c.primary }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: c.fg1 }}>
            Atendimento <span style={{ color: c.primary }}>#{atendimentoId}</span>
          </span>
          {a.tipo && (
            <span style={{ fontSize: 12, color: c.fg2 }}>· {a.tipo}</span>
          )}
          <span style={{
            background: c.borderSoft, color: c.fg2,
            fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
            textTransform: "uppercase", letterSpacing: "0.04em",
            marginLeft: 4,
          }}>Somente leitura</span>
          <div style={{ flex: 1 }} />
          <CCMTooltip label="Fechar">
            <button onClick={onClose} aria-label="Fechar preview" style={{
              width: 32, height: 32, border: 0, background: "transparent",
              cursor: "pointer", color: c.fg2, borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><i className="ph ph-x" style={{ fontSize: 16 }} /></button>
          </CCMTooltip>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
          {/* Sidebar — lista de conversas, sem botões de ação */}
          <div style={{
            width: 280, flexShrink: 0,
            borderRight: `1px solid ${c.border}`,
            overflowY: "auto", background: c.canvas,
          }}>
            <div style={{
              padding: "12px 16px 8px", fontSize: 10, fontWeight: 700, color: c.fg3,
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              Conversas ({conversas.length})
            </div>
            {conversas.length === 0 && (
              <div style={{ padding: "12px 16px", fontSize: 12, color: c.fg3 }}>
                Nenhuma conversa.
              </div>
            )}
            {conversas.map((cv, idx) => {
              const selected = idx === openIdx;
              return (
                <button
                  key={cv.id}
                  type="button"
                  onClick={() => setOpenIdx(idx)}
                  style={{
                    display: "flex", flexDirection: "column", gap: 4,
                    width: "100%", textAlign: "left", border: 0,
                    padding: "10px 16px", cursor: "pointer",
                    background: selected ? c.primaryLightest : "transparent",
                    borderLeft: `3px solid ${selected ? c.primary : "transparent"}`,
                    fontFamily: "Montserrat, sans-serif",
                  }}
                  onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "#fff"; }}
                  onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: selected ? c.primary : c.fg1 }}>
                    <i className="ph ph-chats-circle" style={{ fontSize: 13, opacity: 0.7 }} />
                    {cv.id}
                  </span>
                  <span style={{ fontSize: 11, color: c.fg2,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {cv.fila || "—"} · {cv.status || "—"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Thread */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {/* Sub-header — só info, sem ações */}
            <div style={{
              height: 56, padding: "0 20px",
              display: "flex", alignItems: "center", gap: 8,
              borderBottom: `1px solid ${c.border}`, background: "#fff", flexShrink: 0,
            }}>
              <i className="ph ph-chats-circle" style={{ fontSize: 16, color: c.fg2 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: c.fg1 }}>
                {openConv?.id || "—"}
              </span>
              {openConv?.status && (
                <span style={{
                  background: c.borderSoft, color: c.fg2,
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                }}>{openConv.status}</span>
              )}
              {contact && (
                <span style={{ fontSize: 12, color: c.fg2, marginLeft: "auto" }}>
                  <i className="ph ph-user" style={{ fontSize: 12, marginRight: 4 }} />
                  {contact.name}
                </span>
              )}
            </div>

            {/* Mensagens — reusa MessageBubble/DayChip do ConversaPanel */}
            <div style={{
              flex: 1, overflowY: "auto",
              padding: "20px 32px",
              backgroundImage: "url('design-system/assets/backgrounds/bg-chat.svg')",
              backgroundColor: "#FAF6EE",
              backgroundRepeat: "repeat",
              display: "flex", flexDirection: "column", gap: 14,
            }}>
              {openConv ? (
                <React.Fragment>
                  {window.DayChip && <window.DayChip text="Hoje" />}
                  {(openConv.messages || []).map(m => (
                    window.MessageBubble
                      ? <window.MessageBubble key={m.id} msg={m} contact={contact} attendant={attendant} />
                      : <div key={m.id} style={{ fontSize: 12, color: c.fg2 }}>{m.text}</div>
                  ))}
                  {(!openConv.messages || openConv.messages.length === 0) && (
                    <div style={{ textAlign: "center", color: c.fg3, fontSize: 12, marginTop: 40 }}>
                      Nenhuma mensagem nesta conversa.
                    </div>
                  )}
                </React.Fragment>
              ) : (
                <div style={{ textAlign: "center", color: c.fg3, fontSize: 12, marginTop: 40 }}>
                  Selecione uma conversa na barra lateral.
                </div>
              )}
            </div>

            {/* Footer read-only (substitui o Composer) */}
            <div style={{
              padding: "12px 20px", display: "flex", alignItems: "center", gap: 10,
              background: c.canvas, borderTop: `1px solid ${c.border}`,
              color: c.fg2, fontSize: 12, flexShrink: 0,
            }}>
              <i className="ph ph-lock-key" style={{ fontSize: 14, color: c.primary }} />
              <span>
                Visualização somente leitura — sem opções de transferir, vincular, marcar ou enviar.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

Object.assign(window, { AtendimentoDetail, TrazerConversaModal, AtendimentoPreview });
