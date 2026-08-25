package br.com.stockflow.movimentoprincipal;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record MovimentoEstoquePrincipalRequest(
        @NotNull UUID commandId,
        @NotNull TipoMovimentoEstoquePrincipal tipo,
        @NotEmpty @Size(max = 50) List<@Valid Item> itens,
        @NotNull OffsetDateTime data,
        @Size(max = 500) String observacao
) {
    public MovimentoEstoquePrincipalRequest {
        commandId = commandId == null ? UUID.randomUUID() : commandId;
    }

    public record Item(
            @NotBlank @Size(max = 64) String produtoId,
            @Positive int quantidade
    ) {
    }
}
