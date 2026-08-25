package br.com.stockflow.auth;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class AuthRateLimiterTest {

    @Test
    void janelaExpiraELimitesLoginRefreshSaoIndependentes() {
        MutableClock clock = new MutableClock();
        AuthRateLimiter limiter = new AuthRateLimiter(properties(), clock);

        limiter.verificarLogin("ip-a", "Rodrigo");
        limiter.registrarFalhaLogin("ip-a", "Rodrigo");
        limiter.verificarLogin("ip-a", "Rodrigo");
        limiter.registrarFalhaLogin("ip-a", "Rodrigo");

        assertThatThrownBy(() -> limiter.verificarLogin("ip-a", "rodrigo"))
                .isInstanceOf(RateLimitException.class);
        assertThatCode(() -> limiter.consumirRefresh("ip-a"))
                .doesNotThrowAnyException();
        assertThatCode(() -> limiter.verificarLogin("ip-b", "cesar"))
                .doesNotThrowAnyException();

        clock.avancar(61);
        assertThatCode(() -> limiter.verificarLogin("ip-a", "rodrigo"))
                .doesNotThrowAnyException();
    }

    @Test
    void refreshTemLimiteProprioPorIp() {
        AuthRateLimiter limiter = new AuthRateLimiter(
                properties(), new MutableClock()
        );
        limiter.consumirRefresh("ip-a");
        limiter.consumirRefresh("ip-a");
        limiter.consumirRefresh("ip-a");

        assertThatThrownBy(() -> limiter.consumirRefresh("ip-a"))
                .isInstanceOf(RateLimitException.class);
        assertThatCode(() -> limiter.consumirRefresh("ip-b"))
                .doesNotThrowAnyException();
    }

    private AuthOperationalProperties properties() {
        return new AuthOperationalProperties(
                12, 128, true, 30,
                new AuthOperationalProperties.RateLimit(2, 60),
                new AuthOperationalProperties.RateLimit(3, 60)
        );
    }

    private static final class MutableClock extends Clock {
        private Instant instant = Instant.parse("2026-08-24T12:00:00Z");

        void avancar(long segundos) {
            instant = instant.plusSeconds(segundos);
        }

        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return instant; }
    }
}
