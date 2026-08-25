package br.com.stockflow.auth;

import br.com.stockflow.usuario.Usuario;
import br.com.stockflow.usuario.UsuarioRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Locale;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String CREDENCIAIS_INVALIDAS = "Credenciais inválidas.";

    private final UsuarioRepository usuarioRepository;
    private final SessaoRefreshRepository sessaoRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final AuthProperties properties;
    private final AuthOperationalProperties operationalProperties;

    public AuthService(
            UsuarioRepository usuarioRepository,
            SessaoRefreshRepository sessaoRepository,
            PasswordEncoder passwordEncoder,
            TokenService tokenService,
            AuthProperties properties,
            AuthOperationalProperties operationalProperties
    ) {
        this.usuarioRepository = usuarioRepository;
        this.sessaoRepository = sessaoRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.properties = properties;
        this.operationalProperties = operationalProperties;
    }

    @Transactional
    public AuthResponse login(String login, String senha) {
        String normalizado = login == null ? "" : login.trim().toLowerCase(Locale.ROOT);
        Usuario usuario = usuarioRepository.findByLogin(normalizado).orElse(null);
        if (usuario == null || !usuario.isAtivo() || usuario.getSenhaHash() == null
                || !passwordEncoder.matches(senha == null ? "" : senha, usuario.getSenhaHash())) {
            throw new BadCredentialsException(CREDENCIAIS_INVALIDAS);
        }
        return criarSessao(usuario);
    }

    @Transactional
    public AuthResponse refresh(String refreshToken) {
        OffsetDateTime agora = OffsetDateTime.now(ZoneOffset.UTC);
        SessaoRefresh atual = sessaoRepository
                .findByTokenHash(tokenService.hash(refreshToken == null ? "" : refreshToken))
                .orElseThrow(() -> new BadCredentialsException("Sessão inválida ou expirada."));
        if (atual.getRevogadoEm() != null || !atual.getExpiraEm().isAfter(agora)
                || !atual.getUsuario().isAtivo()) {
            throw new BadCredentialsException("Sessão inválida ou expirada.");
        }

        TokenService.TokenOpaco novoToken = tokenService.criarRefreshToken();
        SessaoRefresh nova = new SessaoRefresh(
                atual.getUsuario(), novoToken.hash(), agora,
                tokenService.expiracaoRefresh()
        );
        sessaoRepository.save(nova);
        atual.revogar(agora, nova.getId());
        return resposta(atual.getUsuario(), novoToken.valor());
    }

    @Transactional
    public void logout(String refreshToken, String usuarioId) {
        sessaoRepository.findByTokenHash(
                tokenService.hash(refreshToken == null ? "" : refreshToken)
        ).ifPresent(sessao -> {
            if (sessao.getUsuario().getId().equals(usuarioId)
                    && sessao.getRevogadoEm() == null) {
                sessao.revogar(OffsetDateTime.now(ZoneOffset.UTC), null);
            }
        });
    }

    @Transactional(readOnly = true)
    public Usuario obterUsuario(String id) {
        return usuarioRepository.findById(id)
                .filter(Usuario::isAtivo)
                .orElseThrow(() -> new BadCredentialsException("Sessão inválida."));
    }

    @Transactional
    public void alterarSenha(
            String usuarioId,
            String senhaAtual,
            String novaSenha
    ) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .filter(Usuario::isAtivo)
                .orElseThrow(CurrentPasswordInvalidException::new);
        if (!passwordEncoder.matches(
                senhaAtual == null ? "" : senhaAtual,
                usuario.getSenhaHash()
        )) {
            throw new CurrentPasswordInvalidException();
        }
        validarNovaSenha(novaSenha);
        if (passwordEncoder.matches(novaSenha, usuario.getSenhaHash())) {
            throw new PasswordPolicyException(
                    "A nova senha deve ser diferente da senha atual."
            );
        }
        OffsetDateTime agora = OffsetDateTime.now(ZoneOffset.UTC);
        usuario.alterarSenha(passwordEncoder.encode(novaSenha), agora);
        sessaoRepository.revogarTodasDoUsuario(usuarioId, agora);
    }

    private void validarNovaSenha(String senha) {
        if (senha == null || senha.isBlank()
                || senha.length() < operationalProperties.passwordMinLength()
                || senha.length() > operationalProperties.passwordMaxLength()) {
            throw new PasswordPolicyException(
                    "A nova senha deve ter entre %d e %d caracteres."
                            .formatted(
                                    operationalProperties.passwordMinLength(),
                                    operationalProperties.passwordMaxLength()
                            )
            );
        }
    }

    private AuthResponse criarSessao(Usuario usuario) {
        OffsetDateTime agora = OffsetDateTime.now(ZoneOffset.UTC);
        TokenService.TokenOpaco refresh = tokenService.criarRefreshToken();
        sessaoRepository.save(new SessaoRefresh(
                usuario, refresh.hash(), agora, tokenService.expiracaoRefresh()
        ));
        return resposta(usuario, refresh.valor());
    }

    private AuthResponse resposta(Usuario usuario, String refreshToken) {
        return new AuthResponse(
                tokenService.criarAccessToken(usuario),
                properties.accessTokenSeconds(),
                refreshToken,
                UsuarioResponse.de(usuario)
        );
    }
}
