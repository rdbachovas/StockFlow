package br.com.stockflow.reserva;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CancelamentoReservaRequest(
        @NotNull UUID commandId,
        @NotBlank String responsavelId
) {
    public CancelamentoReservaRequest {
        commandId = commandId == null ? UUID.randomUUID() : commandId;
    }
}
