package br.com.stockflow.movimentoprincipal;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/movimentos-estoque-principal")
public class MovimentoEstoquePrincipalController {

    private final MovimentoEstoquePrincipalService service;

    public MovimentoEstoquePrincipalController(
            MovimentoEstoquePrincipalService service
    ) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MovimentoEstoquePrincipalResponse registrar(
            @Valid @RequestBody MovimentoEstoquePrincipalRequest request
    ) {
        return service.registrar(request);
    }
}
