package br.com.stockflow.retirada;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RetiradaRepository extends JpaRepository<Retirada, UUID> {
}
