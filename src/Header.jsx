// Header.jsx — top app bar
const Header = ({ active = "Chat", onNav }) => {
  const c = window.CCM.c;
  const items = [
    { label: "Campanha", chevron: true },
    { label: "Chat", chevron: false },
    { label: "Jornada", chevron: true },
    { label: "Relatórios", chevron: true },
  ];
  return (
    <header style={{
      height: 60, background: "#fff",
      borderBottom: `1px solid ${c.border}`,
      padding: "0 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexShrink: 0, position: "relative", zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
        <img src="design-system/assets/logos/vonex_ai.svg" alt="VONEX.AI" style={{ height: 22 }} />
        <nav style={{ display: "flex", gap: 36 }}>
          {items.map(it => {
            const isActive = it.label === active;
            return (
              <div key={it.label} onClick={() => onNav?.(it.label)} style={{
                position: "relative", display: "flex", alignItems: "center", gap: 4,
                fontSize: 14, fontWeight: 500, color: isActive ? c.primary : c.fg1,
                cursor: "pointer", padding: "18px 0",
              }}>
                {it.label}
                {it.chevron && <i className="ph ph-caret-down" style={{ fontSize: 12 }} />}
                {isActive && (
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 8, height: 2, background: c.primary, borderRadius: 1 }} />
                )}
              </div>
            );
          })}
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button style={{
          width: 38, height: 38, borderRadius: 10, border: 0,
          background: c.primary, color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 6px rgba(146,64,255,0.30)",
        }}><i className="ph ph-plus" style={{ fontSize: 20 }} /></button>
        <HeaderIcon icon="ph-tray" />
        <HeaderIcon icon="ph-question" />
        <HeaderIcon icon="ph-gear" />
        <span style={{
          width: 36, height: 36, borderRadius: "50%",
          border: `1.5px solid ${c.primary}`, color: c.primary,
          fontWeight: 700, fontSize: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>CA</span>
      </div>
    </header>
  );
};
const HeaderIcon = ({ icon }) => {
  const c = window.CCM.c;
  return (
    <button style={{
      width: 36, height: 36, borderRadius: 8, border: 0, background: "transparent",
      color: c.fg1, cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}><i className={`ph ${icon}`} style={{ fontSize: 20 }} /></button>
  );
};
Object.assign(window, { Header });
