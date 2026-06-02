// DashboardView.jsx — Dashboard de chat (relatórios)
// =====================================================================
// DE-PARA REACT → ANGULAR  ·  DashboardView.jsx
// ---------------------------------------------------------------------
// Dashboard de chat (KPIs + gráficos por canal + tabela por atendente).
// Módulo Angular: @modules/chat-one-to-one/components/chat-dashboard.
//
//   DashboardView       → ChatDashboardComponent <app-chat-dashboard>
//                         (header = ChatDashboardHeaderComponent
//                          <app-chat-dashboard-header>)
//   KpiCard             → cards básicos: ChatDashBasicInfoComponent
//                         <app-chat-dash-basic-info>
//   ChannelChart/Row    → ChatDashMessagesPerChannelComponent
//                         <app-chat-dash-messages-per-channel> e
//                         ChatDashChatsPerChannelComponent <app-chat-dash-chats-per-channel>
//                         (barras = CcmProgressChartComponent <ccm-progress-chart>;
//                          pizza = CcmPieChartComponent <ccm-pie-chart>)
//   WhatsAppCategoriesCard → ChatDashWhatsappCategoriesRankComponent
//                         <app-chat-dash-whatsapp-categories-rank>
//   AttendantTable      → ChatDashChatsPerAttendantComponent
//                         <app-chat-dash-chats-per-attendant> (grid = <ccm-table>)
//   filtros avançados   → ChatDashAdvancedFiltersModalComponent
//                         <app-chat-dash-advanced-filters-modal>
// Doc: de-para/02-componentes.md
// =====================================================================
const DashboardView = () => {
  const c = window.CCM.c;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto", background: c.canvas }}>
      {/* Top bar */}
      <div style={{
        background: "#fff", borderBottom: `1px solid ${c.border}`,
        padding: "0 24px", height: 52, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ph ph-trend-up" style={{ fontSize: 16, color: c.fg2 }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: c.fg1 }}>Dashboard de chat</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: c.successLight, color: c.successDark,
            border: `1px solid ${c.successPure}`, borderRadius: 999,
            padding: "3px 10px", fontSize: 11, fontWeight: 600,
          }}>
            <i className="ph ph-check-circle" style={{ fontSize: 12 }} />
            Atualizado às 14/05/2026 - 15:47
          </div>
          <button style={{
            display: "flex", alignItems: "center", gap: 5,
            border: `1px solid ${c.border}`, borderRadius: 8,
            background: "#fff", color: c.fg1, fontSize: 12, fontWeight: 600,
            padding: "5px 12px", cursor: "pointer", fontFamily: "Montserrat, sans-serif",
          }}>
            <i className="ph ph-arrow-counter-clockwise" style={{ fontSize: 13 }} />
            Atualizar
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{
            display: "flex", alignItems: "center", gap: 5,
            border: `1px solid ${c.border}`, borderRadius: 8,
            background: "#fff", color: c.fg1, fontSize: 12, fontWeight: 600,
            padding: "5px 14px", cursor: "pointer", fontFamily: "Montserrat, sans-serif",
          }}>
            <i className="ph ph-file-arrow-down" style={{ fontSize: 14 }} />
            Baixar relatório
          </button>
          <button style={{
            display: "flex", alignItems: "center", gap: 5,
            border: 0, borderRadius: 8,
            background: c.primary, color: "#fff", fontSize: 12, fontWeight: 600,
            padding: "6px 14px", cursor: "pointer", fontFamily: "Montserrat, sans-serif",
            boxShadow: "0 2px 6px rgba(146,64,255,0.25)",
          }}>
            <i className="ph ph-trend-up" style={{ fontSize: 14 }} />
            Ver relatórios de atendimento
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: "#fff", borderBottom: `1px solid ${c.border}`,
        padding: "8px 24px", flexShrink: 0,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          border: `1px solid ${c.border}`, borderRadius: 8,
          padding: "5px 12px", fontSize: 12, fontWeight: 600, color: c.fg1,
          cursor: "pointer", background: "#fff",
        }}>
          Hoje
          <i className="ph ph-caret-down" style={{ fontSize: 12, color: c.fg2 }} />
        </div>
        <button style={{
          display: "flex", alignItems: "center", gap: 5,
          border: `1px solid ${c.border}`, borderRadius: 8,
          background: "#fff", color: c.fg1, fontSize: 12, fontWeight: 600,
          padding: "5px 12px", cursor: "pointer", fontFamily: "Montserrat, sans-serif",
        }}>
          <i className="ph ph-funnel" style={{ fontSize: 13, color: c.primary }} />
          Filtros avançados
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* KPI row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1.4fr", gap: 12 }}>
          <KpiCard label="Total de conversas" value="14" sub="14" />
          <KpiCard label="Tempo médio de atendimento" value="0h 0m 0s" sub="0h 0m 0s" />
          <KpiCard label="Conversas aguardando atendimento" value="2" />
          <KpiCard label="Sessões abertas" value="0" sub="0" />
          <WhatsAppCategoriesCard />
        </div>

        {/* KPI row 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <KpiCard label="Total de mensagens" value="7" sub="8" />
          <KpiCard label="Tempo médio de espera" value="34h 52m 5s" sub="34h 20m 55s" />
          <KpiCard label="Conversas em atendimento" value="12" />
          <KpiCard label="Conversas concluídas" value="0" sub="0" />
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <ChannelChart title="Mensagens por canal" icon="ph-chat-circle" />
          <ChannelChart title="Conversas por canal" icon="ph-chats-circle" conversas />
        </div>

        {/* Attendant table */}
        <AttendantTable />
      </div>
    </div>
  );
};

// ─── KPI Card ────────────────────────────────────
const KpiCard = ({ label, value, sub }) => {
  const c = window.CCM.c;
  return (
    <div style={{
      background: "#fff", borderRadius: 12,
      border: `1px solid ${c.border}`,
      padding: "16px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: c.fg2, fontWeight: 500 }}>{label}</span>
        <i className="ph ph-info" style={{ fontSize: 12, color: c.fg3 }} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: c.fg1, lineHeight: 1 }}>{value}</div>
      {sub && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 11, color: c.fg3 }}>
          {sub}
          <i className="ph ph-info" style={{ fontSize: 11 }} />
        </div>
      )}
    </div>
  );
};

// ─── WhatsApp Categories Card ────────────────────
const WhatsAppCategoriesCard = () => {
  const c = window.CCM.c;
  const cats = [
    { rank: "1º", icon: "ph-whatsapp-logo", label: "Utilidades", pct: "0%", count: 0 },
    { rank: "2º", icon: "ph-whatsapp-logo", label: "Marketing",  pct: "0%", count: 0 },
    { rank: "3º", icon: "ph-whatsapp-logo", label: "Autenticação", pct: "0%", count: 0 },
    { rank: "4º", icon: "ph-whatsapp-logo", label: "Serviços",   pct: "0%", count: 0 },
  ];
  return (
    <div style={{
      background: "#fff", borderRadius: 12,
      border: `1px solid ${c.border}`,
      padding: "16px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: c.fg2, fontWeight: 500 }}>Categorias de mensagem WhatsApp</span>
        <i className="ph ph-info" style={{ fontSize: 12, color: c.fg3 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cats.map(cat => (
          <div key={cat.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: c.fg2, width: 20 }}>{cat.rank}</span>
            <i className={`ph ${cat.icon}`} style={{ fontSize: 14, color: "#25d366" }} />
            <span style={{ fontSize: 12, color: c.fg1, flex: 1 }}>{cat.label}</span>
            <span style={{ fontSize: 11, color: c.fg3 }}>{cat.pct} · {cat.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Channel Chart ────────────────────────────────
const ChannelChart = ({ title, icon, conversas }) => {
  const c = window.CCM.c;
  const channels = [
    { label: "WhatsApp",      icon: "ph-whatsapp-logo", color: "#25d366", left: true,  value: 0, pct: 0 },
    { label: "SMS",           icon: "ph-device-mobile", color: c.fg3,     left: false, value: 0, pct: 0 },
    { label: "Email",         icon: "ph-envelope",      color: c.fg3,     left: true,  value: 0, pct: 0 },
    { label: "Torpedo",       icon: "ph-paper-plane-tilt", color: c.fg3,  left: false, value: 0, pct: 0 },
    { label: "WhatsApp Web",  icon: "ph-globe",         color: "#25d366", left: true,  value: 0, pct: 0 },
    { label: "RCS",           icon: "ph-chat-dots",     color: c.primary, left: false, value: conversas ? 1 : 7, pct: 100 },
    { label: "Nota Interna",  icon: "ph-note",          color: c.fg3,     left: true,  value: 0, pct: 0 },
  ];

  const leftCols  = channels.filter(ch => ch.left);
  const rightCols = channels.filter(ch => !ch.left);

  return (
    <div style={{
      background: "#fff", borderRadius: 12,
      border: `1px solid ${c.border}`,
      padding: "16px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        <i className={`ph ${icon}`} style={{ fontSize: 16, color: c.secundaryPure }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: c.fg1 }}>{title}</span>
        <i className="ph ph-info" style={{ fontSize: 12, color: c.fg3 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
        {[leftCols, rightCols].map((col, ci) =>
          col.map(ch => (
            <ChannelRow key={ch.label} ch={ch} />
          ))
        )}
      </div>
    </div>
  );
};

const ChannelRow = ({ ch }) => {
  const c = window.CCM.c;
  return (
    <div style={{ marginBottom: 2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
        <i className={`ph ${ch.icon}`} style={{ fontSize: 12, color: ch.color }} />
        <span style={{ fontSize: 11, color: c.fg2 }}>{ch.label}</span>
        <span style={{ fontSize: 11, color: c.fg2, marginLeft: 2 }}>
          {ch.value}({ch.pct}%)
        </span>
      </div>
      <div style={{ height: 6, background: c.borderSoft, borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${ch.pct}%`,
          background: ch.pct > 0 ? c.primary : "transparent",
          borderRadius: 999,
          transition: "width 400ms ease",
        }} />
      </div>
    </div>
  );
};

// ─── Attendant Table ──────────────────────────────
const AttendantTable = () => {
  const c = window.CCM.c;
  const rows = [
    { ordem: 1, atendente: "Lucas Rehem", total: 2, andamento: 2, concluidas: 0, tma: "0h 0m 0s", tme: "0h 0m 0s" },
  ];
  const cols = [
    { label: "Ordem",                  key: "ordem" },
    { label: "Atendente",              key: "atendente" },
    { label: "Total de conversas",     key: "total",      highlight: true },
    { label: "Conversas em andamento", key: "andamento" },
    { label: "Conversas concluídas",   key: "concluidas" },
    { label: "TMA",                    key: "tma",        info: true },
    { label: "TME",                    key: "tme",        info: true },
  ];

  return (
    <div style={{
      background: "#fff", borderRadius: 12,
      border: `1px solid ${c.border}`,
      padding: "16px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ph ph-users-three" style={{ fontSize: 16, color: c.primary }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: c.fg1 }}>Conversas por atendente</span>
          <i className="ph ph-info" style={{ fontSize: 12, color: c.fg3 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            border: `1px solid ${c.border}`, borderRadius: 8,
            padding: "4px 10px", fontSize: 12, color: c.fg1, cursor: "pointer",
          }}>
            Total de conversas
            <i className="ph ph-caret-down" style={{ fontSize: 11, color: c.fg2 }} />
          </div>
          <button style={{
            display: "flex", alignItems: "center", gap: 5,
            border: `1px solid ${c.border}`, borderRadius: 8,
            background: "#fff", color: c.primary, fontSize: 12, fontWeight: 600,
            padding: "4px 12px", cursor: "pointer", fontFamily: "Montserrat, sans-serif",
          }}>
            <i className="ph ph-file-arrow-down" style={{ fontSize: 13 }} />
            Baixar
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${c.border}` }}>
              {cols.map(col => (
                <th key={col.key} style={{
                  padding: "8px 12px", textAlign: "left",
                  fontSize: 11, fontWeight: 700, color: c.fg2,
                  background: col.highlight ? c.primaryLightest : "transparent",
                  whiteSpace: "nowrap",
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                    {col.label}
                    {col.info && <i className="ph ph-info" style={{ fontSize: 11, color: c.fg3 }} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${c.borderSoft}` }}>
                {cols.map(col => (
                  <td key={col.key} style={{
                    padding: "10px 12px",
                    background: col.highlight ? c.primaryLightest : "transparent",
                    color: c.fg1, fontWeight: col.key === "atendente" ? 600 : 400,
                  }}>
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Object.assign(window, { DashboardView });
