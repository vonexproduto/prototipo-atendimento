// Tooltip.jsx — componente único de tooltip do design system
// =====================================================================
// DE-PARA REACT → ANGULAR  ·  CCMTooltip
// ---------------------------------------------------------------------
// Substitui o atributo `title="…"` nativo do browser (tooltip amarelo
// padrão) pela versão estilizada do design system: bg #28293d, texto
// branco, raio 6, sombra suave. Mesma aparência usada no ScopeToggle.
//
// No Angular: equivale ao MatTooltip (@angular/material/tooltip) com
// theming custom do design system (background var(--neutral-color-low-pure)).
// =====================================================================
//
// Uso:
//   <CCMTooltip label="Filtrar contato">
//     <button>...</button>
//   </CCMTooltip>
//
// Props:
//   label       — string mostrada no tooltip (required)
//   placement   — "top" | "bottom" | "left" | "right"  (default: "bottom")
//   disabled    — não exibe o tooltip (mantém o filho)
//   delayMs     — atraso antes de aparecer no hover (default: 0)
//
// O componente clona o filho pra anexar ref + event handlers (mouseenter,
// mouseleave, focus, blur), preservando handlers já existentes. Renderiza
// em portal pra não vazar overflow/z-index do contêiner.
const CCMTooltip = ({ children, label, placement = "bottom", disabled = false, delayMs = 0 }) => {
  const triggerRef = React.useRef(null);
  const tooltipRef = React.useRef(null);
  const showTimerRef = React.useRef(null);
  const [visible, setVisible] = React.useState(false);
  // anchor = ponto do trigger relevante pra cada placement (p.ex.: center-bottom)
  const [anchor, setAnchor] = React.useState(null);
  // pos = posição final do tooltip já clampada ao viewport (left/top em px)
  const [pos, setPos] = React.useState(null);

  const show = !disabled && label;

  // Phase 1: ao ficar visível, calcula o ponto de ancoragem no trigger.
  React.useLayoutEffect(() => {
    if (!visible || !triggerRef.current) { setPos(null); return; }
    const r = triggerRef.current.getBoundingClientRect();
    let ax, ay;
    if (placement === "top") {
      ax = r.left + r.width / 2;
      ay = r.top;
    } else if (placement === "right") {
      ax = r.right;
      ay = r.top + r.height / 2;
    } else if (placement === "left") {
      ax = r.left;
      ay = r.top + r.height / 2;
    } else { // "bottom"
      ax = r.left + r.width / 2;
      ay = r.bottom;
    }
    setAnchor({ x: ax, y: ay });
    setPos(null); // força reposicionar
  }, [visible, placement, label]);

  // Phase 2: após o tooltip ter sido renderizado (com visibility:hidden),
  // medimos o tamanho real e clampamos pra que não vaze do viewport.
  React.useLayoutEffect(() => {
    if (!visible || !anchor || !tooltipRef.current || pos) return;
    const t = tooltipRef.current;
    const tw = t.offsetWidth;
    const th = t.offsetHeight;
    const offset = 8;
    const margin = 8;
    let x, y;
    if (placement === "top") {
      x = anchor.x - tw / 2;
      y = anchor.y - th - offset;
    } else if (placement === "right") {
      x = anchor.x + offset;
      y = anchor.y - th / 2;
    } else if (placement === "left") {
      x = anchor.x - tw - offset;
      y = anchor.y - th / 2;
    } else { // "bottom"
      x = anchor.x - tw / 2;
      y = anchor.y + offset;
    }
    // Clamp horizontal — se o tooltip vazaria à direita/esquerda, encosta com margem
    const maxX = window.innerWidth - tw - margin;
    if (x > maxX) x = Math.max(margin, maxX);
    if (x < margin) x = margin;
    // Clamp vertical — se vazaria embaixo/em cima, inverte ou encosta
    const maxY = window.innerHeight - th - margin;
    if (y > maxY) y = Math.max(margin, maxY);
    if (y < margin) y = margin;
    setPos({ left: x, top: y });
  }, [visible, anchor, pos, placement]);

  // Limpa timer pendente em unmount
  React.useEffect(() => () => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
  }, []);

  if (!show) return children;

  const reveal = () => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    if (delayMs > 0) {
      showTimerRef.current = setTimeout(() => setVisible(true), delayMs);
    } else {
      setVisible(true);
    }
  };
  const hide = () => {
    if (showTimerRef.current) { clearTimeout(showTimerRef.current); showTimerRef.current = null; }
    setVisible(false);
    setPos(null);
    setAnchor(null);
  };

  // Mescla handlers do filho com os nossos. Preserva ref existente.
  const childProps = children.props || {};
  const cloned = React.cloneElement(children, {
    ref: (node) => {
      triggerRef.current = node;
      const orig = children.ref;
      if (typeof orig === "function") orig(node);
      else if (orig && typeof orig === "object") orig.current = node;
    },
    onMouseEnter: (e) => { reveal(); childProps.onMouseEnter && childProps.onMouseEnter(e); },
    onMouseLeave: (e) => { hide();   childProps.onMouseLeave && childProps.onMouseLeave(e); },
    onFocus:      (e) => { reveal(); childProps.onFocus      && childProps.onFocus(e); },
    onBlur:       (e) => { hide();   childProps.onBlur       && childProps.onBlur(e); },
  });

  return (
    <React.Fragment>
      {cloned}
      {visible && anchor && ReactDOM.createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          style={{
            position: "fixed",
            // Antes de medir, posiciona no anchor (escondido) só pra o DOM existir.
            // Após medir, usa a posição final clampada (pos).
            top: pos ? pos.top : anchor.y,
            left: pos ? pos.left : anchor.x,
            visibility: pos ? "visible" : "hidden",
            background: "#28293d", color: "#fff",
            padding: "6px 10px", borderRadius: 6,
            fontSize: 12, fontWeight: 500, lineHeight: 1.4,
            // Textos longos quebram dentro do maxWidth em vez de
            // vazarem pra fora do fundo escuro. Textos curtos seguem
            // em uma linha só naturalmente.
            whiteSpace: "normal",
            wordBreak: "break-word",
            boxShadow: "0 4px 12px rgba(40,41,61,0.18)",
            pointerEvents: "none",
            zIndex: 10002,
            fontFamily: "Montserrat, sans-serif",
            maxWidth: 280,
          }}
        >
          {label}
        </div>,
        document.body
      )}
    </React.Fragment>
  );
};

// Disponibiliza global pros outros arquivos JSX (que já consomem window.CCM.c)
Object.assign(window, { CCMTooltip });
window.CCM = window.CCM || {};
window.CCM.Tooltip = CCMTooltip;
