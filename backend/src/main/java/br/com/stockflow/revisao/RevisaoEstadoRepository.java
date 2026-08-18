package br.com.stockflow.revisao;

import java.util.Optional;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RevisaoEstadoRepository
        extends JpaRepository<RevisaoEstado, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from RevisaoEstado r where r.id = :id")
    Optional<RevisaoEstado> buscarParaAtualizacao(@Param("id") Integer id);
}
