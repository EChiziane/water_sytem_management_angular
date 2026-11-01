# Métodos de pagamento e etiquetas informativas

O componente partilhado InfoTagComponent apresenta métodos, referências, válvulas, períodos selecionados e perfis de acesso com etiquetas neutras, compactas, ícones e texto completo acessível por tooltip. Os estados continuam no StatusBadgeComponent, com cores semânticas próprias.

Aplicação: listas e detalhes de pagamentos, histórico do cliente, recibos, códigos de clientes, resumos dos formulários, mensalidades e perfis de utilizadores. Numerário tem tradução PT/EN; os nomes dos prestadores preservam-se. BCI e BIM são distintos. Métodos históricos TRANSFER/BANK_TRANSFER e CARD/POS são apresentados sem adicionar novas opções aos formulários. Valores ausentes não são tratados como numerário; métodos desconhecidos preservam o valor original com a indicação «Outro método». O identificador zero é preservado.

Não altera contratos da API, valores financeiros, permissões, persistência ou PDFs. Os formulários conservam CASH, MPESA, EMOLA, BCI e BIM. As etiquetas apenas apresentam os dados existentes.

Validação: build Angular de desenvolvimento concluído; 13 testes passaram (etiquetas informativas, etiquetas de estado e apresentação de estados). Permanecem avisos existentes de expressões opcionais nos templates. Sem verificação visual no navegador nesta alteração.
