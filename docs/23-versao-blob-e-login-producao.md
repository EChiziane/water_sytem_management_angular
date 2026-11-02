# Login em produção: versão do objeto Blob

Em 03/11/2026, company/public respondeu 200 e auth/login respondeu 503 com a mensagem Versão de dados inválida. A falha ocorreu na validação do ETag ao tentar confirmar a escrita do login, não num resultado de credenciais inválidas. Nenhum token de sessão foi devolvido.

A correção anterior aceitava ETags HTTP fortes e recusava os fracos (W/). A resposta de conteúdo não deve ser tratada como a versão canónica de escrita: pode conter um validador da representação HTTP. A leitura passou a obter metadados com head antes e depois de get(useCache:false), verificando que a versão do objeto permaneceu igual. A escrita usa o ETag dos metadados com ifMatch. Se a versão mudar durante a leitura, devolve conflito sem gravar. A proteção contra sobrescrita concorrente e as cópias prévias permanecem ativas.

Validação: 26 testes API passaram, incluindo conteúdo com ETag HTTP fraco e versão canónica diferente, recusa quando o objeto muda entre leituras e manutenção de ifMatch nas gravações. Os testes usam adaptadores simulados; a correção ainda precisa de ser publicada e validada no Blob real. Não foi feito push nem deploy nesta etapa.

A senha admin123 mostrada na captura não é a credencial de primeiro acesso configurada no código. O acesso inicial opt-in usa admin / 123456 com WSM_ENABLE_INITIAL_ADMIN=true, uma única vez, conforme docs/21-primeiro-acesso-admin.md. Alterar a senha não resolve um erro de infraestrutura 503.
