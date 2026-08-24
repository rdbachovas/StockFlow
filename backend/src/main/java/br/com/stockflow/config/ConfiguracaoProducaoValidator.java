package br.com.stockflow.config;

import java.util.List;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class ConfiguracaoProducaoValidator implements InitializingBean {

    private static final List<String> OBRIGATORIAS = List.of(
            "DB_URL",
            "DB_USERNAME",
            "DB_PASSWORD",
            "AUTH_JWT_SECRET"
    );

    private final Environment environment;

    public ConfiguracaoProducaoValidator(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void afterPropertiesSet() {
        for (String nome : OBRIGATORIAS) {
            String valor = environment.getProperty(nome);
            if (valor == null || valor.isBlank()) {
                throw new IllegalStateException(
                        nome + " é obrigatória no profile prod."
                );
            }
        }
        if (!environment.getProperty("stockflow.auth.cookie.secure", Boolean.class, false)) {
            throw new IllegalStateException(
                    "AUTH_COOKIE_SECURE deve ser true no profile prod."
            );
        }
        String sameSite = environment.getProperty(
                "stockflow.auth.cookie.same-site", "None"
        );
        if ("None".equalsIgnoreCase(sameSite)
                && !environment.getProperty(
                        "stockflow.auth.cookie.secure", Boolean.class, false
                )) {
            throw new IllegalStateException("SameSite=None exige cookie Secure.");
        }
    }
}
