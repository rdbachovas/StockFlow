package br.com.stockflow.devolucao;

import java.time.OffsetDateTime;
import java.util.List;

import br.com.stockflow.reserva.DestinoReserva;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record DevolucaoRequest(
        @NotBlank String responsavelId,
        @NotEmpty List<@Valid Item> itens,
        @NotNull OffsetDateTime data,
        @Size(max = 500) String observacao
) {

    public record Item(
            @NotBlank String produtoId,
            @Min(0) int quantidadeLivre,
            @NotNull List<@Valid ParcelaReserva> reservas
    ) {
    }

    public record ParcelaReserva(
            @NotNull DestinoReserva destino,
            @Positive int quantidade
    ) {
    }
}
