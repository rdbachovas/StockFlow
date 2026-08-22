package br.com.stockflow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.OffsetDateTime;

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
class RetiradaIntegrationTest {

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
    void restaurarEstado() {
        jdbcTemplate.update("DELETE FROM retirada_itens");
        jdbcTemplate.update("DELETE FROM retiradas");
        jdbcTemplate.update(
                "DELETE FROM estoque_itens WHERE estoque_id <> 'ESTOQUE_PRINCIPAL'"
        );
        jdbcTemplate.update("""
                UPDATE estoque_itens
                SET quantidade = CASE produto_id
                    WHEN 'MIX' THEN 300
                    WHEN 'CAPIVARAS' THEN 200
                    WHEN 'BIG' THEN 100
                    ELSE quantidade
                END
                WHERE estoque_id = 'ESTOQUE_PRINCIPAL'
                """);
    }

    @Test
    void registraRetiradaParaRodrigo() throws Exception {
        mockMvc.perform(post("/api/v1/retiradas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request("RODRIGO", itens("MIX", 10))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.revisao").isNumber())
                .andExpect(jsonPath("$.responsavelId").value("RODRIGO"))
                .andExpect(jsonPath("$.estoqueOrigemId").value("ESTOQUE_PRINCIPAL"))
                .andExpect(jsonPath("$.estoqueDestinoId").value("ESTOQUE_RODRIGO"));

        assertThat(saldo("ESTOQUE_PRINCIPAL", "MIX")).isEqualTo(290);
        assertThat(saldo("ESTOQUE_RODRIGO", "MIX")).isEqualTo(10);
    }

    @Test
    void registraRetiradaParaCesar() throws Exception {
        mockMvc.perform(post("/api/v1/retiradas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request("CESAR", itens("BIG", 4))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estoqueDestinoId").value("ESTOQUE_CESAR"));

        assertThat(saldo("ESTOQUE_PRINCIPAL", "BIG")).isEqualTo(96);
        assertThat(saldo("ESTOQUE_CESAR", "BIG")).isEqualTo(4);
    }

    @Test
    void transfereMultiplosProdutosEmUmaRetirada() throws Exception {
        String itens = """
                [
                    {"produtoId":"MIX","quantidade":12},
                    {"produtoId":"CAPIVARAS","quantidade":7}
                ]
                """;

        mockMvc.perform(post("/api/v1/retiradas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request("RODRIGO", itens)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itens.length()").value(2));

        assertThat(saldo("ESTOQUE_PRINCIPAL", "MIX")).isEqualTo(288);
        assertThat(saldo("ESTOQUE_PRINCIPAL", "CAPIVARAS")).isEqualTo(193);
        assertThat(saldo("ESTOQUE_RODRIGO", "MIX")).isEqualTo(12);
        assertThat(saldo("ESTOQUE_RODRIGO", "CAPIVARAS")).isEqualTo(7);
        assertThat(contagem("retiradas")).isEqualTo(1);
        assertThat(contagem("retirada_itens")).isEqualTo(2);
    }

    @Test
    void rejeitaEstoqueInsuficiente() throws Exception {
        mockMvc.perform(post("/api/v1/retiradas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request("RODRIGO", itens("MIX", 301))))
                .andExpect(status().isBadRequest());

        assertThat(saldo("ESTOQUE_PRINCIPAL", "MIX")).isEqualTo(300);
        assertThat(contagem("retiradas")).isZero();
    }

    @Test
    void rejeitaQuantidadeInvalida() throws Exception {
        mockMvc.perform(post("/api/v1/retiradas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request("RODRIGO", itens("MIX", 0))))
                .andExpect(status().isBadRequest());

        assertThat(saldo("ESTOQUE_PRINCIPAL", "MIX")).isEqualTo(300);
        assertThat(contagem("retiradas")).isZero();
    }

    @Test
    void fazRollbackDeTodosOsItensQuandoUmForInvalido() throws Exception {
        String itens = """
                [
                    {"produtoId":"MIX","quantidade":10},
                    {"produtoId":"BIG","quantidade":101}
                ]
                """;

        mockMvc.perform(post("/api/v1/retiradas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request("RODRIGO", itens)))
                .andExpect(status().isBadRequest());

        assertThat(saldo("ESTOQUE_PRINCIPAL", "MIX")).isEqualTo(300);
        assertThat(saldo("ESTOQUE_PRINCIPAL", "BIG")).isEqualTo(100);
        assertThat(contagem("retiradas")).isZero();
        assertThat(contagemItens("ESTOQUE_RODRIGO")).isZero();
    }

    @Test
    void preservaDataEObservacaoNoHistoricoAgregado() throws Exception {
        mockMvc.perform(post("/api/v1/retiradas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request("CESAR", itens("MIX", 5))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data").value("2026-08-11T14:30:00Z"))
                .andExpect(jsonPath("$.observacao").value("Retirada de teste"));

        String observacao = jdbcTemplate.queryForObject(
                "SELECT observacao FROM retiradas",
                String.class
        );
        OffsetDateTime data = jdbcTemplate.queryForObject(
                "SELECT data FROM retiradas",
                OffsetDateTime.class
        );

        assertThat(observacao).isEqualTo("Retirada de teste");
        assertThat(data).isEqualTo(
                OffsetDateTime.parse("2026-08-11T14:30:00Z")
        );
        assertThat(contagem("retiradas")).isEqualTo(1);
    }

    @Test
    void registraSaldoAnteriorEPosterior() throws Exception {
        mockMvc.perform(post("/api/v1/retiradas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request("RODRIGO", itens("MIX", 9))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itens[0].saldoAnterior").value(300))
                .andExpect(jsonPath("$.itens[0].saldoPosterior").value(291));

        MapSaldo saldos = jdbcTemplate.queryForObject(
                "SELECT saldo_anterior, saldo_posterior FROM retirada_itens",
                (resultado, linha) -> new MapSaldo(
                        resultado.getInt("saldo_anterior"),
                        resultado.getInt("saldo_posterior")
                )
        );

        assertThat(saldos).isEqualTo(new MapSaldo(300, 291));
    }

    private int saldo(String estoqueId, String produtoId) {
        Integer saldo = jdbcTemplate.queryForObject(
                """
                SELECT quantidade
                FROM estoque_itens
                WHERE estoque_id = ? AND produto_id = ?
                """,
                Integer.class,
                estoqueId,
                produtoId
        );

        return saldo == null ? 0 : saldo;
    }

    private int contagem(String tabela) {
        Integer quantidade = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + tabela,
                Integer.class
        );
        return quantidade == null ? 0 : quantidade;
    }

    private int contagemItens(String estoqueId) {
        Integer quantidade = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM estoque_itens WHERE estoque_id = ?",
                Integer.class,
                estoqueId
        );
        return quantidade == null ? 0 : quantidade;
    }

    private String request(String responsavelId, String itens) {
        return """
                {
                    "responsavelId":"%s",
                    "itens":%s,
                    "data":"2026-08-11T14:30:00Z",
                    "observacao":"Retirada de teste"
                }
                """.formatted(responsavelId, itens);
    }

    private String itens(String produtoId, int quantidade) {
        return """
                [{"produtoId":"%s","quantidade":%d}]
                """.formatted(produtoId, quantidade);
    }

    private record MapSaldo(
            int anterior,
            int posterior
    ) {
    }
}
