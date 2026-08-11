package br.com.stockflow.retirada;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class RegraRetiradaException extends RuntimeException {

    public RegraRetiradaException(String mensagem) {
        super(mensagem);
    }
}
