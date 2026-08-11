package br.com.stockflow.movimentoprincipal;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MovimentoEstoquePrincipalRepository
        extends JpaRepository<MovimentoEstoquePrincipal, UUID> {
}
