package br.com.stockflow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
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
class ConsumoCarrinhoIntegrationTest {

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
    MockMvc mockMvc;

    @Autowired
    JdbcTemplate jdbcTemplate;

    @BeforeEach
    void prepararEstado() {
        jdbcTemplate.update("DELETE FROM consumo_carrinho_itens");
        jdbcTemplate.update("DELETE FROM consumos_carrinho");
        jdbcTemplate.update("DELETE FROM reserva_eventos");
        jdbcTemplate.update("DELETE FROM reservas");
        jdbcTemplate.update(
                "DELETE FROM estoque_itens WHERE estoque_id IN "
                        + "('ESTOQUE_RODRIGO', 'ESTOQUE_CESAR')"
        );
        jdbcTemplate.update("""
                INSERT INTO estoque_itens (estoque_id, produto_id, quantidade)
                VALUES
                    ('ESTOQUE_RODRIGO', 'MILHO', 50),
                    ('ESTOQUE_RODRIGO', 'CHOCOLATE', 40),
                    ('ESTOQUE_RODRIGO', 'EMBALAGEM_CARRINHO_MEDIA', 30),
                    ('ESTOQUE_RODRIGO', 'EMBALAGEM_CARRINHO_GRANDE', 20),
                    ('ESTOQUE_RODRIGO', 'OLEO', 10),
                    ('ESTOQUE_RODRIGO', 'MIX', 100),
                    ('ESTOQUE_CESAR', 'MILHO', 45),
                    ('ESTOQUE_CESAR', 'CHOCOLATE', 35),
                    ('ESTOQUE_CESAR', 'EMBALAGEM_CARRINHO_MEDIA', 25),
                    ('ESTOQUE_CESAR', 'EMBALAGEM_CARRINHO_GRANDE', 15),
                    ('ESTOQUE_CESAR', 'OLEO', 8),
                    ('ESTOQUE_CESAR', 'MIX', 90)
                """);
    }

    @Test
    void registraConsumoValidoRodrigo() throws Exception {
        consumir("RODRIGO", item("MILHO", 10))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.responsavelId").value("RODRIGO"))
                .andExpect(jsonPath("$.estoqueOrigemId")
                        .value("ESTOQUE_RODRIGO"));
        assertThat(saldo("ESTOQUE_RODRIGO", "MILHO")).isEqualTo(40);
    }

    @Test
    void registraConsumoValidoCesar() throws Exception {
        consumir("CESAR", item("MILHO", 5))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.responsavelId").value("CESAR"));
        assertThat(saldo("ESTOQUE_CESAR", "MILHO")).isEqualTo(40);
    }

    @Test
    void consomeMultiplosInsumos() throws Exception {
        String itens = "[%s,%s,%s]".formatted(
                item("MILHO", 5),
                item("CHOCOLATE", 4),
                item("OLEO", 2)
        );
        consumir("RODRIGO", itens)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itens.length()").value(3));
        assertThat(contagem("consumos_carrinho")).isEqualTo(1);
    }

    @Test
    void consomeMilho() throws Exception {
        consumir("RODRIGO", item("MILHO", 1))
                .andExpect(status().isCreated());
    }

    @Test
    void consomeChocolate() throws Exception {
        consumir("RODRIGO", item("CHOCOLATE", 1))
                .andExpect(status().isCreated());
    }

    @Test
    void consomeEmbalagemMedia() throws Exception {
        consumir("RODRIGO", item("EMBALAGEM_CARRINHO_MEDIA", 1))
                .andExpect(status().isCreated());
    }

    @Test
    void consomeEmbalagemGrande() throws Exception {
        consumir("RODRIGO", item("EMBALAGEM_CARRINHO_GRANDE", 1))
                .andExpect(status().isCreated());
    }

    @Test
    void consomeOleo() throws Exception {
        consumir("RODRIGO", item("OLEO", 1))
                .andExpect(status().isCreated());
    }

    @Test
    void rejeitaPelucia() throws Exception {
        consumir("RODRIGO", item("MIX", 5))
                .andExpect(status().isBadRequest());
        assertThat(saldo("ESTOQUE_RODRIGO", "MIX")).isEqualTo(100);
    }

    @Test
    void rejeitaQuantidadeZero() throws Exception {
        consumir("RODRIGO", item("MILHO", 0))
                .andExpect(status().isBadRequest());
        assertThat(saldo("ESTOQUE_RODRIGO", "MILHO")).isEqualTo(50);
    }

    @Test
    void rejeitaQuantidadeNegativa() throws Exception {
        consumir("RODRIGO", item("MILHO", -1))
                .andExpect(status().isBadRequest());
        assertThat(saldo("ESTOQUE_RODRIGO", "MILHO")).isEqualTo(50);
    }

    @Test
    void rejeitaProdutoDuplicado() throws Exception {
        String itens = "[%s,%s]".formatted(
                item("MILHO", 2),
                item("MILHO", 3)
        );
        consumir("RODRIGO", itens).andExpect(status().isBadRequest());
        assertThat(contagem("consumos_carrinho")).isZero();
    }

    @Test
    void rejeitaEstoqueInsuficiente() throws Exception {
        consumir("RODRIGO", item("OLEO", 11))
                .andExpect(status().isBadRequest());
        assertThat(saldo("ESTOQUE_RODRIGO", "OLEO")).isEqualTo(10);
    }

    @Test
    void fazRollbackIntegral() throws Exception {
        String itens = "[%s,%s]".formatted(
                item("MILHO", 10),
                item("OLEO", 11)
        );
        consumir("RODRIGO", itens).andExpect(status().isBadRequest());
        assertThat(saldo("ESTOQUE_RODRIGO", "MILHO")).isEqualTo(50);
        assertThat(saldo("ESTOQUE_RODRIGO", "OLEO")).isEqualTo(10);
        assertThat(contagem("consumos_carrinho")).isZero();
    }

    @Test
    void registraSaldoAnteriorEPosterior() throws Exception {
        consumir("RODRIGO", item("MILHO", 7))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itens[0].saldoAnterior").value(50))
                .andExpect(jsonPath("$.itens[0].saldoPosterior").value(43));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT saldo_posterior FROM consumo_carrinho_itens",
                Integer.class
        )).isEqualTo(43);
    }

    @Test
    void registraHistoricoAgregado() throws Exception {
        String itens = "[%s,%s]".formatted(
                item("MILHO", 5),
                item("CHOCOLATE", 3)
        );
        consumir("RODRIGO", itens)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data").value("2026-08-11T18:00:00Z"))
                .andExpect(jsonPath("$.observacao")
                        .value("Consumo do carrinho teste"));
        assertThat(contagem("consumos_carrinho")).isEqualTo(1);
        assertThat(contagem("consumo_carrinho_itens")).isEqualTo(2);
    }

    @Test
    void consumoNaoAlteraEstoquePrincipal() throws Exception {
        int saldoAnterior = saldo("ESTOQUE_PRINCIPAL", "MILHO");
        consumir("RODRIGO", item("MILHO", 10))
                .andExpect(status().isCreated());
        assertThat(saldo("ESTOQUE_PRINCIPAL", "MILHO"))
                .isEqualTo(saldoAnterior);
    }

    @Test
    void consumoNaoAlteraReservas() throws Exception {
        criarReserva("RODRIGO", "BOULEVARD", "MIX", 20);
        consumir("RODRIGO", item("MILHO", 10))
                .andExpect(status().isCreated());
        assertThat(jdbcTemplate.queryForObject(
                "SELECT quantidade_utilizada FROM reservas",
                Integer.class
        )).isZero();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT quantidade_liberada FROM reservas",
                Integer.class
        )).isZero();
        assertThat(contagem("reserva_eventos")).isEqualTo(1);
    }

    private org.springframework.test.web.servlet.ResultActions consumir(
            String responsavelId,
            String itens
    ) throws Exception {
        String corpo = """
                {
                    "responsavelId":"%s",
                    "itens":%s,
                    "data":"2026-08-11T18:00:00Z",
                    "observacao":"Consumo do carrinho teste"
                }
                """.formatted(responsavelId, normalizarItens(itens));
        return mockMvc.perform(post("/api/v1/consumos-carrinho")
                .contentType(MediaType.APPLICATION_JSON)
                .content(corpo));
    }

    private void criarReserva(
            String responsavel,
            String destino,
            String produto,
            int quantidade
    ) throws Exception {
        String corpo = """
                {
                    "responsavelId":"%s",
                    "destino":"%s",
                    "produtoId":"%s",
                    "quantidade":%d
                }
                """.formatted(responsavel, destino, produto, quantidade);
        mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isCreated());
    }

    private String item(String produtoId, int quantidade) {
        return """
                {"produtoId":"%s","quantidade":%d}
                """.formatted(produtoId, quantidade).trim();
    }

    private String normalizarItens(String itens) {
        return itens.startsWith("[") ? itens : "[" + itens + "]";
    }

    private int saldo(String estoqueId, String produtoId) {
        return jdbcTemplate.queryForObject("""
                SELECT quantidade FROM estoque_itens
                WHERE estoque_id = ? AND produto_id = ?
                """, Integer.class, estoqueId, produtoId);
    }

    private int contagem(String tabela) {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + tabela,
                Integer.class
        );
    }
}
