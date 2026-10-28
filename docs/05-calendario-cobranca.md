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

## Implementação posterior — 29/10/2026

O diagnóstico acima descreve o estado antes desta correção. Foi implementada recuperação automática no backend Java, no arranque, diariamente às 00:05 de Maputo e nas consultas de clientes/histórico. Os períodos são percorridos desde a primeira mensalidade registada até ao mês atual, com verificação de existência; meses existentes, incluindo pagos antecipadamente, não são recalculados. A linha do cliente é bloqueada na transação para serializar os percursos de sincronização e pagamento; mantém-se a restrição única cliente/ano/mês. O calendário é testável com Clock e usa Africa/Maputo.

`monthsInDebt` passa a contar apenas mensalidades vencidas: meses anteriores ou mês atual a partir do dia 11. `unpaidMonths` continua a incluir as obrigações pendentes, por ordem cronológica, permitindo pagar entre os dias 1 e 10. Os formulários usam a quantidade pendente como limite. Clientes atualmente inativos mantêm as obrigações antigas e não recebem novas obrigações. Sem uma mensalidade inicial já registada, não se infere instalação pela data de cadastro e não se cria a primeira cobrança automaticamente.

O modo local executa a recuperação ao carregar o estado e recalcula o contador de atraso, sem criar pagamentos ou recibos. Foi corrigida a mensagem de sincronização local para só surgir após executar a recuperação. Um indicador no cabeçalho identifica dados locais. O histórico deixa de inventar meses pagos quando não há resposta de faturação.

Limites preservados: não há histórico tarifário completo nem datas de inatividade/instalação nos modelos atuais. Mensalidades novas usam a taxa disponível no cliente; não se reconstituem tarifas desconhecidas nem se recalculam os valores existentes no backend. A primeira mensalidade especial e períodos de cancelamento/reativação exigem os contratos previstos no plano anterior. O modo local continua a ser demonstração; não é um livro financeiro de produção.

Validação: 9 testes Java de calendário/recuperação passaram; 13 testes Angular de calendário, recuperação local e dashboard passaram; build Angular passou com avisos existentes. Os testes incluem agosto pago/dívida zero em outubro, repetição sem duplicados, lacunas internas, períodos futuros pagos, inativos, ausência de instalação, virada de ano e fronteira do dia 11. Não foi executado teste de integração com PostgreSQL nem de concorrência real. A alteração no Java requer reiniciar/publicar esse backend para afetar a API em execução.

## Registo de alterações

O utilizador pediu commits locais após cada alteração concluída. O histórico anterior foi preservado; as alterações acumuladas foram agrupadas em seis commits temáticos reais (`feat/01/...` até `feat/06/...`), sem alterar datas ou autores antigos. A sincronização de mensalidades tem commits próprios no repositório Java e no Angular. Exemplos PDF gerados em `output/` ficam fora do controlo de versões; o gerador e verificador permanecem versionados.
