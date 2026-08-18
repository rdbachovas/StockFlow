package br.com.stockflow.consumocarrinho;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ConsumoCarrinhoResponse(
        long revisao,
        UUID id,
        String responsavelId,
        String estoqueOrigemId,
        List<Item> itens,
        OffsetDateTime data,
        String observacao
) {

    public static ConsumoCarrinhoResponse de(
            ConsumoCarrinho consumo,
            long revisao
    ) {
        return new ConsumoCarrinhoResponse(
                revisao,
                consumo.getId(),
                consumo.getResponsavel().getId(),
                consumo.getEstoqueOrigem().getId(),
                consumo.getItens().stream().map(Item::de).toList(),
                consumo.getData(),
                consumo.getObservacao()
        );
    }

    public record Item(
            String produtoId,
            int quantidade,
            int saldoAnterior,
            int saldoPosterior
    ) {
        private static Item de(ConsumoCarrinhoItem item) {
            return new Item(
                    item.getProduto().getId(),
                    item.getQuantidade(),
                    item.getSaldoAnterior(),
                    item.getSaldoPosterior()
            );
        }
    }
}
