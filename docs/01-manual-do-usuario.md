# Manual do usuário

## Entrar e preparar a conta

**O que o usuário faz:** abre o StockFlow, informa o login de Rodrigo ou Cesar e
a senha. No primeiro acesso, informa a senha atual e escolhe uma nova senha que
atenda às regras exibidas.

**O que o sistema faz depois:** valida as credenciais no backend. Se a senha é
temporária, bloqueia as operações até a troca. Após a troca, revoga sessões
anteriores e pede novo login.

> **Por baixo dos panos:** o access token identifica a conta em cada operação;
> o aplicativo não aceita um responsável diferente do usuário autenticado.

## Tela inicial e navegação

**IMPLEMENTADO.** As abas são Início, Estoques, Operações e Histórico. A faixa
superior mostra a conta e a ação Sair. Quando há comandos locais, uma faixa
informa pendências e itens que exigem atenção.

- **Estoque Principal:** visão do estoque compartilhado e acesso ao Movimento
  Principal.
- **Estoque Pessoal:** saldo de Rodrigo ou Cesar, retiradas, devoluções e consumo.
- **Operações:** reservas e abastecimentos permitidos para a conta.
- **Histórico:** retiradas, abastecimentos, reservas, devoluções, consumos e
  movimentos do Principal.

## Retirada

**O que o usuário faz:** escolhe itens e quantidades do Principal e confirma.

**O que o sistema faz depois:** valida todos os itens de forma atômica, diminui
o Principal, aumenta o estoque pessoal, cria um registro agregado e avança a
revisão global. Se um item falhar, nada é alterado.

## Reserva, cancelamento e liberação

**O que o usuário faz:** escolhe destino, produto e quantidade livre. Pode
cancelar uma reserva ativa própria.

**O que o sistema faz depois:** a criação protege a quantidade, mas não altera
o estoque físico. O cancelamento libera todo o restante e registra o evento.
Uma liberação parcial ocorre na devolução somente na quantidade escolhida; não
há cancelamento arbitrário automático.

## Abastecimento

**O que o usuário faz:** escolhe o local, informa por máquina os produtos e
quantidades e confirma.

**O que o sistema faz depois:** valida responsabilidade, máquina/produto,
estoque e reservas; reduz o estoque pessoal, utiliza a reserva correspondente e
cria um abastecimento agregado para a operação.

## Devolução

**O que o usuário faz:** informa quanto devolver do saldo livre e, quando
necessário, quais parcelas reservadas serão liberadas.

**O que o sistema faz depois:** move o total do estoque pessoal para o Principal
e libera somente as parcelas explicitamente selecionadas.

## Consumo de insumos

**O que o usuário faz:** seleciona milho, chocolate, embalagem ou óleo em seu
estoque pessoal e registra o consumo.

**O que o sistema faz depois:** reduz somente o estoque pessoal do responsável,
registra saldos anterior/posterior e avança a revisão. Insumos não usam reservas.

## Movimento Principal

**O que o usuário faz:** registra uma entrada ou saída administrativa no Estoque
Principal, com itens, data e observação opcional.

**O que o sistema faz depois:** valida o conjunto inteiro, impede saldo negativo,
registra um movimento agregado e atualiza a revisão.

## Histórico e sincronização

Os históricos são reconstruídos do snapshot oficial recebido do servidor. A
tela Sincronização lista comandos da conta atual, tentativas e motivos de erro.
Comandos em erro/conflito podem ser revistos, reenviados ou descartados.

## Funcionamento offline

O último snapshot confirmado continua visível. Ao confirmar uma operação sem
conexão, o sistema salva a intenção na fila, mostra que ela está pendente e
**não altera o saldo exibido**. Ao reconectar, tenta enviar na ordem e busca um
novo snapshot antes de mostrar o resultado como oficial.

Estados visíveis incluem carregando, online, sincronizando, offline,
desatualizado e erro. Mensagens distinguem rejeição, conflito, timeout, falha de
rede e operação confirmada cujo snapshot ainda não chegou.

## Sair

**O que o usuário faz:** toca em Sair.

**O que o sistema faz depois:** tenta revogar a sessão no backend e sempre limpa
a sessão local. Comandos offline permanecem vinculados à conta que os criou e
não são enviados pela outra conta.
