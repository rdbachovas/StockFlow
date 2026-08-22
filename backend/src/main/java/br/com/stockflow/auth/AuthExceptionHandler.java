package br.com.stockflow.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class AuthExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail credenciaisInvalidas() {
        ProblemDetail detalhe = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        detalhe.setDetail("Credenciais ou sessão inválidas.");
        return detalhe;
    }
}
