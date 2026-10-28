# Data atual e geração de mensalidades — diagnóstico de 29/10/2026

O relógio e o registo de mensalidades são mecanismos distintos. Mostrar outubro não permite afirmar que setembro/outubro já foram cobrados.

## Dados de demonstração

`public/data/dev/water-data.json` tem versão `water-seed-development-2026-09-05`, com meses não pagos até agosto de 2026. `WaterLocalDataService.state$()` lê esse conteúdo ou a cópia guardada no navegador. `billingFromState()` reconstrói o histórico a partir de `unpaidMonths` e pagamentos: não gera obrigações pela passagem do calendário. O fallback de `BillingService.syncAllTimelines()` devolve uma mensagem de sucesso sem executar sincronização local.

A página observada contém os identificadores do conjunto de demonstração. Os dados não provam saldos reais nem atualização financeira até hoje. Não foram criadas cobranças nem alterados os registos para preencher meses em falta.

## Backend Java disponível na pasta irmã

Em `water_sytem_management_java/src/main/java/com/api/water_sytem_management_java/services/billing/MonthlyChargeService.java`, `syncCustomerTimeline()` usa `YearMonth.now()` e percorre da criação do cliente até ao mês atual, verificando a existência de cada mensalidade. Os consumidores encontrados são a sincronização `POST /billing/sync` e o registo de pagamento em `services/payment/PaymentService.java`. As consultas do histórico apenas leem as mensalidades existentes. Não foram encontrados `@Scheduled` ou `@EnableScheduling` no código pesquisado.

Limitações: utiliza o fuso predefinido do servidor; não exclui clientes inativos nesta rotina; a criação do cliente é usada como início em vez da instalação confirmada. A contagem de não pagos não distingue o prazo normal até dia 10 do atraso desde dia 11. Isso exige revisão antes de ativar sincronização automática em produção.

## Alteração deste pedido

O dashboard mostra a data de referência e seleciona os últimos dez pagamentos pela data do pagamento no mês corrente de Africa/Maputo, ordenados do mais recente para o mais antigo. A lista de devedores usa apenas a dívida já registada, sem inventar meses ou montantes. As duas listas ligam aos detalhes e às páginas existentes. Não há alteração no backend, no calendário de cobranças ou nos saldos guardados.

## Correção financeira necessária

Implementar no backend uma rotina periódica e de recuperação após indisponibilidade, com fuso Africa/Maputo e unicidade de cliente/período na base de dados. Validar instalação, cancelamento/reativação, primeiro mês, tarifas históricas e períodos pagos antecipadamente antes de criar obrigações; atualizar a classificação de atraso a partir do dia 11. Cobrir idempotência, concorrência, virada de mês/ano e preservação de pagamentos com testes. Separar explicitamente os modos demonstração e API e eliminar mensagens de sincronização bem-sucedida quando a operação falhar.
