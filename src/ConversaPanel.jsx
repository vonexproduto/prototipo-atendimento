// ConversaPanel.jsx — right side of detail: the open conversation thread
const ConversaPanel = ({ conv, contact, attendant, atendimentoId, onTransfer, expanded, onToggleExpand, tab }) => {
  const c = window.CCM.c;
  const D = window.CCM_DATA;
  const [messages, setMessages] = React.useState(conv.messages);
  const [text, setText] = React.useState("");
  const [channel, setChannel] = React.useState(conv.channel === "email" ? "E-mail" : "WhatsApp");
  const [showTags, setShowTags] = React.useState(false);
  const [showInfo, setShowInfo] = React.useState(false);
  const [showQueue, setShowQueue] = React.useState(false);
  const [showBookmark, setShowBookmark] = React.useState(false);
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
      {/* sub-header bar (conv-level) — title changes based on active tab */}
      <div style={{
        height: 48, padding: "0 16px",
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
            </React.Fragment>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <ToolbarBtn icon="ph-tag" onClick={() => setShowTags(true)} title="Marcadores" />
          <ToolbarBtn icon="ph-user" onClick={() => setShowInfo(true)} title="Contato (CA)" />
          <ToolbarBtn icon="ph-clipboard-text" onClick={() => setShowQueue(true)} title="Transferir para fila" />
          <ToolbarBtn icon="ph-bookmark-simple" onClick={() => setShowBookmark(true)} title="Salvar conversa" />
          <button title="Encerrar" style={{
            width: 32, height: 32, borderRadius: 8, border: 0,
            background: c.successPure, color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginLeft: 4,
          }}><i className="ph-fill ph-check" style={{ fontSize: 16 }} /></button>
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

      {/* Composer — hidden in read-only history view */}
      {tab === "Histórico" ? (
        <div style={{
          background: "#fff", borderTop: `1px solid ${c.border}`,
          padding: "14px 20px", display: "flex", alignItems: "center", gap: 10,
          color: c.fg2, fontSize: 12,
        }}>
          <i className="ph ph-eye" style={{ fontSize: 16, color: c.primary }} />
          <span>
            Visualização somente leitura. Para responder, volte para a aba <b style={{ color: c.fg1 }}>Conversas</b>.
          </span>
        </div>
      ) : (
        <Composer text={text} setText={setText} channel={channel} setChannel={setChannel} onSend={send} />
      )}

      {/* Popovers */}
      {showTags && <Popover onClose={() => setShowTags(false)} title="Marcadores"
        items={[
          { label: "Pagamento", color: "#dd2e77" },
          { label: "Cliente VIP", color: "#9240FF" },
          { label: "Urgente", color: "#f54336" },
          { label: "Comercial", color: "#37B8FB" },
          { label: "Pendência", color: "#f99f18" },
        ]} />}
      {showInfo && <ContactInfoPopover contact={contact} onClose={() => setShowInfo(false)} onTransfer={onTransfer} />}
      {showQueue && <QueuePopover onClose={() => setShowQueue(false)} onTransfer={onTransfer} />}
      {showBookmark && <BookmarkPopover onClose={() => setShowBookmark(false)} />}
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
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: 32, height: 32, borderRadius: 8, border: 0,
        background: hover ? c.borderSoft : "transparent",
        color: c.fg2, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}><i className={`ph ${icon}`} style={{ fontSize: 16 }} /></button>
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

Object.assign(window, { ConversaPanel, TransferModal });
