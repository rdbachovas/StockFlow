package br.com.stockflow.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "stockflow.auth.operational")
public record AuthOperationalProperties(
        int passwordMinLength,
        int passwordMaxLength,
        boolean initialPasswordTemporary,
        int refreshRetentionDays,
        RateLimit loginRateLimit,
        RateLimit refreshRateLimit
) {
    public AuthOperationalProperties {
        if (passwordMinLength < 12 || passwordMaxLength < passwordMinLength) {
            throw new IllegalArgumentException("Política de senha inválida.");
        }
        if (refreshRetentionDays < 1) {
            throw new IllegalArgumentException("Retenção de refresh inválida.");
        }
    }

    public record RateLimit(int attempts, int windowSeconds) {
        public RateLimit {
            if (attempts < 1 || windowSeconds < 1) {
                throw new IllegalArgumentException("Rate limit inválido.");
            }
        }
    }
}
