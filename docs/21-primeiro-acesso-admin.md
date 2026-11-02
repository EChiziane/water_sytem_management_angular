# Primeiro acesso e recuperação inicial do administrador

O código permite admin / 123456 exclusivamente quando WSM_ENABLE_INITIAL_ADMIN=true no servidor. A opção está desativada por omissão. Nunca é lida de parâmetros do navegador nem publicada no Angular.

No primeiro login com essas credenciais, cria a conta admin se estiver ausente, ou configura uma vez a conta admin já ativa e com perfil ADMIN. Preserva IDs, autoria histórica, outros utilizadores, pagamentos, recibos e clientes. Não promove operadores nem reativa contas desativadas. Guarda apenas o hash scrypt, incrementa a versão da sessão e regista auditoria. Um marcador persistente impede nova reposição automática, mesmo que a opção permaneça ligada ou a senha seja posteriormente alterada.

Esta funcionalidade exige um estado válido já inicializado; não cria dados financeiros vazios se o ficheiro estiver ausente ou danificado. A base importada já satisfaz esse requisito.

## Ativação em Production

1. Definir WSM_ENABLE_INITIAL_ADMIN=true nas variáveis privadas de Production.
2. Publicar o código que inclui esta alteração e a correção da escrita condicional do Blob.
3. Entrar com admin / 123456, abrir Utilizadores, editar a conta e definir uma senha pessoal de pelo menos 12 caracteres. Deixar o campo vazio preserva a senha atual; alterar a própria senha termina a sessão.
4. Remover a variável ou definir false e publicar novamente. O marcador evita uma reposição, mas retirar a opção encerra explicitamente a configuração inicial.

123456 é uma credencial conhecida. Enquanto a configuração inicial estiver habilitada e não consumida, qualquer pessoa que conheça o endereço pode tentar esse primeiro acesso; ativar apenas durante a configuração acompanhada pelo proprietário. Não é uma senha mestra permanente.

## Diagnóstico executado

Em 02/11/2026, company/public respondeu 200 em Production. Uma tentativa com a credencial forte importada respondeu 409, antes de confirmar a sessão. Isto demonstra um problema de gravação, não comprova uma senha errada. O adaptador passou a normalizar as aspas dos ETags HTTP para a API de escrita, mantendo ifMatch e recusando validadores fracos. A correção foi validada com testes; o resultado em Production ainda depende de publicar e testar o novo código. Não foi feito push nem deploy nesta etapa.

O login deixou de apresentar conflitos, indisponibilidade e bloqueio por tentativas como se fossem sempre senha incorreta. As mensagens novas têm traduções portuguesa e inglesa.
