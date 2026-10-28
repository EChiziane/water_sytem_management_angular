# Verificações executadas e limites da evidência

Referência: 28/10/2026, Africa/Maputo / Africa/Johannesburg (UTC+02 nesta data). Não houve pedidos à API remota nem operações financeiras reais.

## Ambiente

- Node.js: 25.9.0; npm: 11.12.1; Angular CLI: 19.2.0.
- TypeScript instalado: 5.7.3; Angular core: 19.2.0; NG-ZORRO: 19.1.0; RxJS: 7.8.2.
- Chrome Headless: 155.0.0.0, Windows 10 identificado pelo runner.
- Java: 17.0.10; Maven instalado no host; compilação em modo offline.
- Árvore frontend contém alterações anteriores ainda não commitadas. Essa árvore atual foi a base auditada, não uma nova instalação nem checkout limpo.

## Quadro de execução

| Comando / procedimento | Resultado | Evidência | Limitação |
|---|---|---|---|
| `npm ls --depth=0` | Exit 0 | [dependencias.log](evidencias/dependencias.log) | Verifica instalação presente; não foi executado npm ci. Material 19.2.1 aparece como extraneous |
| `npx tsc --noEmit -p tsconfig.app.json` | Exit 0 | Sem diagnósticos no comando executado | Verificação estática, não integração |
| `npx tsc --noEmit -p tsconfig.spec.json` | Exit 0 | Sem diagnósticos no comando executado | Compilar testes não significa executá-los com sucesso |
| `npm run build` | Exit 0 | [build-angular.log](evidencias/build-angular.log) | Build de produção; não é publicação nem teste da API |
| `npm test -- --watch=false --browsers=ChromeHeadless`, CHROME_BIN configurado para Chrome instalado | **Exit 1; 13 falhas, 3 sucessos, 16 casos** | [testes-unitarios.log](evidencias/testes-unitarios.log) | Falhas reais do TestBed; não foram corrigidas nesta análise |
| Verificador existente `tools/verify-payment-documents.cjs`, cópia temporária com caminhos de saída redirecionados | Exit 0 | [verificacao-pdf.log](evidencias/verificacao-pdf.log) | Valida gerador com seed; não valida emissão transacional/numeração fiscal |
| Nove provas locais isoladas sobre métodos reais | Exit 0 do harness; nove defeitos observados | [provas-locais.json](evidencias/provas-locais.json) | Dependências Angular stubadas; armazenamento em memória; sem API, BD ou localStorage real |
| `mvn -o -DskipTests compile`, na pasta Java | Exit 0; BUILD SUCCESS; 41 fontes | [compilacao-backend.log](evidencias/compilacao-backend.log) | Não inicia aplicação nem executa testes JPA/security/integrados |
| Lint | Não executado: não configurado | Sem script/target/configuração de lint encontrado | Não é um resultado positivo de lint |
| Comparação SHA-256 da base de origem | PASS, 124 ficheiros, zero alterados/removidos e zero novos ficheiros de aplicação | [preservacao-fontes.json](evidencias/preservacao-fontes.json), [fontes-sha256.json](evidencias/fontes-sha256.json) | Abrange src/public/tools e manifests/configs registados no início; docs e outputs temporários são novos |
| `git status --short` do backend antes/depois | Sem alterações | Observado nos comandos da auditoria | Artefactos em target são gerados pelo Maven, sem alteração de fonte |

## Build

O build de produção foi realmente executado e produziu bundle inicial de aproximadamente **2,70 MB**. Aviso de orçamento inicial: limite 2 MB, excesso de 703,58 kB; limite de erro 3 MB não excedido.

Avisos adicionais:

- `features/payments/payment.component.scss`: 10,11 kB, acima do aviso 10 kB.
- `features/customers/customer-details/customer-details.component.scss`: 13,28 kB, acima do aviso 10 kB.
- Dependências CommonJS transitivas de jsPDF/canvg/html2canvas.
- Node ímpar: a CLI emite aviso sobre uso em produção. Não foi alterado o runtime durante a auditoria.

Não foram obtidos benchmarks de desempenho no dispositivo, Lighthouse, cobertura de browsers ou prova de funcionamento SSR. Não declarar tais verificações como concluídas.

## Testes unitários: resultados precisos

Os 16 casos foram executados pelo Chrome Headless. Passaram os dois testes de AppComponent e o teste de criação de CustomerDetailPdfService. Falharam:

1. PaymentDetailsComponent — criação.
2. MonthlyChargeComponent — criação.
3. CustomerDetailsComponent — criação.
4. LoginComponent — criação.
5. ListuserComponent — criação.
6. MainLayoutComponent — criação.
7. CustomerComponent — criação.
8. CalendarComponent — criação.
9. LandingPageComponent — criação.
10. BillingService — criação.
11. SigninComponent — criação.
12. ReciboComponent — criação.
13. PaymentComponent — criação.

O log contém as razões individuais, incluindo `NullInjectorError` por HttpClient/ActivatedRoute e NG0304 por componentes NG-ZORRO não importados no TestBed. São principalmente falhas de montagem dos testes; não se devem apresentar como 13 falhas comprovadas de cálculo financeiro. Também não podem ser ignoradas por o build passar.

Não foi calculada cobertura percentual. A inspeção dos testes encontrou essencialmente smoke tests de criação, sem cenários robustos de valor recebido, tarifa histórica, adiantamento, duplicidade, anulação e permissões.

## Provas de comportamento local

Harness temporário: `tmp/audit/local-probes.cjs`. Carrega as classes TypeScript reais através de transpilation, substitui decorators/injeção Angular por stubs e fornece `localStorage` inteiramente em memória. Fixtures são clientes sintéticos. As observações abaixo foram verificadas com asserts sobre o comportamento existente, não são testes que declarem o requisito comercial satisfeito.

| ID | Experiência | Observação reproduzida |
|---|---|---|
| LP01 | Cliente com três mensalidades de 750 MT; pagar duas com amount=1 | Operação aceite e dívida reduzida a um mês |
| LP02 | Pagar um mês com confirmed=false | Mês removido dos abertos e timeline mostra paid=true |
| LP03 | Excluir o pagamento anterior | Dívida continua com dois meses; não restaura os três originais |
| LP04 | Pagar dois períodos por 1500 MT | Timeline local produz apenas uma linha paga para esse pagamento |
| LP05 | Alterar monthlyFee depois de pagar | monthlyFee do pagamento histórico passa à nova tarifa; recibo local também é refeito a partir desse pagamento |
| LP06 | Criar dois pagamentos, excluir o primeiro e criar outro | A referência do segundo é reutilizada pelo terceiro |
| LP07 | Pedir cinco períodos tendo três em dívida | São fabricados períodos anteriores, sem adiantamento futuro rastreável |
| LP08 | Definir useLocalFallback=false em memória e chamar serviço local | Gravação local continua a acontecer; flag não é consultada |
| LP09 | Sessão com token arbitrário não JWT | hasValidSession() retorna true; isto não prova que o servidor valide a assinatura desse token |

Saídas preservadas em `evidencias/provas-locais.json`. Nenhuma dessas experiências tocou os dados do browser do utilizador. Não foram enviados pedidos de exploração a login/register/admin ou pagamentos reais.

## Verificação PDF

O script existente gera recibo confirmado, demonstrativo e registo pendente multipágina. Foi copiado para `tmp/audit/payment-document-check.cjs`, ajustando somente caminhos de imports e outputs da cópia, para não sobrescrever os exemplos anteriores em `output/pdf`.

Foram executadas as asserções existentes de períodos, data inválida, quantidade, moeda e contagem de páginas. Esta auditoria não redesenhou PDFs nem produziu uma nova certificação visual; a melhoria visual já tinha sido realizada na etapa anterior. O facto de o PDF gerar corretamente não garante dados fiscais corretos, série documental autoritativa ou valor individual por obrigação. Esses pontos permanecem lacunas da matriz.

## Backend: o que foi e não foi verificado

Foi inspecionado código Java de controllers, DTOs, entidades, repositories, serviços financeiros e segurança. `mvn -o -DskipTests compile` compilou 41 fontes usando Java 17 sem descarregar dependências nem iniciar o serviço.

Não foram executados:

- `@SpringBootTest contextLoads` e aplicação Spring: configuração aponta para bases externas e inclui inicialização de utilizadores; seria necessário ambiente de testes isolado para evitar efeitos indesejados.
- Testes de persistência/rollback, cascades, migrations e restrições efetivamente instaladas.
- Testes de concorrência/idempotência, privilégios no endpoint publicado ou revogação de JWT real.
- Verificação da versão em Render, base de dados efetiva de produção, backups ou esquema publicado.

Assim, distinguir sempre: **código local observado**, **comportamento local isolado reproduzido**, **compilação executada** e **garantia de produção ainda desconhecida**.

## Preservação do trabalho existente

Antes das validações foi criado snapshot SHA-256 de 124 ficheiros de origem, assets, ferramenta PDF e manifests/configurações, incluindo README e lockfile. Ao concluir a documentação, os hashes eram iguais e não havia novos ficheiros em src/public/tools. A árvore Java continuava sem alterações reportadas pelo Git.

As únicas novas entregas versionáveis desta etapa estão em `docs/`. Logs/probes e outputs de compilação/teste ficam em `tmp/`, `dist/`, caches ou `target/`, conforme as ferramentas. Não foi feito commit, refactor, instalação de dependências, migração ou correção funcional. A análise termina com o plano pendente de aprovação.
