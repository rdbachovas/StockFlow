package br.com.stockflow.idempotencia;

import java.util.UUID;
import java.time.OffsetDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ComandoProcessadoRepository
        extends JpaRepository<ComandoProcessado, UUID> {

    @Modifying
    @Query("delete from ComandoProcessado c where c.dataProcessamento < :limite")
    int removerAnterioresA(@Param("limite") OffsetDateTime limite);
}
