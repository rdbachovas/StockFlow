package br.com.stockflow.auth;

import br.com.stockflow.usuario.Usuario;
import br.com.stockflow.usuario.UsuarioRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class InicializadorSenhas implements ApplicationRunner {

    private final UsuarioRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final AuthProperties properties;
    private final AuthOperationalProperties operationalProperties;

    public InicializadorSenhas(
            UsuarioRepository repository,
            PasswordEncoder passwordEncoder,
            AuthProperties properties,
            AuthOperationalProperties operationalProperties
    ) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
        this.operationalProperties = operationalProperties;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        inicializar("RODRIGO", properties.initialPasswords().rodrigo(),
                "AUTH_INITIAL_PASSWORD_RODRIGO");
        inicializar("CESAR", properties.initialPasswords().cesar(),
                "AUTH_INITIAL_PASSWORD_CESAR");
    }

    private void inicializar(String id, String senha, String variavel) {
        Usuario usuario = repository.findById(id).orElseThrow();
        if (usuario.getSenhaHash() != null) {
            return;
        }
        if (senha == null || senha.isBlank()) {
            throw new IllegalStateException(
                    variavel + " é obrigatória enquanto o usuário não possui senha."
            );
        }
        usuario.definirSenhaTemporaria(
                passwordEncoder.encode(senha),
                OffsetDateTime.now(ZoneOffset.UTC),
                operationalProperties.initialPasswordTemporary()
        );
    }
}
