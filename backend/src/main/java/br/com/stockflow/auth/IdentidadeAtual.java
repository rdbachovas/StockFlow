package br.com.stockflow.auth;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class IdentidadeAtual {

    public String id() {
        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Autenticação obrigatória.");
        }
        return authentication.getName();
    }

    public void exigirIgual(String responsavelId) {
        if (!id().equals(responsavelId)) {
            throw new AccessDeniedException(
                    "O usuário autenticado não pode agir por outro responsável."
            );
        }
    }
}
