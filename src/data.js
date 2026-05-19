// data.js — mocked CCM atendimento data
window.CCM_DATA = (() => {
  const queues = [
    { id: "sem-fila", icon: "✖", name: "Sem fila específica", count: 40 },
    {
      id: "operacao-suporte", icon: "😎", name: "Operação de Suporte", count: 23, expanded: true,
      children: [
        { id: "atendimento-cliente", icon: "🔥", name: "Fila de Atendimento ao cliente", count: 23 },
        { id: "marketing", icon: "📊", name: "Fila de Departamento de Marketing", count: 20 },
        { id: "desenvolvimento", icon: "🛠", name: "Fila de Departamento de Desenvolvimento", count: 15 },
      ],
    },
    { id: "logistica", icon: "📦", name: "Operação de Logística", count: 45 },
    {
      id: "vendas", icon: "💼", name: "Operação de Vendas", count: 30,
      children: [
        { id: "vendas-novos",       icon: "💰", name: "Fila Vendas — Novos clientes",  count: 18 },
        { id: "vendas-recorrentes", icon: "🔁", name: "Fila Vendas — Recorrentes",     count: 12 },
      ],
    },
    { id: "treinamento", icon: "🎓", name: "Operação de Treinamento", count: 12 },
    { id: "manutencao", icon: "🔧", name: "Operação de Manutenção", count: 10 },
    { id: "comunicacao", icon: "💬", name: "Operação de Comunicação", count: 25 },
    { id: "atendimento-cli", icon: "📞", name: "Operação de Atendimento ao Cliente", count: 50 },
    { id: "ti", icon: "💻", name: "Operação de TI", count: 18 },
    { id: "operacoes", icon: "📋", name: "Operação de Operações", count: 22 },
    { id: "projetos", icon: "🌐", name: "Operação de Projetos Internacionais", count: 11 },
    { id: "pesquisa", icon: "🔬", name: "Operação de Pesquisa e Desenvolvimento", count: 9 },
  ];

  // Contacts pool
  const ricardo = { id: "c1", initials: "RM", bg: "#FFE0CB", fg: "#9b4500", name: "Ricardo Mendes", phone: "(11)998012345", email: "ricardomendes@gmail.com", cpf: "024.676.678-90" };
  const camila = { id: "c2", initials: "CA", bg: "#D7CCFF", fg: "#410293", name: "Camila Alves", phone: "(11)981230099", email: "camila.alves@email.com", cpf: "789.123.456-01", isAttendant: true };
  const flavia = { id: "c3", initials: "FS", bg: "#BFE6FA", fg: "#114865", name: "Flavia Silva", phone: "(21)997000100", email: "flavia@email.com", cpf: "111.222.333-44" };
  const ana    = { id: "c4", initials: "AS", bg: "#D7CCFF", fg: "#410293", name: "Ana Silva", phone: "(61)998012345", email: "ana.silva@email.com", cpf: "024.676.678-90" };
  const marcos = { id: "c5", initials: "MR", bg: "#FFE0CB", fg: "#9b4500", name: "Marcos Ribeiro", phone: "(62)987654321", email: "marcos.ribeiro@email.com", cpf: "012.345.678-90" };
  const paulo  = { id: "c6", initials: "PL", bg: "#cfeacf", fg: "#2a7d2d", name: "Paulo Lucas", phone: "(11)988776655", email: "paulo.lucas@email.com", cpf: "555.666.777-88" };
  const jandilson = { id: "c7", initials: "JJ", bg: "#fde2ef", fg: "#9d1247", name: "Jandilson Jesus", phone: "(85)995554433", email: "jandilson@email.com", cpf: "232.343.454-22" };
  const julia    = { id: "c8", initials: "JR", bg: "#d4f0e8", fg: "#1a6b4a", name: "Julia Rodrigues", phone: "(11)994433221", email: "julia.rodrigues@gmail.com", cpf: "312.456.789-00" };
  const fernanda = { id: "c9", initials: "FC", bg: "#fce8d4", fg: "#8a3d00", name: "Fernanda Costa", phone: "(31)991122334", email: "fernanda.costa@gmail.com", cpf: "451.678.901-23" };

  const attendant = { id: "a1", initials: "CA", name: "Camila Alves", bg: "#D7CCFF", fg: "#410293" };

  // ─────────────────────────────────────────────
  // Cada conversa tem sua própria sequência de mensagens
  // simulando contextos diferentes (pagamento, entrega, boleto, proposta)
  // ─────────────────────────────────────────────

  // Conversa 1 — WhatsApp, Aberta, sobre condições de pagamento (em andamento)
  const messagesConvPagamento = [
    { id: "p1", role: "contact", text: "Olá, atendente.\nQuais as condições de pagamento?", at: "10/07/23 09:12", channel: "whatsapp", author: "RM" },
    { id: "p2", role: "agent", text: "Verificando. Aguarde um momento.", at: "10/07/23 09:14", channel: "whatsapp", author: "CA" },
    { id: "p3", type: "system", text: "Conversa iniciada com ricardomendes@gmail.com neste atendimento" },
    { id: "p4", role: "agent", text: "Ricardo, segue as possibilidades de pagamento para o cliente:\n1. À vista — 10% de desconto\n2. Parcelado em 3x sem juros\n3. Cartão — até 12x com juros de 1.99% a.m.", at: "10/07/23 16:45", channel: "whatsapp", author: "CA", reactions: ["👍 2"] },
    { id: "p5", role: "contact", text: "Ótimo! Vou conversar com a área financeira e te retorno ainda hoje.", at: "10/07/23 16:48", channel: "whatsapp", author: "RM" },
  ];

  // Conversa 2 — WhatsApp, Finalizada, sobre prazo de entrega
  const messagesConvEntrega = [
    { id: "e1", role: "contact", text: "Boa tarde! Comprei o pedido #4582 e ainda não recebi a confirmação de envio.", at: "05/07/23 14:02", channel: "whatsapp", author: "RM" },
    { id: "e2", role: "agent", text: "Boa tarde, Ricardo! Já estou verificando o status do seu pedido.", at: "05/07/23 14:05", channel: "whatsapp", author: "CA" },
    { id: "e3", role: "agent", text: "Pedido #4582 saiu da nossa central hoje pela manhã. Previsão de entrega: 07/07.", at: "05/07/23 14:11", channel: "whatsapp", author: "CA" },
    { id: "e4", role: "agent", text: "Código de rastreio: BR9847263410\nPode acompanhar pelos Correios.", at: "05/07/23 14:12", channel: "whatsapp", author: "CA" },
    { id: "e5", role: "contact", text: "Perfeito, muito obrigado pela rapidez!", at: "05/07/23 14:14", channel: "whatsapp", author: "RM", reactions: ["🙏 1"] },
    { id: "e6", type: "system", text: "Conversa finalizada por Camila Alves em 05/07/23 às 14:16" },
  ];

  // Conversa 3 — WhatsApp, Finalizada, sobre segunda via de boleto
  const messagesConvBoleto = [
    { id: "b1", role: "contact", text: "Oi, preciso da segunda via do boleto do mês de junho. Pode me enviar?", at: "03/07/23 10:30", channel: "whatsapp", author: "RM" },
    { id: "b2", role: "agent", text: "Olá, Ricardo! Claro, vou gerar agora.", at: "03/07/23 10:33", channel: "whatsapp", author: "CA" },
    { id: "b3", role: "agent", text: "Identifiquei o boleto. Valor: R$ 1.247,90 — vencimento original: 30/06.", at: "03/07/23 10:35", channel: "whatsapp", author: "CA" },
    { id: "b4", role: "agent", text: "Como passou do vencimento, há juros de R$ 12,48. Novo total: R$ 1.260,38.\nNova data de vencimento: 10/07.", at: "03/07/23 10:36", channel: "whatsapp", author: "CA" },
    { id: "b5", role: "agent", text: "Enviei o boleto pelo seu e-mail cadastrado. Pode confirmar o recebimento?", at: "03/07/23 10:38", channel: "whatsapp", author: "CA" },
    { id: "b6", role: "contact", text: "Recebido! Vou efetuar o pagamento hoje mesmo. Valeu!", at: "03/07/23 10:52", channel: "whatsapp", author: "RM" },
    { id: "b7", type: "system", text: "Conversa finalizada por Camila Alves em 03/07/23 às 10:55" },
  ];

  // Conversa Jornada 12345679 — Julia Rodrigues, Mensagens Instagram
  const messagesJornada679 = [
    { id: "j79p1", role: "contact", text: "Olá, atendente.\nQuais as condições de pagamento?", at: "10/07/23 09:12", channel: "whatsapp", author: "JR" },
    { id: "j79p2", role: "agent", text: "Verificando. Aguarde um momento.", at: "10/07/23 09:14", channel: "whatsapp", author: "CA" },
    { id: "j79p3", type: "system", text: "Conversa iniciada com julia.rodrigues@gmail.com neste atendimento" },
    { id: "j79p4", role: "agent", text: "Julia, segue as possibilidades de pagamento para o cliente:\n1. À vista — 10% de desconto\n2. Parcelado em 3x sem juros\n3. Cartão — até 12x com juros de 1.99% a.m.", at: "10/07/23 16:45", channel: "whatsapp", author: "CA", reactions: ["👍 2"] },
    { id: "j79p5", role: "contact", text: "Ótimo! Vou conversar com a área financeira e te retorno ainda hoje.", at: "10/07/23 16:48", channel: "whatsapp", author: "JR" },
  ];

  // Conversa Jornada 12345680 — Fernanda Costa, Mensagens Instagram
  const messagesJornada680 = [
    { id: "j80b1", role: "contact", text: "Oi, preciso da segunda via do boleto do mês de junho. Pode me enviar?", at: "03/07/23 10:30", channel: "whatsapp", author: "FC" },
    { id: "j80b2", role: "agent", text: "Olá, Fernanda! Claro, vou gerar agora.", at: "03/07/23 10:33", channel: "whatsapp", author: "CA" },
    { id: "j80b3", role: "agent", text: "Identifiquei o boleto. Valor: R$ 1.247,90 — vencimento original: 30/06.", at: "03/07/23 10:35", channel: "whatsapp", author: "CA" },
    { id: "j80b4", role: "agent", text: "Como passou do vencimento, há juros de R$ 12,48. Novo total: R$ 1.260,38.\nNova data de vencimento: 10/07.", at: "03/07/23 10:36", channel: "whatsapp", author: "CA" },
    { id: "j80b5", role: "agent", text: "Enviei o boleto pelo seu e-mail cadastrado. Pode confirmar o recebimento?", at: "03/07/23 10:38", channel: "whatsapp", author: "CA" },
    { id: "j80b6", role: "contact", text: "Recebido! Vou efetuar o pagamento hoje mesmo. Valeu!", at: "03/07/23 10:52", channel: "whatsapp", author: "FC" },
    { id: "j80b7", type: "system", text: "Conversa finalizada por Camila Alves em 03/07/23 às 10:55" },
  ];

  // Conversa 4 — E-mail, Finalizada, sobre proposta comercial formal
  const messagesConvEmail = [
    { id: "em1", role: "contact", text: "Prezada Camila,\n\nGostaria de receber uma proposta formal das nossas condições de fornecimento para o próximo trimestre, incluindo descontos por volume.\n\nAtenciosamente,\nRicardo Mendes", at: "01/07/23 08:00", channel: "email", author: "RM" },
    { id: "em2", role: "agent", text: "Olá Ricardo, tudo bem?\n\nRecebi sua solicitação e já estou alinhando com o time comercial. Devo retornar com a proposta até amanhã ao final do dia.", at: "01/07/23 09:14", channel: "email", author: "CA" },
    { id: "em3", role: "agent", text: "Ricardo, segue em anexo a proposta para o Q3:\n\n• Volume até 500un: preço base\n• De 501 a 1.000un: 5% de desconto\n• Acima de 1.000un: 8% de desconto + frete CIF\n\nProposta válida por 15 dias. Aguardo retorno!", at: "02/07/23 17:22", channel: "email", author: "CA", reactions: ["✅ 1"] },
    { id: "em4", role: "contact", text: "Camila, recebi a proposta. Vou levar para aprovação interna e retorno até sexta.", at: "02/07/23 18:05", channel: "email", author: "RM" },
    { id: "em5", type: "system", text: "Conversa finalizada por Camila Alves em 02/07/23 às 18:10" },
  ];

  // ─────────────────────────────────────────────
  // Atendentes adicionais — para diversificar as conversas
  // ─────────────────────────────────────────────
  const bruno   = { id: "a2", initials: "BL", name: "Bruno Lima",      bg: "#e0e7ff", fg: "#3730a3", isAttendant: true };
  const diego   = { id: "a3", initials: "DC", name: "Diego Costa",     bg: "#fef3c7", fg: "#92400e", isAttendant: true };
  const eduardo = { id: "a4", initials: "EA", name: "Eduardo Almeida", bg: "#fce7f3", fg: "#9d174d", isAttendant: true };

  // ─────────────────────────────────────────────
  // Mensagens — geradas por cenário, coerentes com status/marcadores de cada atendimento
  // ─────────────────────────────────────────────

  // #123457 — Comercial, Aberto (Julia Rodrigues × Bruno Lima)
  const msgs_57_a = [
    { id: "57a1", role: "contact", text: "Bom dia! Recebi o link de vocês e queria saber mais sobre os planos corporativos.", at: "31/12/25 10:48", channel: "whatsapp", author: "JR" },
    { id: "57a2", role: "agent",   text: "Bom dia, Julia! Posso te enviar uma apresentação completa por e-mail. Confirma seu endereço?", at: "31/12/25 10:55", channel: "whatsapp", author: "BL" },
    { id: "57a3", role: "contact", text: "É julia.rodrigues@gmail.com. Vou aguardar!", at: "31/12/25 11:02", channel: "whatsapp", author: "JR" },
  ];
  const msgs_57_b = [
    { id: "57b1", role: "agent",   text: "Julia,\n\nSegue em anexo a proposta com os planos Corporate Pro e Corporate Plus para análise.\n\nAtenciosamente,\nBruno Lima", at: "28/12/25 16:30", channel: "email", author: "BL" },
    { id: "57b2", role: "contact", text: "Recebido, Bruno. Vou avaliar com a equipe e retorno até segunda.", at: "29/12/25 09:14", channel: "email", author: "JR" },
    { id: "57b3", type: "system", text: "Conversa finalizada por Bruno Lima em 29/12/25 às 09:20" },
  ];
  const msgs_57_c = [
    { id: "57c1", role: "agent",   text: "Olá Julia! Sou Bruno da Vonex. Como prometido, segue o contato direto para o atendimento corporativo.", at: "27/12/25 14:10", channel: "sms", author: "BL" },
    { id: "57c2", role: "contact", text: "Obrigada! Já vou registrar aqui.", at: "27/12/25 14:22", channel: "sms", author: "JR" },
    { id: "57c3", type: "system", text: "Conversa finalizada em 27/12/25 às 14:25" },
  ];

  // #123451 — Sem marker, Aberto (Marcos Ribeiro × Camila)
  const msgs_51_a = [
    { id: "51a1", role: "contact", text: "Bom dia, preciso atualizar meu endereço cadastrado.", at: "31/12/25 10:00", channel: "whatsapp", author: "MR" },
    { id: "51a2", role: "agent",   text: "Bom dia, Marcos! Pode me passar o novo endereço completo e o CEP?", at: "31/12/25 10:15", channel: "whatsapp", author: "CA" },
    { id: "51a3", role: "contact", text: "Rua das Palmeiras, 220 — Salvador/BA, CEP 40010-100", at: "31/12/25 10:18", channel: "whatsapp", author: "MR" },
  ];
  const msgs_51_b = [
    { id: "51b1", role: "contact", text: "Oi! Recuperei meu acesso ontem. Obrigado pela ajuda da semana passada!", at: "20/12/25 11:05", channel: "whatsapp", author: "MR" },
    { id: "51b2", role: "agent",   text: "Que ótimo, Marcos! Qualquer coisa, é só chamar.", at: "20/12/25 11:20", channel: "whatsapp", author: "CA" },
    { id: "51b3", type: "system", text: "Conversa finalizada por Camila Alves em 20/12/25 às 11:22" },
  ];

  // #123452 — Pagamento, Aberto (Fernanda Costa × Diego Costa)
  const msgs_52_a = [
    { id: "52a1", role: "contact", text: "Boa tarde, paguei o boleto ontem mas o sistema ainda não baixou. Pode verificar?", at: "31/12/25 09:30", channel: "whatsapp", author: "FC" },
    { id: "52a2", role: "agent",   text: "Boa tarde, Fernanda! Estou verificando aqui. Pode me enviar o comprovante?", at: "31/12/25 09:42", channel: "whatsapp", author: "DC" },
    { id: "52a3", role: "contact", text: "Enviei agora 👍", at: "31/12/25 09:45", channel: "whatsapp", author: "FC" },
  ];
  const msgs_52_b = [
    { id: "52b1", role: "contact", text: "Preciso da nota fiscal de novembro. Pode reenviar?", at: "12/12/25 08:30", channel: "email", author: "FC" },
    { id: "52b2", role: "agent",   text: "Bom dia, Fernanda! Acabei de reenviar a NF #34022 para o e-mail cadastrado.", at: "12/12/25 09:12", channel: "email", author: "DC" },
    { id: "52b3", role: "contact", text: "Recebi! Obrigada.", at: "12/12/25 10:00", channel: "email", author: "FC" },
    { id: "52b4", type: "system", text: "Conversa finalizada por Diego Costa em 12/12/25 às 10:05" },
  ];
  const msgs_52_c = [
    { id: "52c1", role: "contact", text: "Olá! O desconto de fidelidade está sendo aplicado no plano Gold?", at: "05/12/25 15:00", channel: "whatsapp", author: "FC" },
    { id: "52c2", role: "agent",   text: "Olá Fernanda! Sim, 8% de desconto já aplicado.", at: "05/12/25 15:10", channel: "whatsapp", author: "DC" },
    { id: "52c3", type: "system", text: "Conversa finalizada em 05/12/25 às 15:12" },
  ];

  // #123453 — Urgente, Pendente (Paulo Lucas × Eduardo Almeida)
  const msgs_53_a = [
    { id: "53a1", role: "contact", text: "URGENTE — o sistema travou aqui na minha loja. Estou perdendo vendas há 40 minutos.", at: "31/12/25 09:05", channel: "whatsapp", author: "PL" },
    { id: "53a2", role: "agent",   text: "Paulo, abri chamado urgente com a TI. Validando o servidor da sua região agora.", at: "31/12/25 09:10", channel: "whatsapp", author: "EA" },
    { id: "53a3", role: "contact", text: "Preciso de retorno em até 15min. Final de ano é crítico aqui.", at: "31/12/25 09:12", channel: "whatsapp", author: "PL" },
  ];

  // #123454 — Comercial, Encerrado (Ana Silva × Bruno Lima)
  const msgs_54_a = [
    { id: "54a1", role: "contact", text: "Bruno, conversamos com a diretoria e vamos fechar a proposta. Pode enviar o contrato.", at: "30/12/25 17:40", channel: "email", author: "AS" },
    { id: "54a2", role: "agent",   text: "Excelente notícia, Ana! Já estou preparando o contrato para assinatura digital.", at: "30/12/25 18:00", channel: "email", author: "BL" },
    { id: "54a3", role: "agent",   text: "Ana, contrato enviado para o e-mail. Assinatura via Clicksign.", at: "30/12/25 18:30", channel: "email", author: "BL" },
    { id: "54a4", type: "system", text: "Conversa finalizada por Bruno Lima em 30/12/25 às 18:45" },
  ];
  const msgs_54_b = [
    { id: "54b1", role: "contact", text: "Confirmando que assinamos. Aguardamos os próximos passos!", at: "30/12/25 18:48", channel: "whatsapp", author: "AS" },
    { id: "54b2", role: "agent",   text: "Perfeito, Ana! Bem-vinda à Vonex 🎉. Equipe de onboarding entra em contato amanhã.", at: "30/12/25 18:50", channel: "whatsapp", author: "BL", reactions: ["🎉 1"] },
    { id: "54b3", type: "system", text: "Conversa finalizada por Bruno Lima em 30/12/25 às 18:50" },
  ];

  // #123455 — Pagamento, Aberto (Jandilson Jesus × Camila)
  const msgs_55_a = [
    { id: "55a1", role: "contact", text: "Camila, recebi um aviso de débito que não reconheço. Pode me ajudar?", at: "30/12/25 16:00", channel: "whatsapp", author: "JJ" },
    { id: "55a2", role: "agent",   text: "Claro, Jandilson! Pode me passar o valor e a data do débito?", at: "30/12/25 16:20", channel: "whatsapp", author: "CA" },
    { id: "55a3", role: "contact", text: "R$ 247,90 em 28/12. Não tem descrição.", at: "30/12/25 16:34", channel: "whatsapp", author: "JJ" },
  ];
  const msgs_55_b = [
    { id: "55b1", role: "agent",   text: "Jandilson,\n\nSegue 2ª via do boleto vencido, já com juros recalculados.", at: "22/12/25 10:00", channel: "email", author: "CA" },
    { id: "55b2", role: "contact", text: "Recebido. Pago ainda hoje.", at: "22/12/25 11:00", channel: "email", author: "JJ" },
    { id: "55b3", type: "system", text: "Conversa finalizada por Camila Alves em 22/12/25 às 11:05" },
  ];
  const msgs_55_c = [
    { id: "55c1", role: "agent",   text: "Lembrete: seu boleto vence amanhã (R$ 1.247,90). Evite juros!", at: "21/12/25 18:00", channel: "sms", author: "CA" },
    { id: "55c2", type: "system", text: "Conversa finalizada em 21/12/25 às 18:00" },
  ];

  // #223456 — Cliente VIP, Aberto (Flavia Silva × Diego Costa)
  const msgs_2256_a = [
    { id: "256a1", role: "contact", text: "Diego, gostaria de antecipar a renovação anual com a condição VIP.", at: "30/12/25 11:30", channel: "whatsapp", author: "FS" },
    { id: "256a2", role: "agent",   text: "Boa tarde, Flavia! Como VIP, você tem 12% de desconto na antecipação. Preparo a proposta agora?", at: "30/12/25 11:55", channel: "whatsapp", author: "DC" },
    { id: "256a3", role: "contact", text: "Perfeito, manda por aqui mesmo.", at: "30/12/25 12:01", channel: "whatsapp", author: "FS" },
  ];
  const msgs_2256_b = [
    { id: "256b1", role: "agent",   text: "Flavia,\n\nOferta exclusiva VIP: upgrade para plano Diamond com 30 dias gratuitos. Válido até 05/01.\n\nAbraços,\nDiego", at: "28/12/25 09:00", channel: "email", author: "DC" },
    { id: "256b2", role: "contact", text: "Adorei a oferta! Vou decidir com o time e te aviso.", at: "28/12/25 14:30", channel: "email", author: "FS", reactions: ["💎 1"] },
    { id: "256b3", type: "system", text: "Conversa finalizada por Diego Costa em 28/12/25 às 14:40" },
  ];
  const msgs_2256_c = [
    { id: "256c1", role: "agent",   text: "Olá Flavia! Confirmamos sua reunião VIP no dia 03/01 às 14h.", at: "27/12/25 10:00", channel: "torpedo", author: "DC" },
    { id: "256c2", type: "system", text: "Conversa finalizada em 27/12/25 às 10:01" },
  ];
  const msgs_2256_d = [
    { id: "256d1", role: "agent",   text: "Sua sala VIP foi reservada. Link da reunião: vonex.ai/vip-flavia", at: "27/12/25 09:30", channel: "sms", author: "DC" },
    { id: "256d2", type: "system", text: "Conversa finalizada em 27/12/25 às 09:31" },
  ];

  // #223451 — Sem marker, Encerrado (Flavia Silva × Eduardo Almeida)
  const msgs_2251_a = [
    { id: "251a1", role: "contact", text: "Como mudo a senha do portal?", at: "29/12/25 19:00", channel: "whatsapp", author: "FS" },
    { id: "251a2", role: "agent",   text: "Olá Flavia! Acesse Configurações > Segurança > Alterar senha.", at: "29/12/25 19:15", channel: "whatsapp", author: "EA" },
    { id: "251a3", role: "contact", text: "Funcionou! Obrigada.", at: "29/12/25 19:22", channel: "whatsapp", author: "FS" },
    { id: "251a4", type: "system", text: "Conversa finalizada por Eduardo Almeida em 29/12/25 às 19:23" },
  ];

  // #223453 — Sem marker, Aberto (Ricardo Mendes × Bruno Lima)
  const msgs_2253_a = [
    { id: "253a1", role: "contact", text: "Bruno, abri esse novo atendimento para tratar do projeto do Q1.", at: "29/12/25 13:40", channel: "whatsapp", author: "RM" },
    { id: "253a2", role: "agent",   text: "Ricardo, ótimo! Já estou preparando o cronograma de kickoff.", at: "29/12/25 14:00", channel: "whatsapp", author: "BL" },
    { id: "253a3", role: "contact", text: "Topa marcar reunião dia 06/01?", at: "29/12/25 14:11", channel: "whatsapp", author: "RM" },
  ];
  const msgs_2253_b = [
    { id: "253b1", role: "agent",   text: "Ricardo,\n\nSegue agenda preliminar para o Q1 com 4 marcos principais.", at: "26/12/25 15:00", channel: "email", author: "BL" },
    { id: "253b2", role: "contact", text: "Recebido! Vou revisar até quinta.", at: "26/12/25 16:30", channel: "email", author: "RM" },
    { id: "253b3", type: "system", text: "Conversa finalizada por Bruno Lima em 26/12/25 às 16:35" },
  ];
  const msgs_2253_c = [
    { id: "253c1", role: "contact", text: "Oi Bruno, fechei aqui na ponta. Vamos seguir!", at: "23/12/25 17:00", channel: "whatsapp", author: "RM" },
    { id: "253c2", role: "agent",   text: "Excelente, Ricardo! Vou alinhar com o time.", at: "23/12/25 17:10", channel: "whatsapp", author: "BL" },
    { id: "253c3", type: "system", text: "Conversa finalizada por Bruno Lima em 23/12/25 às 17:12" },
  ];

  // #223454 — Sem marker, Aberto (Ana Silva × Camila)
  const msgs_2254_a = [
    { id: "254a1", role: "contact", text: "Camila, estou tendo erro 503 na integração desde ontem.", at: "29/12/25 09:00", channel: "whatsapp", author: "AS" },
    { id: "254a2", role: "agent",   text: "Ana, vou pedir para a TI olhar agora. Você consegue me passar o log?", at: "29/12/25 09:20", channel: "whatsapp", author: "CA" },
    { id: "254a3", role: "contact", text: "Vou enviar por e-mail, é grande.", at: "29/12/25 09:33", channel: "whatsapp", author: "AS" },
  ];
  const msgs_2254_b = [
    { id: "254b1", role: "contact", text: "Camila,\n\nSegue o log completo das últimas 24h em anexo.", at: "29/12/25 09:35", channel: "email", author: "AS" },
    { id: "254b2", role: "agent",   text: "Recebido, Ana. Já abri o ticket #INT-4422 com a TI. Resposta em até 4h.", at: "29/12/25 10:00", channel: "email", author: "CA" },
  ];
  const msgs_2254_c = [
    { id: "254c1", role: "contact", text: "Acabou a manutenção. Tudo funcionando aqui!", at: "28/12/25 18:00", channel: "whatsapp", author: "AS" },
    { id: "254c2", role: "agent",   text: "Que ótimo, Ana! Qualquer instabilidade nos avise.", at: "28/12/25 18:05", channel: "whatsapp", author: "CA" },
    { id: "254c3", type: "system", text: "Conversa finalizada por Camila Alves em 28/12/25 às 18:06" },
  ];
  const msgs_2254_d = [
    { id: "254d1", role: "agent",   text: "Alerta: manutenção programada hoje das 02h-04h. Pode haver instabilidade.", at: "28/12/25 17:00", channel: "sms", author: "CA" },
    { id: "254d2", type: "system", text: "Conversa finalizada em 28/12/25 às 17:01" },
  ];

  const atendimentos = [
    {
      id: "123456",
      titulo: "Atendimento ao cliente — Ricardo Mendes",
      dataInicio: "31/12/25 - 14:32",
      marcadores: [
        { label: "Pagamento", color: "#dd2e77" },
        { label: "Cliente VIP", color: "#9240FF" },
      ],
      contatos: [ricardo, camila, flavia, ana, marcos, paulo, jandilson],
      atendentes: [attendant, { ...flavia, isAttendant: true }, { ...marcos, isAttendant: true }],
      contatosExtra: 41,
      atendentesExtra: 41,
      conversas: [
        {
          id: "98452301", channel: "whatsapp", status: "Aberta", time: "16:48",
          contact: ricardo, fila: "🔥 Atendimento ao cliente",
          preview: "Ótimo! Vou conversar com a área financeira e te retorno…",
          unread: 2, messages: messagesConvPagamento,
        },
        {
          id: "87651122", channel: "whatsapp", status: "Finalizada", time: "05/07",
          contact: ricardo, fila: "📦 Fila de Logística",
          preview: "Perfeito, muito obrigado pela rapidez!",
          messages: messagesConvEntrega,
        },
        {
          id: "76234588", channel: "whatsapp", status: "Finalizada", time: "03/07",
          contact: ricardo, fila: "💰 Fila Financeiro",
          preview: "Recebido! Vou efetuar o pagamento hoje mesmo. Valeu!",
          messages: messagesConvBoleto,
        },
        {
          id: "65118903", channel: "email", status: "Finalizada", time: "02/07",
          contact: ricardo, fila: "💼 Fila Comercial",
          preview: "Camila, recebi a proposta. Vou levar para aprovação interna…",
          messages: messagesConvEmail,
        },
      ],
      status: "Aberta",
      slaTag: "-1d",
      tipo: "Atendimento ao cliente",
      tipoIcon: "🔥",
    },
    {
      id: "123457", titulo: "Atendimento ao cliente — Julia Rodrigues",
      dataInicio: "31/12/25 - 11:02",
      marcadores: [{ label: "Comercial", color: "#37B8FB" }],
      contatos: [julia], atendentes: [bruno],
      conversas: [
        { id: "c57a", channel: "whatsapp", status: "Aberta",     time: "11:02", contact: julia, fila: "💼 Fila Comercial",
          preview: "É julia.rodrigues@gmail.com. Vou aguardar!", unread: 1, messages: msgs_57_a },
        { id: "c57b", channel: "email",    status: "Finalizada", time: "29/12", contact: julia, fila: "💼 Fila Comercial",
          preview: "Recebido, Bruno. Vou avaliar com a equipe…",  messages: msgs_57_b },
        { id: "c57c", channel: "sms",      status: "Finalizada", time: "27/12", contact: julia, fila: "💼 Fila Comercial",
          preview: "Obrigada! Já vou registrar aqui.",            messages: msgs_57_c },
      ],
      status: "Aberto", slaTag: "+1d",
    },
    {
      id: "123451", titulo: "Atendimento ao cliente — Marcos Ribeiro",
      dataInicio: "31/12/25 - 10:18",
      marcadores: [],
      contatos: [marcos], atendentes: [attendant],
      conversas: [
        { id: "c51a", channel: "whatsapp", status: "Aberta",     time: "10:18", contact: marcos, fila: "🔥 Atendimento ao cliente",
          preview: "Rua das Palmeiras, 220 — Salvador/BA…", unread: 1, messages: msgs_51_a },
        { id: "c51b", channel: "whatsapp", status: "Finalizada", time: "20/12", contact: marcos, fila: "🔥 Atendimento ao cliente",
          preview: "Que ótimo, Marcos! Qualquer coisa, é só chamar.", messages: msgs_51_b },
      ],
      status: "Aberto", slaTag: "+3h",
    },
    {
      id: "123452", titulo: "Atendimento ao cliente — Fernanda Costa",
      dataInicio: "31/12/25 - 09:45",
      marcadores: [{ label: "Pagamento", color: "#dd2e77" }],
      contatos: [fernanda], atendentes: [diego],
      conversas: [
        { id: "c52a", channel: "whatsapp", status: "Aberta",     time: "09:45", contact: fernanda, fila: "💰 Fila Financeiro",
          preview: "Enviei agora 👍", unread: 2, messages: msgs_52_a },
        { id: "c52b", channel: "email",    status: "Finalizada", time: "12/12", contact: fernanda, fila: "💰 Fila Financeiro",
          preview: "Recebi! Obrigada.", messages: msgs_52_b },
        { id: "c52c", channel: "whatsapp", status: "Finalizada", time: "05/12", contact: fernanda, fila: "💰 Fila Financeiro",
          preview: "Sim, 8% de desconto já aplicado.", messages: msgs_52_c },
      ],
      status: "Aberto", slaTag: "+2d",
    },
    {
      id: "123453", titulo: "Atendimento ao cliente — Paulo Lucas",
      dataInicio: "31/12/25 - 09:12",
      marcadores: [{ label: "Urgente", color: "#f54336" }],
      contatos: [paulo], atendentes: [eduardo],
      conversas: [
        { id: "c53a", channel: "whatsapp", status: "Aberta", time: "09:12", contact: paulo, fila: "🚨 Fila Emergencial",
          preview: "Preciso de retorno em até 15min. Final de ano é crítico aqui.", unread: 3, messages: msgs_53_a },
      ],
      status: "Pendente", slaTag: "+5h",
    },
    {
      id: "123454", titulo: "Atendimento ao cliente — Ana Silva",
      dataInicio: "30/12/25 - 18:50",
      marcadores: [{ label: "Comercial", color: "#37B8FB" }],
      contatos: [ana], atendentes: [bruno],
      conversas: [
        { id: "c54a", channel: "email",    status: "Finalizada", time: "30/12", contact: ana, fila: "💼 Fila Comercial",
          preview: "Ana, contrato enviado para o e-mail. Assinatura via Clicksign.", messages: msgs_54_a },
        { id: "c54b", channel: "whatsapp", status: "Finalizada", time: "30/12", contact: ana, fila: "💼 Fila Comercial",
          preview: "Perfeito, Ana! Bem-vinda à Vonex 🎉", messages: msgs_54_b },
      ],
      status: "Encerrado", slaTag: "-1h",
    },
    {
      id: "123455", titulo: "Atendimento ao cliente — Jandilson Jesus",
      dataInicio: "30/12/25 - 16:34",
      marcadores: [{ label: "Pagamento", color: "#dd2e77" }],
      contatos: [jandilson], atendentes: [attendant],
      conversas: [
        { id: "c55a", channel: "whatsapp", status: "Aberta",     time: "16:34", contact: jandilson, fila: "💰 Fila Financeiro",
          preview: "R$ 247,90 em 28/12. Não tem descrição.", unread: 1, messages: msgs_55_a },
        { id: "c55b", channel: "email",    status: "Finalizada", time: "22/12", contact: jandilson, fila: "💰 Fila Financeiro",
          preview: "Recebido. Pago ainda hoje.", messages: msgs_55_b },
        { id: "c55c", channel: "sms",      status: "Finalizada", time: "21/12", contact: jandilson, fila: "💰 Fila Financeiro",
          preview: "Lembrete: seu boleto vence amanhã…", messages: msgs_55_c },
      ],
      status: "Aberto", slaTag: "+6h",
    },
    {
      id: "223456", titulo: "Atendimento ao cliente — Flavia Silva (VIP)",
      dataInicio: "30/12/25 - 12:01",
      marcadores: [{ label: "Cliente VIP", color: "#9240FF" }],
      contatos: [flavia], atendentes: [diego, attendant],
      conversas: [
        { id: "c256a", channel: "whatsapp", status: "Aberta",     time: "12:01", contact: flavia, fila: "💎 Fila VIP",
          preview: "Perfeito, manda por aqui mesmo.", unread: 1, messages: msgs_2256_a },
        { id: "c256b", channel: "email",    status: "Finalizada", time: "28/12", contact: flavia, fila: "💎 Fila VIP",
          preview: "Adorei a oferta! Vou decidir com o time…", messages: msgs_2256_b },
        { id: "c256c", channel: "torpedo",  status: "Finalizada", time: "27/12", contact: flavia, fila: "💎 Fila VIP",
          preview: "Olá Flavia! Confirmamos sua reunião VIP…", messages: msgs_2256_c },
        { id: "c256d", channel: "sms",      status: "Finalizada", time: "27/12", contact: flavia, fila: "💎 Fila VIP",
          preview: "Sua sala VIP foi reservada.", messages: msgs_2256_d },
      ],
      status: "Aberto", slaTag: "-1m",
    },
    {
      id: "223451", titulo: "Atendimento ao cliente — Flavia Silva",
      dataInicio: "29/12/25 - 19:22",
      marcadores: [],
      contatos: [flavia], atendentes: [eduardo],
      conversas: [
        { id: "c251a", channel: "whatsapp", status: "Finalizada", time: "29/12", contact: flavia, fila: "🔥 Atendimento ao cliente",
          preview: "Funcionou! Obrigada.", messages: msgs_2251_a },
      ],
      status: "Encerrado", slaTag: "+1d",
    },
    {
      id: "223453", titulo: "Atendimento ao cliente — Ricardo Mendes",
      dataInicio: "29/12/25 - 14:11",
      marcadores: [],
      contatos: [ricardo], atendentes: [bruno],
      conversas: [
        { id: "c253a", channel: "whatsapp", status: "Aberta",     time: "14:11", contact: ricardo, fila: "🔥 Atendimento ao cliente",
          preview: "Topa marcar reunião dia 06/01?", unread: 1, messages: msgs_2253_a },
        { id: "c253b", channel: "email",    status: "Finalizada", time: "26/12", contact: ricardo, fila: "🔥 Atendimento ao cliente",
          preview: "Recebido! Vou revisar até quinta.", messages: msgs_2253_b },
        { id: "c253c", channel: "whatsapp", status: "Finalizada", time: "23/12", contact: ricardo, fila: "🔥 Atendimento ao cliente",
          preview: "Excelente, Ricardo! Vou alinhar com o time.", messages: msgs_2253_c },
      ],
      status: "Aberto", slaTag: "+1d",
    },
    {
      id: "223454", titulo: "Atendimento ao cliente — Ana Silva",
      dataInicio: "29/12/25 - 09:33",
      marcadores: [],
      contatos: [ana], atendentes: [attendant],
      conversas: [
        { id: "c254a", channel: "whatsapp", status: "Aberta",     time: "09:33", contact: ana, fila: "🛠 Fila Suporte Técnico",
          preview: "Vou enviar por e-mail, é grande.", unread: 1, messages: msgs_2254_a },
        { id: "c254b", channel: "email",    status: "Aberta",     time: "29/12", contact: ana, fila: "🛠 Fila Suporte Técnico",
          preview: "Recebido, Ana. Já abri o ticket #INT-4422…", messages: msgs_2254_b },
        { id: "c254c", channel: "whatsapp", status: "Finalizada", time: "28/12", contact: ana, fila: "🛠 Fila Suporte Técnico",
          preview: "Que ótimo, Ana! Qualquer instabilidade nos avise.", messages: msgs_2254_c },
        { id: "c254d", channel: "sms",      status: "Finalizada", time: "28/12", contact: ana, fila: "🛠 Fila Suporte Técnico",
          preview: "Alerta: manutenção programada hoje…", messages: msgs_2254_d },
      ],
      status: "Aberto", slaTag: "+6h",
    },
  ];

  // ─────────────────────────────────────────────
  // Mensagens por contato — usadas na aba "Contato"
  // (mostra só as mensagens daquela pessoa neste atendimento)
  // ─────────────────────────────────────────────
  const messagesByContact = {
    camila: [
      { id: "ca1", role: "agent", text: "Bom dia, equipe! Estou pegando esse atendimento agora.", at: "10/07/23 09:02", channel: "whatsapp", author: "CA" },
      { id: "ca2", role: "agent", text: "Verificando. Aguarde um momento.", at: "10/07/23 09:14", channel: "whatsapp", author: "CA" },
      { id: "ca3", type: "system", text: "Camila adicionou Jandilson Jesus ao atendimento" },
      { id: "ca4", role: "agent", text: "Jandilson, pode me passar o histórico financeiro do cliente VIP?", at: "10/07/23 10:22", channel: "whatsapp", author: "CA" },
      { id: "ca5", role: "agent", text: "Ricardo, segue as possibilidades de pagamento para o cliente:\n1. À vista — 10% de desconto\n2. Parcelado em 3x sem juros\n3. Cartão — até 12x com juros de 1.99% a.m.", at: "10/07/23 16:45", channel: "whatsapp", author: "CA", reactions: ["👍 2"] },
      { id: "ca6", role: "agent", text: "Vou enviar a proposta por e-mail também para registro.", at: "10/07/23 16:52", channel: "email", author: "CA" },
    ],
    jandilson: [
      { id: "jj1", type: "system", text: "Jandilson Jesus entrou no atendimento" },
      { id: "jj2", role: "agent", text: "Oi Camila! Já estou olhando o cadastro do Ricardo aqui.", at: "10/07/23 10:24", channel: "whatsapp", author: "JJ" },
      { id: "jj3", role: "agent", text: "Cliente é VIP desde 2022, sem inadimplência. Pode oferecer as 3 opções padrão.", at: "10/07/23 10:31", channel: "whatsapp", author: "JJ" },
      { id: "jj4", role: "agent", text: "Se ele topar parcelar em mais de 6x, me chama que aprovo na hora.", at: "10/07/23 10:33", channel: "whatsapp", author: "JJ" },
      { id: "jj5", role: "agent", text: "Acabei de ver que tem campanha de desconto pra VIP até sexta. Cola na conversa!", at: "10/07/23 14:18", channel: "whatsapp", author: "JJ", reactions: ["🔥 1"] },
    ],
    paulo: [
      { id: "pl1", role: "contact", text: "Oi pessoal, sou o gerente da conta do Ricardo. Posso acompanhar?", at: "09/07/23 17:40", channel: "whatsapp", author: "PL" },
      { id: "pl2", role: "agent", text: "Claro, Paulo! Te adicionei como observador no atendimento.", at: "09/07/23 17:45", channel: "whatsapp", author: "CA" },
      { id: "pl3", role: "contact", text: "Perfeito. Qualquer dúvida sobre o contrato, me chama.", at: "09/07/23 17:46", channel: "whatsapp", author: "PL" },
      { id: "pl4", role: "contact", text: "Camila, lembra que o desconto VIP só vale acima de R$ 5k em pedido único.", at: "10/07/23 11:02", channel: "email", author: "PL" },
    ],
  };

  // ─────────────────────────────────────────────
  // Histórico completo — usado na aba "Histórico"
  // (todas mensagens de todos contatos/canais misturadas em ordem cronológica)
  // ─────────────────────────────────────────────
  const historicoCompleto = [
    { id: "all1", type: "system", text: "Atendimento #123456 iniciado em 09/07/23" },
    { id: "all2", role: "contact", text: "Oi pessoal, sou o gerente da conta do Ricardo. Posso acompanhar?", at: "09/07/23 17:40", channel: "whatsapp", author: "PL" },
    { id: "all3", role: "agent", text: "Claro, Paulo! Te adicionei como observador no atendimento.", at: "09/07/23 17:45", channel: "whatsapp", author: "CA" },
    { id: "all4", role: "contact", text: "Olá, atendente.\nQuais as condições de pagamento?", at: "10/07/23 09:12", channel: "whatsapp", author: "RM" },
    { id: "all5", role: "agent", text: "Verificando. Aguarde um momento.", at: "10/07/23 09:14", channel: "whatsapp", author: "CA" },
    { id: "all6", type: "system", text: "Camila adicionou Jandilson Jesus ao atendimento" },
    { id: "all7", role: "agent", text: "Jandilson, pode me passar o histórico financeiro do cliente VIP?", at: "10/07/23 10:22", channel: "whatsapp", author: "CA" },
    { id: "all8", role: "agent", text: "Oi Camila! Já estou olhando o cadastro do Ricardo aqui.", at: "10/07/23 10:24", channel: "whatsapp", author: "JJ" },
    { id: "all9", role: "agent", text: "Cliente é VIP desde 2022, sem inadimplência. Pode oferecer as 3 opções padrão.", at: "10/07/23 10:31", channel: "whatsapp", author: "JJ" },
    { id: "all10", role: "contact", text: "Camila, lembra que o desconto VIP só vale acima de R$ 5k em pedido único.", at: "10/07/23 11:02", channel: "email", author: "PL" },
    { id: "all11", role: "agent", text: "Acabei de ver que tem campanha de desconto pra VIP até sexta. Cola na conversa!", at: "10/07/23 14:18", channel: "whatsapp", author: "JJ", reactions: ["🔥 1"] },
    { id: "all12", role: "agent", text: "Ricardo, segue as possibilidades de pagamento para o cliente:\n1. À vista — 10% de desconto\n2. Parcelado em 3x sem juros\n3. Cartão — até 12x com juros de 1.99% a.m.", at: "10/07/23 16:45", channel: "whatsapp", author: "CA", reactions: ["👍 2"] },
    { id: "all13", role: "contact", text: "Beleza, Camila. Vou conversar com a área financeira e te retorno.", at: "10/07/23 16:48", channel: "whatsapp", author: "RM" },
    { id: "all14", role: "agent", text: "Vou enviar a proposta por e-mail também para registro.", at: "10/07/23 16:52", channel: "email", author: "CA" },
    { id: "all15", role: "contact", text: "Recebi o e-mail. Topo a parcelada em 3x sem juros!", at: "11/07/23 08:30", channel: "email", author: "RM" },
    { id: "all16", type: "system", text: "Status alterado para Aberta — aguardando geração do boleto" },
  ];

  // ─────────────────────────────────────────────
  // Jornadas — automated journey conversations
  // ─────────────────────────────────────────────
  const jornadas = [
    {
      id: "12345678",
      jornadaNome: "Jornada X",
      jornadaAtendente: null,
      contato: ricardo,
      channel: "whatsapp",
      time: "16:45",
      preview: "Camila, segue as possibilidades de pagamento para o client...",
      unread: 2,
      messages: messagesConvPagamento,
    },
    {
      id: "12345679",
      jornadaNome: "Mensagens Instagram",
      jornadaAtendente: null,
      contato: julia,
      channel: "whatsapp",
      time: "16:45",
      preview: "Julia, segue as possibilidades de pagamento para o client...",
      unread: 2,
      messages: messagesJornada679,
    },
    {
      id: "12345680",
      jornadaNome: "Mensagens Instagram",
      jornadaAtendente: null,
      contato: fernanda,
      channel: "whatsapp",
      time: "16:45",
      preview: "Fernanda, segue as possibilidades de pagamento para o clientes",
      unread: 0,
      messages: messagesJornada680,
    },
  ];

  return {
    queues, atendimentos, jornadas, contacts: { ricardo, camila, flavia, ana, marcos, paulo, jandilson, julia, fernanda }, attendant,
    recentSearches: ["00100300455", "Sem fila especifica", "Flavia Silva"],
    messagesByContact,
    historicoCompleto,
    historico: [
      { id: "h1", role: "contact", text: "Bom dia, comprei dois itens e só recebi um.", at: "15/06/23 09:01", channel: "whatsapp", author: "RM" },
      { id: "h2", role: "agent", text: "Bom dia, Ricardo. Posso conferir o seu pedido?", at: "15/06/23 09:05", channel: "whatsapp", author: "CA" },
      { id: "h3", type: "system", text: "Atendimento #112233 finalizado em 15/06/23 às 09:42" },
      { id: "h4", role: "contact", text: "Olá! Posso fazer uma troca de produto?", at: "21/06/23 14:18", channel: "email", author: "RM" },
      { id: "h5", role: "agent", text: "Claro, Ricardo. Vou abrir o ticket de troca agora.", at: "21/06/23 14:22", channel: "email", author: "CA" },
    ],
  };
})();
