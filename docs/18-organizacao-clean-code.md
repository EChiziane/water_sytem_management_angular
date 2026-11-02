# Organização do código e convenções

Referência: 02/11/2026. Reorganização do frontend Angular e da API Vercel no mesmo repositório. O backend Java irmão não foi alterado nesta etapa.

## Objetivo e limites

Separar responsabilidades, tornar os ficheiros legíveis e dar uma estrutura previsível a alterações futuras. Confirmado por git diff: public/data permanece sem alterações. Não foram alterados dados, chaves de localStorage, ficheiros TXT/JSON de teste, endpoints HTTP, URLs de navegação ou regras financeiras. Nenhum push/deploy foi executado.

A limpeza não significa que toda a dívida técnica foi resolvida. Continuam a existir componentes de funcionalidades grandes e 12 specs Angular antigas com configuração incompleta. A etapa atual preserva o comportamento em vez de introduzir regras novas para fazer a reorganização passar.

## Angular

```text
src/app/core/
  auth/                         Sessão, identidade e permissões
  data/
    demo/                       Armazenamento de demonstração existente
    data-access.service.ts      Seleção protegida do adaptador
    data-mode.service.ts        Identificação do modo
  services/
    backups/                    Contrato HTTP de backups
    billing/                    Mensalidades e consultas de cobrança
    company/                    Perfil da empresa
    customers/                  Clientes
    dialogs/                    Confirmações de operações
    documents/
      templates/                Geradores existentes de documentos
    i18n/                       Tradução
    payments/                   Pagamentos
    receipts/                   Recibos
    users/                      Contas
  guards/                       Autorização de navegação
  interceptors/                 Tratamento transversal de pedidos
  icons/                        Registo dos ícones NG-ZORRO
```

- features contém as páginas e os seus componentes específicos. A gestão de backups fica em features/company/data-tools, junto do único fluxo que a utiliza.
- shared/components contém apenas os componentes genéricos já reutilizados: ações, etiquetas e filtros. shared/models fica plano e com nomes minúsculos: customer.ts, payment.ts e receipt.ts, sem a pasta genérica WSM.
- Os nomes de ficheiros foram normalizados para list-user.component, landing-page.component, receipt.component e sign-in.component. Nomes de classes/tipos legados foram preservados quando a mudança seria só cosmética; a API não foi renomeada.
- DataToolsComponent passou a ter HTML/SCSS separados. BackupService concentra os pedidos HTTP, evitando construir URLs e contratos no componente.
- O reexport antigo do simulador em core/services foi retirado depois de atualizar todos os consumidores para a implementação única em core/data/demo. A classe e a identidade de injeção são as mesmas.
- Os imports relativos e aliases, inclusive testes e ferramentas, foram atualizados a partir dos nós de strings da árvore sintática TypeScript. Os ficheiros não foram movidos sem atualizar referências.

## API Vercel

```text
api/index.js                    Entrada da plataforma
server/
  application.mjs               Entrada estável de dispatch
  domain.mjs                    Exportações estáveis usadas pelos consumidores
  application/
    dispatch.mjs                Coordenação das operações
    request-context.mjs         Identidade e identificação de pedidos
    validation.mjs              Validação de entradas
    login.mjs                   Autenticação e tentativas
    read-resource.mjs           Consultas e projeções
    customers.mjs               Gravação de clientes
    users.mjs                   Gestão de contas
    company.mjs                 Gestão da empresa
    receipts.mjs                Emissão/consulta associada a pagamentos
    backups.mjs                 Cópias e comunicação com Spring
    import-backup.mjs           Conversão/validação da primeira importação
  domain/
    billing.mjs                 Calendário e recuperação de mensalidades
    payments.mjs                Liquidação e recibos
    state.mjs                   Integridade do estado e totais
    test-data.mjs               Anonimização de dados de teste
    common.mjs                  Identificadores, centavos e auditoria
  security/
    passwords.mjs               Hash e verificação
    session.mjs                 Tokens e sessão
    permissions.mjs             Autorizações
  infrastructure/
    blob-store.mjs              Armazenamento, snapshots e transações condicionais
  http/
    handler.mjs                 Adaptação de pedidos/respostas e erros
  shared/
    errors.mjs                  Erros da aplicação
  tests/                        Contratos e testes de concorrência/persistência
```

O servidor mantém os endpoints atuais e a ordem das validações e operações. As funções financeiras foram extraídas sem mudar os cálculos. A fachada domain.mjs mantém as exportações usadas pelo projeto; uma função de projeção de cliente sem consumidores foi retirada. O adaptador Blob continua exclusivamente no servidor.

## Ferramentas e formatação

- tools/data/blob-data.mjs: validação e inicialização explícita, com os mesmos argumentos e salvaguardas.
- tools/pdf/: verificadores existentes de documentos. Os imports dos geradores foram atualizados.
- O README principal foi reescrito como entrada curta para desenvolvimento, estrutura, verificações e produção, retirando instruções de calendário/e2e que já não correspondiam à aplicação.
- Prettier é uma dependência apenas de desenvolvimento. .prettierrc.json define dois espaços, aspas simples, largura de 100 caracteres e finais de linha LF.
- npm run format aplica o padrão a src, server, api, tools e configurações indicadas no comando.
- npm run format:check verifica esse padrão sem escrever. Não é um lint semântico nem substitui compilação e testes.
- Dados privados, public/data, TXT, PDFs, node_modules e saídas de compilação estão fora da formatação.

Arquivos gerados/ignorados, como dist, tmp, output e node_modules, não foram apagados apenas para melhorar a aparência da pasta. O histórico técnico anterior permanece em docs; o guia ativo de backups foi atualizado para o caminho tools/data.

## Validação

- API antes da reorganização: 19 testes passaram.
- API após separação em módulos e atualização de imports: 19 testes passaram, incluindo concorrência, idempotência, preservação de dados e permissões.
- Suite Angular: 106 executados, 94 passaram; as mesmas 12 specs antigas falharam por configuração incompleta. Não se afirma aprovação total da suite.
- Compilação Angular de desenvolvimento concluída após as mudanças de caminhos e extração do serviço de backups.
- Verificador existente tools/pdf/verify-payment-documents.cjs passou, incluindo recibo, demonstrativo, documento longo e datas/períodos inválidos. Não houve redesenho dos PDFs.
- Verificação Prettier passou.
- Build de produção concluído com sucesso; mantêm-se os avisos existentes de orçamento, CommonJS e expressões opcionais.
- Sem verificação visual pelo navegador, escrita em Blob real, migração de dados ou alterações no backend Java.
