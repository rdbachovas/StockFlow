package br.com.stockflow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
@org.springframework.security.test.context.support.WithMockUser(username = "RODRIGO")
class SnapshotIntegrationTest {

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
        jdbcTemplate.update("DELETE FROM movimento_estoque_principal_itens");
        jdbcTemplate.update("DELETE FROM movimentos_estoque_principal");
        jdbcTemplate.update("DELETE FROM devolucao_reservas");
        jdbcTemplate.update("DELETE FROM devolucao_itens");
        jdbcTemplate.update("DELETE FROM devolucoes");
        jdbcTemplate.update("DELETE FROM abastecimento_saldos");
        jdbcTemplate.update("DELETE FROM abastecimento_itens");
        jdbcTemplate.update("DELETE FROM abastecimentos");
        jdbcTemplate.update("DELETE FROM retirada_itens");
        jdbcTemplate.update("DELETE FROM retiradas");
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
    void retornaOsTresEstoques() throws Exception {
        mockMvc.perform(get("/api/v1/snapshot").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("RODRIGO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revisao").isNumber())
                .andExpect(jsonPath("$.estoques.length()").value(3))
                .andExpect(jsonPath("$.estoques[0].id")
                        .value("ESTOQUE_CESAR"))
                .andExpect(jsonPath("$.estoques[1].id")
                        .value("ESTOQUE_PRINCIPAL"))
                .andExpect(jsonPath("$.estoques[2].id")
                        .value("ESTOQUE_RODRIGO"));
    }

    @Test
    void retornaProdutosESaldos() throws Exception {
        mockMvc.perform(get("/api/v1/snapshot").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("RODRIGO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estoques[1].itens[?(@.produtoId == 'MIX')].quantidade")
                        .value(300))
                .andExpect(jsonPath("$.estoques[2].itens[?(@.produtoId == 'MILHO')].quantidade")
                        .value(20))
                .andExpect(jsonPath("$.estoques[2].itens[?(@.produtoId == 'MILHO')].grupo")
                        .value("CARRINHO_PIPOCA"));
    }

    @Test
    void retornaReservaComEventos() throws Exception {
        criarReserva("RODRIGO", "BOULEVARD", "MIX", 20);
        abastecer("RODRIGO", "BOULEVARD", "M1", "MIX", 5);

        mockMvc.perform(get("/api/v1/snapshot").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("RODRIGO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservas[0].quantidadeUtilizada")
                        .value(5))
                .andExpect(jsonPath("$.reservas[0].quantidadeRestante")
                        .value(15))
                .andExpect(jsonPath("$.reservas[0].eventos.length()").value(2))
                .andExpect(jsonPath("$.reservas[0].eventos[?(@.tipo == 'UTILIZACAO')].quantidade")
                        .value(5));
    }

    @Test
    void retornaRetirada() throws Exception {
        postJson("/api/v1/retiradas", """
                {"responsavelId":"RODRIGO","itens":[
                    {"produtoId":"MIX","quantidade":10}
                ],"data":"2026-08-11T10:00:00Z","observacao":"R"}
                """);
        mockMvc.perform(get("/api/v1/snapshot").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("RODRIGO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.retiradas[0].responsavelId")
                        .value("RODRIGO"))
                .andExpect(jsonPath("$.retiradas[0].itens[0].saldoAnterior")
                        .value(300));
    }

    @Test
    void retornaAbastecimento() throws Exception {
        abastecer("RODRIGO", "BOULEVARD", "M1", "MIX", 5);
        mockMvc.perform(get("/api/v1/snapshot").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("RODRIGO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.abastecimentos[0].local")
                        .value("BOULEVARD"))
                .andExpect(jsonPath("$.abastecimentos[0].itens[0].maquinaId")
                        .value("M1"))
                .andExpect(jsonPath("$.abastecimentos[0].saldos[0].saldoPosterior")
                        .value(95));
    }

    @Test
    void mercadoMantemLocalFisicoEConsomeDestinoLogico() throws Exception {
        criarReserva("RODRIGO", "MERCADOS", "MIX", 5);
        abastecer(
                "RODRIGO",
                "SUPERMERCADO_FANTE",
                "SUPERMERCADO_FANTE",
                "MIX",
                2
        );

        mockMvc.perform(get("/api/v1/snapshot").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("RODRIGO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.abastecimentos[0].local")
                        .value("SUPERMERCADO_FANTE"))
                .andExpect(jsonPath("$.reservas[0].destino")
                        .value("MERCADOS"))
                .andExpect(jsonPath("$.reservas[0].quantidadeUtilizada")
                        .value(2))
                .andExpect(jsonPath("$.reservas[0].quantidadeRestante")
                        .value(3));
    }

    @Test
    void retornaDevolucao() throws Exception {
        postJson("/api/v1/devolucoes", """
                {"responsavelId":"RODRIGO","itens":[
                    {"produtoId":"MIX","quantidadeLivre":5,"reservas":[]}
                ],"data":"2026-08-11T12:00:00Z","observacao":"D"}
                """);
        mockMvc.perform(get("/api/v1/snapshot").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("RODRIGO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.devolucoes[0].estoqueDestinoId")
                        .value("ESTOQUE_PRINCIPAL"))
                .andExpect(jsonPath("$.devolucoes[0].itens[0].saldoPessoalPosterior")
                        .value(95));
    }

    @Test
    void retornaMovimentoDoPrincipal() throws Exception {
        movimentoPrincipal("ENTRADA", "MIX", 7);
        mockMvc.perform(get("/api/v1/snapshot").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("RODRIGO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movimentosEstoquePrincipal[0].tipo")
                        .value("ENTRADA"))
                .andExpect(jsonPath("$.movimentosEstoquePrincipal[0].itens[0].saldoPosterior")
                        .value(307));
    }

    @Test
    void retornaConsumoDoCarrinho() throws Exception {
        consumir("RODRIGO", "MILHO", 4);
        mockMvc.perform(get("/api/v1/snapshot").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("RODRIGO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consumosCarrinho[0].responsavelId")
                        .value("RODRIGO"))
                .andExpect(jsonPath("$.consumosCarrinho[0].itens[0].saldoPosterior")
                        .value(16));
    }

    @Test
    void retornaHistoricosVaziosSemOperacoes() throws Exception {
        mockMvc.perform(get("/api/v1/snapshot").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("RODRIGO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservas.length()").value(0))
                .andExpect(jsonPath("$.retiradas.length()").value(0))
                .andExpect(jsonPath("$.abastecimentos.length()").value(0))
                .andExpect(jsonPath("$.devolucoes.length()").value(0))
                .andExpect(jsonPath("$.movimentosEstoquePrincipal.length()")
                        .value(0))
                .andExpect(jsonPath("$.consumosCarrinho.length()").value(0));
    }

    @Test
    void mantemConsistenciaAposVariasOperacoes() throws Exception {
        movimentoPrincipal("ENTRADA", "MIX", 10);
        postJson("/api/v1/retiradas", """
                {"responsavelId":"RODRIGO","itens":[
                    {"produtoId":"MIX","quantidade":10}
                ],"data":"2026-08-11T10:00:00Z","observacao":"R"}
                """);
        criarReserva("RODRIGO", "MERCADOS", "MIX", 5);
        abastecer("RODRIGO", "MERCADOS", "MERCADO_1", "MIX", 2);
        consumir("RODRIGO", "MILHO", 3);
        postJson("/api/v1/devolucoes", """
                {"responsavelId":"RODRIGO","itens":[
                    {"produtoId":"MIX","quantidadeLivre":2,"reservas":[]}
                ],"data":"2026-08-11T15:00:00Z","observacao":"D"}
                """);

        mockMvc.perform(get("/api/v1/snapshot").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("RODRIGO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reservas.length()").value(1))
                .andExpect(jsonPath("$.retiradas.length()").value(1))
                .andExpect(jsonPath("$.abastecimentos.length()").value(1))
                .andExpect(jsonPath("$.devolucoes.length()").value(1))
                .andExpect(jsonPath("$.movimentosEstoquePrincipal.length()")
                        .value(1))
                .andExpect(jsonPath("$.consumosCarrinho.length()").value(1))
                .andExpect(jsonPath("$.reservas[0].quantidadeRestante")
                        .value(3));

        assertThat(saldo("ESTOQUE_PRINCIPAL", "MIX")).isEqualTo(302);
        assertThat(saldo("ESTOQUE_RODRIGO", "MIX")).isEqualTo(106);
        assertThat(saldo("ESTOQUE_RODRIGO", "MILHO")).isEqualTo(17);
    }

    private void criarReserva(
            String responsavel,
            String destino,
            String produto,
            int quantidade
    ) throws Exception {
        postJson("/api/v1/reservas", """
                {"responsavelId":"%s","destino":"%s",
                 "produtoId":"%s","quantidade":%d}
                """.formatted(responsavel, destino, produto, quantidade));
    }

    private void abastecer(
            String responsavel,
            String local,
            String maquina,
            String produto,
            int quantidade
    ) throws Exception {
        postJson("/api/v1/abastecimentos", """
                {"responsavelId":"%s","local":"%s","itens":[
                    {"maquinaId":"%s","produtoId":"%s","quantidade":%d}
                ],"data":"2026-08-11T11:00:00Z","observacao":"A"}
                """.formatted(
                responsavel, local, maquina, produto, quantidade
        ));
    }

    private void movimentoPrincipal(
            String tipo,
            String produto,
            int quantidade
    ) throws Exception {
        postJson("/api/v1/movimentos-estoque-principal", """
                {"tipo":"%s","itens":[
                    {"produtoId":"%s","quantidade":%d}
                ],"data":"2026-08-11T09:00:00Z","observacao":"M"}
                """.formatted(tipo, produto, quantidade));
    }

    private void consumir(
            String responsavel,
            String produto,
            int quantidade
    ) throws Exception {
        postJson("/api/v1/consumos-carrinho", """
                {"responsavelId":"%s","itens":[
                    {"produtoId":"%s","quantidade":%d}
                ],"data":"2026-08-11T14:00:00Z","observacao":"C"}
                """.formatted(responsavel, produto, quantidade));
    }

    private void postJson(String endpoint, String corpo) throws Exception {
        mockMvc.perform(post(endpoint)
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("RODRIGO"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo))
                .andExpect(status().isCreated());
    }

    private int saldo(String estoqueId, String produtoId) {
        return jdbcTemplate.queryForObject("""
                SELECT quantidade FROM estoque_itens
                WHERE estoque_id = ? AND produto_id = ?
                """, Integer.class, estoqueId, produtoId);
    }
}
