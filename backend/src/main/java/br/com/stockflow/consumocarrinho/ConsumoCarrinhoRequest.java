package br.com.stockflow.consumocarrinho;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ConsumoCarrinhoRequest(
        @NotNull UUID commandId,
        @NotBlank String responsavelId,
        @NotEmpty List<@Valid Item> itens,
        @NotNull OffsetDateTime data,
        @Size(max = 500) String observacao
) {
    public ConsumoCarrinhoRequest {
        commandId = commandId == null ? UUID.randomUUID() : commandId;
    }

    public record Item(
            @NotBlank String produtoId,
            @Positive int quantidade
    ) {
    }
}
