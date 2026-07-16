// ConversaPanel.jsx — right side of detail: the open conversation thread
// =====================================================================
// DE-PARA REACT → ANGULAR  ·  ConversaPanel.jsx
// ---------------------------------------------------------------------
// Painel direito: thread da conversa + composer multicanal + ações.
// Módulos Angular: @modules/chat-one-to-one (orquestração) + @modules/chat (motor).
//
//   ConversaPanel       → ChatComponent              <app-chat>
//                         @modules/chat-one-to-one/components/chat/
//                         (wrapper de layout = ChatOneToOneContainerComponent
//                          <app-chat-one-to-one-container>)
//   (sub-header da conv) → ChatOneToOneHeaderComponent <app-chat-one-to-one-header>
//                         @modules/chat/components/chat-headers/chat-one-to-one-header/
//   (área da thread)     → ChatCoreComponent          <app-chat-core>
//                         @modules/chat/components/chat-core/
//   MessageBubble       → ChatMessageComponent       <app-chat-message> que delega a
//                         MessageTypeRouterComponent <app-message-type-router> →
//                         TextMessage/Image/Audio/Document/Video/Html/WhatsApp-message
//                         (@modules/chat/components/chat-message/*). Rodapé = <app-message-footer>
//   Composer            → ChatInputRouterComponent   <app-chat-input-router>
//                         @modules/chat/components/chat-input-router/
//     Abas de canal → um componente por canal:
//       WhatsApp     → <app-chat-input-whatsapp>
//       WhatsApp Web → <app-chat-input-whatsapp-web>
//       SMS          → <app-chat-input-sms>
//       E-mail       → <app-chat-input-email>
//       RCS          → <app-chat-input-rcs>
//       Torpedo (voz)→ <app-chat-input-voicemail>      (Torpedo de voz = voicemail)
//       Nota interna → <app-chat-input-note>
//   MarcadoresChipStrip /→ ChatAttendanceMarkersSelectionComponent
//   (popover marcadores)   <app-chat-attendance-markers-selection> +
//                          ChatMarkersModalComponent <app-chat-markers-modal>
//                          (@modules/chat/...). Chips visuais = .ccm-chips
//   TransferModal /      → UserAssignmentModalComponent <app-user-assignment-modal>
//   QueuePopover           e TicketAssignmentModalComponent <app-ticket-assignment-modal>
//   FinalizarConversaModal → fluxo "encerrar conversa" (MatDialog de confirmação)
//   ContactInfoPopover   → metadados do contato (chat-metadata-popover em popover.scss)
//   DayChip/ToolbarBtn   → helpers visuais (sem 1:1; chip de data + botão-ícone)
//
// TOOLBAR CONDICIONAL (CEN-144/145):
//   Os botões vincular/contato/finalizar são ocultados quando tab="Contato"|"Histórico".
//   Apenas o título e o botão expandir ficam visíveis nessas abas.
//   No Angular: *ngIf no ChatOneToOneHeaderComponent baseado na aba ativa.
//
// BOTÃO "ALTERAR FILA" REMOVIDO DESTA TOOLBAR:
//   O botão ph-clipboard-text ("Alterar fila / atendente") foi movido para a
//   barra do atendimento (AtendimentoDetail.jsx / ChatTicketsDashboardComponent).
//
// Doc: de-para/02-componentes.md
// =====================================================================
const ConversaPanel = ({
  conv, contact, attendant, atendimentoId, onTransfer,
  expanded, onToggleExpand, tab,
  onOpenContact, onChangeQueue,
  appliedMarkers = [], onOpenMarcadores,
  convStatus, onFinalizeConversa,
  onShowSnack, // (message, type:"success"|"error") => void — vem de AtendimentoDetail
}) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const [messages, setMessages] = React.useState(conv.messages);
  const [text, setText] = React.useState("");
  const [channel, setChannel] = React.useState(conv.channel === "email" ? "E-mail" : "WhatsApp");
  const [confirmFinalize, setConfirmFinalize] = React.useState(false);
  // Modal "Vincular conversa a outro atendimento" (substitui o antigo entry-point
  // de marcadores no ícone-tag — marcadores seguem acessíveis via chip strip).
  const [linkModalOpen, setLinkModalOpen] = React.useState(false);
  const effectiveStatus = convStatus || conv.status;
  const isFinalized = effectiveStatus === "Finalizada" || effectiveStatus === "Finalizado";

  // Helper: dispara o popover unificado de marcadores (mesmo de todos
  // os pontos de entrada). Recebe um elemento DOM como âncora.
  const openMarcadores = (el) => {
    if (!onOpenMarcadores || !el) return;
    onOpenMarcadores(el.getBoundingClientRect());
  };
  const scrollRef = React.useRef(null);

  React.useEffect(() => { setMessages(conv.messages); }, [conv.id]);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const send = () => {
    if (!text.trim()) return;
    setMessages(m => [...m, {
      id: "n"+Date.now(), role: "agent",
      text: text.trim(), channel: channel.toLowerCase().replace(" web",""),
      at: new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }),
      author: attendant.initials || "CA",
    }]);
    setText("");
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
      {/* sub-header bar (conv-level) — title changes based on active tab.
          Altura 56 pra alinhar com a barra de tabs do lado esquerdo. */}
      <div style={{
        height: 56, padding: "0 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${c.border}`, background: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {tab === "Contato" ? (
            <React.Fragment>
              <i className="ph ph-user" style={{ fontSize: 16, color: c.primary }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: c.fg1 }}>Mensagens de {contact.name}</span>
              <span style={{
                background: c.primaryLightest, color: c.primary,
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
              }}>
                {conv.messages.filter(m => m.text).length} mensagens
              </span>
            </React.Fragment>
          ) : tab === "Histórico" ? (
            <React.Fragment>
              <i className="ph ph-clock-counter-clockwise" style={{ fontSize: 16, color: c.primary }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: c.fg1 }}>Histórico completo do atendimento</span>
              <span style={{
                background: c.primaryLightest, color: c.primary,
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
              }}>
                todas as mensagens · todos os canais
              </span>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <i className="ph ph-chats-circle" style={{ fontSize: 16, color: c.fg2 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: c.fg1 }}>{conv.id}</span>
              {/* Chips de marcadores — 2 visíveis + "+N" overflow.
                  Todos os elementos (chips e "+N") abrem o MESMO popover
                  unificado de marcadores. */}
              <MarcadoresChipStrip
                applied={appliedMarkers}
                onOpen={openMarcadores}
              />
            </React.Fragment>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {tab !== "Contato" && tab !== "Histórico" && (
            <React.Fragment>
              <ToolbarBtn
                icon="ph-link-simple"
                onClick={() => setLinkModalOpen(true)}
                title="Vincular conversa a outro atendimento"
              />
              <ToolbarBtn
                icon="ph-user"
                onClick={() => onOpenContact?.(contact)}
                title={`Ver dados do contato${contact?.name ? " — " + contact.name : ""}`}
              />
              <FinalizeBtn
                isFinalized={isFinalized}
                onClick={() => !isFinalized && setConfirmFinalize(true)}
              />
            </React.Fragment>
          )}
          <ToolbarBtn icon={expanded ? "ph-arrows-in" : "ph-arrows-out"} onClick={onToggleExpand} title="Expandir" />
        </div>
      </div>

      {/* thread */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto",
        padding: "20px 32px",
        backgroundImage: "url('design-system/assets/backgrounds/bg-chat.svg')",
        backgroundColor: "#FAF6EE",
        backgroundRepeat: "repeat",
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        <DayChip text="Hoje" />
        {messages.map(m => (
          <MessageBubble key={m.id} msg={m} contact={contact} attendant={attendant} />
        ))}
      </div>

      {/* Composer — escondido em abas read-only (Histórico e Contato) */}
      {(tab === "Histórico" || tab === "Contato") ? (
        <div style={{
          background: "#fff", borderTop: `1px solid ${c.border}`,
          padding: "14px 20px", display: "flex", alignItems: "center", gap: 10,
          color: c.fg2, fontSize: 12,
        }}>
          <i className="ph ph-eye" style={{ fontSize: 16, color: c.primary }} />
          <span>
            {tab === "Histórico"
              ? <>Visualização somente leitura. Para responder, volte para a aba <b style={{ color: c.fg1 }}>Conversas</b>.</>
              : <>Visualização das mensagens deste contato. Para responder, volte para a aba <b style={{ color: c.fg1 }}>Conversas</b>.</>}
          </span>
        </div>
      ) : (
        <Composer text={text} setText={setText} channel={channel} setChannel={setChannel} onSend={send} />
      )}

      {confirmFinalize && (
        <FinalizarConversaModal
          conv={conv}
          onCancel={() => setConfirmFinalize(false)}
          onConfirm={() => {
            onFinalizeConversa?.(conv.id);
            setConfirmFinalize(false);
          }}
        />
      )}

      {linkModalOpen && (
        <LinkConversaModal
          convId={conv.id}
          currentAtendimentoId={atendimentoId}
          onClose={() => setLinkModalOpen(false)}
          onLinked={(targetId) => {
            setLinkModalOpen(false);
            onShowSnack?.(`Conversa ${conv.id} vinculada ao atendimento #${targetId}`, "success");
          }}
          onCreated={(newId) => {
            setLinkModalOpen(false);
            onShowSnack?.(`Conversa ${conv.id} movida para o novo atendimento #${newId}`, "success");
          }}
          onError={(message) => {
            setLinkModalOpen(false);
            onShowSnack?.(message || "Não foi possível vincular a conversa. Tente novamente.", "error");
          }}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// FinalizarConversaModal — confirmação destrutiva
// ─────────────────────────────────────────────
const FinalizarConversaModal = ({ conv, onCancel, onConfirm }) => {
  const c = window.CCM.c;
  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onCancel]);

  return ReactDOM.createPortal(
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 11000,
        background: "rgba(40,41,61,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16,
          width: "min(440px, 92vw)",
          boxShadow: "0 20px 60px rgba(40,41,61,0.30)",
          padding: 24,
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: c.successLight, color: c.successDark,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 14,
        }}>
          <i className="ph-fill ph-check-circle" style={{ fontSize: 24 }} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: c.fg1, marginBottom: 8 }}>
          Finalizar esta conversa?
        </div>
        <div style={{ fontSize: 13, color: c.fg2, lineHeight: 1.5, marginBottom: 22 }}>
          A conversa <b style={{ color: c.fg1 }}>#{conv.id}</b> será encerrada e seu status mudará para <b style={{ color: c.fg1 }}>Finalizada</b>. Você ainda poderá visualizar o histórico, mas não poderá enviar novas mensagens.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              border: `1px solid ${c.border}`, background: "#fff",
              padding: "9px 18px", borderRadius: 10,
              fontSize: 13, fontWeight: 600, color: c.fg1,
              cursor: "pointer", fontFamily: "Montserrat, sans-serif",
            }}
          >Cancelar</button>
          <button
            onClick={onConfirm}
            style={{
              border: 0, background: c.successPure, color: "#fff",
              padding: "9px 20px", borderRadius: 10,
              fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "Montserrat, sans-serif",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            <i className="ph-fill ph-check" style={{ fontSize: 14 }} />
            Sim, finalizar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─────────────────────────────────────────────
// MarcadoresChipStrip — chips compactos com overflow "+N"
// Decisão: 2 chips visíveis, resto vira "+N" cinza. Click em qualquer
// chip ou no "+N" abre o popover unificado. "+N" tem tooltip dark
// com "mais N marcadores aplicados".
// ─────────────────────────────────────────────
const MAX_VISIBLE_CHIPS = 2;

const MarcadoresChipStrip = ({ applied, onOpen }) => {
  const c = window.CCM.c;
  const [overflowHover, setOverflowHover] = React.useState(false);
  const [overflowRect, setOverflowRect] = React.useState(null);
  const overflowRef = React.useRef(null);

  if (!applied || applied.length === 0) {
    // Estado vazio — pílula sutil "+ Marcador" que abre o popover
    return (
      <CCMTooltip label="Adicionar marcador">
        <button
          onClick={(e) => onOpen(e.currentTarget)}
          aria-label="Adicionar marcador"
          style={{
            marginLeft: 4, border: `1px dashed ${c.border}`,
            background: "transparent", color: c.fg3,
            fontSize: 11, fontWeight: 500, padding: "3px 10px",
            borderRadius: 999, cursor: "pointer",
            fontFamily: "Montserrat, sans-serif",
            transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = c.primaryLightest; e.currentTarget.style.color = c.primary; e.currentTarget.style.borderColor = c.primaryLight; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.fg3; e.currentTarget.style.borderColor = c.border; }}
        >
          + Marcador
        </button>
      </CCMTooltip>
    );
  }

  const visible = applied.slice(0, MAX_VISIBLE_CHIPS);
  const hidden = applied.slice(MAX_VISIBLE_CHIPS);

  React.useEffect(() => {
    if (overflowHover && overflowRef.current) {
      const r = overflowRef.current.getBoundingClientRect();
      setOverflowRect({ top: r.bottom + 6, left: r.left + r.width / 2 });
    } else {
      setOverflowRect(null);
    }
  }, [overflowHover]);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 6 }}>
      {visible.map(m => (
        <CCMTooltip key={m.label} label={m.label}>
          <button
            onClick={(e) => onOpen(e.currentTarget)}
            aria-label={m.label}
            style={{
              background: m.color + "14", color: m.color, border: 0,
              fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
              cursor: "pointer", fontFamily: "Montserrat, sans-serif",
              transition: "filter 120ms ease",
              maxWidth: 110, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}
            onMouseEnter={e => e.currentTarget.style.filter = "brightness(0.95)"}
            onMouseLeave={e => e.currentTarget.style.filter = "none"}
          >{m.label}</button>
        </CCMTooltip>
      ))}
      {hidden.length > 0 && (
        <button
          ref={overflowRef}
          onClick={(e) => onOpen(e.currentTarget)}
          onMouseEnter={() => setOverflowHover(true)}
          onMouseLeave={() => setOverflowHover(false)}
          style={{
            background: window.CCM.c.borderSoft, color: window.CCM.c.fg2, border: 0,
            fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
            cursor: "pointer", fontFamily: "Montserrat, sans-serif",
          }}
        >+{hidden.length}</button>
      )}
      {overflowHover && overflowRect && ReactDOM.createPortal(
        <div style={{
          position: "fixed",
          top: overflowRect.top, left: overflowRect.left,
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
          mais {hidden.length} {hidden.length === 1 ? "marcador aplicado" : "marcadores aplicados"}
        </div>,
        document.body
      )}
    </div>
  );
};

const DayChip = ({ text }) => (
  <div style={{ display: "flex", justifyContent: "center" }}>
    <div style={{
      background: "#fff", borderRadius: 999, padding: "4px 14px",
      fontSize: 11, color: "#555770",
      boxShadow: "0 1px 3px rgba(40,41,61,0.10)",
    }}>{text}</div>
  </div>
);

const ToolbarBtn = ({ icon, onClick, title }) => {
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
        }}><i className={`ph ${icon}`} style={{ fontSize: 16 }} /></button>
    </CCMTooltip>
  );
};

// Botão "Finalizar conversa" no mesmo padrão do ToolbarBtn (ghost + hover),
// só que com o check em verde pra sinalizar que é ação positiva. Fica cinza
// e desabilitado quando a conversa já está finalizada.
const FinalizeBtn = ({ isFinalized, onClick }) => {
  const c = window.CCM.c;
  const [hover, setHover] = React.useState(false);
  const label = isFinalized ? "Conversa finalizada" : "Finalizar conversa";
  return (
    <CCMTooltip label={label}>
      <button
        type="button"
        aria-label={label}
        disabled={isFinalized}
        onClick={onClick}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          width: 32, height: 32, borderRadius: 8, border: 0,
          background: hover && !isFinalized ? c.borderSoft : "transparent",
          color: isFinalized ? c.fg3 : c.successPure,
          cursor: isFinalized ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: isFinalized ? 0.6 : 1,
        }}><i className="ph ph-check" style={{ fontSize: 16 }} /></button>
    </CCMTooltip>
  );
};

// Lookup contact data by author initials (CA, JJ, PL, RM, etc.)
const lookupPerson = (initials) => {
  const D = window.CCM_DATA;
  if (!initials || !D?.contacts) return null;
  return Object.values(D.contacts).find(ct => ct.initials === initials) || null;
};

const MessageBubble = ({ msg, contact, attendant }) => {
  const c = window.CCM.c;
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
  const bg = isAgent ? "#E8F7FF" : "#fff";
  const titleColor = isAgent ? c.secundaryMedium : c.fg1;
  const person = lookupPerson(msg.author);
  const roleLabel = isAgent ? "[Atendente]" : "[Contato]";
  const author = person ? `${roleLabel} ${person.name}` : roleLabel;
  const initials = person?.initials || msg.author || (isAgent ? attendant?.initials : contact?.initials) || "?";
  const initialBg = person?.bg || (isAgent ? "#D7CCFF" : "#BFE6FA");
  const initialFg = person?.fg || (isAgent ? "#410293" : "#114865");
  return (
    <div style={{
      position: "relative", display: "flex",
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
          <span>{author}</span>
          <i className="ph ph-caret-down" style={{ fontSize: 12, color: c.fg2 }} />
        </div>
        <div style={{ fontSize: 14, color: c.fg1, lineHeight: 1.45, whiteSpace: "pre-line" }}>{msg.text}</div>
        {msg.reactions && (
          <div style={{ marginTop: 8 }}>
            {msg.reactions.map((r, i) => (
              <span key={i} style={{
                display: "inline-block", background: "#fff",
                border: `1px solid ${c.border}`, borderRadius: 999,
                padding: "2px 8px", fontSize: 12,
              }}>{r}</span>
            ))}
          </div>
        )}
        <div style={{
          marginTop: 10, fontSize: 11, color: c.fg2,
          display: "flex", alignItems: "center", justifyContent: isAgent ? "flex-end" : "flex-start", gap: 10,
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

// Composer with channel tabs
const Composer = ({ text, setText, channel, setChannel, onSend }) => {
  const c = window.CCM.c;
  const channels = [
    { label: "Nota interna",  icon: "ph-note-pencil",      bg: "#fffbf2" },
    { label: "WhatsApp",      icon: "ph-whatsapp-logo",    bg: "#fff" },
    { label: "WhatsApp Web",  icon: "ph-desktop",          bg: "#fff" },
    { label: "RCS",           icon: "ph-chat-text",        bg: "#fff" },
    { label: "SMS",           icon: "ph-chat-circle",      bg: "#fff" },
    { label: "Torpedo",       icon: "ph-paper-plane-tilt", bg: "#fff" },
    { label: "E-mail",        icon: "ph-envelope",         bg: "#fff" },
  ];

  const activeCh = channels.find(ch => ch.label === channel) || channels[0];

  return (
    <div style={{ background: "#fff", borderTop: `1px solid ${c.border}` }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 20,
        padding: "0 20px", height: 40, borderBottom: `1px solid ${c.border}`,
        overflowX: "auto",
      }}>
        {channels.map(ch => {
          const active = ch.label === channel;
          return (
            <div key={ch.label} onClick={() => setChannel(ch.label)}
              style={{
                position: "relative", height: 40, display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                color: active ? c.primary : c.fg1,
                flexShrink: 0,
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

      <textarea value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
        placeholder="Olá, cliente"
        style={{
          width: "100%", minHeight: 64, padding: "12px 20px",
          border: 0, outline: "none", resize: "none",
          background: activeCh.bg,
          fontFamily: "Montserrat, sans-serif", fontSize: 14, color: c.fg1,
          boxSizing: "border-box",
        }} />

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px 12px",
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          <ToolbarBtn icon="ph-paperclip" />
          <ToolbarBtn icon="ph-smiley" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {channel !== "Nota interna" && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              border: `1px solid ${c.border}`, borderRadius: 999, padding: "5px 12px",
              fontSize: 12, color: c.fg1,
            }}>
              <i className={`ph ${channel === "E-mail" ? "ph-envelope" : "ph-whatsapp-logo"}`} style={{ fontSize: 13 }} />
              {channel} <i className="ph ph-caret-down" style={{ fontSize: 11 }} />
            </span>
          )}
          <span style={{ fontSize: 11, color: c.fg3 }}>{1024 - text.length}</span>
          <button onClick={onSend} style={{
            width: 34, height: 34, borderRadius: "50%",
            background: c.primary, color: "#fff", border: 0, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 6px rgba(146,64,255,0.30)",
          }}><i className="ph ph-paper-plane-tilt" style={{ fontSize: 16 }} /></button>
        </div>
      </div>
    </div>
  );
};

const Popover = ({ onClose, title, items }) => {
  const c = window.CCM.c;
  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0, zIndex: 30,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: "absolute", top: 56, right: 200,
        background: "#fff", borderRadius: 12, padding: 12,
        boxShadow: "0 4px 20px 0 rgba(0,0,0,0.12), 0 2px 4px 0 rgba(0,0,0,0.12)",
        border: `1px solid ${c.border}`, minWidth: 220,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.fg2, marginBottom: 8 }}>{title}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {items.map(it => (
            <span key={it.label} style={{
              fontSize: 11, fontWeight: 500, padding: "4px 12px", borderRadius: 999,
              background: it.color + "14", color: it.color, border: `1px solid ${it.color}55`,
              cursor: "pointer",
            }}>{it.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const ContactInfoPopover = ({ contact, onClose, onTransfer }) => {
  const c = window.CCM.c;
  if (!contact) return null;
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 30 }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: "absolute", top: 56, right: 130,
        background: "#fff", borderRadius: 12, padding: 16,
        boxShadow: "0 4px 20px 0 rgba(0,0,0,0.12), 0 2px 4px 0 rgba(0,0,0,0.12)",
        border: `1px solid ${c.border}`, minWidth: 280,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{
            width: 38, height: 38, borderRadius: "50%",
            background: contact.bg, color: contact.fg, fontWeight: 700, fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{contact.initials}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: c.fg1 }}>{contact.name}</div>
            <div style={{ fontSize: 11, color: c.fg3 }}>Contato principal</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: c.fg2, lineHeight: 1.8 }}>
          <div><i className="ph ph-phone" style={{ marginRight: 6 }} />{contact.phone}</div>
          <div><i className="ph ph-envelope" style={{ marginRight: 6 }} />{contact.email}</div>
          <div><i className="ph ph-identification-card" style={{ marginRight: 6 }} />CPF: {contact.cpf}</div>
        </div>
        <button onClick={onTransfer} style={{
          marginTop: 12, width: "100%", height: 36, borderRadius: 10, border: 0,
          background: c.primaryLightest, color: c.primaryDark, fontWeight: 600,
          fontSize: 12, cursor: "pointer", fontFamily: "Montserrat, sans-serif",
        }}>Transferir para outro atendente</button>
      </div>
    </div>
  );
};

const QueuePopover = ({ onClose, onTransfer }) => {
  const c = window.CCM.c;
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 30 }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: "absolute", top: 56, right: 100,
        background: "#fff", borderRadius: 12, padding: 14,
        boxShadow: "0 4px 20px 0 rgba(0,0,0,0.12), 0 2px 4px 0 rgba(0,0,0,0.12)",
        border: `1px solid ${c.border}`, minWidth: 260,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.fg2, marginBottom: 8 }}>Mover atendimento</div>
        <button onClick={onTransfer} style={{
          width: "100%", textAlign: "left", padding: "8px 10px",
          border: 0, background: "transparent", cursor: "pointer", borderRadius: 8,
          fontSize: 13, color: c.fg1, display: "flex", alignItems: "center", gap: 8,
        }}><i className="ph ph-arrow-right-up" /> Transferir para uma fila</button>
        <button style={{
          width: "100%", textAlign: "left", padding: "8px 10px",
          border: 0, background: "transparent", cursor: "pointer", borderRadius: 8,
          fontSize: 13, color: c.fg1, display: "flex", alignItems: "center", gap: 8,
        }}><i className="ph ph-user-switch" /> Transferir para atendente</button>
        <button style={{
          width: "100%", textAlign: "left", padding: "8px 10px",
          border: 0, background: "transparent", cursor: "pointer", borderRadius: 8,
          fontSize: 13, color: c.fg1, display: "flex", alignItems: "center", gap: 8,
        }}><i className="ph ph-robot" /> Enviar para bot</button>
      </div>
    </div>
  );
};

const BookmarkPopover = ({ onClose }) => {
  const c = window.CCM.c;
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 30 }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: "absolute", top: 56, right: 70,
        background: "#fff", borderRadius: 12, padding: 14,
        boxShadow: "0 4px 20px 0 rgba(0,0,0,0.12), 0 2px 4px 0 rgba(0,0,0,0.12)",
        border: `1px solid ${c.border}`, minWidth: 240,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: c.fg1 }}>Conversa salva</div>
        <div style={{ fontSize: 12, color: c.fg2, marginTop: 4 }}>Você pode encontrá-la no menu de favoritos.</div>
      </div>
    </div>
  );
};

// Transfer to queue modal
const TransferModal = ({ onClose }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const [chosen, setChosen] = React.useState("atendimento-cliente");
  const flat = D.queues.flatMap(q => q.children ? [q, ...q.children] : [q]);
  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0, background: "rgba(40,41,61,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 40,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 16, padding: 24, minWidth: 420, maxWidth: 480,
        boxShadow: "0 4px 20px 0 rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: c.fg1 }}>Transferir para uma fila</h3>
          <button onClick={onClose} style={{
            border: 0, background: "transparent", color: c.fg2, cursor: "pointer",
          }}><i className="ph ph-x" style={{ fontSize: 18 }} /></button>
        </div>
        <div style={{ fontSize: 12, color: c.fg2, marginBottom: 8 }}>Selecione a fila de destino</div>
        <div style={{
          maxHeight: 280, overflowY: "auto",
          border: `1px solid ${c.border}`, borderRadius: 12, padding: 6,
        }}>
          {flat.map(q => (
            <label key={q.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 8, cursor: "pointer",
              background: q.id === chosen ? c.primaryLightest : "transparent",
              color: q.id === chosen ? c.primaryDark : c.fg1,
              fontSize: 13,
            }}>
              <input type="radio" checked={q.id === chosen} onChange={() => setChosen(q.id)}
                     style={{ accentColor: c.primary }} />
              <span style={{ fontSize: 13 }}>{q.icon}</span>
              <span style={{ flex: 1 }}>{q.name}</span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                background: "#eef9ee", color: "#4eaf51",
                borderRadius: 999, padding: "2px 8px",
              }}>{q.count}</span>
            </label>
          ))}
        </div>
        <div style={{ marginTop: 16, fontSize: 12, color: c.fg2 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" defaultChecked style={{ accentColor: c.primary }} />
            Notificar atendentes da fila
          </label>
        </div>
        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={{
            padding: "0 18px", height: 40, borderRadius: 999, border: `1px solid ${c.border}`,
            background: "#fff", color: c.fg1, fontWeight: 600, cursor: "pointer",
            fontFamily: "Montserrat, sans-serif", fontSize: 13,
          }}>Cancelar</button>
          <button onClick={onClose} style={{
            padding: "0 18px", height: 40, borderRadius: 999, border: 0,
            background: c.primary, color: "#fff", fontWeight: 600, cursor: "pointer",
            fontFamily: "Montserrat, sans-serif", fontSize: 13,
          }}>Transferir</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// LinkConversaModal — "Vincular conversa a outro atendimento"
// ---------------------------------------------------------------------
// 2 modos:
//   1. choose: usuário escolhe entre criar novo atendimento OU vincular a um
//      atendimento existente.
//   2. search: busca multi-atributo (Atendimento ID, Operação, Atendente,
//      Dados do contato) — mesmo padrão da busca da QueueSidebar.
//
// DE-PARA Angular: TicketLinkModalComponent <app-ticket-link-modal>
//   POST /atendimentos { source_conv_id: convId }     (criar novo)
//   PATCH /conversas/:convId { atendimento_id: tgtId } (vincular existente)
// ─────────────────────────────────────────────────────────────────────────
const LINK_SEARCH_FILTERS = [
  { id: "atendimento", label: "Atendimento",      icon: "ph-tag" },
  { id: "operacao",    label: "Operação",         icon: "ph-buildings" },
  { id: "atendente",   label: "Atendente",        icon: "ph-user" },
  { id: "contato",     label: "Dados do contato", icon: "ph-address-book" },
];

const LinkConversaModal = ({ convId, currentAtendimentoId, onClose, onLinked, onCreated, onError }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const [step, setStep] = React.useState("choose"); // "choose" | "search"
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] = React.useState([]);
  // Preview read-only de um atendimento dos resultados — não causa loop
  // infinito porque o preview NÃO tem botões de ação (sem vincular,
  // sem nova conversa, sem composer).
  const [previewId, setPreviewId] = React.useState(null);

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

  const results = React.useMemo(() => {
    if (!q) return [];
    return (D.atendimentos || []).filter(at => {
      if (at.id === currentAtendimentoId) return false; // não mostra o próprio
      const contact = at.contatos?.[0];
      if (!contact) return false;
      if (has("atendimento") && qd && at.id.includes(qd)) return true;
      if (has("operacao")) {
        const fila = at.conversas?.[0]?.fila || at.tipo || "";
        if (qn && norm(fila).includes(qn)) return true;
      }
      if (has("atendente")) {
        if ((at.atendentes || []).some(a => qn && norm(a.name).includes(qn))) return true;
      }
      if (has("contato")) {
        if (qn && norm(contact.name).includes(qn)) return true;
        if (qn && norm(contact.email).includes(qn)) return true;
        if (qd && digits(contact.phone).includes(qd)) return true;
        if (qd && digits(contact.cpf).includes(qd)) return true;
      }
      return false;
    }).slice(0, 30);
  }, [q, qn, qd, filters, D.atendimentos, currentAtendimentoId]);

  const handleCreateNew = () => {
    // Simula a criação. Hash determinístico do convId pra dar a ilusão de novo ID.
    const hash = String(convId).split("").reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) | 0, 0);
    const newId = String(100600 + (Math.abs(hash) % 400));
    onCreated?.(newId);
  };

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
          {step === "search" && (
            <CCMTooltip label="Voltar">
              <button onClick={() => setStep("choose")} aria-label="Voltar" style={{
                width: 28, height: 28, border: 0, background: "transparent",
                cursor: "pointer", color: c.fg2, borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><i className="ph ph-arrow-left" style={{ fontSize: 16 }} /></button>
            </CCMTooltip>
          )}
          <i className="ph ph-link-simple" style={{ fontSize: 18, color: c.primary }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: c.fg1, flex: 1 }}>
            Vincular conversa <span style={{ color: c.primary }}>{convId}</span>
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
          {step === "choose" && (
            <React.Fragment>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: c.fg2, lineHeight: 1.5 }}>
                Esta conversa pode virar um <strong>atendimento novo</strong> ou ser anexada
                a um <strong>atendimento existente</strong>.
              </p>

              {/* Option 1: criar novo */}
              <button
                type="button"
                onClick={handleCreateNew}
                style={{
                  width: "100%", textAlign: "left", padding: "14px 16px",
                  border: `1.5px solid ${c.border}`, borderRadius: 12,
                  background: "#fff", cursor: "pointer", marginBottom: 10,
                  display: "flex", alignItems: "flex-start", gap: 12,
                  fontFamily: "Montserrat, sans-serif",
                  transition: "background 150ms ease, border-color 150ms ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.background = c.primaryLightest; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = "#fff"; }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: c.primaryLightest, color: c.primary,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}><i className="ph ph-plus-circle" style={{ fontSize: 20 }} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c.fg1, marginBottom: 4 }}>
                    Criar um novo atendimento
                  </div>
                  <div style={{ fontSize: 12, color: c.fg2, lineHeight: 1.5 }}>
                    A conversa <strong>{convId}</strong> é movida para um novo atendimento na fila atual.
                  </div>
                </div>
              </button>

              {/* Option 2: vincular existente */}
              <button
                type="button"
                onClick={() => setStep("search")}
                style={{
                  width: "100%", textAlign: "left", padding: "14px 16px",
                  border: `1.5px solid ${c.border}`, borderRadius: 12,
                  background: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "flex-start", gap: 12,
                  fontFamily: "Montserrat, sans-serif",
                  transition: "background 150ms ease, border-color 150ms ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.background = c.primaryLightest; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.background = "#fff"; }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: c.primaryLightest, color: c.primary,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}><i className="ph ph-magnifying-glass" style={{ fontSize: 20 }} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c.fg1, marginBottom: 4 }}>
                    Vincular a um atendimento existente
                  </div>
                  <div style={{ fontSize: 12, color: c.fg2, lineHeight: 1.5 }}>
                    Busque por <strong>ID</strong>, <strong>operação</strong>, <strong>atendente</strong> ou <strong>dados do contato</strong>.
                  </div>
                </div>
                <i className="ph ph-caret-right" style={{ fontSize: 14, color: c.fg3, marginTop: 12 }} />
              </button>
            </React.Fragment>
          )}

          {step === "search" && (
            <React.Fragment>
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
                  placeholder="Buscar atendimento por ID, contato, atendente…"
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
                {LINK_SEARCH_FILTERS.map(f => {
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
                <div style={{
                  padding: "20px 12px", textAlign: "center",
                  color: c.fg3, fontSize: 12, lineHeight: 1.5,
                }}>
                  Digite acima pra começar a buscar atendimentos.
                </div>
              )}
              {q && results.length === 0 && (
                <div style={{
                  padding: "20px 12px", textAlign: "center",
                  color: c.fg3, fontSize: 12, lineHeight: 1.5,
                }}>
                  Nenhum atendimento encontrado para <strong style={{ color: c.fg2 }}>"{q}"</strong>.
                </div>
              )}
              {q && results.length > 0 && (
                <React.Fragment>
                  <div style={{ fontSize: 11, color: c.fg2, marginBottom: 8, fontWeight: 600 }}>
                    {results.length} {results.length === 1 ? "resultado" : "resultados"}
                  </div>
                  {results.map(at => {
                    const ct = at.contatos[0];
                    const status = at.status || "Aberto";
                    return (
                      <div key={at.id} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 12px", borderRadius: 10,
                        background: "#fff", border: `1px solid ${c.border}`,
                        marginBottom: 6,
                      }}>
                        <span style={{
                          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                          background: ct.bg, color: ct.fg,
                          fontSize: 11, fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>{ct.initials}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: c.fg1, display: "flex", gap: 8, alignItems: "center" }}>
                            Atendimento {at.id}
                            <span style={{
                              background: c.borderSoft, color: c.fg2,
                              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                            }}>{status}</span>
                          </div>
                          <div style={{ fontSize: 11, color: c.fg2, marginTop: 2 }}>
                            {ct.name} · {ct.email}
                          </div>
                        </div>
                        {/* Botão "Visualizar atendimento (somente leitura)" escondido a
                            pedido — handler setPreviewId segue vivo pra reativar. */}
                        <button
                          type="button"
                          onClick={() => onLinked?.(at.id)}
                          style={{
                            border: 0, background: c.primary, color: "#fff",
                            padding: "0 12px", height: 30, borderRadius: 8,
                            fontFamily: "Montserrat, sans-serif",
                            fontSize: 12, fontWeight: 600, cursor: "pointer",
                            display: "inline-flex", alignItems: "center", gap: 4,
                          }}
                        >
                          Vincular <i className="ph ph-arrow-right" style={{ fontSize: 12 }} />
                        </button>
                      </div>
                    );
                  })}
                </React.Fragment>
              )}
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

      {previewId && window.AtendimentoPreview && (
        <window.AtendimentoPreview
          atendimentoId={previewId}
          onClose={() => setPreviewId(null)}
        />
      )}
    </div>,
    document.body
  );
};

Object.assign(window, { ConversaPanel, TransferModal, MessageBubble, DayChip, LinkConversaModal });
