# Perfil centralizado da empresa — 29/10/2026

## Acesso e campos

Nova rota autenticada `/app/company`, disponível no menu desktop, navegação mobile e menu da conta para qualquer utilizador autenticado. Não exige perfil de administrador, conforme pedido do utilizador.

Dados: nome/razão social, NUIT, morada, telefone, email e slogan/descrição curta. Os valores existentes são mantidos como dados iniciais, incluindo o NUIT provisório. O formulário valida campos obrigatórios, limites, email, telefone e NUIT com nove algarismos. Guardar pede confirmação; recarregar com alterações por guardar pede autorização para as descartar.

## Backend e persistência

- `GET /company`: consulta completa, autenticada.
- `PUT /company`: atualização por qualquer utilizador autenticado, com validação no servidor.
- `GET /company/public`: projeção apenas de nome, morada, telefone, email e descrição, para os contactos já publicados no site/login. Não devolve NUIT, versão ou identificação de quem editou; não permite gravação anónima.

A entidade singleton `tb_wsm_company_profile` é persistida via JPA. A configuração atual do projeto usa atualização de esquema pelo Hibernate. `@Version` e o campo `version` do pedido impedem sobreposição silenciosa de edições; conflitos devolvem HTTP 409. O servidor atribui data UTC e identificação do utilizador autenticado à última gravação, ignorando metadados enviados pelo cliente. Isto regista a última edição; não é um arquivo completo de todas as revisões.

Foi preservada a autenticação existente. Acrescentaram-se apenas os endereços locais exatos da aplicação à lista CORS e a projeção pública explícita de contactos. Os dados completos continuam protegidos.

## Angular, documentos e modo de demonstração

`CompanyProfileService` concentra consulta/gravação. Os geradores de recibos, demonstrativos, ficha do cliente e relatórios consultam o perfil antes de produzir cada PDF. Os utilitários puros aceitam uma cópia do perfil para manter o emissor consistente em todas as páginas. O site público e o login usam a projeção de contactos; telefone, ligações e email deixam de ter cópias fixas divergentes no HTML.

A constante anterior é agora o valor inicial/offline, não um objeto global mutável. Em desenvolvimento, falha de rede na consulta inicial permite demonstração em chave própria do navegador, explicitamente indicada na página. Não se usa fallback local para erros 401/403 nem para falhas ao gravar na API. Depois de selecionar a API como fonte, uma falha de leitura não troca silenciosamente para demonstração. Em produção, a consulta privada não tem fallback local. A página pública mantém contactos iniciais se não conseguir consultar a API; na demonstração local usa os contactos guardados neste navegador.

Alterações afetam documentos gerados/reexportados a partir desse momento. PDFs já descarregados não são alterados. Os pagamentos existentes não têm snapshot histórico do perfil da empresa; reexportar usa o perfil atual. Para um arquivo fiscal imutável serão necessários snapshots e arquivo de documentos no backend, conforme auditoria anterior.

## Validação e entrega

- Angular: nove testes direcionados passaram (persistência, bloqueio de fallback indevido, dados públicos, validação, confirmação e descarte).
- Java: oito testes passaram (dados iniciais, validação, metadados do servidor, conflito de versão, acesso anónimo bloqueado, leitura/escrita por operador e projeção pública sem campos privados).
- Build Angular: passou com avisos existentes.
- PDFs de recibo/ficha com outro perfil injetado gerados apenas em `tmp/pdfs`, texto extraído e renderização inspecionada; nome, NUIT, telefone, email e morada refletidos corretamente. Verificador: `tools/verify-company-documents.cjs`.
- Navegador: formulário, validação de alteração, confirmação e descarte conferidos. Os valores empresariais originais foram preservados.

Não se executou persistência real em PostgreSQL nem atualização de um backend publicado. Para os utilizadores partilharem os dados entre equipamentos, é necessário publicar/reiniciar o Java atualizado e usar a API; a demonstração persiste apenas no navegador. Não houve push.
