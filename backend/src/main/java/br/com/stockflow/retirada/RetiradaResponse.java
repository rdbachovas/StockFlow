package br.com.stockflow.retirada;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record RetiradaResponse(
        UUID id,
        String responsavelId,
        String estoqueOrigemId,
        String estoqueDestinoId,
        List<Item> itens,
        OffsetDateTime data,
        String observacao
) {

    public static RetiradaResponse de(Retirada retirada) {
        return new RetiradaResponse(
                retirada.getId(),
                retirada.getResponsavel().getId(),
                retirada.getEstoqueOrigem().getId(),
                retirada.getEstoqueDestino().getId(),
                retirada.getItens().stream()
                        .map(Item::de)
                        .toList(),
                retirada.getData(),
                retirada.getObservacao()
        );
    }

    public record Item(
            String produtoId,
            int quantidade,
            int saldoAnterior,
            int saldoPosterior
    ) {

        private static Item de(RetiradaItem item) {
            return new Item(
                    item.getProduto().getId(),
                    item.getQuantidade(),
                    item.getSaldoAnterior(),
                    item.getSaldoPosterior()
            );
        }
    }
}
