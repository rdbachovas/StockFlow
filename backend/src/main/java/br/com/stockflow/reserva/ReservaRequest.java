package br.com.stockflow.reserva;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ReservaRequest(
        @NotNull UUID commandId,
        @NotNull DestinoReserva destino,
        @NotBlank String produtoId,
        @Positive int quantidade
) {
    public ReservaRequest {
        commandId = commandId == null ? UUID.randomUUID() : commandId;
    }
}
