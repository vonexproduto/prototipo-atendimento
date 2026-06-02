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
| **Atendimento** (ticket) | Caso de atendimento; agrupa 1..N conversas e 1..N contatos/atendentes. | id, título, dataInício, status, slaTag, marcadores[], contatos[], atendentes[], conversas[], tipo/fila |
| **Conversa** (talk) | Diálogo dentro de um atendimento, em um canal. | id, canal, status, contato, fila, preview, não-lidas (unread), mensagens[] |
| **Mensagem** | Item de uma conversa. | id, papel (contato/atendente) **ou** tipo=sistema, texto, dataHora, canal, autor, reações[] |
| **Contato** | Pessoa atendida. | id, nome, telefone, e-mail, CPF, iniciais |
| **Atendente** | Operador. | id, nome, iniciais |
| **Fila / Operação** | Estrutura hierárquica de até 2 níveis (Operação → Fila). Há a fila especial **"Sem fila específica"**. | id, nome, ícone, contador, filhos[] |
| **Marcador** (tag) | Rótulo aplicável a atendimento/conversa. | label, cor |
| **Jornada** | Conversa conduzida automaticamente por automação. | id, nome da jornada, contato, canal, mensagens[] |

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
  Cenário: Fila "Sem fila específica"
    Dado que existem atendimentos sem fila definida
    Quando o atendente seleciona "Sem fila específica"
    Então o sistema retorna os atendimentos ainda não roteados a uma fila

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
    Quando o atendente inverte a ordem
    Então os menos atrasados passam a vir primeiro

  @CEN-034
  Cenário: SLA desabilitado nas configurações
    Dado que a configuração "Usa SLA?" está desligada
    Então o sistema não aplica prazos automáticos aos atendimentos
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
```

---

# 8. Filtros avançados da lista

```gherkin
Funcionalidade: Filtros avançados de atendimentos
  Como atendente
  Quero refinar a lista por múltiplos critérios

  @CEN-070
  Cenário: Filtrar por data de início
    Quando o atendente filtra por um período (Hoje, 7, 30, 60, 90 dias ou personalizado)
    Então o sistema retorna apenas atendimentos iniciados nesse período

  @CEN-071
  Cenário: Filtrar por status
    Quando o atendente filtra por status "Em andamento"
    Então o sistema retorna apenas atendimentos com esse status

  @CEN-072
  Cenário: Filtrar por atendente
    Quando o atendente filtra por um ou mais atendentes
    Então o sistema retorna apenas atendimentos vinculados aos atendentes escolhidos

  @CEN-073
  Cenário: Filtrar por SLA
    Quando o atendente filtra por "Atrasado"
    Então o sistema retorna apenas atendimentos com SLA vencido

  @CEN-074
  Cenário: Filtrar por redirecionamento por I.A.
    Quando o atendente filtra por "Redirecionado por I.A."
    Então o sistema retorna apenas atendimentos que foram direcionados pela I.A.

  @CEN-075
  Cenário: Combinar filtros
    Quando o atendente aplica filtros de status, atendente e SLA simultaneamente
    Então o sistema retorna a interseção dos critérios
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
  Cenário: Alternar entre Atendimentos, Jornadas e Relatórios
    Quando o atendente seleciona uma área na navegação
    Então o sistema apresenta o conteúdo correspondente

  @CEN-201
  Cenário: Abertura rápida de atendimento (pré-visualização)
    Quando o atendente aciona "visualizar" em um atendimento da lista
    Então o detalhe do atendimento é apresentado em pré-visualização
    E pode ser expandido para tela cheia
```

---

## Observações finais para o Back-end

- **Roteamento atendimento → fila:** no protótipo a associação é simulada; no sistema
  real deve existir vínculo persistente entre atendimento e fila (e operação).
- **Cálculo de TMA/TME, "próximo ao prazo", auto-fechamento e alerta de tempo de
  espera** dependem de regras temporais **[a definir]** com base em data/hora de servidor.
- **Tempo real:** novas mensagens, contadores de não lidas e contadores de fila
  pressupõem atualização em tempo real **[mecanismo a definir]**.
- **Permissões/escopo** (Meus/Todos e visualização de conversas de terceiros)
  pressupõem identidade do atendente e regras de autorização.
- Toda regra marcada **[regra a definir]** precisa de alinhamento com o time de produto
  antes da implementação.
