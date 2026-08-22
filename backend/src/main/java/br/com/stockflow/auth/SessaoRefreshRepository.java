package br.com.stockflow.auth;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

public interface SessaoRefreshRepository
        extends JpaRepository<SessaoRefresh, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<SessaoRefresh> findByTokenHash(String tokenHash);
}
