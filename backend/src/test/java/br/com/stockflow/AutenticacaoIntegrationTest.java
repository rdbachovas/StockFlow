package br.com.stockflow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.stockflow.auth.TokenService;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class AutenticacaoIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRESQL =
            new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void banco(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRESQL::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRESQL::getUsername);
        registry.add("spring.datasource.password", POSTGRESQL::getPassword);
    }

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired JwtEncoder jwtEncoder;
    @Autowired TokenService tokenService;

    @BeforeEach
    void preparar() {
        jdbcTemplate.update("DELETE FROM sessoes_refresh");
        jdbcTemplate.update("DELETE FROM comandos_processados");
        jdbcTemplate.update("DELETE FROM reserva_eventos");
        jdbcTemplate.update("DELETE FROM reservas");
        jdbcTemplate.update("DELETE FROM retirada_itens");
        jdbcTemplate.update("DELETE FROM retiradas");
        jdbcTemplate.update("DELETE FROM movimento_estoque_principal_itens");
        jdbcTemplate.update("DELETE FROM movimentos_estoque_principal");
        jdbcTemplate.update("DELETE FROM estoque_itens WHERE estoque_id <> 'ESTOQUE_PRINCIPAL'");
        jdbcTemplate.update("UPDATE estoque_itens SET quantidade = CASE produto_id WHEN 'MIX' THEN 300 ELSE quantidade END WHERE estoque_id = 'ESTOQUE_PRINCIPAL'");
        jdbcTemplate.update("UPDATE usuarios SET ativo = TRUE");
    }

    @Test
    void loginRodrigo() throws Exception {
        login("rodrigo", "senha-teste-rodrigo")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.refreshToken").isString())
                .andExpect(jsonPath("$.expiresIn").value(900))
                .andExpect(jsonPath("$.usuario.id").value("RODRIGO"));
    }

    @Test
    void loginCesarAceitaNormalizacao() throws Exception {
        login("  CESAR  ", "senha-teste-cesar")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario.id").value("CESAR"));
    }

    @Test
    void senhaInvalidaEUsuarioInexistenteRetornamRespostaGenerica() throws Exception {
        String senhaInvalida = login("rodrigo", "incorreta")
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        String inexistente = login("ninguem", "incorreta")
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        assertThat(inexistente).isEqualTo(senhaInvalida);
    }

    @Test
    void usuarioInativoNaoAutentica() throws Exception {
        jdbcTemplate.update("UPDATE usuarios SET ativo = FALSE WHERE id = 'RODRIGO'");
        login("rodrigo", "senha-teste-rodrigo")
                .andExpect(status().isUnauthorized());
    }

    @Test
    void endpointProtegidoRejeitaAusenciaExpiracaoEAdulteracao() throws Exception {
        mockMvc.perform(get("/api/v1/snapshot"))
                .andExpect(status().isUnauthorized());

        String expirado = tokenExpirado("RODRIGO");
        mockMvc.perform(get("/api/v1/snapshot").header(
                "Authorization", "Bearer " + expirado
        )).andExpect(status().isUnauthorized());

        String valido = tokens("rodrigo", "senha-teste-rodrigo").accessToken();
        String adulterado = valido.substring(0, valido.length() - 1)
                + (valido.endsWith("a") ? "b" : "a");
        mockMvc.perform(get("/api/v1/snapshot").header(
                "Authorization", "Bearer " + adulterado
        )).andExpect(status().isUnauthorized());
    }

    @Test
    void jwtValidoEAuthMeIdentificamUsuario() throws Exception {
        Tokens tokens = tokens("cesar", "senha-teste-cesar");
        mockMvc.perform(get("/api/v1/snapshot").header(
                "Authorization", "Bearer " + tokens.accessToken()
        )).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/auth/me").header(
                "Authorization", "Bearer " + tokens.accessToken()
        )).andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("CESAR"))
                .andExpect(jsonPath("$.nome").value("Cesar"));
    }

    @Test
    void refreshValidoRotacionaEImpedeReutilizacao() throws Exception {
        Tokens inicial = tokens("rodrigo", "senha-teste-rodrigo");
        MvcResult resultado = refresh(inicial.refreshToken())
                .andExpect(status().isOk()).andReturn();
        Tokens rotacionado = lerTokens(resultado);
        assertThat(rotacionado.refreshToken()).isNotEqualTo(inicial.refreshToken());
        refresh(inicial.refreshToken()).andExpect(status().isUnauthorized());
        refresh(rotacionado.refreshToken()).andExpect(status().isOk());
    }

    @Test
    void refreshExpiradoERevogadoSaoRejeitados() throws Exception {
        Tokens expirado = tokens("rodrigo", "senha-teste-rodrigo");
        jdbcTemplate.update(
                "UPDATE sessoes_refresh SET expira_em = CURRENT_TIMESTAMP - INTERVAL '1 second' WHERE token_hash = ?",
                tokenService.hash(expirado.refreshToken())
        );
        refresh(expirado.refreshToken()).andExpect(status().isUnauthorized());

        Tokens revogado = tokens("cesar", "senha-teste-cesar");
        jdbcTemplate.update(
                "UPDATE sessoes_refresh SET revogado_em = CURRENT_TIMESTAMP WHERE token_hash = ?",
                tokenService.hash(revogado.refreshToken())
        );
        refresh(revogado.refreshToken()).andExpect(status().isUnauthorized());
    }

    @Test
    void logoutRevogaRefreshToken() throws Exception {
        Tokens tokens = tokens("rodrigo", "senha-teste-rodrigo");
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + tokens.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(refreshJson(tokens.refreshToken())))
                .andExpect(status().isNoContent());
        refresh(tokens.refreshToken()).andExpect(status().isUnauthorized());
    }

    @Test
    void usuariosNaoPodemAgirComoOutroResponsavel() throws Exception {
        Tokens rodrigo = tokens("rodrigo", "senha-teste-rodrigo");
        Tokens cesar = tokens("cesar", "senha-teste-cesar");
        retirada(rodrigo.accessToken(), "CESAR", UUID.randomUUID())
                .andExpect(status().isForbidden());
        retirada(cesar.accessToken(), "RODRIGO", UUID.randomUUID())
                .andExpect(status().isForbidden());
    }

    @Test
    void preservaDestinosPermitidos() throws Exception {
        Tokens rodrigo = tokens("rodrigo", "senha-teste-rodrigo");
        Tokens cesar = tokens("cesar", "senha-teste-cesar");
        retirada(rodrigo.accessToken(), "RODRIGO", UUID.randomUUID())
                .andExpect(status().isCreated());
        retirada(cesar.accessToken(), "CESAR", UUID.randomUUID())
                .andExpect(status().isCreated());

        reserva(rodrigo.accessToken(), "RODRIGO", "BOULEVARD")
                .andExpect(status().isCreated());
        reserva(cesar.accessToken(), "CESAR", "AEROPORTO")
                .andExpect(status().isCreated());
        reserva(rodrigo.accessToken(), "RODRIGO", "MERCADOS")
                .andExpect(status().isCreated());
        reserva(cesar.accessToken(), "CESAR", "MERCADOS")
                .andExpect(status().isCreated());
    }

    @Test
    void ambosOperamEstoquePrincipalEAtorFicaRegistrado() throws Exception {
        Tokens rodrigo = tokens("rodrigo", "senha-teste-rodrigo");
        Tokens cesar = tokens("cesar", "senha-teste-cesar");
        movimento(rodrigo.accessToken(), UUID.randomUUID())
                .andExpect(status().isCreated());
        movimento(cesar.accessToken(), UUID.randomUUID())
                .andExpect(status().isCreated());
        assertThat(jdbcTemplate.queryForList(
                "SELECT usuario_id FROM movimentos_estoque_principal ORDER BY data",
                String.class
        )).containsExactly("RODRIGO", "CESAR");
    }

    @Test
    void idempotenciaConsideraUsuarioAutenticado() throws Exception {
        Tokens rodrigo = tokens("rodrigo", "senha-teste-rodrigo");
        Tokens cesar = tokens("cesar", "senha-teste-cesar");
        UUID commandId = UUID.randomUUID();
        String primeira = movimento(rodrigo.accessToken(), commandId)
                .andExpect(status().isCreated()).andReturn()
                .getResponse().getContentAsString();
        String repetida = movimento(rodrigo.accessToken(), commandId)
                .andExpect(status().isCreated()).andReturn()
                .getResponse().getContentAsString();
        assertThat(repetida).isEqualTo(primeira);
        movimento(cesar.accessToken(), commandId)
                .andExpect(status().isForbidden());
        assertThat(jdbcTemplate.queryForObject(
                "SELECT usuario_id FROM comandos_processados WHERE command_id = ?",
                String.class, commandId
        )).isEqualTo("RODRIGO");
    }

    private org.springframework.test.web.servlet.ResultActions login(
            String login, String senha
    ) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"login":"%s","senha":"%s"}
                        """.formatted(login, senha)));
    }

    private Tokens tokens(String login, String senha) throws Exception {
        return lerTokens(login(login, senha).andExpect(status().isOk()).andReturn());
    }

    private Tokens lerTokens(MvcResult resultado) throws Exception {
        JsonNode json = objectMapper.readTree(
                resultado.getResponse().getContentAsString()
        );
        return new Tokens(
                json.get("accessToken").asText(), json.get("refreshToken").asText()
        );
    }

    private org.springframework.test.web.servlet.ResultActions refresh(String token)
            throws Exception {
        return mockMvc.perform(post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshJson(token)));
    }

    private String refreshJson(String token) {
        return "{\"refreshToken\":\"%s\"}".formatted(token);
    }

    private String tokenExpirado(String usuarioId) {
        Instant agora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(usuarioId)
                .issuedAt(agora.minusSeconds(120))
                .expiresAt(agora.minusSeconds(60))
                .id(UUID.randomUUID().toString())
                .build();
        return jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims
        )).getTokenValue();
    }

    private org.springframework.test.web.servlet.ResultActions retirada(
            String token, String responsavel, UUID commandId
    ) throws Exception {
        return mockMvc.perform(post("/api/v1/retiradas")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"commandId":"%s","responsavelId":"%s","itens":[
                        {"produtoId":"MIX","quantidade":10}],
                        "data":"2026-08-22T10:00:00Z"}
                        """.formatted(commandId, responsavel)));
    }

    private org.springframework.test.web.servlet.ResultActions reserva(
            String token, String responsavel, String destino
    ) throws Exception {
        return mockMvc.perform(post("/api/v1/reservas")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"commandId":"%s","responsavelId":"%s",
                        "destino":"%s","produtoId":"MIX","quantidade":1}
                        """.formatted(UUID.randomUUID(), responsavel, destino)));
    }

    private org.springframework.test.web.servlet.ResultActions movimento(
            String token, UUID commandId
    ) throws Exception {
        return mockMvc.perform(post("/api/v1/movimentos-estoque-principal")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"commandId":"%s","tipo":"ENTRADA","itens":[
                        {"produtoId":"MIX","quantidade":1}],
                        "data":"2026-08-22T11:00:00Z"}
                        """.formatted(commandId)));
    }

    private record Tokens(String accessToken, String refreshToken) {
    }
}
