package br.com.stockflow.abastecimento;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/abastecimentos")
public class AbastecimentoController {

    private final AbastecimentoService abastecimentoService;

    public AbastecimentoController(
            AbastecimentoService abastecimentoService
    ) {
        this.abastecimentoService = abastecimentoService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AbastecimentoResponse registrar(
            @Valid @RequestBody AbastecimentoRequest request
    ) {
        return abastecimentoService.registrar(request);
    }
}
