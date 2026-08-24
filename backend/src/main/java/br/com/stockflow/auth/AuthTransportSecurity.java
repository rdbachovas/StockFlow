package br.com.stockflow.auth;

import br.com.stockflow.config.CorsProperties;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class AuthTransportSecurity {

    private final CorsProperties corsProperties;

    public AuthTransportSecurity(CorsProperties corsProperties) {
        this.corsProperties = corsProperties;
    }

    public void validarWeb(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin == null || !originsPermitidas().contains(origin)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    public void validarNative(HttpServletRequest request) {
        if (request.getHeader("Origin") != null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private List<String> originsPermitidas() {
        if (corsProperties.allowedOrigins() == null) {
            return List.of();
        }
        return corsProperties.allowedOrigins().stream()
                .map(String::trim)
                .filter(origin -> !origin.isEmpty() && !origin.equals("*"))
                .toList();
    }
}
