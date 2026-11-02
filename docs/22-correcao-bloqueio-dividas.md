# Bloqueio ao abrir Dívidas

O separador local /app/debts não respondia às operações do navegador; a tentativa de recarregar também expirou. Foi necessário reiniciar o servidor Angular local para carregar a correção.

O getter rows reconstruía a lista e todos os objetos de linha em cada passagem de deteção de alterações. nz-table recebia continuamente uma nova referência em nzData, voltando a notificar atualizações. periods também produzia uma lista nova em cada passagem. A consulta passou a conservar as referências enquanto os dados de entrada e os filtros forem os mesmos, recalculando quando mudam as cobranças, os clientes, o mês, o ano ou a pesquisa. A alteração não modifica registos financeiros.

O teste anterior só exercitava as classes e os filtros, não renderizava a tabela. Foi acrescentado um teste com o componente real, NG-ZORRO, formulários e navegação: verifica estabilização, conteúdo apresentado, identidade das listas e atualização por mudança de período. Três testes direcionados passaram em ChromeHeadless. A suite registou avisos ao encerrar o processo Chrome; os três casos foram concluídos com sucesso.
