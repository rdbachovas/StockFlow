package br.com.stockflow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;
import java.util.concurrent.Executors;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class MovimentoEstoquePrincipalIntegrationTest {

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
        jdbcTemplate.update("DELETE FROM comandos_processados");
        jdbcTemplate.update("UPDATE revisao_estado SET revisao = 0 WHERE id = 1");
        jdbcTemplate.update("DELETE FROM movimento_estoque_principal_itens");
        jdbcTemplate.update("DELETE FROM movimentos_estoque_principal");
        jdbcTemplate.update("""
                UPDATE estoque_itens SET quantidade = CASE produto_id
                    WHEN 'MIX' THEN 300
                    WHEN 'BIG' THEN 100
                    WHEN 'MILHO' THEN 50
                    WHEN 'OLEO' THEN 50
                    ELSE quantidade
                END
                WHERE estoque_id = 'ESTOQUE_PRINCIPAL'
                """);
    }

    @Test
    void registraEntradaValida() throws Exception {
        movimentar("ENTRADA", item("MIX", 20))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.revisao").value(1));
        assertThat(saldo("MIX")).isEqualTo(320);
    }

    @Test
    void revisaoComecaEmZeroECresceComOperacoesConfirmadas() throws Exception {
        mockMvc.perform(get("/api/v1/snapshot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revisao").value(0));

        movimentar("ENTRADA", item("MIX", 1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.revisao").value(1));
        movimentar("SAIDA", item("MIX", 1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.revisao").value(2));

        mockMvc.perform(get("/api/v1/snapshot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revisao").value(2))
                .andExpect(jsonPath("$.estoques[?(@.id == 'ESTOQUE_PRINCIPAL')].itens[?(@.produtoId == 'MIX')].quantidade")
                        .value(300));
    }

    @Test
    void operacaoRejeitadaNaoAvancaRevisao() throws Exception {
        movimentar("SAIDA", item("MILHO", 51))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/v1/snapshot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revisao").value(0));
    }

    @Test
    void registraSaidaValida() throws Exception {
        movimentar("SAIDA", item("MIX", 20))
                .andExpect(status().isCreated());
        assertThat(saldo("MIX")).isEqualTo(280);
    }

    @Test
    void movimentaMultiplosProdutos() throws Exception {
        String itens = "[%s,%s]".formatted(
                item("MIX", 10),
                item("BIG", 5)
        );
        movimentar("ENTRADA", itens)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itens.length()").value(2));
        assertThat(saldo("MIX")).isEqualTo(310);
        assertThat(saldo("BIG")).isEqualTo(105);
    }

    @Test
    void aceitaPelucia() throws Exception {
        movimentar("ENTRADA", item("BIG", 7))
                .andExpect(status().isCreated());
        assertThat(saldo("BIG")).isEqualTo(107);
    }

    @Test
    void aceitaInsumoDoCarrinho() throws Exception {
        movimentar("SAIDA", item("MILHO", 8))
                .andExpect(status().isCreated());
        assertThat(saldo("MILHO")).isEqualTo(42);
    }

    @Test
    void rejeitaQuantidadeZero() throws Exception {
        movimentar("ENTRADA", item("MIX", 0))
                .andExpect(status().isBadRequest());
        assertThat(saldo("MIX")).isEqualTo(300);
    }

    @Test
    void rejeitaQuantidadeNegativa() throws Exception {
        movimentar("SAIDA", item("MIX", -1))
                .andExpect(status().isBadRequest());
        assertThat(saldo("MIX")).isEqualTo(300);
    }

    @Test
    void rejeitaProdutoDuplicado() throws Exception {
        String itens = "[%s,%s]".formatted(
                item("MIX", 10),
                item("MIX", 5)
        );
        movimentar("ENTRADA", itens).andExpect(status().isBadRequest());
        assertThat(contagem("movimentos_estoque_principal")).isZero();
    }

    @Test
    void rejeitaSaidaComEstoqueInsuficiente() throws Exception {
        movimentar("SAIDA", item("MILHO", 51))
                .andExpect(status().isBadRequest());
        assertThat(saldo("MILHO")).isEqualTo(50);
    }

    @Test
    void fazRollbackIntegral() throws Exception {
        String itens = "[%s,%s]".formatted(
                item("MIX", 10),
                item("BIG", 101)
        );
        movimentar("SAIDA", itens).andExpect(status().isBadRequest());
        assertThat(saldo("MIX")).isEqualTo(300);
        assertThat(saldo("BIG")).isEqualTo(100);
        assertThat(contagem("movimentos_estoque_principal")).isZero();
    }

    @Test
    void registraSaldoAnteriorEPosterior() throws Exception {
        movimentar("SAIDA", item("MIX", 9))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itens[0].saldoAnterior").value(300))
                .andExpect(jsonPath("$.itens[0].saldoPosterior").value(291));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT saldo_posterior FROM movimento_estoque_principal_itens",
                Integer.class
        )).isEqualTo(291);
    }

    @Test
    void registraHistoricoAgregado() throws Exception {
        String itens = "[%s,%s]".formatted(
                item("MIX", 4),
                item("OLEO", 3)
        );
        movimentar("ENTRADA", itens)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data").value("2026-08-11T17:00:00Z"))
                .andExpect(jsonPath("$.observacao")
                        .value("Movimento manual teste"));
        assertThat(contagem("movimentos_estoque_principal")).isEqualTo(1);
        assertThat(contagem("movimento_estoque_principal_itens")).isEqualTo(2);
    }

    @Test
    void registraEntradaSeguidaDeSaida() throws Exception {
        movimentar("ENTRADA", item("MIX", 30))
                .andExpect(status().isCreated());
        movimentar("SAIDA", item("MIX", 12))
                .andExpect(status().isCreated());
        assertThat(saldo("MIX")).isEqualTo(318);
        assertThat(contagem("movimentos_estoque_principal")).isEqualTo(2);
    }

    @Test
    void mesmoCommandIdRetornaMesmaRespostaSemDuplicar() throws Exception {
        String commandId = UUID.randomUUID().toString();
        MvcResult primeira = movimentar(commandId, "ENTRADA", item("MIX", 10))
                .andExpect(status().isCreated())
                .andReturn();
        MvcResult segunda = movimentar(commandId, "ENTRADA", item("MIX", 10))
                .andExpect(status().isCreated())
                .andReturn();

        assertThat(segunda.getResponse().getContentAsString())
                .isEqualTo(primeira.getResponse().getContentAsString());
        assertThat(saldo("MIX")).isEqualTo(310);
        assertThat(contagem("movimentos_estoque_principal")).isEqualTo(1);
        assertThat(contagem("comandos_processados")).isEqualTo(1);
    }

    @Test
    void commandIdsDiferentesExecutamNormalmente() throws Exception {
        movimentar(UUID.randomUUID().toString(), "ENTRADA", item("MIX", 1));
        movimentar(UUID.randomUUID().toString(), "ENTRADA", item("MIX", 1));
        assertThat(saldo("MIX")).isEqualTo(302);
        assertThat(contagem("movimentos_estoque_principal")).isEqualTo(2);
    }

    @Test
    void requestsConcorrentesComMesmoCommandIdExecutamUmaVez() throws Exception {
        String commandId = UUID.randomUUID().toString();
        var executor = Executors.newFixedThreadPool(2);
        try {
            var primeira = executor.submit(() -> movimentar(
                    commandId, "ENTRADA", item("MIX", 10)
            ).andReturn().getResponse().getStatus());
            var segunda = executor.submit(() -> movimentar(
                    commandId, "ENTRADA", item("MIX", 10)
            ).andReturn().getResponse().getStatus());

            assertThat(primeira.get()).isEqualTo(201);
            assertThat(segunda.get()).isEqualTo(201);
            assertThat(saldo("MIX")).isEqualTo(310);
            assertThat(contagem("movimentos_estoque_principal")).isEqualTo(1);
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void rollbackNaoConfirmaCommandId() throws Exception {
        String commandId = UUID.randomUUID().toString();
        movimentar(commandId, "SAIDA", item("MILHO", 51))
                .andExpect(status().isBadRequest());
        assertThat(contagem("comandos_processados")).isZero();
    }

    private org.springframework.test.web.servlet.ResultActions movimentar(
            String tipo,
            String itens
    ) throws Exception {
        return movimentar(UUID.randomUUID().toString(), tipo, itens);
    }

    private org.springframework.test.web.servlet.ResultActions movimentar(
            String commandId,
            String tipo,
            String itens
    ) throws Exception {
        String corpo = """
                {
                    "commandId":"%s",
                    "tipo":"%s",
                    "itens":%s,
                    "data":"2026-08-11T17:00:00Z",
                    "observacao":"Movimento manual teste"
                }
                """.formatted(commandId, tipo, normalizarItens(itens));
        return mockMvc.perform(post("/api/v1/movimentos-estoque-principal")
                .contentType(MediaType.APPLICATION_JSON)
                .content(corpo));
    }

    private String item(String produtoId, int quantidade) {
        return """
                {"produtoId":"%s","quantidade":%d}
                """.formatted(produtoId, quantidade).trim();
    }

    private String normalizarItens(String itens) {
        return itens.startsWith("[") ? itens : "[" + itens + "]";
    }

    private int saldo(String produtoId) {
        return jdbcTemplate.queryForObject("""
                SELECT quantidade FROM estoque_itens
                WHERE estoque_id = 'ESTOQUE_PRINCIPAL' AND produto_id = ?
                """, Integer.class, produtoId);
    }

    private int contagem(String tabela) {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + tabela,
                Integer.class
        );
    }
}
