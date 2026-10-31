# Ações das tabelas — 31/10/2026

Padrão partilhado em `RowActionComponent`, aplicado às listas de clientes, pagamentos, recibos e utilizadores, e às duas tabelas da ficha do cliente (mensalidades e pagamentos). As mensalidades na página de cobrança não tinham ações por linha; não se introduziram operações novas nessa tabela.

- Consulta primeiro: ícone de olho e texto «Ver», com fundo azul suave.
- Editar e descarregar: controlos neutros de 32 px, espaçamento de 6 px e descrições com o nome ou a referência do registo.
- Desativar: cor vermelha e separador; indisponível na própria conta ou numa conta já inativa. Mantém a confirmação e a validação existentes.
- O ícone de download representa a descarga de documentos; substitui o ícone de impressão onde a ação efetiva é descarregar PDF.
- Colunas com largura consistente, foco visível por teclado, nomes acessíveis, tooltips e traduções PT/EN. Em ecrãs de toque, os alvos têm pelo menos 40 px.
- Cartões móveis de clientes e pagamentos usam os mesmos controlos. Rotas, callbacks e permissões existentes foram preservados.
- Uma mensalidade sem pagamento apresenta um traço com a indicação «Sem pagamento associado», sem oferecer uma consulta inexistente.

Validação: build Angular de desenvolvimento aprovado; TypeScript dos testes aprovado; 14 testes passaram em ChromeHeadless (componente partilhado e regressões de permissões). O servidor local responde HTTP 200 na porta 4301. A observação visual no navegador integrado foi recusada pela política de URL; não se contornou o bloqueio nem se apresenta uma captura como evidência visual.
