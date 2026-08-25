package br.com.stockflow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.stockflow.auth.TokenService;
import java.time.Instant;
import java.util.UUID;
import jakarta.servlet.http.Cookie;
import org.springframework.http.HttpHeaders;
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
import org.springframework.security.crypto.password.PasswordEncoder;
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
    @Autowired PasswordEncoder passwordEncoder;

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
        jdbcTemplate.update(
                "UPDATE usuarios SET senha_hash = ?, troca_senha_obrigatoria = FALSE WHERE id = 'RODRIGO'",
                passwordEncoder.encode("senha-teste-rodrigo")
        );
        jdbcTemplate.update(
                "UPDATE usuarios SET senha_hash = ?, troca_senha_obrigatoria = FALSE WHERE id = 'CESAR'",
                passwordEncoder.encode("senha-teste-cesar")
        );
    }

    @Test
    void loginRodrigo() throws Exception {
        login("rodrigo", "senha-teste-rodrigo")
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(header().exists("X-Request-Id"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
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
        JsonNode senhaInvalida = objectMapper.readTree(login("rodrigo", "incorreta")
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString());
        JsonNode inexistente = objectMapper.readTree(login("ninguem", "incorreta")
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString());
        assertThat(inexistente.get("detail")).isEqualTo(senhaInvalida.get("detail"));
        assertThat(inexistente.get("code")).isEqualTo(senhaInvalida.get("code"));
        assertThat(inexistente.get("requestId").asText())
                .isNotEqualTo(senhaInvalida.get("requestId").asText());
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
        int inicioAssinatura = valido.lastIndexOf('.') + 1;
        int indiceAdulterado = inicioAssinatura + 5;
        char original = valido.charAt(indiceAdulterado);
        String adulterado = valido.substring(0, indiceAdulterado)
                + (original == 'a' ? "b" : "a")
                + valido.substring(indiceAdulterado + 1);
        mockMvc.perform(get("/api/v1/snapshot").header(
                "Authorization", "Bearer " + adulterado
        )).andExpect(status().isUnauthorized());
    }

    @Test
    void jwtValidoEAuthMeIdentificamUsuario() throws Exception {
        Tokens tokens = tokens("cesar", "senha-teste-cesar");
        mockMvc.perform(get("/api/v1/snapshot").header(
                "Authorization", "Bearer " + tokens.accessToken()
        )).andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andExpect(header().exists("X-Request-Id"));
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
    void loginWebUsaSomenteCookieHttpOnly() throws Exception {
        MvcResult resultado = loginWeb("rodrigo", "senha-teste-rodrigo")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isString())
                .andExpect(jsonPath("$.expiresIn").value(900))
                .andExpect(jsonPath("$.usuario.id").value("RODRIGO"))
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "no-store"))
                .andReturn();

        assertThat(cookieHeader(resultado))
                .contains("stockflow_refresh=")
                .contains("HttpOnly")
                .contains("SameSite=Lax")
                .contains("Path=/api/v1/auth/web")
                .doesNotContain("Secure");
    }

    @Test
    void refreshWebRotacionaCookieEImpedeReutilizacao() throws Exception {
        MvcResult login = loginWeb("rodrigo", "senha-teste-rodrigo")
                .andExpect(status().isOk()).andReturn();
        String antigo = cookieValor(login);

        MvcResult refresh = refreshWeb(antigo)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andReturn();
        String novo = cookieValor(refresh);

        assertThat(novo).isNotEqualTo(antigo);
        refreshWeb(antigo)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail")
                        .value("Credenciais ou sessão inválidas."))
                .andExpect(header().string(
                        HttpHeaders.SET_COOKIE,
                        org.hamcrest.Matchers.containsString("Max-Age=0")
                ));
        refreshWeb(novo).andExpect(status().isOk());
    }

    @Test
    void logoutWebRevogaSessaoEExpiraCookie() throws Exception {
        MvcResult login = loginWeb("cesar", "senha-teste-cesar")
                .andExpect(status().isOk()).andReturn();
        JsonNode corpo = objectMapper.readTree(
                login.getResponse().getContentAsString()
        );
        String accessToken = corpo.get("accessToken").asText();
        String refreshToken = cookieValor(login);

        mockMvc.perform(post("/api/v1/auth/web/logout")
                        .header("Origin", "https://web.stockflow.test")
                        .header("Authorization", "Bearer " + accessToken)
                        .cookie(new Cookie("stockflow_refresh", refreshToken)))
                .andExpect(status().isNoContent())
                .andExpect(header().string(
                        HttpHeaders.SET_COOKIE,
                        org.hamcrest.Matchers.allOf(
                                org.hamcrest.Matchers.containsString("Max-Age=0"),
                                org.hamcrest.Matchers.containsString("HttpOnly")
                        )
                ));

        refreshWeb(refreshToken).andExpect(status().isUnauthorized());
    }

    @Test
    void authWebExigeOriginAutorizadaECookie() throws Exception {
        mockMvc.perform(post("/api/v1/auth/web/login")
                        .header("Origin", "https://hostil.test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"rodrigo\",\"senha\":\"senha-teste-rodrigo\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/auth/web/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"rodrigo\",\"senha\":\"senha-teste-rodrigo\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/auth/web/refresh")
                        .header("Origin", "https://web.stockflow.test"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail")
                        .value("Credenciais ou sessão inválidas."));
    }

    @Test
    void endpointsNativeRejeitamOriginDoNavegador() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .header("Origin", "https://web.stockflow.test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"login\":\"rodrigo\",\"senha\":\"senha-teste-rodrigo\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void senhaTemporariaBloqueiaOperacoesAteTrocaSegura() throws Exception {
        jdbcTemplate.update("""
                UPDATE usuarios SET troca_senha_obrigatoria = TRUE
                WHERE id = 'RODRIGO'
                """);
        Tokens rodrigo = tokens("rodrigo", "senha-teste-rodrigo");

        mockMvc.perform(get("/api/v1/auth/me").header(
                "Authorization", "Bearer " + rodrigo.accessToken()
        )).andExpect(status().isOk())
                .andExpect(jsonPath("$.trocaSenhaObrigatoria").value(true));
        mockMvc.perform(get("/api/v1/snapshot").header(
                "Authorization", "Bearer " + rodrigo.accessToken()
        )).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail")
                        .value("Troca de senha obrigatória."));
        refresh(rodrigo.refreshToken()).andExpect(status().isOk());

        String hashAnterior = jdbcTemplate.queryForObject(
                "SELECT senha_hash FROM usuarios WHERE id = 'RODRIGO'",
                String.class
        );
        Tokens cesar = tokens("cesar", "senha-teste-cesar");
        alterarSenha(
                rodrigo.accessToken(),
                "senha-teste-rodrigo",
                "nova senha definitiva do Rodrigo"
        ).andExpect(status().isNoContent());

        assertThat(jdbcTemplate.queryForObject(
                "SELECT senha_hash FROM usuarios WHERE id = 'RODRIGO'",
                String.class
        )).isNotEqualTo(hashAnterior);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT troca_senha_obrigatoria FROM usuarios WHERE id = 'RODRIGO'",
                Boolean.class
        )).isFalse();
        login("rodrigo", "senha-teste-rodrigo").andExpect(status().isUnauthorized());
        refresh(rodrigo.refreshToken()).andExpect(status().isUnauthorized());
        refresh(cesar.refreshToken()).andExpect(status().isOk());

        Tokens novo = tokens("rodrigo", "nova senha definitiva do Rodrigo");
        mockMvc.perform(get("/api/v1/snapshot").header(
                "Authorization", "Bearer " + novo.accessToken()
        )).andExpect(status().isOk());
    }

    @Test
    void trocaSenhaValidaSenhaAtualPoliticaEDiferenca() throws Exception {
        Tokens tokens = tokens("cesar", "senha-teste-cesar");
        alterarSenha(tokens.accessToken(), "incorreta", "nova senha longa 123")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Senha atual inválida."));
        alterarSenha(tokens.accessToken(), "senha-teste-cesar", "curta")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", org.hamcrest.Matchers.containsString(
                        "entre 12 e 128"
                )));
        alterarSenha(
                tokens.accessToken(),
                "senha-teste-cesar",
                "senha-teste-cesar"
        ).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", org.hamcrest.Matchers.containsString(
                        "diferente"
                )));
    }

    @Test
    void loginRetorna429ComRetryAfterSemAfetarOutroIp() throws Exception {
        Tokens autorizado = tokens("cesar", "senha-teste-cesar");
        for (int tentativa = 0; tentativa < 5; tentativa++) {
            loginDeIp("nao-existe", "incorreta", "198.51.100.10")
                    .andExpect(status().isUnauthorized());
        }
        loginDeIp("nao-existe", "incorreta", "198.51.100.10")
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists(HttpHeaders.RETRY_AFTER))
                .andExpect(jsonPath("$.detail").value(
                        "Muitas tentativas. Tente novamente mais tarde."
                ));
        loginDeIp("rodrigo", "senha-teste-rodrigo", "198.51.100.11")
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/snapshot")
                        .with(request -> { request.setRemoteAddr("198.51.100.10"); return request; })
                        .header("Authorization", "Bearer " + autorizado.accessToken()))
                .andExpect(status().isOk());
    }

    @Test
    void refreshPossuiLimiteHttpIndependente() throws Exception {
        for (int tentativa = 0; tentativa < 30; tentativa++) {
            refreshDeIp("invalido", "203.0.113.20")
                    .andExpect(status().isUnauthorized());
        }
        refreshDeIp("invalido", "203.0.113.20")
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists(HttpHeaders.RETRY_AFTER));
    }

    @Test
    void retiradaDerivaResponsavelDoJwtSemCampoNoRequest() throws Exception {
        Tokens rodrigo = tokens("rodrigo", "senha-teste-rodrigo");
        Tokens cesar = tokens("cesar", "senha-teste-cesar");
        retirada(rodrigo.accessToken(), UUID.randomUUID())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.responsavelId").value("RODRIGO"))
                .andExpect(jsonPath("$.estoqueDestinoId").value("ESTOQUE_RODRIGO"));
        retirada(cesar.accessToken(), UUID.randomUUID())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.responsavelId").value("CESAR"))
                .andExpect(jsonPath("$.estoqueDestinoId").value("ESTOQUE_CESAR"));
    }

    @Test
    void preservaDestinosPermitidos() throws Exception {
        Tokens rodrigo = tokens("rodrigo", "senha-teste-rodrigo");
        Tokens cesar = tokens("cesar", "senha-teste-cesar");
        retirada(rodrigo.accessToken(), UUID.randomUUID())
                .andExpect(status().isCreated());
        retirada(cesar.accessToken(), UUID.randomUUID())
                .andExpect(status().isCreated());

        reserva(rodrigo.accessToken(), "BOULEVARD")
                .andExpect(status().isCreated());
        reserva(cesar.accessToken(), "AEROPORTO")
                .andExpect(status().isCreated());
        reserva(rodrigo.accessToken(), "MERCADOS")
                .andExpect(status().isCreated());
        reserva(cesar.accessToken(), "MERCADOS")
                .andExpect(status().isCreated());
        reserva(rodrigo.accessToken(), "AEROPORTO")
                .andExpect(status().isBadRequest());
        reserva(cesar.accessToken(), "BOULEVARD")
                .andExpect(status().isBadRequest());

        abastecimento(rodrigo.accessToken(), "AEROPORTO", "B06")
                .andExpect(status().isBadRequest());
        abastecimento(cesar.accessToken(), "BOULEVARD", "M1")
                .andExpect(status().isBadRequest());
        abastecimento(rodrigo.accessToken(), "GAUCHO_VICENTE_FONTOURA", "LOJA_1")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.responsavelId").value("RODRIGO"));
        abastecimento(cesar.accessToken(), "GAUCHO_VICENTE_FONTOURA", "LOJA_1")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.responsavelId").value("CESAR"));
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

    private org.springframework.test.web.servlet.ResultActions loginWeb(
            String login, String senha
    ) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/web/login")
                .header("Origin", "https://web.stockflow.test")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"login":"%s","senha":"%s"}
                        """.formatted(login, senha)));
    }

    private org.springframework.test.web.servlet.ResultActions loginDeIp(
            String login,
            String senha,
            String ip
    ) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login")
                .with(request -> { request.setRemoteAddr(ip); return request; })
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"login":"%s","senha":"%s"}
                        """.formatted(login, senha)));
    }

    private org.springframework.test.web.servlet.ResultActions alterarSenha(
            String accessToken,
            String senhaAtual,
            String novaSenha
    ) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/change-password")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"senhaAtual":"%s","novaSenha":"%s"}
                        """.formatted(senhaAtual, novaSenha)));
    }

    private org.springframework.test.web.servlet.ResultActions refreshWeb(
            String token
    ) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/web/refresh")
                .header("Origin", "https://web.stockflow.test")
                .cookie(new Cookie("stockflow_refresh", token)));
    }

    private String cookieHeader(MvcResult resultado) {
        return resultado.getResponse().getHeader(HttpHeaders.SET_COOKIE);
    }

    private String cookieValor(MvcResult resultado) {
        String primeiroCampo = cookieHeader(resultado).split(";", 2)[0];
        return primeiroCampo.substring(primeiroCampo.indexOf('=') + 1);
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

    private org.springframework.test.web.servlet.ResultActions refreshDeIp(
            String token,
            String ip
    ) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/refresh")
                .with(request -> { request.setRemoteAddr(ip); return request; })
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
            String token, UUID commandId
    ) throws Exception {
        return mockMvc.perform(post("/api/v1/retiradas")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"commandId":"%s","itens":[
                        {"produtoId":"MIX","quantidade":10}],
                        "data":"2026-08-22T10:00:00Z"}
                        """.formatted(commandId)));
    }

    private org.springframework.test.web.servlet.ResultActions reserva(
            String token, String destino
    ) throws Exception {
        return mockMvc.perform(post("/api/v1/reservas")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"commandId":"%s",
                        "destino":"%s","produtoId":"MIX","quantidade":1}
                        """.formatted(UUID.randomUUID(), destino)));
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

    private org.springframework.test.web.servlet.ResultActions abastecimento(
            String token,
            String local,
            String maquinaId
    ) throws Exception {
        return mockMvc.perform(post("/api/v1/abastecimentos")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"commandId":"%s","local":"%s","itens":[
                        {"maquinaId":"%s","produtoId":"MIX","quantidade":1}],
                        "data":"2026-08-22T12:00:00Z"}
                        """.formatted(UUID.randomUUID(), local, maquinaId)));
    }

    private record Tokens(String accessToken, String refreshToken) {
    }
}
