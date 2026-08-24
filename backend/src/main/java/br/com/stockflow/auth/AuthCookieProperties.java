package br.com.stockflow.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "stockflow.auth.cookie")
public record AuthCookieProperties(
        String name,
        String path,
        boolean secure,
        String sameSite
) {
}
