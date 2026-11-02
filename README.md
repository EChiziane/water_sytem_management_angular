# Water System Management Angular

Aplicacao Angular para gestao operacional de clientes, pagamentos, recibos e utilizadores do Water System Management.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.0.

## Development server

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
npm run build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Organizacao do frontend

O frontend segue a organizacao e a base visual do projeto local Carload:

- src/app/features/auth/login: entrada e recuperacao de acesso.
- src/app/features/auth/register: formulario de registo.
- src/app/features/public/landing-page: pagina publica.
- src/app/features/shell/main-layout: menu, cabecalho e navegacao mobile.
- src/app/features: clientes, pagamentos, recibos, calendario, perfil e utilizadores.
- src/app/core: sessao, guards, interceptores e servicos.
- src/app/shared: modelos, constantes e pipe de traducao.
- src/styles/_carload-foundation.scss: tokens, tabelas, filtros, drawers, mensagens e listas compactas.
- src/styles.scss: estilos globais e ajustes especificos do sistema de agua.
- src/theme.less: configuracao do tema NG-ZORRO.

As cores e os componentes partilhados usam variaveis CSS com prefixo --wsm-.
As imagens e os dados continuam a pertencer ao sistema de agua.
## Documentos financeiros

Os downloads de pagamentos e do arquivo de recibos usam o mesmo gerador,
em src/app/core/utils/payment-document.ts. Os documentos incluem empresa,
titular, periodos, valor, responsavel, referencia e paginacao A4.
Pagamentos pendentes produzem um registo por confirmar, sem declarar valor recebido.

O demonstrativo de faturacao e associado ao pagamento existente. Nao cria
uma fatura fiscal, uma serie de faturacao ou uma nova cobranca.
Os dados da empresa mantem-se em src/app/shared/config/company-profile.ts.

Para verificar o gerador e produzir exemplos com os dados de demonstracao:

    node tools/verify-payment-documents.cjs

Os exemplos ficam em output/pdf/. O caso longo de teste fica em tmp/pdfs/.
## Preparação para produção

Há bloqueios financeiros e de integração. Consulte [estado real e arquitetura](docs/16-arquitetura-producao.md) antes de publicar. O build de produção bloqueia a demonstração e exclui os JSON de teste. A base visual comum fica em src/styles/_tokens.scss e src/styles/_operational-ui.scss.

A implementação dos modos local/Vercel, preservação e backups está em [Modos e backups](docs/17-modos-local-vercel-backups.md). Os ambientes anteriores com API Spring direta permanecem documentados como histórico; produção agora aponta para /api na Vercel. A ativação na nuvem exige configuração privada e importação validada.
