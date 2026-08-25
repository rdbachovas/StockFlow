package br.com.stockflow.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestCorrelationFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Request-Id";
    public static final String ATTRIBUTE = RequestCorrelationFilter.class.getName();
    private static final Pattern SAFE_ID = Pattern.compile("[A-Za-z0-9._-]{1,64}");
    private static final Logger LOGGER = LoggerFactory.getLogger(
            RequestCorrelationFilter.class
    );

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String requestId = requestId(request.getHeader(HEADER));
        long startedAt = System.nanoTime();
        request.setAttribute(ATTRIBUTE, requestId);
        response.setHeader(HEADER, requestId);
        try (MDC.MDCCloseable ignored = MDC.putCloseable("requestId", requestId)) {
            try {
                filterChain.doFilter(request, response);
            } finally {
                if (!request.getRequestURI().startsWith("/api/v1/health")) {
                    long durationMs = (System.nanoTime() - startedAt) / 1_000_000;
                    if (response.getStatus() >= 500) {
                        LOGGER.error(
                                "request concluída requestId={} método={} path={} status={} duraçãoMs={}",
                                requestId, request.getMethod(), request.getRequestURI(),
                                response.getStatus(), durationMs
                        );
                    } else {
                        LOGGER.info(
                                "request concluída requestId={} método={} path={} status={} duraçãoMs={}",
                                requestId, request.getMethod(), request.getRequestURI(),
                                response.getStatus(), durationMs
                        );
                    }
                }
            }
        }
    }

    public static String current(HttpServletRequest request) {
        Object value = request.getAttribute(ATTRIBUTE);
        return value instanceof String id ? id : UUID.randomUUID().toString();
    }

    private String requestId(String candidate) {
        return candidate != null && SAFE_ID.matcher(candidate).matches()
                ? candidate
                : UUID.randomUUID().toString();
    }
}
