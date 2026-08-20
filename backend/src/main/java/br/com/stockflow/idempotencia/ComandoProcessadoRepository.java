package br.com.stockflow.idempotencia;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ComandoProcessadoRepository
        extends JpaRepository<ComandoProcessado, UUID> {
}
