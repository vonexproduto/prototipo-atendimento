// tokens.js — color and design tokens for CCM
window.CCM = {
  c: {
    primary: "#9240FF",
    primaryHover: "#8766FF",
    primaryDark: "#5F3AE5",
    primaryLight: "#D7CCFF",
    primaryLightest: "#F3EEFF",
    secundaryPure: "#37B8FB",
    secundaryMedium: "#1B89D1",
    secundaryLight: "#BFE6FA",
    secundaryLightest: "#E8F7FF",
    successPure: "#4eaf51",
    successLight: "#eef9ee",
    successDark: "#2a7d2d",
    warningPure: "#f99f18",
    warningLight: "#fef5e6",
    warningDark: "#a85f00",
    helperPure: "#dd2e77",
    helperLight: "#fde9f1",
    dangerPure: "#f54336",
    dangerLight: "#fde7e5",
    highlight: "#9240FF",
    fg1: "#28293d",
    fg2: "#555770",
    fg3: "#8F90A6",
    border: "#d6e1e9",
    borderSoft: "#eef2f6",
    canvas: "#f2f6fa",
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
