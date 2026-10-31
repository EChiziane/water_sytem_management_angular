# Roles, permissões e contas de teste

Implementação incremental de 31/10/2026 no Angular e no backend Java existente. Preserva as rotas e os dados anteriores. As permissões aplicam-se às funcionalidades existentes; não representam a conclusão de todos os módulos previstos no plano de modernização.

## Matriz aplicada

| Área / ação existente | ADMIN | MANAGER | OPERATOR | TECHNICIAN |
|---|---|---|---|---|
| Perfil próprio e calendário | Sim | Sim | Sim | Sim |
| Dashboard operacional com clientes | Sim | Sim | Sim | Não |
| Consulta de clientes e histórico no atendimento | Sim | Sim | Sim | Não |
| Criar cliente | Sim | Sim | Não | Não |
| Editar nome, contacto e endereço | Sim | Sim | Sim | Não |
| Alterar estado / válvula pelo fluxo existente | Sim | Sim | Não | Não |
| Alterar mensalidade de cliente existente | Sim | Não | Não | Não |
| Registar pagamento e emitir documentos | Sim | Sim | Sim | Não |
| Listagem geral de pagamentos / recibos | Todos | Todos | Operações próprias | Não |
| Relatórios financeiros / listas em PDF | Sim | Sim | Não | Não |
| Sincronização manual de mensalidades | Sim | Sim | Não | Não |
| Perfil privado da empresa | Sim | Não | Não | Não |
| Criar / editar / desativar utilizadores | Sim | Não | Não | Não |
| Eliminar fisicamente clientes, pagamentos ou recibos | Não | Não | Não | Não |

A consulta do histórico de um cliente continua disponível ao operador para atendimento, incluindo pagamentos registados por colegas. O filtro de operações próprias aplica-se à listagem geral e, por consequência, aos pagamentos recentes no dashboard e ao arquivo geral de recibos. A interface técnica apresenta uma indicação de que ainda não existem instalações atribuídas e não solicita clientes nem pagamentos.

## Contas para testar

| Nome | Login | Role | PIN inicial |
|---|---|---|---|
| Ana | `anaAC` | ADMIN | `123456` |
| Bruno | `brunoAC` | MANAGER | `123456` |
| Carla | `carlaAC` | OPERATOR | `123456` |
| David | `davidAC` | TECHNICIAN | `123456` |

As contas existentes conservam logins, PINs e estado. A inicialização é idempotente: um login já existente não é substituído nem reativado. Novas contas criadas pela administração usam o primeiro nome em minúsculas seguido de `AC`; uma colisão de login é rejeitada.

- **Demonstração Angular:** as contas em falta são acrescentadas ao carregar o estado local, incluindo durante o login. Não é necessário limpar o armazenamento ou perder os dados atuais. Só funciona no desenvolvimento com `useLocalFallback` e após indisponibilidade de rede no pedido de login. Respostas HTTP 401/403 não ativam demonstração.
- **API Java:** `DemoUserSeeder` cria estas contas ao iniciar o backend com o perfil `dev`, com PIN codificado em BCrypt. Reiniciar o backend para executar o inicializador. `app.demo-users.enabled=false` desativa-o; o perfil `prod` não o carrega. Esta entrega verificou o inicializador com testes, sem iniciar uma ligação à base de dados real nem afirmar que já existem quatro novas linhas nessa base.
- Os PINs publicados servem para estas contas de teste. Não ativar este conjunto de contas em produção.

## Como verificar

1. Terminar sessão e entrar com cada login e o PIN indicado.
2. Ana encontra Empresa e Utilizadores; Bruno e Carla não encontram esses menus.
3. Tentar abrir `/app/company` e `/app/users` diretamente com outra role: aparece acesso restrito. O backend também recusa esses recursos.
4. Carla consulta clientes e regista pagamentos. As opções de tarifa, estado e válvula não podem ser alteradas por ela; exportações financeiras não aparecem. Registar um pagamento de teste permite vê-lo na sua listagem geral.
5. Bruno pode criar clientes, gerir os campos operacionais e exportar listas; não pode administrar a empresa, contas ou alterar a mensalidade existente.
6. David encontra a área técnica, calendário e perfil, sem listagens financeiras. URLs de clientes, pagamentos e recibos são recusados.
7. Desativar outra conta como Ana: a identidade permanece no sistema e o login fica bloqueado. A desativação da própria conta e a remoção do último administrador ativo são recusadas.

## Garantias e limites

- Catálogos explícitos de permissões no Angular e Java. Guards e menus ajudam a navegação; a API é a autoridade para dados persistidos e verifica permissões também nos campos protegidos do cliente.
- Erros de APIs autenticadas nunca são convertidos em sucesso local. Uma sessão de demonstração seleciona o armazenamento local antes de fazer pedidos. O token de demonstração não é enviado como Bearer à API.
- A API volta a carregar o utilizador a cada Bearer e não autentica contas inativas. No modo local, a sessão volta a consultar role e estado no estado de demonstração.
- A criação pública de contas e o antigo endpoint público de inicialização de ADMIN foram bloqueados. Só ADMIN cria contas.
- A desativação substitui a eliminação de utilizadores para preservar referências históricas. O PIN não entra no objeto de sessão nem nos DTOs de resposta da API.
- Recibos na API são uma projeção dos pagamentos confirmados, com o número já persistido no pagamento. A emissão repetida não cria uma segunda transação. Esta projeção não é um novo arquivo fiscal nem uma nova convenção de numeração.
- Os documentos recebem dados do emitente por `/company/issuer`, autorizado às funções que emitem documentos, sem expor os campos privados de versão e auditoria da configuração. A página Empresa continua exclusiva de ADMIN. Os contactos públicos existentes continuam disponíveis na página pública.
- ADMIN também está sujeito à validação do valor recebido. Alterações de contactos no modo local já não reescrevem os snapshots dos pagamentos anteriores.
- A recuperação automática das mensalidades existente continua operacional. Não se implementou aqui um novo motor financeiro ou uma nova política de tarifas.

**Pendências explícitas:** atribuições e confirmação de instalações; histórico de válvulas; gestão de grupos/histórico de tarifas; fluxo persistido de pedido e aprovação de anulação por pessoas distintas; auditoria geral e sua página; matriz mais granular por equipa; evolução dos estados antigos de cliente para o ciclo de instalação; regras financeiras e concorrência identificadas na auditoria inicial. `payments.annul.request`, `payments.annul.approve` e `audit.read` ficam reservadas no catálogo, sem anunciar uma página ou operação implementada. Até existir uma anulação auditável, não se permite a eliminação física de transações, incluindo por ADMIN.

## Validação

- **26 testes Angular passaram**: permissões, sessão, modo local, configuração da empresa e dashboard em ChromeHeadless.
- **41 testes Java passaram**: segurança HTTP para as quatro roles, inicializador de contas, desativação, campos protegidos, âmbito dos pagamentos, empresa e calendário de cobrança, sem dependência de uma base real.
- Build de desenvolvimento Angular e compilação Java executados com sucesso.
- O build de produção normal encontrou timeout ao descarregar Roboto de `fonts.googleapis.com`. O mesmo alvo de produção passou com otimização de scripts/estilos e apenas o inline remoto de fontes desativado para verificação, sem mudar a configuração do projeto.
- O navegador integrado recusou a observação do separador por política de URL. Não se contornou o bloqueio; a interação manual completa nesse separador não foi validada. Os testes de componentes executaram no ChromeHeadless.

Não foram executados testes de integração contra PostgreSQL nem se declara toda a aplicação pronta para produção.
