package br.com.stockflow.estoque;

import java.util.Comparator;
import java.util.List;

public record EstoqueResponse(
        String id,
        String nome,
        String responsavelId,
        List<Item> itens
) {

    public static EstoqueResponse de(Estoque estoque) {
        List<Item> itens = estoque.getItens().stream()
                .map(Item::de)
                .sorted(Comparator.comparing(Item::produtoId))
                .toList();

        String responsavelId = estoque.getResponsavel() == null
                ? null
                : estoque.getResponsavel().getId();

        return new EstoqueResponse(
                estoque.getId(),
                estoque.getNome(),
                responsavelId,
                itens
        );
    }

    public record Item(
            String produtoId,
            String nome,
            int quantidade
    ) {

        private static Item de(EstoqueItem item) {
            return new Item(
                    item.getProduto().getId(),
                    item.getProduto().getNome(),
                    item.getQuantidade()
            );
        }
    }
}
