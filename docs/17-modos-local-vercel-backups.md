# Modos local e Vercel, TXT privado e cópias de segurança

Data: 01/11/2026. Destino informado pelo utilizador: https://water-sytem-management-angular-r5bc.vercel.app. Implementação preparada no repositório; não foi feito push, deploy, criado Blob nem importados dados reais. A sessão não tem autenticação Vercel/Blob configurada.

## Funcionamento

| Ambiente | Origem inicial | Gravação | Spring |
|---|---|---|---|
| npm start / desenvolvimento | public/data/dev/water-data.txt, JSON dentro de TXT | localStorage com a chave anterior preservada | Não é chamado no login nem nas operações normais |
| Produção Vercel | Blob privado water/production/state.txt, através de /api | Função autenticada, validação no servidor e escrita condicional | Só quando o administrador pede backup |
| Preview Vercel | Blob privado water/preview/state.txt | Mesmo código, prefixo distinto | Opcional e separado |

O TXT publicado nos assets não é regravado. O ficheiro alterável vive no Blob privado. A API em api/index.js usa server/application.mjs, domain.mjs e store.mjs. Os serviços Angular conservam os endpoints existentes; environment.prod.ts passa a usar /api. O SDK @vercel/blob é usado exclusivamente no servidor. Node 22 configurado para deploy; a máquina de desenvolvimento tinha Node 25, com o aviso habitual.

## Preservação dos dados

- Não foram lidos nem apagados os dados do navegador do utilizador. O teste headless usa armazenamento de teste, distinto do navegador de trabalho.
- Mantém-se a chave water-system-management-state-development. Uma base existente tem prioridade sobre o TXT novo. O JSON de origem não foi removido; criou-se o TXT de desenvolvimento com o mesmo conteúdo inicial.
- JSON/localStorage danificados ou erro ao carregar o TXT já não geram silenciosamente uma base vazia. O original permanece para recuperação.
- Importação local exige confirmação, valida coleções/IDs/referências e cria uma cópia dos bytes anteriores, incluindo o perfil da empresa, antes de substituir. Falha de quota aborta a operação. Um backup só no navegador não protege contra a limpeza desse navegador: exporte também um ficheiro.
- Produção nunca inicializa dados vazios automaticamente. Sem credenciais, segredo, prefixo ou ficheiro, a API responde com erro de configuração/disponibilidade.
- Inicialização na nuvem é explícita, usa allowOverwrite=false e não substitui um ficheiro existente. O original exportado fica também em private-data, ignorado pelo Git.
- Antes de uma escrita transacional, a versão anteriormente confirmada é copiada para backups privados. Se essa cópia falhar, a escrita não avança.
- Estado, pagamentos, alocações, recibos, contador de referências e auditoria são confirmados num único ficheiro com ETag/ifMatch. Um conflito relê o estado e valida novamente, até cinco tentativas.
- Recibos e pagamentos não têm exclusão física nesta API. Anulação financeira ainda não está implementada; os percursos antigos continuam recusados.

## Pagamentos e contas

As funções conferem a sessão e a conta atual em cada pedido. Desativação/perfil/credencial revogam sessões anteriores. Login usa scrypt e token assinado de oito horas; não devolve hashes aos ecrãs. Permissões são verificadas no servidor, incluindo acesso direto a URLs.

Cada pagamento tem uma chave idempotente. Pedidos repetidos com a mesma chave e conteúdo devolvem o pagamento original. A aplicação conserva a intenção pendente em caso de falha de rede; uma confirmação limpa essa intenção. Não limpar manualmente essas chaves para repetir uma operação cujo resultado ainda é desconhecido: consulte os registos primeiro.

O servidor escolhe as mensalidades mais antigas, calcula em centavos e rejeita montantes divergentes, métodos desconhecidos e adiantamentos sem modelo implementado. Novos pagamentos têm valores individuais por período e autor atribuído pelo servidor. Referências são geradas dentro da mesma escrita condicional, sem count()+1 entre gravações independentes.

A recuperação de meses usa Africa/Maputo e anos 2012–2099. O login confirmado e o pagamento sincronizam obrigações com um início conhecido. Consultas apresentam dívida atualizada; sincronização explícita também a persiste. Um cliente sem início de cobrança conhecido não recebe dívida inventada a partir da data de registo. Instalação/primeiro mês/grupos tarifários completos continuam pendentes; não foram inventadas regras novas. O formulário novo começa com zero meses de dívida; o contador continua não editável. Saldos de abertura precisam de períodos explícitos numa importação validada.

No modo local mantêm-se as contas de teste e PIN 123456. Em produção, criar conta/importar credencial exige pelo menos 12 caracteres. Editar nome/perfil não repõe a palavra-passe escondida do formulário. Um login novo segue o primeiro nome normalizado + AC, com rejeição de duplicados.

## Interface de backups

Aceder como ADMIN a Empresa. A secção «Dados e cópias de segurança» apresenta:

- Local: exportação completa, exportação do original para recuperação e importação local com confirmação e nova autenticação.
- Vercel: exportação completa, snapshot privado, lista/download de backups, envio para Spring e criação/download de base de teste anonimizada.

A cópia de teste altera nomes, contactos, endereços, identificadores e valores financeiros para dados fictícios. Substitui os utilizadores por adminAC/123456 e remove hashes reais/auditoria. Não altera produção. Para a utilizar localmente, importar manualmente o TXT, com confirmação. Navegadores que já têm dados não são substituídos automaticamente. O TXT de testes continua privado na nuvem; não é colocado em public/data.

A lista mostra até 1000 backups devolvidos pelo Blob. Os anteriores não são apagados; para inventário integral ou recuperação operacional, usar a administração privada do armazenamento. Não existe restauro de produção por um clique que possa apagar pagamentos posteriores.

## Configuração na Vercel — ainda necessária

No projeto water-sytem-management-angular-r5bc:

1. Conectar um store Vercel Blob **privado**. Usar stores distintos para Production e Preview quando possível; o prefixo também é validado pelo código.
2. Definir nas variáveis privadas de Production:
   - BLOB_READ_WRITE_TOKEN: credencial do store privado.
   - WSM_DATA_NAMESPACE=production.
   - WSM_SESSION_SECRET: segredo aleatório de pelo menos 32 caracteres, exclusivamente no servidor.
3. Em Preview usar WSM_DATA_NAMESPACE=preview, outro segredo e, preferencialmente, outro store/token. O código recusa Preview apontado para production e vice-versa.
4. Confirmar build npm run build, output dist/water-system-management-angular/browser e Node 22. vercel.json encaminha /api para a função e mantém as rotas Angular.
5. Antes de mudar a versão pública, exportar os dados do navegador de trabalho, validar e inicializar o armazenamento conforme abaixo. Validar primeiro num Preview: login, perfis, criação/consulta, pagamento, recibo, repetição e falha de rede.
6. Só publicar depois de conferir contagens e montantes. Não foi presumido acesso ao projeto por conhecer o URL.

Não colocar tokens em environments.ts, TXT público, Git ou mensagens do chat. .env.example contém apenas os nomes. .env*, .vercel, private-data e backups locais estão ignorados pelo Git.

## Primeira importação, sem substituir dados existentes

1. Na aplicação local, ADMIN > Empresa > Exportar cópia completa. Guardar também o original. Não usar o JSON do repositório como se incluísse as alterações feitas no navegador.
2. Preparar .env.local privado com o token de Blob, namespace e segredo corretos. Para cada conta com PIN fraco ou sem credencial importável, definir WSM_INITIAL_PASSWORDS_JSON, um objeto JSON de login para nova credencial forte. Não publicar esse objeto.
3. Usar Node 22 e executar:

```powershell
node --env-file=.env.local tools/blob-data.mjs validate "CAMINHO_DA_COPIA.txt"
```

O comando mostra contagens e total dos pagamentos, sem imprimir credenciais. Valida autores/clientes, períodos, unicidade de referências e coerência das alocações. Conflitos são recusados; não se apagam registos para fazer a migração passar. IDs, referências e datas são preservados. Uma cópia sem recibo para um pagamento confirmado ganha apenas o recibo que falta. Alocações históricas sem valores individuais são distribuídas em centavos preservando o total e assinaladas como estimadas.

4. Conferir os valores com a cópia original. Depois:

```powershell
node --env-file=.env.local tools/blob-data.mjs initialize "CAMINHO_DA_COPIA.txt"
```

O script preserva o original em private-data, cria snapshot privado e inicializa apenas se state.txt ainda não existe. Não usar initialize para substituir uma base em utilização. Não foram importados os dados reais nesta sessão.

No ensaio com o TXT de exemplo do repositório foram preservados quatro clientes, dois pagamentos e total de 1500 MT; oito alocações resultaram da conversão e foi criado um recibo em falta, mantendo o recibo existente. Isto não comprova os dados presentes no navegador do utilizador.

## Backup opcional no Spring

O backend Java irmão ganha POST /backups/external e a entidade tb_wsm_external_backups. O endpoint só grava mediante X-Backup-Token válido e checksum SHA-256 correspondente. Não existe leitura/download público. Uma cópia já recebida com o mesmo checksum devolve a confirmação existente. Não liquida mensalidades nem importa pagamentos nas tabelas operacionais.

Configuração, quando se quiser ativar:

- No Spring: SPRING_BACKUP_TOKEN aleatório com pelo menos 32 caracteres; garantir a nova tabela no esquema/migração e publicar a versão que contém o recetor.
- Na Vercel: SPRING_BACKUP_URL, por exemplo https://water-sytem-management-java.onrender.com/backups/external, e SPRING_BACKUP_TOKEN com o mesmo segredo.
- A função usa um URL fixo configurado no servidor, HTTPS, sem redirecionamentos e timeout de 20 segundos. Não aceita um destino fornecido pelo navegador.

O botão confirma o envio apenas se o Spring devolver o checksum certo e o registo do resultado for confirmado. Se o servidor ainda estiver a iniciar, o pedido pode terminar por timeout; repetir é seguro pela verificação do checksum. Os dados principais continuam no Blob. Backup no mesmo store e backup no Spring não dispensam ensaiar recuperação.

## Limites e validação

Esta é uma arquitetura de ficheiro privado com API de servidor, não um frontend sem backend. As funções e o Blob têm custos, latência e limites próprios; não se prometeu ausência de cold start. O ficheiro completo é lido e regravado; há limite de cerca de 3,5 MB no estado e 3 MB por importação/pedido. Ultrapassar o limite recusa a gravação, sem truncar dados. Antes de atingir esse volume ou aumentar a concorrência, migrar para armazenamento transacional adequado.

Backups preservam dados sensíveis. Downloads completos e ferramentas de importação são operações de administrador. Para recuperação de um estado de produção danificado, preservar primeiro os objetos atuais, escolher a versão e reconciliar registos posteriores num destino separado; não sobrescrever o original por tentativa.

Resultados executados nesta etapa:

- API Node: 19 testes passaram, incluindo contratos do adaptador Blob com mocks, ETag, concorrência, idempotência, erro de backup/gravação, autorização, migração, anonimização e mudança de ano. Nenhum deles escreveu num Blob real.
- Angular: 33 testes direcionados passaram. Suite completa: 106 executados, 94 passaram e as mesmas 12 specs antigas falharam por infraestrutura de testes incompleta. As cinco verificações novas da interface de backups estão na suite completa.
- Build de desenvolvimento e build de produção concluídos. Permanecem avisos de orçamento/CommonJS e expressões opcionais.
- Spring: 28 testes selecionados passaram, incluindo quatro novos testes do recetor protegido e regressões de permissões/contas.
- Sem acesso visual ao navegador de trabalho, sem integração com Blob real, sem migração em PostgreSQL real e sem deploy. Esses passos continuam necessários para aceitar a publicação.

Referências técnicas: https://vercel.com/docs/vercel-blob/using-blob-sdk e https://vercel.com/docs/vercel-blob/private-storage.
