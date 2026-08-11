package br.com.stockflow.retirada;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/retiradas")
public class RetiradaController {

    private final RetiradaService retiradaService;

    public RetiradaController(RetiradaService retiradaService) {
        this.retiradaService = retiradaService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RetiradaResponse registrar(
            @Valid @RequestBody RetiradaRequest request
    ) {
        return retiradaService.registrar(request);
    }
}
