package br.com.stockflow.auth;

import java.time.Duration;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class AuthCookieService {

    private final AuthCookieProperties properties;
    private final AuthProperties authProperties;

    public AuthCookieService(
            AuthCookieProperties properties,
            AuthProperties authProperties
    ) {
        this.properties = properties;
        this.authProperties = authProperties;
    }

    public String nome() {
        return properties.name();
    }

    public ResponseCookie criar(String refreshToken) {
        return base(refreshToken)
                .maxAge(Duration.ofSeconds(authProperties.refreshTokenSeconds()))
                .build();
    }

    public ResponseCookie expirar() {
        return base("").maxAge(Duration.ZERO).build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String valor) {
        return ResponseCookie.from(properties.name(), valor)
                .httpOnly(true)
                .secure(properties.secure())
                .sameSite(properties.sameSite())
                .path(properties.path());
    }
}
