package br.com.stockflow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.stockflow.estoque.EstoqueRepository;
import br.com.stockflow.produto.ProdutoRepository;
import br.com.stockflow.usuario.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
@org.springframework.security.test.context.support.WithMockUser(username = "RODRIGO")
class DatabaseIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRESQL =
            new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void configurarPostgreSql(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRESQL::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRESQL::getUsername);
        registry.add("spring.datasource.password", POSTGRESQL::getPassword);
    }

    @Autowired
    UsuarioRepository usuarioRepository;

    @Autowired
    ProdutoRepository produtoRepository;

    @Autowired
    EstoqueRepository estoqueRepository;

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Autowired
    MockMvc mockMvc;

    @Test
    void migrationsCriamEstruturaESeed() {
        assertThat(usuarioRepository.count()).isEqualTo(2);
        assertThat(produtoRepository.count()).isEqualTo(12);
        assertThat(estoqueRepository.count()).isEqualTo(3);

        Integer itensDoPrincipal = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM estoque_itens WHERE estoque_id = 'ESTOQUE_PRINCIPAL'",
                Integer.class
        );
        Integer migrations = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE success = TRUE",
                Integer.class
        );

        assertThat(itensDoPrincipal).isEqualTo(12);
        assertThat(migrations).isEqualTo(14);
    }

    @Test
    void bancoImpedeQuantidadeNegativa() {
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                INSERT INTO estoque_itens (estoque_id, produto_id, quantidade)
                VALUES ('ESTOQUE_RODRIGO', 'MIX', -1)
                """
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void bancoImpedeProdutoDuplicadoNoMesmoEstoque() {
        assertThatThrownBy(() -> jdbcTemplate.update(
                """
                INSERT INTO estoque_itens (estoque_id, produto_id, quantidade)
                VALUES ('ESTOQUE_PRINCIPAL', 'MIX', 1)
                """
        )).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void healthRetornaUp() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
        mockMvc.perform(get("/api/v1/health/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void healthNaoExpoeSegredos() throws Exception {
        String resposta = mockMvc.perform(get("/api/v1/health/readiness"))
                .andReturn().getResponse().getContentAsString();

        assertThat(resposta)
                .doesNotContain(POSTGRESQL.getJdbcUrl())
                .doesNotContain(POSTGRESQL.getUsername())
                .doesNotContain(POSTGRESQL.getPassword())
                .doesNotContain("segredo-exclusivo-para-testes");
    }

    @Test
    void corsAceitaOriginAutorizada() throws Exception {
        mockMvc.perform(get("/api/v1/estoques")
                        .header("Origin", "https://web.stockflow.test")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("RODRIGO")))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        "Access-Control-Allow-Origin",
                        "https://web.stockflow.test"
                ))
                .andExpect(header().string(
                        "Access-Control-Allow-Credentials", "true"
                ));
    }

    @Test
    void corsRejeitaOriginNaoAutorizada() throws Exception {
        mockMvc.perform(get("/api/v1/estoques")
                        .header("Origin", "https://hostil.test"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(
                        "Access-Control-Allow-Origin"
                ));
    }

    @Test
    void preflightAutorizadoFunciona() throws Exception {
        mockMvc.perform(options("/api/v1/retiradas")
                        .header("Origin", "https://web.stockflow.test")
                        .header("Access-Control-Request-Method", "POST")
                        .header(
                                "Access-Control-Request-Headers",
                                "Authorization, Content-Type"
                        ))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        "Access-Control-Allow-Origin",
                        "https://web.stockflow.test"
                ))
                .andExpect(header().string(
                        "Access-Control-Allow-Methods",
                        org.hamcrest.Matchers.containsString("POST")
                ));
    }

    @Test
    void preflightWebAuthPermiteCookieEAuthorization() throws Exception {
        mockMvc.perform(options("/api/v1/auth/web/logout")
                        .header("Origin", "https://web.stockflow.test")
                        .header("Access-Control-Request-Method", "POST")
                        .header(
                                "Access-Control-Request-Headers",
                                "Authorization, Content-Type"
                        ))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        "Access-Control-Allow-Origin",
                        "https://web.stockflow.test"
                ))
                .andExpect(header().string(
                        "Access-Control-Allow-Credentials", "true"
                ))
                .andExpect(header().string(
                        "Access-Control-Allow-Headers",
                        org.hamcrest.Matchers.allOf(
                                org.hamcrest.Matchers.containsString("Authorization"),
                                org.hamcrest.Matchers.containsString("Content-Type")
                        )
                ));
    }

    @Test
    void estoquesRetornamSeedComItensDoPrincipal() throws Exception {
        mockMvc.perform(get("/api/v1/estoques")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("RODRIGO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].id").value("ESTOQUE_CESAR"))
                .andExpect(jsonPath("$[1].id").value("ESTOQUE_PRINCIPAL"))
                .andExpect(jsonPath("$[1].itens.length()").value(12))
                .andExpect(jsonPath("$[2].id").value("ESTOQUE_RODRIGO"));
    }
}
