package br.com.stockflow.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.stockflow.usuario.Usuario;
import br.com.stockflow.usuario.UsuarioRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

class InicializadorSenhasTest {

    @Test
    void bootstrapMarcaSenhasIniciaisComoTemporarias() {
        UsuarioRepository repository = mock(UsuarioRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        Usuario rodrigo = mock(Usuario.class);
        Usuario cesar = mock(Usuario.class);
        when(repository.findById("RODRIGO")).thenReturn(Optional.of(rodrigo));
        when(repository.findById("CESAR")).thenReturn(Optional.of(cesar));
        when(encoder.encode(anyString())).thenReturn("hash");

        new InicializadorSenhas(
                repository,
                encoder,
                new AuthProperties(
                        "segredo", 900, 2592000,
                        new AuthProperties.InitialPasswords("senha-r", "senha-c")
                ),
                new AuthOperationalProperties(
                        12, 128, true, 30,
                        new AuthOperationalProperties.RateLimit(5, 300),
                        new AuthOperationalProperties.RateLimit(30, 60)
                )
        ).run(mock(ApplicationArguments.class));

        verify(rodrigo).definirSenhaTemporaria(anyString(), any(),
                org.mockito.ArgumentMatchers.eq(true));
        verify(cesar).definirSenhaTemporaria(anyString(), any(),
                org.mockito.ArgumentMatchers.eq(true));
    }
}
