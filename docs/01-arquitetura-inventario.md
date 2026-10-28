# Arquitetura técnica e inventário

## 1. Stack observada

| Área | Tecnologia efetivamente encontrada | Observação |
|---|---|---|
| Frontend | Angular 19.2.0 instalado, TypeScript 5.7.3 instalado | `package.json` admite intervalos; não confundir versão declarada e instalada |
| Interface | NG-ZORRO 19.1.0, Angular CDK 19.2.1, Ant Design Icons | Preservar o sistema visual existente |
| Linguagens | TypeScript, HTML, SCSS/CSS, Less, JSON | `theme.less` configura NG-ZORRO; Roboto é carregada em `index.html` |
| Assincronismo | RxJS 7.8.2, HttpClient com Fetch | `catchError` está a misturar transporte e modo local |
| Formulários | Reactive Forms e FormsModule | Existem formulários tipados e vários `FormGroup` sem tipagem estrita |
| PDFs | jsPDF 4.2.1, AutoTable 5.0.7 | Moment 2.30.1 também está declarado; a presença de uma dependência não demonstra uso em todos os fluxos |
| Testes | Jasmine 5.6, Karma 6.4.4, Chrome Headless | 15 ficheiros `*.spec.ts`, 16 casos executados |
| Ferramentas locais | Node 25.9.0, npm 11.12.1, Angular CLI 19.2.0 | A CLI emite aviso para Node ímpar; definir uma versão LTS compatível e reproduzível antes do deploy |
| Backend local | Java 17, Maven, Spring Boot 3.4.1 | Confirmado por `pom.xml` e compilação Java 17 |
| Segurança backend | Spring Security, BCrypt, Auth0 java-jwt 4.4.0 | Há controlos, mas também lacunas de configuração e regras |
| Persistência backend | Spring Data JPA/Hibernate; driver PostgreSQL | Perfil dev usa JDBC PostgreSQL; produção recebe URL do ambiente; servidor real não inspecionado |
| Documentos backend | JasperReports, iText, OpenHTMLtoPDF e Apache POI declarados | Não foi encontrado o ciclo HTTP completo dos recibos/faturas esperados pelo frontend |

Fontes principais: `package.json`, `angular.json`, `tsconfig.json`, `src/app/app.module.ts`, `../water_sytem_management_java/pom.xml`, perfis de configuração e controllers do backend.

## 2. Organização e avaliação

```text
src/app/
  core/
    auth/          sessão e autenticação
    guards/        AuthGuard e RoleGuard
    interceptors/  cabeçalho Bearer
    services/      API, modo local, traduções e relatórios
    utils/         construção do documento PDF de pagamento
  features/
    auth/          login e registo
    public/        landing page
    shell/         navegação e layout
    customers/     lista, ficha e pagamento na ficha
    payments/      lista e detalhe de pagamento
    receipts/      arquivo documental
    billing/       componente de mensalidades sem rota integrada
    dashboard/ calendar/ profile/ users/ welcome/
  shared/
    models/ config/ constants/ pipes/ utils/
src/styles/        estilos comuns e detalhes corporativos
public/
  assets/i18n/     pt.json e en.json
  data/dev/       dados demonstrativos
  data/prod/      dados locais publicados no build de produção
tools/            verificação do gerador PDF
```

A estrutura por funcionalidades é adequada e deve ser mantida. `AppModule` agrega os componentes e os imports de UI; as rotas principais usam referências diretas aos componentes, sem lazy loading das funcionalidades. `WelcomeModule` existe, mas não aparece integrado no percurso principal. `MonthlyChargeComponent` também não aparece em `AppModule` nem nas rotas, apesar de existir e ter teste.

A tipagem estrita TypeScript e `strictTemplates` estão ativos. Ainda assim, `Partial<Omit<...>>` para payloads permite enviar campos de saída, `FormGroup` sem modelo permite deriva e há casts `as unknown as MonthlyCharge` que ocultam formatos incompatíveis. A ficha do cliente tem 934 linhas, dashboard 442 e serviço local mais de 600: existem responsabilidades de domínio misturadas com apresentação e persistência.

Não há necessidade imediata de NgRx, migração para standalone ou mudança de framework. Começar por funções de domínio testáveis, adaptadores explícitos de DTO e um estado de origem dos dados visível. Lazy loading pode vir depois da correção financeira.

## 3. Rotas e funcionalidades

| Rota | Implementação / capacidade | Limite observado |
|---|---|---|
| `/` | Redireciona para `/landing-page` | Página pública |
| `/landing-page` | `LandingPageComponent`: apresentação e contactos | Texto predominantemente fixo em português |
| `/login` | `LoginComponent`: autenticação, recuperação, modal de registo | Recuperação chama endpoints não encontrados no backend local |
| `/register` | `SigninComponent`: criação de conta | Pública; inclui perfil no payload |
| `/app` | `MainLayoutComponent`, protegido por `AuthGuard`; redireciona para dashboard | Guard não equivale a autorização do servidor |
| `/app/dashboard` | Métricas, devedores, pagamentos, exportação e reset local | Dívida aproximada por tarifa atual × meses; recebidos incluem pendentes |
| `/app/customer` | CRUD, pesquisa, filtros e relatório de clientes | `ATIVO/INATIVO`, sem confirmação de instalação; dívida editável no formulário |
| `/app/customer-detail/:id` | Ficha, timeline, pagamentos e PDF | Calcula dívida no cliente; sintetiza timeline em falha; não permite adiantamento sem dívida |
| `/app/payment` | Lista, pesquisa, novo pagamento e relatório | Dois percursos de formulário duplicam regras; valor recebido não comparado no submit |
| `/app/payment-detail/:id` | Resumo, períodos, responsável, recibo e demonstrativo | Não há itens financeiros individuais por mês nem documentos fiscais autoritativos |
| `/app/receipts` | Lista documental, estado e download | Consome `/customer_payments_invoice`, não encontrado no backend local |
| `/app/calendar` | Projeção local de ciclo de turnos | Não é agenda persistente nem motor de faturação |
| `/app/users` | Lista, criação, edição e exclusão de funcionários | Única rota com `RoleGuard` explícito, para ADMIN |
| `/app/profile` e `/app/profile/:id` | Dados de sessão ou procura de funcionário | Consulta de outro perfil passa pela lista administrativa e pode cair em dados locais |
| `**` | Redireciona para landing page | Não existe página própria de erro 404 |

## 4. Modelos e contratos

| Modelo atual | Campos / relações úteis | Lacunas |
|---|---|---|
| `Customer` | Identificador, código, nome, contacto, morada, estado string, válvula, tarifa atual, contador de dívida, lista de meses, criação | Sem contrato, instalação, cancelamento, reativação, grupo tarifário, histórico de válvulas e versão concorrente |
| `Payment` | Referência, snapshots aparentes de cliente, valor, imposto, preço unitário, confirmado, períodos numa string delimitada, número de meses, data, método e funcionário | Sem allocations tipadas com valor por obrigação, estado de anulação, motivo, chave de idempotência ou comprovativo externo |
| `MonthlyCharge` | Referência mensal, valor, pago, snapshots e pagamento associado | FE não tem `dueDate`, estado overdue, versão tarifária ou origem da primeira cobrança; formato do fallback da ficha não corresponde à interface |
| `Recibo` | Código, pagamento opcional, cliente, total, ficheiro, data | Nome `invoiceCode` ambíguo; sem série documental própria e histórico de anulação |
| `User` | ADMIN/MANAGER/OPERATOR; CREATED/ACTIVE/INACTIVE | Tipo FE exige `password`, embora listagem backend devolva DTO sem password; separar credenciais de perfil |
| `MonthlyCharge` Java | Entidade própria, unicidade cliente+ano+mês, snapshots, relação com pagamento | Valor inteiro; não há vencimento, tarifa versionada ou bloqueio concorrente encontrado |
| `Payment` Java | `@Transactional` no serviço, meses associados, código único, funcionário autenticado | `Double` no montante, `byte` no número de meses, sem validação de igualdade de valor ou anulação |

Os snapshots das mensalidades Java são um ponto positivo. Porém `Payment.toOutput()` lê nome, tarifa e válvula do **cliente atual**, e o modo local reescreve snapshots ao editar o cliente. Não considerar o histórico financeiro imutável só porque existem campos chamados snapshot.

## 5. Mapa de API e consumidores

Base dev FE: `http://localhost:8080`. Produção FE: endpoint Render configurado em `environment.prod.ts`. Não foi contactado.

| Serviço FE / consumidor | Chamadas | Situação no backend local |
|---|---|---|
| `CustomerService` / clientes, ficha, dashboard, pagamentos | GET/POST `/customers`; GET/PUT/DELETE `/customers/{id}` | Controllers presentes; DELETE é físico; sem ações de instalação/cancelamento |
| `PaymentService` / pagamentos, ficha, recibos, dashboard | GET/POST `/payments`; GET `/payments/customer/{id}`; GET/DELETE `/payments/{id}` | Presentes; POST devolve entidade `Payment`, enquanto FE espera DTO plano `Payment` da UI |
| `PaymentService.getPaymentInvoice` | GET `/payments/invoice/{id}` | Não encontrado no controller local; fallback devolve pagamento local |
| Backend sem consumidor de edição FE neste serviço | PUT `/payments/{id}` | Existe; muda cliente, valor e número de meses sem reconstruir a alocação |
| `BillingService` / ficha | POST `/billing/sync`; GET `/billing`; GET `/billing/customer/{id}`, `/unpaid`, `/debt-count` | Rotas presentes; DTO de GET geral só tem id, customerName, referenceMonth, paid, não o modelo completo esperado no FE |
| `BillingService.getCustomerMonth` | GET `/billing/customer/{id}/month/{referenceMonth}` | Incompatível: backend espera `/month/{year}/{month}` |
| `MonthlyChargeService` / componente não integrado | GET `/billing`, POST `/billing/generate-month`, GET `/billing/customer/{id}/unpaid` | `/generate-month` não encontrado; catch devolve sucesso sem gerar obrigações locais |
| `AuthService` / login, registo, perfil | POST `/auth/login`, `/auth/register`; GET `/auth/me`, `/auth/users`; DELETE `/auth/{id}` | Rotas presentes; `/register` retorna entidade User, não `{token}` como tipado no FE |
| `AuthService` / recuperação | POST `/auth/password/reset/request`, `/confirm`, `/reset` | Não encontrados em `AuthenticationController` ou outro controller local |
| `UserService` / gestão, perfil | GET `/auth/users`; POST `/auth/register`; PUT/DELETE `/auth/{id}` | Presentes; `UserInput` Java não recebe `login`; login é derivado do nome |
| `ReciboService` / legado documental | GET/POST `/receipts`; GET/PUT/DELETE `/receipts/{id}`; GET `/receipts/download/{id}` | Não foi encontrado controller correspondente; dois métodos GET `{id}` esperam coisas diferentes (recibo único vs lista por pagamento) |
| `CustomerPaymentInvoiceService` / arquivo de recibos | GET `/customer_payments_invoice`; POST `/{paymentId}`; GET `/download/{id}` | Não foi encontrado controller correspondente; existe apenas entidade/DTO relacionada |

Antes de alterar contratos: mapear também consumidores externos e confirmar a versão publicada. Os consumidores internos estão indicados; o inventário não prova que não existam outras aplicações.

## 6. Autenticação, autorização e modo local

- FE guarda token e perfil no `localStorage`. Remove password no snapshot de sessão, o que é positivo.
- `AuthSessionService.isTokenExpired()` considera tokens malformados ou sem payload como não expirados. O guard aceita um token arbitrário não vazio. Não significa que o backend aceite esse token.
- `RoleGuard` usa o perfil local. O interceptor adiciona Bearer a todos os pedidos HttpClient, sem limitar à origem da API nem tratar 401 de forma centralizada.
- `AuthService.getCurrentUser()` pode substituir falha de `/me` pelo utilizador local ou pelo primeiro utilizador do seed; não deve identificar uma pessoa autenticada por essa via.
- Backend usa BCrypt e JWT verificado, mas `/auth/register` e `/auth/admin` estão públicos; `UserInput.role` chega ao serviço sem política de atribuição de privilégios.
- `User.isEnabled()` retorna sempre true, e o filtro JWT não verifica o estado antes de construir a autenticação. Desativação não revoga acesso de forma demonstrada.
- A maior parte das operações de negócio exige apenas `authenticated()`; a matriz de permissões financeiras não existe.
- `WaterLocalDataService` agrega clientes, pagamentos, recibos e funcionários numa estrutura no navegador. `public/data/prod/water-data.json` contém um funcionário com campo de password; não se reproduzem credenciais nesta documentação.
- `useLocalFallback` existe nos ambientes, mas a procura no código não encontrou consumidor dessa flag. Não basta mudar o seu valor para desligar o fallback.
- Exportar a base local inclui o estado dos funcionários e, portanto, campos sensíveis de demonstração. Um export local não é backup da base de dados da API.

## 7. Internacionalização, moeda e tempo

Há dicionários `pt.json/en.json`, serviço com `BehaviorSubject`, preferência persistida e pipe de tradução. **Só 1 dos 16 templates HTML contém o pipe `translate`**: o layout. Este número mede uso do pipe, não percentagem de frases traduzidas. Os ecrãs de negócio, validações e PDFs permanecem maioritariamente em português fixo. O locale do NG-ZORRO está fixo em `en_US`.

Os detalhes novos usam `Intl` com `pt-MZ` e algumas datas explícitas Africa/Maputo ou +0200. Outros componentes e PDFs usam `Date`, `toFixed` e timezone do dispositivo. O Java usa `LocalDateTime.now()/YearMonth.now()` sem zona de negócio explícita. A expiração do JWT usa offset -03:00. Não há política uniforme de MZN, arredondamento e timestamps.

## 8. Qualidade, build e operação

- Build atual passa; não demonstra integridade financeira nem integração da API.
- Bundle inicial de 2,70 MB, acima do aviso de 2 MB; estilos de pagamentos e ficha excedem aviso de 10 kB. Não aumentar limites apenas para ocultar avisos.
- `@angular/material` existe como pacote extraneous; não está no manifesto. Não remover no âmbito desta auditoria; validar dependências numa instalação limpa posterior.
- Não foram encontrados configuração de lint, pipeline CI ou migrations versionadas nos caminhos inspecionados. Hibernate está configurado com `ddl-auto=update` nos perfis consultados.
- SSR/Express tem ficheiros e script, mas o builder atual só configura browser; o build não demonstrou geração de `server/server.mjs`. Não apresentar SSR como deploy funcional validado.
- Testes são quase todos criação de componentes/serviços. Faltam providers HTTP, ActivatedRoute e imports NG-ZORRO no TestBed. Não corrigir com schemas que apenas silenciem erros sem testar as interações importantes.
- Duplicação de cálculo, formatação e formulários; mensagens com caracteres corrompidos; `any` e casts de compatibilidade; restos de funcionalidades não integradas. Resolver de forma localizada após assegurar regressões.
