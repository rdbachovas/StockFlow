package br.com.stockflow.auth;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import java.time.OffsetDateTime;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SessaoRefreshRepository
        extends JpaRepository<SessaoRefresh, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<SessaoRefresh> findByTokenHash(String tokenHash);

    @Modifying
    @Query("""
            update SessaoRefresh s set s.revogadoEm = :agora
            where s.usuario.id = :usuarioId and s.revogadoEm is null
            """)
    int revogarTodasDoUsuario(
            @Param("usuarioId") String usuarioId,
            @Param("agora") OffsetDateTime agora
    );

    @Modifying
    @Query("""
            delete from SessaoRefresh s
            where (s.revogadoEm is not null and s.revogadoEm < :limite)
               or s.expiraEm < :limite
            """)
    int removerDescartaveis(@Param("limite") OffsetDateTime limite);
}
