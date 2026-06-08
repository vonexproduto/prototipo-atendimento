# Especificação de Cenários de Uso (BDD / Gherkin)
## CCM — Atendimentos e Conversas

> **Público-alvo:** time de desenvolvimento — **principalmente Back-end** (regras de
> negócio, persistência, validações), secundariamente Front-end (comportamento de tela).
>
> **O que este documento é:** a descrição dos **cenários de uso** e **regras de
> negócio** observáveis no protótipo, no formato Gherkin (**Dado / Quando / Então**).
>
> **O que este documento NÃO é:** não define arquitetura, banco de dados, endpoints,
> framework ou linguagem. Não conheço a stack de vocês — os nomes de entidades abaixo
> são a **linguagem ubíqua do domínio** (não nomes de tabela/coluna). Onde uma regra
> depende de decisão técnica (ex.: limiar de "próximo ao prazo"), está marcado como
> **[regra a definir]**.
>
> **Origem:** derivado do protótipo de alta fidelidade em React (`melhoria atendimento 2/`).
> Casos de teste correspondentes em [`TESTES-TDD.md`](TESTES-TDD.md).

---

## Como ler

- `Funcionalidade` — agrupa cenários de um mesmo recurso.
- `Contexto` — pré-condições comuns a todos os cenários da funcionalidade.
- `Cenário` / `Esquema do Cenário` (com `Exemplos`) — caso de uso.
- `Dado` (estado inicial) · `Quando` (ação) · `Então` (resultado esperado) · `E` / `Mas` (continuações).
- Cada cenário tem um identificador `@CEN-XXX` para rastreabilidade com os testes.

---

## Glossário de entidades (linguagem do domínio)

| Entidade | Descrição | Campos observados no protótipo |
|---|---|---|
| **Atendimento** (ticket) | Caso de atendimento; agrupa 1..N conversas e 1..N contatos/atendentes. | id, título, **dataInício**, **dataAtualização** (última atividade), status, slaTag, marcadores[], contatos[], atendentes[], conversas[], tipo/fila |
| **Conversa** (talk) | Diálogo dentro de um atendimento, em um canal. | id, canal, status, contato, fila, preview, não-lidas (unread), mensagens[] |
| **Mensagem** | Item de uma conversa. | id, papel (contato/atendente) **ou** tipo=sistema, texto, dataHora, canal, autor, reações[] |
| **Contato** | Pessoa atendida. | id, nome, telefone, e-mail, CPF, iniciais |
| **Atendente** | Operador. | id, nome, iniciais |
| **Fila / Operação** | Estrutura hierárquica de até 2 níveis (Operação → Fila). Há o par especial **"Sem operação específica" → "Sem fila específica"** que recebe atendimentos órfãos. | id, nome, ícone, contador, filhos[] |
| **Marcador** (tag) | Rótulo aplicável a atendimento/conversa. | label, cor |
| **Jornada** | Conversa conduzida automaticamente por automação. | id, nome da jornada, contato, canal, mensagens[] |
| **Notificação efêmera** (snackbar) | Feedback transitório de sucesso ou erro após uma ação. | mensagem, tipo (`success`/`error`), duração |

### Enumerações

- **Status do atendimento:** `Aberto`, `Em andamento`, `Pendente`, `Pausado`, `Cancelado`, `Encerrado`, `Finalizado`.
  (No protótipo, o seletor de troca de status oferece: **Em andamento, Cancelado, Pausado, Finalizado**.) **[regra a definir: máquina de estados/transições permitidas]**
- **Status da conversa:** `Aberta`, `Finalizada`.
- **Canais:** `WhatsApp`, `WhatsApp Web`, `SMS`, `Torpedo` (voz), `E-mail`, `RCS`, `Nota interna`.
- **Escopo de visualização:** `Meus`, `Todos`, `Favoritos`, `SLA`.
- **Classificação de SLA:** `No prazo` (tempo positivo), `Próximo ao prazo` **[regra a definir: limiar]**, `Atrasado` (tempo negativo).
- **Redirecionamento por I.A.:** `Sim` / `Não`.

### Convenções de SLA

O prazo é representado por uma etiqueta com **sinal + número + unidade** (`d`=dia, `h`=hora, `m`=minuto). Ex.: `-1d`, `+3h`, `-30m`, `+2d`.
- Sinal **negativo** = **atrasado** (passou do prazo). Quanto mais negativo, mais atrasado.
- Sinal **positivo** = dentro do prazo (tempo restante).
- Para ordenação, a etiqueta é convertida em minutos: `d×1440`, `h×60`, `m×1`, com o sinal.

---

# 1. Listagem de atendimentos

```gherkin
Funcionalidade: Listar atendimentos por fila
  Para gerenciar o trabalho do time
  Como atendente
  Quero ver os atendimentos da fila selecionada

  Contexto:
    Dado que existe uma estrutura de filas e operações
    E que existem atendimentos vinculados às filas
    E que o atendente está autenticado

  @CEN-001
  Cenário: Listar atendimentos da fila selecionada
    Dado que o atendente seleciona a fila "Atendimento ao cliente"
    Quando a lista de atendimentos é carregada
    Então o sistema retorna apenas os atendimentos pertencentes a essa fila
    E cada atendimento exibe: id, nome do contato principal, data de início,
      marcadores, contatos, atendentes, quantidade de conversas, status e SLA

  @CEN-002
  Cenário: Selecionar uma operação com filas-filhas
    Dado que a operação "Operação de Suporte" possui filas-filhas
    Quando o atendente seleciona a operação
    Então o sistema considera os atendimentos de todas as filas-filhas da operação

  @CEN-003
  Cenário: Contador da fila reflete a quantidade real de atendimentos
    Quando o sistema apresenta a árvore de filas
    Então o contador exibido em cada fila é igual ao número de atendimentos
      efetivamente atribuídos àquela fila

  @CEN-004
  Cenário: Fila "Sem fila específica" vive dentro de "Sem operação específica"
    Dado que existem atendimentos sem fila/operação definida
    Quando o sistema apresenta a árvore de filas
    Então a operação "Sem operação específica" aparece no topo da árvore
    E é apresentada já expandida por padrão
    E contém uma única fila-filha chamada "Sem fila específica"
    E o contador da operação é igual ao contador da fila órfã

  @CEN-004A
  Cenário: Filtrar pelos atendimentos da fila "Sem fila específica"
    Quando o atendente seleciona a fila "Sem fila específica"
    Então o sistema retorna os atendimentos ainda não roteados a uma fila

  @CEN-004B
  Cenário: "Sem fila específica" não pode ser destino de transferência
    Quando o atendente abre o seletor de filas para transferir um atendimento
    Então a fila "Sem fila específica" não aparece como opção de destino
    E nem a operação-pai "Sem operação específica"

  @CEN-007
  Cenário: Coluna "Data de atualização"
    Dado um atendimento com atividade registrada (nova mensagem, troca de status, etc.)
    Quando a lista de atendimentos é apresentada
    Então cada linha exibe a data/hora da última atualização do atendimento
    E é distinta da "Data de início" (que se refere à criação)

  @CEN-008
  Cenário: Paginação real da lista (rolagem em N páginas)
    Dado que o número total de atendimentos é maior que o tamanho de página
    Quando o atendente navega pelos botões de paginação
    Então o sistema retorna o subconjunto correspondente
    E exibe o intervalo de itens (X–Y de N) e o número da página atual

  @CEN-005
  Cenário: Paginação da lista
    Dado que a fila possui mais atendimentos do que o tamanho da página
    Quando o atendente navega entre as páginas
    Então o sistema retorna o subconjunto correspondente
    E informa o total de itens e a página atual

  @CEN-006
  Cenário: Lista vazia
    Dado que a fila selecionada não possui atendimentos
    Quando a lista é carregada
    Então o sistema indica que não há atendimentos para exibir
```

---

# 2. Escopo de visualização (Meus / Todos / Favoritos / SLA)

```gherkin
Funcionalidade: Filtrar atendimentos por escopo
  Como atendente
  Quero alternar entre meus atendimentos, todos, favoritos e visão por SLA

  @CEN-010
  Cenário: Escopo "Meus"
    Dado que o atendente "Camila Alves" está autenticado
    Quando o escopo "Meus" está ativo
    Então o sistema retorna apenas atendimentos em que esse atendente participa

  @CEN-011
  Cenário: Escopo "Todos"
    Quando o escopo "Todos" está ativo
    Então o sistema retorna os atendimentos da fila sem filtrar por atendente

  @CEN-012
  Cenário: Escopo "Favoritos"
    Dado que o atendente marcou alguns atendimentos como favoritos
    Quando o escopo "Favoritos" está ativo
    Então o sistema retorna somente os atendimentos favoritados
    E oculta as filas que não possuem nenhum atendimento favoritado

  @CEN-013
  Cenário: Escopo "SLA" (visão global)
    Quando o escopo "SLA" está ativo
    Então o sistema retorna os atendimentos de todas as filas e operações
    E os ordena pelo atraso (mais atrasados primeiro, por padrão)
    E o recorte por fila é ignorado nesse modo

  @CEN-014
  Cenário: Persistência do escopo entre sessões
    Dado que o atendente selecionou o escopo "Favoritos"
    Quando ele encerra e reabre a aplicação
    Então o sistema mantém o escopo "Favoritos" como ativo
```

---

# 3. Favoritar atendimentos

```gherkin
Funcionalidade: Favoritar atendimentos
  Como atendente
  Quero marcar atendimentos como favoritos para acompanhá-los

  @CEN-020
  Cenário: Marcar como favorito
    Dado um atendimento não favoritado
    Quando o atendente o marca como favorito
    Então o atendimento passa a constar entre os favoritos do atendente
    E a marcação é persistida

  @CEN-021
  Cenário: Desmarcar favorito
    Dado um atendimento favoritado
    Quando o atendente remove a marcação
    Então o atendimento deixa de constar entre os favoritos

  @CEN-022
  Cenário: Favoritos são por atendente
    Dado que o atendente A favoritou o atendimento X
    Quando o atendente B consulta seus favoritos
    Então o atendimento X não aparece para o atendente B
```

---

# 4. Ordenação e classificação por SLA

```gherkin
Funcionalidade: Ordenar e classificar por SLA
  Como atendente
  Quero priorizar atendimentos pelo prazo

  @CEN-030
  Esquema do Cenário: Converter etiqueta de SLA em tempo (minutos)
    Quando o sistema interpreta a etiqueta de SLA "<tag>"
    Então o valor em minutos é <minutos>

    Exemplos:
      | tag   | minutos |
      | -1d   | -1440   |
      | +3h   | 180     |
      | -30m  | -30     |
      | +2d   | 2880    |
      | -1m   | -1      |
      | -5d   | -7200   |

  @CEN-031
  Esquema do Cenário: Classificar SLA
    Dado um atendimento com etiqueta de SLA "<tag>"
    Então sua classificação é "<classificacao>"

    Exemplos:
      | tag  | classificacao |
      | -1d  | Atrasado      |
      | +6h  | No prazo      |

  @CEN-032
  Cenário: Ordenar do mais atrasado para o menos atrasado
    Dado um conjunto de atendimentos com SLAs distintos
    Quando a ordenação por SLA ascendente é aplicada
    Então os atendimentos mais atrasados (mais negativos) vêm primeiro

  @CEN-033
  Cenário: Inverter a ordem do SLA
    Dado que a visão por SLA está ordenada com mais atrasados primeiro
    Quando o atendente abre o modal de ordenação da coluna "SLA"
    E seleciona a direção "Mais atrasados último"
    Então os menos atrasados passam a vir primeiro

  @CEN-034
  Cenário: SLA desabilitado nas configurações
    Dado que a configuração "Usa SLA?" está desligada
    Então o sistema não aplica prazos automáticos aos atendimentos

  @CEN-035
  Cenário: Ordenação por SLA acionada pelo cabeçalho da coluna
    Dado que o atendente está na visão por SLA
    Quando ele clica no cabeçalho da coluna "SLA"
    Então o sistema abre o modal de ordenação com seções "Direção" e "Escopo"
    E a direção padrão é "Mais atrasados primeiro"
    E o escopo padrão é "todos os atendimentos"

  @CEN-036
  Cenário: Modo SLA sem ordenação explícita assume default por SLA
    Dado que o atendente entra no escopo "SLA" sem ter ordenado nenhuma coluna
    Então o sistema ordena automaticamente por SLA, escopo "todos", direção "asc"
    E o cabeçalho da coluna "SLA" aparece destacado como ativo
```

---

# 5. Alterar status do atendimento

```gherkin
Funcionalidade: Alterar status do atendimento
  Como atendente
  Quero mudar o status de um atendimento

  @CEN-040
  Esquema do Cenário: Trocar status
    Dado um atendimento com status "<origem>"
    Quando o atendente altera o status para "<destino>"
    Então o atendimento passa a ter o status "<destino>"
    E a mudança é persistida

    Exemplos:
      | origem      | destino      |
      | Aberto      | Em andamento |
      | Em andamento| Pausado      |
      | Pausado     | Em andamento |
      | Em andamento| Finalizado   |
      | Aberto      | Cancelado    |

  @CEN-041
  Cenário: Status inválido é rejeitado
    Quando se tenta atribuir um status fora da lista de status válidos
    Então o sistema rejeita a alteração
```

---

# 6. Marcadores (tags)

```gherkin
Funcionalidade: Marcadores de atendimento e conversa
  Como atendente
  Quero aplicar e remover marcadores

  @CEN-050
  Cenário: Aplicar marcador a uma conversa
    Dado uma conversa sem o marcador "Urgente"
    Quando o atendente aplica o marcador "Urgente"
    Então a conversa passa a exibir o marcador "Urgente"

  @CEN-051
  Cenário: Remover marcador
    Dado uma conversa com o marcador "Pagamento"
    Quando o atendente remove o marcador
    Então a conversa deixa de exibir o marcador

  @CEN-052
  Cenário: Listar marcadores disponíveis
    Quando o atendente abre o seletor de marcadores
    Então o sistema lista os marcadores cadastrados que ainda não foram aplicados
    E permite filtrar a lista por texto

  @CEN-053
  Cenário: Ordenar a lista de atendimentos por marcador
    Quando o atendente ordena a lista por marcador
    Então os atendimentos são agrupados/ordenados pelo rótulo do primeiro marcador
    E atendimentos sem marcador vão para o fim
    E a ordenação pode ser aplicada apenas à página atual ou a todos os itens

  @CEN-054
  Cenário: Direção de ordenação por marcador
    Dado que o atendente abriu o modal de ordenação da coluna "Marcadores"
    Quando ele seleciona a direção "Z → A (alfabético)"
    Então a ordenação passa a ser decrescente pelo rótulo do primeiro marcador

  @CEN-055
  Cenário: Reordenar marcadores em "apenas página"
    Dado que a coluna "Marcadores" está ordenada com escopo "página"
    Quando a página atual contém os N primeiros itens
    Então só esses N itens são reordenados por marcador
    E as páginas subsequentes mantêm a ordem original
```

---

# 7. Busca de atendimentos e contatos

```gherkin
Funcionalidade: Buscar atendimentos e contatos
  Como atendente
  Quero localizar atendimentos e contatos por diferentes atributos

  Contexto:
    Dado que a busca pode ser restringida por filtros (multi-seleção):
      Atendimento, Operação, Atendente, Dados do contato, Conversa
    E que "Dados do contato" possui subcampos: ID, Nome, E-mail, Telefone, CPF
    E que sem nenhum filtro selecionado a busca considera todos os atributos

  @CEN-060
  Cenário: Busca sem filtros consulta todos os atributos
    Dado que nenhum filtro está selecionado
    Quando o atendente busca por um termo
    Então o sistema procura o termo em atendimento, operação, atendente, contato e conversa

  @CEN-061
  Cenário: Busca por número do atendimento
    Dado que o filtro "Atendimento" está ativo
    Quando o atendente busca por "123456"
    Então o sistema retorna o atendimento cujo id corresponde

  @CEN-062
  Esquema do Cenário: Busca por dados do contato
    Dado que o filtro "Dados do contato" está ativo com o subcampo "<campo>"
    Quando o atendente busca por "<termo>"
    Então o sistema retorna os contatos cujo <campo> corresponde ao termo

    Exemplos:
      | campo    | termo                 |
      | Nome     | Flavia                |
      | E-mail   | flavia@email.com      |
      | Telefone | 21997000100           |
      | CPF      | 11122233344           |

  @CEN-063
  Cenário: Normalização de texto (acentuação e caixa)
    Quando o atendente busca por "flavia"
    Então o sistema encontra "Flávia" (ignorando acentos e diferença de maiúsculas/minúsculas)

  @CEN-064
  Cenário: Normalização de números (telefone e CPF)
    Quando o atendente busca por "024.676.678-90"
    Então o sistema encontra o contato cujo CPF corresponde aos mesmos dígitos
      ignorando pontuação

  @CEN-065
  Cenário: Resultados agrupados em contatos e atendimentos
    Quando a busca retorna correspondências
    Então o sistema apresenta os contatos e os atendimentos correspondentes separadamente
    E informa a quantidade de cada grupo

  @CEN-066
  Cenário: Nenhum resultado
    Quando a busca não encontra correspondências
    Então o sistema informa que nenhum resultado foi encontrado

  @CEN-067
  Cenário: Pesquisas recentes
    Dado que o atendente realizou buscas anteriormente
    Quando ele abre a busca sem digitar nada
    Então o sistema sugere as pesquisas recentes

  @CEN-068
  Cenário: Skeleton durante a busca inicial
    Dado que o atendente digitou um termo de busca
    Quando o sistema ainda não recebeu os primeiros resultados do servidor
    Então é apresentado um indicador de carregamento (skeleton/placeholder)
    E o cabeçalho do resultado exibe "Buscando '<termo>'…" com um spinner

  @CEN-069
  Cenário: Primeira leva de resultados — "Últimos 30 dias"
    Dado que a busca foi disparada
    Quando o servidor retorna os atendimentos do período recente (últimos 30 dias)
    Então a lista de atendimentos é exibida com a indicação "últimos 30 dias"
    E o resumo informa "X de N atendimentos (últimos 30 dias)"
    E o sistema continua carregando o histórico completo em segundo plano

  @CEN-069A
  Cenário: Carregando o histórico completo (loading inline)
    Dado que apenas os itens dos últimos 30 dias foram exibidos
    Quando o sistema busca o histórico completo
    Então é exibido um indicador inline "Buscando no histórico completo (X de N)…"
    E o usuário pode continuar interagindo com os resultados já exibidos

  @CEN-069B
  Cenário: Histórico completo retorna e habilita a paginação
    Dado que o histórico completo foi recebido
    Quando o total de resultados excede o tamanho da página
    Então a paginação numérica passa a ser apresentada (← 1 2 … N →)
    E o resumo passa a "N atendimentos" sem a etiqueta "últimos 30 dias"

  @CEN-069C
  Cenário: Recente vem com 0 itens — pula direto para o histórico completo
    Dado que a busca não tem itens nos últimos 30 dias
    Quando o histórico completo é carregado
    Então o indicador "buscando histórico completo" não é apresentado
    E os resultados aparecem direto na paginação completa

  @CEN-068D
  Cenário: Mudar o termo ou os filtros reinicia o ciclo
    Dado que a busca está exibindo a página completa
    Quando o atendente altera o termo de busca ou um chip de atributo
    Então o sistema reinicia o ciclo: skeleton → recentes → completo
    E a página atual volta para 1
    E qualquer filtro de contato ativo é limpo

  @CEN-068E
  Cenário: Paginação numérica dos resultados
    Dado que a busca devolveu mais de uma página de resultados
    Quando o atendente clica em um número de página, em ← ou em →
    Então o sistema apresenta os itens correspondentes àquela página
    E o controle de páginas mostra uma janela compacta (até 5 botões + reticências)
    E o botão ← fica desabilitado na primeira página
    E o botão → fica desabilitado na última página

  @CEN-068F
  Cenário: Filtrar resultados pelos atendimentos de um contato (funil)
    Dado que a busca retornou um ou mais contatos
    Quando o atendente clica no ícone de funil sobre um contato
    Então o sistema passa a exibir apenas os atendimentos vinculados àquele contact.id
    E é apresentado um banner "Filtrando atendimentos de <Nome>" com botão de limpar
    E a paginação é recalculada para o subconjunto filtrado

  @CEN-068G
  Cenário: Alternar o filtro de contato (toggle)
    Dado que um contato já está sendo usado como filtro de atendimentos
    Quando o atendente clica novamente no funil do mesmo contato
    Então o filtro é removido e a lista volta a mostrar todos os atendimentos da busca

  @CEN-068H
  Cenário: Tamanho da janela de paginação para grandes volumes
    Dado que a busca retornou ≈3000 resultados
    Quando o atendente está na página 1
    Então a paginação exibe os botões 1, 2, 3, 4, 5 … 300
    E os botões intermediários adaptam-se conforme a página atual avança
```

---

# 8. Filtros avançados da lista

> O painel "Filtros avançados" abre a partir da barra de ferramentas da lista e
> **alimenta a mesma lista** exibida ao lado (e também as visões Kanban e Gantt).
> A filtragem é **incremental, sem botão "aplicar"**: campos de texto filtram ao
> **perder o foco** (ou Enter); seleções (dropdowns) filtram **na hora**. Os
> critérios ativos aparecem como **chips** acima da lista, cada um removível, com
> uma ação **"Limpar" (vassoura)** que zera todos.

```gherkin
Funcionalidade: Filtros avançados de atendimentos
  Como atendente
  Quero refinar a lista de atendimentos por múltiplos critérios
  Para localizar rapidamente os atendimentos relevantes

  Contexto:
    Dado que o painel "Filtros avançados" oferece os seguintes critérios:
      | tipo    | critério                         |
      | texto   | ID do atendimento                |
      | texto   | Nome do atendimento              |
      | texto   | Telefone do contato              |
      | texto   | E-mail do contato                |
      | texto   | CPF do contato                   |
      | data    | Data de início                   |
      | data    | Data de atualização              |
      | seleção | Status do atendimento            |
      | seleção | Atendentes                       |
      | seleção | SLA                              |
      | seleção | Marcadores                       |
      | seleção | Redirecionamento por I.A.        |
    E que a lista é refiltrada a cada critério aplicado
    E que os critérios ativos são representados por chips acima da lista

  # ── Buscas textuais ──────────────────────────────────────────────
  @CEN-078
  Cenário: Filtrar por ID do atendimento
    Quando o atendente informa "123456" no campo "Pesquisar ID do atendimento"
    Então a lista passa a conter apenas atendimentos cujo id contém esse texto

  @CEN-078A
  Cenário: Filtrar por nome do atendimento
    Quando o atendente informa um termo no campo "Pesquisar nome do atendimento"
    Então a lista passa a conter apenas atendimentos cujo nome/título contém o termo
      (ignorando acentuação e diferença de maiúsculas/minúsculas)

  @CEN-078B
  Cenário: Filtrar por telefone do contato
    Quando o atendente informa "994433221" no campo "Pesquisar por telefone do contato"
    Então a lista passa a conter apenas atendimentos com algum contato cujo telefone
      contém esses dígitos
    E a comparação ignora máscara e pontuação (compara apenas dígitos)

  @CEN-078C
  Cenário: Filtrar por e-mail do contato
    Quando o atendente informa um termo no campo "Pesquisar por email do contato"
    Então a lista passa a conter apenas atendimentos com algum contato cujo e-mail
      contém o termo (ignorando maiúsculas/minúsculas)

  @CEN-078D
  Cenário: Filtrar por CPF do contato
    Quando o atendente informa "024.676.678-90" no campo "Pesquisar por CPF do contato"
    Então a lista passa a conter apenas atendimentos com algum contato cujo CPF
      corresponde aos mesmos dígitos (ignorando pontuação)

  @CEN-078E
  Cenário: A busca textual é aplicada ao sair do campo
    Dado que o atendente está digitando em um dos campos de pesquisa
    Quando ele sai do campo (perde o foco) ou pressiona Enter
    Então a filtragem é executada com o valor digitado
    Mas a lista não é refiltrada a cada tecla pressionada

  @CEN-078F
  Cenário: Limpar um campo de pesquisa textual
    Dado que um campo de pesquisa textual possui um valor aplicado
    Quando o atendente limpa o campo
    Então o critério correspondente é removido e a lista é refiltrada

  # ── Datas ────────────────────────────────────────────────────────
  @CEN-070
  Cenário: Filtrar por data de início
    Quando o atendente escolhe um período em "Data de início"
      (Hoje, Últimos 7 dias, 30, 60, 90 dias ou Personalizado)
    Então a lista passa a conter apenas atendimentos cuja data de início
      está dentro do período escolhido

  @CEN-070A
  Cenário: Filtrar por data de atualização
    Quando o atendente escolhe um período em "Data de atualização"
    Então a lista passa a conter apenas atendimentos cuja data de atualização
      (última atividade) está dentro do período escolhido
    E as opções de período são as mesmas de "Data de início"

  @CEN-070B
  Cenário: Janela de período é relativa ao momento atual
    Dado um período relativo como "Últimos 7 dias"
    Quando o filtro é aplicado
    Então o intervalo considerado vai de (agora − 7 dias) até agora
    E "Hoje" considera apenas o dia corrente
    # [regra a definir: "agora" = data/hora do servidor. No protótipo, por usar dados
    #  de demonstração antigos, "agora" é ancorado na data mais recente do conjunto.]

  @CEN-070C
  Cenário: Período personalizado
    Quando o atendente escolhe "Personalizado" em um filtro de data
    Então deve ser possível informar uma faixa de datas (inicial e final)
    # [regra a definir: seletor de intervalo — não implementado no protótipo]

  @CEN-070D
  Cenário: Re-selecionar o mesmo período limpa o filtro de data
    Dado que um período já está selecionado em um filtro de data
    Quando o atendente clica novamente na mesma opção
    Então o filtro de data é removido (comportamento de alternância do radio)

  # ── Seleções (dropdowns) ─────────────────────────────────────────
  @CEN-071
  Cenário: Filtrar por status
    Quando o atendente seleciona um status no filtro (ex.: "Em andamento" ou "Finalizado")
    Então a lista passa a conter apenas atendimentos do grupo de status correspondente

  @CEN-071A
  Cenário: Mapeamento dos status reais para os grupos do filtro
    Dado que o filtro de status oferece os grupos "Em andamento" e "Finalizado"
    Então "Finalizado" corresponde a atendimentos encerrados, finalizados ou cancelados
    E "Em andamento" corresponde aos demais (abertos, pendentes, pausados)
    # [regra a definir: mapeamento exato status → grupo, conforme a máquina de estados]

  @CEN-072
  Cenário: Filtrar por atendente (multi-seleção)
    Quando o atendente seleciona um ou mais atendentes
    Então a lista passa a conter apenas atendimentos vinculados a pelo menos um
      dos atendentes escolhidos

  @CEN-073
  Cenário: Filtrar por SLA
    Quando o atendente seleciona "Atrasado" no filtro de SLA
    Então a lista passa a conter apenas atendimentos com SLA vencido (tempo negativo)

  @CEN-073A
  Cenário: Classes de SLA do filtro
    Dado que o filtro de SLA oferece "No prazo", "Próximo ao prazo" e "Atrasado"
    Então "Atrasado" corresponde a tempo negativo
    E "Próximo ao prazo" corresponde a tempo positivo abaixo de um limiar
    E "No prazo" corresponde a tempo positivo acima desse limiar
    # [regra a definir: limiar de "próximo ao prazo" — no protótipo, ≤ 6 horas]

  @CEN-074
  Cenário: Filtrar por redirecionamento por I.A.
    Quando o atendente seleciona "Redirecionado por I.A." ou "Não redirecionado por I.A."
    Então a lista passa a conter apenas atendimentos com o respectivo estado de
      redirecionamento por I.A.

  @CEN-076
  Cenário: Filtrar por marcador (multi-seleção)
    Dado que existem marcadores aplicados aos atendimentos
    Quando o atendente abre o filtro "Marcadores" e seleciona um ou mais marcadores
    Então a lista passa a conter apenas atendimentos que possuem pelo menos um
      dos marcadores selecionados

  @CEN-077
  Cenário: Lista de marcadores do filtro vem dos dados existentes
    Dado que o sistema conhece a lista de marcadores aplicados a algum atendimento
    Quando o atendente abre o dropdown do filtro "Marcadores"
    Então a lista de opções é apresentada em ordem alfabética (pt-BR)
    E cada opção mostra um indicador visual da cor do marcador
    E há um campo de pesquisa para encontrar um marcador pelo nome

  @CEN-079
  Cenário: A opção "Todos" remove a restrição do grupo
    Dado que um filtro de seleção (Status, SLA ou I.A.) oferece a opção "Todos"
    Quando o atendente escolhe "Todos"
    Então qualquer seleção daquele grupo é descartada
    E o grupo deixa de restringir a lista

  @CEN-079A
  Cenário: A seleção em um dropdown é aplicada imediatamente
    Quando o atendente marca ou desmarca uma opção em qualquer dropdown
    Então a lista é refiltrada na mesma hora, sem necessidade de confirmar

  # ── Combinação ───────────────────────────────────────────────────
  @CEN-075
  Cenário: Combinar filtros
    Quando o atendente aplica critérios de grupos diferentes ao mesmo tempo
      (ex.: SLA "Atrasado" + Marcador "Cliente VIP")
    Então a lista é a interseção (E lógico) entre os grupos
    E dentro de um mesmo grupo multi-seleção vale a união (OU lógico)

  # ── Chips e limpeza ──────────────────────────────────────────────
  @CEN-079B
  Cenário: Chips dos filtros aplicados
    Dado que há um ou mais critérios aplicados
    Então acima da lista é exibido um chip para cada critério ativo
    E cada valor de um filtro multi-seleção gera um chip próprio
    E cada chip possui um botão para removê-lo

  @CEN-079C
  Cenário: Remover um filtro pelo chip
    Dado que existe um chip de filtro aplicado
    Quando o atendente clica no "X" do chip
    Então aquele critério é removido
    E a lista é refiltrada considerando os demais critérios

  @CEN-079D
  Cenário: Limpar todos os filtros
    Dado que há um ou mais critérios aplicados
    Quando o atendente aciona a ação "Limpar" (vassoura) ao final dos chips
    Então todos os critérios são removidos de uma só vez
    E a lista volta a exibir todos os atendimentos da fila
    E os chips e a ação de limpar deixam de ser exibidos

  @CEN-079E
  Cenário: Filtros que não retornam nenhum atendimento
    Dado um conjunto de critérios que nenhum atendimento satisfaz
    Quando os filtros são aplicados
    Então a lista é apresentada vazia, sem erro
    E os chips permanecem visíveis para ajuste ou limpeza
```

---

# 9. Criar e editar atendimento

```gherkin
Funcionalidade: Criar e editar atendimento
  Como atendente
  Quero registrar um novo atendimento ou editar um existente

  @CEN-080
  Cenário: Criar atendimento com dados válidos
    Dado que o atendente informa a fila de atendimento (obrigatória)
    E opcionalmente o atendente responsável e o SLA (valor + unidade)
    Quando ele confirma a criação
    Então o sistema cria o atendimento com os dados informados

  @CEN-081
  Cenário: Fila é obrigatória
    Dado que o atendente não informa a fila
    Quando ele tenta criar o atendimento
    Então o sistema impede a criação e sinaliza o campo obrigatório

  @CEN-082
  Cenário: Editar atendimento existente
    Dado um atendimento existente
    Quando o atendente altera fila, atendente ou SLA e salva
    Então o sistema persiste as alterações

  @CEN-083
  Cenário: Unidades de SLA
    Quando o atendente define o SLA
    Então a unidade pode ser Minutos, Horas, Dias ou Semanas
```

---

# 10. Nova conversa / nova mensagem

```gherkin
Funcionalidade: Iniciar nova conversa
  Como atendente
  Quero iniciar uma conversa com um contato por um canal

  @CEN-090
  Cenário: Buscar contato existente
    Quando o atendente busca por CPF, telefone ou e-mail
    Então o sistema retorna os contatos correspondentes

  @CEN-091
  Cenário: Cadastrar novo contato
    Dado que o contato não existe
    Quando o atendente opta por criar um novo contato
    Então o sistema permite o cadastro e o disponibiliza para seleção

  @CEN-092
  Cenário: Exibir histórico de conversas do contato selecionado
    Dado que o contato selecionado já possui conversas
    Quando ele é selecionado
    Então o sistema apresenta o histórico de conversas anteriores do contato

  @CEN-093
  Cenário: Compor e enviar a primeira mensagem
    Dado um contato selecionado
    Quando o atendente escolhe um canal, escreve a mensagem e envia
    Então o sistema cria a conversa e registra a mensagem enviada
```

---

# 11. Painel de conversa (thread e envio)

```gherkin
Funcionalidade: Conduzir uma conversa
  Como atendente
  Quero ver e responder mensagens

  @CEN-100
  Cenário: Exibir mensagens em ordem cronológica
    Quando o atendente abre uma conversa
    Então as mensagens são exibidas em ordem cronológica
    E cada mensagem indica autor, papel (contato/atendente/sistema), canal e data/hora

  @CEN-101
  Cenário: Enviar mensagem
    Dado uma conversa aberta (não finalizada)
    Quando o atendente digita um texto e envia
    Então a mensagem é registrada com o autor, o canal selecionado e a data/hora atual
    E passa a constar no fim da conversa

  @CEN-102
  Cenário: Mensagem vazia não é enviada
    Quando o atendente tenta enviar um texto vazio ou só com espaços
    Então o sistema não registra a mensagem

  @CEN-103
  Cenário: Limite de caracteres por mensagem
    Dado que o limite por mensagem é de 1024 caracteres
    Quando o atendente digita um texto
    Então o sistema indica os caracteres restantes (1024 menos o tamanho do texto)
    E impede o envio acima do limite  # [regra a definir: bloqueio rígido vs. aviso]

  @CEN-104
  Cenário: Abas somente leitura não permitem envio
    Dado que o atendente está visualizando a aba "Histórico" ou "Contato"
    Então o campo de composição não é apresentado
    E o envio de mensagens fica indisponível nessa visualização
```

---

# 12. Canais de mensagem (composer multicanal)

```gherkin
Funcionalidade: Enviar por múltiplos canais
  Como atendente
  Quero escolher o canal de envio

  @CEN-110
  Esquema do Cenário: Selecionar canal de envio
    Dado uma conversa aberta
    Quando o atendente seleciona o canal "<canal>"
    Então a mensagem é enviada por esse canal

    Exemplos:
      | canal         |
      | WhatsApp      |
      | WhatsApp Web  |
      | SMS           |
      | Torpedo       |
      | E-mail        |
      | RCS           |

  @CEN-111
  Cenário: Nota interna não é enviada ao contato
    Quando o atendente registra uma "Nota interna"
    Então o conteúdo fica visível apenas para a equipe
    E não é entregue ao contato
```

---

# 13. Finalizar conversa

```gherkin
Funcionalidade: Finalizar conversa
  Como atendente
  Quero encerrar uma conversa concluída

  @CEN-120
  Cenário: Finalizar conversa aberta
    Dado uma conversa com status "Aberta"
    Quando o atendente confirma a finalização
    Então o status da conversa passa a "Finalizada"
    E o histórico permanece consultável

  @CEN-121
  Cenário: Não enviar em conversa finalizada
    Dado uma conversa com status "Finalizada"
    Quando o atendente tenta enviar uma mensagem
    Então o sistema impede o envio

  @CEN-122
  Cenário: Conversa já finalizada não pode ser finalizada de novo
    Dado uma conversa "Finalizada"
    Então a ação de finalizar fica indisponível
```

---

# 14. Transferir conversa / atendimento

```gherkin
Funcionalidade: Transferir atendimento
  Como atendente
  Quero redirecionar o atendimento para outra fila ou atendente

  @CEN-130
  Cenário: Transferir para outra fila
    Dado um atendimento em uma fila
    Quando o atendente o transfere para outra fila de destino
    Então o atendimento passa a pertencer à nova fila

  @CEN-131
  Cenário: Transferir para outro atendente
    Quando o atendente transfere o atendimento para outro atendente
    Então o atendimento passa a ter o novo responsável

  @CEN-132
  Cenário: Notificar a fila de destino
    Dado que a opção "Notificar atendentes da fila" está marcada
    Quando a transferência é concluída
    Então os atendentes da fila de destino são notificados

  @CEN-133
  Cenário: Alterar a fila pela tela de detalhe
    Dado que o atendente está no detalhe do atendimento
    Quando ele altera a fila (aba Fila) ou o atendente (aba Atendente) e confirma
    Então o vínculo do atendimento é atualizado
```

---

# 15. Detalhe do atendimento (abas Conversas / Contato / Histórico)

```gherkin
Funcionalidade: Detalhar um atendimento
  Como atendente
  Quero ver as conversas, os contatos e o histórico do atendimento

  @CEN-140
  Cenário: Listar conversas do atendimento
    Quando o atendente abre o detalhe
    Então a aba "Conversas" lista as conversas do atendimento com canal, status e preview

  @CEN-141
  Cenário: Aba "Contato" — mensagens por pessoa
    Quando o atendente seleciona um participante na aba "Contato"
    Então o sistema exibe apenas as mensagens daquela pessoa no atendimento

  @CEN-142
  Cenário: Aba "Histórico" — visão consolidada
    Quando o atendente abre a aba "Histórico"
    Então o sistema exibe todas as mensagens do atendimento, de todas as conversas,
      em ordem cronológica
    E apresenta totais por canal e por participante (atendentes e contatos)

  @CEN-143
  Cenário: Panorama de contatos e atendentes do atendimento
    Quando o atendente abre o detalhe
    Então é possível consultar todos os contatos e todos os atendentes envolvidos no atendimento
```

---

# 16. Histórico do contato (jornada do contato)

```gherkin
Funcionalidade: Consultar histórico completo de um contato
  Como atendente
  Quero ver tudo que envolve um contato, em qualquer atendimento

  @CEN-150
  Cenário: Consolidar mensagens do contato
    Quando o atendente abre o histórico de um contato
    Então o sistema reúne todas as mensagens, conversas e atendimentos em que o contato aparece
    E as apresenta em ordem cronológica

  @CEN-151
  Cenário: Totais do contato
    Então o sistema apresenta o total de mensagens, de atendimentos e de conversas do contato
    E os totais por canal e por atendente

  @CEN-152
  Cenário: Filtrar histórico por fila
    Quando o atendente seleciona uma ou mais filas
    Então o sistema destaca/considera apenas as mensagens das conversas dessas filas

  @CEN-153
  Cenário: Buscar atendimento por id no histórico
    Quando o atendente digita um id de atendimento na busca do histórico
    Então o sistema filtra os atendimentos do contato por esse id

  @CEN-154
  Esquema do Cenário: Filtrar histórico por período
    Quando o atendente seleciona o período "<periodo>"
    Então o sistema considera apenas atendimentos dentro desse intervalo

    Exemplos:
      | periodo  |
      | 7 dias   |
      | 30 dias  |
      | 90 dias  |
      | Todos    |
```

---

# 17. Transferência automática por Inteligência Artificial

```gherkin
Funcionalidade: Atribuição automática de fila por I.A.
  Como gestor/atendente
  Quero que a I.A. direcione atendimentos sem fila para a fila mais adequada

  @CEN-160
  Cenário: Recurso disponível apenas em "Sem fila específica"
    Dado que a fila selecionada é "Sem fila específica"
    Então a ação "Transferir por I.A." está disponível
    Mas quando a fila é qualquer outra
    Então a ação não é oferecida

  @CEN-161
  Cenário: Confirmar a transferência por I.A.
    Quando o atendente solicita a transferência por I.A. e confirma
    Então a I.A. analisa o conteúdo das conversas
    E direciona cada atendimento para a fila com o contexto mais adequado

  @CEN-162
  Cenário: Marcar atendimentos redirecionados pela I.A.
    Dado que um atendimento foi direcionado pela I.A.
    Então ele fica identificado como "redirecionado por I.A."
    E pode ser filtrado por esse critério

  @CEN-163
  Cenário: Confirmação de quantidade
    Quando a transferência por I.A. é concluída
    Então o sistema informa quantos atendimentos foram transferidos
```

---

# 18. Configurações do chat

```gherkin
Funcionalidade: Configurar regras do chat
  Como gestor
  Quero parametrizar o comportamento do atendimento

  @CEN-170
  Cenário: Tempo de espera com alerta
    Dado que "Tempo de espera" está habilitado com um valor e uma unidade
    Quando um contato aguarda resposta além do limite
    Então o sistema gera um alerta para a conversa

  @CEN-171
  Cenário: Habilitar vínculo de atendimento (protocolo)
    Dado que "Atendimento" está habilitado
    Então as conversas podem ser vinculadas a protocolos de atendimento

  @CEN-172
  Cenário: Atribuir responsável automaticamente em "Sem fila específica"
    Dado que "Atribuir responsável" está habilitado
    Quando um atendimento cai em "Sem fila específica"
    Então o sistema o atribui a um atendente do time relacionado
      ou, na ausência, a qualquer atendente cadastrado

  @CEN-173
  Cenário: Fechar atendimentos automaticamente por inatividade
    Dado que "Fechar atendimentos automaticamente" está habilitado com um período
    Quando um atendimento fica sem interação além do período
    Então o sistema o fecha automaticamente

  @CEN-174
  Esquema do Cenário: Regra de troca (produto/atendente) abre nova conversa
    Dado a configuração "<contexto>" definida como "<regra>"
    Quando ocorre a troca de <contexto>
    Então o sistema "<efeito>"

    Exemplos:
      | contexto   | regra                        | efeito                                  |
      | produto    | Cria nova conversa por troca | abre uma nova conversa                  |
      | produto    | Mantém na mesma conversa     | mantém o diálogo na conversa atual      |
      | atendentes | Cria nova conversa por troca | abre uma nova conversa                  |
      | atendentes | Mantém na mesma conversa     | mantém o diálogo na conversa atual      |

  @CEN-175
  Esquema do Cenário: Permissão de visualização de conversas não atribuídas
    Dado a configuração de visualização "<regra>"
    Então um atendente "<efeito>" sobre conversas de outro atendente

    Exemplos:
      | regra                                   | efeito                          |
      | Não pode ver conversas de outro         | não vê                          |
      | Pode ver, mas não pode responder        | vê, mas não responde            |
      | Pode ver e responder                    | vê e responde                   |

  @CEN-176
  Cenário: Persistir configurações
    Quando o gestor salva as configurações do chat
    Então os parâmetros são persistidos e passam a valer para os próximos atendimentos

  @CEN-177
  Cenário: Marcadores de destaque
    Dado que há marcadores definidos como "de destaque"
    Então esses marcadores recebem prioridade de exibição por conversa

  @CEN-178
  Cenário: Fechar conversas automaticamente por inatividade
    Dado que "Fechar conversas automaticamente" está habilitado com um período
      (valor numérico + unidade ∈ {Minutos, Horas, Dias, Semanas, Meses})
    Quando uma conversa fica sem interação além do período
    Então o sistema encerra apenas aquela conversa específica
    E o atendimento que a contém não é encerrado (diferente do CEN-173 que afeta o atendimento)
```

---

# 19. Jornadas (conversas automatizadas)

```gherkin
Funcionalidade: Acompanhar conversas conduzidas por jornada
  Como atendente
  Quero acompanhar e assumir conversas automatizadas

  @CEN-180
  Cenário: Listar conversas de jornada
    Quando o atendente abre a área de Jornadas
    Então o sistema lista as conversas conduzidas automaticamente, com nome da jornada,
      contato, canal, prévia e quantidade de não lidas

  @CEN-181
  Cenário: Filtrar jornadas
    Quando o atendente filtra por data, telefone, e-mail, jornada,
      identificadores (acionamento/conversa/atendimento) ou status
    Então a lista é refinada conforme os critérios

  @CEN-182
  Cenário: Transferir conversa de jornada para atendimento humano
    Dado uma conversa conduzida por jornada
    Quando o atendente opta por "Transferir essa conversa"
    Então a conversa passa a ser conduzida por um atendente
```

---

# 20. Dashboard / Relatórios

```gherkin
Funcionalidade: Indicadores de atendimento (dashboard)
  Como gestor
  Quero acompanhar métricas do atendimento

  @CEN-190
  Cenário: Indicadores principais (KPIs)
    Quando o gestor abre o dashboard
    Então o sistema apresenta: total de conversas, tempo médio de atendimento (TMA),
      tempo médio de espera (TME), conversas aguardando atendimento,
      conversas em atendimento, conversas concluídas, sessões abertas e total de mensagens

  @CEN-191
  Cenário: Distribuição por canal
    Então o sistema apresenta mensagens e conversas distribuídas por canal

  @CEN-192
  Cenário: Desempenho por atendente
    Então o sistema apresenta, por atendente, total de conversas, em andamento,
      concluídas, TMA e TME

  @CEN-193
  Cenário: Ranking de categorias de WhatsApp
    Então o sistema apresenta o ranking de categorias de mensagem do WhatsApp

  @CEN-194
  Cenário: Filtrar por período
    Quando o gestor seleciona um período
    Então os indicadores são recalculados para o período

  @CEN-195
  Cenário: Exportar relatório
    Quando o gestor solicita o download do relatório
    Então o sistema disponibiliza o relatório para exportação
```

---

# 21. Navegação e ações globais

```gherkin
Funcionalidade: Navegação principal
  Como atendente
  Quero alternar entre as áreas do produto

  @CEN-200
  Cenário: Alternar entre Atendimentos e Jornadas
    Quando o atendente seleciona uma área na navegação
    Então o sistema apresenta o conteúdo correspondente

  @CEN-200A
  Cenário: Ícone "Relatórios" como presença visual no rail
    Dado que o ícone de "Relatórios" segue presente no rail lateral
    Quando o atendente clica nesse ícone
    Então o sistema NÃO navega para a tela de Relatórios
    E mantém o atendente na área atual (sem efeito de rota)
    # Observação para o time: este comportamento é provisório enquanto a área
    # de Relatórios não estiver pronta para ser exposta. Quando estiver,
    # restaurar o roteamento normal.

  @CEN-201
  Cenário: Abertura rápida de atendimento (pré-visualização)
    Quando o atendente aciona "visualizar" em um atendimento da lista
    Então o detalhe do atendimento é apresentado em pré-visualização
    E pode ser expandido para tela cheia
```

---

# 22. Vincular conversa a outro atendimento

```gherkin
Funcionalidade: Vincular uma conversa a um atendimento diferente
  Como atendente, ao perceber que uma conversa deveria pertencer a outro
  atendimento (ou virar um atendimento próprio), quero realocá-la sem
  perder o histórico.

  Contexto:
    Dado uma conversa "C" pertencente ao atendimento "A1"
    E que existem outros atendimentos no sistema

  @CEN-210
  Cenário: Acionar a operação a partir do painel da conversa
    Quando o atendente aciona a opção "Vincular conversa a outro atendimento"
      no cabeçalho do painel da conversa
    Então o sistema apresenta um modal com duas opções:
      "Criar um novo atendimento" e "Vincular a um atendimento existente"

  @CEN-211
  Cenário: Criar um novo atendimento para essa conversa
    Quando o atendente escolhe "Criar um novo atendimento"
    Então o sistema cria um atendimento novo na fila atual
    E move a conversa "C" para esse atendimento novo
    E remove a conversa do atendimento "A1" de origem
    E apresenta uma notificação de sucesso confirmando o id do novo atendimento

  @CEN-212
  Cenário: Vincular a um atendimento existente (busca multi-atributo)
    Quando o atendente escolhe "Vincular a um atendimento existente"
    Então o sistema apresenta uma busca com chips multi-atributo:
      Atendimento, Operação, Atendente, Dados do contato
    E permite filtrar por qualquer combinação desses atributos
    E retorna até N atendimentos compatíveis com o termo

  @CEN-213
  Cenário: O próprio atendimento de origem é excluído dos resultados
    Quando a busca por atendimentos é executada
    Então o atendimento "A1" (origem da conversa) não aparece como opção

  @CEN-214
  Cenário: Confirmar o vínculo a um atendimento existente
    Dado que a busca retornou o atendimento "A2"
    Quando o atendente confirma a ação "Vincular" em "A2"
    Então a conversa "C" passa a pertencer ao atendimento "A2"
    E é removida do atendimento "A1"
    E uma notificação de sucesso confirma "Conversa <id> vinculada ao atendimento #A2"

  @CEN-215
  Cenário: Pré-visualizar um atendimento dos resultados (somente leitura)
    Dado que a busca retornou atendimentos candidatos
    Quando o atendente aciona o ícone de "visualizar" sobre um resultado
    Então o sistema abre o atendimento em modo somente-leitura
    E o modal de busca permanece aberto por baixo
    E nenhuma ação que altere estado é oferecida no preview
      (ver "Preview read-only" em §24)

  @CEN-216
  Cenário: Falha na operação dispara notificação de erro
    Quando uma falha impede a conclusão de "vincular" ou "criar novo"
    Então o sistema apresenta uma notificação de erro descritiva
    E a conversa "C" continua no atendimento "A1" original
```

---

# 23. Trazer conversa de outro atendimento (operação inversa)

```gherkin
Funcionalidade: Trazer uma conversa para o atendimento atual
  Como atendente que está em um atendimento "A2", quero importar para cá
  uma conversa que hoje está em outro atendimento.

  Contexto:
    Dado que o atendente está no atendimento "A2"
    E existem conversas em outros atendimentos

  @CEN-220
  Cenário: Acionar a operação a partir do cabeçalho do atendimento
    Quando o atendente aciona "Trazer conversa de outro atendimento"
      no cabeçalho do atendimento "A2"
    Então o sistema apresenta um modal de busca de conversas

  @CEN-221
  Cenário: Busca multi-atributo de conversas
    Quando o atendente busca por um termo
    Então o sistema aceita filtros multi-seleção:
      Conversa (id), Atendimento (id de origem), Dados do contato, Atendente
    E retorna conversas pertencentes a outros atendimentos
    E exclui conversas que já pertencem ao atendimento "A2"

  @CEN-222
  Cenário: Confirmar a importação da conversa
    Dado que o atendente encontrou a conversa "C" do atendimento "A1"
    Quando ele confirma "Trazer" em "C"
    Então "C" passa a pertencer a "A2"
    E é removida de "A1"
    E uma notificação de sucesso confirma
      "Conversa <id> trazida do atendimento #A1 para #A2"

  @CEN-223
  Cenário: Pré-visualizar a conversa antes de trazer (somente leitura)
    Quando o atendente aciona "visualizar" sobre um resultado de conversa
    Então o sistema abre o atendimento de origem em modo somente-leitura
    E o foco inicial é na conversa específica que ele estava prestes a trazer
      (initialConvId)

  @CEN-224
  Cenário: Falha na importação
    Quando uma falha impede a importação
    Então o sistema apresenta uma notificação de erro
    E a conversa permanece no atendimento original
```

---

# 24. Pré-visualização somente-leitura de atendimento

```gherkin
Funcionalidade: Visualizar um atendimento sem alterar nada
  Como atendente, quero examinar conteúdo de outro atendimento (a partir
  dos modais de vincular/trazer ou da lista) sem risco de disparar
  ações em cadeia (anti-loop).

  @CEN-230
  Cenário: Conteúdo do preview
    Quando o atendente abre o preview de um atendimento
    Então o sistema exibe:
      • identificação do atendimento (id, tipo) com indicação "Somente leitura"
      • lista lateral das conversas do atendimento
      • thread da conversa atualmente selecionada, em ordem cronológica

  @CEN-231
  Cenário: Foco inicial em uma conversa específica (initialConvId)
    Dado que o preview foi aberto com um `initialConvId` informado
    Então a conversa correspondente é a inicialmente selecionada
    Caso contrário, a primeira conversa da lista é selecionada por padrão

  @CEN-232
  Cenário: Ações de alteração de estado são suprimidas
    Quando o preview está aberto
    Então NÃO são oferecidos:
      • envio de mensagens (composer)
      • vincular/trazer conversa
      • alterar fila/atendente
      • aplicar/remover marcadores
      • finalizar conversa
      • criar nova conversa
      • alterar status do atendimento
    # Critério principal anti-loop: o preview não pode ter entradas
    # para abrir outros previews ou modais que aceitem alteração.

  @CEN-233
  Cenário: Fechar o preview
    Quando o atendente clica no botão de fechar do preview
      ou pressiona Esc
      ou clica fora da área do preview
    Então o preview é fechado
    E o modal de origem (vincular/trazer) permanece no estado em que estava

  @CEN-234
  Cenário: Trocar a conversa selecionada dentro do preview
    Dado que o atendimento tem mais de uma conversa
    Quando o atendente seleciona outra conversa na lista lateral
    Então a thread principal passa a exibir as mensagens da conversa escolhida

  @CEN-235
  Cenário: Atendimento sem conversas
    Quando o preview é aberto para um atendimento sem conversas
    Então o sistema apresenta um estado vazio explicando a ausência de conversas
```

---

# 25. Notificações de feedback (snackbar)

```gherkin
Funcionalidade: Apresentar feedback após ações de domínio
  Como atendente, quero entender se uma ação concluiu com sucesso ou falhou.

  @CEN-240
  Cenário: Notificação de sucesso
    Quando uma ação concluiu com sucesso (ex.: vincular conversa, trazer
      conversa, criar novo atendimento, transferir, etc.)
    Então o sistema apresenta uma notificação efêmera de tipo "success"
    E inclui uma mensagem descritiva da ação realizada

  @CEN-241
  Cenário: Notificação de erro
    Quando uma ação falhou
    Então o sistema apresenta uma notificação efêmera de tipo "error"
    E inclui uma mensagem orientando o atendente

  @CEN-242
  Cenário: Auto-fechamento
    Dado uma notificação visível
    Quando o tempo configurado (≈ alguns segundos) expira
    Então a notificação é fechada automaticamente

  @CEN-243
  Cenário: Fechamento manual antes do tempo
    Dado uma notificação visível
    Quando o atendente clica no botão de fechar da notificação
    Então a notificação é encerrada imediatamente

  @CEN-244
  Cenário: Substituição de notificação
    Dado uma notificação em exibição
    Quando uma nova ação dispara outra notificação
    Então a notificação anterior é substituída pela nova
    # [regra a definir: empilhar ou substituir]
```

---

# 26. Ordenação de colunas — modelo unificado

```gherkin
Funcionalidade: Ordenar a lista por uma coluna com direção e escopo
  Como atendente, quero priorizar a lista por diferentes critérios usando
  um único padrão de interação (Modal "Direção + Escopo") para qualquer
  coluna ordenável.

  Contexto:
    Dado que as colunas ordenáveis da lista são:
      Marcadores, Data de início, Data de atualização, SLA
    E que apenas UMA coluna pode estar ordenada por vez

  @CEN-250
  Esquema do Cenário: Direções suportadas por coluna
    Dado a coluna "<coluna>"
    Então as duas opções de direção são "<direcao_default>" (padrão) e "<direcao_alt>"

    Exemplos:
      | coluna             | direcao_default                | direcao_alt                  |
      | Marcadores         | A → Z (alfabético)              | Z → A                         |
      | Data de início     | Mais recentes primeiro          | Mais antigos primeiro         |
      | Data de atualização| Atualizações mais recentes      | Atualizações mais antigas     |
      | SLA                | Mais atrasados primeiro         | Mais atrasados último         |

  @CEN-251
  Cenário: Escopo da ordenação
    Quando o atendente abre o modal de ordenação de uma coluna
    Então as duas opções de escopo são:
      "Ordenar apenas a página atual" (mantém ordem das outras páginas)
      "Ordenar todos os atendimentos" (reordena a lista inteira)

  @CEN-252
  Cenário: Substituir o sort ativo ao escolher outra coluna
    Dado que a coluna "Marcadores" está ordenada
    Quando o atendente confirma uma ordenação em "Data de início"
    Então o sort de "Marcadores" é desativado
    E o badge de "página"/"todos" passa a aparecer apenas em "Data de início"

  @CEN-253
  Cenário: Limpar ordenação
    Dado uma coluna ordenada
    Quando o atendente abre o modal e seleciona "Limpar ordenação"
    Então a coluna deixa de estar ordenada
    E a lista retorna à ordem natural

  @CEN-254
  Cenário: Indicador visual no cabeçalho
    Dado que uma coluna está ordenada com direção "asc"
    Então o cabeçalho exibe um ícone de seta para cima
    E uma badge indicando "página" ou "todos" conforme o escopo
    Quando a direção é "desc"
    Então o ícone passa a ser seta para baixo

  @CEN-255
  Cenário: Cálculo da "Data de atualização"
    Dado um atendimento
    Quando o sistema apresenta sua data de atualização
    Então ela reflete o timestamp da última atividade do atendimento
      (última mensagem, mudança de status, edição, etc.)
    # [regra a definir: incluir/excluir mudanças automáticas como auto-fechamento]
```

---

# 27. Visão Gantt

```gherkin
Funcionalidade: Visualizar atendimentos em uma linha do tempo (Gantt)
  Como gestor/atendente, quero ver a distribuição temporal dos atendimentos.

  @CEN-260
  Cenário: Apresentar atendimentos como barras na linha do tempo
    Quando o atendente seleciona a visão "Gantt"
    Então o sistema apresenta uma linha do tempo onde cada atendimento é
      uma barra entre sua data de início e sua última atividade (ou agora,
      se ainda estiver em andamento)

  @CEN-261
  Cenário: Marcação de "agora"
    Dado a linha do tempo
    Então uma marcação visual indica o momento atual (hoje/agora)

  @CEN-262
  Cenário: Paginação da visão Gantt
    Dado que o total de atendimentos excede o tamanho da página
    Quando o atendente está na visão Gantt
    Então um rodapé de paginação é apresentado com o mesmo padrão da Lista
      (X/N itens · ← N → · seletor de tamanho · página X de Y)

  @CEN-263
  Cenário: Abrir um atendimento clicando na barra
    Quando o atendente clica em uma barra
    Então o detalhe do atendimento correspondente é aberto
```

---

## Observações finais para o Back-end

- **Roteamento atendimento → fila:** no protótipo a associação é simulada; no sistema
  real deve existir vínculo persistente entre atendimento e fila (e operação).
- **Cálculo de TMA/TME, "próximo ao prazo", auto-fechamento de atendimento (§18 CEN-173)
  e auto-fechamento de conversa (§18 CEN-178)** dependem de regras temporais
  **[a definir]** com base em data/hora de servidor.
- **`Data de atualização` do atendimento** (CEN-007, CEN-255) corresponde a um campo
  novo que precisa ser mantido pelo back-end a cada evento relevante do atendimento.
- **Vincular / trazer conversa (§22 e §23):** ambas operações são variações do mesmo
  "mover conversa de A1 para A2" (PATCH em `conversa.atendimento_id`). O back-end
  precisa apenas validar que A1 ≠ A2 e que a conversa pertence ao usuário/escopo.
- **Pré-visualização somente-leitura (§24):** o conteúdo é o mesmo do detalhe normal
  do atendimento; o que muda é a apresentação. O back-end pode reaproveitar o
  endpoint de detalhe — a regra anti-loop é responsabilidade do front-end.
- **Notificações efêmeras (§25):** são UI; o back-end deve apenas devolver respostas
  claras (sucesso/erro) com mensagem opcional para a notificação.
- **Pesquisa em duas fases (§7 CEN-068..069):** o back-end pode oferecer
  `?period=last30` como atalho para a primeira leva e depois `?period=all` (ou
  ausência do parâmetro) para o histórico completo, mantendo a mesma query.
- **Paginação de busca (§7 CEN-068E..H):** suportar `page`/`size` e devolver o total
  para a UI calcular a janela de botões.
- **Filtros avançados da lista (§8 CEN-070..079E):** o painel é o front-end de uma
  consulta filtrável de atendimentos. O contrato relevante para o back-end é o
  **conjunto de critérios** e sua semântica — a apresentação (chips, vassoura,
  aplicar no blur) é responsabilidade do front-end. Pontos de atenção:
  - **Combinação:** os critérios se combinam por **E** (interseção) entre grupos
    diferentes e por **OU** (união) dentro de um grupo multi-seleção (atendentes,
    marcadores, status, SLA, I.A.).
  - **Buscas de contato:** telefone e CPF casam por **dígitos** (ignoram máscara);
    e-mail e nome por **substring normalizada** (sem acento, sem caixa). Um
    atendimento entra se **algum** de seus contatos casar.
  - **Datas:** "Data de início" e "Data de atualização" usam janelas **relativas ao
    "agora" do servidor** (Hoje, 7/30/60/90 dias) ou uma faixa personalizada
    **[a definir]**. A `Data de atualização` é o mesmo campo de última atividade
    citado abaixo.
  - **Status e SLA:** o filtro agrupa valores crus em categorias ("Em andamento" vs
    "Finalizado"; "No prazo"/"Próximo ao prazo"/"Atrasado"). O **mapeamento status →
    grupo** e o **limiar de "próximo ao prazo"** são **[regra a definir]**.
  - **Redirecionamento por I.A.:** pressupõe um indicador persistente por atendimento
    de "foi redirecionado pela I.A." (sim/não) — ver §17.
- **Filtro de Marcadores (§8 CEN-076):** a lista de marcadores disponíveis para o
  filtro deve ser derivada dos marcadores efetivamente em uso (ou de um catálogo
  persistido, conforme decisão de produto).
- **Sort unificado (§26):** o back-end deve suportar quatro chaves de ordenação
  (marcador, dataInicio, dataAtualizacao, sla) com direção `asc`/`desc`. O escopo
  "página" pode ser implementado client-side; "todos" exige reordenação do dataset
  inteiro no servidor (ou via cursor que respeite a ordem).
- **Tempo real:** novas mensagens, contadores de não lidas e contadores de fila
  pressupõem atualização em tempo real **[mecanismo a definir]**.
- **Permissões/escopo** (Meus/Todos e visualização de conversas de terceiros)
  pressupõem identidade do atendente e regras de autorização.
- Toda regra marcada **[regra a definir]** precisa de alinhamento com o time de produto
  antes da implementação.
