package br.com.stockflow.abastecimento;

import java.time.OffsetDateTime;
import java.util.List;

import br.com.stockflow.reserva.DestinoReserva;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record AbastecimentoRequest(
        @NotBlank String responsavelId,
        @NotNull DestinoReserva local,
        @NotEmpty List<@Valid Item> itens,
        @NotNull OffsetDateTime data,
        @Size(max = 500) String observacao
) {

    public record Item(
            @NotBlank String maquinaId,
            @NotBlank String produtoId,
            @Positive int quantidade
    ) {
    }
}
