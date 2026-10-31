# Calendário e histórico de 2012 a 2099

Alteração incremental de 31/10/2026. O ano atual continua a ser obtido do relógio do sistema, no fuso `Africa/Maputo`; não se fixou artificialmente o sistema em 2016 ou noutro ano.

## Comportamento

- Cada mensalidade continua identificada por cliente, ano e mês. A restrição única existente no backend e o bloqueio por cliente são preservados.
- O domínio valida os períodos de `2012-01` a `2099-12`. Uma referência fora desse intervalo é rejeitada, sem tentar circular para outro ano.
- A recuperação avança cronologicamente entre anos até ao mês real atual. Dezembro e janeiro são obrigações distintas; a dívida não reinicia em janeiro.
- Não se inicia cobrança em 2012 apenas porque a empresa existe desde essa data. A primeira obrigação conhecida continua a ser a âncora; um cliente sem histórico financeiro não recebe cobranças inventadas.
- Obrigações existentes, meses já pagos, valores históricos e pagamentos antecipados conhecidos não são reescritos durante a sincronização. Clientes inativos continuam sem novas cobranças automáticas.
- A sincronização usa um conjunto dos períodos já carregados. Meses existentes deixam de provocar uma consulta de existência individual à base de dados. Para lacunas, a verificação de existência e a restrição única continuam em vigor.
- Números novos de cliente/pagamento usam o ano de Maputo, mantendo as convenções e as sequências existentes. Documentos antigos não são renumerados.
- A API apresenta a data real guardada no pagamento, em vez da data de criação do registo. Novas datas financeiras sem offset são geradas em Maputo, de acordo com o contrato já interpretado pelo Angular.

## Consulta

Filtros de 2012 a 2099 e «Todos os anos» foram acrescentados a pagamentos, recibos e às duas tabelas do histórico do cliente. O filtro de mensalidades usa o ano da obrigação; o de pagamentos usa a data real do pagamento em Maputo; o de recibos usa a emissão. Pesquisas de texto continuam a funcionar em conjunto com o ano. Listas de pagamentos exportadas usam os resultados filtrados existentes.

O calendário operacional mantém a navegação entre meses/anos e bloqueia passos anteriores a janeiro de 2012 e posteriores a dezembro de 2099. Fevereiro continua a respeitar anos bissextos.

## Demonstração e histórico

Na demonstração, um pagamento de dezembro e janeiro passa a produzir duas linhas de mensalidade, sem alterar o total ou o pagamento original. Novos pagamentos locais guardam os valores por período em `periodAmounts`.

Pagamentos locais antigos sem detalhe mensal são distribuídos em cêntimos, conservando o total; a projeção por mês é assinalada com `≈` e uma explicação de estimativa. Não equivale a uma alocação persistida e auditável do backend. O modo local não é uma fonte financeira de produção.

O histórico antigo fora do intervalo suportado não é apagado pela recuperação local automática. Não se realizou importação de dados antigos, migração da base real, nem criação retroativa de um histórico de tarifas. As lacunas recuperadas no backend continuam a usar a tarifa corrente pela lógica existente; reconstruir tarifas antigas exige dados históricos e a modernização financeira já documentada.

## Validação executada

- **33 testes Angular passaram**: todas as transições de dezembro para janeiro entre 2012 e 2099; recuperação de 1055 meses após um mês inicial pago; limites, ano em Maputo, ano bissexto, repetição idempotente, pagamento antecipado, valores mensais registados, filtro numérico de anos e regressões de permissões/dashboard.
- **118 testes Java passaram**: 87 transições de ano parametrizadas, limites e fevereiro bissexto, 1056 períodos existentes sem consultas individuais de existência, preservação de valores e antecipações, data histórica de pagamento e regressões de cobrança/acesso.
- Build Angular de desenvolvimento e compilação Java executados com sucesso.
- Alvo de produção Angular também passou, com otimização de scripts/estilos e inline remoto de fontes desativado apenas na verificação, sem mudar a configuração do projeto.
- Testes Java com repositórios simulados; não foram executadas migrações ou testes de integração contra a base de dados real.
- Não se contornou o bloqueio de observação do navegador integrado. A aplicação pode ser consultada manualmente na porta 4301.
