// demo-router.js — reads ?demo=<state> from URL and exposes window.CCM_DEMO_STATE.
// Used by wireflow.html iframes to render specific app states.
// Open the prototype without ?demo= for normal interactive mode.
(function () {
  const params = new URLSearchParams(window.location.search);
  const demo = params.get("demo");

  const STATES = {
    "list": {
      // default: nothing — same as opening prototype normally
    },
    "search": {
      searchFocused: true,
    },
    "filters": {
      filtersOpen: true,
    },
    "detail-conv": {
      openAtendimentoId: "123456",
      detailTab: "Conversas",
    },
    "detail-contato": {
      openAtendimentoId: "123456",
      detailTab: "Contato",
    },
    "detail-historico": {
      openAtendimentoId: "123456",
      detailTab: "Histórico",
    },
    "conversa": {
      openAtendimentoId: "123456",
      detailTab: "Conversas",
    },
    "transfer-modal": {
      openAtendimentoId: "123456",
      detailTab: "Conversas",
      showTransfer: true,
    },
    "empty": {
      emptyQueue: true,
    },
    "loading": {
      loadingTable: true,
    },
  };

  window.CCM_DEMO_STATE = demo && STATES[demo] ? STATES[demo] : null;

  // Add a visual flag in the corner so designer can confirm which demo state is active
  if (window.CCM_DEMO_STATE) {
    document.addEventListener("DOMContentLoaded", () => {
      const badge = document.createElement("div");
      badge.textContent = "demo=" + demo;
      badge.style.cssText = [
        "position:fixed",
        "bottom:8px",
        "right:8px",
        "background:#9240FF",
        "color:#fff",
        "font-family:Montserrat, sans-serif",
        "font-size:10px",
        "font-weight:600",
        "padding:4px 10px",
        "border-radius:999px",
        "z-index:9999",
        "box-shadow:0 2px 6px rgba(146,64,255,0.30)",
        "pointer-events:none",
        "opacity:0.85",
      ].join(";");
      document.body.appendChild(badge);
    });
  }
})();
