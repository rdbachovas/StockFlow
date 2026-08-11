package br.com.stockflow.retirada;

import java.time.OffsetDateTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record RetiradaRequest(
        @NotBlank String responsavelId,
        @NotEmpty List<@Valid Item> itens,
        @NotNull OffsetDateTime data,
        @Size(max = 500) String observacao
) {

    public record Item(
            @NotBlank String produtoId,
            @Positive int quantidade
    ) {
    }
}
