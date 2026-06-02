# 01 · Design Tokens — De-Para React → Angular

Fonte de verdade no Angular:
- `src/app/@theme/style-guide/css-files/colors.scss` — cores (CSS custom properties) + classes utilitárias `.color-*` / `.bg-*`
- `src/app/@theme/style-guide/css-files/typography.scss` — fontes e escala tipográfica
- `src/app/@theme/style-guide/css-files/tokens-and-grids.scss` — sombras, bordas, caixas
- `src/app/@theme/css/variables.scss` — tokens de layout

No protótipo, os mesmos nomes estão espelhados em
`design-system/colors_and_type.css` (CSS vars, **idênticas** ao Angular) e
anotados em `src/tokens.js` (objeto JS `window.CCM.c` consumido pelos componentes).

---

## 1. Cores — `window.CCM.c` (React) → variável Angular

> Mapeamento **por valor (hex)**. A coluna "classe util." é a classe utilitária
> pronta do Angular (de `colors.scss`) — muitas vezes é o caminho mais limpo na
> conversão (`class="color-primary-pure"`) em vez de inline style.

### Marca — Primária (Electric Violet)

| `c.<chave>` | Hex | Variável Angular | Classe util. | Obs. |
|---|---|---|---|---|
| `primary` | `#9240FF` | `--brand-color-primary-pure` | `.color-primary-pure` | CTA assinatura |
| `primaryHover` | `#8766FF` | `--brand-color-primary-medium` | `.color-primary-medium` | hover/active |
| `primaryDark` | `#5F3AE5` | `--brand-color-primary-dark-medium` | — | ⚠ ver nota abaixo |
| `primaryLight` | `#D7CCFF` | `--brand-color-primary-light` | `.color-primary-light` | preenchimento btn secundário |
| `primaryLightest` | `#F3EEFF` | `--brand-color-primary-lightest` (`#EBE5FF`) | `.color-primary-lightest` | ≈ aprox. (protótipo + claro) |

> **Nota `primary-dark`:** o protótipo usa `#410293` como literal em alguns
> pontos (texto de avatar do atendente, ex.: `ConvCard`). Esse valor é
> `--brand-color-primary-dark` (`#410293`). Já `c.primaryDark` (#5F3AE5) é o
> `*-dark-medium`. São duas variáveis distintas no Angular.

### Marca — Secundária (Sky Cyan-Blue) · grafia `secundary`

| `c.<chave>` | Hex | Variável Angular | Classe util. |
|---|---|---|---|
| `secundaryPure` | `#37B8FB` | `--brand-color-secundary-pure` | `.color-secondary-pure` |
| `secundaryMedium` | `#1B89D1` | `--brand-color-secundary-medium` (`#3A8FB9`) ≈ | `.color-secondary-medium` |
| `secundaryLight` | `#BFE6FA` | `--brand-color-secundary-light` | `.bg-secondary-light` |
| `secundaryLightest` | `#E8F7FF` | `--brand-color-secundary-lightest` | `.bg-secondary-lightest` |

> Balão de mensagem do atendente usa `#E8F7FF` (fundo) + `secundaryMedium` (texto).

### Feedback — Sucesso (verde)

| `c.<chave>` | Hex | Variável Angular | Obs. |
|---|---|---|---|
| `successPure` | `#4eaf51` | `--feedback-color-success-medium` | ⚠ **não** é `success-pure` (que é `#79c22f`) |
| `successLight` | `#eef9ee` | `--feedback-color-success-lightest` (`#ebf8eb`) ≈ | |
| `successDark` | `#2a7d2d` | `--feedback-color-success-dark` (`#104700`) ≈ | protótipo usa verde + claro p/ texto |

### Feedback — ⚠ "warning" do protótipo = **HELPER (âmbar)** do Angular

| `c.<chave>` | Hex | Variável Angular | Classe util. |
|---|---|---|---|
| `warningPure` | `#f99f18` | `--feedback-color-helper-pure` | `.color-helper-pure` / `.bg-helper-pure` |
| `warningLight` | `#fef5e6` | `--feedback-color-helper-light` (`#fff3e0`) ≈ | `.bg-helper-light` |
| `warningDark` | `#a85f00` | `--feedback-color-helper-dark` (`#734700`) ≈ | |

### Destaque — ⚠ "helper" do protótipo = **HIGHLIGHT (magenta)** do Angular

| `c.<chave>` | Hex | Variável Angular | Obs. |
|---|---|---|---|
| `helperPure` | `#dd2e77` | `--highlight-color-pure` | cor padrão dos marcadores |
| `helperLight` | `#fde9f1` | `--highlight-color-light` (`#ffd6e7`) ≈ | |

### Feedback — ⚠ "danger" do protótipo = **WARNING (vermelho)** do Angular

| `c.<chave>` | Hex | Variável Angular | Classe util. |
|---|---|---|---|
| `dangerPure` | `#f54336` | `--feedback-color-warning-pure` | `.bg-warning-pure` |
| `dangerLight` | `#fde7e5` | `--feedback-color-warning-light` (`#ffdde3`) ≈ | `.bg-warning-light` |

### Neutros & fundos

| `c.<chave>` | Hex | Variável Angular | Classe util. | Uso |
|---|---|---|---|---|
| `fg1` | `#28293d` | `--neutral-color-low-pure` | `.color-low-pure` | texto primário |
| `fg2` | `#555770` | `--neutral-color-low-medium` | `.color-low-medium` | texto secundário |
| `fg3` | `#8F90A6` | `--neutral-color-low-light` (`#9091af`) ≈ | `.color-low-light` | placeholder/disabled |
| `border` | `#d6e1e9` | `--neutral-color-high-medium` | `.bg-neutral-color-high-medium` | borda de card |
| `borderSoft` | `#eef2f6` | `--neutral-color-high-light` (`#f1f1f5`) ≈ | — | divisores/hover |
| `canvas` | `#f2f6fa` | `--background-color-light` | `.bg-color-light` | fundo do app |
| `highlight` | `#9240FF` | `--brand-color-primary-pure` | — | = primary |
| (branco) | `#ffffff` | `--neutral-color-high-pure` / `--background-color-lightest` | `.bg-white` / `.bg-color-lightest` | cards/modais |

> `≈` = o protótipo usa um tom levemente diferente do token oficial. Na conversão,
> **prefira o token Angular** (consistência > fidelidade ao pixel do mock).

### Paleta Angular completa (referência)

Cores que existem no Angular mas o protótipo não usa diretamente (disponíveis em
`window.CCM.NG_COLORS` e em `colors.scss`):

```
--brand-color-gradient-start #1FF0FF   --brand-color-gradient-end #9240FF
  → .bg-brand-gradient (linear-gradient 90deg start→end)
--background-color-pure #154fa1        (hero/auth)
--highlight-color-medium #ab1654       --highlight-color-dark #69002c
--neutral-color-low-soft-light #a3a3a3 --neutral-color-low-dark #292929
--neutral-color-high-soft-light #fafbfb --neutral-color-high-dark #c7c9d9
--feedback-color-warning-medium #ff9993 --feedback-color-warning-dark #650012
--feedback-color-helper-medium #ffb033
--feedback-color-success-pure #79c22f  --feedback-color-success-light #e6f3e5
--system-white-background #f9f9f9
```

---

## 2. Tipografia

Fonte única: **Montserrat** (`@font-face` em ambos; arquivo
`assets/fonts/Montserrat-Regular.ttf`). `letter-spacing` sempre `0`; headings com
`font-weight: 500` por padrão.

| Onde no protótipo | Classe Angular (typography.scss) | size / weight / line-height |
|---|---|---|
| títulos `fontSize:32` | `h1` | 32 / 500 / 40 |
| `fontSize:24` | `h2` | 24 / 500 / 32 |
| `fontSize:20` | `h3` (`.heading-h3-bold` p/ 700) | 20 / 500 / 24 |
| `fontSize:16` títulos | `h4` | 16 / 500 / 20 |
| `fontSize:14` títulos | `h5` | 14 / 500 / 16 |
| `fontSize:12` títulos | `h6` | 12 / 500 / 12 |
| corpo 16/regular | `.body-x-small-regular` | 16 / 400 / 24 |
| corpo 16/semibold | `.body-x-small-semi-bold` | 16 / 600 / 24 |
| corpo 14/regular | `.body-xx-small-regular` | 14 / 400 / 16 |
| corpo 14/medium | `.body-xx-small-medium` | 14 / 500 / 16 |
| corpo 14/semibold | `.body-xx-small-semi-bold` | 14 / 600 / 16 |
| corpo 14/bold | `.body-xx-small-bold` | 14 / 700 / 16 |
| corpo 12/medium | `.body-xxx-small-medium` | 12 / 500 / 12 |
| corpo 12/semibold | `.body-xxx-small-semi-bold` | 12 / 600 / 12 |
| caption 10 | `.caption-xxx-small` (`-semi-bold` p/ 600) | 10 / 400 / 16 |
| caption 12 | `.caption-xxxx-small` (`-semi-bold` p/ 600) | 12 / 400 / 18 |
| link sublinhado | `.link-x-small` | 16 / 600 / 24 + underline |
| código/mono | `.font-console` | "Lucida Console", monospace |

> Os tamanhos em `px` espalhados nos inline styles do protótipo (ex.: `fontSize: 13`)
> não têm classe exata; na conversão arredonde para a classe mais próxima da escala
> acima ou use os tamanhos do design system do componente Angular alvo.

---

## 3. Espaçamento, radius, sombras e layout

### Espaçamento (base 4px)
Protótipo define `--space-xs:4 / sm:8 / md:16 / lg:24 / xl:32 / xxl:40` em
`colors_and_type.css`. No Angular não há escala de espaçamento em tokens globais —
o espaçamento é por componente (SCSS). Use múltiplos de 4px equivalentes.

### Radius
| Protótipo (`--radius-*` / inline) | Uso | Angular |
|---|---|---|
| `--radius-card: 20px` | superfície de card assinatura | `.white-box-background` (border-radius 20px) |
| `--radius-modal: 16px` | modais | classes `.dialog-br-16` / `.dialog-br-20` (material-dialog.scss) |
| `--radius-input: 12px` | inputs/botões | `.blue-box-background` etc. usam 12px |
| `--radius-popover: 8px` | popovers | — |
| `--radius-pill: 26px` / `999px` | chips/pills | `.ccm-chips` (`.br-22`) / badges |

### Sombras (tokens-and-grids.scss)
| Protótipo (inline) | Classe Angular |
|---|---|
| `0 0 10px rgba(40,41,61,.10)` | `.ccm-card` |
| `0 4px 20px …, 0 2px 4px …` | `.ccm-popover` |
| `0 2px 4px rgba(0,0,0,.08)` (balão) | `.chat-balloon` |
| dividers `0.5px inset` | `.divider-top` / `-right` / `-left` / `-bottom` |
| caixas coloridas | `.white-box-background`, `.blue-box-background`, `.red-box-background`, `.yellow-box-background`, `.green-box-background` |

### Layout (variables.scss · nomes idênticos nos dois)
| Variável | Angular | Protótipo |
|---|---|---|
| `--main-header-height` | `48px` | usa 60px (decisão do mock) |
| `--chat-input-bar-height` | `80px` | igual |
| `--chat-header-height` | `44px` | usa 56px nas sub-barras |
| `--chat-sidebar-width` | `65px` | rail de 56px |

---

## 4. Chips e badges (átomos de cor mais usados)

- **Chips / marcadores** (`@theme/css/chips.scss`): classe base `.ccm-chips`
  + variantes de cor `.primary`, `.color-success`, `.neutral-medium`,
  `.warning-medium`, `.secondary-light`, `.helper-pure`, `.helper-dark`,
  `.highlight-color`, `.neutral-high-medium`; tamanho `.small`, `.height-24px`,
  `.br-22`. No protótipo, todo chip de marcador/status vira `.ccm-chips`.
- **Badges / contadores** (`@theme/css/badget.scss`): classe base `.ccm-badget`
  + `.small` / `.medium` / `.dot` + cores `.success`, `.warning`, `.danger`,
  `.primary`, `.secondary-medium`, etc. Ex.: o número verde de contagem na
  sidebar de filas → `.ccm-badget.success`.
