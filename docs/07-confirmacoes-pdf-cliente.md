# Confirmações de operações e ficha do cliente A4 — 29/10/2026

## Ações com confirmação

- Pagamentos na lista e na ficha do cliente: cliente, montante recebido, períodos e método; o pedido só é enviado depois de confirmar.
- Eliminações de clientes, pagamentos, recibos e utilizadores: identificação do registo, consequências, botão de perigo e opção de cancelar.
- Gravação/criação de clientes: identificação, estado e taxa mensal.
- Gravação/criação de contas de utilizadores: titular, perfil e estado da conta.
- Geração manual de mensalidades: período antes de executar.

O serviço `OperationConfirmationService` uniformiza as confirmações PT/EN. Identificadores impedem diálogos repetidos para a mesma operação; um pedido em curso reutiliza a mesma Promise. Conteúdo dinâmico é escapado antes de ser inserido no resumo. O cancelamento não chama o serviço de dados. Durante o envio, a confirmação aguarda o resultado e desativa cancelar; em caso de erro mantém o diálogo aberto e permite uma nova tentativa explícita.

As confirmações não alteram contratos de API, permissões ou as regras de anulação financeira. Os serviços existentes ainda incluem eliminações físicas e fallback local, conforme a auditoria. O texto distingue eliminação de cancelamento/anulação, sem prometer reposição de dívida que o modo local não garante.

## Documento imprimível

A ficha passou a A4 vertical, margens de 14 mm, tipografia discreta e secções contínuas: identificação/contacto, situação da conta, histórico por período e registo de pagamentos. Sem cartões ou métricas ampliadas. Campos longos expandem a altura das linhas; o histórico usa paginação automática, cabeçalhos de continuação e numeração. Os pagamentos têm os seus montantes originais; não se divide um pagamento de vários períodos em montantes mensais presumidos.

O histórico é opcional. Cancelar a seleção ou fechar o diálogo não descarrega ficheiros. O documento conserva os dados empresariais existentes e identifica a dívida como estimada. Exemplo gerado: `output/pdf/ficha-cliente-a4.pdf` (não versionado, por ser saída gerada).

## Verificação

- `npm run build`: passou, com avisos existentes.
- Jasmine/Karma: 17 testes direcionados passaram (4 confirmações + 13 calendário/recuperação/dashboard).
- `node tools/verify-customer-document.cjs`: A4 vertical, ficha habitual numa página, resumo sem histórico e teste longo de sete páginas passaram.
- `tools/verify-customer-pdf-layout.py`: tamanho de todas as páginas, rodapés, limites dos caracteres e presença dos 65 pagamentos verificados.
- Renderização Poppler inspecionada: ficha habitual e as sete páginas de esforço sem sobreposições visíveis.
- Navegador: confirmação de pagamento, eliminação de pagamento e seleção de conteúdo do PDF verificadas; operações de teste canceladas, sem pagamento ou eliminação real.

Não se executou a suíte global com falhas pré-existentes nem testes de integração financeira/backend neste pedido. Os testes de confirmação usam serviços simulados.
