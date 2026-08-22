package br.com.stockflow.idempotencia;

import br.com.stockflow.auth.IdentidadeAtual;
import br.com.stockflow.usuario.Usuario;
import br.com.stockflow.usuario.UsuarioRepository;
import java.util.UUID;
import java.util.function.Supplier;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementCreator;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IdempotenciaService {

    private final ComandoProcessadoRepository repository;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final IdentidadeAtual identidadeAtual;
    private final UsuarioRepository usuarioRepository;

    public IdempotenciaService(
            ComandoProcessadoRepository repository,
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper,
            IdentidadeAtual identidadeAtual,
            UsuarioRepository usuarioRepository
    ) {
        this.repository = repository;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.identidadeAtual = identidadeAtual;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public <T> T executar(
            UUID commandId,
            String tipoOperacao,
            Class<T> tipoResposta,
            Supplier<T> operacao,
            java.util.function.ToLongFunction<T> obterRevisao
    ) {
        Usuario usuario = usuarioRepository.findById(identidadeAtual.id())
                .orElseThrow(() -> new IllegalStateException(
                        "Usuário autenticado não encontrado."
                ));
        bloquear(commandId);

        return repository.findById(commandId)
                .map(comando -> restaurar(
                        comando, usuario, tipoOperacao, tipoResposta
                ))
                .orElseGet(() -> processar(
                        commandId, usuario,
                        tipoOperacao,
                        operacao,
                        obterRevisao
                ));
    }

    private void bloquear(UUID commandId) {
        jdbcTemplate.execute(
                (PreparedStatementCreator) conexao -> {
                    var comando = conexao.prepareStatement(
                            "SELECT pg_advisory_xact_lock(hashtextextended(?::text, 0))"
                    );
                    comando.setString(1, commandId.toString());
                    return comando;
                },
                comando -> {
                    comando.execute();
                    return null;
                }
        );
    }

    private <T> T processar(
            UUID commandId,
            Usuario usuario,
            String tipoOperacao,
            Supplier<T> operacao,
            java.util.function.ToLongFunction<T> obterRevisao
    ) {
        T resposta = operacao.get();
        String json = serializar(resposta);
        repository.save(new ComandoProcessado(
                commandId,
                usuario,
                tipoOperacao,
                obterRevisao.applyAsLong(resposta),
                json
        ));
        return resposta;
    }

    private <T> T restaurar(
            ComandoProcessado comando,
            Usuario usuario,
            String tipoOperacao,
            Class<T> tipoResposta
    ) {
        if (comando.getUsuario() == null
                || !comando.getUsuario().getId().equals(usuario.getId())) {
            throw new AccessDeniedException(
                    "commandId já utilizado por outro usuário."
            );
        }
        if (!comando.getTipoOperacao().equals(tipoOperacao)) {
            throw new IllegalArgumentException(
                    "commandId já utilizado por outra operação."
            );
        }

        try {
            return objectMapper.readValue(comando.getRespostaJson(), tipoResposta);
        } catch (JacksonException erro) {
            throw new IllegalStateException(
                    "Resposta idempotente armazenada é inválida.",
                    erro
            );
        }
    }

    private String serializar(Object resposta) {
        try {
            return objectMapper.writeValueAsString(resposta);
        } catch (JacksonException erro) {
            throw new IllegalStateException(
                    "Não foi possível persistir a resposta idempotente.",
                    erro
            );
        }
    }
}
