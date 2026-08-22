package br.com.stockflow.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.login(), request.senha());
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(
            @Valid @RequestBody RefreshRequest request,
            Authentication authentication
    ) {
        authService.logout(request.refreshToken(), authentication.getName());
    }

    @GetMapping("/me")
    public UsuarioResponse me(Authentication authentication) {
        return UsuarioResponse.de(authService.obterUsuario(authentication.getName()));
    }

    public record LoginRequest(@NotBlank String login, @NotBlank String senha) {
    }

    public record RefreshRequest(@NotBlank String refreshToken) {
    }
}
