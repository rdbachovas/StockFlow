package br.com.stockflow.consumocarrinho;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/consumos-carrinho")
public class ConsumoCarrinhoController {

    private final ConsumoCarrinhoService service;

    public ConsumoCarrinhoController(ConsumoCarrinhoService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ConsumoCarrinhoResponse registrar(
            @Valid @RequestBody ConsumoCarrinhoRequest request
    ) {
        return service.registrar(request);
    }
}
