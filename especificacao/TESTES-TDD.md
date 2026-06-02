# Especificação de Testes (TDD)
## CCM — Atendimentos e Conversas

> **Objetivo:** catálogo de **todos os testes que a implementação precisa passar
> para a tarefa ser aprovada** (Definition of Done). Pensado para **TDD**: escreva
> o teste, veja-o falhar, implemente até passar.
>
> **Agnóstico de tecnologia:** não conheço a linguagem/arquitetura de vocês. Por
> isso os testes são especificados como **casos** (Preparar → Executar → Verificar),
> e não como código. Adapte cada caso ao seu framework de testes
> (unitário / integração / E2E).
>
> **Rastreabilidade:** cada teste referencia o cenário correspondente em
> [`CENARIOS-BDD.md`](CENARIOS-BDD.md) (`@CEN-XXX`). A matriz no fim cruza tudo.

---

## Camadas de teste

| Prefixo | Camada | Foco |
|---|---|---|
| `UT-` | Unitário (regra de negócio pura) | funções determinísticas: SLA, busca, contadores, ordenação, agregações |
| `INT-` | Integração / serviço de domínio | operações de negócio (criar, enviar, transferir, filtrar, persistir) |
| `E2E-` | Aceitação ponta a ponta | fluxos completos derivados dos cenários BDD |
| `NEG-` | Negativo / validação / borda | entradas inválidas, estados proibidos, limites |
| `NF-` | Não-funcional | desempenho, segurança/permissão, tempo real, i18n |

**Formato de cada caso:** `Preparar` (estado inicial) · `Executar` (ação) ·
`Verificar` (asserção). Para testes unitários, há **entrada → saída exatas**.

---

## 1. Testes unitários — regras de negócio puras (`UT-`)

> Determinísticos e sem dependência de banco/rede. São os primeiros a escrever no TDD.

### 1.1 SLA — conversão de etiqueta em minutos  ·  ref @CEN-030

| ID | Entrada (`tag`) | Saída esperada (minutos) |
|---|---|---|
| UT-SLA-01 | `"-1d"` | `-1440` |
| UT-SLA-02 | `"+3h"` | `180` |
| UT-SLA-03 | `"-30m"` | `-30` |
| UT-SLA-04 | `"+2d"` | `2880` |
| UT-SLA-05 | `"-1m"` | `-1` |
| UT-SLA-06 | `"-5d"` | `-7200` |
| UT-SLA-07 | `""` / nulo | valor máximo (vai para o fim da ordenação) |
| UT-SLA-08 | `"3h"` (sem sinal) / `"abc"` / `"+9x"` | valor máximo (etiqueta inválida) |

### 1.2 SLA — classificação e ordenação  ·  ref @CEN-031, @CEN-032, @CEN-033

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| UT-SLA-10 | etiqueta `"-1d"` | classificar | resultado = **Atrasado** (tempo negativo) |
| UT-SLA-11 | etiqueta `"+6h"` | classificar | resultado = **No prazo** (tempo positivo) |
| UT-SLA-12 | lista com `["-1m","-5d","+3h","+2d"]` | ordenar ascendente | ordem por minutos crescente: `-5d, -1m, +3h, +2d` (mais atrasado primeiro) |
| UT-SLA-13 | mesma lista | ordenar descendente | ordem inversa do UT-SLA-12 |
| UT-SLA-14 | lista com etiqueta inválida/vazia | ordenar | itens sem SLA válido vão para o fim |

### 1.3 Normalização de busca  ·  ref @CEN-063, @CEN-064

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| UT-SRCH-01 | termo `"flávia"` e alvo `"Flavia"` | normalizar (minúsculas + sem acento) e comparar | há correspondência |
| UT-SRCH-02 | termo `"FLAVIA"` | normalizar | igual ao termo minúsculo sem acento |
| UT-SRCH-03 | termo `"024.676.678-90"` e CPF alvo `"024.676.678-90"` | comparar só dígitos | há correspondência |
| UT-SRCH-04 | termo `"(11)998012345"` e telefone alvo `"11998012345"` | comparar só dígitos | há correspondência |
| UT-SRCH-05 | termo com espaços nas pontas | normalizar | espaços ignorados |

### 1.4 Correspondência de busca por campo  ·  ref @CEN-060, @CEN-061, @CEN-062

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| UT-SRCH-10 | filtro "Atendimento" + termo `"123456"` | buscar | retorna o atendimento de id `123456` |
| UT-SRCH-11 | filtro "Dados do contato" subcampo "Nome" + `"Silva"` | buscar | retorna contatos cujo nome contém "Silva" |
| UT-SRCH-12 | filtro "Dados do contato" subcampo "CPF" + dígitos | buscar | casa por dígitos do CPF |
| UT-SRCH-13 | nenhum filtro + termo | buscar | procura em todos os atributos (atendimento, operação, atendente, contato, conversa) |
| UT-SRCH-14 | filtro "Conversa" + id de conversa | buscar | retorna atendimento que contém a conversa |

### 1.5 Contador de caracteres da mensagem  ·  ref @CEN-103

| ID | Entrada | Saída esperada |
|---|---|---|
| UT-MSG-01 | texto com 0 caractere | restante = `1024` |
| UT-MSG-02 | texto com 24 caracteres | restante = `1000` |
| UT-MSG-03 | texto com 1024 caracteres | restante = `0` |
| UT-MSG-04 | texto com 1025 caracteres | restante negativo → envio bloqueado **[regra a definir]** |

### 1.6 Ordenação por marcador  ·  ref @CEN-053

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| UT-MARK-01 | atendimentos com 1º marcador `["Urgente","Comercial","(sem)"]` | ordenar por marcador | ordem alfabética pt-BR: `Comercial, Urgente, (sem)`; sem marcador por último |
| UT-MARK-02 | ordenação "apenas página" | ordenar só os primeiros N itens | itens fora da página mantêm a posição |

### 1.7 Agregações de histórico  ·  ref @CEN-142, @CEN-151

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| UT-AGG-01 | conjunto de mensagens com canais variados | contar por canal | contagem correta por canal |
| UT-AGG-02 | mensagens de papel "agente" | contar por atendente (autor) | contagem correta por atendente |
| UT-AGG-03 | mensagens mistas | total considera apenas mensagens reais (exclui mensagens de sistema) | total correto |
| UT-AGG-04 | mensagens de vários atendimentos | ordenar cronologicamente | ordem por data/hora crescente |

### 1.8 Estrutura de filas  ·  ref @CEN-002, @CEN-003

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| UT-QUEUE-01 | operação com filas-filhas | coletar filas-folha | retorna as filas-filhas (não a operação-pai) |
| UT-QUEUE-02 | fila-folha sem filhos | coletar filas-folha | retorna a própria fila |
| UT-QUEUE-03 | contagem da operação | somar filhos | contador da operação = soma dos contadores das filhas |

---

## 2. Testes de integração / domínio (`INT-`)

### 2.1 Listagem e escopo  ·  ref @CEN-001, @CEN-010..014

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-LST-01 | atendimentos em várias filas | listar pela fila X | retorna apenas atendimentos da fila X (ou de suas filhas) |
| INT-LST-02 | atendente A logado | escopo "Meus" | retorna só atendimentos com A como participante |
| INT-LST-03 | escopo "Todos" | listar | não filtra por atendente |
| INT-LST-04 | favoritos do atendente | escopo "Favoritos" | retorna só favoritados; filas sem favoritos são omitidas |
| INT-LST-05 | escopo "SLA" | listar | retorna itens de todas as filas, ordenados por atraso |
| INT-LST-06 | escopo alterado e sessão reiniciada | reabrir | escopo anterior é mantido (persistência) |
| INT-LST-07 | fila com N itens e página de tamanho P | paginar | retorna o subconjunto correto + total |

### 2.2 Favoritos  ·  ref @CEN-020..022

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-FAV-01 | atendimento não favoritado | favoritar | passa a constar nos favoritos do atendente e persiste |
| INT-FAV-02 | atendimento favoritado | desfavoritar | sai dos favoritos |
| INT-FAV-03 | favorito do atendente A | consultar como atendente B | não aparece para B |

### 2.3 Status  ·  ref @CEN-040, @CEN-041

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-ST-01 | atendimento "Aberto" | mudar para "Em andamento" | status persistido = "Em andamento" |
| INT-ST-02 | atendimento "Em andamento" | mudar para "Finalizado" | status persistido = "Finalizado" |
| INT-ST-03 | qualquer atendimento | mudar para status fora do enum | alteração rejeitada |

### 2.4 Marcadores  ·  ref @CEN-050..052

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-MK-01 | conversa sem "Urgente" | aplicar "Urgente" | marcador presente |
| INT-MK-02 | conversa com "Pagamento" | remover | marcador ausente |
| INT-MK-03 | seletor aberto | listar disponíveis | lista marcadores ainda não aplicados; filtro por texto funciona |

### 2.5 Criar / editar atendimento  ·  ref @CEN-080..083

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-CRT-01 | fila informada (+ atendente/SLA opcionais) | criar | atendimento criado com os dados |
| INT-CRT-02 | sem fila | criar | criação bloqueada; campo obrigatório sinalizado |
| INT-CRT-03 | atendimento existente | editar fila/atendente/SLA | alterações persistidas |
| INT-CRT-04 | SLA com unidade | criar | unidade aceita ∈ {Minutos, Horas, Dias, Semanas} |

### 2.6 Conversa: envio e finalização  ·  ref @CEN-101, @CEN-111, @CEN-120, @CEN-121

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-CV-01 | conversa aberta | enviar texto válido no canal X | mensagem registrada com autor, canal X e data/hora; entra no fim da conversa |
| INT-CV-02 | conversa aberta | registrar "Nota interna" | conteúdo visível só à equipe; não entregue ao contato |
| INT-CV-03 | conversa aberta | finalizar | status vira "Finalizada"; histórico permanece |
| INT-CV-04 | conversa finalizada | tentar enviar | envio bloqueado |
| INT-CV-05 | nova conversa por contato selecionado | enviar 1ª mensagem | conversa criada e mensagem registrada |

### 2.7 Transferência  ·  ref @CEN-130..133

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-TR-01 | atendimento na fila A | transferir para fila B | vínculo passa para fila B |
| INT-TR-02 | atendimento com atendente X | transferir para atendente Y | responsável passa a Y |
| INT-TR-03 | "notificar fila" marcado | transferir | atendentes da fila de destino notificados |

### 2.8 Histórico do contato  ·  ref @CEN-150..154

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-HC-01 | contato com conversas em vários atendimentos | consolidar histórico | reúne todas as mensagens/conversas/atendimentos do contato em ordem cronológica |
| INT-HC-02 | histórico consolidado | calcular totais | totais de mensagens/atendimentos/conversas e por canal/atendente corretos |
| INT-HC-03 | filtro por fila | aplicar | considera só mensagens das conversas das filas escolhidas |
| INT-HC-04 | filtro por período "30 dias" | aplicar | retorna só atendimentos do intervalo |
| INT-HC-05 | busca por id de atendimento | aplicar | filtra atendimentos do contato pelo id |

### 2.9 Transferência por I.A.  ·  ref @CEN-160..163

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-IA-01 | fila = "Sem fila específica" | verificar disponibilidade | ação "Transferir por I.A." disponível |
| INT-IA-02 | fila ≠ "Sem fila específica" | verificar disponibilidade | ação indisponível |
| INT-IA-03 | confirmar transferência por I.A. | executar | cada atendimento é direcionado a uma fila; itens marcados como "redirecionado por I.A." |
| INT-IA-04 | após transferência | consultar resultado | total de atendimentos transferidos é informado |
| INT-IA-05 | filtro "Redirecionado por I.A." | aplicar | retorna apenas os marcados |

### 2.10 Configurações do chat  ·  ref @CEN-170..177

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-CFG-01 | "Usa SLA?" desligado | criar/avaliar atendimento | prazos automáticos não aplicados |
| INT-CFG-02 | "Tempo de espera" ligado (valor+unidade) | contato aguarda além do limite | alerta gerado |
| INT-CFG-03 | "Atribuir responsável" ligado | atendimento cai em "Sem fila específica" | atribuído a atendente do time ou, na ausência, a qualquer atendente |
| INT-CFG-04 | "Fechar automaticamente" ligado (período) | atendimento inativo além do período | fechado automaticamente |
| INT-CFG-05 | "Troca de produto = nova conversa" | trocar produto | nova conversa aberta |
| INT-CFG-06 | "Troca de produto = mesma conversa" | trocar produto | diálogo mantido na conversa atual |
| INT-CFG-07 | salvar configurações | persistir | parâmetros mantidos e aplicados aos próximos atendimentos |

### 2.11 Jornadas e Dashboard  ·  ref @CEN-180..182, @CEN-190..195

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-JOR-01 | conversas de jornada | listar | nome da jornada, contato, canal, prévia e não-lidas corretos |
| INT-JOR-02 | filtros de jornada | aplicar | lista refinada pelos critérios |
| INT-JOR-03 | conversa de jornada | "Transferir essa conversa" | passa a ser conduzida por atendente |
| INT-DSH-01 | base de conversas/mensagens | calcular KPIs | total de conversas, TMA, TME, aguardando, em atendimento, concluídas, sessões, total de mensagens corretos |
| INT-DSH-02 | filtro de período | recalcular | KPIs recalculados para o período |
| INT-DSH-03 | distribuição por canal/atendente | agregar | números coerentes com a base |
| INT-DSH-04 | solicitação de exportação | exportar | relatório disponibilizado |

---

## 3. Testes de aceitação ponta a ponta (`E2E-`)

> Cada um executa o fluxo do cenário BDD homônimo de ponta a ponta.

| ID | Fluxo | Ref BDD |
|---|---|---|
| E2E-01 | Selecionar fila → ver lista correta → abrir detalhe (preview) → expandir | @CEN-001, @CEN-201 |
| E2E-02 | Alternar escopo Meus/Todos/Favoritos/SLA e validar o recorte | @CEN-010..013 |
| E2E-03 | Favoritar na lista → filtrar por Favoritos → ver só os favoritados | @CEN-020, @CEN-012 |
| E2E-04 | Ativar visão por SLA → conferir ordenação → inverter ordem | @CEN-013, @CEN-032, @CEN-033 |
| E2E-05 | Trocar status pela lista e pelo detalhe → ver persistência | @CEN-040 |
| E2E-06 | Buscar por número, por nome e por CPF com e sem filtros | @CEN-060..064 |
| E2E-07 | Aplicar filtros avançados combinados | @CEN-070..075 |
| E2E-08 | Criar atendimento (com e sem fila) | @CEN-080, @CEN-081 |
| E2E-09 | Nova conversa: buscar contato → escolher canal → enviar 1ª mensagem | @CEN-090..093 |
| E2E-10 | Abrir conversa → enviar em vários canais → nota interna | @CEN-101, @CEN-110, @CEN-111 |
| E2E-11 | Finalizar conversa → confirmar bloqueio de envio | @CEN-120, @CEN-121 |
| E2E-12 | Transferir para fila e para atendente (com notificação) | @CEN-130..132 |
| E2E-13 | Detalhe: abas Conversas / Contato / Histórico | @CEN-140..142 |
| E2E-14 | Histórico do contato: consolidar + filtrar por fila/período/id | @CEN-150..154 |
| E2E-15 | Transferir por I.A. em "Sem fila" → confirmar → ver marcação e total | @CEN-160..163 |
| E2E-16 | Editar configurações do chat → salvar → validar efeito | @CEN-170..177 |
| E2E-17 | Jornadas: listar → filtrar → transferir conversa | @CEN-180..182 |
| E2E-18 | Dashboard: KPIs → filtrar período → exportar | @CEN-190..195 |

---

## 4. Testes negativos / validação / borda (`NEG-`)

| ID | Preparar | Executar | Verificar | Ref |
|---|---|---|---|---|
| NEG-01 | termo de busca sem correspondência | buscar | mensagem "nenhum resultado" | @CEN-066 |
| NEG-02 | etiqueta de SLA malformada | ordenar | item tratado como "sem SLA" (vai ao fim), sem erro | @CEN-030 |
| NEG-03 | criação sem fila | criar | bloqueio + sinalização do campo | @CEN-081 |
| NEG-04 | texto vazio/só espaços | enviar | não registra mensagem | @CEN-102 |
| NEG-05 | conversa finalizada | enviar | envio bloqueado | @CEN-121 |
| NEG-06 | mensagem acima de 1024 caracteres | enviar | bloqueio/aviso conforme regra | @CEN-103 |
| NEG-07 | "Transferir por I.A." fora de "Sem fila" | acionar | ação indisponível | @CEN-160 |
| NEG-08 | status fora do enum | aplicar | rejeitado | @CEN-041 |
| NEG-09 | filtro de período sem itens no intervalo | aplicar | lista vazia tratada (sem erro) | @CEN-070, @CEN-154 |
| NEG-10 | fila vazia | listar | estado vazio apresentado | @CEN-006 |

---

## 5. Testes não-funcionais (sugeridos) (`NF-`)

> Recomendados; limiares **[a definir]** com produto/arquitetura.

| ID | Tema | Verificação |
|---|---|---|
| NF-PERF-01 | Desempenho de listagem | listar fila grande dentro do tempo-alvo, com paginação |
| NF-PERF-02 | Desempenho de busca | busca multi-atributo dentro do tempo-alvo |
| NF-SEC-01 | Autorização por escopo | "Meus" não vaza atendimentos de outro atendente |
| NF-SEC-02 | Permissão de visualização | regra de visualização de conversas não atribuídas respeitada (não vê / vê sem responder / vê e responde) — ref @CEN-175 |
| NF-RT-01 | Tempo real | nova mensagem e contadores de não-lidas/fila atualizam sem recarregar |
| NF-I18N-01 | Localização | textos, datas e ordenação alfabética em pt-BR |
| NF-A11Y-01 | Acessibilidade | ações principais operáveis por teclado e com rótulos |

---

## 6. Matriz de rastreabilidade (resumo)

| Funcionalidade (BDD) | Cenários | Testes |
|---|---|---|
| Listagem por fila | @CEN-001..006 | UT-QUEUE-*, INT-LST-01/07, NEG-10, E2E-01 |
| Escopo | @CEN-010..014 | INT-LST-02..06, E2E-02, NF-SEC-01 |
| Favoritos | @CEN-020..022 | INT-FAV-*, E2E-03 |
| SLA | @CEN-030..034 | UT-SLA-*, INT-LST-05, E2E-04, NEG-02 |
| Status | @CEN-040..041 | INT-ST-*, NEG-08, E2E-05 |
| Marcadores | @CEN-050..053 | UT-MARK-*, INT-MK-*, |
| Busca | @CEN-060..067 | UT-SRCH-*, E2E-06, NEG-01 |
| Filtros avançados | @CEN-070..075 | E2E-07, NEG-09 |
| Criar/editar | @CEN-080..083 | INT-CRT-*, NEG-03, E2E-08 |
| Nova conversa | @CEN-090..093 | INT-CV-05, E2E-09 |
| Conversa/thread | @CEN-100..104 | UT-MSG-*, INT-CV-01..04, NEG-04..06, E2E-10/11 |
| Canais | @CEN-110..111 | INT-CV-01/02, E2E-10 |
| Finalizar | @CEN-120..122 | INT-CV-03/04, NEG-05, E2E-11 |
| Transferir | @CEN-130..133 | INT-TR-*, E2E-12 |
| Detalhe (abas) | @CEN-140..143 | UT-AGG-*, E2E-13 |
| Histórico do contato | @CEN-150..154 | INT-HC-*, E2E-14 |
| I.A. | @CEN-160..163 | INT-IA-*, NEG-07, E2E-15 |
| Configurações | @CEN-170..177 | INT-CFG-*, E2E-16, NF-SEC-02 |
| Jornadas | @CEN-180..182 | INT-JOR-*, E2E-17 |
| Dashboard | @CEN-190..195 | INT-DSH-*, E2E-18 |
| Navegação | @CEN-200..201 | E2E-01 |

---

## 7. Definition of Done (critério de aprovação da tarefa)

A tarefa é considerada **aprovada** quando:

1. **100%** dos testes `UT-` (regras puras) passam — são determinísticos e não têm desculpa para falhar.
2. **100%** dos testes `INT-` e `E2E-` mapeados aos cenários BDD passam.
3. Todos os testes `NEG-` passam (entradas inválidas e estados proibidos tratados sem erro não controlado).
4. Cada cenário `@CEN-XXX` possui **ao menos um** teste correspondente verde (ver matriz).
5. As regras marcadas **[regra a definir]** foram alinhadas com produto e têm teste refletindo a decisão.
6. Testes `NF-` executados (ou com limiares acordados e itens fora do escopo registrados).

> Sugestão de ordem TDD: **UT → INT → E2E**. Comece pelas regras puras
> (SLA, busca, contadores), depois as operações de domínio, por último os fluxos.
