package br.com.stockflow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class AbastecimentoIntegrationTest {

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

    @Autowired
    ObjectMapper objectMapper;

    @BeforeEach
    void prepararEstado() {
        jdbcTemplate.update("DELETE FROM abastecimento_saldos");
        jdbcTemplate.update("DELETE FROM abastecimento_itens");
        jdbcTemplate.update("DELETE FROM abastecimentos");
        jdbcTemplate.update("DELETE FROM reserva_eventos");
        jdbcTemplate.update("DELETE FROM reservas");
        jdbcTemplate.update(
                "DELETE FROM estoque_itens WHERE estoque_id IN "
                        + "('ESTOQUE_RODRIGO', 'ESTOQUE_CESAR')"
        );
        jdbcTemplate.update("""
                INSERT INTO estoque_itens (estoque_id, produto_id, quantidade)
                VALUES
                    ('ESTOQUE_RODRIGO', 'MIX', 100),
                    ('ESTOQUE_RODRIGO', 'PERSONAGENS', 80),
                    ('ESTOQUE_RODRIGO', 'CAPIVARAS', 70),
                    ('ESTOQUE_RODRIGO', 'BIG', 50),
                    ('ESTOQUE_RODRIGO', 'MILHO', 20),
                    ('ESTOQUE_CESAR', 'MIX', 90),
                    ('ESTOQUE_CESAR', 'PERSONAGENS', 60),
                    ('ESTOQUE_CESAR', 'STITCH', 60),
                    ('ESTOQUE_CESAR', 'CAPIVARAS', 70),
                    ('ESTOQUE_CESAR', 'BIG', 40),
                    ('ESTOQUE_CESAR', 'LABUBU', 30)
                """);
    }

    @Test
    void abasteceSomenteComEstoqueLivre() throws Exception {
        abastecer("RODRIGO", "BOULEVARD", item("M1", "MIX", 20))
                .andExpect(status().isCreated());
        assertThat(saldo("ESTOQUE_RODRIGO", "MIX")).isEqualTo(80);
    }

    @Test
    void abasteceSomenteComReserva() throws Exception {
        criarReserva("RODRIGO", "BOULEVARD", "MIX", 30);
        abastecer("RODRIGO", "BOULEVARD", item("M1", "MIX", 30))
                .andExpect(status().isCreated());
        assertThat(utilizada("RODRIGO", "BOULEVARD", "MIX")).isEqualTo(30);
    }

    @Test
    void abasteceComReservaELivre() throws Exception {
        criarReserva("RODRIGO", "BOULEVARD", "MIX", 20);
        abastecer("RODRIGO", "BOULEVARD", item("M1", "MIX", 35))
                .andExpect(status().isCreated());
        assertThat(utilizada("RODRIGO", "BOULEVARD", "MIX")).isEqualTo(20);
        assertThat(saldo("ESTOQUE_RODRIGO", "MIX")).isEqualTo(65);
    }

    @Test
    void consomeParcialmenteReserva() throws Exception {
        criarReserva("RODRIGO", "BOULEVARD", "MIX", 40);
        abastecer("RODRIGO", "BOULEVARD", item("M2", "MIX", 15))
                .andExpect(status().isCreated());
        assertThat(restante("RODRIGO", "BOULEVARD", "MIX")).isEqualTo(25);
        assertThat(statusReserva("RODRIGO", "BOULEVARD", "MIX"))
                .isEqualTo("ATIVA");
    }

    @Test
    void concluiReservaQuandoZeraRestante() throws Exception {
        criarReserva("RODRIGO", "BOULEVARD", "MIX", 25);
        abastecer("RODRIGO", "BOULEVARD", item("M3", "MIX", 25))
                .andExpect(status().isCreated());
        assertThat(statusReserva("RODRIGO", "BOULEVARD", "MIX"))
                .isEqualTo("CONCLUIDA");
    }

    @Test
    void consomeMultiplasReservas() throws Exception {
        criarReserva("RODRIGO", "BOULEVARD", "MIX", 15);
        criarReserva("RODRIGO", "BOULEVARD", "MIX", 20);
        abastecer("RODRIGO", "BOULEVARD", item("M1", "MIX", 30))
                .andExpect(status().isCreated());
        assertThat(somaUtilizada("RODRIGO", "BOULEVARD", "MIX"))
                .isEqualTo(30);
        assertThat(reservasConcluidas("RODRIGO", "BOULEVARD", "MIX"))
                .isEqualTo(1);
    }

    @Test
    void protegeReservaDeOutroDestino() throws Exception {
        criarReserva("RODRIGO", "MERCADOS", "MIX", 80);
        abastecer("RODRIGO", "BOULEVARD", item("M1", "MIX", 21))
                .andExpect(status().isBadRequest());
        assertThat(saldo("ESTOQUE_RODRIGO", "MIX")).isEqualTo(100);
        assertThat(utilizada("RODRIGO", "MERCADOS", "MIX")).isZero();
    }

    @Test
    void permiteBoulevardPorRodrigo() throws Exception {
        abastecer("RODRIGO", "BOULEVARD", item("M5", "BIG", 5))
                .andExpect(status().isCreated());
    }

    @Test
    void permiteAeroportoPorCesar() throws Exception {
        abastecer("CESAR", "AEROPORTO", item("B01", "STITCH", 5))
                .andExpect(status().isCreated());
    }

    @Test
    void permiteMercadoPorRodrigo() throws Exception {
        abastecer("RODRIGO", "MERCADOS", item("MERCADO_1", "MIX", 5))
                .andExpect(status().isCreated());
    }

    @Test
    void permiteMercadoPorCesar() throws Exception {
        abastecer("CESAR", "MERCADOS", item("MERCADO_2", "CAPIVARAS", 5))
                .andExpect(status().isCreated());
    }

    @Test
    void rejeitaResponsavelInvalido() throws Exception {
        abastecer("CESAR", "BOULEVARD", item("M1", "MIX", 5))
                .andExpect(status().isBadRequest());
        assertThat(contagem("abastecimentos")).isZero();
    }

    @Test
    void rejeitaMaquinaEProdutoIncompativeis() throws Exception {
        abastecer("RODRIGO", "BOULEVARD", item("M4", "MIX", 5))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejeitaInsumoDoCarrinho() throws Exception {
        abastecer("RODRIGO", "MERCADOS", item("MERCADO_1", "MILHO", 5))
                .andExpect(status().isBadRequest());
        assertThat(saldo("ESTOQUE_RODRIGO", "MILHO")).isEqualTo(20);
    }

    @Test
    void rejeitaEstoqueInsuficiente() throws Exception {
        abastecer("RODRIGO", "BOULEVARD", item("M1", "MIX", 101))
                .andExpect(status().isBadRequest());
        assertThat(saldo("ESTOQUE_RODRIGO", "MIX")).isEqualTo(100);
    }

    @Test
    void registraMultiplosItensEmOperacaoAgregada() throws Exception {
        String itens = "[%s,%s]".formatted(
                item("M1", "MIX", 10),
                item("M4", "CAPIVARAS", 7)
        );
        abastecer("RODRIGO", "BOULEVARD", itens)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itens.length()").value(2))
                .andExpect(jsonPath("$.saldos.length()").value(2));
        assertThat(contagem("abastecimentos")).isEqualTo(1);
    }

    @Test
    void fazRollbackIntegral() throws Exception {
        criarReserva("RODRIGO", "BOULEVARD", "MIX", 20);
        String itens = "[%s,%s]".formatted(
                item("M1", "MIX", 10),
                item("M5", "BIG", 51)
        );
        abastecer("RODRIGO", "BOULEVARD", itens)
                .andExpect(status().isBadRequest());
        assertThat(saldo("ESTOQUE_RODRIGO", "MIX")).isEqualTo(100);
        assertThat(utilizada("RODRIGO", "BOULEVARD", "MIX")).isZero();
        assertThat(contagem("abastecimentos")).isZero();
    }

    @Test
    void registraHistoricoComDataEObservacao() throws Exception {
        abastecer("RODRIGO", "BOULEVARD", item("M1", "MIX", 8))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data").value("2026-08-11T15:00:00Z"))
                .andExpect(jsonPath("$.observacao").value("Abastecimento teste"));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT observacao FROM abastecimentos",
                String.class
        )).isEqualTo("Abastecimento teste");
    }

    @Test
    void registraSaldoAnteriorEPosteriorPorProduto() throws Exception {
        abastecer("RODRIGO", "BOULEVARD", item("M1", "MIX", 9))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.saldos[0].saldoAnterior").value(100))
                .andExpect(jsonPath("$.saldos[0].saldoPosterior").value(91));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT saldo_posterior FROM abastecimento_saldos",
                Integer.class
        )).isEqualTo(91);
    }

    @Test
    void registraEventoUtilizacao() throws Exception {
        UUID reservaId = criarReserva(
                "RODRIGO", "BOULEVARD", "MIX", 20
        );
        abastecer("RODRIGO", "BOULEVARD", item("M1", "MIX", 5))
                .andExpect(status().isCreated());
        assertThat(eventos(reservaId, "UTILIZACAO")).isEqualTo(1);
        assertThat(quantidadeEvento(reservaId, "UTILIZACAO")).isEqualTo(5);
    }

    @Test
    void registraEventoConclusao() throws Exception {
        UUID reservaId = criarReserva(
                "RODRIGO", "BOULEVARD", "MIX", 10
        );
        abastecer("RODRIGO", "BOULEVARD", item("M1", "MIX", 10))
                .andExpect(status().isCreated());
        assertThat(eventos(reservaId, "CONCLUSAO")).isEqualTo(1);
    }

    private org.springframework.test.web.servlet.ResultActions abastecer(
            String responsavelId,
            String local,
            String itens
    ) throws Exception {
        String corpo = """
                {
                    "responsavelId":"%s",
                    "local":"%s",
                    "itens":%s,
                    "data":"2026-08-11T15:00:00Z",
                    "observacao":"Abastecimento teste"
                }
                """.formatted(responsavelId, local, normalizarItens(itens));
        return mockMvc.perform(post("/api/v1/abastecimentos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(corpo));
    }

    private UUID criarReserva(
            String responsavelId,
            String destino,
            String produtoId,
            int quantidade
    ) throws Exception {
        String corpo = """
                {
                    "responsavelId":"%s",
                    "destino":"%s",
                    "produtoId":"%s",
                    "quantidade":%d
                }
                """.formatted(responsavelId, destino, produtoId, quantidade);
        String resposta = mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(resposta);
        return UUID.fromString(json.get("id").asText());
    }

    private String item(String maquinaId, String produtoId, int quantidade) {
        return """
                {"maquinaId":"%s","produtoId":"%s","quantidade":%d}
                """.formatted(maquinaId, produtoId, quantidade).trim();
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

    private int utilizada(String responsavel, String destino, String produto) {
        return jdbcTemplate.queryForObject("""
                SELECT COALESCE(SUM(quantidade_utilizada), 0) FROM reservas
                WHERE responsavel_id = ? AND destino_id = ? AND produto_id = ?
                """, Integer.class, responsavel, destino, produto);
    }

    private int somaUtilizada(
            String responsavel,
            String destino,
            String produto
    ) {
        return utilizada(responsavel, destino, produto);
    }

    private int restante(String responsavel, String destino, String produto) {
        return jdbcTemplate.queryForObject("""
                SELECT quantidade - quantidade_utilizada - quantidade_liberada
                FROM reservas
                WHERE responsavel_id = ? AND destino_id = ? AND produto_id = ?
                """, Integer.class, responsavel, destino, produto);
    }

    private String statusReserva(
            String responsavel,
            String destino,
            String produto
    ) {
        return jdbcTemplate.queryForObject("""
                SELECT status FROM reservas
                WHERE responsavel_id = ? AND destino_id = ? AND produto_id = ?
                """, String.class, responsavel, destino, produto);
    }

    private int reservasConcluidas(
            String responsavel,
            String destino,
            String produto
    ) {
        return jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM reservas
                WHERE responsavel_id = ? AND destino_id = ? AND produto_id = ?
                  AND status = 'CONCLUIDA'
                """, Integer.class, responsavel, destino, produto);
    }

    private int eventos(UUID reservaId, String tipo) {
        return jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM reserva_eventos
                WHERE reserva_id = ? AND tipo = ?
                """, Integer.class, reservaId, tipo);
    }

    private int quantidadeEvento(UUID reservaId, String tipo) {
        return jdbcTemplate.queryForObject("""
                SELECT quantidade FROM reserva_eventos
                WHERE reserva_id = ? AND tipo = ?
                """, Integer.class, reservaId, tipo);
    }

    private int contagem(String tabela) {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + tabela,
                Integer.class
        );
    }
}
