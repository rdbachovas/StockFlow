package br.com.stockflow.abastecimento;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import br.com.stockflow.reserva.DestinoReserva;

public record AbastecimentoResponse(
        UUID id,
        String responsavelId,
        String estoqueOrigemId,
        DestinoReserva local,
        List<Item> itens,
        List<Saldo> saldos,
        OffsetDateTime data,
        String observacao
) {

    public static AbastecimentoResponse de(Abastecimento abastecimento) {
        return new AbastecimentoResponse(
                abastecimento.getId(),
                abastecimento.getResponsavel().getId(),
                abastecimento.getEstoqueOrigem().getId(),
                abastecimento.getLocal(),
                abastecimento.getItens().stream().map(Item::de).toList(),
                abastecimento.getSaldos().stream().map(Saldo::de).toList(),
                abastecimento.getData(),
                abastecimento.getObservacao()
        );
    }

    public record Item(
            String maquinaId,
            String produtoId,
            int quantidade
    ) {
        private static Item de(AbastecimentoItem item) {
            return new Item(
                    item.getMaquinaId(),
                    item.getProduto().getId(),
                    item.getQuantidade()
            );
        }
    }

    public record Saldo(
            String produtoId,
            int quantidade,
            int saldoAnterior,
            int saldoPosterior
    ) {
        private static Saldo de(AbastecimentoSaldo saldo) {
            return new Saldo(
                    saldo.getProduto().getId(),
                    saldo.getQuantidade(),
                    saldo.getSaldoAnterior(),
                    saldo.getSaldoPosterior()
            );
        }
    }
}
