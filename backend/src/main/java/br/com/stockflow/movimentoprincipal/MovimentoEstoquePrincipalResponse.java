package br.com.stockflow.movimentoprincipal;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record MovimentoEstoquePrincipalResponse(
        UUID id,
        TipoMovimentoEstoquePrincipal tipo,
        List<Item> itens,
        OffsetDateTime data,
        String observacao
) {

    public static MovimentoEstoquePrincipalResponse de(
            MovimentoEstoquePrincipal movimento
    ) {
        return new MovimentoEstoquePrincipalResponse(
                movimento.getId(),
                movimento.getTipo(),
                movimento.getItens().stream().map(Item::de).toList(),
                movimento.getData(),
                movimento.getObservacao()
        );
    }

    public record Item(
            String produtoId,
            int quantidade,
            int saldoAnterior,
            int saldoPosterior
    ) {
        private static Item de(MovimentoEstoquePrincipalItem item) {
            return new Item(
                    item.getProduto().getId(),
                    item.getQuantidade(),
                    item.getSaldoAnterior(),
                    item.getSaldoPosterior()
            );
        }
    }
}
