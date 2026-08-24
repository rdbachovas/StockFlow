package br.com.stockflow.auth;

public record WebAuthResponse(
        String accessToken,
        long expiresIn,
        UsuarioResponse usuario
) {
    public static WebAuthResponse de(AuthResponse response) {
        return new WebAuthResponse(
                response.accessToken(), response.expiresIn(), response.usuario()
        );
    }
}
