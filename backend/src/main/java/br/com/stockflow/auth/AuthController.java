package br.com.stockflow.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.Arrays;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    private final AuthCookieService cookieService;
    private final AuthTransportSecurity transportSecurity;
    private final AuthRateLimiter rateLimiter;

    public AuthController(
            AuthService authService,
            AuthCookieService cookieService,
            AuthTransportSecurity transportSecurity,
            AuthRateLimiter rateLimiter
    ) {
        this.authService = authService;
        this.cookieService = cookieService;
        this.transportSecurity = transportSecurity;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        transportSecurity.validarNative(httpRequest);
        return loginLimitado(request, httpRequest);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(
            @Valid @RequestBody RefreshRequest request,
            HttpServletRequest httpRequest
    ) {
        transportSecurity.validarNative(httpRequest);
        rateLimiter.consumirRefresh(httpRequest.getRemoteAddr());
        return authService.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(
            @Valid @RequestBody RefreshRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        transportSecurity.validarNative(httpRequest);
        authService.logout(request.refreshToken(), authentication.getName());
    }

    @PostMapping("/web/login")
    public ResponseEntity<WebAuthResponse> loginWeb(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        transportSecurity.validarWeb(httpRequest);
        return respostaWeb(loginLimitado(request, httpRequest));
    }

    @PostMapping("/web/refresh")
    public ResponseEntity<WebAuthResponse> refreshWeb(
            HttpServletRequest request
    ) {
        transportSecurity.validarWeb(request);
        rateLimiter.consumirRefresh(request.getRemoteAddr());
        return respostaWeb(authService.refresh(cookie(request)));
    }

    @PostMapping("/web/logout")
    public ResponseEntity<Void> logoutWeb(
            Authentication authentication,
            HttpServletRequest request
    ) {
        transportSecurity.validarWeb(request);
        String refreshToken = cookieOpcional(request);
        if (refreshToken != null) {
            authService.logout(refreshToken, authentication.getName());
        }
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookieService.expirar().toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponse> me(Authentication authentication) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(UsuarioResponse.de(
                        authService.obterUsuario(authentication.getName())
                ));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> alterarSenha(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        boolean web = httpRequest.getHeader("Origin") != null;
        if (web) {
            transportSecurity.validarWeb(httpRequest);
        }
        authService.alterarSenha(
                authentication.getName(), request.senhaAtual(), request.novaSenha()
        );
        ResponseEntity.HeadersBuilder<?> response = ResponseEntity.noContent()
                .header(HttpHeaders.CACHE_CONTROL, "no-store");
        if (web) {
            response.header(
                    HttpHeaders.SET_COOKIE,
                    cookieService.expirar().toString()
            );
        }
        return response.build();
    }

    private ResponseEntity<WebAuthResponse> respostaWeb(AuthResponse response) {
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        cookieService.criar(response.refreshToken()).toString()
                )
                .cacheControl(CacheControl.noStore())
                .body(WebAuthResponse.de(response));
    }

    private AuthResponse loginLimitado(
            LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        String ip = httpRequest.getRemoteAddr();
        rateLimiter.verificarLogin(ip, request.login());
        try {
            AuthResponse response = authService.login(
                    request.login(), request.senha()
            );
            rateLimiter.registrarSucessoLogin(ip, request.login());
            return response;
        } catch (org.springframework.security.authentication.BadCredentialsException erro) {
            rateLimiter.registrarFalhaLogin(ip, request.login());
            throw erro;
        }
    }

    private String cookie(HttpServletRequest request) {
        String valor = cookieOpcional(request);
        if (valor == null || valor.isBlank()) {
            throw new org.springframework.security.authentication.BadCredentialsException(
                    "Sessão inválida ou expirada."
            );
        }
        return valor;
    }

    private String cookieOpcional(HttpServletRequest request) {
        return request.getCookies() == null ? null : Arrays.stream(request.getCookies())
                .filter(cookie -> cookieService.nome().equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    public record LoginRequest(@NotBlank String login, @NotBlank String senha) {
    }

    public record RefreshRequest(@NotBlank String refreshToken) {
    }

    public record ChangePasswordRequest(
            @NotBlank String senhaAtual,
            @NotBlank String novaSenha
    ) {
    }
}
