package br.com.stockflow.usuario;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @Column(length = 50, nullable = false)
    private String id;

    @Column(length = 100, nullable = false)
    private String nome;

    protected Usuario() {
    }

    public String getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }
}
