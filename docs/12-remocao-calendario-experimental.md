# Remoção da página experimental de calendário

Pedido do utilizador em 31/10/2026: remover a experiência de agenda/turnos do projeto.

Removidos o componente, template, estilos e teste exclusivos, a rota `/app/calendar`, a declaração/importação no módulo Angular, os menus desktop/móvel, o atalho do dashboard, as traduções e a permissão `calendar.read` nos catálogos Angular e Java. A mensagem da área técnica já não indica uma agenda inexistente; também não apresenta um bloco vazio de atalhos.

Preservados os utilitários financeiros de datas, períodos e vencimentos, os filtros de 2012 a 2099, o relógio de Maputo e os respetivos testes. O ícone partilhado de data continua utilizado no perfil e na cobrança. As auditorias e evidências antigas são registos históricos, não funcionalidades ativas, e não foram adulteradas.

Validação: nenhuma referência operacional à página/componente/permissão removidos em `src` ou nos catálogos de permissões Java; build Angular de desenvolvimento aprovado; 31 testes Angular passaram (dashboard, permissões, períodos e recuperação). Passaram também 110 testes Java de autorização e cobrança multianual, sem ligação à base real.
