package br.com.stockflow.estoque;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/estoques")
public class EstoqueController {

    private final EstoqueRepository estoqueRepository;

    public EstoqueController(EstoqueRepository estoqueRepository) {
        this.estoqueRepository = estoqueRepository;
    }

    @GetMapping
    public List<EstoqueResponse> listar() {
        return estoqueRepository.findAllByOrderByIdAsc().stream()
                .map(EstoqueResponse::de)
                .toList();
    }
}
