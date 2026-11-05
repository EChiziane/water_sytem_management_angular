# Seletores e espaço dos campos

05/11/2026

- Causa: rótulos horizontais dentro de colunas estreitas reduziam a largura útil dos seletores, especialmente o método de pagamento.
- Formulários de pagamentos, clientes, detalhe de cliente, utilizadores e registo passam a rótulos acima dos campos. Empresa já usava disposição vertical.
- Seletores NG-ZORRO usam a largura do campo e altura mínima de 36px, incluindo drawers renderizados fora do shell. Preservados pesquisa, opções, validações e valores.
- Grelha de pagamento adapta o número de colunas à largura disponível, evitando campos excessivamente estreitos.
- Filtros nativos de mês/ano e tipo de período recebem largura, altura e espaçamento consistentes; em ecrãs pequenos permitem quebra de linha.
- Nenhuma regra financeira, dependência ou persistência foi alterada.

Verificação: build Angular de produção e revisão visual em origem isolada, sem registar pagamentos.
