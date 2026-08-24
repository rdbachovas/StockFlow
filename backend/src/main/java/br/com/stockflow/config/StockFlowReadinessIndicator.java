package br.com.stockflow.config;

import java.sql.Connection;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component("stockFlowReadiness")
public class StockFlowReadinessIndicator implements HealthIndicator {

    private final DataSource dataSource;
    private final Flyway flyway;
    private final AtomicBoolean aplicacaoInicializada = new AtomicBoolean();

    public StockFlowReadinessIndicator(DataSource dataSource, Flyway flyway) {
        this.dataSource = dataSource;
        this.flyway = flyway;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void aplicacaoPronta() {
        aplicacaoInicializada.set(true);
    }

    @Override
    public Health health() {
        if (!aplicacaoInicializada.get()) {
            return Health.down().build();
        }

        try (Connection connection = dataSource.getConnection()) {
            if (!connection.isValid(2) || flyway.info().pending().length > 0) {
                return Health.down().build();
            }
            return Health.up().build();
        } catch (Exception erro) {
            return Health.down().build();
        }
    }
}
