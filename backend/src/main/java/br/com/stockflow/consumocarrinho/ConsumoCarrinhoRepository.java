package br.com.stockflow.consumocarrinho;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsumoCarrinhoRepository
        extends JpaRepository<ConsumoCarrinho, UUID> {
}
