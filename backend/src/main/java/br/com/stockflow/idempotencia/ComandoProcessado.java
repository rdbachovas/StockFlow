package br.com.stockflow.idempotencia;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "comandos_processados")
public class ComandoProcessado {

    @Id
    private UUID commandId;

    private String tipoOperacao;

    private long revisao;

    private String respostaJson;

    private OffsetDateTime dataProcessamento;

    protected ComandoProcessado() {
    }

    public ComandoProcessado(
            UUID commandId,
            String tipoOperacao,
            long revisao,
            String respostaJson
    ) {
        this.commandId = commandId;
        this.tipoOperacao = tipoOperacao;
        this.revisao = revisao;
        this.respostaJson = respostaJson;
        this.dataProcessamento = OffsetDateTime.now(ZoneOffset.UTC);
    }

    public String getTipoOperacao() {
        return tipoOperacao;
    }

    public String getRespostaJson() {
        return respostaJson;
    }
}
