package br.com.stockflow.idempotencia;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "stockflow.idempotency")
public record IdempotencyProperties(int retentionDays) {
    public IdempotencyProperties {
        if (retentionDays < 30) {
            throw new IllegalArgumentException(
                    "IDEMPOTENCY_RETENTION_DAYS deve ser ao menos 30."
            );
        }
    }
}
