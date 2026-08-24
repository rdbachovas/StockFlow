package br.com.stockflow.retirada;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record RetiradaRequest(
        @NotNull UUID commandId,
        @NotEmpty List<@Valid Item> itens,
        @NotNull OffsetDateTime data,
        @Size(max = 500) String observacao
) {
    public RetiradaRequest {
        commandId = commandId == null ? UUID.randomUUID() : commandId;
    }

    public record Item(
            @NotBlank String produtoId,
            @Positive int quantidade
    ) {
    }
}
