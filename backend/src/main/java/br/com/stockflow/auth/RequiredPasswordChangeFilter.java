package br.com.stockflow.auth;

import br.com.stockflow.usuario.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class RequiredPasswordChangeFilter extends OncePerRequestFilter {

    private final UsuarioRepository usuarioRepository;

    public RequiredPasswordChangeFilter(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !request.getRequestURI().startsWith("/api/v1/auth/")
                && !request.getRequestURI().startsWith("/api/v1/health")
                && usuarioRepository.findById(authentication.getName())
                        .map(usuario -> usuario.isTrocaSenhaObrigatoria())
                        .orElse(false)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.getWriter().write(
                    "{\"status\":403,\"detail\":\"Troca de senha obrigatória.\"}"
            );
            return;
        }
        filterChain.doFilter(request, response);
    }
}
