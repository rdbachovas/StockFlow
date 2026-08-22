package br.com.stockflow.auth;

import br.com.stockflow.usuario.Usuario;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

    private final JwtEncoder jwtEncoder;
    private final AuthProperties properties;
    private final SecureRandom secureRandom = new SecureRandom();

    public TokenService(JwtEncoder jwtEncoder, AuthProperties properties) {
        this.jwtEncoder = jwtEncoder;
        this.properties = properties;
    }

    public String criarAccessToken(Usuario usuario) {
        Instant agora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(usuario.getId())
                .issuedAt(agora)
                .expiresAt(agora.plusSeconds(properties.accessTokenSeconds()))
                .id(UUID.randomUUID().toString())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims))
                .getTokenValue();
    }

    public TokenOpaco criarRefreshToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String valor = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        return new TokenOpaco(valor, hash(valor));
    }

    public String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException erro) {
            throw new IllegalStateException("SHA-256 indisponível.", erro);
        }
    }

    public OffsetDateTime expiracaoRefresh() {
        return OffsetDateTime.now(ZoneOffset.UTC)
                .plusSeconds(properties.refreshTokenSeconds());
    }

    public record TokenOpaco(String valor, String hash) {
    }
}
