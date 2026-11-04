> Configuração atual (04/11/2026): [TXT e localStorage em produção](24-modo-navegador-producao.md). A integração Blob está suspensa no frontend; documentos anteriores são históricos.

# Auditoria e plano de modernização — Water System Management

Data de referência: **28/10/2026**. Natureza do trabalho: **análise, sem alterações funcionais**.

## Conclusão executiva

O projeto tem uma base aproveitável: Angular 19 com NG-ZORRO, separação `core/features/shared`, formulários, rotas protegidas, gestão de clientes e pagamentos, histórico de mensalidades, dashboard e geração de PDFs. O backend local já tem entidades próprias de mensalidade e pagamento, transações e associação dos meses liquidados ao pagamento. Não é necessário recriar a aplicação, mudar de framework ou substituir a biblioteca visual.

**A aplicação ainda não satisfaz as regras financeiras e de segurança necessárias para produção.** As melhorias recentes de apresentação e PDF não equivalem a faturação completa, alocação financeira validada ou auditoria contabilística.

Os impedimentos mais importantes são:

1. Erros da API, incluindo recusas de autorização ou validação, podem resultar em leitura/gravação local e mensagens de sucesso. A configuração de produção também permite esse percurso; a flag `useLocalFallback` não é consultada pelos serviços analisados.
2. O backend seleciona as mensalidades mais antigas, mas não compara o montante recebido com a soma das obrigações selecionadas. O modo local aceita valores divergentes e reduz a dívida.
3. Existem exclusões físicas de pagamentos, clientes e utilizadores. Não há fluxo completo de anulação financeira com motivo, autorização e auditoria. A exclusão local de pagamento nem sequer repõe a dívida.
4. O registo público de utilizadores aceita o perfil enviado pelo cliente. Existe também um endpoint público de inicialização de administrador. A desativação de utilizadores não é aplicada por `User.isEnabled()`.
5. Instalação, cancelamento/reativação, grupos tarifários, vencimento no dia 10, primeira mensalidade e adiantamentos não estão completos.
6. Recibos e demonstrativos são gerados, mas não existe um ciclo de fatura de dívida com série, itens, anulação e arquivo autoritativo confirmado no backend.

## Âmbito e limitações

- Frontend auditado: a árvore de trabalho atual desta pasta, incluindo alterações ainda não commitadas das etapas anteriores. Não se auditou apenas `HEAD`.
- Backend descoberto e consultado: `../water_sytem_management_java`. Confirmados no código **Java 17, Spring Boot 3.4.1, Spring Security, JPA/Hibernate e PostgreSQL no perfil de desenvolvimento**. A ligação de produção é configurável por ambiente.
- A correspondência entre esse checkout e a API atualmente publicada **não foi confirmada**. Descobertas sobre o backend referem-se ao código local.
- Não foram enviados pedidos à API publicada, criadas contas, feitas operações financeiras reais, modificados contratos ou alterados dados do navegador.
- Não se iniciou a aplicação Java nem se executou o seu teste de contexto com base de dados. A compilação offline foi executada com sucesso.
- As provas de comportamento local usam os métodos reais do código com armazenamento exclusivamente em memória, RxJS e stubs dos decorators Angular. Não são testes end-to-end nem provam o comportamento do servidor.
- Nenhuma dependência foi instalada ou atualizada nesta auditoria. Não foi feita análise de CVEs, pentest ou certificação fiscal.

## Documentação entregue

| Documento | Conteúdo |
|---|---|
| [Arquitetura e inventário](01-arquitetura-inventario.md) | Stack, módulos, rotas, modelos, serviços, contratos, segurança, i18n e dívida técnica |
| [Lacunas e riscos](02-lacunas-riscos.md) | Matriz de requisitos, defeitos prioritários e evidências de código |
| [Plano incremental](03-plano-modernizacao.md) | Sequência, responsabilidades, critérios de aceitação, primeiros ficheiros e decisões pendentes |
| [Validação executada](04-validacao.md) | Comandos, resultados, limites, provas locais e preservação do código |

## Resultados de validação

| Verificação | Resultado |
|---|---|
| Dependências presentes — `npm ls --depth=0` | Exit 0; existe `@angular/material` extraneous, ausente do `package.json` |
| TypeScript da aplicação | Passou |
| TypeScript dos testes | Passou; não equivale a os testes passarem |
| Build Angular de produção | Passou; bundle inicial 2,70 MB, avisos de orçamento e CommonJS |
| Jasmine/Karma + Chrome Headless | **16 executados: 3 passaram, 13 falharam** |
| Verificador existente de PDFs | Passou; executado com saídas redirecionadas para `tmp/audit/pdf` |
| Provas isoladas do modo local | Nove comportamentos problemáticos reproduzidos; detalhes em `04-validacao.md` |
| Backend — Maven offline, compilação sem testes | Passou, 41 fontes Java |
| Lint | Não configurado |
| Integração real, concorrência e base de dados | Não executadas |

## Recomendação

Antes de ampliar funcionalidades, aprovar uma etapa curta de contenção: separar explicitamente demonstração e produção, fechar percursos de autenticação/gestão de contas inseguros, reparar a infraestrutura dos testes e estabelecer os contratos financeiros. Depois evoluir instalação, tarifas, obrigações e pagamentos na sequência documentada. A implementação fica pendente de aprovação; esta entrega não aplica essas mudanças.

## Atualizações posteriores à auditoria

A auditoria acima é um retrato de 28/10/2026. As alterações autorizadas posteriormente estão registadas em [Calendário e recuperação de mensalidades](05-calendario-cobranca.md) e [Histórico organizado de commits](06-historico-commits.md). As evidências novas não substituem os resultados originais da auditoria.

O controlo de acesso de 31/10/2026, a matriz aplicada e as contas de teste encontram-se em [Roles e permissões](09-roles-permissoes.md).

A navegação e recuperação entre anos, os filtros de 2012 a 2099 e respetivas verificações estão em [Suporte multianual](11-suporte-multianual.md).

A página experimental de calendário foi retirada: [Remoção da agenda experimental](12-remocao-calendario-experimental.md). As regras financeiras de datas continuam disponíveis.

O menu lateral e móvel foram reorganizados em grupos discretos: [Organização da navegação](13-menu-lateral.md).

A apresentação dos estados foi uniformizada em [Estados da interface](14-estados-interface.md), preservando os códigos e regras existentes.

A revisão de 01/11/2026 e as alterações preparatórias estão em [Arquitetura e produção](16-arquitetura-producao.md). Este relatório distingue a situação atual das descobertas históricas acima.

A implementação dos modos local/Vercel, preservação e backups está em [Modos e backups](17-modos-local-vercel-backups.md). Os ambientes anteriores com API Spring direta permanecem documentados como histórico; produção agora aponta para /api na Vercel. A ativação na nuvem exige configuração privada e importação validada.

A organização de pastas, a separação de responsabilidades e o padrão de formatação estão descritos em [Organização do código](18-organizacao-clean-code.md). Os caminhos de relatórios antigos representam a estrutura na data de cada análise.
