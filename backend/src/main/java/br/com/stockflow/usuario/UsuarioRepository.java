package br.com.stockflow.usuario;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, String> {
    Optional<Usuario> findByLogin(String login);
}
