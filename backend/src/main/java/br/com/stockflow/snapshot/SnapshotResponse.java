package br.com.stockflow.snapshot;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import br.com.stockflow.abastecimento.Abastecimento;
import br.com.stockflow.abastecimento.AbastecimentoItem;
import br.com.stockflow.abastecimento.AbastecimentoSaldo;
import br.com.stockflow.consumocarrinho.ConsumoCarrinho;
import br.com.stockflow.consumocarrinho.ConsumoCarrinhoItem;
import br.com.stockflow.devolucao.Devolucao;
import br.com.stockflow.devolucao.DevolucaoItem;
import br.com.stockflow.devolucao.DevolucaoReserva;
import br.com.stockflow.estoque.Estoque;
import br.com.stockflow.estoque.EstoqueItem;
import br.com.stockflow.movimentoprincipal.MovimentoEstoquePrincipal;
import br.com.stockflow.movimentoprincipal.MovimentoEstoquePrincipalItem;
import br.com.stockflow.movimentoprincipal.TipoMovimentoEstoquePrincipal;
import br.com.stockflow.reserva.DestinoReserva;
import br.com.stockflow.reserva.Reserva;
import br.com.stockflow.reserva.ReservaEvento;
import br.com.stockflow.reserva.StatusReserva;
import br.com.stockflow.reserva.TipoEventoReserva;
import br.com.stockflow.retirada.Retirada;
import br.com.stockflow.retirada.RetiradaItem;

public record SnapshotResponse(
        long revisao,
        List<EstoqueDto> estoques,
        List<ReservaDto> reservas,
        List<RetiradaDto> retiradas,
        List<AbastecimentoDto> abastecimentos,
        List<DevolucaoDto> devolucoes,
        List<MovimentoPrincipalDto> movimentosEstoquePrincipal,
        List<ConsumoCarrinhoDto> consumosCarrinho
) {

    public record EstoqueDto(
            String id,
            String nome,
            String responsavelId,
            List<EstoqueItemDto> itens
    ) {
        static EstoqueDto de(Estoque estoque) {
            return new EstoqueDto(
                    estoque.getId(),
                    estoque.getNome(),
                    estoque.getResponsavel() == null
                            ? null
                            : estoque.getResponsavel().getId(),
                    estoque.getItens().stream()
                            .map(EstoqueItemDto::de)
                            .sorted((a, b) -> a.produtoId()
                                    .compareTo(b.produtoId()))
                            .toList()
            );
        }
    }

    public record EstoqueItemDto(
            String produtoId,
            String nome,
            String grupo,
            int quantidade
    ) {
        static EstoqueItemDto de(EstoqueItem item) {
            return new EstoqueItemDto(
                    item.getProduto().getId(),
                    item.getProduto().getNome(),
                    item.getProduto().getGrupo(),
                    item.getQuantidade()
            );
        }
    }

    public record ReservaDto(
            UUID id,
            String responsavelId,
            DestinoReserva destino,
            String produtoId,
            int quantidade,
            int quantidadeUtilizada,
            int quantidadeLiberada,
            int quantidadeRestante,
            StatusReserva status,
            OffsetDateTime dataCriacao,
            List<ReservaEventoDto> eventos
    ) {
        static ReservaDto de(Reserva reserva) {
            return new ReservaDto(
                    reserva.getId(),
                    reserva.getResponsavel().getId(),
                    reserva.getDestino(),
                    reserva.getProduto().getId(),
                    reserva.getQuantidade(),
                    reserva.getQuantidadeUtilizada(),
                    reserva.getQuantidadeLiberada(),
                    reserva.getQuantidadeRestante(),
                    reserva.getStatus(),
                    reserva.getDataCriacao(),
                    reserva.getEventos().stream()
                            .map(ReservaEventoDto::de)
                            .toList()
            );
        }
    }

    public record ReservaEventoDto(
            UUID id,
            TipoEventoReserva tipo,
            int quantidade,
            OffsetDateTime data
    ) {
        static ReservaEventoDto de(ReservaEvento evento) {
            return new ReservaEventoDto(
                    evento.getId(),
                    evento.getTipo(),
                    evento.getQuantidade(),
                    evento.getData()
            );
        }
    }

    public record RetiradaDto(
            UUID id,
            String responsavelId,
            String estoqueOrigemId,
            String estoqueDestinoId,
            List<MovimentoItemDto> itens,
            OffsetDateTime data,
            String observacao
    ) {
        static RetiradaDto de(Retirada retirada) {
            return new RetiradaDto(
                    retirada.getId(),
                    retirada.getResponsavel().getId(),
                    retirada.getEstoqueOrigem().getId(),
                    retirada.getEstoqueDestino().getId(),
                    retirada.getItens().stream()
                            .map(MovimentoItemDto::de)
                            .toList(),
                    retirada.getData(),
                    retirada.getObservacao()
            );
        }
    }

    public record MovimentoItemDto(
            String produtoId,
            int quantidade,
            int saldoAnterior,
            int saldoPosterior
    ) {
        static MovimentoItemDto de(RetiradaItem item) {
            return new MovimentoItemDto(
                    item.getProduto().getId(),
                    item.getQuantidade(),
                    item.getSaldoAnterior(),
                    item.getSaldoPosterior()
            );
        }

        static MovimentoItemDto de(MovimentoEstoquePrincipalItem item) {
            return new MovimentoItemDto(
                    item.getProduto().getId(),
                    item.getQuantidade(),
                    item.getSaldoAnterior(),
                    item.getSaldoPosterior()
            );
        }

        static MovimentoItemDto de(ConsumoCarrinhoItem item) {
            return new MovimentoItemDto(
                    item.getProduto().getId(),
                    item.getQuantidade(),
                    item.getSaldoAnterior(),
                    item.getSaldoPosterior()
            );
        }
    }

    public record AbastecimentoDto(
            UUID id,
            String responsavelId,
            String estoqueOrigemId,
            br.com.stockflow.abastecimento.LocalAbastecimento local,
            List<AbastecimentoItemDto> itens,
            List<AbastecimentoSaldoDto> saldos,
            OffsetDateTime data,
            String observacao
    ) {
        static AbastecimentoDto de(Abastecimento abastecimento) {
            return new AbastecimentoDto(
                    abastecimento.getId(),
                    abastecimento.getResponsavel().getId(),
                    abastecimento.getEstoqueOrigem().getId(),
                    abastecimento.getLocal(),
                    abastecimento.getItens().stream()
                            .map(AbastecimentoItemDto::de)
                            .toList(),
                    abastecimento.getSaldos().stream()
                            .map(AbastecimentoSaldoDto::de)
                            .toList(),
                    abastecimento.getData(),
                    abastecimento.getObservacao()
            );
        }
    }

    public record AbastecimentoItemDto(
            String maquinaId,
            String produtoId,
            int quantidade
    ) {
        static AbastecimentoItemDto de(AbastecimentoItem item) {
            return new AbastecimentoItemDto(
                    item.getMaquinaId(),
                    item.getProduto().getId(),
                    item.getQuantidade()
            );
        }
    }

    public record AbastecimentoSaldoDto(
            String produtoId,
            int quantidade,
            int saldoAnterior,
            int saldoPosterior
    ) {
        static AbastecimentoSaldoDto de(AbastecimentoSaldo saldo) {
            return new AbastecimentoSaldoDto(
                    saldo.getProduto().getId(),
                    saldo.getQuantidade(),
                    saldo.getSaldoAnterior(),
                    saldo.getSaldoPosterior()
            );
        }
    }

    public record DevolucaoDto(
            UUID id,
            String responsavelId,
            String estoqueOrigemId,
            String estoqueDestinoId,
            List<DevolucaoItemDto> itens,
            OffsetDateTime data,
            String observacao
    ) {
        static DevolucaoDto de(Devolucao devolucao) {
            return new DevolucaoDto(
                    devolucao.getId(),
                    devolucao.getResponsavel().getId(),
                    devolucao.getEstoqueOrigem().getId(),
                    devolucao.getEstoqueDestino().getId(),
                    devolucao.getItens().stream()
                            .map(DevolucaoItemDto::de)
                            .toList(),
                    devolucao.getData(),
                    devolucao.getObservacao()
            );
        }
    }

    public record DevolucaoItemDto(
            String produtoId,
            int quantidadeLivre,
            int quantidadeReservada,
            int quantidadeTotal,
            int saldoPessoalAnterior,
            int saldoPessoalPosterior,
            int saldoPrincipalAnterior,
            int saldoPrincipalPosterior,
            List<DevolucaoReservaDto> reservas
    ) {
        static DevolucaoItemDto de(DevolucaoItem item) {
            return new DevolucaoItemDto(
                    item.getProduto().getId(),
                    item.getQuantidadeLivre(),
                    item.getQuantidadeReservada(),
                    item.getQuantidadeTotal(),
                    item.getSaldoPessoalAnterior(),
                    item.getSaldoPessoalPosterior(),
                    item.getSaldoPrincipalAnterior(),
                    item.getSaldoPrincipalPosterior(),
                    item.getReservas().stream()
                            .map(DevolucaoReservaDto::de)
                            .toList()
            );
        }
    }

    public record DevolucaoReservaDto(
            UUID reservaId,
            DestinoReserva destino,
            int quantidade
    ) {
        static DevolucaoReservaDto de(DevolucaoReserva reserva) {
            return new DevolucaoReservaDto(
                    reserva.getReservaId(),
                    reserva.getDestino(),
                    reserva.getQuantidade()
            );
        }
    }

    public record MovimentoPrincipalDto(
            UUID id,
            TipoMovimentoEstoquePrincipal tipo,
            List<MovimentoItemDto> itens,
            OffsetDateTime data,
            String observacao
    ) {
        static MovimentoPrincipalDto de(MovimentoEstoquePrincipal movimento) {
            return new MovimentoPrincipalDto(
                    movimento.getId(),
                    movimento.getTipo(),
                    movimento.getItens().stream()
                            .map(MovimentoItemDto::de)
                            .toList(),
                    movimento.getData(),
                    movimento.getObservacao()
            );
        }
    }

    public record ConsumoCarrinhoDto(
            UUID id,
            String responsavelId,
            String estoqueOrigemId,
            List<MovimentoItemDto> itens,
            OffsetDateTime data,
            String observacao
    ) {
        static ConsumoCarrinhoDto de(ConsumoCarrinho consumo) {
            return new ConsumoCarrinhoDto(
                    consumo.getId(),
                    consumo.getResponsavel().getId(),
                    consumo.getEstoqueOrigem().getId(),
                    consumo.getItens().stream()
                            .map(MovimentoItemDto::de)
                            .toList(),
                    consumo.getData(),
                    consumo.getObservacao()
            );
        }
    }
}
