# Preparação do armazenamento e da importação

Verificação em 02/11/2026. Projeto de destino: `water-sytem-management-angular-r5bc`.

## Armazenamento

O painel confirma um Blob **privado**, ligado a Production e Preview por OIDC.
A ligação fornece `BLOB_STORE_ID`; não exige criar um token permanente.
O SDK instalado suporta OIDC e obtém a credencial temporária automaticamente na
Vercel. O adaptador aceita esta ligação e mantém compatibilidade com
`BLOB_READ_WRITE_TOKEN`. A separação obrigatória por `WSM_DATA_NAMESPACE` continua
ativa: `production` em Production e `preview` em Preview.

Referência: https://vercel.com/changelog/vercel-blob-now-supports-oidc-authentication

`WSM_SESSION_SECRET` e `WSM_DATA_NAMESPACE` estão presentes em Production; os
valores secretos não foram revelados nem copiados do painel. A presença não
comprova o conteúdo ou a validade. Preview precisa da sua configuração própria
antes de ser utilizado. Não partilhar os dados financeiros reais com Preview.

## Cópia de origem

A aplicação local exportou uma cópia completa e o original para recuperação.
Ambas foram preservadas em `private-data/`, ignorado pelo Git. O relatório de
pré-validação, também privado, inclui o SHA-256 da origem.

O ensaio preservou quatro clientes, dois pagamentos, seis utilizadores e o total
de 1.500 MT. Preparou 17 obrigações e dois recibos: havia apenas um recibo na
origem e foi gerado o correspondente ao pagamento confirmado sem recibo. Os
registos existentes são preservados. O ensaio não escreveu na nuvem.

O utilizador confirmou esta base como origem da importação. PINs fracos não são
aceites em produção. As novas credenciais são mantidas exclusivamente em ficheiro
privado; as contas locais e os seus PINs permanecem intactos.

## Execução e limites

Autenticar o CLI, ligar explicitamente o projeto correto e obter as variáveis de
Production para um ficheiro ignorado pelo Git. Não imprimir nem publicar as
credenciais. Usar a ferramenta `tools/data/blob-data.mjs`, primeiro `validate`,
depois `initialize`, com a mesma origem validada e o mapeamento privado de
credenciais. Conferir as contagens após ler novamente o Blob.

`initialize` recusa substituir `state.txt` existente. Não usar upload manual do
TXT local como estado de produção: faltam a migração e os hashes das credenciais.
Não publicar/reimplantar a aplicação antes de concluir a importação e conferir a
configuração. Os testes do adaptador usam mocks; não constituem prova de uma
escrita real na Vercel.
