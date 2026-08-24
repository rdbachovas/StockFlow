package br.com.stockflow.reserva;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record CancelamentoReservaRequest(
        @NotNull UUID commandId
) {
    public CancelamentoReservaRequest {
        commandId = commandId == null ? UUID.randomUUID() : commandId;
    }
}
