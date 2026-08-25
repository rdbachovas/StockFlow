package br.com.stockflow.config;

import br.com.stockflow.auth.AuthOperationalProperties;
import br.com.stockflow.auth.SessaoRefreshRepository;
import br.com.stockflow.idempotencia.ComandoProcessadoRepository;
import br.com.stockflow.idempotencia.IdempotencyProperties;
import java.time.Clock;
import java.time.OffsetDateTime;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SecurityRetentionCleanup {

    private final SessaoRefreshRepository sessionRepository;
    private final ComandoProcessadoRepository commandRepository;
    private final AuthOperationalProperties authProperties;
    private final IdempotencyProperties idempotencyProperties;
    private final Clock clock;

    public SecurityRetentionCleanup(
            SessaoRefreshRepository sessionRepository,
            ComandoProcessadoRepository commandRepository,
            AuthOperationalProperties authProperties,
            IdempotencyProperties idempotencyProperties,
            Clock clock
    ) {
        this.sessionRepository = sessionRepository;
        this.commandRepository = commandRepository;
        this.authProperties = authProperties;
        this.idempotencyProperties = idempotencyProperties;
        this.clock = clock;
    }

    @Scheduled(cron = "${SECURITY_CLEANUP_CRON:0 30 3 * * *}")
    @Transactional
    public void executar() {
        OffsetDateTime agora = OffsetDateTime.now(clock);
        sessionRepository.removerDescartaveis(
                agora.minusDays(authProperties.refreshRetentionDays())
        );
        commandRepository.removerAnterioresA(
                agora.minusDays(idempotencyProperties.retentionDays())
        );
    }
}
