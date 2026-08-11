package br.com.stockflow.movimentoprincipal;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class RegraMovimentoEstoquePrincipalException extends RuntimeException {

    public RegraMovimentoEstoquePrincipalException(String mensagem) {
        super(mensagem);
    }
}
