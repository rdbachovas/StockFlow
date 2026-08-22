package br.com.stockflow.auth;

import br.com.stockflow.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "sessoes_refresh")
public class SessaoRefresh {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "token_hash", length = 64, nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "expira_em", nullable = false)
    private OffsetDateTime expiraEm;

    @Column(name = "revogado_em")
    private OffsetDateTime revogadoEm;

    @Column(name = "substituido_por")
    private UUID substituidoPor;

    protected SessaoRefresh() {
    }

    public SessaoRefresh(
            Usuario usuario,
            String tokenHash,
            OffsetDateTime criadoEm,
            OffsetDateTime expiraEm
    ) {
        this.id = UUID.randomUUID();
        this.usuario = usuario;
        this.tokenHash = tokenHash;
        this.criadoEm = criadoEm;
        this.expiraEm = expiraEm;
    }

    public UUID getId() { return id; }
    public Usuario getUsuario() { return usuario; }
    public OffsetDateTime getExpiraEm() { return expiraEm; }
    public OffsetDateTime getRevogadoEm() { return revogadoEm; }

    public void revogar(OffsetDateTime agora, UUID substituidoPor) {
        this.revogadoEm = agora;
        this.substituidoPor = substituidoPor;
    }
}
