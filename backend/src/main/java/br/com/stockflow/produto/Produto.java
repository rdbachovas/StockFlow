package br.com.stockflow.produto;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "produtos")
public class Produto {

    @Id
    @Column(length = 50, nullable = false)
    private String id;

    @Column(length = 100, nullable = false)
    private String nome;

    @Column(length = 30, nullable = false)
    private String grupo;

    protected Produto() {
    }

    public String getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getGrupo() {
        return grupo;
    }
}
