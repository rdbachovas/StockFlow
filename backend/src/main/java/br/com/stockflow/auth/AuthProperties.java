package br.com.stockflow.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "stockflow.auth")
public record AuthProperties(
        String jwtSecret,
        long accessTokenSeconds,
        long refreshTokenSeconds,
        InitialPasswords initialPasswords
) {
    public record InitialPasswords(String rodrigo, String cesar) {
    }
}
