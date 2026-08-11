package br.com.stockflow.abastecimento;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AbastecimentoRepository
        extends JpaRepository<Abastecimento, UUID> {
}
