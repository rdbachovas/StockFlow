package br.com.stockflow.auth;

import br.com.stockflow.usuario.Usuario;

public record UsuarioResponse(String id, String nome) {
    public static UsuarioResponse de(Usuario usuario) {
        return new UsuarioResponse(usuario.getId(), usuario.getNome());
    }
}
