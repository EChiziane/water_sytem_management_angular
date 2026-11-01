# Estados consistentes na interface

Alteração de apresentação de 01/11/2026, sem modificar os códigos guardados, os contratos da API ou as regras financeiras.

O componente partilhado `StatusBadgeComponent` apresenta texto, símbolo, descrição acessível e tooltip. Usa etiquetas compactas de 12 px, fundos suaves e quatro tons: verde para ativo/concluído, azul para pendente, âmbar para dívida vencida e cinzento para inativo/cancelado/desconhecido. Estados não reconhecidos são apresentados como «Não informado», em vez de assumir inatividade ou confirmação.

## Cobertura

- Clientes: estado de atividade separado da situação de dívida, nas tabelas, cartões móveis, detalhes e formulários de pagamento.
- Pagamentos: «Confirmado» e «Por confirmar» nas listas, cartões, detalhes, histórico do cliente e atividade do dashboard.
- Mensalidades: «Paga», «Pendente» e «Em dívida», reutilizando a regra existente de vencimento em Maputo. Um mês ainda dentro do prazo ou futuro não é apresentado como vencido.
- Recibos: estado reconhecido a partir do pagamento associado; ausência desse dado não é confundida com confirmação.
- Utilizadores: «Criado», «Ativo» e «Inativo», nas listas, perfil e respetivos dados de acesso.
- Seletores e confirmações: nomes legíveis e traduzidos em PT/EN; valores enviados à API mantêm-se.

Uma conta de cliente pode aparecer simultaneamente como ativa e com dívida. «Em dia» significa ausência de mensalidades vencidas, sem afirmar que todos os períodos já foram pagos. As quantidades de meses vencidos continuam disponíveis nos formulários onde já eram apresentadas. Os contadores de pagamentos confirmados/por confirmar só incluem valores booleanos explícitos, sem classificar dados desconhecidos como pendentes.

Foram retirados formatadores de estado duplicados e estilos exclusivos obsoletos. Alguns identificadores e meses selecionados deixaram de usar cores de sucesso/alerta para não parecerem estados financeiros. Não se criou uma ação de anulação, um novo estado persistido ou uma regra de suspensão. Os documentos PDF existentes não foram redesenhados nesta alteração.

## Verificação

- Build Angular de desenvolvimento aprovado, com os avisos de templates já existentes.
- **27 testes passaram em ChromeHeadless**: aliases e estados desconhecidos, separação de atividade/dívida, ativação de contas, limite do dia 11 em Maputo e passagem de ano, tradução PT/EN, símbolos e descrições acessíveis, quantidade de períodos vencidos e regressões do dashboard/permissões.
- Testes de componentes e lógica de apresentação; não se declara validação visual no navegador integrado ou aprovação da suíte histórica completa.
