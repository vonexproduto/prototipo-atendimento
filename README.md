# CCM Atendimentos — Protótipo de Alta Fidelidade

Protótipo do módulo **Central de Comunicação Multicanal (CCM) — Atendimentos e Conversas** da Vonex.
Origem: exportado do [Claude Design](https://claude.ai/design) em 2026-05-11.

## Stack

HTML + JSX + Babel standalone (transpila no carregamento). Sem build, sem watcher, sem `package.json`. Edita `.jsx` → recarrega navegador (Ctrl+R) → vê resultado.

---

## Como rodar

Precisa de um servidor estático (não funciona via `file://` por causa de CORS no import do CSS).

**Opção A — npx serve (recomendado, requer Node):**
```powershell
cd C:\Users\Paulo\Documents\Jobs\Vonex\CCM\melhoria-atendimento
npx serve .
```
A primeira vez `npx` pergunta se quer instalar o `serve` — responda **y**. Depois abre em http://localhost:3000/CCM%20Atendimentos (o `serve` remove o `.html` automaticamente).

**Opção B — Python (sem Node):**
```powershell
cd C:\Users\Paulo\Documents\Jobs\Vonex\CCM\melhoria-atendimento
python -m http.server 8000
```
Abrir: http://localhost:8000/CCM%20Atendimentos.html

**Opção C — VS Code Live Server:** clique direito no `CCM Atendimentos.html` → "Open with Live Server".

> Deixe o servidor rodando em outro terminal. Após qualquer edição em `.jsx`/`.css`, basta **Ctrl+R** no navegador.

---

## Mapa dos arquivos

```
CCM Atendimentos.html        # entrada — carrega React/Babel via CDN, faz o mount
design-system/
  colors_and_type.css        # tokens CSS (cores, type scale, espaçamento, radius, sombras)
  assets/                    # bg-chat.svg, dots_bg.png, logo vonex_ai.svg
  fonts/Montserrat-Regular.ttf
src/
  tokens.js                  # tokens em JS (window.CCM.c) usados pelos componentes
  data.js                    # mocks: filas, atendimentos, mensagens, contatos
  Header.jsx                 # navegação topo (Chat / Calendário / Trend)
  QueueSidebar.jsx           # sidebar esquerda: árvore de filas (Sem fila, Suporte, etc.)
  AtendimentosList.jsx       # tabela central + campo "Pesquisar" com preview
  AtendimentoDetail.jsx      # tela do "olhinho 👁": tabs Conversas / Contato / Histórico
  ConversaPanel.jsx          # painel direito: thread + composer multi-canal + modais
uploads/                     # imagens de referência do Figma original (descartáveis)
scraps/                      # sketch original (descartável)
_handoff/                    # README do Claude Design + transcript da conversa
```

### Cenários cobertos no protótipo (do transcript)

1. **Tela principal:** sidebar de filas + tabela com avatares empilhados, marcadores, status, botões de ação.
2. **Pesquisa com preview:**
   - Vazio → 3 pesquisas recentes
   - Números (`012345`) → CPF / telefone / nº atendimento (destaque amarelo)
   - Texto (`Silva`) → nome de contato e atendimentos relacionados
3. **Olhinho (👁):** tela de detalhe com 3 abas — Conversas (cards), Contato (pessoas), Histórico (timeline WhatsApp+e-mail).
4. **Painel de conversa:** marcadores, transferir fila (modal), encerrar, composer com tabs WhatsApp/Web/RCS/SMS/Torpedo/E-mail, contador, preço.

---

## Como iterar com Claude Code

Sempre **nomeie o arquivo** que quer alterar. Exemplos prontos para copiar:

- _"No `src/ConversaPanel.jsx`, agrupe mensagens por dia com separador `— 11/05/2026 —`"_
- _"Em `design-system/colors_and_type.css`, mude `--brand-color-primary-pure` para `#7E22CE`"_
- _"No `src/AtendimentosList.jsx`, adicione coluna 'Tempo aberto' depois de Status"_
- _"No `src/data.js`, adicione mais 8 atendimentos no canal `email` com nomes diversos"_
- _"No `src/AtendimentoDetail.jsx` aba Histórico, adicione filtro por canal no topo"_

Para mudanças visuais sutis, peça em diff de pixels/cores. Para mudanças estruturais, peça em alto nível — o código é pequeno o suficiente para reescrever um componente inteiro sem dor.

### Onde ficam os tokens
- **CSS:** `design-system/colors_and_type.css` — variáveis `--brand-*`, `--neutral-*`, `--feedback-*`, type scale, radius, shadows.
- **JS:** `src/tokens.js` — exporta `window.CCM` com cores em hex para uso direto nos componentes.

Se mudar uma cor, atualize nos dois lugares (ou refatore os componentes para sempre lerem CSS vars via `getComputedStyle`).

---

## Decisões propositais

- **Sem build:** Babel standalone transpila JSX no carregamento. ~1s a mais para abrir, mas zero setup.
- **CDN React 18.3.1 + Phosphor Icons 2.1.1:** primeira abertura precisa de internet; depois fica em cache do browser.
- **Mocks completos em `data.js`:** sem dependência de backend para iterar UI.
- **`window.CCM` global:** os componentes JSX leem `window.CCM.c` para cores — simplifica o protótipo.
