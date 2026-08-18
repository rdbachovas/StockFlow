package br.com.stockflow.revisao;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "revisao_estado")
public class RevisaoEstado {

    @Id
    private Integer id;

    private long revisao;

    protected RevisaoEstado() {
    }

    public long getRevisao() {
        return revisao;
    }

    public long avancar() {
        revisao++;
        return revisao;
    }
}
