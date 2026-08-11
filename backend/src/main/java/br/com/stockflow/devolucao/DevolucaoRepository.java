package br.com.stockflow.devolucao;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DevolucaoRepository extends JpaRepository<Devolucao, UUID> {
}
