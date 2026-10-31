# Organização discreta da navegação

Implementação de 31/10/2026, preservando Angular, NG-ZORRO, rotas e permissões existentes.

- Menu lateral reduzido de 280 para 240 px, mantendo o modo recolhido e o painel móvel.
- Grupos visíveis sem submenus: **Geral** (Visão geral), **Operação** (Clientes, Pagamentos, Recibos), **Administração** (Empresa, Utilizadores) e **Conta** (Meu perfil).
- Uma configuração partilhada define ordem, ícones e permissões no desktop e no móvel. Grupos sem itens autorizados desaparecem; Administração continua exclusiva de ADMIN.
- Empresa usa um símbolo de edifício; Utilizadores usa gestão/troca de utilizadores, sem sugerir a criação imediata de uma conta. Os restantes ícones conservam a sua função e têm tamanho uniforme.
- Fundo sóbrio, sombras e gradientes reduzidos, separadores discretos e itens compactos. A família tipográfica existente é preservada.
- Clientes e Pagamentos permanecem selecionados nos respetivos detalhes. Perfis de funcionários abertos pela administração selecionam Utilizadores; o perfil próprio seleciona Meu perfil. Os links incluem `aria-current` e foco visível.
- No modo recolhido, os ícones têm descrições e tooltips. O menu móvel mantém a mesma sequência e fecha depois de escolher uma página.
- Retirado o aviso fixo «Sistema ativo». O rodapé apresenta apenas o modo de demonstração, quando aplicável, usando a origem real da sessão e sem afirmar disponibilidade da API.
- Traduções PT/EN atualizadas, sem novas dependências.

Validação: build Angular de desenvolvimento aprovado; **18 testes passaram em ChromeHeadless**, incluindo ordem desktop/móvel, roles e grupos vazios, seleção dos detalhes/perfis, indicação de demonstração, tooltips e regressões das permissões. O antigo teste de criação isolado sem configuração foi substituído por testes com os módulos e dependências reais do layout. Não se declara a suíte histórica completa aprovada.

A observação do navegador integrado continua limitada pelo bloqueio de URL anteriormente identificado. Não foi contornado esse bloqueio nem apresentada uma captura como evidência visual.
