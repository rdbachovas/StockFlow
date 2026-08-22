package br.com.stockflow.abastecimento;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record AbastecimentoRequest(
        @NotNull UUID commandId,
        @NotBlank String responsavelId,
        @NotNull LocalAbastecimento local,
        @NotEmpty List<@Valid Item> itens,
        @NotNull OffsetDateTime data,
        @Size(max = 500) String observacao
) {
    public AbastecimentoRequest {
        commandId = commandId == null ? UUID.randomUUID() : commandId;
    }

    public record Item(
            @NotBlank String maquinaId,
            @NotBlank String produtoId,
            @Positive int quantidade
    ) {
    }
}
