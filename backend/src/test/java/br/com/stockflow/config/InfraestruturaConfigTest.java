package br.com.stockflow.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ClassPathResource;

class InfraestruturaConfigTest {

    private static final List<String> OBRIGATORIAS = List.of(
            "DB_URL", "DB_USERNAME", "DB_PASSWORD", "AUTH_JWT_SECRET"
    );

    @Test
    void devPossuiConfiguracaoLocalConveniente() throws Exception {
        StandardEnvironment environment = new StandardEnvironment();
        YamlPropertySourceLoader loader = new YamlPropertySourceLoader();
        loader.load("dev", new ClassPathResource("application-dev.yml"))
                .forEach(environment.getPropertySources()::addLast);

        assertThat(environment.getProperty("spring.datasource.url"))
                .isEqualTo("jdbc:postgresql://localhost:5432/stockflow");
        assertThat(environment.getProperty("spring.datasource.username"))
                .isEqualTo("stockflow");
        assertThat(environment.getProperty("spring.datasource.password"))
                .isEqualTo("stockflow");
    }

    @Test
    void prodFalhaSemDbUrl() {
        validarAusencia("DB_URL");
    }

    @Test
    void prodFalhaSemDbUsername() {
        validarAusencia("DB_USERNAME");
    }

    @Test
    void prodFalhaSemDbPassword() {
        validarAusencia("DB_PASSWORD");
    }

    @Test
    void prodFalhaSemJwtSecret() {
        validarAusencia("AUTH_JWT_SECRET");
    }

    @Test
    void prodRejeitaWildcardNoCors() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        CorsProperties properties = new CorsProperties(List.of("*"), true);

        assertThatThrownBy(() -> new CorsConfig().corsConfigurationSource(
                properties, environment
        )).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("wildcard");
    }

    @Test
    void readinessFalhaQuandoBancoEstaIndisponivel() throws Exception {
        DataSource dataSource = mock(DataSource.class);
        when(dataSource.getConnection()).thenThrow(
                new SQLException("indisponível")
        );
        StockFlowReadinessIndicator indicator =
                new StockFlowReadinessIndicator(dataSource, mock(Flyway.class));
        indicator.aplicacaoPronta();

        assertThat(indicator.health().getStatus().getCode()).isEqualTo("DOWN");
    }

    @Test
    void readinessFalhaQuandoConexaoNaoEValida() throws Exception {
        DataSource dataSource = mock(DataSource.class);
        Connection connection = mock(Connection.class);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.isValid(2)).thenReturn(false);
        StockFlowReadinessIndicator indicator =
                new StockFlowReadinessIndicator(dataSource, mock(Flyway.class));
        indicator.aplicacaoPronta();

        assertThat(indicator.health().getStatus().getCode()).isEqualTo("DOWN");
    }

    private void validarAusencia(String ausente) {
        MockEnvironment environment = new MockEnvironment();
        OBRIGATORIAS.stream()
                .filter(nome -> !nome.equals(ausente))
                .forEach(nome -> environment.setProperty(nome, "valor-seguro"));

        assertThatThrownBy(() -> new ConfiguracaoProducaoValidator(environment)
                .afterPropertiesSet())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(ausente);
    }
}
