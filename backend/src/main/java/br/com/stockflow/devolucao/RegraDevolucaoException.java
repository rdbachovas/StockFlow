package br.com.stockflow.devolucao;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class RegraDevolucaoException extends RuntimeException {

    public RegraDevolucaoException(String mensagem) {
        super(mensagem);
    }
}
