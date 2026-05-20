// SettingsMenu.jsx — Dropdown da engrenagem + Modal de Configurações do Chat
// ───────────────────────────────────────────────────────────────────────
// Ordem dos componentes (importante para o JSX):
//   1. Helpers de form (Toggle, NumberInput, SelectInput, Field, ...)
//   2. ChatSettingsModal (consome os helpers)
//   3. SettingsMenu (dropdown da engrenagem) + SettingsMenuItem
//   4. Export para window (SettingsMenu + ChatSettingsModal)
// ───────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────
// Helpers de form
// ─────────────────────────────────────────────

const Toggle = ({ checked, onChange }) => {
  const c = window.CCM.c;
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        width: 38, height: 22, borderRadius: 999, border: 0,
        background: checked ? c.primary : "#cfd0d8",
        position: "relative", flexShrink: 0, cursor: "pointer",
        transition: "background 160ms ease",
        padding: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2,
        left: checked ? 18 : 2,
        width: 18, height: 18, borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.20)",
        transition: "left 160ms ease",
      }} />
    </button>
  );
};

const NumberInput = ({ label, value, onChange, style }) => {
  const c = window.CCM.c;
  return (
    <div style={{ position: "relative", ...(style || {}) }}>
      {label && (
        <label style={{
          position: "absolute", top: -7, left: 10,
          padding: "0 4px", background: "#fff",
          fontSize: 10, color: c.fg2, fontWeight: 600,
          fontFamily: "Montserrat, sans-serif",
        }}>{label}</label>
      )}
      <input
        type="number"
        value={value}
        min={1}
        onChange={(e) => onChange(Math.max(1, parseInt(e.target.value || "1", 10)))}
        style={{
          width: "100%", height: 44, padding: "0 12px",
          border: `1px solid ${c.border}`, borderRadius: 8,
          fontFamily: "Montserrat, sans-serif", fontSize: 14, color: c.fg1,
          outline: "none", boxSizing: "border-box", background: "#fff",
        }}
      />
    </div>
  );
};

const SelectInput = ({ value, onChange, options, placeholder, style }) => {
  const c = window.CCM.c;
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef(null);
  const popupRef = React.useRef(null);
  const [pos, setPos] = React.useState(null);

  // Calcula posição do popup ancorada no botão sempre que abrir
  // ou a janela rolar/redimensionar — pra evitar dessincronizar com o trigger
  // quando o usuário rola dentro do modal pai.
  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const r = triggerRef.current.getBoundingClientRect();
      const popupH = 220;
      const spaceBelow = window.innerHeight - r.bottom;
      const above = spaceBelow < popupH + 16 && r.top > popupH + 16;
      setPos({
        left: r.left,
        top: above ? r.top - 4 : r.bottom + 4,
        width: r.width,
        above,
      });
    };
    update();
    const onScroll = () => update();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (popupRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const current = options.find(o => o.id === value);

  return (
    <div style={{ position: "relative", ...(style || {}) }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", height: 44, padding: "0 12px",
          border: `1px solid ${open ? c.primary : c.border}`, borderRadius: 8,
          background: "#fff", color: current ? c.fg1 : c.fg3,
          fontFamily: "Montserrat, sans-serif", fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", textAlign: "left", boxSizing: "border-box",
          transition: "border-color 120ms ease",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current?.label || placeholder || "Selecionar"}
        </span>
        <i className="ph ph-caret-down" style={{ fontSize: 12, color: c.fg3, flexShrink: 0 }} />
      </button>
      {open && pos && ReactDOM.createPortal(
        <div
          ref={popupRef}
          style={{
            position: "fixed",
            top: pos.above ? undefined : pos.top,
            bottom: pos.above ? window.innerHeight - pos.top : undefined,
            left: pos.left, width: pos.width,
            background: "#fff",
            border: `1px solid ${c.border}`, borderRadius: 8,
            boxShadow: "0 8px 24px rgba(40,41,61,0.22)",
            maxHeight: 220, overflowY: "auto",
            zIndex: 10001, // acima do modal (modal usa 9999)
            fontFamily: "Montserrat, sans-serif",
          }}
        >
          {options.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { onChange(opt.id); setOpen(false); }}
              onMouseEnter={(e) => {
                if (opt.id !== value) e.currentTarget.style.background = c.borderSoft;
              }}
              onMouseLeave={(e) => {
                if (opt.id !== value) e.currentTarget.style.background = "transparent";
              }}
              style={{
                width: "100%", padding: "10px 12px", border: 0,
                background: opt.id === value ? c.primaryLightest : "transparent",
                color: opt.id === value ? c.primary : c.fg1,
                fontFamily: "Montserrat, sans-serif", fontSize: 13,
                cursor: "pointer", textAlign: "left",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

// SettingRow — Linha padrão: label/toggle no topo, descrição abaixo, controles opcionais.
const SettingRow = ({ title, description, info, toggle, children }) => {
  const c = window.CCM.c;
  return (
    <div style={{
      padding: "16px 0", borderBottom: `1px solid ${c.borderSoft}`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 14, fontWeight: 600, color: c.fg1, marginBottom: 4,
          }}>
            {title}
            {info && (
              <i
                className="ph ph-info"
                title={info}
                style={{ fontSize: 14, color: c.warning || "#f59e0b", cursor: "help" }}
              />
            )}
          </div>
          {description && (
            <div style={{ fontSize: 12, color: c.fg2, lineHeight: 1.5 }}>
              {description}
            </div>
          )}
        </div>
        {toggle && (
          <div style={{ flexShrink: 0, paddingTop: 2 }}>
            {toggle}
          </div>
        )}
      </div>
      {children && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  );
};

// ─────────────────────────────────────────────
// Constantes compartilhadas
// ─────────────────────────────────────────────

const TIME_UNITS = [
  { id: "minuto", label: "Minuto" },
  { id: "hora",   label: "Hora"   },
  { id: "dia",    label: "Dia"    },
  { id: "semana", label: "Semana" },
  { id: "mes",    label: "Mês"    },
];

const MARCADORES_OPCOES = [
  { id: "pagamento",    label: "Pagamento"    },
  { id: "vip",          label: "Cliente VIP"  },
  { id: "urgente",      label: "Urgente"      },
  { id: "comercial",    label: "Comercial"    },
  { id: "suporte",      label: "Suporte"      },
];

const TROCA_OPCOES = [
  { id: "nova-conversa",  label: "Cria uma nova conversa para cada troca" },
  { id: "mesma-conversa", label: "Mantém na mesma conversa" },
];

const VISUALIZACAO_OPCOES = [
  { id: "nao-pode",   label: "Um atendente não pode ver conversas de outro" },
  { id: "ver-so",     label: "Pode ver, mas não pode responder" },
  { id: "ver-e-resp", label: "Pode ver e responder" },
];

// ─────────────────────────────────────────────
// ChatSettingsModal — modal com tabs (Geral / Conversas / E-mail)
// ─────────────────────────────────────────────

const CHAT_TABS = [
  { id: "geral",     label: "Geral",     icon: "ph-gear" },
  { id: "conversas", label: "Conversas", icon: "ph-chats-circle" },
  { id: "email",     label: "E-mail",    icon: "ph-envelope" },
];

const ChatSettingsModal = ({ onClose, onSave }) => {
  const c = window.CCM.c;
  const [activeTab, setActiveTab] = React.useState("geral");

  // Estado dos parâmetros (defaults da spec do Figma)
  const [tempoEspera, setTempoEspera]                 = React.useState({ on: true,  valor: 2,  unidade: "minuto" });
  const [atendimento, setAtendimento]                  = React.useState(true);
  const [usaSLA, setUsaSLA]                            = React.useState(true);
  const [atribuirResponsavel, setAtribuirResponsavel] = React.useState(true);
  const [marcadores, setMarcadores]                    = React.useState("");
  const [autoFechar, setAutoFechar]                    = React.useState({ on: false, valor: 24, unidade: "hora" });
  const [trocaProduto, setTrocaProduto]                = React.useState("nova-conversa");
  const [trocaAtendentes, setTrocaAtendentes]          = React.useState("nova-conversa");
  const [visualizacao, setVisualizacao]                = React.useState("nao-pode");
  const [ccEmail, setCcEmail]                          = React.useState(true);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = () => {
    onSave?.({
      tempoEspera, atendimento, usaSLA, atribuirResponsavel, marcadores,
      autoFechar, trocaProduto, trocaAtendentes, visualizacao, ccEmail,
    });
    onClose();
  };

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(40,41,61,0.45)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "40px 16px", overflowY: "auto",
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", width: "100%", maxWidth: 600,
          borderRadius: 16, boxShadow: "0 20px 50px rgba(40,41,61,0.30)",
          display: "flex", flexDirection: "column",
          maxHeight: "calc(100vh - 80px)", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px 0", flexShrink: 0,
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.fg1 }}>
              Configurações do chat
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              style={{
                width: 32, height: 32, borderRadius: 8, border: 0,
                background: "transparent", color: c.fg2, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = c.borderSoft}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            ><i className="ph ph-x" style={{ fontSize: 16 }} /></button>
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex", gap: 4,
            borderBottom: `1px solid ${c.borderSoft}`,
            margin: "0 -24px",
            padding: "0 24px",
          }}>
            {CHAT_TABS.map(t => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "10px 14px", border: 0, background: "transparent",
                    color: isActive ? c.primary : c.fg2,
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    cursor: "pointer", position: "relative",
                    borderBottom: `2px solid ${isActive ? c.primary : "transparent"}`,
                    marginBottom: -1,
                    transition: "color 120ms ease, border-color 120ms ease",
                  }}
                >
                  <i className={`ph ${t.icon}`} style={{ fontSize: 14 }} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "8px 24px 16px", overflowY: "auto", flex: 1, minHeight: 200 }}>

          {/* ── TAB GERAL ── */}
          {activeTab === "geral" && (
            <div>
              <SettingRow
                title="Tempo de espera"
                description="Edite o limite de tempo de espera que um contato pode aguardar pela resposta de um atendente sem receber um alerta."
                info="Aplicado a todas as conversas em aberto."
                toggle={<Toggle checked={tempoEspera.on} onChange={(on) => setTempoEspera(p => ({ ...p, on }))} />}
              >
                {tempoEspera.on && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <NumberInput
                      label="Tempo"
                      value={tempoEspera.valor}
                      onChange={(v) => setTempoEspera(p => ({ ...p, valor: v }))}
                      style={{ flex: "0 0 120px" }}
                    />
                    <SelectInput
                      value={tempoEspera.unidade}
                      options={TIME_UNITS}
                      onChange={(v) => setTempoEspera(p => ({ ...p, unidade: v }))}
                      style={{ flex: "0 0 160px" }}
                    />
                  </div>
                )}
              </SettingRow>

              <SettingRow
                title="Atendimento"
                description="Habilite a funcionalidade de atendimento para vincular conversas com protocolos de atendimento."
                toggle={<Toggle checked={atendimento} onChange={setAtendimento} />}
              />

              <SettingRow
                title="Usa SLA?"
                description="Aplica regras de SLA aos atendimentos. Quando desabilitado, o sistema ignora prazos automáticos."
                toggle={<Toggle checked={usaSLA} onChange={setUsaSLA} />}
              />

              <SettingRow
                title={`Atribuir responsável em "Sem fila específica"`}
                description={`Ative esta opção para que atendimentos da fila "Sem fila específica" sejam atribuídos automaticamente a um atendente do time relacionado ou, se não houver, a qualquer atendente cadastrado.`}
                toggle={<Toggle checked={atribuirResponsavel} onChange={setAtribuirResponsavel} />}
              />

              {/* NOVO: Fechar atendimentos automaticamente */}
              <SettingRow
                title="Fechar atendimentos automaticamente"
                description="Quando habilitado, atendimentos sem interação dentro do período definido serão fechados automaticamente."
                toggle={<Toggle checked={autoFechar.on} onChange={(on) => setAutoFechar(p => ({ ...p, on }))} />}
              >
                {autoFechar.on && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <NumberInput
                      label="Após"
                      value={autoFechar.valor}
                      onChange={(v) => setAutoFechar(p => ({ ...p, valor: v }))}
                      style={{ flex: "0 0 120px" }}
                    />
                    <SelectInput
                      value={autoFechar.unidade}
                      options={TIME_UNITS}
                      onChange={(v) => setAutoFechar(p => ({ ...p, unidade: v }))}
                      style={{ flex: "0 0 160px" }}
                    />
                  </div>
                )}
              </SettingRow>

              <SettingRow
                title="Marcadores de destaque"
                description="Selecione marcadores que ficarão em destaque por conversa."
              >
                <SelectInput
                  placeholder="Selecionar marcadores"
                  value={marcadores}
                  options={MARCADORES_OPCOES}
                  onChange={setMarcadores}
                />
              </SettingRow>
            </div>
          )}

          {/* ── TAB CONVERSAS ── */}
          {activeTab === "conversas" && (
            <div>
              <SettingRow
                title="Troca de produto"
                description="Escolha a regra de como deve ocorrer a abertura de nova conversa quando se troca de produto."
              >
                <SelectInput
                  value={trocaProduto}
                  options={TROCA_OPCOES}
                  onChange={setTrocaProduto}
                />
              </SettingRow>

              <SettingRow
                title="Troca de atendentes"
                description="Escolha a regra de como deve ocorrer a abertura de nova conversa quando se troca de atendente."
              >
                <SelectInput
                  value={trocaAtendentes}
                  options={TROCA_OPCOES}
                  onChange={setTrocaAtendentes}
                />
              </SettingRow>

              <SettingRow
                title="Visualização e resposta de conversas"
                description="Escolha a regra de como das permissões dos atendentes em relação a visualizar e responder conversas não-atribuídas a eles."
              >
                <SelectInput
                  value={visualizacao}
                  options={VISUALIZACAO_OPCOES}
                  onChange={setVisualizacao}
                />
              </SettingRow>
            </div>
          )}

          {/* ── TAB E-MAIL ── */}
          {activeTab === "email" && (
            <div>
              <SettingRow
                title="Destinatários Cc no canal de e-mail"
                description="Habilite a funcionalidade de destinatários Cc para permitir o envio de e-mails com destinatários em cópia (Cc)."
                toggle={<Toggle checked={ccEmail} onChange={setCcEmail} />}
              />

              <div style={{
                marginTop: 16, padding: "14px 16px",
                background: c.primaryLightest, borderRadius: 10,
                fontSize: 12, color: c.primary, lineHeight: 1.5,
              }}>
                <strong style={{ display: "block", marginBottom: 4 }}>
                  <i className="ph ph-info" style={{ marginRight: 6 }} />
                  Outras configurações de e-mail em breve.
                </strong>
                Templates, assinaturas e auto-resposta serão configurados aqui na próxima versão.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px", borderTop: `1px solid ${c.borderSoft}`,
          display: "flex", justifyContent: "flex-end", gap: 12, alignItems: "center",
          flexShrink: 0, background: "#fff",
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: `1px solid ${c.border}`, background: "#fff",
              color: c.fg1, fontWeight: 600, fontSize: 13,
              cursor: "pointer", padding: "10px 22px", borderRadius: 8,
              fontFamily: "Montserrat, sans-serif",
            }}
          >Cancelar</button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              border: 0, background: c.primary, color: "#fff",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              padding: "10px 28px", borderRadius: 8,
              fontFamily: "Montserrat, sans-serif",
              boxShadow: "0 2px 6px rgba(146,64,255,0.30)",
            }}
          >Salvar</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─────────────────────────────────────────────
// SettingsMenu — Dropdown da engrenagem
// ─────────────────────────────────────────────

const SETTINGS_SECTIONS = [
  {
    title: "Canais",
    items: [
      { id: "whatsapp",     icon: "ph-whatsapp-logo", label: "WhatsApp",     hasSub: true },
      { id: "whatsapp-web", icon: "ph-desktop",       label: "WhatsApp Web", hasSub: true },
      { id: "email",        icon: "ph-envelope",      label: "E-mail",       hasSub: true },
      { id: "produto",      icon: "ph-handbag",       label: "Produto",      hasSub: true },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { id: "atendimento",  icon: "ph-chat-circle", label: "Atendimento",             hasSub: true },
      { id: "recursos",     icon: "ph-folder",      label: "Recursos gerenciais",     hasSub: true },
      { id: "ia",           icon: "ph-brain",       label: "Inteligência artificial", hasSub: true },
      { id: "api",          icon: "ph-code",        label: "API",                     hasSub: true },
    ],
  },
  {
    title: "Parâmetros",
    items: [
      { id: "chat", icon: "ph-chat-circle-dots", label: "Chat", opensModal: "chat" },
    ],
  },
];

const SettingsMenuItem = ({ item, onClick }) => {
  const c = window.CCM.c;
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "9px 14px", border: 0,
        background: hover ? c.primaryLightest : "transparent",
        color: hover ? c.primary : c.fg1,
        fontSize: 13, fontWeight: 500,
        cursor: "pointer", textAlign: "left",
        fontFamily: "Montserrat, sans-serif",
        transition: "background 120ms ease, color 120ms ease",
      }}
    >
      {item.hasSub
        ? <i className="ph ph-caret-left" style={{ fontSize: 11, color: c.fg3, flexShrink: 0 }} />
        : <span style={{ width: 11, flexShrink: 0 }} />}
      <i className={`ph ${item.icon}`} style={{ fontSize: 16, color: hover ? c.primary : c.fg2, flexShrink: 0 }} />
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {item.label}
      </span>
    </button>
  );
};

const SettingsMenu = ({ anchorRef, onClose, onOpenModal }) => {
  const c = window.CCM.c;
  const [pos, setPos] = React.useState(null);

  React.useLayoutEffect(() => {
    if (!anchorRef?.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
  }, [anchorRef]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  React.useEffect(() => {
    const h = (e) => {
      if (e.target.closest("[data-settings-menu]")) return;
      if (anchorRef?.current && anchorRef.current.contains(e.target)) return;
      onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", h);
    };
  }, [onClose, anchorRef]);

  if (!pos) return null;

  const handleItemClick = (item) => {
    if (item.opensModal) {
      onClose();
      onOpenModal(item.opensModal);
    }
  };

  return ReactDOM.createPortal(
    <div
      data-settings-menu="1"
      style={{
        position: "fixed", top: pos.top, right: pos.right,
        width: 260, zIndex: 9999,
        background: "#fff",
        border: `1px solid ${c.border}`, borderRadius: 12,
        boxShadow: "0 12px 32px rgba(40,41,61,0.18)",
        padding: "8px 0", fontFamily: "Montserrat, sans-serif",
        maxHeight: "82vh", overflowY: "auto",
      }}
    >
      {SETTINGS_SECTIONS.map((sec, sIdx) => (
        <React.Fragment key={sec.title}>
          {sIdx > 0 && <div style={{ height: 1, background: c.borderSoft, margin: "8px 0" }} />}
          <div style={{
            padding: "6px 14px 4px", fontSize: 10, fontWeight: 700,
            color: c.fg3, textTransform: "uppercase", letterSpacing: 0.4,
          }}>
            {sec.title}
          </div>
          {sec.items.map(it => (
            <SettingsMenuItem key={it.id} item={it} onClick={() => handleItemClick(it)} />
          ))}
        </React.Fragment>
      ))}
    </div>,
    document.body
  );
};

Object.assign(window, { SettingsMenu, ChatSettingsModal });
