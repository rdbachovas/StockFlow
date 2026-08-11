package br.com.stockflow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
        assertThat(migrations).isEqualTo(4);
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
    }

    @Test
    void estoquesRetornamSeedComItensDoPrincipal() throws Exception {
        mockMvc.perform(get("/api/v1/estoques"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].id").value("ESTOQUE_CESAR"))
                .andExpect(jsonPath("$[1].id").value("ESTOQUE_PRINCIPAL"))
                .andExpect(jsonPath("$[1].itens.length()").value(12))
                .andExpect(jsonPath("$[2].id").value("ESTOQUE_RODRIGO"));
    }
}
