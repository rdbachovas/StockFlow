package br.com.stockflow.auth;

public class CurrentPasswordInvalidException extends RuntimeException {
    public CurrentPasswordInvalidException() {
        super("Senha atual inválida.");
    }
}
