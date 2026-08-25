package br.com.stockflow.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.stockflow.retirada.RetiradaRequest;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import jakarta.validation.Valid;
import java.util.stream.IntStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class HardeningWebTest {

    private MockMvc mockMvc;
    private ListAppender<ILoggingEvent> logs;

    @BeforeEach
    void setup() {
        RequestCorrelationFilter correlation = new RequestCorrelationFilter();
        mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(
                        correlation,
                        new ApiSecurityHeadersFilter(),
                        new RequestBodyLimitFilter(10_000)
                )
                .build();
        Logger logger = (Logger) LoggerFactory.getLogger(
                RequestCorrelationFilter.class
        );
        logs = new ListAppender<>();
        logs.start();
        logger.addAppender(logs);
    }

    @Test
    void unexpectedErrorIsSafeAndCorrelated() throws Exception {
        String response = mockMvc.perform(get("/api/v1/test/unexpected")
                        .header(RequestCorrelationFilter.HEADER, "client-request-42")
                        .header("Authorization", "Bearer token-super-secreto"))
                .andExpect(status().isInternalServerError())
                .andExpect(header().string(
                        RequestCorrelationFilter.HEADER,
                        "client-request-42"
                ))
                .andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.requestId").value("client-request-42"))
                .andReturn().getResponse().getContentAsString();

        assertThat(response)
                .doesNotContain("stack trace")
                .doesNotContain("SELECT secret")
                .doesNotContain("token-super-secreto")
                .doesNotContain("/home/stockflow");
        assertThat(logs.list).anySatisfy(event -> {
            assertThat(event.getLevel()).isEqualTo(Level.ERROR);
            assertThat(event.getMDCPropertyMap().get("requestId"))
                    .isEqualTo("client-request-42");
            assertThat(event.getFormattedMessage())
                    .doesNotContain("token-super-secreto")
                    .doesNotContain("Authorization");
        });
    }

    @Test
    void invalidIncomingRequestIdIsReplaced() throws Exception {
        mockMvc.perform(get("/api/v1/test/normal")
                        .header(RequestCorrelationFilter.HEADER, "x".repeat(1000)))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        RequestCorrelationFilter.HEADER,
                        org.hamcrest.Matchers.matchesPattern(
                                "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
                        )
                ));
    }

    @Test
    void securityAndNoStoreHeadersArePresent() throws Exception {
        mockMvc.perform(get("/api/v1/test/normal"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string(
                        "Permissions-Policy",
                        "camera=(), microphone=(), geolocation=()"
                ))
                .andExpect(header().string("Cache-Control", "no-store"));
        mockMvc.perform(get("/api/v1/auth/test"))
                .andExpect(header().string("Cache-Control", "no-store"));
    }

    @Test
    void oversizedBodyIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/test/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("x".repeat(10_001)))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.code").value("REQUEST_TOO_LARGE"))
                .andExpect(jsonPath("$.requestId").isString());
    }

    @Test
    void tooManyItemsAreRejectedAndNormalRequestWorks() throws Exception {
        String items = IntStream.range(0, 51)
                .mapToObj(index -> "{\"produtoId\":\"MIX\",\"quantidade\":1}")
                .collect(java.util.stream.Collectors.joining(","));
        String excessive = request(items);
        mockMvc.perform(post("/api/v1/test/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(excessive))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        mockMvc.perform(post("/api/v1/test/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request(
                                "{\"produtoId\":\"MIX\",\"quantidade\":1}"
                        )))
                .andExpect(status().isOk());
    }

    private String request(String items) {
        return """
                {"commandId":"11111111-1111-1111-1111-111111111111","itens":[%s],"data":"2026-08-25T12:00:00Z","observacao":"normal"}
                """.formatted(items);
    }

    @RestController
    static class TestController {
        @GetMapping("/api/v1/test/unexpected")
        String unexpected() {
            throw new IllegalStateException(
                    "SELECT secret FROM tokens at /home/stockflow: stack trace"
            );
        }

        @GetMapping("/api/v1/test/normal")
        String normal() {
            return "ok";
        }

        @PostMapping("/api/v1/test/request")
        RetiradaRequest request(@Valid @RequestBody RetiradaRequest request) {
            return request;
        }
    }
}
