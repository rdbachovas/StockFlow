package br.com.stockflow.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "stockflow.cors")
public record CorsProperties(
        List<String> allowedOrigins,
        boolean allowCredentials
) {
}
