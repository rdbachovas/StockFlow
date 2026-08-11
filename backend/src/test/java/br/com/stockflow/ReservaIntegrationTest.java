package br.com.stockflow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import br.com.stockflow.reserva.Reserva;
import br.com.stockflow.reserva.ReservaRepository;
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
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class ReservaIntegrationTest {

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

    @Autowired
    ReservaRepository reservaRepository;

    @Autowired
    TransactionTemplate transactionTemplate;

    @BeforeEach
    void prepararEstoquesPessoais() {
        jdbcTemplate.update("DELETE FROM reserva_eventos");
        jdbcTemplate.update("DELETE FROM reservas");
        jdbcTemplate.update(
                "DELETE FROM estoque_itens WHERE estoque_id IN " +
                        "('ESTOQUE_RODRIGO', 'ESTOQUE_CESAR')"
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
                    ('ESTOQUE_CESAR', 'STITCH', 60),
                    ('ESTOQUE_CESAR', 'CAPIVARAS', 70),
                    ('ESTOQUE_CESAR', 'BIG', 40)
                """);
    }

    @Test
    void criaReservaValidaParaRodrigo() throws Exception {
        criarReserva("RODRIGO", "BOULEVARD", "MIX", 30)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.responsavelId").value("RODRIGO"))
                .andExpect(jsonPath("$.destino").value("BOULEVARD"))
                .andExpect(jsonPath("$.quantidadeRestante").value(30))
                .andExpect(jsonPath("$.status").value("ATIVA"));
    }

    @Test
    void criaReservaValidaParaCesar() throws Exception {
        criarReserva("CESAR", "AEROPORTO", "STITCH", 20)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.responsavelId").value("CESAR"))
                .andExpect(jsonPath("$.produtoId").value("STITCH"));
    }

    @Test
    void permiteReservaParcialSemAlterarEstoqueFisico() throws Exception {
        criarReserva("RODRIGO", "BOULEVARD", "MIX", 35)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quantidade").value(35))
                .andExpect(jsonPath("$.quantidadeUtilizada").value(0))
                .andExpect(jsonPath("$.quantidadeLiberada").value(0));

        assertThat(quantidadeFisica("ESTOQUE_RODRIGO", "MIX"))
                .isEqualTo(100);
    }

    @Test
    void permiteMesmoProdutoEmDestinosDiferentes() throws Exception {
        criarReserva("RODRIGO", "BOULEVARD", "MIX", 30)
                .andExpect(status().isCreated());
        criarReserva("RODRIGO", "MERCADOS", "MIX", 20)
                .andExpect(status().isCreated());

        assertThat(reservaRepository.count()).isEqualTo(2);
    }

    @Test
    void calculaLivreDescontandoTodasAsReservasAtivas() throws Exception {
        criarReserva("RODRIGO", "BOULEVARD", "MIX", 60)
                .andExpect(status().isCreated());
        criarReserva("RODRIGO", "MERCADOS", "MIX", 40)
                .andExpect(status().isCreated());
        criarReserva("RODRIGO", "BOULEVARD", "MIX", 1)
                .andExpect(status().isBadRequest());

        assertThat(restanteAtivo("RODRIGO", "MIX")).isEqualTo(100);
        assertThat(quantidadeFisica("ESTOQUE_RODRIGO", "MIX"))
                .isEqualTo(100);
    }

    @Test
    void rejeitaReservaAcimaDoLivre() throws Exception {
        criarReserva("CESAR", "AEROPORTO", "STITCH", 61)
                .andExpect(status().isBadRequest());

        assertThat(reservaRepository.count()).isZero();
    }

    @Test
    void rejeitaDestinoInvalidoParaResponsavel() throws Exception {
        criarReserva("RODRIGO", "AEROPORTO", "MIX", 10)
                .andExpect(status().isBadRequest());

        assertThat(reservaRepository.count()).isZero();
    }

    @Test
    void rejeitaProdutoInvalidoParaDestino() throws Exception {
        criarReserva("RODRIGO", "MERCADOS", "PERSONAGENS", 10)
                .andExpect(status().isBadRequest());

        assertThat(reservaRepository.count()).isZero();
    }

    @Test
    void rejeitaInsumoDoCarrinho() throws Exception {
        criarReserva("RODRIGO", "BOULEVARD", "MILHO", 10)
                .andExpect(status().isBadRequest());

        assertThat(reservaRepository.count()).isZero();
    }

    @Test
    void cancelamentoLiberaSomenteRestanteEnaoAlteraFisico() throws Exception {
        UUID id = idDaReserva(
                criarReserva("RODRIGO", "BOULEVARD", "BIG", 25)
                        .andExpect(status().isCreated())
                        .andReturn()
        );

        cancelar(id, "RODRIGO")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantidade").value(25))
                .andExpect(jsonPath("$.quantidadeLiberada").value(25))
                .andExpect(jsonPath("$.quantidadeRestante").value(0))
                .andExpect(jsonPath("$.status").value("CANCELADA"));

        assertThat(quantidadeFisica("ESTOQUE_RODRIGO", "BIG"))
                .isEqualTo(50);
    }

    @Test
    void cancelamentoAposUsoParcialLiberaApenasORestante() throws Exception {
        UUID id = idDaReserva(
                criarReserva("RODRIGO", "BOULEVARD", "BIG", 40)
                        .andExpect(status().isCreated())
                        .andReturn()
        );

        transactionTemplate.executeWithoutResult(status -> {
            Reserva reserva = reservaRepository.findById(id).orElseThrow();
            reserva.registrarUtilizacao(15);
        });

        cancelar(id, "RODRIGO")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantidade").value(40))
                .andExpect(jsonPath("$.quantidadeUtilizada").value(15))
                .andExpect(jsonPath("$.quantidadeLiberada").value(25))
                .andExpect(jsonPath("$.quantidadeRestante").value(0));
    }

    @Test
    void registraHistoricoDeCriacaoECancelamento() throws Exception {
        UUID id = idDaReserva(
                criarReserva("CESAR", "AEROPORTO", "MIX", 10)
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.eventos.length()").value(1))
                        .andExpect(jsonPath("$.eventos[0].tipo")
                                .value("CRIACAO"))
                        .andReturn()
        );

        cancelar(id, "CESAR")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eventos.length()").value(2))
                .andExpect(jsonPath("$.eventos[1].tipo")
                        .value("CANCELAMENTO"))
                .andExpect(jsonPath("$.eventos[1].quantidade").value(10));

        Integer eventos = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM reserva_eventos WHERE reserva_id = ?",
                Integer.class,
                id
        );
        assertThat(eventos).isEqualTo(2);
    }

    @Test
    void operacaoInvalidaNaoAlteraEstado() throws Exception {
        UUID id = idDaReserva(
                criarReserva("RODRIGO", "BOULEVARD", "MIX", 30)
                        .andExpect(status().isCreated())
                        .andReturn()
        );
        long reservasAntes = reservaRepository.count();
        long restanteAntes = restanteAtivo("RODRIGO", "MIX");

        cancelar(id, "CESAR").andExpect(status().isBadRequest());

        assertThat(reservaRepository.count()).isEqualTo(reservasAntes);
        assertThat(restanteAtivo("RODRIGO", "MIX"))
                .isEqualTo(restanteAntes);
        assertThat(eventosDaReserva(id)).isEqualTo(1);
        assertThat(quantidadeFisica("ESTOQUE_RODRIGO", "MIX"))
                .isEqualTo(100);
    }

    private org.springframework.test.web.servlet.ResultActions criarReserva(
            String responsavelId,
            String destino,
            String produtoId,
            int quantidade
    ) throws Exception {
        String corpo = objectMapper.writeValueAsString(new CriacaoJson(
                responsavelId,
                destino,
                produtoId,
                quantidade
        ));
        return mockMvc.perform(post("/api/v1/reservas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(corpo));
    }

    private org.springframework.test.web.servlet.ResultActions cancelar(
            UUID id,
            String responsavelId
    ) throws Exception {
        String corpo = objectMapper.writeValueAsString(
                new CancelamentoJson(responsavelId)
        );
        return mockMvc.perform(post("/api/v1/reservas/{id}/cancelamento", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content(corpo));
    }

    private UUID idDaReserva(MvcResult resultado) throws Exception {
        JsonNode json = objectMapper.readTree(
                resultado.getResponse().getContentAsString()
        );
        return UUID.fromString(json.get("id").asText());
    }

    private int quantidadeFisica(String estoqueId, String produtoId) {
        return jdbcTemplate.queryForObject(
                """
                SELECT quantidade FROM estoque_itens
                WHERE estoque_id = ? AND produto_id = ?
                """,
                Integer.class,
                estoqueId,
                produtoId
        );
    }

    private long restanteAtivo(String responsavelId, String produtoId) {
        return reservaRepository.somarQuantidadeRestanteAtiva(
                responsavelId,
                produtoId
        );
    }

    private int eventosDaReserva(UUID id) {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM reserva_eventos WHERE reserva_id = ?",
                Integer.class,
                id
        );
    }

    private record CriacaoJson(
            String responsavelId,
            String destino,
            String produtoId,
            int quantidade
    ) {
    }

    private record CancelamentoJson(String responsavelId) {
    }
}
