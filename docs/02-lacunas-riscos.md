# Matriz de requisitos, defeitos e riscos

## Critérios

- **IMPLEMENTED**: o comportamento indicado foi encontrado no código consultado; não é certificação de produção.
- **PARTIAL**: há uma base, mas o requisito completo não é garantido ou diverge entre frontend, API e demonstração.
- **MISSING**: não foi encontrada implementação nos caminhos de execução inspecionados.
- **UNKNOWN**: a conclusão depende de informação externa, ambiente publicado ou decisão ainda não formalizada.
- **P0**: impedir uso de produção inseguro; **P1**: corrigir antes de operar financeiramente; **P2**: completar operação/qualidade; **P3**: melhoria posterior.

Os códigos de ficheiro F/B usados na tabela são resolvidos no catálogo de evidências no fim deste documento. A coluna backend indica dependência futura, mesmo quando a falha também aparece no frontend.

## Matriz

| Funcionalidade | Esperado | Encontrado | Estado | Ficheiros | Dependência backend | Risco | Prioridade | Ação recomendada |
|---|---|---|---|---|---|---|---|---|
| Cadastro | Campos obrigatórios definidos e validação consistente | Formulário exige nome/contacto/morada; API aceita DTO sem validações de negócio equivalentes | PARTIAL | F-CUST, B-CUST | Sim, validação e unicidade | Alto | P1 | Formalizar campos; separar DTO de entrada e saída; validar no servidor |
| Instalação e ativação | AWAITING_INSTALLATION → ACTIVE só após confirmação | FE cria ATIVO; API só possui ATIVO/INATIVO e gera dívida ao cadastrar | MISSING | F-CUST, F-MODELS, B-CUST | Sim | Alto | Registar instalação, data e funcionário; transição explícita |
| Válvula e histórico | Atribuição e alterações rastreáveis | Campo numérico mutável, `byte` Java; snapshots de mensalidade, sem histórico próprio | PARTIAL | F-MODELS, B-CUST, B-CHARGE | Sim | Alto | Definir identificação/capacidade; evento de atribuição e histórico |
| Cancelamento | Preservar dívida e todos os registos | Estado genérico INATIVO e DELETE; não existe CANCELLED com ação auditada | MISSING | F-CUST, F-LOCAL, B-CUST | Sim | Crítico | Introduzir cancelamento sem exclusão física; resolver pré-pagos |
| Reativação | Mesmo código, contrato e dívida | PUT pode alterar estado preservando id/código; não há contrato nem evento de reativação | PARTIAL | F-CUST, B-CUST | Sim | Alto | Endpoint de transição, motivo e preservação de relações |
| Ativo com dívida | Atividade e dívida independentes | ATIVO coexiste com meses em dívida; não foi encontrada suspensão automática | IMPLEMENTED | F-CUST, B-CUST | Manter também na API | Médio | Preservar esta regra ao introduzir o novo ciclo |
| Grupos tarifários | Clientes associados a grupos | Apenas monthlyFee editável por cliente | MISSING | F-MODELS, B-CUST | Sim | Alto | Grupo, tarifa, vigência e vínculo do cliente |
| Histórico de tarifa paga | Valor de mês pago imutável | MonthlyCharge Java preserva valor ao criar; DTO Payment lê tarifa atual; local reescreve snapshots | PARTIAL | F-LOCAL, B-CHARGE, B-PAYMODEL | Sim | Crítico | Emitir documentos com valores das allocations históricas, sem sobrescrever |
| Recalcular abertos após grupo | Recalcular só o permitido, com auditoria | PUT mensalidade do cliente não recalcula obrigações existentes na API; local muda apresentação histórica | MISSING | F-LOCAL, B-CUST, B-CHARGE | Sim | Alto | Política de recálculo versionada e auditada |
| Obrigação independente da fatura | Um registo por cliente/mês | Entidade MonthlyCharge com unicidade cliente+ano+mês, sem dependência de fatura | IMPLEMENTED | B-CHARGE, B-CHARGEREPO | Sim, persistência real | Médio | Preservar entidade e constraint; completar ciclo e campos |
| Origem e geração mensal | Gerar obrigações válidas conforme instalação/ciclo | API sincroniza da data de criação até mês atual; sem filtro de cancelamento e sem agendamento encontrado | PARTIAL | B-CHARGE, B-CUST, F-BILL | Sim | Alto | Geração idempotente baseada em instalação, estado e vigência |
| Prazo 1–10 e atraso dia 11 | Vencimento e overdue separados de existência de obrigação | Apenas paid e meses em dívida; ausência de dueDate/overdue | MISSING | F-MODELS, B-CHARGE | Sim | Alto | Definir vencimento por mês e comparar com relógio Africa/Maputo |
| Primeira mensalidade | >15 dias: 100%; ≤15 dias: 50%, após validar fronteira | Cadastro força pelo menos um mês integral; initialMonth é só flag | MISSING | B-CUST, B-CHARGE | Sim + decisão | Alto | Aprovar exemplos de fronteira antes do algoritmo |
| Dívida monetária | Somar obrigações abertas pelos seus valores históricos | FE usa meses × tarifa atual; API devolve contagem, sem total consolidado no contrato atual | PARTIAL | F-CUST, F-DETAIL, F-DASH, B-CUST | Sim | Crítico | API deve devolver agregado por obrigação, não multiplicação atual |
| Multas/suspensão | Não aplicar sem regra aprovada | Não encontradas automações de multa/suspensão | IMPLEMENTED | B-CHARGE, B-CUST | Preservar | Médio | Não introduzir essas regras durante a modernização |
| Fatura de dívida | Consolidar obrigações em aberto, distinta do pagamento | Há entidade CustomerPaymentInvoice ligada a pagamento; FE gera demonstrativo, não fatura de dívida | MISSING | F-PDF, F-RECEIPT, B-INVOICE | Sim | Alto | Fatura + itens referenciando obrigações; não criar módulo duplicado de recibos |
| Numeração de faturas | Número único com convenção aprovada | Nenhum ciclo de série de faturas encontrado | MISSING | B-INVOICE, F-PDF | Sim + decisão | Alto | Definir séries/convenção; atribuição atómica no backend |
| Anular fatura | Preservar documento e motivo | Sem estado/endpoint de anulação de fatura | MISSING | B-INVOICE | Sim | Alto | Anulação auditada, sem DELETE |
| Entrada de pagamento | Funcionário informa meses, recebido e método | Formulários existem; somente required/min(1), valor pode ser editado livremente | PARTIAL | F-PAYFORM, F-DETAIL, B-PAYDTO | Sim | Alto | Quote do backend e validação de limites/valor no comando |
| Meses mais antigos primeiro | Seleção automática e coerente | Backend usa ordenação ascendente; FE faz slice de unpaidMonths devolvidos em ordem descendente pela API | PARTIAL | F-PAYFORM, F-DETAIL, B-PAY, B-CUST | Sim | Alto | Usar a mesma quote para prévia e efetivação; não selecionar por array incidental |
| Rejeitar valor divergente/parcial | Recebido = soma exata dos meses completos | Backend não compara valor; local aceita 1 MT para duas mensalidades de 750 MT | MISSING | B-PAY, B-PAYDTO, F-LOCAL | Sim, obrigatório | Crítico | Validar soma decimal e recusar divergência; não inventar override |
| Métodos de pagamento | Numerário, M-Pesa, e-Mola, transferência | Formulários oferecem três primeiros; apresentação sabe traduzir transferência, mas não a oferece | PARTIAL | F-PAYFORM, F-DETAIL, F-PRESENTATION, B-PAYDTO | Sim | Médio | Enum canónico compartilhado por contrato; validar no servidor |
| Confirmação e liquidação | Só confirmar/liquidar segundo política definida | API força confirmed=true; modo local liquida mesmo confirmed=false | PARTIAL | B-PAY, F-LOCAL | Sim | Crítico | Definir estados; transição atómica; pendente não reduz dívida |
| Duplicidade/concorrência | Reenvio não cobra duas vezes; obrigação paga uma única vez | Constraint mensal e referência única existem; não há idempotency key, @Version ou lock encontrado | PARTIAL | B-CHARGEREPO, B-PAY, B-PAYMODEL | Sim | Crítico | Idempotência persistida, locks/versionamento e testes concorrentes |
| Adiantamento | Pagar além da dívida com confirmação de futuro | Formulários/API rejeitam meses acima dos abertos ou cliente sem dívida; local fabrica períodos passados | MISSING | F-PAYFORM, F-DETAIL, F-LOCAL, B-PAY | Sim | Alto | Gerar obrigações futuras individuais e apresentar confirmação explícita |
| Quantidade futura sem limite atual | Não impor limite arbitrário de meses | `byte numMonths` Java limita o contrato; frontend limita à dívida | MISSING | B-PAYDTO, B-PAYMODEL, F-PAYFORM | Sim | Alto | Alterar capacidade do contrato de forma compatível; limites técnicos por lote não são regra comercial |
| Futuro pago e alteração tarifária | Futuro pago rastreável, imutável e fora da dívida | Não existe fluxo válido de futuro; backend conta paid=false, mas não há adiantamento implementado | MISSING | B-CHARGE, B-PAY, F-LOCAL | Sim | Alto | Testar saldo, tarifas e cancelamento com obrigações futuras |
| Recibo por pagamento | Numeração, dados, cada período e respetivo valor | Local cria recibo; PDF lista períodos, mas usa linha agregada; controller de emissão/arquivo não encontrado no backend local | PARTIAL | F-LOCAL, F-PDF, F-RECEIPT, B-INVOICE | Sim | Alto | Persistir recibo no mesmo fluxo transacional e expor allocations individuais |
| Anulação de pagamento | Autorização + motivo + auditoria + reposição das obrigações | API apaga pagamento após marcar meses abertos; local apaga sem repor; não existe anulação auditada | MISSING | F-LOCAL, B-PAY, F-PAYSVC | Sim | Crítico | Reverter sem apagar, preservar recibo e funcionário original |
| Preservar transações | Nunca excluir fisicamente movimentos financeiros | DELETE disponível no frontend/serviços e backend; local apaga pagamentos/recibos ao apagar cliente | MISSING | F-LOCAL, F-CUST, F-DETAIL, B-PAY, B-CUST | Sim | Crítico | Bloquear exclusão financeira e migrar para anulação |
| Conta individual | Funcionário identificado e ações atribuídas | Contas individuais e createdBy backend existem; modo local usa identificadores genéricos e permite exclusão | PARTIAL | F-AUTH, F-LOCAL, B-USER, B-PAY | Sim | Alto | Preservar identidade e proibir hard delete de utilizador com histórico |
| Desativação de utilizador | Inativo não entra nem continua autorizado | Local rejeita INACTIVE no login; API isEnabled=true e filtro JWT não verifica status | PARTIAL | F-LOCAL, B-USER, B-SEC | Sim | Crítico | Aplicar estado no login e em cada autorização; definir revogação |
| Autorização backend | Matriz de permissões aplicada ao negócio | Gestão de users tem regras ADMIN; maioria do negócio só exige autenticação; registo aceita role público | PARTIAL | F-GUARD, B-SEC, B-AUTH | Sim + decisão | Crítico | Fechar atribuição pública de privilégios; matriz por operação |
| Auditoria | Quem/quando/o quê/motivo e valores anteriores | Alguns timestamps/snapshots/createdBy; sem eventos de instalação, tarifa, anulação ou permissões | PARTIAL | F-MODELS, B-CHARGE, B-PAY, B-CUST | Sim | Crítico | Eventos persistidos com ator autenticado e ligação à transação |
| Relatórios | Clientes, dívida, pagamentos, faturas, recibos, tarifas e auditoria | Há PDFs de clientes/pagamentos/dashboard/ficha; não há relatórios completos das entidades ausentes | PARTIAL | F-REPORT, F-CUSTPDF, F-DASH | Sim para totais/escopo | Alto | Basear em agregados da API e distinguir recebido de pendente |
| PT/EN | Ecrãs, validações, datas e documentos traduzidos | Infraestrutura existe; apenas layout usa pipe nos templates | PARTIAL | F-I18N, F-PDF | Parcial, códigos de erro estáveis | Médio | Migrar textos por funcionalidade e testar alternância |
| Produção sem finanças locais | API é fonte autoritativa; demo explicitamente isolada | Erro de API provoca fallback em ambos ambientes; flag sem uso | MISSING | F-ENV, F-PAYSVC, F-AUTH, F-LOCAL | Sim, contrato de erros | Crítico | Modo explícito e impedir fallback de mutações em produção |
| Versão publicada / dados reais | Confirmar que contratos e regras auditados correspondem ao deploy | Código local e configuração encontrados; release, esquema instalado e dados reais não verificados | UNKNOWN | F-ENV, B-STACK | Sim + operação | Alto | Confirmar release e ambiente de testes antes de integração |

## Defeitos prioritários e reprodução

### R01 — P0: sucesso local após erro da API

`PaymentService.addPayment()` usa `catchError(() => localData.addPayment(payment))` sem distinguir 400, 401, 403, 409, timeout ou falha de rede. Customer/User/Receipt seguem padrão semelhante. Os ambientes dev e prod têm `useLocalFallback: true`, e a flag não é consultada. Uma operação recusada no servidor pode parecer concluída, mas existir só naquele navegador. Mesmo `useLocalFallback=false` não impede o serviço local de gravar no teste LP08.

O risco inclui misturar dados reais obtidos por um serviço com dados seed obtidos por outro no mesmo ecrã. Não existe sincronização automática comprovada do armazenamento local para a API. Desligar a flag isoladamente não corrige a arquitetura.

### R02 — P0: atribuição pública de privilégios e inicialização administrativa

`SecurityConfigurations.java:42–43` permite POST `/auth/register` e GET `/auth/admin` sem autenticação. `UserInput` contém role; `toUser()` conserva esse role; `AuthorizationService.createUser()` persiste sem restringi-lo. O endpoint `/admin` chama uma função que cria um administrador quando não existe o login procurado. `register/admin` devolvem entidade User, com campo de password, em vez de DTO público limitado.

Conclusão baseada em encadeamento de código, **sem chamar esses endpoints**. O eventual estado da versão remota é desconhecido. Remover a confiança no papel enviado pelo registo público é bloqueador de produção, independentemente de esconder opções na interface.

### R03 — P0: valor de pagamento não reconciliado

`PaymentInput.toPayment()` conserva `amount`; `PaymentService.validateAndSavePayment():41` verifica existência e quantidade máxima de meses, mas não soma os valores dos meses nem compara com o recebido. `setConfirmed(true)` liquida-os. Não há `@Valid`/restrições de valor no comando desse controller que resolvam essa igualdade de negócio. Zero meses também não é explicitamente rejeitado nessa rotina, e números negativos falham acidentalmente no subList, em vez de validação de domínio.

LP01 reproduziu no modo local duas mensalidades de 750 MT liquidadas com amount=1. Os formulários calculam um valor inicial, mas o input é editável e o submit só testa a validade geral. Mismatch deve ser rejeitado no servidor; nenhuma política de override foi aprovada.

### R04 — P1: exclusão e edição destroem rastreabilidade

API `removePaymentById():110` marca obrigações em aberto e executa `paymentRepository.delete(payment)`. Não regista motivo/autor da reversão, e a associação `Payment.months` usa cascade ALL: o comportamento de remoção das relações precisa de teste JPA dedicado. Não afirmar restauração durável sem esse teste.

No modo local, DELETE remove pagamento e recibos, mas não devolve os períodos ao cliente (LP03). DELETE de cliente também remove pagamentos/recibos locais. PUT backend muda cliente/montante/quantidade de um pagamento sem refazer as obrigações associadas (`updateExistingPayment():127`). Substituir por comandos de correção/anulação, sem apagar o original.

### R05 — P1: histórico tarifário/documental mutável

`syncPaymentCustomerSnapshots():546` reescreve dados e monthlyFee dos pagamentos e dos recibos ao editar o cliente (LP05). No backend, `Payment.toOutput():155` consulta `c.getMonthlyFee()` e os dados atuais do cliente. Os documentos podem mudar de conteúdo após uma alteração cadastral/tarifária, mesmo quando o amount original permanece.

A entidade MonthlyCharge preserva amount ao ser criada, o que deve ser aproveitado. Não houve recálculo aprovado nem evento de tarifa nos caminhos examinados.

### R06 — P1: períodos incoerentes e prévia diferente da liquidação

`CustomerService.mapToOutput()` consulta meses descendentes; os formulários fazem `.slice(0, numMonths)` e mostram primeiro os mais recentes. A API liquida os mais antigos por consulta ascendente. A prévia pode prometer períodos diferentes dos que o servidor paga.

O modo local tem outra divergência: `chargeFromPayment():524` só usa o primeiro período da string e associa o valor total a esse mês (LP04). `ensureUnpaidMonths()` preenche com meses anteriores ao momento atual; pedir mais meses não cria adiantamento (LP07). `generateTimelineFromCustomer()` da ficha ainda produz outro formato e marca como pagos os meses ausentes da lista de dívida, sem prova de pagamento.

### R07 — P1: pendente reduz dívida e entra em recebidos

No serviço local, um pagamento confirmed=false remove períodos abertos e entra na timeline como paid=true (LP02). Lista de pagamentos, dashboard e relatórios somam montantes sem filtrar confirmados em alguns agregados. O PDF novo distingue pendente/confirmado, mas essa apresentação não corrige a liquidação e os totais subjacentes.

### R08 — P1: impostos e valores não têm contrato monetário fiável

`PaymentInput.toPayment()` passa `customer.getMonthlyFee()+0.0` para o parâmetro **tax** do construtor Payment. Assim a tarifa pode ser registada como IVA. `CustomerPaymentInvoice` usa tax como multiplicador na fórmula de total, embora taxRate também exista e não esteja formalizado nesse fluxo. Não existe base suficiente para declarar cálculo fiscal correto.

Mensalidade/valor de obrigação são int, montante é Double, quantidade e válvula são byte. Definir semântica de valores/impostos e política decimal; migração do histórico deve ser reconciliada, nunca reescrita cegamente.

### R09 — P1: numeração e prevenção de duplicidade insuficientes

Local usa comprimento da lista +1; LP06 reproduziu reutilização de referência após exclusão. Backend usa `paymentRepository.count()+1`, com constraint unique na referência. A constraint pode rejeitar colisões, mas não fornece série robusta nem idempotência de pedidos. Não foi encontrado lock/@Version para a mesma obrigação. Corrida e duplo clique exigem testes de integração concorrentes; não foram reproduzidos numa BD.

### R10 — P1: regras de instalação, vencimento e cancelamento ausentes

`generateInitialDebt()` força pelo menos um mês quando se pede zero e usa valor integral. `syncCustomerTimeline()` cria meses desde createdAt até agora, sem considerar instalação, cancelamento, dia 10 ou primeira mensalidade a 50%. A sync não é automaticamente demonstrada como job periódico: há endpoint manual e chamada antes de pagar, mas os GETs não garantem geração de todos os meses correntes.

### R11 — P1: utilizador desativado e sessão

`User.isEnabled()` retorna true e o filtro monta autenticação com o utilizador encontrado sem verificar estado. `AuthSessionService` aceita tokens sem formato válido (LP09), e `AuthService.getCurrentUser()` pode usar o primeiro funcionário local após erro de `/me`. A assinatura JWT no backend existe; não confundir falha do guard com quebra comprovada da assinatura.

### R12 — P1/P2: contratos ausentes escondidos por dados de demonstração

Não foram encontrados controllers para `/receipts`, `/customer_payments_invoice`, recuperação de password, `/payments/invoice/{id}` e `/billing/generate-month`. Um endpoint ausente pode ficar invisível para o utilizador porque o catch devolve seed ou sucesso sintético. O GET mensal específico e o DTO geral de billing também diferem entre FE/Java. A ausência no checkout local não prova ausência na release remota.

### R13 — P2: garantia de qualidade ainda insuficiente

13 de 16 casos falham no ambiente real de teste executado. Existem problemas de providers/imports e quase nenhuma asserção de regras financeiras. Build e typecheck passaram, mas estes resultados não garantem segurança ou correção. Cobertura percentual não foi medida e não deve ser inferida pelo número de ficheiros.

## Catálogo de evidências

Ficheiros FE relativos à raiz desta pasta; ficheiros B relativos a `../water_sytem_management_java/`. As linhas citadas são as da árvore de trabalho auditada.

| Código | Ficheiro / localização relevante |
|---|---|
| F-ENV | `src/environments/environment.prod.ts:4`, `src/environments/environments.ts:4` |
| F-LOCAL | `src/app/core/services/water-local-data.service.ts`: addPayment 145, deletePayment 186, chargeFromPayment 524, snapshots 546, ensureUnpaidMonths 561 |
| F-PAYSVC | `src/app/core/services/payment.service.ts`: fallbacks de leitura/escrita e GET invoice |
| F-PAYFORM | `src/app/features/payments/payment.component.ts:96` (form), 139 (seleção), 190 (save); respetivo HTML (amount editável e métodos) |
| F-DETAIL | `src/app/features/customers/customer-details/customer-details.component.ts`: fallback de timeline 326, meses 405, save 498, dívida 789; HTML |
| F-CUST | `src/app/features/customers/customer.component.ts`: form 39, dívida 167, CRUD; `core/services/customer.service.ts` |
| F-DASH | `src/app/features/dashboard/dashboard.component.ts:252` e seguintes |
| F-MODELS | `src/app/shared/models/WSM/{customer,payment,Recibo}.ts`, `shared/models/{monthly-charge,user}.ts` |
| F-AUTH | `src/app/core/auth/auth.service.ts`: login 23, registo 38, me 78; `features/auth/register/signin.component.ts` |
| F-SESSION | `src/app/core/auth/auth-session.service.ts:55` e 89; `core/interceptors/auth-interceptor.ts` |
| F-GUARD | `src/app/core/guards/{auth,role}.guard.ts`, `src/app/app-routing.module.ts` |
| F-BILL | `src/app/core/services/{billing,monthly-charge}.service.ts`, componente monthly-charge |
| F-RECEIPT | `src/app/core/services/{recibo,customer-payment-invoice,payment-invoice}.service.ts`, `features/receipts/recibo.component.ts` |
| F-PDF | `src/app/core/utils/payment-document.ts` |
| F-PRESENTATION | `src/app/shared/utils/payment-presentation.ts` |
| F-REPORT | `src/app/core/services/water-report-pdf.service.ts` |
| F-CUSTPDF | `src/app/core/services/customer-detail-pdf.service.ts`, especialmente buildMonthlyHistory |
| F-I18N | `src/app/core/services/translation.service.ts`, `shared/pipes/translate.pipe.ts`, `public/assets/i18n/*.json`, `app.module.ts` |
| B-STACK | `pom.xml`, `src/main/resources/application*.properties` (sem transcrever credenciais) |
| B-PAY | `src/main/java/com/api/water_sytem_management_java/services/payment/PaymentService.java:41,110,127,149` |
| B-PAYDTO | `.../controllers/PaymentController.java`, `.../controllers/dtos/payment/PaymentInput.java` |
| B-PAYMODEL | `.../models/payment/Payment.java:27,35,77,96,155` |
| B-CUST | `.../services/customer/CustomerService.java:65,78,95,114`, `.../models/customer/Customer.java`, `.../controllers/dtos/customer/CustomerStatus.java` |
| B-CHARGE | `.../services/billing/MonthlyChargeService.java:44`, `.../models/billing/MonthlyCharge.java` |
| B-CHARGEREPO | `.../repositories/billing/MonthlyChargeRepository.java`, constraint em MonthlyCharge |
| B-INVOICE | `.../models/payment/CustomerPaymentInvoice.java`, controllers/DTOs payment |
| B-SEC | `.../infra/security/SecurityConfigurations.java:40`, `SecurityFilter.java`, `services/auth/TokenService.java` |
| B-USER | `.../models/user/User.java` (isEnabled), `.../services/auth/AuthorizationService.java` |
| B-AUTH | `.../controllers/AuthenticationController.java`, `.../controllers/dtos/auth/UserInput.java`, `.../infra/config/DataInitializer.java` |

Os `...` do catálogo B representam `src/main/java/com/api/water_sytem_management_java`, não um ficheiro inferido. Todos esses ficheiros foram lidos; as provas LP01–LP09 estão descritas no relatório de validação.
