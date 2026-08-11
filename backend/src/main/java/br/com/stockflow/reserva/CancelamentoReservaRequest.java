package br.com.stockflow.reserva;

import jakarta.validation.constraints.NotBlank;

public record CancelamentoReservaRequest(
        @NotBlank String responsavelId
) {
}
