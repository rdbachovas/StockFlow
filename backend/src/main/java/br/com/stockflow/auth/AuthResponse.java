package br.com.stockflow.auth;

public record AuthResponse(
        String accessToken,
        long expiresIn,
        String refreshToken,
        UsuarioResponse usuario
) {
}
