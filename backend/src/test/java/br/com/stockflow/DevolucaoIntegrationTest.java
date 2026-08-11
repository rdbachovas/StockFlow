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
class DevolucaoIntegrationTest {

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
        jdbcTemplate.update("DELETE FROM devolucao_reservas");
        jdbcTemplate.update("DELETE FROM devolucao_itens");
        jdbcTemplate.update("DELETE FROM devolucoes");
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
                    ('ESTOQUE_RODRIGO', 'BIG', 50),
                    ('ESTOQUE_RODRIGO', 'MILHO', 20),
                    ('ESTOQUE_CESAR', 'MIX', 90),
                    ('ESTOQUE_CESAR', 'STITCH', 60),
                    ('ESTOQUE_CESAR', 'MILHO', 15)
                """);
        jdbcTemplate.update("""
                UPDATE estoque_itens SET quantidade = CASE produto_id
                    WHEN 'MIX' THEN 300
                    WHEN 'BIG' THEN 100
                    WHEN 'STITCH' THEN 100
                    WHEN 'MILHO' THEN 50
                    ELSE quantidade
                END
                WHERE estoque_id = 'ESTOQUE_PRINCIPAL'
                """);
    }

    @Test
    void devolveSomenteLivre() throws Exception {
        devolver("RODRIGO", item("MIX", 20, "[]"))
                .andExpect(status().isCreated());
        assertThat(saldo("ESTOQUE_RODRIGO", "MIX")).isEqualTo(80);
    }

    @Test
    void devolveSomenteReserva() throws Exception {
        criarReserva("RODRIGO", "MERCADOS", "MIX", 30);
        devolver("RODRIGO", item("MIX", 0, parcelas("MERCADOS", 10)))
                .andExpect(status().isCreated());
        assertThat(restante("RODRIGO", "MERCADOS", "MIX")).isEqualTo(20);
    }

    @Test
    void devolveLivreEReserva() throws Exception {
        criarReserva("RODRIGO", "MERCADOS", "MIX", 30);
        devolver("RODRIGO", item("MIX", 20, parcelas("MERCADOS", 10)))
                .andExpect(status().isCreated());
        assertThat(saldo("ESTOQUE_RODRIGO", "MIX")).isEqualTo(70);
        assertThat(restante("RODRIGO", "MERCADOS", "MIX")).isEqualTo(20);
    }

    @Test
    void devolveMultiplasReservas() throws Exception {
        criarReserva("RODRIGO", "MERCADOS", "MIX", 30);
        criarReserva("RODRIGO", "BOULEVARD", "MIX", 20);
        String reservas = "[%s,%s]".formatted(
                parcela("MERCADOS", 10),
                parcela("BOULEVARD", 5)
        );
        devolver("RODRIGO", item("MIX", 20, reservas))
                .andExpect(status().isCreated());
        assertThat(restante("RODRIGO", "MERCADOS", "MIX")).isEqualTo(20);
        assertThat(restante("RODRIGO", "BOULEVARD", "MIX")).isEqualTo(15);
        assertThat(saldo("ESTOQUE_RODRIGO", "MIX")).isEqualTo(65);
    }

    @Test
    void devolveMultiplosProdutos() throws Exception {
        String itens = "[%s,%s]".formatted(
                item("MIX", 10, "[]"),
                item("BIG", 5, "[]")
        );
        devolver("RODRIGO", itens)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itens.length()").value(2));
        assertThat(contagem("devolucoes")).isEqualTo(1);
    }

    @Test
    void devolvePorRodrigo() throws Exception {
        devolver("RODRIGO", item("MIX", 5, "[]"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.responsavelId").value("RODRIGO"));
    }

    @Test
    void devolvePorCesar() throws Exception {
        devolver("CESAR", item("STITCH", 5, "[]"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estoqueOrigemId")
                        .value("ESTOQUE_CESAR"));
    }

    @Test
    void devolveInsumoDoCarrinho() throws Exception {
        devolver("RODRIGO", item("MILHO", 8, "[]"))
                .andExpect(status().isCreated());
        assertThat(saldo("ESTOQUE_RODRIGO", "MILHO")).isEqualTo(12);
        assertThat(saldo("ESTOQUE_PRINCIPAL", "MILHO")).isEqualTo(58);
    }

    @Test
    void rejeitaReservaInexistente() throws Exception {
        devolver("RODRIGO", item("MIX", 0, parcelas("MERCADOS", 5)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejeitaReservaDeOutroDestino() throws Exception {
        criarReserva("RODRIGO", "MERCADOS", "MIX", 20);
        devolver("RODRIGO", item("MIX", 0, parcelas("BOULEVARD", 5)))
                .andExpect(status().isBadRequest());
        assertThat(restante("RODRIGO", "MERCADOS", "MIX")).isEqualTo(20);
    }

    @Test
    void rejeitaReservaDeOutroResponsavel() throws Exception {
        criarReserva("CESAR", "MERCADOS", "MIX", 20);
        devolver("RODRIGO", item("MIX", 0, parcelas("MERCADOS", 5)))
                .andExpect(status().isBadRequest());
        assertThat(restante("CESAR", "MERCADOS", "MIX")).isEqualTo(20);
    }

    @Test
    void rejeitaQuantidadeReservadaAcimaDoRestante() throws Exception {
        criarReserva("RODRIGO", "MERCADOS", "MIX", 10);
        devolver("RODRIGO", item("MIX", 0, parcelas("MERCADOS", 11)))
                .andExpect(status().isBadRequest());
        assertThat(liberada("RODRIGO", "MERCADOS", "MIX")).isZero();
    }

    @Test
    void rejeitaQuantidadeLivreInsuficiente() throws Exception {
        criarReserva("RODRIGO", "MERCADOS", "MIX", 80);
        devolver("RODRIGO", item("MIX", 21, "[]"))
                .andExpect(status().isBadRequest());
        assertThat(saldo("ESTOQUE_RODRIGO", "MIX")).isEqualTo(100);
    }

    @Test
    void fazRollbackIntegral() throws Exception {
        criarReserva("RODRIGO", "MERCADOS", "MIX", 20);
        String itens = "[%s,%s]".formatted(
                item("MIX", 0, parcelas("MERCADOS", 10)),
                item("BIG", 51, "[]")
        );
        devolver("RODRIGO", itens).andExpect(status().isBadRequest());
        assertThat(liberada("RODRIGO", "MERCADOS", "MIX")).isZero();
        assertThat(saldo("ESTOQUE_RODRIGO", "MIX")).isEqualTo(100);
        assertThat(contagem("devolucoes")).isZero();
    }

    @Test
    void atualizaEstoquePrincipal() throws Exception {
        devolver("RODRIGO", item("MIX", 12, "[]"))
                .andExpect(status().isCreated());
        assertThat(saldo("ESTOQUE_PRINCIPAL", "MIX")).isEqualTo(312);
    }

    @Test
    void atualizaEstoquePessoal() throws Exception {
        devolver("CESAR", item("MIX", 12, "[]"))
                .andExpect(status().isCreated());
        assertThat(saldo("ESTOQUE_CESAR", "MIX")).isEqualTo(78);
    }

    @Test
    void registraSaldosAnterioresEPosteriores() throws Exception {
        devolver("RODRIGO", item("MIX", 9, "[]"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.itens[0].saldoPessoalAnterior")
                        .value(100))
                .andExpect(jsonPath("$.itens[0].saldoPessoalPosterior")
                        .value(91))
                .andExpect(jsonPath("$.itens[0].saldoPrincipalAnterior")
                        .value(300))
                .andExpect(jsonPath("$.itens[0].saldoPrincipalPosterior")
                        .value(309));
    }

    @Test
    void registraEventoLiberacao() throws Exception {
        UUID id = criarReserva("RODRIGO", "MERCADOS", "MIX", 20);
        devolver("RODRIGO", item("MIX", 0, parcelas("MERCADOS", 7)))
                .andExpect(status().isCreated());
        assertThat(eventos(id, "LIBERACAO")).isEqualTo(1);
        assertThat(quantidadeEvento(id, "LIBERACAO")).isEqualTo(7);
    }

    @Test
    void registraEventoConclusao() throws Exception {
        UUID id = criarReserva("RODRIGO", "MERCADOS", "MIX", 10);
        devolver("RODRIGO", item("MIX", 0, parcelas("MERCADOS", 10)))
                .andExpect(status().isCreated());
        assertThat(eventos(id, "CONCLUSAO")).isEqualTo(1);
        assertThat(statusReserva(id)).isEqualTo("CONCLUIDA");
    }

    @Test
    void registraHistoricoAgregado() throws Exception {
        String itens = "[%s,%s]".formatted(
                item("MIX", 10, "[]"),
                item("MILHO", 3, "[]")
        );
        devolver("RODRIGO", itens)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data").value("2026-08-11T16:00:00Z"))
                .andExpect(jsonPath("$.observacao").value("Devolução teste"));
        assertThat(contagem("devolucoes")).isEqualTo(1);
        assertThat(contagem("devolucao_itens")).isEqualTo(2);
    }

    private org.springframework.test.web.servlet.ResultActions devolver(
            String responsavel,
            String itens
    ) throws Exception {
        String corpo = """
                {
                    "responsavelId":"%s",
                    "itens":%s,
                    "data":"2026-08-11T16:00:00Z",
                    "observacao":"Devolução teste"
                }
                """.formatted(responsavel, normalizarItens(itens));
        return mockMvc.perform(post("/api/v1/devolucoes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(corpo));
    }

    private UUID criarReserva(
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
        String resposta = mockMvc.perform(post("/api/v1/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(resposta);
        return UUID.fromString(json.get("id").asText());
    }

    private String item(
            String produto,
            int quantidadeLivre,
            String reservas
    ) {
        return """
                {"produtoId":"%s","quantidadeLivre":%d,"reservas":%s}
                """.formatted(produto, quantidadeLivre, reservas).trim();
    }

    private String parcelas(String destino, int quantidade) {
        return "[" + parcela(destino, quantidade) + "]";
    }

    private String parcela(String destino, int quantidade) {
        return """
                {"destino":"%s","quantidade":%d}
                """.formatted(destino, quantidade).trim();
    }

    private String normalizarItens(String itens) {
        return itens.startsWith("[") ? itens : "[" + itens + "]";
    }

    private int saldo(String estoque, String produto) {
        return jdbcTemplate.queryForObject("""
                SELECT quantidade FROM estoque_itens
                WHERE estoque_id = ? AND produto_id = ?
                """, Integer.class, estoque, produto);
    }

    private int restante(String responsavel, String destino, String produto) {
        return jdbcTemplate.queryForObject("""
                SELECT quantidade - quantidade_utilizada - quantidade_liberada
                FROM reservas
                WHERE responsavel_id = ? AND destino_id = ? AND produto_id = ?
                """, Integer.class, responsavel, destino, produto);
    }

    private int liberada(String responsavel, String destino, String produto) {
        return jdbcTemplate.queryForObject("""
                SELECT quantidade_liberada FROM reservas
                WHERE responsavel_id = ? AND destino_id = ? AND produto_id = ?
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

    private String statusReserva(UUID reservaId) {
        return jdbcTemplate.queryForObject(
                "SELECT status FROM reservas WHERE id = ?",
                String.class,
                reservaId
        );
    }

    private int contagem(String tabela) {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + tabela,
                Integer.class
        );
    }
}
