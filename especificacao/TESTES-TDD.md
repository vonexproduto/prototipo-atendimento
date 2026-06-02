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

### 1.8 Estrutura de filas  ·  ref @CEN-002, @CEN-003, @CEN-004, @CEN-004B

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| UT-QUEUE-01 | operação com filas-filhas | coletar filas-folha | retorna as filas-filhas (não a operação-pai) |
| UT-QUEUE-02 | fila-folha sem filhos | coletar filas-folha | retorna a própria fila |
| UT-QUEUE-03 | contagem da operação | somar filhos | contador da operação = soma dos contadores das filhas |
| UT-QUEUE-04 | árvore contendo "Sem operação específica" → "Sem fila específica" | listar destinos de transferência | nem a operação-pai nem a fila órfã aparecem como destino |
| UT-QUEUE-05 | árvore inicial | montar estado de expansão default | "Sem operação específica" e "Operação de Suporte" começam expandidas |

### 1.9 Ordenação por coluna (modelo unificado)  ·  ref @CEN-035, @CEN-053..055, @CEN-250..253

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| UT-SORT-01 | lista por marcador, direção `asc` | ordenar | A → Z; sem marcador por último |
| UT-SORT-02 | lista por marcador, direção `desc` | ordenar | Z → A; sem marcador por último |
| UT-SORT-03 | lista por `dataInicio`, direção `desc` | ordenar | mais recentes primeiro |
| UT-SORT-04 | lista por `dataInicio`, direção `asc` | ordenar | mais antigos primeiro |
| UT-SORT-05 | lista por `dataAtualizacao`, direção `desc` | ordenar | maior `dataAtualizacao` primeiro |
| UT-SORT-06 | lista por `sla`, direção `asc` | ordenar | minutos crescentes (mais atrasados primeiro) |
| UT-SORT-07 | lista por `sla`, direção `desc` | ordenar | minutos decrescentes |
| UT-SORT-08 | sort com escopo `page` (tamanho P) | ordenar | apenas os primeiros P itens são reordenados; tail intocado |
| UT-SORT-09 | sort com escopo `all` | ordenar | toda a lista é reordenada |
| UT-SORT-10 | sortConfig nulo + modo SLA ativo | resolver effectiveSortConfig | retorna `{column:"sla", mode:"all", direction:"asc"}` |
| UT-SORT-11 | escolher outra coluna com sort ativo | aplicar novo sort | substitui o anterior — apenas 1 coluna ordenada por vez |

### 1.10 Cálculo de "Data de atualização"  ·  ref @CEN-007, @CEN-255

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| UT-UPD-01 | atendimento com 1 mensagem em T1 e troca de status em T2 (T2 > T1) | calcular `dataAtualizacao` | resultado = T2 |
| UT-UPD-02 | atendimento sem atividade após criação | calcular `dataAtualizacao` | resultado = `dataInicio` |
| UT-UPD-03 | duas mensagens, a 2ª em T2 | calcular | resultado = T2 |
| UT-UPD-04 | parse do formato "DD/MM/YY - HH:mm" (ex.: `"31/12/25 - 14:32"`) | converter | timestamp epoch válido |
| UT-UPD-05 | string inválida ou vazia | converter | retorna 0 (sentinel) sem lançar exceção |

### 1.11 Pesquisa: cálculo de paginação e janela de botões  ·  ref @CEN-068E, @CEN-068H

| ID | Entrada | Saída esperada |
|---|---|---|
| UT-PAG-01 | 12 itens, pageSize 10 | totalPages = 2 |
| UT-PAG-02 | 3000 itens, pageSize 10 | totalPages = 300 |
| UT-PAG-03 | página 1 de 300 | janela visível = `[1,2,3,4,5,…,300]` |
| UT-PAG-04 | página 150 de 300 | janela visível = `[1,…,148,149,150,151,152,…,300]` |
| UT-PAG-05 | página 300 de 300 | janela visível = `[1,…,296,297,298,299,300]` |
| UT-PAG-06 | página 1 | botão `←` desabilitado |
| UT-PAG-07 | página N (última) | botão `→` desabilitado |
| UT-PAG-08 | mudar termo ou filtro | reset → `page = 1` |

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

### 2.12 Pesquisa em duas fases  ·  ref @CEN-068..069C

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-SRCH-20 | termo digitado | observar saída do back-end | primeiro retorno restringe a `period=last30` (ou equivalente) |
| INT-SRCH-21 | recente devolveu < pageSize itens | observar segundo retorno | back-end aceita pedido de histórico completo (`period=all`) na sequência |
| INT-SRCH-22 | recente devolveu ≥ pageSize itens | observar | a UI pode optar por não pedir o histórico completo nessa fase (decisão de UX) |
| INT-SRCH-23 | recente devolveu 0 itens | observar | UI pula direto para o estágio de histórico completo (sem indicador "buscando histórico completo") |
| INT-SRCH-24 | resultado total > pageSize | requisitar página N | back-end devolve subconjunto correto + total |
| INT-SRCH-25 | mesma busca + mudança de filtros | nova requisição | reseta para `page=1`, `period=last30` |

### 2.13 Filtro de contato na pesquisa  ·  ref @CEN-068F, @CEN-068G

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-CFILT-01 | resultados contêm contato C com 5 atendimentos | ativar filtro pelo contato C | lista de atendimentos é reduzida a 5 |
| INT-CFILT-02 | filtro de contato ativo | clicar funil do mesmo contato | filtro é removido (toggle) |
| INT-CFILT-03 | filtro ativo e atendente muda o termo de busca | observar | filtro de contato é descartado |
| INT-CFILT-04 | filtro ativo | observar paginação | recalculada sobre o subconjunto filtrado |

### 2.14 Filtro de Marcadores na lista  ·  ref @CEN-076, @CEN-077

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-MFILT-01 | atendimentos com marcadores `["Pagamento", "Urgente"]` | filtrar por "Pagamento" | retorna apenas atendimentos com "Pagamento" |
| INT-MFILT-02 | multi-seleção `["Pagamento", "Urgente"]` | filtrar | retorna atendimentos com pelo menos UM dos marcadores |
| INT-MFILT-03 | dropdown de marcadores | observar lista | inclui apenas marcadores efetivamente em uso, em ordem alfabética pt-BR |
| INT-MFILT-04 | dropdown aberto + termo "Pag" | filtrar opções | mostra "Pagamento" |

### 2.15 Vincular conversa a outro atendimento  ·  ref @CEN-210..216

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-LINK-01 | conversa C em A1 | escolher "criar novo atendimento" | A_novo é criado na fila atual; C migra para A_novo; A1 deixa de conter C |
| INT-LINK-02 | busca com chips ativos | buscar termo | resultados respeitam interseção dos atributos selecionados (Atendimento/Operação/Atendente/Contato) |
| INT-LINK-03 | resultados | observar | A1 nunca aparece (próprio atendimento é excluído) |
| INT-LINK-04 | vincular C a A2 existente | confirmar | C.atendimento_id passa a A2; A1 deixa de conter C |
| INT-LINK-05 | falha simulada na API | tentar vincular | UI dispara notificação de erro; C permanece em A1 |
| INT-LINK-06 | resultados de busca | acionar "visualizar" em A2 | preview read-only é aberto; modal de busca permanece por baixo |

### 2.16 Trazer conversa de outro atendimento  ·  ref @CEN-220..224

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-BRING-01 | atendente em A2 | abrir modal "trazer conversa" | busca multi-atributo é exibida (Conversa/Atendimento/Contato/Atendente) |
| INT-BRING-02 | conversas existentes em A2 | observar resultados | conversas que já pertencem a A2 são excluídas |
| INT-BRING-03 | confirmar "trazer" em C (originalmente em A1) | executar | C.atendimento_id ← A2; A1 deixa de conter C |
| INT-BRING-04 | acionar "visualizar" em C | observar preview | preview abre A1 com `initialConvId = C.id` (foco na conversa procurada) |
| INT-BRING-05 | falha na API | tentar trazer | UI dispara notificação de erro; estado permanece |

### 2.17 Preview read-only de atendimento  ·  ref @CEN-230..235

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-PREV-01 | preview aberto | inspecionar header | exibe id, tipo e badge "Somente leitura" |
| INT-PREV-02 | preview de atendimento com N conversas | trocar conversa selecionada | thread atualiza para a conversa escolhida |
| INT-PREV-03 | preview aberto sem `initialConvId` | observar | a primeira conversa da lista é a inicial |
| INT-PREV-04 | preview aberto com `initialConvId` válido | observar | a conversa correspondente é a inicial |
| INT-PREV-05 | preview aberto | inspeção visual | NÃO há composer, NÃO há botões de ação (vincular/trazer/alterar fila/finalizar/marcadores/novo) |
| INT-PREV-06 | preview aberto + Esc | pressionar Esc | preview é fechado |
| INT-PREV-07 | preview aberto + click fora | clicar backdrop | preview é fechado |
| INT-PREV-08 | atendimento sem conversas | abrir preview | estado vazio é apresentado |

### 2.18 Notificações de feedback (snackbar)  ·  ref @CEN-240..244

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-SNACK-01 | disparar notificação `success` | observar | aparece com ícone/tom de sucesso e mensagem informada |
| INT-SNACK-02 | disparar notificação `error` | observar | aparece com ícone/tom de erro e mensagem informada |
| INT-SNACK-03 | notificação visível | aguardar timeout | desaparece automaticamente após o intervalo configurado |
| INT-SNACK-04 | notificação visível | clicar no fechar | desaparece imediatamente |
| INT-SNACK-05 | notificação A em exibição | disparar notificação B | A é substituída por B (ou política definida) |

### 2.19 Configuração "Fechar conversas automaticamente"  ·  ref @CEN-178

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-CFG-08 | toggle ligado, período 7 dias, conversa C inativa por 8 dias | aplicar regra | apenas C é encerrada; o atendimento que a contém permanece ativo |
| INT-CFG-09 | toggle desligado | aplicar | nenhuma conversa é encerrada automaticamente |
| INT-CFG-10 | valor + unidade inválidos (ex.: 0 minutos) | salvar | rejeitado/sinalizado conforme regra **[a definir]** |

### 2.20 Visão Gantt  ·  ref @CEN-260..263

| ID | Preparar | Executar | Verificar |
|---|---|---|---|
| INT-GANTT-01 | conjunto de atendimentos com janelas distintas | abrir visão Gantt | cada atendimento aparece como uma barra entre `dataInicio` e `dataAtualizacao`/agora |
| INT-GANTT-02 | atendimento "em andamento" | observar | a barra estende-se até o marcador "agora" |
| INT-GANTT-03 | total excede pageSize | navegar entre páginas | apenas os itens da página atual são renderizados |
| INT-GANTT-04 | clicar em uma barra | executar | abre o detalhe do atendimento correspondente |

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
| E2E-19 | Pesquisa: digitar termo → skeleton → recentes (últimos 30 dias) → loading-more → completo com paginação | @CEN-068..069C |
| E2E-20 | Pesquisa: filtrar pelos atendimentos de um contato (funil) → limpar (toggle) | @CEN-068F, @CEN-068G |
| E2E-21 | Pesquisa: navegar entre páginas (← N → / janela compacta) | @CEN-068E, @CEN-068H |
| E2E-22 | Filtros avançados: combinar Marcadores + Status + SLA | @CEN-076, @CEN-075 |
| E2E-23 | Ordenação: marcar coluna A → trocar para coluna B (substitui) → limpar | @CEN-250..253 |
| E2E-24 | SLA: entrar no escopo SLA → trocar direção via header → trocar escopo página/todos | @CEN-013, @CEN-033, @CEN-035, @CEN-036 |
| E2E-25 | Vincular conversa: criar novo atendimento → notificação de sucesso | @CEN-211, @CEN-240 |
| E2E-26 | Vincular conversa: buscar existente → visualizar (preview) → confirmar → notificação | @CEN-212..215, @CEN-240 |
| E2E-27 | Trazer conversa: buscar → visualizar (preview focado em initialConvId) → confirmar → notificação | @CEN-220..223, @CEN-240 |
| E2E-28 | Preview read-only: abrir → trocar conversa lateral → fechar (Esc / backdrop / botão) | @CEN-230..234 |
| E2E-29 | Gantt: abrir visão → paginar → clicar em barra → abrir detalhe | @CEN-260..263 |
| E2E-30 | Snackbar: provocar erro → mensagem → fechar manual | @CEN-241, @CEN-243 |
| E2E-31 | "Sem operação específica" → expandir → selecionar "Sem fila específica" → listar | @CEN-004, @CEN-004A |
| E2E-32 | Configurações: ligar "Fechar conversas automaticamente" → conversa expira → conversa encerrada (atendimento intacto) | @CEN-178 |

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
| NEG-11 | vincular conversa em A1 ao próprio A1 | tentar | impossível: A1 nem aparece nos resultados | @CEN-213 |
| NEG-12 | trazer uma conversa que já pertence ao atendimento atual | tentar | impossível: a conversa não aparece nos resultados | @CEN-221 |
| NEG-13 | preview read-only | tentar disparar ação de alteração | nenhum botão de alteração existe | @CEN-232 |
| NEG-14 | filtro de Marcadores com lista vazia (nenhum marcador em uso) | abrir dropdown | exibe estado vazio sem erro | @CEN-077 |
| NEG-15 | API de vincular/trazer retorna erro | acionar | notificação de erro; estado anterior preservado | @CEN-216, @CEN-224 |
| NEG-16 | mudar termo de busca com filtro de contato ativo | digitar | filtro de contato é descartado automaticamente | @CEN-068D |
| NEG-17 | escolher destino "Sem fila específica" na transferência | abrir seletor | opção não aparece como destino | @CEN-004B |
| NEG-18 | sort `mode=page` em uma fila com menos itens que o tamanho de página | aplicar | comportamento equivale a `all` (sem efeito visível) — não quebra | @CEN-251 |
| NEG-19 | clique no ícone "Relatórios" (estado provisório) | clicar | nenhuma navegação ocorre; atendente segue na tela atual | @CEN-200A |

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
| Listagem por fila | @CEN-001..008 | UT-QUEUE-*, UT-UPD-*, INT-LST-01/07, NEG-10/17, E2E-01/31 |
| Escopo | @CEN-010..014 | INT-LST-02..06, E2E-02, NF-SEC-01 |
| Favoritos | @CEN-020..022 | INT-FAV-*, E2E-03 |
| SLA | @CEN-030..036 | UT-SLA-*, UT-SORT-06/07/10, INT-LST-05, E2E-04/24, NEG-02 |
| Status | @CEN-040..041 | INT-ST-*, NEG-08, E2E-05 |
| Marcadores | @CEN-050..055 | UT-MARK-*, UT-SORT-01/02/08/09, INT-MK-*, E2E-23 |
| Busca | @CEN-060..067 | UT-SRCH-*, E2E-06, NEG-01 |
| Busca: loading e paginação | @CEN-068..069C | UT-PAG-*, INT-SRCH-20..25, INT-CFILT-*, E2E-19/20/21, NEG-16 |
| Filtros avançados | @CEN-070..077 | INT-MFILT-*, E2E-07/22, NEG-09/14 |
| Criar/editar | @CEN-080..083 | INT-CRT-*, NEG-03, E2E-08 |
| Nova conversa | @CEN-090..093 | INT-CV-05, E2E-09 |
| Conversa/thread | @CEN-100..104 | UT-MSG-*, INT-CV-01..04, NEG-04..06, E2E-10/11 |
| Canais | @CEN-110..111 | INT-CV-01/02, E2E-10 |
| Finalizar | @CEN-120..122 | INT-CV-03/04, NEG-05, E2E-11 |
| Transferir (entre filas/atendentes) | @CEN-130..133 | INT-TR-*, E2E-12 |
| Detalhe (abas) | @CEN-140..143 | UT-AGG-*, E2E-13 |
| Histórico do contato | @CEN-150..154 | INT-HC-*, E2E-14 |
| I.A. | @CEN-160..163 | INT-IA-*, NEG-07, E2E-15 |
| Configurações | @CEN-170..178 | INT-CFG-*, E2E-16/32, NF-SEC-02 |
| Jornadas | @CEN-180..182 | INT-JOR-*, E2E-17 |
| Dashboard | @CEN-190..195 | INT-DSH-*, E2E-18 |
| Navegação | @CEN-200..201 | E2E-01, NEG-19 |
| Vincular conversa | @CEN-210..216 | INT-LINK-*, E2E-25/26, NEG-11/15 |
| Trazer conversa | @CEN-220..224 | INT-BRING-*, E2E-27, NEG-12/15 |
| Preview read-only | @CEN-230..235 | INT-PREV-*, E2E-28, NEG-13 |
| Notificações (snackbar) | @CEN-240..244 | INT-SNACK-*, E2E-25..27/30 |
| Sort unificado | @CEN-250..255 | UT-SORT-*, E2E-23/24, NEG-18 |
| Gantt | @CEN-260..263 | INT-GANTT-*, E2E-29 |

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
