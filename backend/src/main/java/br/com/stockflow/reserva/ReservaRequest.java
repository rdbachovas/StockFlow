package br.com.stockflow.reserva;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ReservaRequest(
        @NotBlank String responsavelId,
        @NotNull DestinoReserva destino,
        @NotBlank String produtoId,
        @Positive int quantidade
) {
}
