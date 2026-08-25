package br.com.stockflow.config;

import br.com.stockflow.abastecimento.RegraAbastecimentoException;
import br.com.stockflow.consumocarrinho.RegraConsumoCarrinhoException;
import br.com.stockflow.devolucao.RegraDevolucaoException;
import br.com.stockflow.movimentoprincipal.RegraMovimentoEstoquePrincipalException;
import br.com.stockflow.reserva.RegraReservaException;
import br.com.stockflow.retirada.RegraRetiradaException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;

@RestControllerAdvice
@Order(Ordered.LOWEST_PRECEDENCE)
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(
            GlobalExceptionHandler.class
    );

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail validation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        List<String> fields = exception.getBindingResult().getFieldErrors()
                .stream().map(error -> error.getField()).distinct().sorted().toList();
        return problem(
                HttpStatus.BAD_REQUEST,
                "VALIDATION_ERROR",
                fields.isEmpty()
                        ? "Requisição inválida."
                        : "Campos inválidos: " + String.join(", ", fields) + ".",
                request
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail unreadable(HttpServletRequest request) {
        return problem(
                HttpStatus.BAD_REQUEST,
                "INVALID_REQUEST_BODY",
                "Corpo da requisição inválido.",
                request
        );
    }

    @ExceptionHandler({
            RegraAbastecimentoException.class,
            RegraConsumoCarrinhoException.class,
            RegraDevolucaoException.class,
            RegraMovimentoEstoquePrincipalException.class,
            RegraReservaException.class,
            RegraRetiradaException.class
    })
    public ProblemDetail business(RuntimeException exception, HttpServletRequest request) {
        return problem(
                HttpStatus.BAD_REQUEST,
                "BUSINESS_RULE_VIOLATION",
                exception.getMessage(),
                request
        );
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ProblemDetail status(
            ResponseStatusException exception,
            HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.resolve(exception.getStatusCode().value());
        HttpStatus safeStatus = status == null ? HttpStatus.BAD_REQUEST : status;
        return problem(
                safeStatus,
                "REQUEST_REJECTED",
                safeStatus.getReasonPhrase(),
                request
        );
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ProblemDetail notFound(HttpServletRequest request) {
        return problem(
                HttpStatus.NOT_FOUND,
                "NOT_FOUND",
                "Recurso não encontrado.",
                request
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail accessDenied(HttpServletRequest request) {
        return problem(
                HttpStatus.FORBIDDEN,
                "ACCESS_DENIED",
                "Acesso negado.",
                request
        );
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail unexpected(Exception exception, HttpServletRequest request) {
        String requestId = RequestCorrelationFilter.current(request);
        LOGGER.error(
                "erro inesperado requestId={} método={} path={} tipo={}",
                requestId, request.getMethod(), request.getRequestURI(),
                exception.getClass().getSimpleName()
        );
        return problem(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                "Ocorreu um erro interno inesperado.",
                requestId
        );
    }

    private ProblemDetail problem(
            HttpStatus status,
            String code,
            String detail,
            HttpServletRequest request
    ) {
        return problem(
                status, code, detail, RequestCorrelationFilter.current(request)
        );
    }

    private ProblemDetail problem(
            HttpStatus status,
            String code,
            String detail,
            String requestId
    ) {
        ProblemDetail problem = ProblemDetail.forStatus(status);
        problem.setDetail(detail);
        problem.setProperty("code", code);
        problem.setProperty("requestId", requestId);
        return problem;
    }
}
