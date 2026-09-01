# Regras de negócio

## Pessoas, estoques e produtos

**IMPLEMENTADO:** existem Rodrigo, Cesar, Estoque Principal, Estoque Rodrigo e
Estoque Cesar. Cada pessoa retira do Principal para seu estoque pessoal e só
opera como a identidade autenticada.

Pelúcias: `MIX`, `PERSONAGENS`, `CAPIVARAS`, `BIG`, `STITCH`, `POKEMON` e
`LABUBU`. Insumos: `MILHO`, `CHOCOLATE`, `EMBALAGEM_CARRINHO_MEDIA`,
`EMBALAGEM_CARRINHO_GRANDE` e `OLEO`.

Insumos podem existir nos três estoques, não participam de reserva ou
abastecimento de máquinas e seu consumo reduz o estoque pessoal.

## Quantidades e invariantes

```text
reservaRestante = quantidade - quantidadeUtilizada - quantidadeLiberada
estoqueLivre = estoqueFisico - soma(reservasAtivasRestantes)
quantidadeDevolvida = quantidadeLivre + soma(parcelasReservadasEscolhidas)
```

- nenhum saldo físico pode ser negativo;
- quantidade de operação é positiva;
- reserva utilizada + liberada nunca supera a quantidade original;
- operações com vários itens são atômicas;
- reserva não altera estoque físico;
- uma operação confirmada avança a revisão global exatamente uma vez;
- repetir a mesma intenção com o mesmo `commandId` não repete o efeito.

## Destinos, responsabilidade e locais físicos

Destinos lógicos de reserva: Boulevard, Aeroporto, Mercados e SuperMago Boa
Vista. Rodrigo atende Boulevard, Mercados e Boa Vista; Cesar atende Aeroporto,
Mercados e Boa Vista.

`MERCADOS` é uma reserva lógica compartilhada pelos seis mercados normais:
Gaúcho Vicente Fontoura, SuperMago Ipiranga, Gaúcho Antônio Carvalho,
Supermercado Fante, SuperMago Planalto e Sam's Club. O abastecimento registra o
local físico, mas consome a reserva lógica `MERCADOS`. Boa Vista tem destino
lógico próprio.

Mercados aceitam somente `MIX` e `CAPIVARAS`; Boa Vista aceita somente `BIG`.
Reservas de outros destinos permanecem protegidas.

## Máquinas

| Local | Máquina | Produto permitido |
| --- | --- | --- |
| Boulevard | M1, M2, M3 | MIX ou PERSONAGENS |
| Boulevard | M4 | CAPIVARAS |
| Boulevard | M5 | BIG |
| Aeroporto | B01 | STITCH |
| Aeroporto | B02 | CAPIVARAS |
| Aeroporto | B03 | PERSONAGENS |
| Aeroporto | GRANDE_DIREITA/ESQUERDA | BIG |
| Aeroporto | B06 | MIX |
| Aeroporto | B07 | LABUBU |

Mercados usam a máquina identificada pelo próprio local. Um abastecimento de
Boulevard/Aeroporto gera um registro agregado, mesmo contendo várias máquinas.

## Ciclo das operações

- **Retirada:** Principal diminui e Pessoal aumenta.
- **Reserva:** somente reduz o livre calculado.
- **Abastecimento:** Pessoal diminui; a reserva ativa do destino é utilizada.
- **Devolução:** Pessoal diminui, Principal aumenta e apenas a reserva escolhida
  é liberada.
- **Consumo:** apenas insumos do estoque pessoal diminuem.
- **Movimento Principal:** entrada aumenta ou saída diminui diretamente o
  Principal, com histórico e auditoria do usuário autenticado.

Reservas podem estar `ATIVA`, `CANCELADA` ou `CONCLUIDA`; seus eventos são
`CRIACAO`, `UTILIZACAO`, `LIBERACAO`, `CANCELAMENTO` e `CONCLUSAO`.
