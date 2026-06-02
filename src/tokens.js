// =====================================================================
// tokens.js — color & design tokens for the CCM "Atendimentos" prototype
// =====================================================================
//
// ⚠️ ESTE ARQUIVO É O CORAÇÃO DO "DE-PARA" REACT → ANGULAR (cores/tokens).
//
// Contexto: este protótipo React será usado como REFERÊNCIA para um dev
// (e/ou IA) recriar as telas no codebase Angular `ngx-ccm`. Por isso, cada
// cor abaixo está anotada com o NOME OFICIAL da variável no Angular, cujo
// arquivo-fonte é:
//     src/app/@theme/style-guide/css-files/colors.scss   (CSS custom props)
//     src/app/@theme/style-guide/css-files/typography.scss
//     src/app/@theme/style-guide/css-files/tokens-and-grids.scss
//     src/app/@theme/css/variables.scss                  (layout tokens)
//
// Ao converter para Angular, NÃO use os hexes direto: use a CSS var do
// Angular indicada em cada linha — ex.: `background: var(--brand-color-primary-pure)`.
// A tabela completa e navegável está em:  de-para/01-design-tokens.md
//
// ─────────────────────────────────────────────────────────────────────
// ⚠️ ARMADILHA DE NOMES ("off-by-one" semântico):
// Os nomes curtos deste protótipo (helperPure, warningPure, dangerPure…)
// NÃO batem com a semântica do Angular. O mapeamento correto é POR VALOR (hex):
//   • c.dangerPure  (#f54336) → --feedback-color-warning-pure   (vermelho/vermilion)
//   • c.warningPure (#f99f18) → --feedback-color-helper-pure    (âmbar/laranja)
//   • c.helperPure  (#dd2e77) → --highlight-color-pure          (magenta/rosa)
//   • c.successPure (#4eaf51) → --feedback-color-success-MEDIUM (success-pure do Angular é #79c22f)
// Sempre confie no comentário "→ Angular:" de cada linha, não no nome curto.
// ─────────────────────────────────────────────────────────────────────

window.CCM = {
  // `c` = paleta consumida pelos componentes (window.CCM.c.<chave>).
  // Mantida EXATAMENTE como estava (mesmas chaves e hexes) para não alterar
  // o visual; o valor agregado aqui são as anotações "→ Angular".
  c: {
    // ── Marca / Primária (Electric Violet) ──
    primary:          "#9240FF", // → Angular: var(--brand-color-primary-pure)        | util: .color-primary-pure / .bg-... ; SCSS $... none (use var)
    primaryHover:     "#8766FF", // → Angular: var(--brand-color-primary-medium)       | util: .color-primary-medium
    primaryDark:      "#5F3AE5", // → Angular: var(--brand-color-primary-dark-medium)  | (ATENÇÃO: --brand-color-primary-dark = #410293, usado em texto de avatar)
    primaryLight:     "#D7CCFF", // → Angular: var(--brand-color-primary-light)        | util: .color-primary-light
    primaryLightest:  "#F3EEFF", // ≈ Angular: var(--brand-color-primary-lightest) (#EBE5FF) | protótipo usa um tom levemente mais claro
    // ── Marca / Secundária (Sky Cyan-Blue) — grafia "secundary" preservada do Angular ──
    secundaryPure:    "#37B8FB", // → Angular: var(--brand-color-secundary-pure)       | util: .color-secondary-pure / .bg-secondary-*
    secundaryMedium:  "#1B89D1", // ≈ Angular: var(--brand-color-secundary-medium) (#3A8FB9) | protótipo diverge (tom mais saturado)
    secundaryLight:   "#BFE6FA", // → Angular: var(--brand-color-secundary-light)      | util: .bg-secondary-light
    secundaryLightest:"#E8F7FF", // → Angular: var(--brand-color-secundary-lightest)   | util: .bg-secondary-lightest ; usado no balão do atendente
    // ── Feedback / Sucesso ──
    successPure:      "#4eaf51", // → Angular: var(--feedback-color-success-medium)    | (success-PURE do Angular = #79c22f — não confundir)
    successLight:     "#eef9ee", // ≈ Angular: var(--feedback-color-success-lightest) (#ebf8eb) / success-light (#e6f3e5)
    successDark:      "#2a7d2d", // ≈ Angular: var(--feedback-color-success-dark) (#104700) | protótipo usa verde menos escuro p/ texto de chip
    // ── Feedback / "warning" do protótipo = HELPER (âmbar) do Angular ──
    warningPure:      "#f99f18", // → Angular: var(--feedback-color-helper-pure)       | util: .color-helper-pure / .bg-helper-*
    warningLight:     "#fef5e6", // ≈ Angular: var(--feedback-color-helper-light) (#fff3e0)
    warningDark:      "#a85f00", // ≈ Angular: var(--feedback-color-helper-dark) (#734700)
    // ── "helper" do protótipo = HIGHLIGHT (magenta) do Angular ──
    helperPure:       "#dd2e77", // → Angular: var(--highlight-color-pure)             | cor padrão dos marcadores (AVAILABLE_MARKERS)
    helperLight:      "#fde9f1", // ≈ Angular: var(--highlight-color-light) (#ffd6e7)
    // ── "danger" do protótipo = WARNING (vermelho) do Angular ──
    dangerPure:       "#f54336", // → Angular: var(--feedback-color-warning-pure)      | util: .bg-warning-pure ; asterisco de campo obrigatório
    dangerLight:      "#fde7e5", // ≈ Angular: var(--feedback-color-warning-light) (#ffdde3)
    // ── Destaque ──
    highlight:        "#9240FF", // → Angular: var(--brand-color-primary-pure) (mesmo que primary)
    // ── Neutros / foreground ──
    fg1:              "#28293d", // → Angular: var(--neutral-color-low-pure)     | texto primário ; util: .color-low-pure
    fg2:              "#555770", // → Angular: var(--neutral-color-low-medium)   | texto secundário ; util: .color-low-medium
    fg3:              "#8F90A6", // ≈ Angular: var(--neutral-color-low-light) (#9091af) | texto desabilitado/placeholder
    // ── Neutros / superfícies e bordas ──
    border:           "#d6e1e9", // → Angular: var(--neutral-color-high-medium)  | borda de card ; util: .bg-neutral-color-high-medium
    borderSoft:       "#eef2f6", // ≈ Angular: var(--neutral-color-high-light) (#f1f1f5) | divisores/hover sutil
    canvas:           "#f2f6fa", // → Angular: var(--background-color-light)      | fundo do app ; util: .bg-color-light
  },

  // cssVar — mapeia a chave curta do protótipo → nome da CSS custom property
  // no Angular. Use ao converter inline styles: o gerador troca
  //   style={{ color: c.primary }}   →   [style.color]="'var(--brand-color-primary-pure)'"
  // ou simplesmente aplica a classe utilitária equivalente (ver 01-design-tokens.md).
  cssVar: {
    primary:          "--brand-color-primary-pure",
    primaryHover:     "--brand-color-primary-medium",
    primaryDark:      "--brand-color-primary-dark-medium",
    primaryLight:     "--brand-color-primary-light",
    primaryLightest:  "--brand-color-primary-lightest", // valor aproximado (ver nota acima)
    secundaryPure:    "--brand-color-secundary-pure",
    secundaryMedium:  "--brand-color-secundary-medium", // valor aproximado
    secundaryLight:   "--brand-color-secundary-light",
    secundaryLightest:"--brand-color-secundary-lightest",
    successPure:      "--feedback-color-success-medium",
    successLight:     "--feedback-color-success-lightest", // aproximado
    successDark:      "--feedback-color-success-dark",      // aproximado
    warningPure:      "--feedback-color-helper-pure",
    warningLight:     "--feedback-color-helper-light",      // aproximado
    warningDark:      "--feedback-color-helper-dark",       // aproximado
    helperPure:       "--highlight-color-pure",
    helperLight:      "--highlight-color-light",            // aproximado
    dangerPure:       "--feedback-color-warning-pure",
    dangerLight:      "--feedback-color-warning-light",     // aproximado
    highlight:        "--brand-color-primary-pure",
    fg1:              "--neutral-color-low-pure",
    fg2:              "--neutral-color-low-medium",
    fg3:              "--neutral-color-low-light",           // aproximado
    border:           "--neutral-color-high-medium",
    borderSoft:       "--neutral-color-high-light",          // aproximado
    canvas:           "--background-color-light",
  },

  // NG_COLORS — paleta OFICIAL do Angular (colors.scss), reproduzida na íntegra
  // e fiel aos valores reais. É a fonte de verdade para a conversão: se precisar
  // de uma cor que o protótipo não usa, pegue daqui pelo nome do Angular.
  // (chave = nome exato da CSS var, sem o prefixo "--")
  NG_COLORS: {
    "brand-color-primary-pure":        "#9240FF",
    "brand-color-primary-light":       "#D7CCFF",
    "brand-color-primary-lightest":    "#EBE5FF",
    "brand-color-primary-medium":      "#8766FF",
    "brand-color-primary-dark-medium": "#5F3AE5",
    "brand-color-primary-dark":        "#410293",
    "brand-color-secundary-pure":      "#37B8FB",
    "brand-color-secundary-lightest":  "#E8F7FF",
    "brand-color-secundary-light":     "#BFE6FA",
    "brand-color-secundary-medium":    "#3A8FB9",
    "brand-color-secundary-dark":      "#114865",
    "brand-color-gradient-start":      "#1FF0FF",
    "brand-color-gradient-end":        "#9240FF",
    "background-color-pure":           "#154fa1",
    "background-color-light":          "#f2f6fa",
    "background-color-lightest":       "#ffffff",
    "highlight-color-pure":            "#dd2e77",
    "highlight-color-light":           "#ffd6e7",
    "highlight-color-medium":          "#ab1654",
    "highlight-color-dark":            "#69002c",
    "neutral-color-low-pure":          "#28293d",
    "neutral-color-low-soft-light":    "#a3a3a3",
    "neutral-color-low-light":         "#9091af",
    "neutral-color-low-medium":        "#555770",
    "neutral-color-low-dark":          "#292929",
    "neutral-color-high-pure":         "#ffffff",
    "neutral-color-high-soft-light":   "#fafbfb",
    "neutral-color-high-light":        "#f1f1f5",
    "neutral-color-high-medium":       "#d6e1e9",
    "neutral-color-high-dark":         "#c7c9d9",
    "feedback-color-warning-pure":     "#f54336",
    "feedback-color-warning-light":    "#ffdde3",
    "feedback-color-warning-medium":   "#ff9993",
    "feedback-color-warning-dark":     "#650012",
    "feedback-color-helper-pure":      "#f99f18",
    "feedback-color-helper-light":     "#fff3e0",
    "feedback-color-helper-medium":    "#ffb033",
    "feedback-color-helper-dark":      "#734700",
    "feedback-color-success-pure":     "#79c22f",
    "feedback-color-success-light":    "#e6f3e5",
    "feedback-color-success-lightest": "#ebf8eb",
    "feedback-color-success-medium":   "#4eaf51",
    "feedback-color-success-dark":     "#104700",
    "system-white-background":         "#f9f9f9",
  },

  // Tokens de layout do Angular (src/app/@theme/css/variables.scss).
  // O protótipo replica estes em colors_and_type.css; nomes idênticos ao Angular.
  NG_LAYOUT: {
    "main-header-height":    "48px", // protótipo usa header de 60px (decisão visual do mock)
    "chat-input-bar-height": "80px",
    "chat-header-height":    "44px", // protótipo usa 56px nas sub-barras de conversa
    "chat-sidebar-width":    "65px", // protótipo usa rail de 56px
  },
};

// Helper: distribui atendimentos por filas de forma determinística.
// Como o dataset de demo não tem uma FK forte atendimento→fila, usamos hash
// do id pra alocar cada atendimento numa fila-folha. Usado por:
//   - AtendimentosList (filtrar lista quando favoritos ativos)
//   - QueueSidebar (esconder filas vazias quando favoritos ativos)
window.CCM.collectLeafQueues = (queues) => {
  const leaves = [];
  for (const q of queues) {
    if (q.children?.length) {
      for (const ch of q.children) leaves.push(ch);
    } else {
      leaves.push(q);
    }
  }
  return leaves;
};

window.CCM.queueOfAtendimento = (atendimentoId, queues) => {
  const leaves = window.CCM.collectLeafQueues(queues);
  if (!leaves.length) return null;
  let hash = 0;
  const s = String(atendimentoId);
  for (let i = 0; i < s.length; i++) hash = ((hash * 31) + s.charCodeAt(i)) >>> 0;
  return leaves[hash % leaves.length].id;
};

// Conjunto de ids de fila-folha "aceitáveis" pra uma fila selecionada.
// Se a fila tem filhos, retorna ids dos filhos; senão, só ela mesma.
window.CCM.expandQueueLeaves = (queue) => {
  if (!queue) return new Set();
  if (queue.children?.length) return new Set(queue.children.map(c => c.id));
  return new Set([queue.id]);
};

// Cadeia fila→operação pra um atendimento. Top-level leaf (ex.: "Operação
// de Logística") sem pais devolve a própria entry como fila + operação.
window.CCM.queueChainForAtendimento = (atendimentoId, queues) => {
  const leafId = window.CCM.queueOfAtendimento(atendimentoId, queues);
  if (!leafId) return null;
  for (const q of queues) {
    if (q.id === leafId) return { fila: q, operacao: q };
    if (q.children) {
      const child = q.children.find(ch => ch.id === leafId);
      if (child) return { fila: child, operacao: q };
    }
  }
  return null;
};

// Converte slaTag ("-1d", "+3h", "-30m") em minutos pra ordenação.
// Negativo = atrasado. Mais negativo = mais atrasado.
window.CCM.slaTagToMinutes = (tag) => {
  if (!tag) return Number.MAX_SAFE_INTEGER;
  const sign = tag[0] === "-" ? -1 : 1;
  const m = tag.slice(1).match(/^(\d+)([hmd])$/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  const mult = unit === "d" ? 1440 : unit === "h" ? 60 : 1;
  return sign * n * mult;
};
