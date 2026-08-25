package br.com.stockflow.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import br.com.stockflow.config.RequestCorrelationFilter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class AuthExceptionHandler {

    private final AuthCookieService cookieService;

    public AuthExceptionHandler(AuthCookieService cookieService) {
        this.cookieService = cookieService;
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail credenciaisInvalidas(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        if (request.getRequestURI().equals("/api/v1/auth/web/refresh")) {
            response.addHeader(
                    HttpHeaders.SET_COOKIE,
                    cookieService.expirar().toString()
            );
        }
        ProblemDetail detalhe = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        detalhe.setDetail("Credenciais ou sessão inválidas.");
        identificar(detalhe, "INVALID_CREDENTIALS", request);
        return detalhe;
    }

    @ExceptionHandler(CurrentPasswordInvalidException.class)
    public ProblemDetail senhaAtualInvalida(HttpServletRequest request) {
        ProblemDetail detalhe = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        detalhe.setDetail("Senha atual inválida.");
        identificar(detalhe, "CURRENT_PASSWORD_INVALID", request);
        return detalhe;
    }

    @ExceptionHandler(PasswordPolicyException.class)
    public ProblemDetail politicaSenha(
            PasswordPolicyException exception,
            HttpServletRequest request
    ) {
        ProblemDetail detalhe = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        detalhe.setDetail(exception.getMessage());
        identificar(detalhe, "PASSWORD_POLICY_VIOLATION", request);
        return detalhe;
    }

    @ExceptionHandler(RateLimitException.class)
    public ProblemDetail limite(
            RateLimitException exception,
            HttpServletResponse response,
            HttpServletRequest request
    ) {
        response.setHeader(
                HttpHeaders.RETRY_AFTER,
                Long.toString(exception.getRetryAfterSeconds())
        );
        ProblemDetail detalhe = ProblemDetail.forStatus(
                HttpStatus.TOO_MANY_REQUESTS
        );
        detalhe.setDetail("Muitas tentativas. Tente novamente mais tarde.");
        identificar(detalhe, "RATE_LIMIT_EXCEEDED", request);
        return detalhe;
    }

    private void identificar(
            ProblemDetail detalhe,
            String code,
            HttpServletRequest request
    ) {
        detalhe.setProperty("code", code);
        detalhe.setProperty(
                "requestId",
                RequestCorrelationFilter.current(request)
        );
    }
}
