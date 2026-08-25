package br.com.stockflow.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class RequestBodyLimitFilter extends OncePerRequestFilter {

    private final int maxBodyBytes;

    public RequestBodyLimitFilter(
            @Value("${stockflow.http.max-body-bytes:1048576}") int maxBodyBytes
    ) {
        this.maxBodyBytes = maxBodyBytes;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (!hasBody(request)) {
            filterChain.doFilter(request, response);
            return;
        }
        long declaredLength = request.getContentLengthLong();
        if (declaredLength > maxBodyBytes) {
            reject(request, response);
            return;
        }
        byte[] body = request.getInputStream().readNBytes(maxBodyBytes + 1);
        if (body.length > maxBodyBytes) {
            reject(request, response);
            return;
        }
        filterChain.doFilter(new CachedBodyRequest(request, body), response);
    }

    private boolean hasBody(HttpServletRequest request) {
        return switch (request.getMethod()) {
            case "POST", "PUT", "PATCH" -> true;
            default -> false;
        };
    }

    private void reject(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        response.setStatus(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        String requestId = RequestCorrelationFilter.current(request);
        response.getWriter().write("""
                {"status":413,"code":"REQUEST_TOO_LARGE","detail":"Corpo da requisição excede o limite permitido.","requestId":"%s"}
                """.formatted(requestId).strip());
    }

    private static final class CachedBodyRequest
            extends HttpServletRequestWrapper {
        private final byte[] body;

        private CachedBodyRequest(HttpServletRequest request, byte[] body) {
            super(request);
            this.body = body;
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream input = new ByteArrayInputStream(body);
            return new ServletInputStream() {
                @Override
                public boolean isFinished() {
                    return input.available() == 0;
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setReadListener(ReadListener readListener) {
                    throw new UnsupportedOperationException();
                }

                @Override
                public int read() {
                    return input.read();
                }
            };
        }

        @Override
        public java.io.BufferedReader getReader() {
            return new java.io.BufferedReader(new java.io.InputStreamReader(
                    getInputStream(),
                    getCharacterEncoding() == null
                            ? StandardCharsets.UTF_8
                            : java.nio.charset.Charset.forName(getCharacterEncoding())
            ));
        }
    }
}
