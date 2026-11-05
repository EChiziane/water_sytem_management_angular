# Revisão da experiência operacional

Data: 05/11/2026. Alterações incrementais, preservando Angular, NG-ZORRO, rotas e o modo TXT + dados no navegador.

## Alterações por ponto

| Ponto | Diagnóstico e alteração | Principais áreas |
| --- | --- | --- |
| Consistência visual | Reutilização dos tokens existentes para controlos, filtros, foco de teclado, mensagens e títulos. Ajustes responsivos e de impressão. | `src/styles/_operational-ui.scss` |
| Formulários | Campos obrigatórios identificados, labels associados aos inputs, limites de texto e número inteiro de meses. Valores mantidos quando ocorre erro. | Clientes, pagamentos, utilizadores, empresa |
| Saída sem guardar | Confirmação ao fechar formulários alterados, navegar ou terminar sessão; aviso ao fechar o separador. Cancelar mantém as alterações. | UnsavedChangesService, ProtectChangesDirective, rotas |
| Feedback de carregamento | Falha de leitura distinguida de lista vazia, com ação Tentar novamente. Correções no término dos indicadores de carregamento. | Clientes, pagamentos, recibos e utilizadores |
| Falha de armazenamento | Escrita indisponível ou sem espaço produz erro explícito; não se apresenta sucesso quando a escrita falha. | Browser storage, dados locais, empresa |
| Confirmação de pagamento | Resumo com cliente, períodos, valores individuais, total e método. Após sucesso, referência e atalhos para detalhe e recibo. | PaymentComponent, OperationConfirmationService |
| Navegação | Paginação e filtros das listas mantidos em memória ao voltar, separados por utilizador. | ListViewStateService e listas |
| Cópias de segurança | Indicação da última exportação solicitada e lembrete quando há alterações posteriores ou passam sete dias. Importação mostra contagens e data, preserva a cópia anterior e termina a sessão. | Empresa, DataTools, BackupReminderService |
| Documentos | Identificadores técnicos substituídos por referência legível; código do cliente quando disponível; períodos formatados; falhas de geração comunicadas. Layout A4 existente preservado. | Templates de cliente e pagamento |
| Meses e linguagem | Formatador comum com inicial maiúscula em PT/EN para meses por extenso. Aplicado a Dívidas, filtros, confirmação de geração e apresentações de pagamentos/PDF. Chaves YYYY-MM preservadas. | month-label.ts e consumidores |
| Pagar a partir de Dívidas | Ação Pagar, sujeita a payments.create, abre Pagamentos com customerId. Não envia o mês consultado. Mostra todos os meses em aberto e começa pelo mais antigo, inclusive na transição de ano. | DebtsComponent, RowActionComponent, PaymentComponent |

## Validação executada

- Build Angular de produção executado. Permanecem avisos de CommonJS das dependências PDF e recomendação de usar Node 22 em vez do Node 25 local.
- 27 testes focados aprovados: dívida/pagamento, proteção de formulários, armazenamento, filtros, meses, backups, empresa, importação, navegação e fronteira de produção.
- Verificadores PDF de recibo, demonstrativo, datas inválidas, períodos e ficha A4; histórico extenso de cliente com sete páginas. Recibo e ficha renderizados e inspecionados visualmente.
- Ensaio no navegador em origem isolada 4311: edição cancelada preservada, importação, login, pagamento de demonstração com confirmação, filtro preservado, exportação e recuperação. O estado recuperado coincidiu integralmente com o estado exportado.
- Na consulta de Novembro, Pagar para Ana mostrou Outubro e Novembro em aberto e selecionou Outubro primeiro. Nenhum pagamento foi automaticamente efetuado por esse botão.

Os dados do navegador de trabalho não foram alterados nestes ensaios. Não foi feito push nem deploy.

## Limites e operação nesta arquitetura

O TXT é a base inicial; alterações continuam no armazenamento do navegador. As cópias de diferentes navegadores não se sincronizam. O lembrete confirma apenas que foi pedido um download: o operador deve verificar que o ficheiro foi guardado e conservar cópias fora do navegador.

Antes de substituir uma base, conferir contagens e data e preservar o original. Após um erro de pagamento, consultar os registos antes de repetir. O recibo permanece distinto de demonstrações de dívida.

Não foram inventadas regras de anulação financeira, numeração fiscal ou permissões adicionais. Segurança e integridade financeira centralizadas continuam dependentes de backend. A tradução de novas mensagens cobre PT/EN; ainda existem textos estáticos antigos em português. Esta revisão não afirma cobertura integral da suite: há specs legados fora do conjunto focado com problemas de configuração já identificados.
