package br.com.stockflow.reserva;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ReservaResponse(
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
        List<Evento> eventos
) {

    public static ReservaResponse de(Reserva reserva) {
        return new ReservaResponse(
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
                reserva.getEventos().stream().map(Evento::de).toList()
        );
    }

    public record Evento(
            UUID id,
            TipoEventoReserva tipo,
            int quantidade,
            OffsetDateTime data
    ) {

        private static Evento de(ReservaEvento evento) {
            return new Evento(
                    evento.getId(),
                    evento.getTipo(),
                    evento.getQuantidade(),
                    evento.getData()
            );
        }
    }
}
