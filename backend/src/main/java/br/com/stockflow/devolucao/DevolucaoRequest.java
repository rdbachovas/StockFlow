package br.com.stockflow.devolucao;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import br.com.stockflow.reserva.DestinoReserva;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record DevolucaoRequest(
        @NotNull UUID commandId,
        @NotEmpty @Size(max = 50) List<@Valid Item> itens,
        @NotNull OffsetDateTime data,
        @Size(max = 500) String observacao
) {
    public DevolucaoRequest {
        commandId = commandId == null ? UUID.randomUUID() : commandId;
    }

    public record Item(
            @NotBlank @Size(max = 64) String produtoId,
            @Min(0) int quantidadeLivre,
            @NotNull @Size(max = 10) List<@Valid ParcelaReserva> reservas
    ) {
    }

    public record ParcelaReserva(
            @NotNull DestinoReserva destino,
            @Positive int quantidade
    ) {
    }
}
