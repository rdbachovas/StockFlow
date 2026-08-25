package br.com.stockflow.auth;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;

@Component
public class AuthRateLimiter {

    private final AuthOperationalProperties properties;
    private final Clock clock;
    private final Map<String, ArrayDeque<Instant>> tentativas =
            new ConcurrentHashMap<>();

    public AuthRateLimiter(AuthOperationalProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    public void verificarLogin(String ip, String login) {
        verificar("login:ip:" + ip, properties.loginRateLimit());
        verificar(
                "login:usuario:" + normalizar(login),
                properties.loginRateLimit()
        );
    }

    public void registrarFalhaLogin(String ip, String login) {
        registrar("login:ip:" + ip);
        registrar("login:usuario:" + normalizar(login));
    }

    public void registrarSucessoLogin(String ip, String login) {
        tentativas.remove("login:ip:" + ip);
        tentativas.remove("login:usuario:" + normalizar(login));
    }

    public void consumirRefresh(String ip) {
        String chave = "refresh:ip:" + ip;
        verificar(chave, properties.refreshRateLimit());
        registrar(chave);
    }

    private void verificar(
            String chave,
            AuthOperationalProperties.RateLimit limite
    ) {
        ArrayDeque<Instant> eventos = tentativas.computeIfAbsent(
                chave, ignorada -> new ArrayDeque<>()
        );
        synchronized (eventos) {
            Instant agora = clock.instant();
            Instant inicio = agora.minusSeconds(limite.windowSeconds());
            while (!eventos.isEmpty() && !eventos.peekFirst().isAfter(inicio)) {
                eventos.removeFirst();
            }
            if (eventos.size() >= limite.attempts()) {
                long retry = Math.max(
                        1,
                        eventos.peekFirst().plusSeconds(limite.windowSeconds())
                                .getEpochSecond() - agora.getEpochSecond()
                );
                throw new RateLimitException(retry);
            }
        }
    }

    private void registrar(String chave) {
        ArrayDeque<Instant> eventos = tentativas.computeIfAbsent(
                chave, ignorada -> new ArrayDeque<>()
        );
        synchronized (eventos) {
            eventos.addLast(clock.instant());
        }
    }

    private String normalizar(String login) {
        return login == null ? "" : login.trim().toLowerCase(Locale.ROOT);
    }

    @Scheduled(fixedDelayString = "${AUTH_RATE_LIMIT_CLEANUP_MS:600000}")
    public void limparExpirados() {
        Instant agora = clock.instant();
        tentativas.forEach((chave, eventos) -> {
            int janela = chave.startsWith("refresh:")
                    ? properties.refreshRateLimit().windowSeconds()
                    : properties.loginRateLimit().windowSeconds();
            synchronized (eventos) {
                Instant inicio = agora.minusSeconds(janela);
                while (!eventos.isEmpty()
                        && !eventos.peekFirst().isAfter(inicio)) {
                    eventos.removeFirst();
                }
                if (eventos.isEmpty()) {
                    tentativas.remove(chave, eventos);
                }
            }
        });
    }
}
