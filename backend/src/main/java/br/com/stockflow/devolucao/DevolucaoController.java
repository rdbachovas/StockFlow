package br.com.stockflow.devolucao;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/devolucoes")
public class DevolucaoController {

    private final DevolucaoService devolucaoService;

    public DevolucaoController(DevolucaoService devolucaoService) {
        this.devolucaoService = devolucaoService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DevolucaoResponse registrar(
            @Valid @RequestBody DevolucaoRequest request
    ) {
        return devolucaoService.registrar(request);
    }
}
