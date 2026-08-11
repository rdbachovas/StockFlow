package br.com.stockflow.devolucao;

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
@Table(name = "devolucoes")
public class Devolucao {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "responsavel_id", nullable = false)
    private Usuario responsavel;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estoque_origem_id", nullable = false)
    private Estoque estoqueOrigem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estoque_destino_id", nullable = false)
    private Estoque estoqueDestino;

    @Column(nullable = false)
    private OffsetDateTime data;

    @Column(length = 500)
    private String observacao;

    @OneToMany(mappedBy = "devolucao", cascade = CascadeType.ALL)
    private List<DevolucaoItem> itens = new ArrayList<>();

    protected Devolucao() {
    }

    public Devolucao(
            Usuario responsavel,
            Estoque estoqueOrigem,
            Estoque estoqueDestino,
            OffsetDateTime data,
            String observacao
    ) {
        this.id = UUID.randomUUID();
        this.responsavel = responsavel;
        this.estoqueOrigem = estoqueOrigem;
        this.estoqueDestino = estoqueDestino;
        this.data = data;
        this.observacao = observacao;
    }

    public void adicionarItem(DevolucaoItem item) {
        itens.add(item);
    }

    public UUID getId() { return id; }
    public Usuario getResponsavel() { return responsavel; }
    public Estoque getEstoqueOrigem() { return estoqueOrigem; }
    public Estoque getEstoqueDestino() { return estoqueDestino; }
    public OffsetDateTime getData() { return data; }
    public String getObservacao() { return observacao; }
    public List<DevolucaoItem> getItens() { return List.copyOf(itens); }
}
