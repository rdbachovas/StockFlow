package br.com.stockflow.idempotencia;

import br.com.stockflow.usuario.Usuario;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
@Table(name = "comandos_processados")
public class ComandoProcessado {

    @Id
    private UUID commandId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    private String tipoOperacao;

    private long revisao;

    private String respostaJson;

    private OffsetDateTime dataProcessamento;

    protected ComandoProcessado() {
    }

    public ComandoProcessado(
            UUID commandId,
            Usuario usuario,
            String tipoOperacao,
            long revisao,
            String respostaJson
    ) {
        this.commandId = commandId;
        this.usuario = usuario;
        this.tipoOperacao = tipoOperacao;
        this.revisao = revisao;
        this.respostaJson = respostaJson;
        this.dataProcessamento = OffsetDateTime.now(ZoneOffset.UTC);
    }

    public String getTipoOperacao() {
        return tipoOperacao;
    }

    public Usuario getUsuario() { return usuario; }

    public String getRespostaJson() {
        return respostaJson;
    }
}
