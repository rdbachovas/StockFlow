package br.com.stockflow.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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
        return detalhe;
    }

    @ExceptionHandler(CurrentPasswordInvalidException.class)
    public ProblemDetail senhaAtualInvalida() {
        ProblemDetail detalhe = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        detalhe.setDetail("Senha atual inválida.");
        return detalhe;
    }

    @ExceptionHandler(PasswordPolicyException.class)
    public ProblemDetail politicaSenha(PasswordPolicyException exception) {
        ProblemDetail detalhe = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        detalhe.setDetail(exception.getMessage());
        return detalhe;
    }

    @ExceptionHandler(RateLimitException.class)
    public ProblemDetail limite(
            RateLimitException exception,
            HttpServletResponse response
    ) {
        response.setHeader(
                HttpHeaders.RETRY_AFTER,
                Long.toString(exception.getRetryAfterSeconds())
        );
        ProblemDetail detalhe = ProblemDetail.forStatus(
                HttpStatus.TOO_MANY_REQUESTS
        );
        detalhe.setDetail("Muitas tentativas. Tente novamente mais tarde.");
        return detalhe;
    }
}
