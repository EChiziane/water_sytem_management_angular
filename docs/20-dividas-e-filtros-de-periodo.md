# Dívidas e consulta de pagamentos por período

A rota /app/debts e o menu Operação > Dívidas requerem reports.financial (verificado também pelo endpoint /billing). A página consulta obrigações mensais não liquidadas, conservando clientes cancelados. O período atual de Maputo é selecionado quando disponível; caso contrário, o mais recente. Anos e meses são derivados dos registos existentes. Períodos futuros não aparecem como dívida vencida. Todos os meses apresenta uma linha por obrigação, podendo repetir o cliente.

Pagamentos permite distinguir data de recebimento, convertida para Maputo, de mensalidade liquidada. Um pagamento com várias mensalidades aparece uma única vez no resultado. O montante continua a ser o total do pagamento. Os filtros não representam saldos históricos no fecho de um mês.

A consulta não altera valores nem liquida períodos. Produção usa a API; local usa as obrigações de demonstração. A seleção não muda a regra de pagar os meses mais antigos primeiro.

Validação: builds Angular de desenvolvimento e produção concluídos; oito testes direcionados passaram (consulta de dívidas, transição de ano, recebimento vs liquidação e navegação por permissões). A pré-visualização no navegador local ficou indisponível por timeout; não se afirma validação visual. Permanecem os avisos anteriores de build.
