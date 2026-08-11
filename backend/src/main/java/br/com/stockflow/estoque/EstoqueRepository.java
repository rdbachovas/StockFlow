package br.com.stockflow.estoque;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EstoqueRepository extends JpaRepository<Estoque, String> {

    @EntityGraph(attributePaths = {"responsavel", "itens", "itens.produto"})
    List<Estoque> findAllByOrderByIdAsc();

    Optional<Estoque> findByResponsavelId(String responsavelId);
}
