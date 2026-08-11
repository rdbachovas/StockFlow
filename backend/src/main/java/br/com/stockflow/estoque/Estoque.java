package br.com.stockflow.estoque;

import java.util.LinkedHashSet;
import java.util.Set;

import br.com.stockflow.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "estoques")
public class Estoque {

    @Id
    @Column(length = 50, nullable = false)
    private String id;

    @Column(length = 100, nullable = false)
    private String nome;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsavel_id")
    private Usuario responsavel;

    @OneToMany(mappedBy = "estoque")
    private Set<EstoqueItem> itens = new LinkedHashSet<>();

    protected Estoque() {
    }

    public String getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public Usuario getResponsavel() {
        return responsavel;
    }

    public Set<EstoqueItem> getItens() {
        return Set.copyOf(itens);
    }
}
