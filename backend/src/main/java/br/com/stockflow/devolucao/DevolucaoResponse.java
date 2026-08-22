package br.com.stockflow.devolucao;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import br.com.stockflow.reserva.DestinoReserva;

public record DevolucaoResponse(
        long revisao,
        UUID id,
        String responsavelId,
        String estoqueOrigemId,
        String estoqueDestinoId,
        List<Item> itens,
        OffsetDateTime data,
        String observacao
) {

    public static DevolucaoResponse de(Devolucao devolucao, long revisao) {
        return new DevolucaoResponse(
                revisao,
                devolucao.getId(),
                devolucao.getResponsavel().getId(),
                devolucao.getEstoqueOrigem().getId(),
                devolucao.getEstoqueDestino().getId(),
                devolucao.getItens().stream().map(Item::de).toList(),
                devolucao.getData(),
                devolucao.getObservacao()
        );
    }

    public record Item(
            String produtoId,
            int quantidadeLivre,
            int quantidadeReservada,
            int quantidadeTotal,
            int saldoPessoalAnterior,
            int saldoPessoalPosterior,
            int saldoPrincipalAnterior,
            int saldoPrincipalPosterior,
            List<ParcelaReserva> reservas
    ) {
        private static Item de(DevolucaoItem item) {
            return new Item(
                    item.getProduto().getId(),
                    item.getQuantidadeLivre(),
                    item.getQuantidadeReservada(),
                    item.getQuantidadeTotal(),
                    item.getSaldoPessoalAnterior(),
                    item.getSaldoPessoalPosterior(),
                    item.getSaldoPrincipalAnterior(),
                    item.getSaldoPrincipalPosterior(),
                    item.getReservas().stream()
                            .map(ParcelaReserva::de)
                            .toList()
            );
        }
    }

    public record ParcelaReserva(
            UUID reservaId,
            DestinoReserva destino,
            int quantidade
    ) {
        private static ParcelaReserva de(DevolucaoReserva reserva) {
            return new ParcelaReserva(
                    reserva.getReservaId(),
                    reserva.getDestino(),
                    reserva.getQuantidade()
            );
        }
    }
}
