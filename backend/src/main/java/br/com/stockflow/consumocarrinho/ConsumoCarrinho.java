package br.com.stockflow.consumocarrinho;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import br.com.stockflow.estoque.Estoque;
import br.com.stockflow.usuario.Usuario;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "consumos_carrinho")
public class ConsumoCarrinho {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "responsavel_id", nullable = false)
    private Usuario responsavel;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estoque_origem_id", nullable = false)
    private Estoque estoqueOrigem;

    @Column(nullable = false)
    private OffsetDateTime data;

    @Column(length = 500)
    private String observacao;

    @OneToMany(mappedBy = "consumo", cascade = CascadeType.ALL)
    private List<ConsumoCarrinhoItem> itens = new ArrayList<>();

    protected ConsumoCarrinho() {
    }

    public ConsumoCarrinho(
            Usuario responsavel,
            Estoque estoqueOrigem,
            OffsetDateTime data,
            String observacao
    ) {
        this.id = UUID.randomUUID();
        this.responsavel = responsavel;
        this.estoqueOrigem = estoqueOrigem;
        this.data = data;
        this.observacao = observacao;
    }

    public void adicionarItem(ConsumoCarrinhoItem item) {
        itens.add(item);
    }

    public UUID getId() { return id; }
    public Usuario getResponsavel() { return responsavel; }
    public Estoque getEstoqueOrigem() { return estoqueOrigem; }
    public OffsetDateTime getData() { return data; }
    public String getObservacao() { return observacao; }
    public List<ConsumoCarrinhoItem> getItens() { return List.copyOf(itens); }
}
