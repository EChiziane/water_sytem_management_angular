# Water System Management

Aplicação de gestão de clientes, mensalidades, pagamentos, recibos, empresa e utilizadores. Angular 19, TypeScript e NG-ZORRO. Por decisão de 04/11/2026, desenvolvimento e produção usam TXT inicial e localStorage por navegador. A integração Node/Vercel/Blob e o recetor Spring foram preservados para retoma futura, mas não são usados pelo frontend nesta configuração.

Moeda: MZN, apresentada como MT. Fuso de negócio: Africa/Maputo.

## Desenvolvimento

Usar Node 22 e instalar as dependências com `npm ci`. Iniciar com:

```powershell
npm start
```

O modo local lê o TXT de teste e usa o localStorage já existente. Não depende do Spring. Não limpar o armazenamento para atualizar o código.

## Estrutura

```text
api/                         Entrada HTTP da Vercel
server/
  application/               Casos de uso, consultas e coordenação
  domain/                    Mensalidades, pagamentos e integridade
  security/                  Sessões, credenciais e permissões
  infrastructure/            Adaptador do Blob e escrita condicional
  http/                      Respostas HTTP e tratamento de erros
  shared/                    Erros comuns
  tests/                     Testes de contratos e persistência
src/app/
  core/
    auth/                    Sessão e autorização do frontend
    data/                    Seleção do modo e adaptador local
    services/                Serviços agrupados por área de negócio
    guards/                  Proteção de navegação
    interceptors/            Interceção HTTP
    icons/                   Registo de ícones
  features/                  Páginas e componentes de cada funcionalidade
  shared/                    Modelos, componentes genéricos, pipes e utilitários
src/styles/                  Tokens e regras visuais partilhadas
public/                      Recursos públicos e dados de desenvolvimento
  data/dev/                  TXT/JSON de teste, excluídos do build de produção
tools/
  data/                      Validação e inicialização explícita do Blob
  pdf/                       Verificadores existentes dos documentos
```

`server/application.mjs` e `server/domain.mjs` são pontos de entrada estáveis; a implementação está nas pastas correspondentes. Os ficheiros de componentes usam kebab-case. Rotas, códigos e nomes públicos dos contratos existentes foram preservados.

## Verificações

```powershell
npm run format:check
npm run test:api
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

Para aplicar o padrão de formatação: `npm run format`. O comando abrange código e configurações, sem formatar dados privados, TXT/JSON de teste ou ficheiros gerados.

A suite Angular ainda tem 12 specs antigas com configuração incompleta; consultar a evidência da reorganização. Não há configuração de testes end-to-end nem de lint semântico. A verificação de formatação não substitui testes.

## Dados, documentos e produção

- [Modos local/Vercel e backups](docs/17-modos-local-vercel-backups.md): variáveis privadas, preservação, primeira importação e Spring opcional.
- [Organização e convenções](docs/18-organizacao-clean-code.md): responsabilidades, ficheiros movidos e validação da limpeza.
- [Estado e riscos de produção](docs/16-arquitetura-producao.md): limitações financeiras e de integração ainda pendentes.
- [Índice e histórico técnico](docs/README.md).

O gerador PDF fica em `src/app/core/services/documents/templates/`. Para executar a verificação existente:

```powershell
node tools/pdf/verify-payment-documents.cjs
```

Um demonstrativo ou recibo não constitui automaticamente uma fatura fiscal. A configuração atual de produção usa `/data/prod/water-data.txt` e localStorage separado do desenvolvimento. A conta inicial é `admin / 123456`. Dados existentes no navegador têm prioridade; não há sincronização entre computadores nem gravação do TXT publicado. Exportar cópias em Empresa. O Blob anterior permanece intacto. Consulte [modo navegador atual](docs/24-modo-navegador-producao.md); os documentos anteriores de integração descrevem uma configuração agora suspensa. Nunca publicar exportações privadas ou dados financeiros reais nos assets.
