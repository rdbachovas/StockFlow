package br.com.stockflow.config;

import br.com.stockflow.auth.AuthProperties;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableConfigurationProperties(AuthProperties.class)
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/v1/auth/login",
                                "/api/v1/auth/refresh",
                                "/api/v1/health"
                        ).permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth.jwt(Customizer.withDefaults()))
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) ->
                                response.sendError(HttpStatus.UNAUTHORIZED.value()))
                        .accessDeniedHandler((request, response, exception) ->
                                response.sendError(HttpStatus.FORBIDDEN.value())))
                .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    JwtEncoder jwtEncoder(AuthProperties properties) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(chave(properties)));
    }

    @Bean
    JwtDecoder jwtDecoder(AuthProperties properties) {
        return NimbusJwtDecoder.withSecretKey(chave(properties))
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    private SecretKey chave(AuthProperties properties) {
        String segredo = properties.jwtSecret();
        if (segredo == null || segredo.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "AUTH_JWT_SECRET deve possuir pelo menos 32 bytes."
            );
        }
        return new SecretKeySpec(
                segredo.getBytes(StandardCharsets.UTF_8), "HmacSHA256"
        );
    }
}
