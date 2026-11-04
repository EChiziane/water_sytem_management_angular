# Configuração atual: TXT e armazenamento no navegador

Decisão do utilizador em 04/11/2026: usar temporariamente o mesmo modelo do Carload e do Partner, em desenvolvimento e produção. Esta decisão substitui a configuração ativa descrita nos documentos anteriores de Vercel/Blob; os documentos antigos conservam o histórico.

## Funcionamento

- Desenvolvimento: /data/dev/water-data.txt e water-system-management-state-development.
- Produção: /data/prod/water-data.txt e water-system-management-state-production.
- Ambos usam dataMode=local e useLocalFallback=true. production continua true no build otimizado: o modo de dados é explícito e não depende desse indicador.
- O TXT inicializa uma cópia quando ainda não existem dados nesse navegador/origem. Os dados existentes têm prioridade; não se apagam ou repõem as contas para atualizar o código.
- Alterações são gravadas no localStorage. O TXT publicado não é regravado e não há sincronização entre computadores, navegadores ou origens. localhost e 127.0.0.1 e portas diferentes mantêm cópias separadas.
- A conta da nova base de produção é admin / 123456, sem clientes ou pagamentos iniciais. Não se adicionam contas de teste de outros perfis em produção. Contas e senhas já guardadas permanecem inalteradas.
- Login, consultas, alterações e perfil da empresa seguem o adaptador de navegador. O frontend não depende do Blob, Spring ou de variáveis privadas da Vercel nesta configuração.
- Sessões API antigas não são aceites como sessões do modo navegador. Isto não apaga registos.

## Preservação e backup

O Blob e os dados anteriormente importados não foram apagados, alterados ou copiados para assets públicos. Os ficheiros privados já exportados permanecem preservados em private-data, fora do Git. Não se publica um backup real como TXT inicial.

Empresa > Dados e cópias de segurança permite exportar a cópia completa, exportar o original para recuperação e importar uma cópia local validada com confirmação e preservação do estado anterior. A cópia original exportada antes da migração Blob usa o formato local; não importar diretamente um state.txt de servidor com hashes como se contivesse credenciais locais.

Limpar dados do site pode apagar a cópia desse navegador: exportar regularmente. Nesta configuração os perfis limitam a interface, mas a autorização e os valores no navegador são alteráveis por quem controla o browser; não equivalem às garantias financeiras e de autorização no servidor.

## Retoma futura

A integração em api/ e server/ foi preservada. Para regressar à persistência central é necessário voltar a selecionar vercel, desativar o adaptador local, excluir os dados locais dos assets e reconciliar/importar as cópias dos navegadores antes de voltar a usar a base central. Não basta mudar o indicador e presumir que as alterações locais já foram sincronizadas. Os endpoints de servidor preservados continuam independentes; esta mudança não apaga os recursos Vercel existentes.

## Verificação

Nove testes direcionados Angular passaram: configuração explícita, login sem API, prioridade de dados guardados, bloqueio do adaptador local em modo API e controlos de backup/importação. Build de produção concluído com os avisos anteriores. Conferido o artefacto: apenas o TXT de produção é publicado em data/, sem os dados de desenvolvimento nem o antigo JSON de produção.

O build otimizado foi servido numa origem de teste independente, 127.0.0.1:4310. Login real no navegador com admin / 123456 entrou no dashboard; após recarregar a sessão manteve-se e Empresa apresentou os controlos locais de backup. Não se alteraram dados do navegador de trabalho nem os dados na nuvem. Não foi feito push nem deploy.
