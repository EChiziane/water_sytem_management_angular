# Plano incremental de modernização — para aprovação

**Nenhuma etapa abaixo foi implementada nesta auditoria.** Preservar Angular, NG-ZORRO, NgModules, rotas e funcionalidades existentes sempre que possível. O plano deve ser aprovado antes de alterações funcionais.

## Princípios de evolução

1. Corretude financeira e separação de ambientes precedem novas telas.
2. Regras críticas, autorização, numeração e persistência são garantias do backend. A interface apresenta a mesma decisão, mas não a substitui.
3. Introduzir contratos compatíveis e adaptadores; não mudar todos os consumidores simultaneamente nem inventar endpoints sem backend correspondente.
4. Cada entrega deve ter uma regressão pequena e relevante, critérios verificáveis e possibilidade de rollback de aplicação. Uma reversão de versão não deve apagar movimentos financeiros válidos.
5. Migrar dados com reconciliação, backup e validação de totais. Histórico já sobrescrito pode exigir fontes externas; não o reconstruir automaticamente com a tarifa atual.
6. Preservar `/app/customer`, `/app/customer-detail/:id`, `/app/payment`, `/app/payment-detail/:id` e `/app/receipts`, adicionando ações onde o utilizador já trabalha.

## Etapa 0 — contenção e base de verificação

Objetivo: impedir que a aplicação apresente resultados locais como operações reais e preparar uma base de teste utilizável.

- Definir modos explícitos `api` e `demo`; escolher a origem antes do pedido. Em modo API, 400/401/403/409/timeout devem continuar como falhas. Não criar gravação local compensatória.
- Identificar visualmente o modo demonstrativo. Retirar seeds/credenciais de demonstração do artefacto de produção; preservar preferência de idioma e filtros locais não financeiros.
- Fechar registo público com atribuição livre de role e endpoint de seed administrativo; rever inicialização e exposição da entidade User. Atribuição de privilégios depende de utilizador autorizado.
- Aplicar desativação no login e no filtro de tokens; rejeitar sessão inválida no frontend sem substituir `/me` por um funcionário local.
- Reparar TestBeds com providers/mocks e imports necessários. Manter asserções úteis; não introduzir schemas apenas para esconder testes incompletos.
- Separar erros de transporte, autorização e domínio; expor a origem real dos dados. Limitar o Bearer à API pretendida.

Aceitação: erro de validação/403/timeout não altera localStorage financeiro; login recusado não abre dashboard demo; utilizador inativo não autentica nem reutiliza token; registo público não consegue escolher ADMIN; testes existentes voltam a executar sem erros de infraestrutura. Confirmar políticas de criação de contas antes de abrir novos percursos.

## Etapa 1 — modelos, contratos e persistência

- Modelar separadamente cliente/contrato, instalação, tarifa/grupo/vigência, obrigação mensal, fatura/item, pagamento/alocação, recibo e evento de auditoria.
- Acrescentar campos de forma compatível, mantendo adaptadores para os DTOs antigos enquanto os consumidores migram.
- Uniformizar comandos de criação e respostas. POST pagamento deve devolver um DTO documentado compatível com a listagem/detalhe. Resolver `/auth/register`, billing geral e formato de ano/mês.
- Definir valor monetário no backend como representação decimal exata, com escala e arredondamento documentados. No transporte, escolher explicitamente decimal em string ou unidade mínima inteira; não impor um formato sem acordo.
- Substituir limitações comerciais acidentais de `byte`; acordar identificação de válvulas e quantidade de meses.
- Introduzir migrations versionadas e verificação do esquema real. Não trocar `ddl-auto` sem mapear a BD existente e o processo de publicação.
- Inventariar outros consumidores antes de alterar URLs ou semântica de campos. Versionar ou manter compatibilidade quando necessário.

Aceitação: exemplos request/response validados em testes de contrato; códigos de erro estáveis; nomes de estado/método canónicos; instalações e tarifas antigas migradas com regra explícita; compilações e principais fluxos preservados.

## Etapa 2 — ciclo de cliente e instalação

- Introduzir AWAITING_INSTALLATION, ACTIVE, CANCELLED com ações de confirmar instalação, cancelar e reativar.
- Data, funcionário e identificação da instalação passam a ser persistidos. Confirmar campos obrigatórios em cadastro e instalação.
- Guardar contrato/código estáveis; nunca recriar o cliente para o reativar.
- Registar alterações de válvula e impedir que edições cadastrais reescrevam documentos pagos.
- Cancelamento preserva dívida; interrupção de novas obrigações depende da data/regra aprovada.

Aceitação: cadastro não ativa nem cobra indevidamente; confirmação de instalação ativa uma única vez; cliente ativo pode estar em dívida; cancelamento/reativação preservam código, contrato e saldos; não há hard delete de cliente com histórico financeiro.

Bloqueio específico: política de cancelamento com períodos futuros pagos. Até aprová-la, recomendar revisão manual e impedir a transição automática nesses casos, sem apagar crédito ou emitir reembolso implícito.

## Etapa 3 — tarifas e obrigações mensais

- Criar grupos tarifários e versões com vigência. Cada obrigação retém tarifa e valor efetivamente aplicados.
- Gerar um registo por mês/cliente, idempotente, a partir da instalação/contrato e transições do ciclo.
- Definir dueDate e estado overdue na timezone Africa/Maputo; dias 1–10 são período normal, dia 11 em diante é atraso quando ainda em aberto.
- Implementar primeira mensalidade só após aceitar o algoritmo de fronteira e os exemplos comerciais.
- Recalcular apenas períodos abertos elegíveis por mudança de grupo/tarifa, com antes/depois, motivo e ator. Meses já pagos permanecem iguais, inclusive futuros.
- Tornar explicitamente segura a geração periódica/manual; um GET não deve produzir dívida inesperada.

Aceitação: mesma geração repetida não duplica obrigações; nenhuma cobrança depende de emitir fatura; dívidas diferenciam em aberto e vencidas; mês pago não muda ao alterar tarifa; cliente cancelado segue o calendário aprovado.

## Etapa 4 — dívida, alocação e pagamento

- Backend calcula uma quote com períodos antigos primeiro, valor por obrigação, total, moeda, versão/validade e aviso de futuro quando aplicável.
- Frontend apresenta essa quote nos dois percursos existentes de pagamento; retirar cálculo autoritativo de componentes e evitar prévias com ordenação divergente.
- No comando, recalcular/validar sob transação e controlo de concorrência. Recebido deve coincidir exatamente com os meses completos. Não aceitar parcial ou valor arbitrário.
- Introduzir idempotency key persistida e proteção concorrente sobre as obrigações. Uma referência única por si só não evita duplo efeito de um pedido repetido.
- Confirmar pagamento e criar allocations/snapshots/recibo de forma consistente. Um pendente não é recebido nem liquida dívida.
- Validar métodos: numerário, M-Pesa, e-Mola e transferência bancária, com códigos acordados.
- Substituir DELETE/PUT destrutivos por anulação/correção autorizadas; repor cada obrigação afetada e conservar a identidade do pagamento e recibo originais.

Aceitação: duas caixas não liquidam o mesmo mês; repetir um pedido devolve o resultado original; valor a menos/a mais é recusado; tarifa histórica por período prevalece sobre a mensalidade atual; anulação restaura o saldo e deixa evento auditável.

Sem override nesta etapa. Só adicionar exceção após aprovação de política completa: papéis, motivos, limites, aprovação, evidência e efeitos contabilísticos.

## Etapa 5 — faturas e recibos

- Reaproveitar o gerador PDF existente como camada de apresentação, alimentada por DTOs persistidos de documentos/allocations.
- Fatura consolida obrigações em aberto e não comprova pagamento. Recibo documenta um pagamento confirmado. Demonstrativo continua explicitamente distinto enquanto o ciclo de faturas não estiver implementado.
- Numeração atómica e não reutilizável no backend; formato e séries dependem de decisão. Não derivar número de count/list.length.
- Recibo inclui cliente, cada período, valor individual, total, moeda, data, método e funcionário. Não dividir o total igualmente para reconstruir valores históricos desconhecidos.
- Emitir/archive com metadados estáveis, estado, referência de anulação e versão do documento. Reimpressão não deve mudar história com base no cadastro atual.
- Confirmar dados legais da empresa e semântica tributária. Corrigir origem do campo tax antes de promover os PDFs a documentos oficiais.
- Resolver os endpoints documentais ausentes sem adicionar um segundo arquivo paralelo.

Aceitação: fatura sem pagamento não aparece como recebida; anular fatura não apaga obrigação; pagamento gera recibo uma única vez; reimpressão mantém valores; PDF multipágina tem margens e paginação; os exemplos preservam tarifas diferentes por mês.

## Etapa 6 — pagamentos antecipados

- Estender quote/alocação para além dos meses abertos, criando períodos futuros individualmente.
- Mostrar confirmação quando a quote inclui meses futuros, com períodos e total.
- Não impor um limite comercial de meses inexistente. Lidar com limites técnicos de pedido através de paginação/lotes documentados, sem truncar a escolha silenciosamente.
- Período futuro pago não entra em dívida e não é recalculado quando a tarifa muda.
- Articular com cancelamento e anulação do pagamento sem inventar uma política de reembolso.

Aceitação: cliente sem dívida consegue antecipar; cada mês futuro é identificável; tarifa futura paga permanece inalterada; ausência de confirmação cancela o submit; não são fabricados meses anteriores.

## Etapa 7 — permissões e auditoria completas

- Aprovar e aplicar a matriz por ação: criar cliente, instalar, mudar tarifa, faturar, receber, anular, consultar/exportar relatórios e gerir contas.
- Backend obtém ator da sessão autenticada, nunca de `createdBy` enviado livremente pelo cliente.
- Registar eventos com instante, ator original, entidade, antes/depois e motivo. Auditabilidade é transversal às etapas anteriores, não apenas uma tela no fim.
- Preservar funcionários desativados nos registos históricos; não usar exclusão física para gestão normal.
- Integrar recuperação de password apenas com contrato e canal realmente implementados, sem alegar envio de OTP não verificado.

Aceitação: alterar role/localStorage não amplia permissões da API; operador sem autorização não anula; ex-funcionário permanece identificado nos recibos; evento e mudança financeira pertencem à mesma unidade de consistência ou mecanismo equivalente auditável.

## Etapa 8 — dashboard, relatórios e localização

- Agregados de dívida e recebidos devem vir de obrigações/allocations e estados válidos da API, com filtros de data e fuso coerentes.
- Distinguir pendente, confirmado e anulado. Não mostrar erro de consulta como saldo zero real.
- Completar relatórios de faturas, recibos, alterações tarifárias, instalação/cancelamento e auditoria conforme permissões.
- Migrar textos e mensagens por funcionalidade para os dicionários PT/EN. PDFs devem receber locale explícito.
- Manter relatório de demonstração identificado como tal. Exportação de localStorage não é backup financeiro de produção.

Aceitação: totais conciliam com o livro de obrigações/pagamentos; relatórios respeitam escopo/permissão; troca PT/EN cobre telas, erros e documentos; filtros usam Africa/Maputo.

## Etapa 9 — entrega e preparação de produção

- Fixar Node LTS compatível, lockfile e instalação limpa de CI; esclarecer pacote extraneous.
- Lint configurado sem mascarar inconsistências; typecheck, testes unitários, contratos e E2E no pipeline.
- Testar em BD descartável: migrations, concorrência, idempotência, anulações, backups/restauro e reconciliação.
- Rever perfis de configuração, segredos, CORS das origens efetivas e deploy frontend/backend. Não usar wildcard para resolver falhas sem estudar credenciais/origens.
- Decidir CSR ou SSR. Não assumir que o script de SSR funciona sem configurar o build e proteger acessos a window/localStorage.
- Só depois otimizar bundle/lazy loading e remover duplicações maiores; não elevar budgets como solução para peso.

## Responsabilidades propostas preservando a estrutura

| Camada | Deve fazer | Não deve fazer |
|---|---|---|
| Componentes `features/` | Formulários, interação, estados de loading/erro, confirmação de futuro, apresentação da quote | Decidir valor autoritativo, fabricar meses, escolher funcionário ou reescrever histórico |
| Serviços de aplicação/feature | Orquestrar quote/comando/refresh, estados e fluxos compartilhados | Persistir operação real no demo após erro HTTP |
| Adaptadores de API em `core/` | DTOs explícitos, mapeamento, códigos de erro e compatibilidade de versões | Fingir que DTO parcial é modelo completo com cast |
| Modelos em `shared/models/` | Estados canónicos, moeda, referência de período, contrato de allocation/documento | Misturar credenciais, perfil público e registo financeiro numa interface permissiva |
| Guards | Ajudar navegação e experiência por sessão/perfil | Substituir autorização do backend |
| Interceptors | Token só para API, tratamento técnico de sessão/correlação | Desviar um 403 para gravação local |
| Utilitários puros | Datas, formatação, apresentação, validações de formulário não autoritativas | Inventar tarifa ou rateio histórico |
| Estado local da UI | Filtros, seleção, preferências e origem dos dados | Ser livro financeiro de produção |
| Backend | Regras, transações, autorização, numeração, concurrency, auditoria e persistência | Confiar em valor/permissão/ator enviados pela interface |

## Primeiros ficheiros a modificar após aprovação

Ordem sugerida, com mudança pequena por entrega:

1. `src/environments/{environments,environment.prod}.ts`; `core/services/{customer,payment,billing,monthly-charge,user,recibo,customer-payment-invoice}.service.ts`; `core/auth/auth.service.ts`: origem dos dados, erros e fallback.
2. Backend `infra/security/{SecurityConfigurations,SecurityFilter}.java`, `models/user/User.java`, `controllers/AuthenticationController.java`, `services/auth/AuthorizationService.java`, `infra/config/DataInitializer.java`: privilégios, estado e DTOs seguros.
3. Testes existentes de serviços/componentes, configuração de testes e mocks compartilhados: restabelecer baseline utilizável.
4. `shared/models/*`, DTOs Java e controllers de clientes/billing/pagamentos: contrato incremental, dinheiro, quantidade e estados.
5. Backend `services/{customer/CustomerService,billing/MonthlyChargeService,payment/PaymentService}.java`, entidades/repositories correspondentes: ciclo, obrigações, validação, concorrência e anulação.
6. `features/payments/payment.component.ts` e `features/customers/customer-details/customer-details.component.ts`: consumir quote e remover duplicação de regras autoritativas.
7. `core/utils/payment-document.ts`, serviços PDF e arquivo de recibos: itens reais, documentos persistidos e séries aprovadas.

## Decisões que realmente bloqueiam etapas futuras

| Decisão / informação | O que bloqueia | Comportamento provisório recomendado |
|---|---|---|
| Qual release/backend e esquema estão efetivamente em produção? Existe staging e BD descartável? | Integração, migrations e testes financeiros reais | Trabalhar com contratos locais e testes isolados; não operar dados reais |
| Como tratar cancelamento com meses futuros já pagos? Crédito, suspensão de vínculo, transferência ou reembolso? | Cancelamento com adiantamentos | Encaminhar para decisão autorizada; não apagar/recalcular pré-pagos |
| Quem pode instalar, mudar tarifas, receber, anular e gerir utilizadores? | Política completa de autorização | Menor privilégio e negação de operações sensíveis sem autorização definida |
| Quais campos são obrigatórios no cliente/contrato/instalação? | Validações finais e migração de cadastros | Preservar campos atuais, apontando dados incompletos sem inventar valores |
| Qual formato/série/reinício dos números de fatura e recibo? Como importar números antigos? | Emissão documental oficial | Não promover count+1 a série definitiva; reservar identidade técnica sem reutilizar |
| Qual é a fronteira exata da primeira mensalidade e a referência da primeira obrigação? | Cálculo 100%/50% | Aprovar exemplos datados e inclusividade antes de automatizar |
| Qual política de exceção para recebido diferente? | Apenas funcionalidade de override | Rejeitar divergência; não criar exceção implícita |
| O que significa tax no histórico e quais dados legais devem constar dos documentos? | Reconciliação de imposto e documentos finais | Não certificar valores fiscais; manter demonstrativo distinto da fatura |

Estas decisões não impedem a correção do fallback, testes de infraestrutura ou das vulnerabilidades inequívocas de atribuição pública de privilégios. Também não autorizam implementações silenciosas: toda alteração funcional continua pendente de aprovação deste plano.

## Matriz mínima de testes de aceitação a acrescentar

- Erros 400/401/403/409 e timeout não produzem sucesso financeiro local.
- Instalação repetida não duplica ativação/cobrança; ativo com dívida continua ativo.
- Dia 10 versus 11; fronteira 15/16 dias; fevereiro, ano bissexto e mudança de mês/fuso.
- Tarifa diferente em meses sucessivos; alteração de grupo recalcula somente abertos elegíveis.
- Quote paga antigos primeiro e corresponde ao submit; recebido menor/maior/zero/negativo e quantidade fracionária são rejeitados conforme contrato.
- Duplo clique/reenvio e dois operadores simultâneos sobre os mesmos meses.
- Pendente não liquida; confirmado produz uma única allocation e recibo; anulação repõe obrigações sem apagar o original.
- Adiantamento com e sem dívida, confirmação de futuro, mais de 127 meses sem limitação acidental do byte e preservação após mudança tarifária.
- Fatura não é recibo; anulação de fatura não apaga a dívida; reimpressão mantém valores históricos e datas documentais.
- Funcionário inativo e token anterior; perfil local adulterado; permissões de exportação e anulação.
- PT/EN, totais conciliados, PDF com valores individuais por mês e nomes/moradas longos.
